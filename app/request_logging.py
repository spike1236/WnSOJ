import logging
import time

from observability.logging import (
    level_for_status,
    normalize_request_id,
    reset_request_id,
    set_request_id,
)


logger = logging.getLogger("app.requests")


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = normalize_request_id(request.headers.get("X-Request-ID"))
        token = set_request_id(request_id)
        started = time.perf_counter()

        try:
            response = self.get_response(request)
        except Exception:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.exception(
                "django request failed",
                extra={
                    "http_method": request.method,
                    "http_path": request.path,
                    "duration_ms": duration_ms,
                },
            )
            raise
        else:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            response["X-Request-ID"] = request_id
            status_code = getattr(response, "status_code", 0)
            logger.log(
                level_for_status(status_code),
                "django request",
                extra={
                    "http_method": request.method,
                    "http_path": request.path,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                },
            )
            return response
        finally:
            reset_request_id(token)
