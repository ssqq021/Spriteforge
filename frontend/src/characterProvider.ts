export type CharacterProviderId = "mock" | "spriteforge-server";

export type CharacterGenerateRequest = {
  prompt: string;
  negativePrompt: string;
  size: number;
  count: number;
  referenceImage?: File;
};

export type GeneratedCharacter = {
  blob: Blob;
  revisedPrompt?: string;
};

export interface CharacterGenerationProvider {
  id: CharacterProviderId;
  name: string;
  generate(request: CharacterGenerateRequest): Promise<GeneratedCharacter[]>;
  generateStream?(
    request: CharacterGenerateRequest,
    onImage: (image: GeneratedCharacter, index: number, total: number) => void
  ): Promise<GeneratedCharacter[]>;
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error(`图片下载失败: ${response.status}`);
  }

  return response.blob();
}

export const spriteForgeServerProvider: CharacterGenerationProvider = {
  id: "spriteforge-server",
  name: "SpriteForge Server",
  async generate(request) {
    const form = new FormData();
    form.append("prompt", request.prompt);
    form.append("negative_prompt", request.negativePrompt);
    form.append("size", String(request.size));
    form.append("count", String(request.count));
    if (request.referenceImage) form.append("reference_image", request.referenceImage);

    const response = await fetch("/api/character/generate", {
      method: "POST",
      body: form
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `AI 服务请求失败：${response.status}`);
    }

    const payload = (await response.json()) as {
      images: Array<{data_url: string; revised_prompt?: string}>;
    };

    return Promise.all(
      payload.images.map(async (image) => ({
        blob: await dataUrlToBlob(image.data_url),
        revisedPrompt: image.revised_prompt
      }))
    );
  },

  async generateStream(request, onImage) {
    const total = Math.max(1, Math.min(request.count, 4));
    const results: GeneratedCharacter[] = [];

    // 串行生成，出一张显示一张
    for (let i = 0; i < total; i++) {
      const form = new FormData();
      form.append("prompt", request.prompt);
      form.append("negative_prompt", request.negativePrompt);
      form.append("size", String(request.size));
      form.append("count", "1");
      if (request.referenceImage) form.append("reference_image", request.referenceImage);

      const response = await fetch("/api/character/generate", {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `AI 服务请求失败：${response.status}`);
      }

      const payload = (await response.json()) as {
        images: Array<{data_url: string; revised_prompt?: string}>;
      };

      if (payload.images?.[0]) {
        const blob = await dataUrlToBlob(payload.images[0].data_url);
        const character = {
          blob,
          revisedPrompt: payload.images[0].revised_prompt
        };
        results.push(character);
        onImage?.(character, i, total);
      }
    }

    return results;
  }
};
