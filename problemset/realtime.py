import json
from functools import lru_cache
from typing import Any, Optional

import redis
from django.conf import settings


def submission_events_channel(submission_id: int) -> str:
    return f"wnsoj:submission:{submission_id}:events"


def submission_progress_key(submission_id: int) -> str:
    return f"wnsoj:submission:{submission_id}:progress"


def _realtime_redis_url() -> str:
    url = (getattr(settings, "REALTIME_REDIS_URL", "") or "").strip()
    if url:
        return url
    return (getattr(settings, "CELERY_BROKER_URL", "") or "").strip()


@lru_cache(maxsize=1)
def _redis_client() -> redis.Redis:
    url = _realtime_redis_url()
    if not url.startswith("redis://") and not url.startswith("rediss://"):
        raise RuntimeError(
            "Redis realtime is enabled but REALTIME_REDIS_URL/CELERY_BROKER_URL is not a redis:// URL."
        )
    return redis.Redis.from_url(url, decode_responses=True)


def get_submission_progress(submission_id: int) -> Optional[dict[str, Any]]:
    try:
        raw = _redis_client().get(submission_progress_key(submission_id))
    except Exception:
        return None
    if not raw:
        return None
    try:
        value = json.loads(raw)
    except Exception:
        return None
    return value if isinstance(value, dict) else None


def publish_submission_event(submission_id: int, payload: dict[str, Any], *, ttl_seconds: int = 60 * 60) -> None:
    try:
        client = _redis_client()
        data = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
        pipe = client.pipeline()
        pipe.set(submission_progress_key(submission_id), data, ex=ttl_seconds)
        pipe.publish(submission_events_channel(submission_id), data)
        pipe.execute()
    except Exception:
        return


def clear_submission_progress(submission_id: int) -> None:
    try:
        _redis_client().delete(submission_progress_key(submission_id))
    except Exception:
        return


def open_submission_pubsub(submission_id: int) -> redis.client.PubSub:
    pubsub = _redis_client().pubsub(ignore_subscribe_messages=True)
    pubsub.subscribe(submission_events_channel(submission_id))
    return pubsub


def open_pubsub_channels(channels: list[str]) -> redis.client.PubSub:
    pubsub = _redis_client().pubsub(ignore_subscribe_messages=True)
    if channels:
        pubsub.subscribe(*channels)
    return pubsub


def open_submission_pubsub_many(submission_ids: list[int]) -> redis.client.PubSub:
    channels = [submission_events_channel(int(sid)) for sid in submission_ids]
    return open_pubsub_channels(channels)
