"""Role to permission mapping for API endpoints."""

from __future__ import annotations

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": {"*"},
    "modeler": {
        "meta:validate",
        "meta:draft",
        "meta:publish",
        "meta:read",
        "domain:write",
        "chat:execute",
        "runtime:admin",
    },
    "operator": {
        "meta:validate",
        "meta:read",
        "domain:write",
        "chat:execute",
    },
    "viewer": {
        "meta:validate",
        "meta:read",
        "chat:execute",
    },
}


def role_may(role: str, permission: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role)
    if not perms:
        return False
    if "*" in perms:
        return True
    return permission in perms
