import os

import httpx


class DoubaoProviderError(Exception):
    """豆包图片生成接口异常。"""
    pass


class DoubaoProvider:
    name = "doubao"

    def __init__(self):
        self.api_key = os.getenv("ARK_API_KEY")

        self.model = os.getenv(
            "DOUBAO_MODEL",
            "doubao-seedream-5-0-pro-260628",
        )

        self.base_url = os.getenv(
            "DOUBAO_BASE_URL",
            "https://ark.cn-beijing.volces.com/api/v3",
        )

        if not self.api_key:
            raise DoubaoProviderError(
                "未找到 ARK_API_KEY"
            )


    async def generate_character(
        self,
        prompt: str,
        size: str = "1664x2496",
        watermark: bool = False,
        response_format: str = "url",
        **kwargs,
    ):

        # Seedream 支持尺寸保护
        valid_sizes = [
            "1664x2496",
            "2496x1664",
            "2048x2048",
        ]

        if size not in valid_sizes:
            size = "1664x2496"


        payload = {
            "model": self.model,
            "prompt": prompt,
            "response_format": response_format,
            "size": size,
            "stream": False,
            "watermark": watermark,
        }


        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }


        try:
            async with httpx.AsyncClient(
                timeout=180
            ) as client:

                response = await client.post(
                    f"{self.base_url}/images/generations",
                    json=payload,
                    headers=headers,
                )


            response.raise_for_status()

            result = response.json()


        except httpx.HTTPStatusError as exc:

            raise DoubaoProviderError(
                f"豆包 API 请求失败：HTTP {exc.response.status_code}，"
                f"{exc.response.text}"
            ) from exc


        except httpx.RequestError as exc:

            raise DoubaoProviderError(
                f"连接豆包失败：{exc}"
            ) from exc



        try:

            image_url = result["data"][0]["url"]


        except Exception:

            raise DoubaoProviderError(
                f"豆包返回格式异常：{result}"
            )


        return type(
            "GeneratedImage",
            (),
            {
                "provider": self.name,
                "model": self.model,
                "image_url": image_url,
                "revised_prompt": None,
                "raw": result,
            },
        )()