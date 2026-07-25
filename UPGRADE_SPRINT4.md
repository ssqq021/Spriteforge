# Sprint 4 覆盖升级

1. 在 Vite 终端按 `Ctrl + C`。
2. 将压缩包内容覆盖到本地 `E:\Spriteforge`。
3. 不要删除浏览器网站数据。
4. 运行：

```powershell
cd E:\Spriteforge\frontend
npm install
npm run dev
```

5. 浏览器按 `Ctrl + F5`。
6. 验收通过后：

```powershell
npm run build
cd ..
git add .
git commit -m "feat: add batch image processing pipeline"
git push origin develop
```
