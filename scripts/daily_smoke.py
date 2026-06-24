from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
_VENV_PY = ROOT / ".venv" / "Scripts" / "python.exe"
PYTHON = str(_VENV_PY) if _VENV_PY.is_file() else sys.executable
REPORT_DIR = ROOT / "reports"


def run_command(command: list[str]) -> dict[str, object]:
    completed = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    return {
        "command": command,
        "exit_code": completed.returncode,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
    }


def run() -> int:
    REPORT_DIR.mkdir(exist_ok=True)
    checks = [
        run_command([PYTHON, "-m", "pytest", "-q", "tests"]),
        run_command([str(PYTHON), "scripts/validate_mvp.py"]),
        run_command([str(PYTHON), "scripts/perf_sample.py"]),
    ]
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "all_passed": all(item["exit_code"] == 0 for item in checks),
        "checks": checks,
    }
    latest = REPORT_DIR / "daily_smoke_latest.json"
    latest.write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
    print(latest)
    return 0 if report["all_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(run())