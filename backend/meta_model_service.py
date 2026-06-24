import hashlib
import json
from dataclasses import dataclass
from threading import RLock
from typing import Any

from .extensions import db
from .models import (
    MetaModelChangeLog,
    MetaModelDefinition,
    MetaModelRelease,
    MetaModelReleaseItem,
)


ALLOWED_MODEL_TYPES = {"data", "behavior", "rule", "event", "process", "structural", "behavioral", "rules", "events", "interfaces", "epc"}


@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[dict[str, str]]
    warnings: list[str]


class MetaModelValidator:
    def validate_structure(self, model_type: str, content: Any) -> ValidationResult:
        errors: list[dict[str, str]] = []
        warnings: list[str] = []
        if model_type not in ALLOWED_MODEL_TYPES:
            errors.append({"code": "M4001", "message": "unsupported model_type"})
        if not isinstance(content, dict):
            errors.append({"code": "M4001", "message": "content must be a JSON object"})
            return ValidationResult(False, errors, warnings)

        required_by_type = {
            "data": "entities",
            "behavior": "state_machines",
            "rule": "rules",
            "process": "orchestrations",
            "event": "event_types",
        }
        req_field = required_by_type.get(model_type)
        if req_field and req_field not in content:
            errors.append({"code": "M4001", "message": f"missing required field: {req_field}"})

        return ValidationResult(len(errors) == 0, errors, warnings)

    def validate_cross_model(self, model_defs: list[MetaModelDefinition]) -> ValidationResult:
        errors: list[dict[str, str]] = []
        warnings: list[str] = []

        data_fields: dict[str, set[str]] = {}
        for m in model_defs:
            if m.model_type != "data":
                continue
            for entity in m.content_json.get("entities", []):
                entity_id = entity.get("id")
                if not entity_id:
                    continue
                fields = {a.get("id") for a in entity.get("attributes", []) if a.get("id")}
                data_fields[entity_id] = fields

        for m in model_defs:
            if m.model_type == "rule":
                for rule in m.content_json.get("rules", []):
                    entity = rule.get("entity")
                    field = rule.get("field")
                    if entity and entity not in data_fields:
                        errors.append({"code": "M4002", "message": f"rule entity '{entity}' not found"})
                    if entity and field and entity in data_fields and field not in data_fields[entity]:
                        errors.append({"code": "M4002", "message": f"rule field '{entity}.{field}' not found"})

            if m.model_type == "behavior":
                for sm in m.content_json.get("state_machines", []):
                    entity = sm.get("entity")
                    status_field = sm.get("status_field")
                    if entity and entity not in data_fields:
                        errors.append({"code": "M4002", "message": f"state machine entity '{entity}' not found"})
                    elif entity and status_field and status_field not in data_fields[entity]:
                        errors.append(
                            {"code": "M4002", "message": f"status field '{entity}.{status_field}' not found"}
                        )

            if m.model_type == "event":
                for sub in m.content_json.get("subscriptions", []):
                    target_ref = sub.get("target_ref")
                    if not target_ref:
                        errors.append({"code": "M4002", "message": "subscription target_ref is required"})

        return ValidationResult(len(errors) == 0, errors, warnings)


class SnapshotProvider:
    def __init__(self):
        self._lock = RLock()
        self._cache: dict[str, Any] | None = None

    def invalidate(self):
        with self._lock:
            self._cache = None

    def get_current(self) -> dict[str, Any]:
        with self._lock:
            if self._cache is not None:
                return self._cache

            release = MetaModelRelease.query.order_by(MetaModelRelease.released_at.desc(), MetaModelRelease.id.desc()).first()
            if not release:
                self._cache = {"release_no": None, "models": [], "checksum": None}
                return self._cache

            items = MetaModelReleaseItem.query.filter_by(release_id=release.id).all()
            model_ids = [i.model_definition_id for i in items]
            models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(model_ids)).all() if model_ids else []

            payload = [
                {
                    "id": m.id,
                    "model_type": m.model_type,
                    "name": m.name,
                    "version": m.version,
                    "content": m.content_json,
                }
                for m in models
            ]
            checksum = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
            self._cache = {"release_no": release.release_no, "models": payload, "checksum": checksum}
            return self._cache

    def get_by_release_id(self, release_id: int) -> dict[str, Any]:
        items = MetaModelReleaseItem.query.filter_by(release_id=release_id).all()
        model_ids = [i.model_definition_id for i in items]
        models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(model_ids)).all() if model_ids else []
        payload = [
            {
                "id": m.id,
                "model_type": m.model_type,
                "name": m.name,
                "version": m.version,
                "content": m.content_json,
            }
            for m in models
        ]
        return {"models": payload}


class PublishService:
    def __init__(self, validator: MetaModelValidator, snapshots: SnapshotProvider):
        self.validator = validator
        self.snapshots = snapshots

    def _checksum(self, model: MetaModelDefinition) -> str:
        blob = f"{model.id}:{model.model_type}:{model.name}:{model.version}:{json.dumps(model.content_json, sort_keys=True)}"
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()

    def publish(self, release_no: str, model_ids: list[int], operator: str) -> MetaModelRelease:
        models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(model_ids)).all()
        if len(models) != len(model_ids):
            raise ValueError("M4002: model_ids contain unknown model")

        # Include current published models for cross-model checks so partial releases stay valid.
        current = self.snapshots.get_current()
        current_ids = [m["id"] for m in current.get("models", [])]
        existing_models = (
            MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(current_ids)).all() if current_ids else []
        )

        check = self.validator.validate_cross_model(_merge_model_defs(existing_models, models))
        if not check.is_valid:
            raise ValueError(check.errors[0]["code"] + ": " + check.errors[0]["message"])

        release = MetaModelRelease(release_no=release_no, status="published", released_by=operator)
        db.session.add(release)
        db.session.flush()

        for m in models:
            m.status = "published"
            db.session.add(MetaModelReleaseItem(release_id=release.id, model_definition_id=m.id, checksum=self._checksum(m)))
            db.session.add(
                MetaModelChangeLog(
                    model_definition_id=m.id,
                    change_type="PUBLISH",
                    diff_json={"release_no": release_no},
                    operator=operator,
                )
            )

        db.session.commit()
        self.snapshots.invalidate()
        return release

    def rollback(self, target_release_no: str, operator: str) -> MetaModelRelease:
        target = MetaModelRelease.query.filter_by(release_no=target_release_no).first()
        if not target:
            raise ValueError("M4002: target release not found")

        items = MetaModelReleaseItem.query.filter_by(release_id=target.id).all()
        new_release = MetaModelRelease(
            release_no=f"rollback-{target_release_no}",
            status="published",
            released_by=operator,
        )
        db.session.add(new_release)
        db.session.flush()

        for item in items:
            db.session.add(
                MetaModelReleaseItem(
                    release_id=new_release.id,
                    model_definition_id=item.model_definition_id,
                    checksum=item.checksum,
                )
            )

        db.session.commit()
        self.snapshots.invalidate()
        return new_release


def _merge_model_defs(left: list[MetaModelDefinition], right: list[MetaModelDefinition]) -> list[MetaModelDefinition]:
    by_id = {m.id: m for m in left}
    for m in right:
        by_id[m.id] = m
    return list(by_id.values())
