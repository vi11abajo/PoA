// 👑 PHAROS INVADERS - СИСТЕМА БОСОВ
// Полная система с уникальными атаками, фазами и спецспособностями


class BossSystemV2 {
    constructor() {
        this.currentBoss = null;
        this.bossBullets = [];
        this.bossParticles = [];
        this.bossImages = {};
        this.bossImagesLoaded = {};
        this.canvas = null;
        this.ctx = null;
        
        // Эффекты для спецспособностей
        this.playerBlindness = 0;
        this.playerFrozenBullets = [];
        this.frozenBulletsTime = 0;
        
        this.initBossImages();
    }

    // 📊 КОНФИГУРАЦИЯ БОСОВ
    getBossConfig() {
        return {
            // Уровни появления босов
            BOSS_LEVELS: [3, 6, 9, 12, 15],
            
            // Базовые характеристики
            BASE_HP: 50,
            HP_INCREASE_PER_BOSS: 25,
            BASE_SCORE: 1000,
            
            // Размеры и движение
            WIDTH: 200,
            HEIGHT: 160,
            START_Y: 70,
            SPEED: 2.0, // Match old boss system speed
            
            // Общие параметры атак
            BULLET_SPEED: 3,
            BULLET_SIZE: 10,
            
            // Данные босов
            BOSSES: {
                1: {
                    name: 'Emerald Warlord',
                    color: '#33cc66',
                    image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSGreen.png',
                    phases: 1
                },
                2: {
                    name: 'Azure Leviathan', 
                    color: '#3366ff',
                    image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossBlue.png',
                    phases: 2
                },
                3: {
                    name: 'Solar Kraken',
                    color: '#ffdd33',
                    image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossYellow.png',
                    phases: 3
                },
                4: {
                    name: 'Crimson Behemoth',
                    color: '#ff3333', 
                    image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossRed.png',
                    phases: 4
                },
                5: {
                    name: 'Void Sovereign',
                    color: '#9966ff',
                    image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossViolet.png',
                    phases: 5
                }
            }
        };
    }

    // 🖼️ ИНИЦИАЛИЗАЦИЯ ИЗОБРАЖЕНИЙ
    initBossImages() {
        const config = this.getBossConfig();
        Object.keys(config.BOSSES).forEach(bossNumber => {
            const bossData = config.BOSSES[bossNumber];
            const img = new Image();
            
            this.bossImages[bossNumber] = img;
            this.bossImagesLoaded[bossNumber] = false;
            
            img.src = bossData.image;
            img.onload = () => {
                this.bossImagesLoaded[bossNumber] = true;
            };
            img.onerror = () => {
                this.bossImagesLoaded[bossNumber] = false;
                Logger.error(`❌ Failed to load boss ${bossNumber} image`);
            };
        });
    }

    // 🎯 СОЗДАНИЕ БОСА
    createBoss(level) {
        if (!this.isBossLevel(level)) return null;
        
        const bossNumber = this.getBossNumber(level);
        const config = this.getBossConfig();
        const bossData = config.BOSSES[bossNumber];
        
        // Получаем canvas
        this.canvas = this.getCanvas();
        if (!this.canvas) {
            Logger.error('❌ Canvas not found for boss creation');
            return null;
        }
        this.ctx = this.canvas.getContext('2d');
        
        const maxHP = config.BASE_HP + (bossNumber - 1) * config.HP_INCREASE_PER_BOSS;
        
        this.currentBoss = {
            // Базовые параметры
            x: this.canvas.width / 2 - config.WIDTH / 2,
            y: -config.HEIGHT,
            width: config.WIDTH,
            height: config.HEIGHT,
            
            // Характеристики
            bossNumber: bossNumber,
            name: bossData.name,
            color: bossData.color,
            maxHP: maxHP,
            currentHP: maxHP,
            
            // Фазы и состояние
            maxPhases: bossData.phases,
            currentPhase: 1,
            state: 'appearing',
            
            // Движение и анимация
            speed: config.SPEED,
            direction: 1,
            baseY: config.START_Y,
            animationTime: 0,
            
            // Атаки
            lastAttackTime: 0,
            nextAttackDelay: 2000,
            
            // Спецспособности
            lastSpecialAbility: Date.now(), // Устанавливаем текущее время чтобы способность не активировалась сразу
            specialCooldown: this.getInitialSpecialCooldown(bossNumber),
            
            // Система динамических очков
            spawnTime: Date.now(),
            
            // Эффекты
            damageFlash: 0,
            damageSlowdown: 0, // Замедление при получении урона
            phaseTransition: false,
            invulnerable: false,
            
            // Уникальные данные для каждого босса
            uniqueData: this.initBossUniqueData(bossNumber)
        };
        
        return this.currentBoss;
    }

