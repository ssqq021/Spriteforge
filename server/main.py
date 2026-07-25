from __future__ import annotations

import base64
import logging
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from providers import get_image_provider
from providers.doubao import DoubaoProviderError

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("spriteforge")

app = FastAPI(
    title="SpriteForge AI Server",
    version="4R-C",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def url_to_data_url(url: str) -> str:
    """
    下载豆包返回的临时图片 URL，
    转换为 Base64 data URL，避免浏览器跨域问题。
    """
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.get(url)
        response.raise_for_status()

    mime = response.headers.get("content-type", "image/jpeg")

    encoded = base64.b64encode(response.content).decode("utf-8")

    return f"data:{mime};base64,{encoded}"


@app.get("/api/health")
async def health() -> dict[str, Any]:
    try:
        provider = get_image_provider()

        return {
            "ok": True,
            "provider": provider.name,
            "model": getattr(provider, "model", None),
        }

    except Exception as exc:
        return {
            "ok": False,
            "provider": "unknown",
            "detail": str(exc),
        }


@app.post("/api/character/generate")
async def generate_character(
    prompt: str = Form(...),
    negative_prompt: str = Form(""),
    size: str = Form("1664x2496"),
    count: int = Form(1),
    watermark: bool = Form(False),
    reference_image: UploadFile | None = File(None),
):
    try:
        provider = get_image_provider()

        final_prompt = prompt

        if negative_prompt:
            final_prompt += (
                "\n\nNegative Prompt:"
                + negative_prompt
            )

# Seedream 5 使用明确尺寸
        result = await provider.generate_character(
            prompt=final_prompt,
            size="1664x2496",
            watermark=watermark,
        )

        # 豆包返回 URL，转换成 Base64 给前端
        image_url = result.image_url

        data_url = await url_to_data_url(image_url)

        images = [
            {
                "data_url": data_url,
                "url": image_url,
                "revised_prompt": result.revised_prompt
                if hasattr(result, "revised_prompt")
                else None,
            }
        ]

        return {
            "ok": True,
            "provider": result.provider,
            "model": result.model,
            "prompt": final_prompt,
            "images": images,

            # 兼容旧前端
            "imageUrl": data_url,
            "image_url": data_url,
            "url": data_url,
        }

    except DoubaoProviderError as exc:
        logger.warning("Doubao error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Character generation failed")

        raise HTTPException(
            status_code=500,
            detail=f"AI 角色生成失败：{exc}",
        ) from exc