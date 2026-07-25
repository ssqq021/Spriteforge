from __future__ import annotations

import os

from .base import ImageProvider
from .doubao import DoubaoProvider


def get_image_provider() -> ImageProvider:
    provider = os.getenv("AI_PROVIDER", "doubao").strip().lower()

    if provider in {"doubao", "ark", "seedream"}:
        return DoubaoProvider()

    raise RuntimeError(
        f"不支持的 AI_PROVIDER：{provider}。当前可用值：doubao"
    )
