import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerificationError, VerifyMismatchError

from app.core.config import settings

# Low-memory hasher kept only to verify older Argon2 hashes.
password_hasher = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)
ALGORITHM = settings.jwt_algorithm
ACCESS_COOKIE_NAME = "uniconnect_token"
PBKDF2_SCHEME = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 260_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{PBKDF2_SCHEME}${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def password_needs_rehash(password_hash: str) -> bool:
    return not password_hash.startswith(f"{PBKDF2_SCHEME}$")


def _verify_pbkdf2(password: str, password_hash: str) -> bool:
    try:
        scheme, iter_s, salt_hex, digest_hex = password_hash.split("$", 3)
        if scheme != PBKDF2_SCHEME:
            return False
        iterations = int(iter_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, TypeError):
        return False
    actual = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )
    return hmac.compare_digest(actual, expected)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    if password_hash.startswith(f"{PBKDF2_SCHEME}$"):
        return _verify_pbkdf2(password, password_hash)
    try:
        return bool(password_hasher.verify(password_hash, password))
    except (VerifyMismatchError, VerificationError, InvalidHash, ValueError, MemoryError):
        return False


def create_access_token(*, user_id: str, token_version: int) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "ver": token_version,
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])


def generate_url_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
