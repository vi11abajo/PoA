// 🔗 BOOST INTEGRATION
// Интеграция системы бонусов с основной игрой

class BoostIntegration {
    constructor() {
        this.initialized = false;
    }

    // 🚀 Инициализация интеграции
    initialize() {
        if (this.initialized) {
            // BoostIntegration already initialized, skipping
            return;
        }

        // Initializing BoostIntegration...
        
        try {
            this.patchGameFunctions();
            // Game functions patched
            
            this.patchPlayerFunctions();
            // Player functions patched
            
            this.patchBulletFunctions();
            // Bullet functions patched
            
            this.patchEnemyFunctions();
            // Enemy functions patched
            
            this.patchUIFunctions();
            // UI functions patched

            this.initialized = true;
            // BoostIntegration fully initialized!
        } catch (error) {
            console.error('❌ Error initializing BoostIntegration:', error);
        }
    }

    // 🎮 Патчи игровых функций
    patchGameFunctions() {
        // Патч функции обновления игры
        const originalGameUpdate = window.updateGame;
        if (originalGameUpdate) {
            window.updateGame = (deltaTime) => {
                originalGameUpdate(deltaTime);
                
                // Обновляем систему бонусов
                if (window.boostManager) {
                    window.boostManager.update(deltaTime);
                }
                if (window.boostEffects) {
                    window.boostEffects.update(deltaTime);
                }
            };
        }

        // Патч функции отрисовки игры
        const originalGameRender = window.renderGame;
        if (originalGameRender) {
            window.renderGame = (ctx) => {
                originalGameRender(ctx);
                
                // Отрисовываем бонусы
                if (window.boostManager) {
                    window.boostManager.render(ctx);
                }
                if (window.boostEffects) {
                    window.boostEffects.render(ctx);
                }
            };
        }

        // Патч проверки возможности начать следующий уровень
        const originalCanStartNextLevel = window.canStartNextLevel;
        window.canStartNextLevel = () => {
            const originalResult = originalCanStartNextLevel ? originalCanStartNextLevel() : true;
            const boostResult = window.boostManager ? window.boostManager.canStartNextLevel() : true;
            return originalResult && boostResult;
        };

        // Патч начала нового уровня
        const originalStartNewLevel = window.startNewLevel;
        if (originalStartNewLevel) {
            window.startNewLevel = () => {
                if (window.boostManager) {
                    window.boostManager.clearForNewLevel();
                }
                originalStartNewLevel();
            };
        }
    }

