// 🎨 BOOST EFFECTS
// Визуальные и игровые эффекты для бонусов-бустеров

class BoostEffects {
    constructor() {
        this.particles = [];
        this.effects = [];
        this.nextEffectId = 1;
    }

    // ⚡ Эффект Rapid Fire
    applyRapidFireEffect(player) {
        if (!window.boostManager.isBoostActive('RAPID_FIRE')) return;

        // Изменяем цвет пуль на желтый с искрами
        const originalBulletColor = '#00ddff';
        return '#ffff00'; // Желтый цвет для пуль
    }

    // 🛡️ Эффект Shield Barrier
    renderShieldEffect(ctx, player) {
        if (!window.boostManager.isBoostActive('SHIELD_BARRIER')) return;

        const boost = window.boostManager.getActiveBoost('SHIELD_BARRIER');
        const shieldHits = BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits - (boost.hitsBlocked || 0);

        if (shieldHits <= 0) return;

        // Рисуем щит
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0088ff';

        const radius = Math.max(player.width, player.height) / 2 + 15;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            radius,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        // Показываем количество оставшихся блоков
        ctx.globalAlpha = 1.0;
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(
            shieldHits.toString(),
            player.x + player.width / 2,
            player.y - 25
        );

        ctx.restore();
    }

    // 💎 Эффект Score Multiplier
    createScoreMultiplierEffect(x, y, totalPoints) {
        if (!window.boostManager.isBoostActive('SCORE_MULTIPLIER')) return;

        // Показываем общее количество очков с множителем
        const multiplier = BOOST_CONSTANTS.EFFECTS.SCORE_MULTIPLIER.multiplier;
        this.createFloatingText(x, y, `+${totalPoints} (${multiplier}x)`, '#ffd700', 1500);
    }

    // ⏰ Эффект Points Freeze
    renderPointsFreezeEffect(ctx) {
        if (!window.boostManager.isBoostActive('POINTS_FREEZE')) return;

        // Визуальные эффекты отключены
        // if (Math.random() < 0.01) {
        //     this.createParticle({
        //         x: Math.random() * window.canvas.width,
        //         y: Math.random() * window.canvas.height,
        //         color: '#88ddff',
        //         size: 2 + Math.random() * 4,
        //         life: 2000,
        //         vx: (Math.random() - 0.5) * 2,
        //         vy: (Math.random() - 0.5) * 2
        //     });
        // }
    }

    // 🔥 Эффект Multi-Shot
    getMultiShotBullets(playerX, playerY) {
        if (!window.boostManager.isBoostActive('MULTI_SHOT')) {
            return [{ x: playerX, y: playerY, vx: 0, vy: -8, color: '#00ddff' }];
        }

        // Возвращаем 3 пули веером с углом ±15° (30° между крайними)
        const speed = 8; // Скорость как у обычных пуль
        const angleLeft = -15 * Math.PI / 180; // -15 градусов в радианах
        const angleRight = 15 * Math.PI / 180;  // +15 градусов в радианах
        
        return [
            { 
                x: playerX - 8, 
                y: playerY, 
                vx: speed * Math.sin(angleLeft), 
                vy: -speed * Math.cos(angleLeft), // Отрицательный для движения вверх
                color: '#ff4444' 
            },
            { 
                x: playerX, 
                y: playerY, 
                vx: 0, 
                vy: -speed, 
                color: '#ff4444' 
            },
            { 
                x: playerX + 8, 
                y: playerY, 
                vx: speed * Math.sin(angleRight), 
                vy: -speed * Math.cos(angleRight), // Отрицательный для движения вверх
                color: '#ff4444' 
            }
        ];
    }

    // 💙 Эффект Health Boost
    createHealthBoostEffect(playerX, playerY) {
        // Создаем синие частицы исцеления
        for (let i = 0; i < 5; i++) {
            this.createParticle({
                x: playerX + Math.random() * 60,
                y: playerY + Math.random() * 60,
                color: '#0088ff',
                size: 3 + Math.random() * 3,
                life: 1500,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4
            });
        }

        // Показываем текст +1💙
        this.createFloatingText(playerX + 30, playerY - 20, '+1💙', '#0088ff', 2000);
    }

