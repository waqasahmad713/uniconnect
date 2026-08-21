from fastapi.testclient import TestClient

from app.database.session import SessionLocal
from app.main import app
from app.users.models import User
from sqlalchemy import select

client = TestClient(app)


def _register_and_login(email: str, password: str = "correct-horse-battery") -> None:
    payload = {
        "full_name": "Role Tester",
        "email": email,
        "password": password,
        "confirm_password": password,
        "university": "Example University",
        "department": "Artificial Intelligence",
        "role": "student",
        "batch": "2025",
    }
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code in (200, 201)
    verify_url = first.json().get("verification_url")
    if not verify_url:
        login = client.post("/api/auth/login", json={"email": email, "password": password})
        if login.status_code == 403:
            verify_url = login.json()["detail"]["verification_url"]
    if verify_url:
        token = verify_url.split("token=")[1]
        client.post("/api/auth/verify-email", json={"token": token})
    login_ok = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login_ok.status_code == 200


def test_member_can_only_post_questions():
    _register_and_login("member.roles@example.com")
    blocked = client.post(
        "/api/posts",
        json={
            "title": "An idea for campus",
            "content": "This should be blocked for regular members.",
            "post_type": "idea",
            "tags": [],
        },
    )
    assert blocked.status_code == 403

    allowed = client.post(
        "/api/posts",
        json={
            "title": "How do I start FastAPI?",
            "content": "I need help understanding how routing works in FastAPI.",
            "post_type": "question",
            "tags": ["fastapi"],
        },
    )
    assert allowed.status_code == 201


def test_admin_can_publish_feed_posts():
    email = "admin.roles@example.com"
    _register_and_login(email)
    db = SessionLocal()
    user = db.scalar(select(User).where(User.email == email))
    assert user is not None
    user.is_admin = True
    db.commit()
    db.close()
    client.post("/api/auth/login", json={"email": email, "password": "correct-horse-battery"})

    created = client.post(
        "/api/posts",
        json={
            "title": "Campus resource of the week",
            "content": "Here is a useful reading list for first-year students.",
            "post_type": "resource",
            "tags": ["reading"],
        },
    )
    assert created.status_code == 201

    stats = client.get("/api/admin/stats")
    assert stats.status_code == 200
    assert "users" in stats.json()
