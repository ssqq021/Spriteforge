export type BackgroundMode = "none" | "remove-black";
export type AnchorMode = "center" | "bottom-center" | "custom";

export interface ProcessingOptions {
  backgroundMode: BackgroundMode;
  blackThreshold: number;
  alphaFeather: number;
  autoTrim: boolean;
  trimPadding: number;
  canvasWidth: number;
  canvasHeight: number;
  anchor: AnchorMode;
  pivotX: number;
  pivotY: number;
  scaleMode: "contain" | "original";
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
}

function loadBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("图片编码失败")),
      "image/png"
    );
  });
}

function removeBlackBackground(
  imageData: ImageData,
  threshold: number,
  feather: number
) {
  const data = imageData.data;
  const safeThreshold = Math.max(0, Math.min(255, threshold));
  const safeFeather = Math.max(0, Math.min(128, feather));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];

    const brightness = Math.max(r, g, b);
    if (brightness <= safeThreshold) {
      data[i + 3] = 0;
      continue;
    }

    if (safeFeather > 0 && brightness < safeThreshold + safeFeather) {
      const factor = (brightness - safeThreshold) / safeFeather;
      data[i + 3] = Math.round(alpha * factor);
    }
  }
}

function getAlphaBounds(imageData: ImageData) {
  const {width, height, data} = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 2) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return {x: 0, y: 0, width, height};
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

export async function processImage(
  source: Blob,
  options: ProcessingOptions
): Promise<ProcessedImage> {
  const bitmap = await loadBitmap(source);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = bitmap.width;
  sourceCanvas.height = bitmap.height;
  const sourceContext = sourceCanvas.getContext("2d", {willReadFrequently: true});
  if (!sourceContext) throw new Error("无法创建图片处理画布");

  sourceContext.clearRect(0, 0, bitmap.width, bitmap.height);
  sourceContext.drawImage(bitmap, 0, 0);

  const imageData = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height
  );

  if (options.backgroundMode === "remove-black") {
    removeBlackBackground(imageData, options.blackThreshold, options.alphaFeather);
    sourceContext.putImageData(imageData, 0, 0);
  }

  let crop = {x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height};

  if (options.autoTrim) {
    const trimmedData = sourceContext.getImageData(
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height
    );
    const bounds = getAlphaBounds(trimmedData);
    const padding = Math.max(0, options.trimPadding);

    crop = {
      x: Math.max(0, bounds.x - padding),
      y: Math.max(0, bounds.y - padding),
      width: Math.min(
        sourceCanvas.width - Math.max(0, bounds.x - padding),
        bounds.width + padding * 2
      ),
      height: Math.min(
        sourceCanvas.height - Math.max(0, bounds.y - padding),
        bounds.height + padding * 2
      )
    };
  }

  const outputWidth = Math.max(1, Math.round(options.canvasWidth));
  const outputHeight = Math.max(1, Math.round(options.canvasHeight));
  const output = document.createElement("canvas");
  output.width = outputWidth;
  output.height = outputHeight;

  const context = output.getContext("2d");
  if (!context) throw new Error("无法创建输出画布");
  context.clearRect(0, 0, outputWidth, outputHeight);

  let drawWidth = crop.width;
  let drawHeight = crop.height;

  if (options.scaleMode === "contain") {
    const scale = Math.min(outputWidth / crop.width, outputHeight / crop.height, 1);
    drawWidth = Math.max(1, Math.round(crop.width * scale));
    drawHeight = Math.max(1, Math.round(crop.height * scale));
  }

  let pivotX = options.pivotX;
  let pivotY = options.pivotY;

  if (options.anchor === "center") {
    pivotX = 0.5;
    pivotY = 0.5;
  } else if (options.anchor === "bottom-center") {
    pivotX = 0.5;
    pivotY = 1;
  }

  const targetX = Math.round(outputWidth * pivotX - drawWidth * pivotX);
  const targetY = Math.round(outputHeight * pivotY - drawHeight * pivotY);

  context.drawImage(
    sourceCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    targetX,
    targetY,
    drawWidth,
    drawHeight
  );

  bitmap.close();

  return {
    blob: await canvasToBlob(output),
    width: outputWidth,
    height: outputHeight,
    pivotX,
    pivotY
  };
}
