# SpriteForge 豆包 Provider 补丁

## 覆盖位置

将压缩包里的内容复制到：

```text
E:\Spriteforge\server
```

如果你的后端目录叫 `backend`，则复制到实际运行 `main.py` 的目录。

## 配置

1. 把 `.env.example` 复制为 `.env`
2. 填写：

```env
AI_PROVIDER=doubao
DOUBAO_API_KEY=你的火山方舟APIKey
DOUBAO_MODEL=你的Seedream模型ID或ep接入点ID
```

推荐在火山方舟控制台创建 Seedream 推理接入点，然后填写 `ep-...`。

## 安装依赖

```powershell
cd E:\Spriteforge\server
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 启动

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 验证

浏览器打开：

```text
http://127.0.0.1:8000/api/health
```

正确配置时会看到：

```json
{
  "ok": true,
  "provider": "doubao",
  "model": "ep-..."
}
```

然后回到前端生成角色。

## 接口兼容

生成接口保持为：

```text
POST /api/character/generate
```

返回值同时包含：

- `image_url`
- `imageUrl`
- `url`

因此可兼容现有前端的常见字段读取方式。