    // 👤 Патчи функций игрока
    patchPlayerFunctions() {
        // Patching player functions...
        
        // Патч функции обновления игрока для стрельбы
        // Сохраняем оригинальный кулдаун для восстановления
        let originalBaseShotCooldown = null;
        let rapidFireActive = false;

        const originalUpdatePlayer = window.updatePlayer;
        if (originalUpdatePlayer) {
            window.updatePlayer = function(deltaTime) {
                // Проверяем статус Rapid Fire
                const isRapidFireActive = window.boostManager && window.boostManager.isBoostActive('RAPID_FIRE');
                
                // Применяем эффект только при активации
                if (isRapidFireActive && !rapidFireActive) {
                    originalBaseShotCooldown = window.shotCooldown;
                    const rapidFireMultiplier = BOOST_CONSTANTS.EFFECTS.RAPID_FIRE.multiplier;
                    window.shotCooldown = originalBaseShotCooldown / rapidFireMultiplier;
                    rapidFireActive = true;
                    // Rapid Fire activated! Cooldown reduced
                }
                
                // Восстанавливаем кулдаун при деактивации
                if (!isRapidFireActive && rapidFireActive) {
                    if (originalBaseShotCooldown !== null) {
                        window.shotCooldown = originalBaseShotCooldown;
                        // Rapid Fire deactivated! Cooldown restored
                    }
                    rapidFireActive = false;
                }
                
                // Вызываем оригинальную функцию
                const result = originalUpdatePlayer.apply(this, arguments);
                return result;
            };
            // updatePlayer patched for RAPID_FIRE
        }

        // Патч функции createBullet для Multi-Shot
        if (typeof window.createBullet === 'function') {
            const originalCreateBullet = window.createBullet;
            
            window.createBullet = function() {
                const now = Date.now();
                const currentCooldown = window.shotCooldown !== undefined ? window.shotCooldown : 150;
                
                const lastShot = typeof window.lastShotTime === 'function' ? window.lastShotTime() : (window.lastShotTime || 0);
                if (now - lastShot > currentCooldown) {
                    if (window.boostManager && window.boostManager.isBoostActive('MULTI_SHOT') && window.boostEffects) {
                        // Multi-Shot активен - создаем 3 пули
                        const playerCenterX = window.player.x + window.player.width / 2;
                        const playerY = window.player.y;
                        
                        const bulletTemplates = window.boostEffects.getMultiShotBullets(playerCenterX, playerY);
                        
                        for (const template of bulletTemplates) {
                            const bullet = {
                                x: template.x - 3,
                                y: template.y,
                                width: 6,
                                height: 15,
                                speed: 8,
                                trail: [],
                                vy: template.vy,
                                vx: template.vx,
                                color: template.color,
                                // Устанавливаем правильные флаги бонусов
                                multiShot: true,  // Помечаем как пулю мультишота
                                piercing: window.boostManager && window.boostManager.isBoostActive('PIERCING_BULLETS'),
                                // Убеждаемся что autoTarget выключен для мультишота
                                autoTarget: false,
                                originalVx: undefined,
                                originalVy: undefined
                            };
                            
                            if (window.bullets) {
                                window.bullets.push(bullet);
                            }
                        }

                        // 🔊 Звук выстрела мультишота
                        if (window.soundManager) {
                            window.soundManager.playSound('multiShot', 0.6, 1.0 + Math.random() * 0.2);
                        }

                        // Multi-Shot: Created 3 bullets
                        if (typeof window.setLastShotTime === 'function') {
                            window.setLastShotTime(now);
                        } else {
                            window.lastShotTime = now;
                        }
                        
                        if (window.createRipple) {
                            window.createRipple(playerCenterX, playerY);
                        }
                    } else {
                        // Обычный выстрел
                        return originalCreateBullet.apply(this, arguments);
                    }
                }
            };
            
            // createBullet patched for Multi-Shot
        } else {
            // createBullet function not found
        }

        // Патч получения урона игроком - ищем правильную функцию
        let damageFunctionPatched = false;
        
        // Попробуем найти функцию урона через разные названия
        const possibleDamageFunctions = ['damagePlayer', 'playerTakeDamage', 'hitPlayer', 'playerHit'];
        
        for (const funcName of possibleDamageFunctions) {
            if (window[funcName] && typeof window[funcName] === 'function') {
                const originalDamageFunction = window[funcName];
                window[funcName] = function(damage = 1) {
                    // Checking damage protection
                    
                    // Проверяем Invincibility
                    if (window.boostManager && window.boostManager.isBoostActive('INVINCIBILITY')) {
                        // Invincibility blocked damage!
                        return false; // Игрок неуязвим
                    }

                    // Проверяем Shield Barrier
                    if (window.boostManager && window.boostManager.isBoostActive('SHIELD_BARRIER')) {
                        const boost = window.boostManager.getActiveBoost('SHIELD_BARRIER');
                        const hitsBlocked = boost.hitsBlocked || 0;
                        
                        if (hitsBlocked < BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits) {
                            boost.hitsBlocked = hitsBlocked + 1;
                            // Shield blocked hit
                            
                            // Если щит исчерпан, деактивируем его
                            if (boost.hitsBlocked >= BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits) {
                                window.boostManager.deactivateBoost('SHIELD_BARRIER');
                                // Shield depleted!
                            }
                            
                            return false; // Урон заблокирован
                        }
                    }

                    // Применяем обычный урон
                    return originalDamageFunction.apply(this, arguments);
                };
                // Damage function patched for damage protection
                damageFunctionPatched = true;
                break;
            }
        }
        
        if (!damageFunctionPatched) {
            // No damage function found to patch
        }
    }

