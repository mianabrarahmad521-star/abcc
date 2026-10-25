"""
Authentication and session management utilities for Abrar Ahmad's Portfolio.
"""

import secrets
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify
from backend.database import get_db_connection, verify_password, hash_password

SESSION_DURATION_HOURS = 48

def create_session(user_id: int) -> str:
    """Generates a secure random session token and stores it in the database."""
    token = secrets.token_urlsafe(32)
    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(hours=SESSION_DURATION_HOURS)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (token, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    """, (token, user_id, created_at.isoformat(), expires_at.isoformat()))
    conn.commit()
    conn.close()
    return token

def validate_token(token: str):
    """Validates session token. Returns user dict if valid, None otherwise."""
    if not token:
        return None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.token, s.user_id, s.expires_at, u.username
        FROM sessions s
        JOIN admin_users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    # Check expiration
    expires_at_str = row["expires_at"]
    try:
        expires_at = datetime.fromisoformat(expires_at_str)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            # Token expired
            delete_session(token)
            return None
    except Exception:
        return None

    return {"id": row["user_id"], "username": row["username"]}

def delete_session(token: str):
    """Deletes a session token from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

def get_token_from_request():
    """Extracts token from Authorization header or cookie or query param."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    # Check custom header
    token_header = request.headers.get("X-Admin-Token", "")
    if token_header:
        return token_header.strip()
    # Check cookies
    cookie_token = request.cookies.get("admin_token")
    if cookie_token:
        return cookie_token.strip()
    return None

def require_admin(f):
    """Decorator to protect admin routes. Rejects unauthorized visitors with 401."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()
        user = validate_token(token)
        if not user:
            return jsonify({
                "success": False,
                "error": "Unauthorized: Admin authentication required to access this resource."
            }), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function