    // 🎯 Эффект Piercing Bullets
    applyPiercingEffect() {
        if (!window.boostManager.isBoostActive('PIERCING_BULLETS')) return false;
        return true; // Пули пробивают врагов
    }

    // ⭐ Эффект Invincibility
    renderInvincibilityEffect(ctx, player) {
        if (!window.boostManager.isBoostActive('INVINCIBILITY')) return;

        // Радужное мерцание
        const time = Date.now() * 0.01;
        const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#0000ff', '#8800ff'];
        const colorIndex = Math.floor(time) % colors.length;

        ctx.save();
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time);
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors[colorIndex];
        ctx.fillStyle = colors[colorIndex];
        
        // Рисуем контур игрока
        ctx.fillRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);

        // Искры
        if (Math.random() < 0.3) {
            this.createParticle({
                x: player.x + Math.random() * player.width,
                y: player.y + Math.random() * player.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 2,
                life: 1000,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6
            });
        }

        ctx.restore();
    }

    // 🌀 Эффект Gravity Well
    applyGravityWellEffect(bullets) {
        if (!window.boostManager.isBoostActive('GRAVITY_WELL')) return;

        // Получаем данные о гравитационном колодце
        const gravityWellData = window.boostManager.getActiveBoost('GRAVITY_WELL');
        if (!gravityWellData || !gravityWellData.centerX || !gravityWellData.centerY) {
            console.warn('🌀 Gravity Well: No center coordinates found');
            return;
        }

        const centerX = gravityWellData.centerX;
        const centerY = gravityWellData.centerY;
        const pullStrength = 0.5;

        // Перенаправляем пули врагов прямо в центр колодца
        let affectedBullets = 0;
        let absoredBullets = 0;
        let totalBullets = bullets.length;
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (bullet.fromCrab || bullet.owner === 'invader') {
                // Отладка: проверяем что пуля уже не поглощена
                if (bullet.absorbed) {
                    // Found already absorbed bullet
                    continue;
                }
                const dx = centerX - bullet.x;
                const dy = centerY - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Bullet distance from center calculated

                // Если пуля близко к центру колодца - поглощаем её  
                if (distance <= 15) { // Уменьшил радиус поглощения
                    // Помечаем пулю для удаления
                    bullet.absorbed = true;
                    absoredBullets++;
                    // Bullet absorbed at distance from center
                    continue;
                }

                if (distance > 0) {
                    // Прямая наводка в центр колодца с постоянной скоростью
                    const speed = 4; // Фиксированная скорость движения к центру
                    bullet.vx = (dx / distance) * speed;
                    bullet.vy = (dy / distance) * speed;
                    affectedBullets++;
                    
                    // Bullet redirected to center
                }
            }
        }
        
        // Gravity Well: bullets processed
    }

    // 🌀 Отрисовка Gravity Well
    renderGravityWellEffect(ctx) {
        if (!window.boostManager || !window.boostManager.isBoostActive('GRAVITY_WELL')) return;

        // Получаем координаты центра гравитационного колодца
        const gravityWellData = window.boostManager.getActiveBoost('GRAVITY_WELL');
        if (!gravityWellData || !gravityWellData.centerX || !gravityWellData.centerY) {
            console.warn('🌀 Gravity Well: Missing center coordinates in renderGravityWellEffect');
            return;
        }
        
        // Rendering Gravity Well

        const centerX = gravityWellData.centerX;
        const centerY = gravityWellData.centerY;
        const time = Date.now() * 0.005;

        ctx.save();
        
        // Пульсирующая черная дыра
        const pulseIntensity = 0.5 + 0.5 * Math.sin(time * 3); // Пульсация
        const coreRadius = 15 + 5 * pulseIntensity;
        const glowRadius = 40 + 15 * pulseIntensity;
        
        // Создаем радиальный градиент для черной дыры
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');      // Черный центр
        gradient.addColorStop(0.3, 'rgba(20, 20, 50, 0.9)'); // Темно-синий
        gradient.addColorStop(0.6, `rgba(0, 100, 255, ${0.6 * pulseIntensity})`); // Синее свечение
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');   // Прозрачный край
        
        // Рисуем основную черную дыру
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Рисуем черный центр
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Синее пульсирующее кольцо
        ctx.globalAlpha = pulseIntensity;
        ctx.strokeStyle = `rgba(0, 150, 255, ${pulseIntensity})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 150, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius + 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Внешнее пульсирующее кольцо
        ctx.globalAlpha = pulseIntensity * 0.5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius - 10, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // 🛡️ Эффект Ricochet
    applyRicochetEffect(bullets, player) {
        if (!window.boostManager || !window.boostManager.isBoostActive('RICOCHET')) return;

        // Параметры дугообразного щита (такие же как в renderRicochetShield)
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const radius = 50;
        const arcAngle = Math.PI * 0.75; // 135 градусов
        const startAngle = -Math.PI/2 - arcAngle / 2; // Начальный угол (сверху игрока)
        const endAngle = startAngle + arcAngle;
        const shieldThickness = 15; // Толщина дуги для коллизий

        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            
            if ((bullet.fromCrab || bullet.owner === 'invader') && !bullet.ricochet && !bullet.justCreated) {
                // Проверяем столкновение с дугообразным щитом
                const dx = bullet.x - centerX;
                const dy = bullet.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // Простая проверка угла относительно дуги щита
                // Проверяем что пуля находится в верхней части перед игроком
                const isAbovePlayer = bullet.y <= centerY; // Пуля выше центра игрока
                const horizontalDistance = Math.abs(bullet.x - centerX);
                const verticalDistance = Math.abs(bullet.y - centerY);
                const inArcRange = isAbovePlayer && horizontalDistance <= radius * 0.8;
                const inRadiusRange = (distance >= radius - shieldThickness/2 && distance <= radius + shieldThickness/2);
                
                if (inArcRange && inRadiusRange) {
                    
                    // RICOCHET: Bullet hit shield
                    
                    // Полный разворот на 180 градусов
                    if (bullet.vy !== undefined) {
                        bullet.vy = -bullet.vy; // Инвертируем направление по Y
                    } else if (bullet.speed !== undefined) {
                        // Для пуль крабов используем стандартное свойство speed
                        bullet.speed = -bullet.speed; // Инвертируем скорость
                    }
                    
                    if (bullet.vx !== undefined) {
                        bullet.vx = -bullet.vx; // Инвертируем направление по X если есть
                    }
                    
                    // НЕ меняем fromCrab и owner - пусть остается вражеской пулей
                    // Только помечаем как отраженную и меняем цвет
                    if (!bullet.ricochet) { // Только если еще не отражена
                        bullet.color = '#0088ff'; // Синий цвет отраженной пули
                        bullet.ricochet = true; // Помечаем как отраженную
                    }
                    
                    // Смещаем пулю от дуги щита к центру игрока
                    const moveDistance = 10;
                    const moveAngle = Math.atan2(centerY - bullet.y, centerX - bullet.x);
                    bullet.x += Math.cos(moveAngle) * moveDistance;
                    bullet.y += Math.sin(moveAngle) * moveDistance;
                    
                    // Создаем эффект искр при отражении
                    if (window.createExplosion) {
                        window.createExplosion(bullet.x, bullet.y, '#00ff44', false, 0.3);
                    }
                }
            }
        }
    }

    // 🛡️ Визуальный эффект щита Ricochet
    renderRicochetShield(ctx, player) {
        if (!window.boostManager.isBoostActive('RICOCHET') || !player) return;

        const boostData = window.boostManager.getActiveBoost('RICOCHET');
        if (!boostData) return;

        ctx.save();

        // Параметры дугообразного щита
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const radius = 50; // Радиус дуги
        const arcAngle = Math.PI * 0.75; // 135 градусов в радианах
        const startAngle = -Math.PI/2 - arcAngle / 2; // Начальный угол (сверху игрока)
        const endAngle = startAngle + arcAngle; // Конечный угол

        // Пульсирующий эффект
        const elapsed = Date.now() - boostData.startTime;
        const pulseIntensity = 0.7 + 0.3 * Math.sin(elapsed * 0.01);

        // Рисуем дугообразный щит
        ctx.globalAlpha = pulseIntensity * 0.6;
        ctx.strokeStyle = `rgba(0, 255, 68, ${pulseIntensity})`;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 68, 0.8)';
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();

        // Внутренняя дуга
        ctx.lineWidth = 4;
        ctx.globalAlpha = pulseIntensity * 0.8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, startAngle, endAngle);
        ctx.stroke();

        // Внешняя дуга
        ctx.lineWidth = 3;
        ctx.globalAlpha = pulseIntensity * 0.4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, startAngle, endAngle);
        ctx.stroke();

        // Энергетические искры по дуге щита
        if (Math.random() < 0.3) {
            const sparkAngle = startAngle + Math.random() * arcAngle;
            const sparkRadius = radius + (Math.random() - 0.5) * 10;
            const sparkX = centerX + Math.cos(sparkAngle) * sparkRadius;
            const sparkY = centerY + Math.sin(sparkAngle) * sparkRadius;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // 🧊 Эффект Ice Freeze
    renderIceFreezeEffect(ctx) {
        if (!window.boostManager.isBoostActive('ICE_FREEZE')) return;

        // Создаем ледяные кристаллы
        if (Math.random() < 0.2) {
            this.createParticle({
                x: Math.random() * window.canvas.width,
                y: Math.random() * window.canvas.height,
                color: '#aaeeff',
                size: 1 + Math.random() * 3,
                life: 3000,
                vx: (Math.random() - 0.5),
                vy: Math.random() * 2,
                type: 'crystal'
            });
        }

        // Синий туман
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#aaeeff';
        ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
        ctx.restore();
    }

    // 🎯 Эффект Auto-Target
    applyAutoTargetEffect(bullet, enemies) {
        if (!window.boostManager.isBoostActive('AUTO_TARGET')) {
            // Сбрасываем автонаведение если буст неактивен, но ТОЛЬКО для уже помеченных пуль
            if (bullet.autoTargeted) {
                // AUTO_TARGET: Resetting auto-targeting for bullet
                delete bullet.vx; // Убираем горизонтальное движение
                delete bullet.vy; // Убираем вертикальное отклонение - пуля вернется к обычному movement через bullet.speed
                delete bullet.autoTargeted;
                delete bullet.originalVx;
                delete bullet.originalVy;
            }
            // НЕ ПРИМЕНЯЕМ автонаведение к новым пулям
            return;
        }

        // Сохраняем оригинальную скорость только один раз
        if (!bullet.autoTargeted) {
            // AUTO_TARGET: Applying auto-targeting to new bullet
            bullet.originalVx = bullet.vx;
            bullet.originalVy = bullet.vy;
            bullet.autoTargeted = true;
        }

        // Находим ближайшего врага
        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        // Наводим пулю на ближайшего врага
        if (closestEnemy) {
            const dx = closestEnemy.x - bullet.x;
            const dy = closestEnemy.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                // Полное автонаведение как было раньше
                const speed = bullet.speed || 8;
                bullet.vx = (dx / distance) * speed * 0.3;
                bullet.vy = (dy / distance) * speed * 0.3 - speed * 0.7; // Корректируем но оставляем движение вверх
                // AUTO_TARGET: Targeting bullet at enemy
            }
        }
    }

    // 💰 Эффект Coin Shower
    createCoinShowerEffect(points) {
        // Создаем падающие монеты
        for (let i = 0; i < 20; i++) {
            this.createParticle({
                x: Math.random() * window.canvas.width,
                y: -20,
                color: '#ffd700',
                size: 8 + Math.random() * 4,
                life: 3000,
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 3,
                type: 'coin'
            });
        }

        // Показываем полученные очки
        this.createFloatingText(
            window.canvas.width / 2,
            window.canvas.height / 2,
            `+${points} 💰`,
            '#ffd700',
            2500
        );
    }

    // 🌊 Эффект Wave Blast
    createWaveBlastEffect(playerX = window.canvas.width / 2, playerY = window.canvas.height - 50) {
        // Создаем расширяющуюся ударную волну от игрока (быстро!)
        this.effects.push({
            id: this.nextEffectId++,
            type: 'wave_blast',
            x: playerX,
            y: playerY,
            radius: 0,
            maxRadius: Math.max(window.canvas.width, window.canvas.height),
            life: 50,  // Еще быстрее: 80ms -> 50ms
            age: 0,
            color: '#0088ff',
            intensity: 1.0
        });
        
        // Добавляем дополнительные волны для усиления эффекта
        setTimeout(() => {
            this.effects.push({
                id: this.nextEffectId++,
                type: 'wave_blast',
                x: playerX,
                y: playerY,
                radius: 0,
                maxRadius: Math.max(window.canvas.width, window.canvas.height) * 0.7,
                life: 40,  // Еще быстрее: 60ms -> 40ms
                age: 0,
                color: '#00aaff',
                intensity: 0.6
            });
        }, 10);  // Еще быстрее: 15ms -> 10ms
        
        setTimeout(() => {
            this.effects.push({
                id: this.nextEffectId++,
                type: 'wave_blast',
                x: playerX,
                y: playerY,
                radius: 0,
                maxRadius: Math.max(window.canvas.width, window.canvas.height) * 0.5,
                life: 30,  // Еще быстрее: 40ms -> 30ms
                age: 0,
                color: '#66ccff',
                intensity: 0.3
            });
        }, 20);  // Еще быстрее: 30ms -> 20ms
    }

    // 🎨 Создание частицы
    createParticle(params) {
        this.particles.push({
            id: this.nextEffectId++,
            x: params.x,
            y: params.y,
            vx: params.vx || 0,
            vy: params.vy || 0,
            color: params.color,
            size: params.size,
            life: params.life,
            age: 0,
            type: params.type || 'default'
        });
    }

    // 📝 Создание плавающего текста
    createFloatingText(x, y, text, color, life) {
        this.effects.push({
            id: this.nextEffectId++,
            type: 'text',
            x: x,
            y: y,
            text: text,
            color: color,
            life: life,
            age: 0,
            vy: -1
        });
    }

    // 🔄 Обновление эффектов
    update(deltaTime) {
        this.updateParticles(deltaTime);
        this.updateEffects(deltaTime);
    }

    // 🔄 Обновление частиц
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.age += deltaTime;

            if (particle.age >= particle.life) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 🔄 Обновление эффектов
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.age += deltaTime;

            if (effect.type === 'wave') {
                effect.width = (effect.age / effect.life) * effect.maxWidth;
            } else if (effect.type === 'wave_blast') {
                // Расширяющаяся окружность
                const progress = effect.age / effect.life;
                effect.radius = progress * effect.maxRadius;
            } else if (effect.type === 'text') {
                effect.y += effect.vy;
            }

            if (effect.age >= effect.life) {
                this.effects.splice(i, 1);
            }
        }
    }

    // 🎨 Отрисовка всех эффектов
    render(ctx) {
        this.renderParticles(ctx);
        this.renderEffects(ctx);
    }

    // 🎨 Отрисовка частиц
    renderParticles(ctx) {
        for (const particle of this.particles) {
            const alpha = 1 - (particle.age / particle.life);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            
            if (particle.type === 'coin') {
                ctx.font = `${particle.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('💰', particle.x, particle.y);
            } else if (particle.type === 'crystal') {
                ctx.font = `${particle.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('❄️', particle.x, particle.y);
            } else {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // 🎨 Отрисовка эффектов
    renderEffects(ctx) {
        for (const effect of this.effects) {
            const alpha = 1 - (effect.age / effect.life);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            if (effect.type === 'wave') {
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(0, effect.y);
                ctx.lineTo(effect.width, effect.y);
                ctx.stroke();
            } else if (effect.type === 'wave_blast') {
                // Рисуем расширяющуюся волну-окружность
                const intensity = effect.intensity || 1.0;
                const glowIntensity = alpha * intensity;
                
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = Math.max(1, 8 * intensity);
                ctx.shadowBlur = 20 * glowIntensity;
                ctx.shadowColor = effect.color;
                
                // Основная волна
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Внутренняя более яркая волна
                if (effect.radius > 20) {
                    ctx.globalAlpha = alpha * intensity * 0.5;
                    ctx.lineWidth = Math.max(1, 4 * intensity);
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * 0.8, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.shadowBlur = 0;
            } else if (effect.type === 'text') {
                ctx.font = '16px Arial';
                ctx.fillStyle = effect.color;
                ctx.textAlign = 'center';
                ctx.fillText(effect.text, effect.x, effect.y);
            }
            
            ctx.restore();
        }
    }

    // 🧹 Очистка эффектов
    clear() {
        this.particles = [];
        this.effects = [];
    }
}

// Создаем глобальный экземпляр
window.boostEffects = new BoostEffects();