from __future__ import annotations

import datetime as dt

from app.extensions import db


class MetaModelDefinition(db.Model):
    __tablename__ = "meta_model_definition"

    id = db.Column(db.Integer, primary_key=True)
    model_type = db.Column(db.String(32), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    version = db.Column(db.String(64), nullable=False)
    content_json = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(32), nullable=False, default="draft")
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint("model_type", "name", "version", name="uq_model_type_name_version"),
    )


class MetaModelRelease(db.Model):
    __tablename__ = "meta_model_release"

    id = db.Column(db.Integer, primary_key=True)
    release_no = db.Column(db.String(128), unique=True, nullable=False, index=True)
    status = db.Column(db.String(32), nullable=False, default="completed")
    released_by = db.Column(db.String(128), nullable=True)
    released_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
    snapshot_checksum = db.Column(db.String(128), nullable=True)


class MetaModelReleaseItem(db.Model):
    __tablename__ = "meta_model_release_item"

    id = db.Column(db.Integer, primary_key=True)
    release_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_release.id"), nullable=False, index=True
    )
    model_definition_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False
    )
    checksum = db.Column(db.String(128), nullable=False)


class MetaModelChangeLog(db.Model):
    __tablename__ = "meta_model_change_log"

    id = db.Column(db.Integer, primary_key=True)
    model_definition_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=True, index=True
    )
    change_type = db.Column(db.String(64), nullable=False)
    diff_json = db.Column(db.Text, nullable=True)
    operator = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
