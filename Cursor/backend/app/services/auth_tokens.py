"""JWT access tokens (HS256)."""

from __future__ import annotations

import datetime as dt
from typing import Any

import jwt
from flask import current_app


def issue_access_token(*, user_id: int, username: str, role: str) -> str:
    secret = current_app.config["JWT_SECRET_KEY"]
    exp_h = int(current_app.config.get("JWT_EXPIRES_HOURS", 24))
    now = dt.datetime.utcnow()
    payload: dict[str, Any] = {
        "sub": username,
        "uid": user_id,
        "role": role,
        "iat": now,
        "exp": now + dt.timedelta(hours=exp_h),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any] | None:
    secret = current_app.config["JWT_SECRET_KEY"]
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
