import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


def upload_root() -> Path:
    if settings.is_production:
        return Path("/tmp/uniconnect-uploads")
    return Path(__file__).resolve().parents[2] / "uploads"


UPLOAD_ROOT = upload_root()
AVATAR_DIR = UPLOAD_ROOT / "avatars"
MAX_AVATAR_BYTES = 2 * 1024 * 1024

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _extension_from_bytes(header: bytes) -> str | None:
    if header.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return ".webp"
    return None


async def save_avatar(user_id: str, upload: UploadFile) -> str:
    content_type = (upload.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Profile photos must be JPEG, PNG, or WebP.",
        )

    data = await upload.read()
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Photo must be 2 MB or smaller.")
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The uploaded file is empty.")

    sniffed = _extension_from_bytes(data[:16])
    expected = ALLOWED_TYPES[content_type]
    if sniffed != expected:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "The file contents do not match the image type.",
        )

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    for old in AVATAR_DIR.glob(f"{user_id}*"):
        old.unlink(missing_ok=True)

    filename = f"{user_id}-{secrets.token_hex(4)}{expected}"
    (AVATAR_DIR / filename).write_bytes(data)
    return f"{settings.backend_url}/uploads/avatars/{filename}"
