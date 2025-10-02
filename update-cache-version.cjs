#!/usr/bin/env node

/**
 * 🔄 Cache Version Updater
 * Автоматически обновляет версии всех JS/CSS файлов для предотвращения кеширования
 */

const fs = require('fs');
const path = require('path');

// Генерируем новую версию на основе timestamp
const newVersion = Math.floor(Date.now() / 1000);

console.log(`🔄 Updating cache version to: ${newVersion}`);

// Файлы для обновления
const htmlFiles = [
    'index.html',
    'tournament/tournament-lobby.html'
];

// Функция обновления версий в файле
function updateVersionsInFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Обновляем версии в script и link тегах
    content = content.replace(
        /(src|href)="([^"]+\.(js|css))\?v=\d+"/g,
        (match, attr, file, ext) => {
            updated = true;
            return `${attr}="${file}?v=${newVersion}"`;
        }
    );

    // Добавляем версии к файлам без версий (кроме внешних CDN)
    content = content.replace(
        /(src|href)="([^"]+\.(js|css))"/g,
        (match, attr, file, ext) => {
            // Пропускаем внешние ссылки
            if (file.startsWith('http') || file.startsWith('//')) {
                return match;
            }
            updated = true;
            return `${attr}="${file}?v=${newVersion}"`;
        }
    );

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
    } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
    }
}

// Обновляем все HTML файлы
htmlFiles.forEach(updateVersionsInFile);

console.log(`🎉 Cache version update completed! New version: ${newVersion}`);
console.log(`💡 Users will now get fresh files without cache issues.`);