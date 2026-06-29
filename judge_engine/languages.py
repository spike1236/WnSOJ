from .types import LanguageConfig


LANGUAGE_CONFIGS = {
    "cpp": LanguageConfig(
        compile=(
            "/usr/bin/g++",
            "-O2",
            "-std=c++23",
            "-DONLINE_JUDGE",
            "source.cpp",
            "-o",
            "program",
        ),
        run=("./program",),
        source_file="source.cpp",
    ),
    "py": LanguageConfig(
        run=("/usr/bin/python3.12", "source.py"),
        source_file="source.py",
    ),
}
