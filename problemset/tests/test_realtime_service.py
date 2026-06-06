import os
from unittest.mock import patch

from asgiref.sync import async_to_sync
from django.test import SimpleTestCase
from fastapi import HTTPException
from starlette.responses import Response

from realtime_service.main import _require_internal_key, request_log_middleware


class DummyRequest:
    def __init__(self, headers=None):
        self.headers = headers or {}


class RealtimeInternalKeyTests(SimpleTestCase):
    def test_missing_internal_key_fails_closed(self):
        with patch.dict(os.environ, {"INTERNAL_API_KEY": ""}):
            with self.assertRaises(HTTPException) as ctx:
                async_to_sync(_require_internal_key)(DummyRequest())

        self.assertEqual(ctx.exception.status_code, 503)

    def test_wrong_internal_key_returns_not_found(self):
        with patch.dict(os.environ, {"INTERNAL_API_KEY": "secret"}):
            with self.assertRaises(HTTPException) as ctx:
                async_to_sync(_require_internal_key)(
                    DummyRequest({"x-internal-api-key": "wrong"})
                )

        self.assertEqual(ctx.exception.status_code, 404)

    def test_matching_internal_key_is_allowed(self):
        with patch.dict(os.environ, {"INTERNAL_API_KEY": "secret"}):
            async_to_sync(_require_internal_key)(
                DummyRequest({"x-internal-api-key": "secret"})
            )


class RealtimeRequestLoggingTests(SimpleTestCase):
    def test_forwards_request_id_to_response(self):
        async def call_next(_request):
            return Response("ok")

        request = DummyRequest({"x-request-id": "request-123"})
        request.method = "GET"
        request.url = type("URL", (), {"path": "/sse/submissions"})()

        with self.assertLogs("realtime.requests", level="INFO"):
            response = async_to_sync(request_log_middleware)(request, call_next)

        self.assertEqual(response.headers["X-Request-ID"], "request-123")
