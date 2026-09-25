"""Rate limiter, polite politeness policies, and HTTP client with anti-blocking strategy."""

import asyncio
import random
import logging
from typing import Dict, Optional
from urllib.parse import urlparse
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
)
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

# Fallback pool of desktop user agents if fake-useragent is offline
FALLBACK_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
]


class UserAgentRotator:
    def __init__(self):
        try:
            self._ua = UserAgent(platforms="desktop", fallback=FALLBACK_USER_AGENTS[0])
        except Exception:
            self._ua = None

    def get(self) -> str:
        if self._ua:
            try:
                return self._ua.random
            except Exception:
                pass
        return random.choice(FALLBACK_USER_AGENTS)


user_agent_rotator = UserAgentRotator()


class RateLimitError(Exception):
    """Raised when server returns 429 or 503 rate-limiting responses."""
    pass


def should_retry_request(exception: BaseException) -> bool:
    """Determine whether to retry based on HTTP error status or network timeout."""
    if isinstance(exception, RateLimitError):
        return True
    if isinstance(exception, (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.NetworkError)):
        return True
    return False


class PoliteHttpClient:
    """Async HTTP client enforcing per-domain concurrency, jitter, and browser headers."""

    def __init__(self, min_jitter: float = 1.5, max_jitter: float = 3.5, max_concurrent_per_domain: int = 2):
        self.min_jitter = min_jitter
        self.max_jitter = max_jitter
        self.max_concurrent_per_domain = max_concurrent_per_domain
        self._semaphores: Dict[str, asyncio.Semaphore] = {}
        self._domain_locks: Dict[str, asyncio.Lock] = {}
        self._client: Optional[httpx.AsyncClient] = None

    def _get_semaphore(self, domain: str) -> asyncio.Semaphore:
        if domain not in self._semaphores:
            self._semaphores[domain] = asyncio.Semaphore(self.max_concurrent_per_domain)
        return self._semaphores[domain]

    def _get_browser_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": user_agent_rotator.get(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "et-EE,et;q=0.9,en-US;q=0.8,en;q=0.7",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
        }

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            http2_enabled = True
            try:
                import h2
            except ImportError:
                http2_enabled = False

            self._client = httpx.AsyncClient(
                http2=http2_enabled,
                follow_redirects=True,
                timeout=httpx.Timeout(15.0, connect=8.0),
            )
        return self._client

    @retry(
        reraise=True,
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1.5, min=2, max=10),
        retry=retry_if_exception(should_retry_request),
    )
    async def fetch(self, url: str, use_impersonate: bool = False) -> str:
        """Fetch URL content with jitter, per-domain concurrency, and exponential backoff."""
        parsed = urlparse(url)
        domain = parsed.netloc

        semaphore = self._get_semaphore(domain)

        async with semaphore:
            # Add polite randomized jitter delay between requests
            jitter = random.uniform(self.min_jitter, self.max_jitter)
            await asyncio.sleep(jitter)

            headers = self._get_browser_headers()

            # Handle domains that require TLS browser impersonation (e.g. Cloudflare protected)
            if use_impersonate:
                return await self._fetch_curl_cffi(url, headers)

            client = await self.get_client()
            response = await client.get(url, headers=headers)

            if response.status_code in (429, 503):
                logger.warning("Rate-limited (%s) on %s. Retrying with exponential backoff...", response.status_code, url)
                raise RateLimitError(f"HTTP {response.status_code} on {url}")

            if response.status_code == 403 and not use_impersonate:
                # Fallback to impersonation if 403 encountered
                logger.info("Encountered 403 on %s, trying curl_cffi impersonate fallback", url)
                return await self._fetch_curl_cffi(url, headers)

            response.raise_for_status()
            try:
                return response.content.decode("utf-8")
            except UnicodeDecodeError:
                return response.text

    async def _fetch_curl_cffi(self, url: str, headers: Dict[str, str]) -> str:
        """Runs curl_cffi in thread pool for Cloudflare TLS fingerprint bypass."""
        def _sync_get():
            try:
                from curl_cffi import requests
                r = requests.get(url, headers=headers, impersonate="chrome124", timeout=15)
                if r.status_code in (429, 503):
                    raise RateLimitError(f"HTTP {r.status_code} on {url}")
                r.raise_for_status()
                return r.text
            except Exception as e:
                if "429" in str(e) or "503" in str(e):
                    raise RateLimitError(f"Rate limited: {e}")
                raise

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _sync_get)

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
