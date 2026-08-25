@echo off
cd /d "%~dp0"
python descargar_playlist.py
if errorlevel 1 pause
