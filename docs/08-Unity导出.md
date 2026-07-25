# Unity 导出

## 目标

用户导出后，不再逐张设置 Texture Type、切片、AnimationClip 和 Animator。

## Web 端导出内容

```text
CharacterName/
├── Textures/
│   └── Character_Action_Direction.png
├── Metadata/
│   └── spriteforge.json
├── Preview/
│   └── Character_Action.gif
└── Source/
    └── 可选源文件
```

## Unity 插件职责

1. 读取 `spriteforge.json`
2. 设置 TextureImporter
3. 设置 Sprite Mode 为 Multiple
4. 按 Rect 创建切片
5. 设置 Pivot、PPU 和 Filter Mode
6. 创建 AnimationClip
7. 设置 Loop
8. 创建 Animator Controller
9. 创建 Prefab
10. 输出导入报告

## MVP 支持

- Unity 2022.3 LTS
- Unity 6
- Built-in / URP 无差异的 2D Sprite
- PNG
- Multiple Sprite
- AnimationClip
- Animator Controller
- Prefab

## JSON 示例

```json
{
  "schemaVersion": "1.0",
  "character": "GuanYu",
  "action": "Attack",
  "direction": "South",
  "texture": "Textures/GuanYu_Attack_South.png",
  "frameWidth": 256,
  "frameHeight": 256,
  "frames": 16,
  "columns": 4,
  "rows": 4,
  "fps": 12,
  "loop": false,
  "pixelsPerUnit": 100,
  "pivot": [0.5, 0.1]
}
```

## 不建议 MVP 直接生成 `.unitypackage`

第一阶段优先输出 ZIP + Unity 插件导入。

原因：

- `.unitypackage` 依赖 Unity 环境生成
- 服务端直接构造兼容性和维护成本高
- 插件导入更透明，也更容易调试

稳定后再增加 Unity BatchMode 自动打包。
