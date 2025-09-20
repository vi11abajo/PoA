// 🎨 PHAROS INVADERS - РЕНДЕРИНГ БОСОВ


Object.assign(BossSystemV2.prototype, {
    // 🎨 ГЛАВНЫЙ МЕТОД РЕНДЕРИНГА
    render(ctx) {
        if (!ctx || !this.currentBoss) return;
        
        // Рендерим специальные эффекты экрана
        this.renderScreenEffects(ctx);
        
        // Рендерим частицы (под боссом)
        this.renderParticles(ctx);
        
        // Рендерим предупреждения о метеоритах
        this.renderMeteorWarnings(ctx);
        
        // Рендерим пули босса
        this.renderBossBullets(ctx);
        
        // Рендерим самого босса
        this.renderBoss(ctx);
        
        // Рендерим UI элементы
        this.renderBossUI(ctx);
    },

    // 🎭 РЕНДЕРИНГ БОСА
    renderBoss(ctx) {
        const boss = this.currentBoss;
        if (!boss) {
            // Скрываем overlay если босса нет
            if (this.bossGifOverlay) {
                this.bossGifOverlay.style.display = 'none';
            }
            return;
        }
        
        ctx.save();
        
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        // Эффект мигания при получении урона
        if (boss.damageFlash > 0) {
            const flashIntensity = boss.damageFlash / 300;
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.02) * 0.3 * flashIntensity;
            
            ctx.shadowColor = '#ff6666';
            ctx.shadowBlur = 20 * flashIntensity;
        }
        
        // Эффект свечения и мигания для Rage Mode (босс 4)
        if (boss.bossNumber === 4 && boss.uniqueData.rageMode) {
            const rageTime = Date.now() * 0.015; // Скорость мигания
            const rageIntensity = 0.8 + Math.sin(rageTime) * 0.2; // Интенсивность 0.6-1.0
            
            ctx.globalAlpha = Math.min(ctx.globalAlpha, rageIntensity);
            ctx.shadowColor = '#ff3300'; // Красно-оранжевое свечение
            ctx.shadowBlur = 25 + Math.sin(rageTime * 1.3) * 15; // Пульсирующее свечение 10-40px
        }
        
        // Специальные эффекты в зависимости от состояния
        switch(boss.state) {
            case 'appearing':
                ctx.globalAlpha = Math.min(1, (boss.baseY - boss.y + boss.height) / boss.height);
                break;
                
            case 'phase_transition':
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.4;
                ctx.shadowColor = boss.color;
                ctx.shadowBlur = 30;
                break;
                
            case 'dying':
                ctx.globalAlpha = Math.max(0.1, 1 - (Date.now() - (boss.deathStartTime || Date.now())) / 3000);
                break;
        }
        
        // Отрисовка изображения босса
        if (this.bossImagesLoaded[boss.bossNumber] && this.bossImages[boss.bossNumber]) {
            const img = this.bossImages[boss.bossNumber];
            const gifData = this.bossGifData && this.bossGifData[boss.bossNumber];

            // Определяем размеры для отрисовки
            const aspectRatio = img.naturalWidth / img.naturalHeight || 1;
            let renderWidth, renderHeight;

            if (aspectRatio > 1) {
                renderWidth = boss.width;
                renderHeight = boss.width / aspectRatio;
            } else {
                renderHeight = boss.height;
                renderWidth = boss.height * aspectRatio;
            }

            const renderX = centerX - renderWidth / 2;
            const renderY = centerY - renderHeight / 2;

            // Если есть GIF, не рисуем статичную картинку
            if (!gifData || !gifData.isGif) {
                // Отрисовка PNG основы в Canvas только если нет GIF анимации
                ctx.drawImage(img, renderX, renderY, renderWidth, renderHeight);
            }

            // Обновляем GIF overlay если есть анимация
            this.updateGifOverlay(boss, gifData, renderX, renderY, renderWidth, renderHeight);
        } else {
            // Fallback - простой прямоугольник с эмодзи
            ctx.fillStyle = boss.color;
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👑', centerX, centerY + 20);
        }
        
        // Специальные эффекты для разных босов
        this.renderBossSpecialEffects(ctx, boss);

        ctx.restore();
    },

    // 🎬 ОБНОВЛЕНИЕ GIF OVERLAY
    updateGifOverlay(boss, gifData, renderX, renderY, renderWidth, renderHeight) {
        if (!this.bossGifOverlay) return;

        // Если босса нет, скрываем overlay
        if (!boss) {
            this.bossGifOverlay.style.display = 'none';
            return;
        }

        if (gifData && gifData.isGif && gifData.gifPath) {
            // Получаем позицию canvas относительно страницы
            const canvas = this.getCanvas();
            if (!canvas) return;

            const canvasRect = canvas.getBoundingClientRect();
            const absoluteX = canvasRect.left + renderX;
            const absoluteY = canvasRect.top + renderY;

            // Показываем и позиционируем GIF overlay
            this.bossGifOverlay.style.display = 'block';
            this.bossGifOverlay.style.left = absoluteX + 'px';
            this.bossGifOverlay.style.top = absoluteY + 'px';
            this.bossGifOverlay.style.width = renderWidth + 'px';
            this.bossGifOverlay.style.height = renderHeight + 'px';
            this.bossGifOverlay.style.backgroundImage = `url('${gifData.gifPath}')`;
            this.bossGifOverlay.style.backgroundSize = 'contain';
            this.bossGifOverlay.style.backgroundRepeat = 'no-repeat';
            this.bossGifOverlay.style.backgroundPosition = 'center';

            // Применяем те же эффекты что и к canvas боссу
            if (boss.damageFlash > 0) {
                const flashIntensity = boss.damageFlash / 300;
                this.bossGifOverlay.style.filter = `brightness(${1 + flashIntensity}) drop-shadow(0 0 ${20 * flashIntensity}px #ff6666)`;
            } else if (boss.bossNumber === 4 && boss.uniqueData && boss.uniqueData.rageMode) {
                const rageTime = Date.now() * 0.015;
                const rageIntensity = 0.8 + Math.sin(rageTime) * 0.2;
                this.bossGifOverlay.style.filter = `brightness(${rageIntensity}) drop-shadow(0 0 25px #ff3300)`;
            } else {
                this.bossGifOverlay.style.filter = 'none';
            }

            // Обрабатываем состояния босса
            switch(boss.state) {
                case 'appearing':
                    const appearAlpha = Math.min(1, (boss.baseY - boss.y + boss.height) / boss.height);
                    this.bossGifOverlay.style.opacity = appearAlpha;
                    break;
                case 'phase_transition':
                    const transitionAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.4;
                    this.bossGifOverlay.style.opacity = transitionAlpha;
                    break;
                case 'dying':
                    const dyingAlpha = Math.max(0.1, 1 - (Date.now() - (boss.deathStartTime || Date.now())) / 3000);
                    this.bossGifOverlay.style.opacity = dyingAlpha;

                    // Скрываем overlay если анимация смерти завершена
                    if (dyingAlpha <= 0.1) {
                        this.bossGifOverlay.style.display = 'none';
                    }
                    break;
                default:
                    this.bossGifOverlay.style.opacity = 1;
                    break;
            }
        } else {
            // Скрываем overlay если GIF нет
            this.bossGifOverlay.style.display = 'none';
        }
    },

    // ✨ СПЕЦИАЛЬНЫЕ ЭФФЕКТЫ БОСОВ
    renderBossSpecialEffects(ctx, boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        switch(boss.bossNumber) {
            case 2: // Azure Leviathan - щит
                if (boss.uniqueData.shieldHP > 0) {
                    this.renderWaterShield(ctx, centerX, centerY, boss.width * 0.574);
                }
                break;
                
            case 4: // Crimson Behemoth - режим ярости (убран визуальный круг)
                // Визуальный круг убран по запросу - только мигание босса
                break;
        }
    },

    // 💧 Рендеринг водного щита
    renderWaterShield(ctx, centerX, centerY, radius) {
        ctx.save();
        
        const time = Date.now() * 0.005;
        const alpha = 0.3 + Math.sin(time) * 0.2;
        
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#0099ff';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + Math.sin(time * 2) * 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    },

    // 🔥 Рендеринг ауры ярости
    renderRageAura(ctx, centerX, centerY, radius) {
        ctx.save();
        
        const time = Date.now() * 0.01;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 51, 51, 0)');
        gradient.addColorStop(0.7, 'rgba(255, 51, 51, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 136, 0, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6 + Math.sin(time) * 0.4;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.8 + Math.sin(time * 2) * 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    },

    // 🚀 РЕНДЕРИНГ ПУЛЬ БОСА
    renderBossBullets(ctx) {
        for (const bullet of this.bossBullets) {
            ctx.save();
            
            const centerX = bullet.x + bullet.width / 2;
            const centerY = bullet.y + bullet.height / 2;
            
            if (bullet.trail && bullet.trail.length > 1) {
                this.renderBulletTrail(ctx, bullet);
            }
            
            switch(bullet.type) {
                case 'meteor':
                    this.renderMeteorBullet(ctx, bullet, centerX, centerY);
                    break;
                case 'explosive':
                    this.renderExplosiveBullet(ctx, bullet, centerX, centerY);
                    break;
                default:
                    this.renderStandardBullet(ctx, bullet, centerX, centerY);
                    break;
            }
            
            ctx.restore();
        }
    },

    // 🌟 Рендеринг следа пули
    renderBulletTrail(ctx, bullet) {
        if (!bullet.trail || bullet.trail.length < 2) return;
        
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = 3;
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
        
        ctx.globalAlpha = 1;
    },

    // ☄️ Рендеринг метеорной пули
    renderMeteorBullet(ctx, bullet, centerX, centerY) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bullet.width);
        gradient.addColorStop(0, bullet.color);
        gradient.addColorStop(0.5, 'rgba(255, 136, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 4, 0, Math.PI * 2);
        ctx.fill();
    },

    // 💥 Рендеринг взрывчатой пули
    renderExplosiveBullet(ctx, bullet, centerX, centerY) {
        const flashRate = Math.max(0.1, bullet.timer / 1000);
        const alpha = 0.7 + Math.sin(Date.now() * 0.02 / flashRate) * 0.3;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = bullet.color;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 6, 0, Math.PI * 2);
        ctx.fill();
    },

    // 🎯 Рендеринг стандартной пули
    renderStandardBullet(ctx, bullet, centerX, centerY) {
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = bullet.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bullet.width / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    // ✨ РЕНДЕРИНГ ЧАСТИЦ
    renderParticles(ctx) {
        for (const particle of this.bossParticles) {
            ctx.save();
            
            const alpha = particle.life / particle.maxLife;
            ctx.globalAlpha = alpha;
            
            switch (particle.type) {
                case 'regeneration':
                case 'shield':
                case 'shield_hit':
                case 'flash':
                case 'rage':
                case 'freeze':
                    ctx.fillStyle = particle.color;
                    ctx.shadowColor = particle.color;
                    ctx.shadowBlur = 8;
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
    },

    // 📺 РЕНДЕРИНГ ЭФФЕКТОВ ЭКРАНА
    renderScreenEffects(ctx) {
        if (!this.canvas) return;
        
        // Эффект ослепления игрока
        if (this.playerBlindness > 0) {
            const blindnessAlpha = Math.min(0.8, this.playerBlindness / 2000);
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${blindnessAlpha})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }
        
        // Эффект вспышки экрана
        if (this.screenFlashEffect > 0) {
            const flashAlpha = this.screenFlashEffect / 30;
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.6})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.screenFlashEffect--;
            ctx.restore();
        }
        
        // Эффект заморозки времени
        if (this.frozenBulletsTime > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(153, 102, 255, 0.1)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.renderFreezeOverlay(ctx);
            ctx.restore();
        }
    },

    // ❄️ Рендеринг эффекта заморозки
    renderFreezeOverlay(ctx) {
        const time = Date.now() * 0.002;
        ctx.strokeStyle = 'rgba(153, 102, 255, 0.4)';
        ctx.lineWidth = 2;
        
        const corners = [
            {x: 50, y: 50},
            {x: this.canvas.width - 50, y: 50},
            {x: 50, y: this.canvas.height - 50},
            {x: this.canvas.width - 50, y: this.canvas.height - 50}
        ];
        
        corners.forEach((corner, i) => {
            const offset = Math.sin(time + i) * 10;
            
            ctx.beginPath();
            ctx.moveTo(corner.x - 20, corner.y + offset);
            ctx.lineTo(corner.x + 20, corner.y - offset);
            ctx.moveTo(corner.x + offset, corner.y - 20);
            ctx.lineTo(corner.x - offset, corner.y + 20);
            ctx.stroke();
        });
    },

    // 📊 РЕНДЕРИНГ UI БОСА
    renderBossUI(ctx) {
        if (!this.currentBoss || this.currentBoss.state === 'dying') return;
        
        this.renderHealthBar(ctx);
        this.renderAbilityStatus(ctx);
    },

    // ❤️ Рендеринг полосы здоровья
    renderHealthBar(ctx) {
        const boss = this.currentBoss;
        const barWidth = 400;
        const barHeight = 25;
        const barX = this.canvas.width / 2 - barWidth / 2;
        const barY = 50;
        
        ctx.save();
        
        // Фон
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
        
        // Градиент здоровья
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
        ctx.fillStyle = boss.color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, this.canvas.width / 2, barY - 15);
        
        // Текст здоровья
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${boss.currentHP} / ${boss.maxHP}`, this.canvas.width / 2, barY + 18);
        
        ctx.restore();
    },


    // ⭐ Рендеринг статуса способностей
    renderAbilityStatus(ctx) {
        const boss = this.currentBoss;
        let statusText = '';
        
        switch(boss.bossNumber) {
            case 2:
                if (boss.uniqueData.shieldHP > 0) {
                    statusText = `💧 Water Shield: ${boss.uniqueData.shieldHP}`;
                }
                break;
            case 4:
                if (boss.uniqueData.rageMode) {
                    statusText = '🤬 RAGE';
                }
                break;
        }
        
        if (statusText) {
            ctx.save();
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(statusText, this.canvas.width / 2, 95);
            ctx.restore();
        }
    },

    // ☄️ Рендеринг предупреждений о метеоритах
    renderMeteorWarnings(ctx) {
        if (!this.meteorWarnings || this.meteorWarnings.length === 0) return;
        
        ctx.save();
        
        // Обновляем и рендерим каждое предупреждение
        for (let i = this.meteorWarnings.length - 1; i >= 0; i--) {
            const warning = this.meteorWarnings[i];
            warning.timer -= 16.67; // Примерно 60 FPS
            
            if (warning.timer <= 0) {
                // Удаляем истекшие предупреждения
                this.meteorWarnings.splice(i, 1);
                continue;
            }
            
            // Вычисляем прозрачность (мигание к концу)
            const timeRatio = warning.timer / warning.maxTimer;
            let alpha = warning.alpha;
            
            if (timeRatio < 0.5) {
                // Последние 0.75 секунды - мигание
                alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            }
            
            // Рендерим красный индикатор внизу экрана
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff3333';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Основной круг
            ctx.beginPath();
            ctx.arc(warning.x, warning.y, warning.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Внутренний крест
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            const crossSize = warning.size * 0.3;
            ctx.beginPath();
            ctx.moveTo(warning.x - crossSize, warning.y);
            ctx.lineTo(warning.x + crossSize, warning.y);
            ctx.moveTo(warning.x, warning.y - crossSize);
            ctx.lineTo(warning.x, warning.y + crossSize);
            ctx.stroke();
            
            // Дополнительный эффект - пульсирующий круг
            if (timeRatio < 0.3) {
                const pulseSize = warning.size * (1 + (1 - timeRatio) * 0.5);
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = '#ff6666';
                ctx.beginPath();
                ctx.arc(warning.x, warning.y, pulseSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
});

