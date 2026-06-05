from typing import Any

import httpx
import structlog

logger = structlog.get_logger()


class ServiceClient:
    def __init__(
        self,
        base_url: str,
        timeout: float = 10.0,
        max_retries: int = 3,
    ) -> None:
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        params: dict[str, Any] | None = None,
    ) -> httpx.Response:
        url = f"{self.base_url}{path}"
        last_exception: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(method, url, json=json, headers=headers, params=params)
                    response.raise_for_status()
                    return response
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_exception = e
                await logger.awarning(
                    "service_request_failed",
                    url=url,
                    attempt=attempt,
                    error=str(e),
                )

        raise last_exception

    async def get(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("POST", path, **kwargs)

    async def patch(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("PATCH", path, **kwargs)

    async def delete(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("DELETE", path, **kwargs)
