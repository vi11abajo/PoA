// ⭐ BOOST MANAGER
// Основной менеджер системы бонусов-бустеров

class BoostManager {
    constructor() {
        this.activeBoosts = new Map(); // Активные бонусы
        this.droppingBoosts = [];      // Падающие бонусы
        this.speedTamerStacks = 0;     // Количество собранных Speed Tamer
        this.nextBoostId = 1;          // ID для бонусов
        this.imageCache = new Map();   // Кэш изображений бонусов
        
        // Привязываем контекст
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        
        // Загружаем изображения бонусов
        this.loadBoostImages();
    }

    // 🎯 Определяем правильный путь к изображениям
    detectImagesPath() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/tournament/') || currentPath.includes('\\tournament\\')) {
            return '../images';
        }
        return 'images';
    }

    // 🖼️ Загрузка изображений бонусов
    loadBoostImages() {
        const imagesBasePath = this.detectImagesPath();
        const boostImageMap = {
            'RAPID_FIRE': 'rapidFire.png',
            'SHIELD_BARRIER': 'shieldBarrier.png', 
            'SCORE_MULTIPLIER': 'scoreMultiplier.png',
            'POINTS_FREEZE': 'pointsFreeze.png',
            'MULTI_SHOT': 'multiShot.png',
            'HEALTH_BOOST': 'healthBoost.png',
            'PIERCING_BULLETS': 'piercingBullets.png',
            'INVINCIBILITY': 'invincibility.png',
            'GRAVITY_WELL': 'gravityWell.png',
            'RICOCHET': 'ricochet.png',
            'RANDOM_CHAOS': 'randomChaos.png',
            'ICE_FREEZE': 'iceFreeze.png',
            'AUTO_TARGET': 'auto-target.png',
            'COIN_SHOWER': 'coinShower.png',
            'WAVE_BLAST': 'waveBlast.png',
            'SPEED_TAMER': 'speedTamer.png'
        };

        for (const [boostType, filename] of Object.entries(boostImageMap)) {
            const img = new Image();
            img.onload = () => {
                // Boost image loaded successfully
                this.imageCache.set(boostType, img);
            };
            img.onerror = () => {
                console.warn(`❌ Failed to load boost image: ${boostType} (${filename}) - using emoji fallback`);
                // Не добавляем в кэш при ошибке загрузки
            };
            img.src = `${imagesBasePath}/boosts/${filename}`;
        }
    }

    // 🎲 Генерация случайного бонуса с учетом редкости
    generateRandomBoost() {
        const rand = Math.random() * 100;
        let selectedRarity;

        // Определяем редкость
        if (rand <= BOOST_CONSTANTS.RARITY.CHANCES.LEGENDARY) {
            selectedRarity = 'LEGENDARY';
        } else if (rand <= BOOST_CONSTANTS.RARITY.CHANCES.LEGENDARY + BOOST_CONSTANTS.RARITY.CHANCES.EPIC) {
            selectedRarity = 'EPIC';
        } else if (rand <= BOOST_CONSTANTS.RARITY.CHANCES.LEGENDARY + BOOST_CONSTANTS.RARITY.CHANCES.EPIC + BOOST_CONSTANTS.RARITY.CHANCES.RARE) {
            selectedRarity = 'RARE';
        } else {
            selectedRarity = 'COMMON';
        }

        // Выбираем случайный бонус из выбранной редкости
        const availableBoosts = BOOST_CONSTANTS.RARITY.DISTRIBUTION[selectedRarity];
        
        // Если массив пустой, откатываемся к COMMON
        if (!availableBoosts || availableBoosts.length === 0) {
            console.error(`⚠️ No boosts available for rarity ${selectedRarity}, falling back to COMMON`);
            const commonBoosts = BOOST_CONSTANTS.RARITY.DISTRIBUTION['COMMON'];
            const randomIndex = Math.floor(Math.random() * commonBoosts.length);
            const selectedBoost = commonBoosts[randomIndex];
            
            if (BOOST_CONSTANTS.DEBUG_MODE) {
                // Fallback to COMMON rarity
            }
            return selectedBoost;
        }
        
        const randomIndex = Math.floor(Math.random() * availableBoosts.length);
        const selectedBoost = availableBoosts[randomIndex];
        
        if (BOOST_CONSTANTS.DEBUG_MODE) {
            // Boost selected by rarity system
        }
        return selectedBoost;
    }

    // 📦 Создание падающего бонуса
    createDroppingBoost(x, y, type = null) {
        const boostType = type || this.generateRandomBoost();
        
        const boost = {
            id: this.nextBoostId++,
            type: boostType,
            x: x,
            y: y,
            width: BOOST_CONSTANTS.SPAWN.SIZE,
            height: BOOST_CONSTANTS.SPAWN.SIZE,
            speed: BOOST_CONSTANTS.SPAWN.FALL_SPEED,
            lifetime: BOOST_CONSTANTS.SPAWN.LIFETIME,
            age: 0,
            rarity: this.getBoostRarity(boostType),
            glowPhase: 0 // Для анимации свечения
        };

        this.droppingBoosts.push(boost);
        return boost;
    }

    // 🏷️ Получение редкости бонуса
    getBoostRarity(boostType) {
        for (const [rarity, boosts] of Object.entries(BOOST_CONSTANTS.RARITY.DISTRIBUTION)) {
            if (boosts.includes(boostType)) {
                return rarity;
            }
        }
        return 'COMMON';
    }

    // 🎯 Активация бонуса
    activateBoost(boostType) {
        // 🔊 Воспроизводим звук усиления
        if (window.soundManager) {
            // Конвертируем тип усиления в camelCase для звука
            const boostNameForSound = boostType.toLowerCase()
                .split('_')
                .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
            soundManager.playBoostSound(boostNameForSound, 0.7);
        }

        // Проверяем особые случаи
        if (boostType === 'SHIELD_BARRIER' && this.isBoostActive('SHIELD_BARRIER')) {
            return false; // Нельзя взять новый щит пока действует старый
        }

        if (boostType === 'HEALTH_BOOST') {
            // Защита от повторного выполнения мгновенного бонуса
            if (!this.healthBoostProcessed) {
                this.healthBoostProcessed = true;
                this.applyHealthBoost();
                // Сбрасываем флаг через небольшую задержку
                setTimeout(() => { this.healthBoostProcessed = false; }, 100);
            }
            return true;
        }

        if (boostType === 'COIN_SHOWER') {
            // Защита от повторного выполнения мгновенного бонуса
            if (!this.coinShowerProcessed) {
                this.coinShowerProcessed = true;
                this.applyCoinShower();
                // Сбрасываем флаг через небольшую задержку
                setTimeout(() => { this.coinShowerProcessed = false; }, 100);
            }
            return true;
        }

        if (boostType === 'WAVE_BLAST') {
            // Защита от повторного выполнения мгновенного бонуса
            if (!this.waveBlastProcessed) {
                this.waveBlastProcessed = true;
                this.applyWaveBlast();
                // Сбрасываем флаг через небольшую задержку
                setTimeout(() => { this.waveBlastProcessed = false; }, 100);
            }
            return true;
        }

        if (boostType === 'SPEED_TAMER') {
            this.applySpeedTamer();
            return true;
        }

        if (boostType === 'RANDOM_CHAOS') {
            return this.applyRandomChaos();
        }

        // Для обычных бонусов с таймером
        const duration = BOOST_CONSTANTS.DURATIONS[boostType];
        if (duration > 0 || duration === -1) { // Поддерживаем и бесконечные бонусы (-1)
            // Если бонус уже активен, сбрасываем таймер
            const boostData = {
                type: boostType,
                duration: duration,
                startTime: Date.now(),
                // Для Shield Barrier добавляем счетчик заблокированных ударов
                hitsBlocked: boostType === 'SHIELD_BARRIER' ? 0 : undefined
            };
            
            // Для GRAVITY_WELL создаем колодец в случайном месте на безопасном расстоянии
            if (boostType === 'GRAVITY_WELL' && window.player && window.canvas) {
                const minDistance = 100; // Минимальное расстояние от игрока
                const margin = 50; // Отступ от краев экрана
                let attempts = 0;
                let centerX, centerY;
                
                // Ищем подходящее место (максимум 20 попыток)
                do {
                    centerX = margin + Math.random() * (window.canvas.width - 2 * margin);
                    centerY = margin + Math.random() * (window.canvas.height - 2 * margin);
                    
                    const playerCenterX = window.player.x + window.player.width / 2;
                    const playerCenterY = window.player.y + window.player.height / 2;
                    const distanceToPlayer = Math.sqrt(
                        (centerX - playerCenterX) ** 2 + (centerY - playerCenterY) ** 2
                    );
                    
                    if (distanceToPlayer >= minDistance) {
                        break;
                    }
                    attempts++;
                } while (attempts < 20);
                
                boostData.centerX = centerX;
                boostData.centerY = centerY;
                // Gravity Well activated at safe distance from player
            }
            
            this.activeBoosts.set(boostType, boostData);
            
            if (BOOST_CONSTANTS.DEBUG_MODE) {
                // Boost activated successfully
            }
            return true;
        }

        return false;
    }

    // 💚 Применение бонуса здоровья
    applyHealthBoost() {
        // Starting heal process
        
        // В игре используется переменная lives, а не playerHealth
        const maxLives = window.MAX_LIVES || 100; // Используем константу из игры
        const healAmount = BOOST_CONSTANTS.EFFECTS.HEALTH_BOOST.heal;
        
        if (window.lives !== undefined && window.lives < maxLives) {
            const oldLives = window.lives;
            window.lives = Math.min(maxLives, window.lives + healAmount);
            
            // Синхронизируем с локальной переменной если есть функция
            if (typeof window.syncLives === 'function') {
                window.syncLives(window.lives);
            }
            
            // Health Boost: Lives restored
            
            // Создаем визуальный эффект
            this.createHealEffect();
        } else {
            // Health Boost: Lives already at maximum
        }
    }

    // 💰 Применение денежного дождя
    applyCoinShower() {
        const oldScore = window.score;
        const bonusPoints = Math.floor(window.score * BOOST_CONSTANTS.EFFECTS.COIN_SHOWER.percentage);
        
        // Обновляем счет
        window.score += bonusPoints;
        
        // Принудительная синхронизация счета
        if (window.syncScore) {
            window.syncScore(window.score);
        }
        
        // Coin Shower: Added bonus points
        
        // Создаем визуальный эффект
        this.createCoinEffect(bonusPoints);
    }

    // 🌊 Применение волнового взрыва
    applyWaveBlast() {
        if (window.invaders && window.invaders.length > 0) {
            // Находим самый нижний ряд (максимальная Y координата)
            let bottomRowY = -1;
            let bottomRow = -1;
            
            // Сначала найдем самую нижнюю Y координату среди живых врагов
            for (const invader of window.invaders) {
                if (invader.alive && invader.y > bottomRowY) {
                    bottomRowY = invader.y;
                    bottomRow = invader.row;
                }
            }
            
            // Теперь найдем всех врагов с этой Y координатой (весь нижний ряд)
            if (bottomRowY >= 0) {
                const tolerance = 10; // Допуск для сравнения Y координат
                let destroyedCount = 0;
                
                for (const invader of window.invaders) {
                    if (invader.alive && Math.abs(invader.y - bottomRowY) <= tolerance) {
                        invader.alive = false;
                        destroyedCount++;
                        
                        // Добавляем очки за уничтожение
                        let points = 10; // Базовые очки по умолчанию
                        if (window.getInvaderScore) {
                            points = window.getInvaderScore(invader.row);
                        } else {
                            // Fallback система очков по рядам
                            const rowPoints = [40, 30, 20, 15, 10]; // от верхнего к нижнему
                            points = rowPoints[invader.row] || 10;
                        }
                        
                        // Обновляем счет через все возможные способы
                        const oldScore = window.score;
                        window.score += points;
                        
                        // Принудительная синхронизация счета
                        if (window.syncScore) {
                            window.syncScore(window.score);
                        }
                        
                        // Wave Blast: Added points for destroyed enemy
                        
                        // Score updated after Wave Blast
                    }
                }
                
                // Wave Blast destroyed enemies
                
                // Wave Blast completed
            }
        }
        
        // Создаем визуальный эффект волны
        this.createWaveEffect();
    }

    // 🐌 Применение замедлителя скорости
    applySpeedTamer() {
        // Защита от спама активации - максимум один раз в 500мс
        const now = Date.now();
        if (this.lastSpeedTamerActivation && (now - this.lastSpeedTamerActivation) < 500) {
            return;
        }
        this.lastSpeedTamerActivation = now;
        
        this.speedTamerStacks++;
        
        // Применяем эффект ко всем врагам и боссам
        this.updateEnemySpeeds();
        
        // Обновляем UI индикатор
        this.updateSpeedTamerUI();
    }

    // 🎲 Применение случайного хаоса
    applyRandomChaos() {
        const availableBoosts = [];
        
        // Собираем все доступные бонусы кроме самого Random Chaos
        for (const boosts of Object.values(BOOST_CONSTANTS.RARITY.DISTRIBUTION)) {
            for (const boost of boosts) {
                if (boost !== 'RANDOM_CHAOS') {
                    availableBoosts.push(boost);
                }
            }
        }

        if (availableBoosts.length === 0) return false;

        // Выбираем случайный бонус
        const randomBoost = availableBoosts[Math.floor(Math.random() * availableBoosts.length)];
        
        // Генерируем случайную длительность от 10 до 15 секунд (10000-15000 мс)
        const randomDuration = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
        
        // Временно перезаписываем длительность для этого бонуса
        const originalDuration = BOOST_CONSTANTS.DURATIONS[randomBoost];
        BOOST_CONSTANTS.DURATIONS[randomBoost] = randomDuration;
        
        // Применяем бонус
        const result = this.activateBoost(randomBoost);
        
        // Восстанавливаем оригинальную длительность
        BOOST_CONSTANTS.DURATIONS[randomBoost] = originalDuration;
        
        return result;
    }

    // ⚡ Проверка активности бонуса
    isBoostActive(boostType) {
        return this.activeBoosts.has(boostType);
    }

    // 📊 Получение данных активного бонуса
    getActiveBoost(boostType) {
        return this.activeBoosts.get(boostType);
    }

    // 🔄 Обновление бонусов
    update(deltaTime) {
        this.updateDroppingBoosts(deltaTime);
        this.updateActiveBoosts(deltaTime);
    }

    // 📦 Обновление падающих бонусов
    updateDroppingBoosts(deltaTime) {
        for (let i = this.droppingBoosts.length - 1; i >= 0; i--) {
            const boost = this.droppingBoosts[i];
            
            // Обновляем позицию
            boost.y += boost.speed;
            boost.age += deltaTime;
            boost.glowPhase += deltaTime * 0.005; // Анимация свечения
            
            // Проверяем время жизни
            if (boost.age >= boost.lifetime || boost.y > window.canvas.height) {
                this.droppingBoosts.splice(i, 1);
                continue;
            }

            // Проверяем столкновение с игроком
            if (this.checkBoostCollision(boost) && !boost.collected) {
                boost.collected = true; // Помечаем как собранный чтобы избежать двойной активации
                // Activating boost
                
                if (this.activateBoost(boost.type)) {
                    // Создаем эффект подбора
                    this.createPickupEffect(boost);

                    // Уведомляем easterEggManager о подборе бонуса
                    if (window.easterEggManager) {
                        window.easterEggManager.onBoostPickup();
                    }

                    // Boost activated successfully
                } else {
                    // Boost activation failed
                }
                // Удаляем бонус из массива СРАЗУ после активации
                this.droppingBoosts.splice(i, 1);
                i--; // Корректируем индекс после удаления элемента
                continue; // Переходим к следующей итерации
            }
        }
    }

    // ⏰ Обновление активных бонусов
    updateActiveBoosts(deltaTime) {
        for (const [boostType, boost] of this.activeBoosts) {
            // Пропускаем бесконечные бонусы (-1)
            if (boost.duration === -1) {
                continue;
            }
            
            const elapsed = Date.now() - boost.startTime;
            
            if (elapsed >= boost.duration) {
                this.deactivateBoost(boostType);
            }
        }
    }

    // 🚫 Деактивация бонуса
    deactivateBoost(boostType) {
        this.activeBoosts.delete(boostType);
        
        // Специальная обработка для бонусов - сбрасываем статус пуль
        if (boostType === 'MULTI_SHOT') {
            this.resetMultiShotBullets();
        }
        
        if (boostType === 'AUTO_TARGET') {
            this.resetAutoTargetBullets();
        }
        
        // Создаем эффект окончания
        this.createExpireEffect(boostType);
    }

    // 🎯 Проверка столкновения с бонусом
    checkBoostCollision(boost) {
        if (!window.player) {
            // window.player not available for collision check
            return false;
        }

        const collision = boost.x < window.player.x + window.player.width &&
                         boost.x + boost.width > window.player.x &&
                         boost.y < window.player.y + window.player.height &&
                         boost.y + boost.height > window.player.y;

        // Boost collision detected

        return collision;
    }

    // 🎨 Отрисовка бонусов
    render(ctx) {
        this.renderDroppingBoosts(ctx);
        this.renderActiveBoostsUI(ctx);
        this.renderSpeedTamerUI(ctx);
    }

    // 📦 Отрисовка падающих бонусов
    renderDroppingBoosts(ctx) {
        for (const boost of this.droppingBoosts) {
            // Защита от undefined типов
            if (!boost.type || !BOOST_CONSTANTS.INFO[boost.type]) {
                console.error('❌ Invalid boost type:', boost.type);
                continue;
            }
            
            const info = BOOST_CONSTANTS.INFO[boost.type];
            const rarityColor = BOOST_CONSTANTS.RARITY.COLORS[boost.rarity];
            const image = this.imageCache.get(boost.type);

            ctx.save();
            
            if (image && image.complete && image.naturalHeight !== 0) {
                // Рисуем изображение бонуса без рамок и свечения
                
                // Рисуем изображение с сохранением пропорций
                const aspectRatio = image.width / image.height;
                let drawWidth = boost.width;
                let drawHeight = boost.height;
                
                if (aspectRatio > 1) {
                    // Изображение шире, чем высоко
                    drawHeight = drawWidth / aspectRatio;
                } else {
                    // Изображение выше, чем широко
                    drawWidth = drawHeight * aspectRatio;
                }
                
                // Центрируем изображение
                const drawX = boost.x + (boost.width - drawWidth) / 2;
                const drawY = boost.y + (boost.height - drawHeight) / 2;
                
                ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
            } else {
                // Fallback к эмодзи если изображение не загрузилось
                ctx.font = `${boost.width * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.shadowBlur = 3;
                ctx.shadowColor = rarityColor;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                ctx.fillStyle = '#ffffff';
                ctx.fillText(
                    info.icon, 
                    boost.x + boost.width / 2, 
                    boost.y + boost.height / 2
                );
            }
            
            ctx.restore();
        }
    }

    // 🖥️ Отрисовка UI активных бонусов - HTML панель слева от игры
    renderActiveBoostsUI(ctx) {
        const activeBoosts = Array.from(this.activeBoosts.entries());
        const panel = document.getElementById('boostPanel');
        const content = document.getElementById('boostPanelContent');
        
        // Проверяем наличие элементов UI (могут отсутствовать в турнирном режиме)
        if (!panel || !content) {
            return;
        }
        
        if (activeBoosts.length === 0) {
            panel.classList.remove('show');
            return;
        }

        panel.classList.add('show');
        content.innerHTML = '';

        for (const [boostType, boost] of activeBoosts) {
            const info = BOOST_CONSTANTS.INFO[boostType];
            const rarity = this.getBoostRarity(boostType);
            const rarityColor = BOOST_CONSTANTS.RARITY.COLORS[rarity];

            const boostItem = document.createElement('div');
            boostItem.className = 'boost-item';

            // Иконка
            const icon = document.createElement('div');
            icon.className = 'boost-icon';
            
            // Пытаемся использовать изображение вместо эмодзи
            const image = this.imageCache.get(boostType);
            if (image && image.complete && image.naturalHeight > 0) {
                icon.innerHTML = '';
                const img = document.createElement('img');
                img.src = image.src;
                img.style.width = '32px';
                img.style.height = '32px';
                img.style.objectFit = 'contain';
                icon.appendChild(img);
            } else {
                // Fallback к эмодзи
                icon.textContent = info ? info.icon : '⭐';
                icon.style.color = rarityColor;
            }

            // Информация о бонусе
            const boostInfo = document.createElement('div');
            boostInfo.className = 'boost-info';

            // Название
            const name = document.createElement('div');
            name.className = 'boost-name';
            name.textContent = info.name;
            name.style.color = rarityColor;

            // Редкость
            const rarityEl = document.createElement('div');
            rarityEl.className = 'boost-rarity';
            rarityEl.textContent = rarity.charAt(0) + rarity.slice(1).toLowerCase();
            rarityEl.style.color = rarityColor;

            // Таймер
            const timer = document.createElement('div');
            timer.className = 'boost-timer';

            if (boost.duration > 0) {
                const remaining = Math.max(0, boost.duration - (Date.now() - boost.startTime));
                const remainingSeconds = Math.ceil(remaining / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

                timer.textContent = `⏰ ${timeStr}`;
                timer.style.color = remainingSeconds <= 5 ? '#ff4444' : '#ffffff';

                // Прогресс бар
                const progress = remaining / boost.duration;
                const progressBar = document.createElement('div');
                progressBar.className = 'boost-progress';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'boost-progress-bar';
                if (remainingSeconds <= 5) progressFill.classList.add('critical');
                progressFill.style.width = `${progress * 100}%`;
                
                progressBar.appendChild(progressFill);
                boostInfo.appendChild(progressBar);

            } else if (boost.duration === -1) {
                if (boostType === 'SHIELD_BARRIER') {
                    const hitsBlocked = boost.hitsBlocked || 0;
                    const remaining = BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits - hitsBlocked;

                    timer.textContent = `🛡️ ${remaining}/3 blocks`;
                    timer.style.color = remaining <= 1 ? '#ff4444' : '#ffffff';

                    // Блоки визуально
                    const blocksContainer = document.createElement('div');
                    blocksContainer.className = 'boost-blocks';
                    
                    for (let i = 0; i < 3; i++) {
                        const block = document.createElement('div');
                        block.className = 'boost-block';
                        if (i >= remaining) block.classList.add('used');
                        blocksContainer.appendChild(block);
                    }
                    
                    boostInfo.appendChild(blocksContainer);
                } else {
                    timer.textContent = '♾️ Permanent';
                    timer.style.color = '#00ff88';
                }
            }

            boostInfo.appendChild(name);
            boostInfo.appendChild(rarityEl);
            boostInfo.appendChild(timer);

            boostItem.appendChild(icon);
            boostItem.appendChild(boostInfo);
            content.appendChild(boostItem);
        }
    }

    // 🔄 Обновление HTML панели в реальном времени
    updateBoostPanel() {
        const panel = document.getElementById('boostPanel');
        if (!panel || !panel.classList.contains('show')) return;

        const activeBoosts = Array.from(this.activeBoosts.entries());
        const content = document.getElementById('boostPanelContent');
        
        // Проверяем наличие контента (может отсутствовать в турнирном режиме)
        if (!content) return;
        
        const boostItems = content.querySelectorAll('.boost-item');

        boostItems.forEach((item, index) => {
            if (index >= activeBoosts.length) return;

            const [boostType, boost] = activeBoosts[index];
            const timer = item.querySelector('.boost-timer');
            const progressBar = item.querySelector('.boost-progress-bar');
            const blocksContainer = item.querySelector('.boost-blocks');

            if (boost.duration > 0) {
                const remaining = Math.max(0, boost.duration - (Date.now() - boost.startTime));
                const remainingSeconds = Math.ceil(remaining / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

                timer.textContent = `⏰ ${timeStr}`;
                timer.style.color = remainingSeconds <= 5 ? '#ff4444' : '#ffffff';

                if (progressBar) {
                    const progress = remaining / boost.duration;
                    progressBar.style.width = `${progress * 100}%`;
                    if (remainingSeconds <= 5) {
                        progressBar.classList.add('critical');
                    } else {
                        progressBar.classList.remove('critical');
                    }
                }

                // Автоматически убираем истекшие бонусы
                if (remainingSeconds <= 0) {
                    this.renderActiveBoostsUI(null); // Перерисовываем панель
                }

            } else if (boost.duration === -1 && boostType === 'SHIELD_BARRIER') {
                const hitsBlocked = boost.hitsBlocked || 0;
                const remaining = BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits - hitsBlocked;

                timer.textContent = `🛡️ ${remaining}/3 blocks`;
                timer.style.color = remaining <= 1 ? '#ff4444' : '#ffffff';

                if (blocksContainer) {
                    const blocks = blocksContainer.querySelectorAll('.boost-block');
                    blocks.forEach((block, i) => {
                        if (i >= remaining) {
                            block.classList.add('used');
                        } else {
                            block.classList.remove('used');
                        }
                    });
                }
            }
        });
    }

    // 🐌 Отрисовка UI Speed Tamer
    renderSpeedTamerUI(ctx) {
        if (this.speedTamerStacks > 0) {
            const x = 10;
            const y = window.canvas.height - 60;

            // Убрали черный фон - теперь прозрачный

            // Иконка улитки с обводкой для читаемости
            ctx.font = '24px Arial';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeText('🐌', x + 10, y + 25);
            ctx.fillStyle = '#8844aa';
            ctx.fillText('🐌', x + 10, y + 25);

            // Множитель с обводкой
            if (this.speedTamerStacks > 1) {
                ctx.font = '16px Arial';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeText(`x${this.speedTamerStacks}`, x + 40, y + 25);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`x${this.speedTamerStacks}`, x + 40, y + 25);
            }
        }
    }

    // 🔧 Вспомогательные методы для создания эффектов
    createHealEffect() {
        // Создаем зеленый эффект исцеления возле игрока
        if (window.player && window.boostEffects) {
            window.boostEffects.createHealthBoostEffect(
                window.player.x + window.player.width / 2,
                window.player.y + window.player.height / 2
            );
        }
    }

    createCoinEffect(points) {
        // Реализация эффекта монет
    }

    createWaveEffect() {
        // Создаем волновой эффект от игрока
        if (window.player && window.boostEffects) {
            window.boostEffects.createWaveBlastEffect(
                window.player.x + window.player.width / 2,
                window.player.y + window.player.height / 2
            );
        }
    }

    createPickupEffect(boost) {
        // Реализация эффекта подбора
    }

    createExpireEffect(boostType) {
        // Реализация эффекта окончания
    }

    updateEnemySpeeds() {
        // Расчет скорости теперь полностью в game.js - эта функция не нужна
        // SPEED_TAMER: Speed calculation delegated to game.js
    }

    updateSpeedTamerUI() {
        // Обновление индикатора Speed Tamer
    }

    // 🧹 Очистка при переходе на новый уровень
    clearForNewLevel() {
        // Очищаем падающие бонусы
        this.droppingBoosts = [];

        // Сохраняем бонусы, которые могут переходить на следующий уровень
        const persistentBoosts = new Map();
        
        for (const [boostType, boost] of this.activeBoosts) {
            // Speed Tamer и Shield Barrier сохраняются всегда
            if (boostType === 'SPEED_TAMER' || boostType === 'SHIELD_BARRIER') {
                persistentBoosts.set(boostType, boost);
            }
            // Остальные сохраняются если у них есть время
            else if (boost.duration > 0) {
                const elapsed = Date.now() - boost.startTime;
                if (elapsed < boost.duration) {
                    persistentBoosts.set(boostType, boost);
                }
            }
        }

        this.activeBoosts = persistentBoosts;
    }

    // 🎮 Проверка можно ли начать следующий уровень
    canStartNextLevel() {
        return this.droppingBoosts.length === 0;
    }

    // 🎨 Функция для рисования скругленного прямоугольника
    drawRoundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // 🔥 Сброс статуса MULTI_SHOT для всех пуль
    resetMultiShotBullets() {
        // Сбрасываем статус для пуль в объектном пуле
        if (window.performanceOptimizer && window.performanceOptimizer.pools) {
            // Проверяем все пулы пуль
            const poolNames = ['bullets', 'playerBullets'];
            for (const poolName of poolNames) {
                if (window.performanceOptimizer.pools[poolName]) {
                    const bullets = window.performanceOptimizer.pools[poolName];
                    for (let bullet of bullets) {
                        if (bullet && bullet.multiShot) {
                            bullet.multiShot = false;
                            bullet.vx = 0;
                            bullet.vy = -Math.abs(bullet.speed || 5); // Всегда вверх
                            bullet.autoTarget = false; // Убираем конфликтующие флаги
                            delete bullet.originalVx;
                            delete bullet.originalVy;
                        }
                    }
                }
            }
        }

        // Сбрасываем статус для обычного массива пуль
        if (window.bullets) {
            for (let bullet of window.bullets) {
                if (bullet && bullet.multiShot) {
                    bullet.multiShot = false;
                    bullet.vx = 0;
                    bullet.vy = -Math.abs(bullet.speed || 5); // Всегда вверх
                    bullet.autoTarget = false; // Убираем конфликтующие флаги
                    delete bullet.originalVx;
                    delete bullet.originalVy;
                }
            }
        }

        // MULTI_SHOT статус пуль сброшен
    }

    // 🎯 Сброс статуса AUTO_TARGET для всех пуль
    resetAutoTargetBullets() {
        // Сбрасываем статус для пуль в объектном пуле
        if (window.performanceOptimizer && window.performanceOptimizer.pools) {
            // Проверяем все пулы пуль
            const poolNames = ['bullets', 'playerBullets'];
            for (const poolName of poolNames) {
                if (window.performanceOptimizer.pools[poolName]) {
                    const bullets = window.performanceOptimizer.pools[poolName];
                    for (let bullet of bullets) {
                        if (bullet && bullet.autoTarget) {
                            bullet.autoTarget = false;
                            bullet.vx = 0;
                            bullet.vy = -Math.abs(bullet.speed || 5); // Всегда вверх
                            bullet.multiShot = false; // Убираем конфликтующие флаги
                            delete bullet.originalVx;
                            delete bullet.originalVy;
                        }
                    }
                }
            }
        }

        // Сбрасываем статус для обычного массива пуль
        if (window.bullets) {
            for (let bullet of window.bullets) {
                if (bullet && bullet.autoTarget) {
                    bullet.autoTarget = false;
                    bullet.vx = 0;
                    bullet.vy = -Math.abs(bullet.speed || 5); // Всегда вверх
                    bullet.multiShot = false; // Убираем конфликтующие флаги
                    delete bullet.originalVx;
                    delete bullet.originalVy;
                }
            }
        }

        // AUTO_TARGET статус пуль сброшен
    }
}

// Создаем глобальный экземпляр
window.boostManager = new BoostManager();