import json
import os
import smtplib
from contextlib import contextmanager
from datetime import datetime
from email.message import EmailMessage
from html import escape
from typing import Any

from flask import Flask, jsonify, request
from psycopg import connect
from psycopg import sql


app = Flask(__name__)


SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
NOTIFY_TO = os.getenv("NOTIFY_TO", "bersenev4dev@gmail.com")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
PG_DATABASE_URL = os.getenv("PG_DATABASE_URL", "")
CRM_WORKSPACE_SCHEMA = os.getenv("CRM_WORKSPACE_SCHEMA", "").strip()
SYNC_SECRET = os.getenv("CRM_SYNC_SECRET", WEBHOOK_SECRET)
_cached_workspace_schema: str | None = CRM_WORKSPACE_SCHEMA or None


def _extract_name(record: dict[str, Any]) -> str:
    name_obj = record.get("name")
    if isinstance(name_obj, dict):
        first_name = str(name_obj.get("firstName", "")).strip()
        last_name = str(name_obj.get("lastName", "")).strip()
        full_name = f"{first_name} {last_name}".strip()
        if full_name:
            return full_name

    fallback_name = str(record.get("name", "")).strip()
    if fallback_name:
        return fallback_name

    first_name = str(record.get("firstName", "")).strip()
    last_name = str(record.get("lastName", "")).strip()
    full_name = f"{first_name} {last_name}".strip()
    return full_name or "Unknown contact"


def _extract_email(record: dict[str, Any]) -> str:
    emails_obj = record.get("emails")
    if isinstance(emails_obj, dict):
        primary = str(emails_obj.get("primaryEmail", "")).strip()
        if primary:
            return primary

    direct_email = str(record.get("email", "")).strip()
    if direct_email:
        return direct_email

    return "not provided"


def _pick_contact(payload: dict[str, Any]) -> tuple[str, str, str, str]:
    event_name = str(payload.get("eventName", "unknown.event"))
    event_date = str(payload.get("eventDate", ""))
    record = payload.get("record") if isinstance(payload.get("record"), dict) else {}

    contact_name = _extract_name(record)
    contact_email = _extract_email(record)

    return contact_name, contact_email, event_name, event_date


def _format_event_date(event_date_raw: str) -> str:
    if not event_date_raw:
        return "-"
    try:
        normalized = event_date_raw.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        return parsed.strftime("%Y-%m-%d %H:%M:%S %Z").strip()
    except ValueError:
        return event_date_raw


def _send_notification(subject: str, plain_text: str, html_body: str) -> None:
    if not SMTP_HOST:
        raise RuntimeError("SMTP_HOST is not configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = NOTIFY_TO
    message.set_content(plain_text)
    message.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
        if USE_TLS:
            smtp.starttls()
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)


@contextmanager
def _db_connection():
    if not PG_DATABASE_URL:
        raise RuntimeError("PG_DATABASE_URL is not configured")
    with connect(PG_DATABASE_URL) as conn:
        yield conn


def _parse_name(full_name: str) -> tuple[str | None, str | None]:
    normalized = full_name.strip()
    if not normalized:
        return None, None
    parts = normalized.split()
    first_name = parts[0]
    last_name = " ".join(parts[1:]).strip() or None
    return first_name, last_name


def _resolve_workspace_schema(conn) -> str:
    global _cached_workspace_schema
    if _cached_workspace_schema:
        return _cached_workspace_schema

    with conn.cursor() as cur:
        cur.execute(
            """
            select schemaname
            from pg_tables
            where tablename = 'person'
              and schemaname like 'workspace_%'
            order by schemaname
            limit 1
            """
        )
        row = cur.fetchone()

    if not row:
        raise RuntimeError("Could not find workspace schema with person table")

    _cached_workspace_schema = str(row[0])
    return _cached_workspace_schema


def _create_person_in_crm(email: str, full_name: str) -> bool:
    normalized_email = email.strip().lower()
    if not normalized_email:
        raise ValueError("email is required")

    first_name, last_name = _parse_name(full_name)

    with _db_connection() as conn:
        schema_name = _resolve_workspace_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                    insert into {}.person ("nameFirstName", "nameLastName", "emailsPrimaryEmail")
                    values (%s, %s, %s)
                    on conflict ("emailsPrimaryEmail") do nothing
                    """
                ).format(sql.Identifier(schema_name)),
                (first_name, last_name, normalized_email),
            )
            inserted = cur.rowcount > 0
        conn.commit()

    return inserted


def _is_authorized(req) -> bool:
    if not SYNC_SECRET:
        return True
    return req.headers.get("x-webhook-secret", "") == SYNC_SECRET


@app.get("/healthz")
def healthz() -> tuple[str, int]:
    return "ok", 200


@app.post("/webhooks/new-contact")
def new_contact_webhook() -> tuple[Any, int]:

    payload = request.get_json(silent=True) or {}
    contact_name, contact_email, event_name, event_date = _pick_contact(payload)

    pretty_payload = json.dumps(payload, ensure_ascii=True, indent=2)
    event_date_pretty = _format_event_date(event_date)
    subject = f"[Twenty CRM] New contact: {contact_name}"
    plain_text = (
        f"A new contact was created in CRM.\n\n"
        f"Event: {event_name}\n"
        f"When: {event_date_pretty}\n"
        f"Name: {contact_name}\n"
        f"Email: {contact_email}\n\n"
        f"Raw payload:\n{pretty_payload}\n"
    )
    html_body = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(90deg,#111827 0%,#1f2937 100%);color:#ffffff;">
                <div style="font-size:13px;opacity:.85;letter-spacing:.08em;text-transform:uppercase;">Twenty CRM</div>
                <div style="margin-top:6px;font-size:22px;font-weight:700;line-height:1.3;">New Contact Notification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:16px;line-height:1.5;">
                  A contact event has been received from your CRM.
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;width:180px;">Event</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">{escape(event_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;">Date</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">{escape(event_date_pretty)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;">Name</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:18px;font-weight:700;">{escape(contact_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#6b7280;">Email</td>
                    <td style="padding:10px 0;">{escape(contact_email)}</td>
                  </tr>
                </table>

                <div style="margin-top:22px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                  <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">Raw payload</div>
                  <pre style="margin:8px 0 0 0;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.45;color:#111827;">{escape(pretty_payload)}</pre>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""".strip()

    _send_notification(subject, plain_text, html_body)
    return jsonify({"status": "sent"}), 200


@app.post("/api/persons")
def create_person() -> tuple[Any, int]:
    if not _is_authorized(request):
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip()
    full_name = str(payload.get("fullName", "")).strip()

    if not email:
        return jsonify({"error": "email is required"}), 400

    try:
        created = _create_person_in_crm(email=email, full_name=full_name)
    except Exception as exc:
        app.logger.exception("Failed to create person in CRM")
        return jsonify({"error": str(exc)}), 500

    return jsonify({"status": "created" if created else "exists"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
