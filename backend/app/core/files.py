import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.media.models import StoredFile

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


async def save_avatar(db: Session, user_id: str, upload: UploadFile) -> str:
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

    owner = uuid.UUID(user_id)
    old_files = db.scalars(
        select(StoredFile).where(StoredFile.owner_id == owner, StoredFile.kind == "avatar")
    ).all()
    for old in old_files:
        db.delete(old)

    stored = StoredFile(
        owner_id=owner,
        kind="avatar",
        content_type=content_type,
        data=data,
    )
    db.add(stored)
    db.flush()
    return f"/api/files/{stored.id}"
