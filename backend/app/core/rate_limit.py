import hashlib
import hmac
import math
import secrets
import threading
import time
from collections import deque
from dataclasses import dataclass
from typing import Iterable

from fastapi import HTTPException, Request, status


@dataclass(frozen=True)
class RateLimitRule:
    bucket: str
    identity: str
    limit: int
    window_seconds: int


class InMemoryRateLimiter:
    """Process-local sliding-window limiter for single-instance deployments."""

    _MAX_BUCKETS = 20_000

    def __init__(self) -> None:
        self._key = secrets.token_bytes(32)
        self._buckets: dict[str, tuple[int, deque[float]]] = {}
        self._lock = threading.Lock()

    def _digest(self, bucket: str, identity: str) -> str:
        message = f"{bucket}\0{identity}".encode("utf-8")
        return hmac.new(self._key, message, hashlib.sha256).hexdigest()

    @staticmethod
    def _prune(events: deque[float], window_seconds: int, now: float) -> None:
        cutoff = now - window_seconds
        while events and events[0] <= cutoff:
            events.popleft()

    def _sweep_expired(self, now: float) -> None:
        expired = []
        for key, (window_seconds, events) in self._buckets.items():
            self._prune(events, window_seconds, now)
            if not events:
                expired.append(key)
        for key in expired:
            del self._buckets[key]

    def check_many(self, rules: Iterable[RateLimitRule]) -> None:
        rules = tuple(rules)
        if not rules:
            return

        now = time.monotonic()
        keyed_rules = [(self._digest(rule.bucket, rule.identity), rule) for rule in rules]
        with self._lock:
            for key, rule in keyed_rules:
                entry = self._buckets.get(key)
                if entry is not None:
                    self._prune(entry[1], rule.window_seconds, now)
                    self._buckets[key] = (rule.window_seconds, entry[1])

            if len(self._buckets) >= self._MAX_BUCKETS:
                self._sweep_expired(now)

            retry_after = 0
            for key, rule in keyed_rules:
                if rule.limit < 1 or rule.window_seconds < 1:
                    raise ValueError("Rate-limit values must be positive.")
                entry = self._buckets.get(key)
                if entry is not None and len(entry[1]) >= rule.limit:
                    retry_after = max(
                        retry_after,
                        math.ceil(entry[1][0] + rule.window_seconds - now),
                    )

            if retry_after:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please retry later.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            new_keys = {key for key, _ in keyed_rules if key not in self._buckets}
            if len(self._buckets) + len(new_keys) > self._MAX_BUCKETS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate-limit capacity reached. Please retry later.",
                    headers={"Retry-After": "60"},
                )

            for key, rule in keyed_rules:
                entry = self._buckets.get(key)
                if entry is None:
                    entry = (rule.window_seconds, deque())
                    self._buckets[key] = entry
                entry[1].append(now)


rate_limiter = InMemoryRateLimiter()


def request_client_ip(request: Request) -> str:
    if request.client is None or not request.client.host:
        return "unknown"
    return request.client.host
