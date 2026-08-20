from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_connected():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_register_login_and_duplicate_email():
    email = "phase3.tester@example.com"
    password = "correct-horse-battery"
    payload = {
        "full_name": "Phase Tester",
        "email": email,
        "password": password,
        "confirm_password": password,
        "university": "Abdul Wali Khan University Mardan",
        "department": "Artificial Intelligence",
        "role": "student",
        "batch": "2025",
    }

    first = client.post("/api/auth/register", json=payload)
    assert first.status_code in (200, 201)
    assert first.json().get("verification_url")

    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 200
    assert "not verified" in duplicate.json()["message"].lower()

    login_unverified = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert login_unverified.status_code == 403
    verify_url = login_unverified.json()["detail"]["verification_url"]
    token = verify_url.split("token=")[1]
    verified = client.post("/api/auth/verify-email", json={"token": token})
    assert verified.status_code == 200

    login_ok = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert login_ok.status_code == 200


def test_invalid_login():
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_forgot_password_does_not_reveal_account():
    response = client.post(
        "/api/auth/forgot-password", json={"email": "missing@example.com"}
    )
    assert response.status_code == 200
    assert "reset link" in response.json()["message"].lower()
