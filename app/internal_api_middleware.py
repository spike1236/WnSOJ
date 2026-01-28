from django.conf import settings
from django.http import HttpResponseNotFound


class InternalApiKeyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        key = getattr(settings, "INTERNAL_API_KEY", "") or ""
        if key and request.path.startswith("/api/"):
            provided = request.headers.get("X-Internal-API-Key") or ""
            if provided != key:
                return HttpResponseNotFound()
        return self.get_response(request)

