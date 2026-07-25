@echo off
chcp 65001 >nul
start "SpriteForge API" cmd /k "cd /d %~dp0server && if not exist .venv py -m venv .venv && call .venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"
start "SpriteForge Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"
echo SpriteForge frontend and AI server are starting...
