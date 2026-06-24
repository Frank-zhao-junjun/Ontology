"""B-009: append-only audit log with standard fields."""

from __future__ import annotations

import json
from typing import Any

from app.extensions import db
from app.models.runtime import AuditLog


def write_audit(
    *,
    module: str,
    action: str,
    error_code: str | None = None,
    trace_id: str | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    db.session.add(
        AuditLog(
            module=module,
            action=action,
            error_code=error_code,
            trace_id=trace_id,
            user_id=user_id,
            session_id=session_id,
            details_json=json.dumps(details, ensure_ascii=False) if details else None,
        )
    )
    db.session.commit()
