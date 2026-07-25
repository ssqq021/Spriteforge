from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class GeneratedImage:
    provider: str
    model: str
    image_url: str
    revised_prompt: str | None = None
    raw: dict[str, Any] | None = None


class ImageProvider(ABC):
    name: str

    @abstractmethod
    async def generate_character(
        self,
        *,
        prompt: str,
        size: str = "2K",
        watermark: bool = False,
    ) -> GeneratedImage:
        raise NotImplementedError
