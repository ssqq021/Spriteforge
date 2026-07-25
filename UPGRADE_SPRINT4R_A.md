# Sprint 4R-A 覆盖升级

1. 在 Vite 终端按 `Ctrl + C`。
2. 将压缩包内容覆盖到本地 `E:\Spriteforge`。
3. 不要清除浏览器网站数据。
4. 运行：

```powershell
cd E:\Spriteforge\frontend
npm install
npm run dev
```

5. 浏览器按 `Ctrl + F5`。
6. 验收后执行：

```powershell
npm run build
cd ..
git add .
git commit -m "feat: add AI Studio character generation workflow"
git push origin develop
```
