# Sprint 4R-B：角色模板、手动 Prompt 与真实 AI Provider

## 核心变化

角色生成现在支持：

1. 选择专业游戏角色模板
2. 手动填写 Prompt
3. 自动拼接最终 Prompt
4. 保留 Negative Prompt
5. 在 Mock Provider 与真实 AI Provider 之间切换
6. 真实 API Key 只存放在后端

## 内置模板

- 三国武将
- Voodoo 休闲
- 欧美幻想
- Q版冒险者
- 自定义

模板不会覆盖手动 Prompt。最终 Prompt 的顺序为：

角色名称
→ 模板 Prompt
→ 手动 Prompt
→ 方向
→ 风格
→ 输出规格

## 真实 AI 模式

后端目录：

```text
server/
```

配置：

1. 复制 `server/.env.example` 为 `server/.env`
2. 填写 `OPENAI_API_KEY`
3. 启动：

```powershell
cd E:\Spriteforge\server
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

前端：

```powershell
cd E:\Spriteforge\frontend
npm install
npm run dev
```

也可以双击：

```text
start_all_windows.bat
```

## 验收

### 模板流程

1. 进入 AI Studio。
2. 选择“三国武将”。
3. 角色名输入“关羽”。
4. 手动 Prompt 填写：
   `丹凤眼，卧蚕眉，长髯，绿色战袍，完整青龙偃月刀`
5. 检查“最终 Prompt 预览”同时包含模板和手动内容。
6. 切换到“自定义”，确认模板内容消失，但手动 Prompt 保留。

### Mock 流程

1. 生成服务选择 Mock。
2. 生成四个测试候选。
3. 检查任务、结果和持久化。

### 真实 AI 流程

1. 配置后端 Key。
2. 生成服务选择 SpriteForge Server。
3. 生成四个真实角色候选。
4. 上传参考图后再次生成。
5. 确认 API Key 没有出现在浏览器代码或 LocalStorage 中。

## 说明

真实生成输出目前统一请求 1024×1024，再由后续后处理模块缩放为
256×256 或 512×512，以保证生成质量和角色细节。
