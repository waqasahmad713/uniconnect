import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.media.models import StoredFile

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("/{file_id}")
def read_file(file_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Response:
    stored = db.get(StoredFile, file_id)
    if stored is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found.")
    return Response(
        content=stored.data,
        media_type=stored.content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
