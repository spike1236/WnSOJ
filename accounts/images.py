import warnings
from pathlib import Path

from django.conf import settings
from PIL import Image, UnidentifiedImageError


class InvalidProfileIconError(ValueError):
    pass


def _seek_start(file_obj):
    try:
        file_obj.seek(0)
    except (AttributeError, OSError):
        pass


def _load_profile_icon(icon):
    max_bytes = int(getattr(settings, "PROFILE_ICON_MAX_BYTES", 5 * 1024 * 1024))
    size = int(getattr(icon, "size", 0) or 0)
    if size > max_bytes:
        raise InvalidProfileIconError("Icon file is too large.")

    max_pixels = int(getattr(settings, "PROFILE_ICON_MAX_PIXELS", 12_000_000))
    max_dimension = int(getattr(settings, "PROFILE_ICON_MAX_DIMENSION", 4096))

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            _seek_start(icon)
            with Image.open(icon) as image:
                image.verify()

            _seek_start(icon)
            with Image.open(icon) as image:
                width, height = image.size
                if width <= 0 or height <= 0:
                    raise InvalidProfileIconError("Icon image is invalid.")
                if width * height > max_pixels:
                    raise InvalidProfileIconError("Icon image is too large.")
                if max(width, height) > max_dimension:
                    raise InvalidProfileIconError("Icon dimensions are too large.")

                image.load()
                return image.convert("RGBA")
    except InvalidProfileIconError:
        raise
    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        OSError,
        UnidentifiedImageError,
    ) as exc:
        raise InvalidProfileIconError("Icon must be a valid image file.") from exc
    finally:
        _seek_start(icon)


def save_profile_icon_files(icon, icon_id):
    image = _load_profile_icon(icon)
    root = Path(settings.MEDIA_ROOT) / "users_icons"
    targets = {
        "icon64": (64, 64),
        "icon170": (170, 170),
    }

    for directory, size in targets.items():
        out_dir = root / directory
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{icon_id}.png"
        resized = image.resize(size, Image.Resampling.LANCZOS)
        resized.save(out_path, format="PNG")
