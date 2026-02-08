import json
import os
import time
from functools import lru_cache
from typing import Optional

import redis.asyncio as redis
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse


def _internal_api_key() -> str:
    return (os.getenv("INTERNAL_API_KEY") or "").strip()


async def _require_internal_key(request: Request) -> None:
    key = _internal_api_key()
    if not key:
        return
    provided = request.headers.get("x-internal-api-key") or ""
    if provided != key:
        raise HTTPException(status_code=404)


def _redis_url() -> str:
    url = (os.getenv("REALTIME_REDIS_URL") or "").strip()
    if url:
        return url
    url = (os.getenv("CELERY_BROKER_URL") or "").strip()
    if url:
        return url
    return "redis://localhost:6379/0"


@lru_cache(maxsize=1)
def _redis_client() -> redis.Redis:
    return redis.Redis.from_url(_redis_url(), decode_responses=True)


def _channel(submission_id: int) -> str:
    return f"wnsoj:submission:{submission_id}:events"


def _progress_key(submission_id: int) -> str:
    return f"wnsoj:submission:{submission_id}:progress"


def _submission_id_from_channel(channel: Optional[str]) -> Optional[int]:
    if not channel:
        return None
    parts = channel.split(":")
    if len(parts) < 4:
        return None
    if parts[0] != "wnsoj" or parts[1] != "submission":
        return None
    try:
        return int(parts[2])
    except ValueError:
        return None


def _verdict_code(verdict: Optional[str]) -> Optional[str]:
    v = (verdict or "").strip()
    if not v:
        return None
    if v.lower() == "in queue":
        return "IQ"
    return (v.split()[:1] or [""])[0].upper() or None


def _is_final_code(code: Optional[str]) -> bool:
    return code in {"AC", "WA", "TLE", "MLE", "CE", "RE"}


def _sse(payload: dict, event: Optional[str] = None) -> bytes:
    data = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    lines = []
    if event:
        lines.append(f"event: {event}")
    for line in data.splitlines() or ["{}"]:
        lines.append(f"data: {line}")
    return ("\n".join(lines) + "\n\n").encode("utf-8")


app = FastAPI(dependencies=[Depends(_require_internal_key)])


@app.get("/sse/submission/{submission_id}")
async def stream_submission(request: Request, submission_id: int):
    client = _redis_client()
    raw = await client.get(_progress_key(submission_id))
    payload = None
    if raw:
        try:
            obj = json.loads(raw)
            payload = obj if isinstance(obj, dict) else None
        except Exception:
            payload = None

    snapshot = payload or {"kind": "snapshot", "id": submission_id, "verdict": "IQ"}
    code = _verdict_code(snapshot.get("verdict") if isinstance(snapshot, dict) else None)

    async def gen():
        yield _sse(snapshot, "snapshot")
        if _is_final_code(code):
            final_payload = dict(snapshot)
            final_payload["kind"] = "final"
            yield _sse(final_payload, "final")
            return

        pubsub = client.pubsub(ignore_subscribe_messages=True)
        await pubsub.subscribe(_channel(submission_id))
        try:
            last_ping = time.monotonic()
            while True:
                if await request.is_disconnected():
                    return
                message = await pubsub.get_message(timeout=15.0)
                if message and message.get("type") == "message":
                    data = message.get("data")
                    if isinstance(data, str) and data:
                        try:
                            obj = json.loads(data)
                            if isinstance(obj, dict) and obj.get("kind") == "final":
                                yield _sse(obj, "final")
                                return
                            if isinstance(obj, dict):
                                yield _sse(obj)
                            else:
                                yield _sse({"kind": "progress", "id": submission_id, "verdict": data})
                        except Exception:
                            yield _sse({"kind": "progress", "id": submission_id, "verdict": data})
                else:
                    now = time.monotonic()
                    if now - last_ping >= 15:
                        last_ping = now
                        yield b": ping\n\n"
        finally:
            await pubsub.close()

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/sse/submissions")
async def stream_submissions(request: Request, ids: str):
    parts = [p.strip() for p in (ids or "").split(",") if p.strip()]
    sub_ids: list[int] = []
    for p in parts:
        try:
            sub_ids.append(int(p))
        except ValueError:
            continue
    sub_ids = sub_ids[:200]
    if not sub_ids:
        raise HTTPException(status_code=400, detail="Missing or invalid ids.")

    client = _redis_client()

    async def snapshot_for(sid: int):
        raw = await client.get(_progress_key(sid))
        if raw:
            try:
                obj = json.loads(raw)
                if isinstance(obj, dict):
                    return obj
            except Exception:
                pass
        return {"kind": "snapshot", "id": sid, "verdict": "IQ"}

    async def gen():
        pending: set[int] = set()
        for sid in sub_ids:
            snap = await snapshot_for(sid)
            yield _sse(snap, "snapshot")
            code = _verdict_code(snap.get("verdict") if isinstance(snap, dict) else None)
            if _is_final_code(code):
                final_payload = dict(snap)
                final_payload["kind"] = "final"
                yield _sse(final_payload, "final")
            else:
                pending.add(sid)

        if not pending:
            return

        pubsub = client.pubsub(ignore_subscribe_messages=True)
        await pubsub.subscribe(*[_channel(sid) for sid in sorted(pending)])
        try:
            last_ping = time.monotonic()
            while pending:
                if await request.is_disconnected():
                    return
                message = await pubsub.get_message(timeout=15.0)
                if message and message.get("type") == "message":
                    data = message.get("data")
                    if isinstance(data, str) and data:
                        try:
                            obj = json.loads(data)
                            if isinstance(obj, dict) and obj.get("kind") == "final":
                                sid = obj.get("id")
                                if isinstance(sid, int):
                                    pending.discard(sid)
                                yield _sse(obj, "final")
                            elif isinstance(obj, dict):
                                yield _sse(obj)
                            else:
                                sid = _submission_id_from_channel(message.get("channel"))
                                yield _sse({"kind": "progress", "id": sid, "verdict": data})
                        except Exception:
                            sid = _submission_id_from_channel(message.get("channel"))
                            yield _sse({"kind": "progress", "id": sid, "verdict": data})
                else:
                    now = time.monotonic()
                    if now - last_ping >= 15:
                        last_ping = now
                        yield b": ping\n\n"
        finally:
            await pubsub.close()

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
