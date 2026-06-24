"""Application users for JWT login and RBAC."""

from __future__ import annotations

import datetime as dt

from app.extensions import db


class User(db.Model):
    __tablename__ = "app_user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="viewer")
    # JSON list of entity type names; empty/null = all types allowed for domain:write roles
    allowed_entity_types_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
