# Sprint 4R-B 覆盖升级

1. 停止当前 Vite。
2. 将压缩包内容覆盖到 `E:\Spriteforge`。
3. 不清除浏览器数据。
4. 先测试 Mock：

```powershell
cd E:\Spriteforge\frontend
npm install
npm run dev
```

5. 使用真实 AI 时，复制：

```text
server\.env.example
```

为：

```text
server\.env
```

填写 `OPENAI_API_KEY`，然后双击：

```text
start_all_windows.bat
```
