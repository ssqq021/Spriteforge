export type CharacterTemplateId =
  | "three-kingdoms-general"
  | "voodoo-casual"
  | "stylized-fantasy"
  | "cute-adventurer"
  | "custom";

export type CharacterTemplate = {
  id: CharacterTemplateId;
  name: string;
  description: string;
  prompt: string;
  negativePrompt: string;
  defaultStyle: string;
};

export const characterTemplates: CharacterTemplate[] = [
  {
    id: "three-kingdoms-general",
    name: "三国武将",
    description: "适合关羽、赵云、张飞等东方武将角色。",
    prompt:
      "东方三国题材武将，清晰可识别的历史人物特征，五头身，3D stylized casual mobile game character，完整全身像，正交感视角，武器完整显示，人物居中，双脚完整，轮廓清晰，材质简洁但有层次，适合 Unity 手机游戏角色资产，纯净透明背景",
    negativePrompt:
      "文字，水印，logo，写实摄影，模糊，低清晰度，重复人物，多余肢体，缺失手指，武器残缺，身体裁切，脚部裁切，复杂背景，强透视，过度写实",
    defaultStyle: "Chinese Adventure"
  },
  {
    id: "voodoo-casual",
    name: "Voodoo 休闲",
    description: "简洁、明亮、易读的超休闲 3D 角色。",
    prompt:
      "Voodoo style 3D casual mobile game character，简洁几何造型，明亮纯色，五头身，完整全身像，轮廓清晰，低复杂度材质，人物居中，双脚完整，适合小尺寸游戏画面，透明背景",
    negativePrompt:
      "文字，水印，复杂纹理，暗黑写实，摄影感，模糊，重复人物，多余肢体，身体裁切，复杂背景",
    defaultStyle: "Voodoo Style"
  },
  {
    id: "stylized-fantasy",
    name: "欧美幻想",
    description: "适合战士、法师、弓箭手和怪物。",
    prompt:
      "stylized fantasy game character，3D casual RPG art style，五头身，清晰职业特征，完整全身像，武器和装备完整，人物居中，轮廓易读，适合 Unity mobile game，透明背景",
    negativePrompt:
      "文字，水印，照片写实，模糊，低清晰度，多余肢体，装备残缺，身体裁切，复杂场景背景",
    defaultStyle: "Stylized Fantasy"
  },
  {
    id: "cute-adventurer",
    name: "Q版冒险者",
    description: "更可爱、更轻松的手游角色。",
    prompt:
      "cute stylized 3D adventure game character，Q版五头身，可爱但具有职业辨识度，完整全身像，人物居中，双脚完整，柔和材质，清晰轮廓，透明背景，适合休闲手游",
    negativePrompt:
      "文字，水印，恐怖，写实摄影，模糊，低清晰度，多余肢体，身体裁切，复杂背景",
    defaultStyle: "3D Casual"
  },
  {
    id: "custom",
    name: "自定义",
    description: "只使用你手动填写的 Prompt。",
    prompt: "",
    negativePrompt: "",
    defaultStyle: "Custom"
  }
];

export function getCharacterTemplate(id: CharacterTemplateId) {
  return characterTemplates.find((template) => template.id === id) ?? characterTemplates[0];
}

export function buildCharacterPrompt(input: {
  templateId: CharacterTemplateId;
  characterName: string;
  manualPrompt: string;
  direction: "front" | "back" | "side";
  resolution: number;
  style: string;
}) {
  const template = getCharacterTemplate(input.templateId);
  const directionMap = {
    front: "front view，正面",
    back: "back view，背面",
    side: "side view，侧面"
  };

  return [
    `角色名称：${input.characterName}`,
    template.prompt,
    input.manualPrompt.trim(),
    `方向：${directionMap[input.direction]}`,
    `风格：${input.style}`,
    `输出要求：${input.resolution}×${input.resolution} PNG，单个角色，透明背景`,
    "构图要求：完整单人全身站立，人物、头饰、双手、双脚和整件武器都必须在画面内；主体约占画面高度 75%，四周至少保留 10% 留白，任何部分不得触碰或超出画布边缘。",
    "Avoid close-up, cropped, cut off, out of frame, partial body, missing feet, truncated weapon, edge touching."
  ]
    .filter(Boolean)
    .join("；");
}
