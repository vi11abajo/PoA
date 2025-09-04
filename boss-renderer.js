// 👑 PHAROS INVADERS - BOSS RENDERER
// Система отрисовки боссов с эффектами

// Logger.log('🎨 Loading boss renderer...'); // Removed - Logger not available yet

// Отрисовка босса
function drawBoss(ctx) {
    const boss = window.BOSS_SYSTEM.getCurrentBoss();
    if (!boss) return;

    ctx.save();

    // Применяем эффекты масштабирования и прозрачности
    ctx.globalAlpha = boss.alpha;

    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    // Применяем масштабирование
    ctx.translate(centerX, centerY);
    ctx.scale(boss.scale, boss.scale);
    ctx.translate(-centerX, -centerY);

    // НОВОЕ: Красивая аура при получении урона вместо квадрата (уменьшенный размер)
    if (boss.flashAlpha > 0) {
        const pulseSize = 10 + boss.flashAlpha * 15; // Уменьшено в 2 раза
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, boss.width * 0.4 // Уменьшено в 2 раза
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${boss.flashAlpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 100, ${boss.flashAlpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, boss.width * 0.4, 0, Math.PI * 2); // Уменьшено в 2 раза
        ctx.fill();

        // Дополнительное свечение
        ctx.shadowColor = '#ff6666';
        ctx.shadowBlur = 15 * boss.flashAlpha; // Уменьшено в 2 раза
    }

    // Отрисовка изображения босса с правильными пропорциями
    if (bossImagesLoaded[boss.bossNumber] && boss.image && boss.image.complete) {
        // ИСПРАВЛЕНО: Сохраняем пропорции оригинального изображения
        const originalWidth = boss.image.naturalWidth;
        const originalHeight = boss.image.naturalHeight;
        const aspectRatio = originalWidth / originalHeight;

        let renderWidth, renderHeight;

        // Подгоняем размер под наш контейнер, сохраняя пропорции
        if (aspectRatio > 1) {
            // Изображение шире чем выше
            renderWidth = boss.width * 1.2; // Увеличено с 0.8 до 1.2 (в 1.5 раза)
            renderHeight = renderWidth / aspectRatio;
        } else {
            // Изображение выше чем шире
            renderHeight = boss.height * 1.2; // Увеличено с 0.8 до 1.2 (в 1.5 раза)
            renderWidth = renderHeight * aspectRatio;
        }

        const renderX = centerX - renderWidth / 2;
        const renderY = centerY - renderHeight / 2;

        ctx.shadowColor = boss.color;
        ctx.shadowBlur = 15;

        ctx.drawImage(
            boss.image,
            renderX,
            renderY,
            renderWidth,
            renderHeight
        );

        ctx.shadowBlur = 0;
    } else {
        // Fallback - рисуем простого босса
        ctx.fillStyle = boss.color;
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = boss.color;
        ctx.shadowBlur = 10;
        ctx.fillText('👑🦀', centerX, centerY + 40);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// Отрисовка полоски здоровья босса
function drawBossHealthBar(ctx) {
    const boss = window.BOSS_SYSTEM.getCurrentBoss();
    if (!boss || boss.state === 'dead') return;

    const canvas = window.canvas ||
               document.getElementById('gameCanvas') ||
               document.getElementById('tournamentGameCanvas');

        if (!canvas) {
            Logger.error('❌ Canvas not found in drawBossHealthBar');
            return;
        }
    const barWidth = 300;
    const barHeight = 20;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = 30;

    ctx.save();

    // Фон полоски здоровья
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // Рамка
    ctx.strokeStyle = '#00ddff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

    // Фон здоровья
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Текущее здоровье
    const healthPercentage = boss.currentHP / boss.maxHP;
    const healthWidth = barWidth * healthPercentage;

    // Градиент здоровья (зеленый -> желтый -> красный)
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    if (healthPercentage > 0.6) {
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#88ff00');
    } else if (healthPercentage > 0.3) {
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ff8800');
    } else {
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff4444');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, healthWidth, barHeight);

    // Имя босса
    ctx.fillStyle = '#00ddff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, canvas.width / 2, barY - 10);

    // Текст здоровья
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${boss.currentHP} / ${boss.maxHP}`, canvas.width / 2, barY + 15);

    ctx.restore();
}

// Отрисовка пуль босса
function drawBossBullets(ctx) {
    const bullets = window.BOSS_SYSTEM.getBossBullets();

    for (let bullet of bullets) {
        ctx.save();

        // Рисуем след пули
        if (bullet.trail.length > 1) {
            ctx.strokeStyle = bullet.color;
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.6;

            ctx.beginPath();
            for (let i = 0; i < bullet.trail.length - 1; i++) {
                const alpha = i / bullet.trail.length;
                ctx.globalAlpha = alpha * 0.6;

                if (i === 0) {
                    ctx.moveTo(bullet.trail[i].x, bullet.trail[i].y);
                } else {
                    ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
                }
            }
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Рисуем саму пулю
        const centerX = bullet.x + bullet.width / 2;
        const centerY = bullet.y + bullet.height / 2;

        // Внешний круг
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Внутренний круг с эффектом свечения
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bullet.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Центральная точка
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Отрисовка частиц босса
function drawBossParticles(ctx) {
    const particles = window.BOSS_SYSTEM.getBossParticles();

    for (let particle of particles) {
        ctx.save();

        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;

        // Разные эффекты для разных типов частиц
        switch (particle.type) {
            case 'landing':
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 5;
                break;

            case 'hit':
                ctx.fillStyle = particle.color;
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 8;
                break;

            case 'death':
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                break;

            case 'explosion':
                ctx.fillStyle = particle.color;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 15;
                break;

            default:
                ctx.fillStyle = particle.color;
                break;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Отрисовка предупреждения о появлении босса
function drawBossWarning(ctx, level) {
    if (!isBossLevel(level)) return;

    const canvas = window.canvas ||
                   document.getElementById('gameCanvas') ||
                   document.getElementById('tournamentGameCanvas');

    if (!canvas) {
        Logger.error('❌ Canvas not found in drawBossHealthBar');
        return;
    }
    const bossNumber = getBossNumber(level);
    const bossName = getBossName(bossNumber);

    ctx.save();

    // Затемнение экрана
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Мигающий эффект
    const flashAlpha = Math.abs(Math.sin(Date.now() * 0.01));
    ctx.globalAlpha = flashAlpha;

    // Предупреждающий текст
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    ctx.strokeText('⚠️ BOSS APPROACHING ⚠️', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText('⚠️ BOSS APPROACHING ⚠️', canvas.width / 2, canvas.height / 2 - 50);

    // Имя босса
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = getBossColor(bossNumber);
    ctx.strokeText(bossName, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(bossName, canvas.width / 2, canvas.height / 2 + 20);

    ctx.restore();
}

// Отрисовка индикатора босса на мини-карте
function drawBossIndicator(ctx) {
    const boss = window.BOSS_SYSTEM.getCurrentBoss();
    if (!boss) return;

    const canvas = window.canvas ||
                   document.getElementById('gameCanvas') ||
                   document.getElementById('tournamentGameCanvas');

    if (!canvas) {
        Logger.error('❌ Canvas not found in drawBossHealthBar');
        return;
    }

    // Мини-карта в правом верхнем углу
    const miniMapSize = 80;
    const miniMapX = canvas.width - miniMapSize - 10;
    const miniMapY = 10;

    ctx.save();

    // Фон мини-карты
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);

    // Рамка
    ctx.strokeStyle = '#00ddff';
    ctx.lineWidth = 2;
    ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);

    // Позиция босса на мини-карте
    const bossMapX = miniMapX + (boss.x / canvas.width) * miniMapSize;
    const bossMapY = miniMapY + (boss.y / canvas.height) * miniMapSize;

    // Точка босса
    ctx.fillStyle = boss.color;
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(bossMapX, bossMapY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Пульсирующий эффект
    const pulseSize = 4 + Math.sin(Date.now() * 0.01) * 2;
    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(bossMapX, bossMapY, pulseSize, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

// Главная функция отрисовки всех элементов босса
function renderBossSystem(ctx) {
    // Рисуем частицы (под боссом)
    drawBossParticles(ctx);

    // Рисуем пули босса
    drawBossBullets(ctx);

    // Рисуем самого босса
    drawBoss(ctx);

    // Рисуем UI элементы
    drawBossHealthBar(ctx);
    // УБРАНО: drawBossIndicator(ctx); - мини-карта больше не отображается
}

// Экспорт функций
window.BOSS_RENDERER = {
    renderBossSystem,
    drawBoss,
    drawBossHealthBar,
    drawBossBullets,
    drawBossParticles,
    drawBossWarning,
    drawBossIndicator
};

Logger.log('🎨 Boss renderer loaded successfully!');