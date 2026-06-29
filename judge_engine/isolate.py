import subprocess
from pathlib import Path
from typing import Any

from .types import RunResult


def parse_meta_file(meta_file_path: str | Path) -> dict[str, Any]:
    meta_data: dict[str, Any] = {}
    try:
        with Path(meta_file_path).open("r") as file:
            for line in file:
                if ":" not in line:
                    continue
                key, value = line.strip().split(":", 1)
                try:
                    value = float(value) if "." in value else int(value)
                except ValueError:
                    pass
                meta_data[key] = value
    except FileNotFoundError:
        pass
    return meta_data


def run_isolate(
    box_id: int,
    cmd: tuple[str, ...],
    time_limit: float,
    mem_limit: int,
    *,
    isolate_path: str | Path,
    isolate_binary: str = "isolate",
    input_data: bytes | None = None,
    is_compile: bool = False,
) -> RunResult:
    box_path = Path(isolate_path) / str(box_id) / "box"
    meta_path = box_path / "meta.txt"
    isolate_cmd = [
        isolate_binary,
        f"--box-id={box_id}",
        "--cg",
        f"--time={time_limit}",
        f"--wall-time={time_limit * 2}",
        f"--cg-mem={mem_limit}",
        f"--meta={meta_path}",
    ]

    if is_compile:
        isolate_cmd.extend(
            [
                "--processes=4",
                "--env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            ]
        )

    isolate_cmd.append("--run")
    isolate_cmd.append("--")
    isolate_cmd.extend(cmd)

    try:
        result = subprocess.run(
            isolate_cmd,
            input=input_data,
            capture_output=True,
            timeout=time_limit * 2,
        )
        meta = parse_meta_file(meta_path)
        return RunResult(
            stdout=result.stdout.decode(),
            run_success=result.returncode == 0,
            status=meta.get("status"),
            time_seconds=float(meta.get("time", 0) or 0),
            memory_kb=int(meta.get("max-rss", 0) or 0),
        )
    except subprocess.TimeoutExpired:
        return RunResult(stdout="", run_success=False, status="TO")
