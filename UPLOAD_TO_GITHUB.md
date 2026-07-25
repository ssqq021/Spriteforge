# 上传到 GitHub

当前 ChatGPT GitHub 连接没有返回可写仓库，因此无法直接提交。

## 建议仓库

- Owner：`ssqq021`
- Repository：`spriteforge`
- Visibility：先设为 Private
- Initialize：不要勾选 README（本包已包含）

## Windows PowerShell

```powershell
cd spriteforge
git init
git add .
git commit -m "docs: initialize SpriteForge product plan"
git branch -M main
git remote add origin https://github.com/ssqq021/spriteforge.git
git push -u origin main
```

仓库创建并授权给 ChatGPT GitHub 连接后，可继续自动创建 Issues、分支和 PR。