    // 🔧 ИНИЦИАЛИЗАЦИЯ УНИКАЛЬНЫХ ДАННЫХ БОССА
    initBossUniqueData(bossNumber) {
        switch(bossNumber) {
            case 1: // Emerald Warlord
                return {
                    lastRegenTime: 0,
                    regenCooldown: 5000 + Math.random() * 5000, // От 5 до 10 секунд
                    
                    // Дополнительная атака (зигзаг клешни)
                    lastSecondaryAttack: 0,
                    secondaryAttackDelay: 1000 + Math.random() * 1200 // От 1.0 до 2.2 секунд
                };
            case 2: // Azure Leviathan
                return {
                    shieldHP: 0,
                    maxShieldHP: 5
                };
            case 3: // Solar Kraken
                return {
                    explosiveBullets: [],
                    lastMeteorShower: 0,
                    meteorShowerCooldown: 12000 + Math.random() * 6000 // От 12 до 18 секунд
                };
            case 4: // Crimson Behemoth
                return {
                    rageMode: false,
                    rageDuration: 0,
                    rageSpeedMultiplier: 1.0,
                    rageFrequencyMultiplier: 1.0,
                    immuneToSlowdown: false // Изначально НЕТ иммунитета
                };
            case 5: // Void Sovereign
                return {
                    clones: [],
                    portals: []
                };
            default:
                return {};
        }
    }

