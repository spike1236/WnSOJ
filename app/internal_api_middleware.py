import secrets

from django.conf import settings
from django.http import HttpResponseNotFound


class InternalApiKeyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/"):
            key = (getattr(settings, "INTERNAL_API_KEY", "") or "").strip()
            if not key:
                return HttpResponseNotFound()
            provided = request.headers.get("X-Internal-API-Key") or ""
            if not secrets.compare_digest(provided, key):
                return HttpResponseNotFound()
        return self.get_response(request)
