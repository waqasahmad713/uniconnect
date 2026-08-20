import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("uniconnect.email")


def send_email(to_email: str, subject: str, body: str) -> None:
    if not settings.smtp_host or not settings.smtp_user:
        logger.warning("SMTP is not configured. Email to %s\n%s\n%s", to_email, subject, body)
        print(f"\n[DEV EMAIL] to={to_email}\nSubject: {subject}\n{body}\n")
        return

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.starttls()
        smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)