    // 🔫 Патчи функций пуль
    patchBulletFunctions() {
        // Патч обновления пуль
        const originalUpdateBullets = window.updateBullets;
        if (originalUpdateBullets) {
            window.updateBullets = function(deltaTime) {
                // ВАЖНО: Применяем эффекты ДО обновления позиций пуль
                
                // Auto-Target для пуль игрока уже применен выше
                // Эффекты для пуль крабов (RICOCHET, GRAVITY_WELL) применяются в основной логике game.js
                
                // Применяем Auto-Target эффект к пулям игрока
                if (window.boostEffects && window.bullets) {
                    const enemies = [...(window.invaders || [])];
                    if (window.bossSystem && window.bossSystem.currentBoss) {
                        enemies.push(window.bossSystem.currentBoss);
                    }

                    for (const bullet of window.bullets) {
                        window.boostEffects.applyAutoTargetEffect(bullet, enemies);
                    }
                }

                // ПОСЛЕ применения эффектов вызываем оригинальную функцию обновления пуль
                originalUpdateBullets.call(this, deltaTime);
            };
            // updateBullets patched for Auto-Target effect
        } else {
            // updateBullets function not found
        }

        // Патч обновления пуль крабов (если существует)
        const originalUpdateCrabBullets = window.updateCrabBullets;
        if (originalUpdateCrabBullets) {
            window.updateCrabBullets = () => {
                originalUpdateCrabBullets();
            };
        }
    }

