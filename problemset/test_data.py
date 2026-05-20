from pathlib import Path
from zipfile import BadZipFile, ZipFile


class TestDataValidationError(ValueError):
    pass


COPY_CHUNK_SIZE = 1024 * 1024


def _seek_start(file_obj):
    try:
        file_obj.seek(0)
    except (AttributeError, OSError):
        pass


def _safe_zip_path(name):
    normalized = (name or "").replace("\\", "/")
    relative_path = Path(normalized)
    if relative_path.is_absolute() or ".." in relative_path.parts:
        raise TestDataValidationError("Invalid zip contents.")

    parts = relative_path.parts
    if len(parts) < 3 or parts[0] != "tests" or parts[1] not in {"input", "output"}:
        raise TestDataValidationError(
            "Zip may only contain tests/input and tests/output files."
        )
    return relative_path


def extract_problem_test_data(test_data_file, dest, *, max_size=250 * 1024 * 1024):
    dest = Path(dest)
    archive_size = int(getattr(test_data_file, "size", 0) or 0)
    if archive_size > max_size:
        raise TestDataValidationError("Zip is too large.")

    try:
        _seek_start(test_data_file)
        with ZipFile(test_data_file, "r") as zf:
            file_infos = []
            total_size = 0
            input_names = set()
            output_names = set()

            for info in zf.infolist():
                if info.is_dir():
                    continue

                total_size += int(getattr(info, "file_size", 0) or 0)
                if total_size > max_size:
                    raise TestDataValidationError("Zip is too large.")

                relative_path = _safe_zip_path(info.filename)
                parts = relative_path.parts
                if parts[1] == "input":
                    input_names.add(Path(*parts[2:]).as_posix())
                elif parts[1] == "output":
                    output_names.add(Path(*parts[2:]).as_posix())

                file_infos.append((info, relative_path))
    except (BadZipFile, OSError) as exc:
        raise TestDataValidationError("Invalid zip contents.") from exc
    finally:
        _seek_start(test_data_file)

    if not input_names:
        raise TestDataValidationError("Missing tests/input files.")
    if not output_names:
        raise TestDataValidationError("Missing tests/output files.")
    if input_names != output_names:
        raise TestDataValidationError("Input and output test filenames must match.")

    dest.mkdir(parents=True, exist_ok=True)
    dest_root = dest.resolve()
    try:
        _seek_start(test_data_file)
        with ZipFile(test_data_file, "r") as zf:
            for info, relative_path in file_infos:
                out_path = (dest / relative_path).resolve()
                if not out_path.is_relative_to(dest_root):
                    raise TestDataValidationError("Invalid zip contents.")

                out_path.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(info) as src, out_path.open("wb") as dst:
                    while True:
                        chunk = src.read(COPY_CHUNK_SIZE)
                        if not chunk:
                            break
                        dst.write(chunk)
    except (BadZipFile, OSError) as exc:
        raise TestDataValidationError("Invalid zip contents.") from exc
    finally:
        _seek_start(test_data_file)
