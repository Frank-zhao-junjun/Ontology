from __future__ import annotations

import statistics
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.validate_mvp import login, publish_runtime_models  # noqa: E402
from backend import create_app  # noqa: E402


def percentile(sorted_values: list[float], ratio: float) -> float:
    if not sorted_values:
        return 0.0
    index = max(0, min(len(sorted_values) - 1, int(round((len(sorted_values) - 1) * ratio))))
    return sorted_values[index]


def sample_request(client, headers: dict[str, str], path: str, payload: dict[str, object], count: int) -> list[float]:
    durations = []
    for _ in range(count):
        start = time.perf_counter()
        response = client.post(path, headers=headers, json=payload)
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert response.status_code in (200, 201), response.get_json()
        durations.append(elapsed_ms)
    return durations


def run() -> int:
    app = create_app(testing=True)
    client = app.test_client()
    headers = login(client)
    publish_runtime_models(client, headers)

    query_times = sample_request(
        client,
        headers,
        "/api/chat/execute",
        {"session_id": "perf-1", "message": "查询合同列表"},
        20,
    )
    retry_times = sample_request(
        client,
        headers,
        "/api/chat/retry",
        {"message_id": "perf-message-1", "reason": "sample", "retry_chain_id": "perf-chain-1"},
        2,
    )
    all_times = sorted(query_times + retry_times)

    report = {
        "samples": len(all_times),
        "avg_ms": round(statistics.mean(all_times), 3),
        "p50_ms": round(percentile(all_times, 0.50), 3),
        "p90_ms": round(percentile(all_times, 0.90), 3),
        "p99_ms": round(percentile(all_times, 0.99), 3),
        "max_ms": round(max(all_times), 3),
    }
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(run())