    // 👾 Патчи функций врагов
    patchEnemyFunctions() {
        // Patching enemy functions...
        
        // Ищем функцию уничтожения врагов
        const possibleDestroyFunctions = ['destroyInvader', 'killInvader', 'removeInvader', 'destroyEnemy'];
        let destroyFunctionPatched = false;
        
        for (const funcName of possibleDestroyFunctions) {
            if (window[funcName] && typeof window[funcName] === 'function') {
                const originalDestroyFunction = window[funcName];
                window[funcName] = function(invader, index) {
                    // Enemy destroyed, checking boost effects...
                    
                    // Получаем базовые очки перед вызовом оригинальной функции
                    const basePoints = window.getInvaderScore ? window.getInvaderScore(invader.row) : 10;
                    
                    // Вызываем оригинальную функцию (она добавит базовые очки)
                    const result = originalDestroyFunction.apply(this, arguments);
                    
                    // Применяем Score Multiplier ПОСЛЕ базового начисления
                    if (window.boostManager && window.boostManager.isBoostActive('SCORE_MULTIPLIER')) {
                        const multiplier = BOOST_CONSTANTS.EFFECTS.SCORE_MULTIPLIER.multiplier;
                        const totalPoints = basePoints * multiplier;
                        const bonusPoints = totalPoints - basePoints;
                        
                        if (window.score !== undefined) {
                            const newScore = window.score + bonusPoints;
                            // Используем функцию синхронизации из game.js
                            if (typeof window.syncScore === 'function') {
                                window.syncScore(newScore);
                            } else {
                                window.score = newScore;
                            }
                            // Score multiplier applied
                        }
                        
                        // Создаем визуальный эффект
                        if (window.boostEffects) {
                            window.boostEffects.createScoreMultiplierEffect(invader.x, invader.y, totalPoints);
                        }
                    }
                    
                    // Шанс выпадения бонуса
                    if (Math.random() < BOOST_CONSTANTS.SPAWN.DROP_CHANCE && window.boostManager) {
                        const boost = window.boostManager.createDroppingBoost(
                            invader.x + invader.width / 2,
                            invader.y + invader.height / 2
                        );
                        // Boost dropped
                    }

                    return result;
                };
                // Enemy destruction function patched
                destroyFunctionPatched = true;
                break;
            }
        }
        
        if (!destroyFunctionPatched) {
            // No enemy destroy function found to patch
        }

        // Патч moveInvaders для Ice Freeze эффекта - прямая замена логики движения
        if (window.moveInvaders && typeof window.moveInvaders === 'function') {
            const originalMoveInvaders = window.moveInvaders;
            // Кешируем проверку активности бонуса
            let lastIceCheck = 0;
            let isIceFrozen = false;
            const CHECK_INTERVAL = 100; // Проверяем активность раз в 100мс вместо каждого кадра
            
            window.moveInvaders = function() {
                // Оптимизация: проверяем активность Ice Freeze реже
                const now = performance.now();
                if (now - lastIceCheck > CHECK_INTERVAL) {
                    isIceFrozen = window.boostManager && window.boostManager.isBoostActive('ICE_FREEZE');
                    lastIceCheck = now;
                }
                
                // Применяем Ice Freeze замедление
                if (isIceFrozen) {
                    const slowdown = BOOST_CONSTANTS.EFFECTS.ICE_FREEZE.slowdown;
                    
                    // Проверяем доступность глобальных переменных
                    if (!window.invaders || !Array.isArray(window.invaders)) {
                        return originalMoveInvaders.call(this);
                    }
                    
                    const invaderSpeed = window.invaderSpeed || 1;
                    const deltaTime = window.deltaTime || 1;
                    const invaderDirection = window.invaderDirection || 1;
                    
                    // Копируем логику из оригинальной функции, но с замедлением
                    for (let invader of window.invaders) {
                        if (invader.alive) {
                            // Применяем Ice Freeze замедление напрямую к скорости
                            const currentSpeed = invaderSpeed * deltaTime * slowdown;
                            
                            // Проверяем валидность перед изменением
                            if (isFinite(currentSpeed) && isFinite(invaderDirection) && isFinite(invader.x)) {
                                invader.x += currentSpeed * invaderDirection;
                                invader.animFrame += 0.08 * deltaTime * slowdown;
                                invader.clawOffset += 0.12 * deltaTime * slowdown;
                            }
                        }
                    }
                } else {
                    // Обычный вызов без замедления
                    return originalMoveInvaders.call(this);
                }
            };
            // moveInvaders patched for Ice Freeze effect
        } else {
            // moveInvaders function not found
        }
        
    }

