from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile


class TestDataValidationError(ValueError):
    pass


def extract_problem_test_data(test_data_file, dest, *, max_size=250 * 1024 * 1024):
    dest = Path(dest)
    data = test_data_file.read()

    try:
        with ZipFile(BytesIO(data), "r") as zf:
            file_infos = []
            total_size = 0
            input_names = set()
            output_names = set()

            for info in zf.infolist():
                name = info.filename
                if not name or name.endswith("/"):
                    continue

                total_size += int(getattr(info, "file_size", 0) or 0)
                if total_size > max_size:
                    raise TestDataValidationError("Zip is too large.")

                normalized = name.replace("\\", "/")
                relative_path = Path(normalized)
                if relative_path.is_absolute() or ".." in relative_path.parts:
                    raise TestDataValidationError("Invalid zip contents.")

                parts = relative_path.parts
                if len(parts) >= 3 and parts[0] == "tests" and parts[1] == "input":
                    input_names.add(Path(*parts[2:]).as_posix())
                elif (
                    len(parts) >= 3
                    and parts[0] == "tests"
                    and parts[1] == "output"
                ):
                    output_names.add(Path(*parts[2:]).as_posix())

                file_infos.append((info, relative_path))
    except BadZipFile as exc:
        raise TestDataValidationError("Invalid zip contents.") from exc

    if not input_names:
        raise TestDataValidationError("Missing tests/input files.")
    if not output_names:
        raise TestDataValidationError("Missing tests/output files.")
    if input_names != output_names:
        raise TestDataValidationError("Input and output test filenames must match.")

    dest.mkdir(parents=True, exist_ok=True)
    with ZipFile(BytesIO(data), "r") as zf:
        for info, relative_path in file_infos:
            out_path = dest / relative_path
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as src, open(out_path, "wb") as dst:
                dst.write(src.read())
