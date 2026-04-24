import json
import os
import smtplib
from email.message import EmailMessage
from typing import Any

from flask import Flask, jsonify, request


app = Flask(__name__)


SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
NOTIFY_TO = os.getenv("NOTIFY_TO", "bersenev4dev@gmail.com")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


def _pick_contact(payload: dict[str, Any]) -> tuple[str, str]:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload

    full_name = (
        data.get("name")
        or data.get("fullName")
        or f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
        or "Unknown contact"
    )
    email = data.get("email") or data.get("primaryEmail") or "not provided"
    return full_name, email


def _send_notification(subject: str, body: str) -> None:
    if not SMTP_HOST:
        raise RuntimeError("SMTP_HOST is not configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = NOTIFY_TO
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
        if USE_TLS:
            smtp.starttls()
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)


@app.get("/healthz")
def healthz() -> tuple[str, int]:
    return "ok", 200


@app.post("/webhooks/new-contact")
def new_contact_webhook() -> tuple[Any, int]:
    if WEBHOOK_SECRET:
        header_secret = request.headers.get("x-webhook-secret", "")
        if header_secret != WEBHOOK_SECRET:
            return jsonify({"error": "unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    contact_name, contact_email = _pick_contact(payload)

    pretty_payload = json.dumps(payload, ensure_ascii=True, indent=2)
    subject = f"[Twenty CRM] New contact: {contact_name}"
    body = (
        f"A new contact was created in CRM.\n\n"
        f"Name: {contact_name}\n"
        f"Email: {contact_email}\n\n"
        f"Raw payload:\n{pretty_payload}\n"
    )

    _send_notification(subject, body)
    return jsonify({"status": "sent"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
