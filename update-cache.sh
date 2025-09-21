#!/bin/bash

# 🔄 Quick Cache Version Update Script
# Быстрое обновление версий для предотвращения кеширования

echo "🔄 Updating cache versions..."

# Генерируем новую версию
NEW_VERSION=$(date +%s)
echo "📅 New version: $NEW_VERSION"

# Обновляем index.html
echo "📝 Updating index.html..."
sed -i.bak -E "s/(\?v=)[0-9]+/\1$NEW_VERSION/g" index.html

# Обновляем tournament-lobby.html
echo "📝 Updating tournament/tournament-lobby.html..."
sed -i.bak -E "s/(\?v=)[0-9]+/\1$NEW_VERSION/g" tournament/tournament-lobby.html

# Удаляем backup файлы
rm -f index.html.bak tournament/tournament-lobby.html.bak

echo "✅ Cache version updated to: $NEW_VERSION"
echo "🎉 All files will now bypass browser cache!"
echo ""
echo "🔍 To verify changes:"
echo "   grep '?v=' index.html"
echo "   grep '?v=' tournament/tournament-lobby.html"