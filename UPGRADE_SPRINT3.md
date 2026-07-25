# 覆盖升级

1. 在 Vite 终端按 `Ctrl + C`。
2. 将本压缩包内容覆盖到本地 Spriteforge 仓库。
3. 不要删除浏览器网站数据，Sprint 2 元数据可以继续保留。
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
git commit -m "feat: add IndexedDB assets and video frame extraction"
git push origin develop
```
