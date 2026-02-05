import secrets

from django.conf import settings
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


def _has_valid_internal_api_key(request) -> bool:
    expected = (getattr(settings, "INTERNAL_API_KEY", "") or "").strip()
    if not expected:
        return False
    provided = (request.headers.get("X-Internal-API-Key") or "").strip()
    return bool(provided) and secrets.compare_digest(provided, expected)


class _InternalBypassMixin:
    def allow_request(self, request, view):
        if _has_valid_internal_api_key(request):
            return True
        return super().allow_request(request, view)


class InternalBypassUserRateThrottle(_InternalBypassMixin, UserRateThrottle):
    pass


class InternalBypassAnonRateThrottle(_InternalBypassMixin, AnonRateThrottle):
    pass

