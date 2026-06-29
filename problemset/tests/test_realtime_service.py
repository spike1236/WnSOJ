import os
from unittest.mock import patch

from asgiref.sync import async_to_sync
from django.test import SimpleTestCase
from fastapi import HTTPException

from realtime_service.main import _redis_url, _require_internal_key


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


class RealtimeRedisUrlTests(SimpleTestCase):
    def test_realtime_redis_url_prefers_explicit_env(self):
        with patch.dict(
            os.environ,
            {
                "REALTIME_REDIS_URL": "redis://realtime:6379/1",
            },
        ):
            self.assertEqual(_redis_url(), "redis://realtime:6379/1")

    def test_realtime_redis_url_defaults_to_local_redis(self):
        with patch.dict(
            os.environ,
            {
                "REALTIME_REDIS_URL": "",
            },
            clear=True,
        ):
            self.assertEqual(_redis_url(), "redis://localhost:6379/0")
