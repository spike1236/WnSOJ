import contextvars
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from logging.config import dictConfig
from typing import Any


_REQUEST_ID = contextvars.ContextVar("request_id", default="-")
_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

_RESERVED_LOG_RECORD_KEYS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "message",
    "module",
    "msecs",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "request_id",
    "service",
    "stack_info",
    "thread",
    "threadName",
}


def env_log_level(default: str = "INFO") -> str:
    level = os.getenv("LOG_LEVEL", default).strip().upper()
    return level or default


def env_log_format(default: str = "plain") -> str:
    value = os.getenv("LOG_FORMAT", default).strip().lower()
    return value if value in {"plain", "json"} else default


def normalize_request_id(value: str | None) -> str:
    request_id = (value or "").strip()
    if request_id and _REQUEST_ID_RE.fullmatch(request_id):
        return request_id
    return uuid.uuid4().hex


def get_request_id() -> str:
    return _REQUEST_ID.get()


def set_request_id(request_id: str):
    return _REQUEST_ID.set(request_id)


def reset_request_id(token) -> None:
    _REQUEST_ID.reset(token)


class ServiceContextFilter(logging.Filter):
    def __init__(self, service_name: str = "app"):
        super().__init__()
        self.service_name = service_name

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "service"):
            record.service = self.service_name
        if not hasattr(record, "request_id"):
            record.request_id = get_request_id()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(
                record.created, timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "service": getattr(record, "service", "app"),
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = getattr(record, "request_id", "-")
        if request_id != "-":
            data["request_id"] = request_id

        for key, value in record.__dict__.items():
            if key in _RESERVED_LOG_RECORD_KEYS or key in data:
                continue
            if key.startswith("_"):
                continue
            data[key] = _json_safe(value)

        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        if record.stack_info:
            data["stack"] = self.formatStack(record.stack_info)

        return json.dumps(data, separators=(",", ":"), ensure_ascii=False)


def logging_config(service_name: str, default_level: str = "INFO") -> dict[str, Any]:
    level = env_log_level(default_level)
    formatter = env_log_format()
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "service_context": {
                "()": "observability.logging.ServiceContextFilter",
                "service_name": service_name,
            },
        },
        "formatters": {
            "plain": {
                "format": (
                    "%(asctime)s %(levelname)s [%(service)s] "
                    "[%(request_id)s] %(name)s: %(message)s"
                )
            },
            "json": {
                "()": "observability.logging.JsonFormatter",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "filters": ["service_context"],
                "formatter": formatter,
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": level,
        },
        "loggers": {
            "django.request": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
        },
    }


def disabled_logging_config() -> dict[str, Any]:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {
            "null": {
                "class": "logging.NullHandler",
            },
        },
        "root": {
            "handlers": ["null"],
            "level": "CRITICAL",
        },
    }


def configure_logging(service_name: str, default_level: str = "INFO") -> None:
    dictConfig(logging_config(service_name, default_level))

    # Uvicorn installs its own handlers by default. When this app is imported by
    # Uvicorn, keep those loggers flowing through the same formatter.
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(logger_name)
        logger.handlers = []
        logger.propagate = True


def configure_disabled_logging() -> None:
    dictConfig(disabled_logging_config())


def level_for_status(status_code: int) -> int:
    if status_code >= 500:
        return logging.ERROR
    if status_code >= 400:
        return logging.WARNING
    return logging.INFO


def _json_safe(value: Any) -> Any:
    if value is None or isinstance(value, str | int | float | bool):
        return value
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, list | tuple | set):
        return [_json_safe(v) for v in value]
    return repr(value)
