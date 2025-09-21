@echo off
REM 🔄 Quick Cache Version Update Script for Windows
REM Быстрое обновление версий для предотвращения кеширования

echo 🔄 Updating cache versions...

REM Генерируем новую версию на основе timestamp
for /f %%i in ('powershell -Command "([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"') do set NEW_VERSION=%%i

echo 📅 New version: %NEW_VERSION%

REM Обновляем index.html
echo 📝 Updating index.html...
powershell -Command "(Get-Content 'index.html') -replace '\?v=\d+', '?v=%NEW_VERSION%' | Set-Content 'index.html'"

REM Обновляем tournament-lobby.html
echo 📝 Updating tournament/tournament-lobby.html...
powershell -Command "(Get-Content 'tournament/tournament-lobby.html') -replace '\?v=\d+', '?v=%NEW_VERSION%' | Set-Content 'tournament/tournament-lobby.html'"

echo ✅ Cache version updated to: %NEW_VERSION%
echo 🎉 All files will now bypass browser cache!
echo.
echo 🔍 To verify changes:
echo    findstr "?v=" index.html
echo    findstr "?v=" tournament/tournament-lobby.html

pause