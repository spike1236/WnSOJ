from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class LanguageConfig:
    source_file: str
    run: tuple[str, ...]
    compile: Optional[tuple[str, ...]] = None


@dataclass(frozen=True)
class JudgeRequest:
    submission_id: int
    problem_id: int
    language: str
    code: str
    tests_root: Path
    time_limit_seconds: float
    memory_limit_kb: int
    isolate_path: Path
    isolate_box_id: int
    isolate_binary: str = "isolate"


@dataclass(frozen=True)
class RunResult:
    stdout: str
    run_success: bool
    status: Optional[str] = None
    time_seconds: float = 0
    memory_kb: int = 0


@dataclass(frozen=True)
class TestProgress:
    submission_id: int
    verdict: str
    current_test: int
    total_tests: int
    stage: str = "test"


@dataclass(frozen=True)
class JudgeResult:
    verdict: str
    time_ms: int = 0
    memory_kb: int = 0
    error: str = ""
