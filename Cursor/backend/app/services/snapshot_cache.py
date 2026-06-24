from __future__ import annotations

import hashlib
import json
from typing import Any


class SnapshotCache:
    """Process-local snapshot cache; invalidated on publish/rollback."""

    def __init__(self) -> None:
        self._snapshot: dict[str, Any] | None = None
        self._checksum: str | None = None
        self._release_no: str | None = None

    def set_snapshot(self, release_no: str, models: list[dict], checksum: str) -> None:
        self._release_no = release_no
        self._checksum = checksum
        self._snapshot = {"release_no": release_no, "models": models, "checksum": checksum}

    def invalidate(self) -> None:
        self._snapshot = None
        self._checksum = None
        self._release_no = None

    def get(self) -> dict[str, Any] | None:
        return self._snapshot

    @staticmethod
    def compute_checksum(models: list[dict]) -> str:
        payload = json.dumps(models, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()


cache = SnapshotCache()
