@echo off
cd /d "%~dp0"
set PYTHONPATH=%~dp0
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
) else (
  python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
)
pause