    // 🖥️ Патчи UI функций
    patchUIFunctions() {
        // Патч отрисовки игрока
        const originalRenderPlayer = window.renderPlayer;
        window.renderPlayer = (ctx) => {
            if (originalRenderPlayer) originalRenderPlayer(ctx);

            if (!window.player || !window.boostEffects) return;

            // Отрисовываем эффекты бонусов на игроке
            window.boostEffects.renderShieldEffect(ctx, window.player);
            window.boostEffects.renderInvincibilityEffect(ctx, window.player);
        };

        // Патч отрисовки врагов для добавления эффектов льда
        const originalDrawInvaders = window.drawInvaders;
        if (originalDrawInvaders) {
            window.drawInvaders = function() {
                // Сначала рисуем обычных врагов
                const result = originalDrawInvaders.apply(this, arguments);
                
                // Кешируем проверку активности Ice Freeze для всех врагов сразу
                const isIceFreezeActive = window.boostManager && 
                    window.boostManager.isBoostActive('ICE_FREEZE') && 
                    window.invaders && window.ctx;
                    
                if (isIceFreezeActive) {
                    // Оптимизация: рисуем эффекты для всех живых врагов за один проход
                    for (let i = 0, len = window.invaders.length; i < len; i++) {
                        const invader = window.invaders[i];
                        if (invader.alive) {
                            window.boostIntegration.drawIceCubeEffect(window.ctx, invader);
                        }
                    }
                }
                
                return result;
            };
            // drawInvaders patched for ice effects
        }

        // Патч отрисовки фона
        const originalRenderBackground = window.renderBackground;
        window.renderBackground = (ctx) => {
            if (originalRenderBackground) originalRenderBackground(ctx);

            if (!window.boostEffects) return;

            // Отрисовываем фоновые эффекты
            window.boostEffects.renderPointsFreezeEffect(ctx);
            window.boostEffects.renderIceFreezeEffect(ctx);
            window.boostEffects.renderGravityWellEffect(ctx);
        };

        // Ищем функции системы очков для Points Freeze
        const possibleScoreFunctions = ['updateScoreMultiplier', 'updateScore', 'scoreUpdate', 'updateScoring'];
        let scoreFunctionPatched = false;
        
        for (const funcName of possibleScoreFunctions) {
            if (window[funcName] && typeof window[funcName] === 'function') {
                const originalScoreFunction = window[funcName];
                window[funcName] = function() {
                    // Если активен Points Freeze, не обновляем систему очков
                    if (window.boostManager && window.boostManager.isBoostActive('POINTS_FREEZE')) {
                        // Points Freeze active: score system update blocked
                        return;
                    }
                    
                    return originalScoreFunction.apply(this, arguments);
                };
                // Score function patched for Points Freeze effect
                scoreFunctionPatched = true;
                break;
            }
        }
        
        if (!scoreFunctionPatched) {
            // No score update function found to patch
        }
    }

    // 🎯 Проверка столкновения пули с крабом (с учетом Piercing)
    checkBulletInvaderCollision(bullet, invader) {
        const hit = bullet.x < invader.x + invader.width &&
                   bullet.x + bullet.width > invader.x &&
                   bullet.y < invader.y + invader.height &&
                   bullet.y + bullet.height > invader.y;

        if (hit && !bullet.piercing) {
            // Обычная пуля уничтожается при попадании
            return 'destroy_bullet';
        } else if (hit && bullet.piercing) {
            // Пробивающая пуля продолжает лететь
            return 'piercing_hit';
        }

        return 'no_hit';
    }

