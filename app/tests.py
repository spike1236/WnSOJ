from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase

from app.request_logging import RequestLogMiddleware


class RequestLogMiddlewareTests(SimpleTestCase):
    def test_uses_forwarded_request_id(self):
        request = RequestFactory().get(
            "/api/categories/", HTTP_X_REQUEST_ID="request-123"
        )
        middleware = RequestLogMiddleware(lambda _request: HttpResponse("ok"))

        with self.assertLogs("app.requests", level="INFO"):
            response = middleware(request)

        self.assertEqual(response["X-Request-ID"], "request-123")

    def test_generates_request_id_when_missing(self):
        request = RequestFactory().get("/api/categories/")
        middleware = RequestLogMiddleware(lambda _request: HttpResponse("ok"))

        with self.assertLogs("app.requests", level="INFO"):
            response = middleware(request)

        self.assertTrue(response["X-Request-ID"])
        self.assertNotEqual(response["X-Request-ID"], "-")
