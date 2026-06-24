"""Runtime tables: indexes (rebuilt from snapshot), entity state, events, audit."""

from __future__ import annotations

import datetime as dt

from app.extensions import db


class RuleRuntimeIndex(db.Model):
    """Denormalized rule row for fast eval; rebuilt from meta snapshot (B-005)."""

    __tablename__ = "rule_runtime_index"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.String(128), nullable=False, index=True)
    model_def_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False, index=True
    )
    entity_type = db.Column(db.String(128), nullable=False, index=True)
    kind = db.Column(db.String(32), nullable=False)  # field_level | cross_field | ...
    is_active = db.Column(db.Boolean, default=True)
    checksum = db.Column(db.String(128))
    rule_json = db.Column(db.Text, nullable=False)


class StateMachineRuntimeIndex(db.Model):
    __tablename__ = "state_machine_runtime_index"

    id = db.Column(db.Integer, primary_key=True)
    sm_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    model_def_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False
    )
    entity_type = db.Column(db.String(128), nullable=False, index=True)
    checksum = db.Column(db.String(128))
    sm_json = db.Column(db.Text, nullable=False)


class DomainEntityState(db.Model):
    __tablename__ = "domain_entity_state"

    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(128), nullable=False, index=True)
    entity_id = db.Column(db.String(128), nullable=False, index=True)
    current_state = db.Column(db.String(128), nullable=False)
    data_json = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("entity_type", "entity_id", name="uq_domain_entity"),
    )


class EventTypeRegistry(db.Model):
    __tablename__ = "event_type_registry"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(128), nullable=False, index=True)
    model_def_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False
    )
    payload_schema_json = db.Column(db.Text, nullable=True)
    version = db.Column(db.String(64), nullable=True)


class EventSubscriptionRegistry(db.Model):
    __tablename__ = "event_subscription_registry"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(128), nullable=False, index=True)
    target_type = db.Column(db.String(32), nullable=False)  # skill
    target_ref = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    model_def_id = db.Column(
        db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=True
    )


class EventDispatchLog(db.Model):
    __tablename__ = "event_dispatch_log"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(128), nullable=True, index=True)
    event_type = db.Column(db.String(128), nullable=False, index=True)
    target_ref = db.Column(db.String(255), nullable=False)
    result = db.Column(db.String(32), nullable=False)
    error_code = db.Column(db.String(16), nullable=True)
    details_json = db.Column(db.Text, nullable=True)
    trace_id = db.Column(db.String(64), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)


class RuleExecutionLog(db.Model):
    __tablename__ = "rule_execution_log"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.String(128), nullable=True)
    entity_type = db.Column(db.String(128), nullable=True)
    entity_id = db.Column(db.String(128), nullable=True)
    result = db.Column(db.String(32), nullable=False)
    details_json = db.Column(db.Text, nullable=True)
    trace_id = db.Column(db.String(64), nullable=True, index=True)
    executed_at = db.Column(db.DateTime, default=dt.datetime.utcnow)


class StateTransitionLog(db.Model):
    __tablename__ = "state_transition_log"

    id = db.Column(db.Integer, primary_key=True)
    entity_id = db.Column(db.String(128), nullable=False, index=True)
    from_state = db.Column(db.String(128), nullable=True)
    to_state = db.Column(db.String(128), nullable=False)
    transition_id = db.Column(db.String(128), nullable=True)
    operator = db.Column(db.String(128), nullable=True)
    trace_id = db.Column(db.String(64), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)


class AuditLog(db.Model):
    """B-009 standardized audit trail."""

    __tablename__ = "audit_log"

    id = db.Column(db.Integer, primary_key=True)
    trace_id = db.Column(db.String(64), nullable=True, index=True)
    user_id = db.Column(db.String(128), nullable=True, index=True)
    session_id = db.Column(db.String(128), nullable=True, index=True)
    module = db.Column(db.String(64), nullable=False)
    action = db.Column(db.String(128), nullable=False)
    error_code = db.Column(db.String(16), nullable=True, index=True)
    details_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
