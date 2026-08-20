@echo off
cd /d "%~dp0"
echo Abriendo servidor local en http://127.0.0.1:8080/
echo.
echo Deja esta ventana abierta mientras revisas el sitio.
echo Para cerrar el servidor, cierra esta ventana o presiona Ctrl+C.
echo.
"C:\Program Files\nodejs\node.exe" local-server.js
pause