    // 🔍 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    getCanvas() {
        return window.canvas || 
               document.getElementById('gameCanvas') || 
               document.getElementById('tournamentGameCanvas');
    }

    isBossLevel(level) {
        return this.getBossConfig().BOSS_LEVELS.includes(level);
    }

    getBossNumber(level) {
        const index = this.getBossConfig().BOSS_LEVELS.indexOf(level);
        return index !== -1 ? index + 1 : 0;
    }

    getBossHP(level) {
        const bossNumber = this.getBossNumber(level);
        const config = this.getBossConfig();
        return config.BASE_HP + (bossNumber - 1) * config.HP_INCREASE_PER_BOSS;
    }

    getBossScore(bossNumber) {
        const config = this.getBossConfig();
        return config.BASE_SCORE * bossNumber * 10;
    }

    // Динамические очки босса с уменьшением по времени
    getDynamicBossScore(boss) {
        const baseScore = this.getBossScore(boss.bossNumber);
        const currentTime = Date.now();
        const elapsedTime = currentTime - boss.spawnTime;
        
        // Используем те же константы что и для обычных крабов
        const DECAY_INTERVAL = 2500;  // 2.5 секунды
        const DECAY_RATE = 0.01;      // 1% за интервал
        const MIN_PERCENTAGE = 0.01;  // минимум 1%
        
        // Рассчитываем количество прошедших интервалов
        const intervalsPassed = Math.floor(elapsedTime / DECAY_INTERVAL);
        
        // Рассчитываем текущий множитель
        const decayAmount = intervalsPassed * DECAY_RATE;
        const scoreMultiplier = Math.max(MIN_PERCENTAGE, 1.0 - decayAmount);
        
        // Возвращаем финальные очки (но не меньше 1)
        return Math.max(1, Math.floor(baseScore * scoreMultiplier));
    }

    // ⚡ ОБНОВЛЕНИЕ БОСА
    update(deltaTime) {
        if (!this.currentBoss) return;
        
        const boss = this.currentBoss;
        boss.animationTime += deltaTime;
        
        // Обновляем эффекты спецспособностей
        this.updateSpecialEffects(deltaTime);
        
        // Обновляем состояние в зависимости от фазы
        switch(boss.state) {
            case 'appearing':
                this.updateAppearing(boss, deltaTime);
                break;
            case 'fighting':
                this.updateFighting(boss, deltaTime);
                break;
            case 'phase_transition':
                this.updatePhaseTransition(boss, deltaTime);
                break;
            case 'dying':
                this.updateDying(boss, deltaTime);
                break;
        }
        
        // Обновляем пули и частицы
        this.updateBossBullets(deltaTime);
        this.updateBossParticles(deltaTime);
    }

    // 📈 ПОЯВЛЕНИЕ БОСА
    updateAppearing(boss, deltaTime) {
        boss.y += 60 * deltaTime;
        
        if (boss.y >= boss.baseY) {
            boss.y = boss.baseY;
            boss.state = 'fighting';
        }
    }

    // ⚔️ СОСТОЯНИЕ БОЯ
    updateFighting(boss, deltaTime) {
        // Движение босса
        this.updateBossMovement(boss, deltaTime);
        
        // Проверяем смену фазы
        this.checkPhaseTransition(boss);
        
        // Атаки
        this.updateBossAttacks(boss);
        
        // Дополнительные атаки (для конкретных босов)
        this.updateSecondaryAttacks(boss);
        
        // Спецспособности
        this.updateSpecialAbilities(boss);
        
        // Убираем флеш эффект урона
        if (boss.damageFlash > 0) {
            boss.damageFlash -= deltaTime;
        }
        
        // Убираем замедление при получении урона (если нет иммунитета от Rage Mode)
        if (boss.damageSlowdown > 0 && !boss.uniqueData.immuneToSlowdown) {
            boss.damageSlowdown -= deltaTime;
        } else if (boss.uniqueData.immuneToSlowdown) {
            boss.damageSlowdown = 0; // Мгновенно убираем замедление в режиме ярости
        }
    }

    // 🔄 ПЕРЕХОД МЕЖДУ ФАЗАМИ
    updatePhaseTransition(boss, deltaTime) {
        if (!boss.phaseTransition) {
            boss.phaseTransition = true;
            boss.invulnerable = true;
            
            // Создаем эффект смены фазы
            this.createPhaseTransitionEffect(boss);
            
            setTimeout(() => {
                boss.currentPhase++;
                boss.state = 'fighting';
                boss.phaseTransition = false;
                boss.invulnerable = false;
            }, 2000);
        }
    }

    // 💀 СОСТОЯНИЕ СМЕРТИ
    updateDying(boss, deltaTime) {
        boss.y += 30 * deltaTime;
        
        // Создаем частицы смерти
        if (Math.random() < 0.3) {
            this.createDeathParticles(boss);
        }
        
        setTimeout(() => {
            this.currentBoss = null;
        }, 3000);
    }

    // 🚶 ДВИЖЕНИЕ БОСА
    updateBossMovement(boss, deltaTime) {
        // Горизонтальное движение с учетом замедления при уроне
        let currentSpeed = boss.speed;
        if (boss.damageSlowdown > 0 && !boss.uniqueData.immuneToSlowdown) {
            currentSpeed = boss.speed * 0.5; // Замедление в 2 раза при получении урона (если нет иммунитета)
        }
        boss.x += currentSpeed * boss.direction * deltaTime;
        
        // Проверка границ
        if (boss.x <= 0) {
            boss.x = 0;
            boss.direction = 1;
        } else if (boss.x >= this.canvas.width - boss.width) {
            boss.x = this.canvas.width - boss.width;
            boss.direction = -1;
        }
        
        // Вертикальное покачивание
        const bobbing = Math.sin(boss.animationTime * 0.002) * 10;
        boss.y = boss.baseY + bobbing;
    }

    // 📊 ПРОВЕРКА СМЕНЫ ФАЗЫ
    checkPhaseTransition(boss) {
        if (boss.currentPhase >= boss.maxPhases) return;
        
        const phaseThreshold = boss.maxHP * (boss.maxPhases - boss.currentPhase) / boss.maxPhases;
        
        if (boss.currentHP <= phaseThreshold && boss.state === 'fighting') {
            boss.state = 'phase_transition';
        }
    }

    // 🎯 ОБНОВЛЕНИЕ АТАК
    updateBossAttacks(boss) {
        const now = Date.now();
        
        // Применяем модификатор частоты атак для Rage Mode (уменьшаем задержку)
        let effectiveAttackDelay = boss.nextAttackDelay;
        if (boss.uniqueData.rageFrequencyMultiplier) {
            effectiveAttackDelay = boss.nextAttackDelay / boss.uniqueData.rageFrequencyMultiplier;
        }
        
        if (now - boss.lastAttackTime >= effectiveAttackDelay) {
            this.performBossAttack(boss);
            boss.lastAttackTime = now;
            boss.nextAttackDelay = this.getAttackDelay(boss);
        }
    }

    // 🔫 ОБНОВЛЕНИЕ ДОПОЛНИТЕЛЬНЫХ АТАК
    updateSecondaryAttacks(boss) {
        // Дополнительные атаки только для первого босса
        if (boss.bossNumber === 1) {
            const now = Date.now();
            
            if (now - boss.uniqueData.lastSecondaryAttack >= boss.uniqueData.secondaryAttackDelay) {
                this.performSecondaryAttack(boss);
                boss.uniqueData.lastSecondaryAttack = now;
                // Устанавливаем новый рандомный интервал
                boss.uniqueData.secondaryAttackDelay = 1000 + Math.random() * 1200; // 1.0-2.2 секунд
            }
        }
    }

    // ⭐ ОБНОВЛЕНИЕ СПЕЦСПОСОБНОСТЕЙ
    updateSpecialAbilities(boss) {
        const now = Date.now();
        
        if (now - boss.lastSpecialAbility >= boss.specialCooldown) {
            this.activateSpecialAbility(boss);
            boss.lastSpecialAbility = now;
            // Обновляем кулдаун для следующего раза (рандомный интервал)
            boss.specialCooldown = this.getNextSpecialCooldown(boss.bossNumber);
        }
    }

    // 🎯 ПОЛУЧЕНИЕ НАЧАЛЬНОГО КУЛДАУНА СПЕЦСПОСОБНОСТИ
    getInitialSpecialCooldown(bossNumber) {
        switch(bossNumber) {
            case 1: // Emerald Warlord - частые регенерации
                return 5000 + Math.random() * 4000; // 5-9 секунд
            case 2: // Azure Leviathan
                return 7000 + Math.random() * 8000; // 7-15 секунд
            case 3: // Solar Kraken - Meteor Shower
                return 12000 + Math.random() * 6000; // 12-18 секунд
            case 4: // Crimson Behemoth - Rage Mode
                return 6000 + Math.random() * 4000; // 6-10 секунд
            case 5: // Void Sovereign - Temporal Freeze
                return 7000 + Math.random() * 8000; // 7-15 секунд
            default:
                return 15000;
        }
    }

    // 🔄 ПОЛУЧЕНИЕ СЛЕДУЮЩЕГО КУЛДАУНА СПЕЦСПОСОБНОСТИ
    getNextSpecialCooldown(bossNumber) {
        switch(bossNumber) {
            case 1: // Emerald Warlord - варьируемые регенерации
                return 5000 + Math.random() * 4000; // 5-9 секунд
            case 2: // Azure Leviathan
                return 7000 + Math.random() * 8000; // 7-15 секунд
            case 3: // Solar Kraken - Meteor Shower
                return 12000 + Math.random() * 6000; // 12-18 секунд
            case 4: // Crimson Behemoth - Rage Mode
                return 6000 + Math.random() * 4000; // 6-10 секунд
            case 5: // Void Sovereign - Temporal Freeze
                return 7000 + Math.random() * 8000; // 7-15 секунд
            default:
                return 15000;
        }
    }

    // 💥 ВЫПОЛНЕНИЕ АТАКИ БОСА
    performBossAttack(boss) {
        switch(boss.bossNumber) {
            case 1: // Emerald Warlord
                this.emeraldWarlordAttack(boss);
                break;
            case 2: // Azure Leviathan
                this.azureLeviathan(boss);
                break;
            case 3: // Solar Kraken
                this.solarKrakenAttack(boss);
                break;
            case 4: // Crimson Behemoth
                this.crimsonBehemothAttack(boss);
                break;
            case 5: // Void Sovereign
                this.voidSovereignAttack(boss);
                break;
        }
    }

    // 🔫 ВЫПОЛНЕНИЕ ДОПОЛНИТЕЛЬНОЙ АТАКИ
    performSecondaryAttack(boss) {
        switch(boss.bossNumber) {
            case 1: // Emerald Warlord - зигзаг клешни
                this.emeraldWarlordSecondaryAttack(boss);
                break;
            // Другие боссы могут иметь свои дополнительные атаки
        }
    }

    // 🔢 ПОЛУЧЕНИЕ ЗАДЕРЖКИ МЕЖДУ АТАКАМИ
    getAttackDelay(boss) {
        const baseDelay = 2000;
        const phaseMultiplier = 1 - (boss.currentPhase - 1) * 0.2; // Каждая фаза = -20% к задержке
        return baseDelay * phaseMultiplier + Math.random() * 1000;
    }

    // ⭐ АКТИВАЦИЯ СПЕЦСПОСОБНОСТИ
    activateSpecialAbility(boss) {
        switch(boss.bossNumber) {
            case 1: // Regeneration
                this.regenerationAbility(boss);
                break;
            case 2: // Water Shield
                this.waterShieldAbility(boss);
                break;
            case 3: // Meteor Shower
                this.meteorShowerAbility(boss);
                break;
            case 4: // Rage Mode
                this.rageModeAbility(boss);
                break;
            case 5: // Temporal Freeze
                this.temporalFreezeAbility(boss);
                break;
        }
    }

    // 🌟 ОБНОВЛЕНИЕ ЭФФЕКТОВ СПЕЦСПОСОБНОСТЕЙ
    updateSpecialEffects(deltaTime) {
        // Ослепление игрока
        if (this.playerBlindness > 0) {
            this.playerBlindness -= deltaTime;
        }
        
        // Заморозка пуль
        if (this.frozenBulletsTime > 0) {
            this.frozenBulletsTime -= deltaTime;
            if (this.frozenBulletsTime <= 0) {
                this.unfreezeBullets();
            }
        }
        
        // Режим ярости для босса 4 - используем реальное время в миллисекундах
        if (this.currentBoss && this.currentBoss.uniqueData.rageMode) {
            const now = Date.now();
            const elapsed = now - this.currentBoss.uniqueData.rageStartTime;
            
            if (elapsed >= this.currentBoss.uniqueData.rageDuration) {
                // Выключаем режим ярости и сбрасываем все модификаторы
                this.currentBoss.uniqueData.rageMode = false;
                this.currentBoss.speed = this.getBossConfig().SPEED; // Возвращаем нормальную скорость
                this.currentBoss.uniqueData.rageSpeedMultiplier = 1.0; 
                this.currentBoss.uniqueData.rageFrequencyMultiplier = 1.0;
                this.currentBoss.uniqueData.immuneToSlowdown = false; // Убираем иммунитет
                
            }
        }
    }

    // 💥 НАНЕСЕНИЕ УРОНА БОССУ
    damageBoss(damage) {
        if (!this.currentBoss || this.currentBoss.invulnerable || this.currentBoss.state === 'dying') {
            return { hit: false, killed: false, score: 0 };
        }
        
        const boss = this.currentBoss;
        
        // Проверяем щит для босса 2
        if (boss.bossNumber === 2 && boss.uniqueData.shieldHP > 0) {
            boss.uniqueData.shieldHP--;
            this.createShieldHitEffect(boss);
            
            // Если щит разрушен, запускаем спецатаку
            if (boss.uniqueData.shieldHP <= 0) {
                this.azureLeviathanceShieldBreakAttack(boss);
            }
            
            return { hit: true, killed: false, score: 0 };
        }
        
        // Наносим урон
        boss.currentHP -= damage;
        boss.damageFlash = 300; // Эффект мигания на 300мс
        
        // Замедляем босса при получении урона (как в старой системе)
        boss.damageSlowdown = 2000; // Замедление на 2 секунды
        
        // Создаем частицы попадания
        this.createHitParticles(boss);
        
        // Ярость у босса 4 активируется только через систему специальных способностей
        
        // Проверяем смерть
        if (boss.currentHP <= 0) {
            boss.currentHP = 0;
            boss.state = 'dying';
            
            // Очищаем все пули босса при его смерти
            this.bossBullets = [];
            
            // Рассчитываем количество HP для восстановления: босс 1 = +1 HP, босс 2 = +2 HP, и т.д.
            const healAmount = boss.bossNumber;
            
            // Используем динамические очки с уменьшением по времени
            const score = this.getDynamicBossScore(boss);
            
            return { hit: true, killed: true, score: score, healAmount: healAmount };
        }
        
        return { hit: true, killed: false, score: 0 };
    }

    // 🎯 ПРОВЕРКА КОЛЛИЗИЙ С ПУЛЯМИ ИГРОКА
    checkCollisionWithPlayerBullets(playerBullets) {
        if (!this.currentBoss) return { bulletsToRemove: [], result: { hit: false, killed: false, score: 0 } };
        
        const boss = this.currentBoss;
        const bulletsToRemove = [];
        let result = { hit: false, killed: false, score: 0 };
        
        for (let i = 0; i < playerBullets.length; i++) {
            const bullet = playerBullets[i];
            
            // Проверяем пересечение
            if (bullet.x < boss.x + boss.width &&
                bullet.x + bullet.width > boss.x &&
                bullet.y < boss.y + boss.height &&
                bullet.y + bullet.height > boss.y) {
                
                bulletsToRemove.push(i);
                result = this.damageBoss(1);
                break; // Одна пуля = один урон
            }
        }
        
        return { bulletsToRemove, result };
    }

    // 🎯 ПРОВЕРКА КОЛЛИЗИЙ ПУЛЬ БОСА С ИГРОКОМ
    checkCollisionWithPlayer(player) {
        const bulletsToRemove = [];
        let playerHit = false;
        
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const bullet = this.bossBullets[i];
            
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                
                bulletsToRemove.push(i);
                this.bossBullets.splice(i, 1);
                playerHit = true;
            }
        }
        
        return playerHit;
    }

    // 🚀 ОБНОВЛЕНИЕ ПУЛЬ БОСА
    updateBossBullets(deltaTime) {
        if (!this.canvas) return;
        
        this.bossBullets = this.bossBullets.filter(bullet => {
            // Обновляем позицию
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            
            // Добавляем след
            if (!bullet.trail) bullet.trail = [];
            bullet.trail.push({ x: bullet.x + bullet.width/2, y: bullet.y + bullet.height/2 });
            if (bullet.trail.length > 6) bullet.trail.shift();
            
            // Специальная логика для разных типов пуль
            this.updateSpecialBullet(bullet, deltaTime);
            
            // Удаляем если вышла за границы
            return bullet.y < this.canvas.height + 50 &&
                   bullet.x > -50 &&
                   bullet.x < this.canvas.width + 50 &&
                   bullet.y > -50;
        });
    }

    // ✨ ОБНОВЛЕНИЕ СПЕЦИАЛЬНЫХ ПУЛЬ
    updateSpecialBullet(bullet, deltaTime) {
        switch(bullet.type) {
            case 'zigzag':
                bullet.zigzagTime += deltaTime;
                const zigzagInterval = 30; // Очень быстрые повороты каждые 30мс
                const nextChangeTime = zigzagInterval * (bullet.zigzagCounter + 1);
                
                // Логируем каждый 5й кадр для отслеживания
                if (Math.floor(bullet.zigzagTime) % 5 === 0) {
                }
                
                // Проверяем, пора ли менять направление
                if (bullet.zigzagTime >= nextChangeTime && bullet.zigzagCounter < 6) { // Увеличил до 6 поворотов для густого зигзага
                    const oldVx = bullet.vx;
                    bullet.vx = -bullet.vx; // Инвертируем направление
                    bullet.zigzagCounter++; // Увеличиваем счетчик
                    
                }
                break;
            case 'explosive':
                if (bullet.timer) {
                    bullet.timer -= deltaTime;
                    if (bullet.timer <= 0) {
                        this.explodeBullet(bullet);
                    }
                }
                break;
            case 'homing':
                // Простой самонаведение на игрока
                if (window.player) {
                    const dx = (window.player.x + window.player.width/2) - (bullet.x + bullet.width/2);
                    const dy = (window.player.y + window.player.height/2) - (bullet.y + bullet.height/2);
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance > 0) {
                        const homingStrength = 0.5;
                        bullet.vx += (dx / distance) * homingStrength * deltaTime;
                        bullet.vy += (dy / distance) * homingStrength * deltaTime;
                    }
                }
                break;
        }
    }

    // 🔥 ОБНОВЛЕНИЕ ЧАСТИЦ
    updateBossParticles(deltaTime) {
        this.bossParticles = this.bossParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 0.1 * deltaTime; // Гравитация
            particle.life -= deltaTime;
            
            return particle.life > 0;
        });
    }

    // 🔥 СОЗДАНИЕ ЭФФЕКТОВ И ЧАСТИЦ

    // 🎯 Эффект попадания
    createHitParticles(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        for (let i = 0; i < 8; i++) {
            this.bossParticles.push({
                x: centerX + (Math.random() - 0.5) * boss.width * 0.6,
                y: centerY + (Math.random() - 0.5) * boss.height * 0.6,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                size: Math.random() * 2 + 1,
                color: '#ffff00',
                type: 'hit'
            });
        }
    }

    // 🛡️ Эффект попадания в щит
    createShieldHitEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        for (let i = 0; i < 6; i++) {
            this.bossParticles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 25,
                maxLife: 25,
                size: Math.random() * 3 + 2,
                color: '#0099ff',
                type: 'shield_hit'
            });
        }
        
    }

    // 💀 Эффекты смерти
    createDeathParticles(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        for (let i = 0; i < 5; i++) {
            this.bossParticles.push({
                x: centerX + (Math.random() - 0.5) * boss.width,
                y: centerY + (Math.random() - 0.5) * boss.height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 40,
                maxLife: 40,
                size: Math.random() * 4 + 2,
                color: boss.color,
                type: 'death'
            });
        }
    }

    // 🌟 Эффект смены фазы
    createPhaseTransitionEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        // Создаем круговую волну частиц
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const radius = 20;
            
            this.bossParticles.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 60,
                maxLife: 60,
                size: 4,
                color: boss.color,
                type: 'phase_transition'
            });
        }
        
    }

    // 💥 Эффект взрыва
    createExplosionParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.bossParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 40,
                maxLife: 40,
                size: Math.random() * 4 + 2,
                color: color,
                type: 'explosion'
            });
        }
    }

    // 🌀 Эффект телепортации
    createTeleportEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.bossParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                size: Math.random() * 3 + 1,
                color: '#9966ff',
                type: 'teleport'
            });
        }
    }

    getCurrentBoss() {
        return this.currentBoss;
    }

    getBossBullets() {
        return this.bossBullets;
    }

    getBossParticles() {
        return this.bossParticles;
    }

    clearBoss() {
        this.currentBoss = null;
        this.bossBullets = [];
        this.bossParticles = [];
        this.playerBlindness = 0;
        this.playerFrozenBullets = [];
        this.frozenBulletsTime = 0;
    }

    getBossStatus() {
        if (!this.currentBoss) return null;
        
        return {
            name: this.currentBoss.name,
            currentHP: this.currentBoss.currentHP,
            maxHP: this.currentBoss.maxHP,
            currentPhase: this.currentBoss.currentPhase,
            maxPhases: this.currentBoss.maxPhases,
            state: this.currentBoss.state
        };
    }

}

// Экспортируем систему босов
window.BossSystemV2 = BossSystemV2;
window.BossSystem = BossSystemV2; // Для совместимости