    // 🧊 Рисование синей пульсирующей ауры вокруг замороженного врага
    drawIceCubeEffect(ctx, invader) {
        // Быстрая проверка валидности данных врага
        if (!invader || !isFinite(invader.x) || !isFinite(invader.y)) {
            return;
        }
        
        const centerX = invader.x + invader.width / 2;
        const centerY = invader.y + invader.height / 2;
        
        // Быстрая проверка центра
        if (!isFinite(centerX) || !isFinite(centerY)) {
            return;
        }
        
        // Оптимизация: используем более быстрое время
        const time = performance.now() * 0.002;
        
        // Сохраняем контекст
        ctx.save();
        
        // Упрощенный пульсирующий эффект
        const radius = 28 + Math.sin(time * 3) * 3; // Меньше вычислений
        const alpha = 0.25 + Math.sin(time * 4) * 0.05; // Меньше интенсивность
        
        // Создаем градиент для ауры
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(170, 238, 255, ${alpha})`);      // Центр - голубой
        gradient.addColorStop(0.7, `rgba(100, 200, 255, ${alpha * 0.6})`); // Средина - синий
        gradient.addColorStop(1, `rgba(50, 150, 255, 0)`);              // Край - прозрачный
        
        // Рисуем основную ауру
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Дополнительное внутреннее кольцо для усиления эффекта
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = '#aaeeff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        // Маленькие мерцающие точки вокруг ауры
        ctx.globalAlpha = Math.sin(time * 6) * 0.5 + 0.5;
        ctx.fillStyle = '#ffffff';
        
        for (let i = 0; i < 6; i++) {
            const angle = (time + i * Math.PI / 3) % (Math.PI * 2);
            const sparkleX = centerX + Math.cos(angle) * (radius * 0.8);
            const sparkleY = centerY + Math.sin(angle) * (radius * 0.8);
            
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Восстанавливаем контекст
        ctx.restore();
    }

    // 🎨 Создание эффекта подбора бонуса
    createBoostPickupEffect(boost) {
        if (!window.boostEffects) return;

        const info = BOOST_CONSTANTS.INFO[boost.type];
        
        // Создаем эффект подбора
        window.boostEffects.createFloatingText(
            boost.x + boost.width / 2,
            boost.y,
            `${info.icon} ${info.name}`,
            BOOST_CONSTANTS.RARITY.COLORS[boost.rarity],
            2000
        );

        // Создаем частицы
        for (let i = 0; i < 8; i++) {
            window.boostEffects.createParticle({
                x: boost.x + boost.width / 2,
                y: boost.y + boost.height / 2,
                color: BOOST_CONSTANTS.RARITY.COLORS[boost.rarity],
                size: 2 + Math.random() * 3,
                life: 1500,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8
            });
        }

        // Специальные эффекты для определенных бонусов
        if (boost.type === 'HEALTH_BOOST' && window.player) {
            window.boostEffects.createHealthBoostEffect(window.player.x, window.player.y);
        } else if (boost.type === 'COIN_SHOWER') {
            const bonusPoints = Math.floor(window.score * BOOST_CONSTANTS.EFFECTS.COIN_SHOWER.percentage);
            window.boostEffects.createCoinShowerEffect(bonusPoints);
        } else if (boost.type === 'WAVE_BLAST') {
            window.boostEffects.createWaveBlastEffect();
        }
    }

    // 🔍 Диагностика патчей
    checkPatches() {
        // Checking function patches status...
        
        const functions = [
            'handleInput', 'updateGame', 'createPlayerBullet',
            'damagePlayer', 'playerTakeDamage', 'hitPlayer', 'playerHit',
            'destroyInvader', 'killInvader', 'removeInvader', 'destroyEnemy',
            'moveInvaders', 'updateInvaders', 'moveEnemies', 'updateEnemies',
            'renderPlayer', 'renderBackground',
            'updateScoreMultiplier', 'updateScore', 'scoreUpdate', 'updateScoring',
            'updatePlayerBullets', 'updateCrabBullets'
        ];
        
        const patchedFunctions = [];
        const missingFunctions = [];
        
        for (const funcName of functions) {
            if (window[funcName] && typeof window[funcName] === 'function') {
                patchedFunctions.push(funcName);
            } else {
                missingFunctions.push(funcName);
            }
        }
        
        // Patched functions recorded
        // Missing functions recorded
        
        // Check key variables
        const variables = ['player', 'score', 'playerHealth', 'shotCooldown', 'invaderSpeed'];
        // Available variables checked
        for (const varName of variables) {
            const available = window[varName] !== undefined;
            // Variable availability checked
        }
        
        return {
            patchedFunctions,
            missingFunctions,
            totalPatches: patchedFunctions.length
        };
    }

    // 🔄 Сброс интеграции
    reset() {
        this.initialized = false;
    }
}

// Создаем глобальный экземпляр
window.boostIntegration = new BoostIntegration();

// Автоматически инициализируем при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // DOMContentLoaded - initializing boost integration...
    if (window.boostIntegration) {
        window.boostIntegration.initialize();
        // Boost integration initialized via DOMContentLoaded
    } else {
        // boostIntegration not available in DOMContentLoaded
    }
});

// Также инициализируем через таймер на случай, если DOM уже загружен
setTimeout(() => {
    // Timer - checking boost integration initialization...
    if (window.boostIntegration && !window.boostIntegration.initialized) {
        window.boostIntegration.initialize();
        // Boost integration initialized via timer
    } else if (window.boostIntegration && window.boostIntegration.initialized) {
        // Boost integration already initialized
    } else {
        // boostIntegration not available in timer check
    }
}, 1000);