import subprocess
from pathlib import Path
from typing import Callable, Optional

from .isolate import run_isolate
from .languages import LANGUAGE_CONFIGS
from .types import JudgeRequest, JudgeResult, LanguageConfig, RunResult, TestProgress

ProgressCallback = Callable[[TestProgress], None]
RunCommand = Callable[[int, tuple[str, ...], float, int, bytes | None], RunResult]


def run_test_cases(
    *,
    submission_id: int,
    box_id: int,
    config: LanguageConfig,
    tests_root: str | Path,
    time_limit_seconds: float,
    memory_limit_kb: int,
    run_command: RunCommand,
    progress_callback: Optional[ProgressCallback] = None,
) -> JudgeResult:
    tests_root = Path(tests_root)
    input_dir = tests_root / "input"
    output_dir = tests_root / "output"
    if not input_dir.is_dir() or not output_dir.is_dir():
        return JudgeResult(verdict="RE 1", error="Missing test data directories.")

    filenames = sorted(path.name for path in input_dir.iterdir() if path.is_file())
    total_tests = len(filenames)
    stat = JudgeResult(verdict="AC")

    for test_case, filename in enumerate(filenames, start=1):
        if progress_callback:
            progress_callback(
                TestProgress(
                    submission_id=submission_id,
                    verdict=f"T {test_case}",
                    current_test=test_case,
                    total_tests=total_tests,
                )
            )

        input_data = (input_dir / filename).read_bytes()
        result = run_command(
            box_id,
            config.run,
            time_limit_seconds,
            memory_limit_kb,
            input_data,
        )

        time_ms = max(stat.time_ms, int(result.time_seconds * 1000))
        memory_kb = max(stat.memory_kb, result.memory_kb)
        stat = JudgeResult(verdict=stat.verdict, time_ms=time_ms, memory_kb=memory_kb)

        if not result.run_success:
            if result.memory_kb >= memory_limit_kb:
                return JudgeResult(
                    verdict=f"MLE {test_case}",
                    time_ms=stat.time_ms,
                    memory_kb=memory_limit_kb,
                )
            if result.status == "TO":
                return JudgeResult(
                    verdict=f"TLE {test_case}",
                    time_ms=int(time_limit_seconds * 1000),
                    memory_kb=stat.memory_kb,
                )
            if result.status in {"RE", "SG"}:
                return JudgeResult(
                    verdict=f"RE {test_case}",
                    time_ms=stat.time_ms,
                    memory_kb=stat.memory_kb,
                )

        output_path = output_dir / filename
        if not output_path.exists():
            return JudgeResult(
                verdict=f"WA {test_case}",
                time_ms=stat.time_ms,
                memory_kb=stat.memory_kb,
            )

        expected_output = output_path.read_text().strip()
        actual_output = result.stdout.strip()
        if actual_output != expected_output:
            return JudgeResult(
                verdict=f"WA {test_case}",
                time_ms=stat.time_ms,
                memory_kb=stat.memory_kb,
            )

    return stat


def judge_submission(
    request: JudgeRequest,
    *,
    progress_callback: Optional[ProgressCallback] = None,
) -> JudgeResult:
    config = LANGUAGE_CONFIGS.get(request.language)
    if not config:
        return JudgeResult(
            verdict="RE 1",
            error=f"Unknown language: {request.language}",
        )

    box_id = request.isolate_box_id
    try:
        subprocess.run(
            [
                request.isolate_binary,
                "--cg",
                "--box-id",
                str(box_id),
                "--cleanup",
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                request.isolate_binary,
                "--cg",
                "--box-id",
                str(box_id),
                "--init",
            ],
            check=True,
        )

        box_path = request.isolate_path / str(box_id) / "box"
        (box_path / config.source_file).write_text(request.code)

        def run_command(
            current_box_id: int,
            cmd: tuple[str, ...],
            time_limit: float,
            memory_limit: int,
            input_data: bytes | None,
        ) -> RunResult:
            return run_isolate(
                current_box_id,
                cmd,
                time_limit,
                memory_limit,
                isolate_path=request.isolate_path,
                isolate_binary=request.isolate_binary,
                input_data=input_data,
            )

        if config.compile:
            compile_result = run_isolate(
                box_id,
                config.compile,
                time_limit=15,
                mem_limit=512 * 1024,
                isolate_path=request.isolate_path,
                isolate_binary=request.isolate_binary,
                is_compile=True,
            )
            if not compile_result.run_success:
                return JudgeResult(verdict="CE")

        return run_test_cases(
            submission_id=request.submission_id,
            box_id=box_id,
            config=config,
            tests_root=request.tests_root,
            time_limit_seconds=request.time_limit_seconds,
            memory_limit_kb=request.memory_limit_kb,
            run_command=run_command,
            progress_callback=progress_callback,
        )
    except Exception as exc:
        return JudgeResult(verdict="RE 1", error=str(exc))
    finally:
        subprocess.run(
            [
                request.isolate_binary,
                "--cg",
                "--box-id",
                str(box_id),
                "--cleanup",
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
