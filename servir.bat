@echo off
REM Sobe um servidor local para testar o checklist do jeito mais parecido
REM com o GitHub Pages. Feche esta janela para parar.
cd /d "%~dp0"
echo.
echo   Checklist Financeiro - servidor local
echo   ------------------------------------
echo   Abra no navegador: http://localhost:8123/index.html
echo.
echo   Feche esta janela para parar o servidor.
echo.
start "" http://localhost:8123/index.html
python -m http.server 8123
