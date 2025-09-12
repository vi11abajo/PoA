// 🔥 PHAROS INVADERS - УНИКАЛЬНЫЕ АТАКИ БОСОВ
// Реализация всех уникальных атак для каждого из 5 босов


// Добавляем методы атак в класс BossSystemV2
Object.assign(BossSystemV2.prototype, {
    // 🟢 БОСС 1 - EMERALD WARLORD - Основная постоянная атака
    emeraldWarlordAttack(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        // Основная атака - всегда одиночная пуля
        switch(boss.currentPhase) {
            case 1: // Фаза 1 - одна прямая пуля
                this.createStraightBullet(centerX, centerY, boss.color);
                break;
        }
        
    },

    // 🟢 Дополнительная атака Emerald Warlord - "Claw Strike" (независимая)
    emeraldWarlordSecondaryAttack(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        switch(boss.currentPhase) {
            case 1: // Фаза 1 - зигзаг клешни
                this.createZigzagBullet(centerX - 50, centerY, boss.color, 'left', 'A');
                this.createZigzagBullet(centerX + 50, centerY, boss.color, 'right', 'B');
                break;
        }
        
    },

    // 🔵 БОСС 2 - AZURE LEVIATHAN - "Tidal Wave" (волна пуль синусоидой)
    azureLeviathan(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        switch(boss.currentPhase) {
            case 1: // Фаза 1 - медленные большие пули
                this.createLargeBullet(centerX, centerY, boss.color);
                break;
                
            case 2: // Фаза 2 - волна из 7 пуль
                this.createTidalWave(centerX, centerY, boss.color);
                break;
        }
        
    },

    // 🔵 СПЕЦАТАКА ПРИ РАЗРУШЕНИИ ЩИТА - Azure Leviathan
    azureLeviathanceShieldBreakAttack(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        // Мощная круговая атака при разрушении щита
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const bullet = {
                x: centerX - this.getBossConfig().BULLET_SIZE / 2,
                y: centerY,
                width: this.getBossConfig().BULLET_SIZE + 3,
                height: this.getBossConfig().BULLET_SIZE + 3,
                vx: Math.cos(angle) * this.getBossConfig().BULLET_SPEED * 1.2,
                vy: Math.sin(angle) * this.getBossConfig().BULLET_SPEED * 1.2,
                color: boss.color,
                type: 'shield_break',
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
        
        // Создаем дополнительный эффект взрыва щита
        this.createShieldBreakEffect(boss);
        
    },

    // 🟡 БОСС 3 - SOLAR KRAKEN - "Solar Flare" (взрывающиеся пули)
    solarKrakenAttack(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        switch(boss.currentPhase) {
            case 1: // Фаза 1 - прямые выстрелы (скорость +22%)
                this.createStraightBullet(centerX, centerY, boss.color, 1.22);
                break;
                
            case 2: // Фаза 2 - круговая атака (скорость пуль +11%)
                this.createCircularAttack(centerX, centerY, boss.color, 1.11);
                break;
                
            case 3: // Фаза 3 - взрывные пули (только вниз)
                this.createExplosiveBullets(centerX, centerY, boss.color, 5);
                break;
        }
        
    },

    // 🔴 БОСС 4 - CRIMSON BEHEMOTH - "Crimson Meteor" (метеориты с rage режимом)
    crimsonBehemothAttack(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        // Проверяем режим ярости для увеличения скорости пуль на 55%
        const speedMultiplier = boss.uniqueData.rageMode ? 1.55 : 1.0;
        
        switch(boss.currentPhase) {
            case 1: // Фаза 1 - одиночные метеориты
                this.createMeteorBullet(centerX, centerY, boss.color, speedMultiplier);
                break;
                
            case 2: // Фаза 2 - двойные метеориты
                this.createMeteorBullet(centerX - 40, centerY, boss.color, speedMultiplier);
                this.createMeteorBullet(centerX + 40, centerY, boss.color, speedMultiplier);
                break;
                
            case 3: // Фаза 3 - тройные метеориты
                this.createMeteorBullet(centerX - 60, centerY, boss.color, speedMultiplier);
                this.createMeteorBullet(centerX, centerY, boss.color, speedMultiplier);
                this.createMeteorBullet(centerX + 60, centerY, boss.color, speedMultiplier);
                break;
                
            case 4: // Фаза 4 - берсерк режим
                this.createBerserkAttack(centerX, centerY, boss.color, speedMultiplier);
                break;
        }
        
    },

    // 🟣 БОСС 5 - VOID SOVEREIGN - "Void Rift" (портали з кулями)
    voidSovereignAttack(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height;
        
        switch(boss.currentPhase) {
            case 1: // Фаза 1 - телепортация + прямые выстрелы
                this.createTeleportAttack(boss, centerX, centerY);
                break;
                
            case 2: // Фаза 2 - телепортация + спиральные атаки
                this.createTeleportAttack(boss, centerX, centerY);
                setTimeout(() => {
                    this.createSpiralAttack(boss.x + boss.width/2, boss.y + boss.height, boss.color);
                }, 200);
                break;
                
            case 3: // Фаза 3 - телепортация + клонирование
                this.createTeleportAttack(boss, centerX, centerY);
                setTimeout(() => {
                    this.createCloneAttack(boss);
                }, 300);
                break;
                
            case 4: // Фаза 4 - телепортация + гравитационные волны
                this.createTeleportAttack(boss, centerX, centerY);
                setTimeout(() => {
                    this.createGravityWave(boss.x + boss.width/2, boss.y + boss.height, boss.color);
                }, 250);
                break;
                
            case 5: // Фаза 5 - финальный хаос (без телепортации)
                this.createChaosAttack(boss);
                break;
        }
        
    },

    // ====== РЕАЛИЗАЦИЯ СПЕЦИАЛЬНЫХ ТИПОВ ПУЛЬ ======

    // 🔧 Зигзаг пули (для Emerald Warlord)
    createZigzagBullet(x, y, color, direction, zigzagPattern) {
        const config = this.getBossConfig();
        
        const bullet = {
            x: x - config.BULLET_SIZE / 2,
            y: y,
            width: config.BULLET_SIZE,
            height: config.BULLET_SIZE,
            vx: zigzagPattern === 'A' ? -2.0 : 2.0, // Возвращаю прошлую скорость
            vy: config.BULLET_SPEED, // Возвращаю стандартную вертикальную скорость
            color: color,
            type: 'zigzag',
            zigzagTime: 0, // Все начинают с 0
            zigzagPattern: zigzagPattern, // Уникальный ID паттерна
            zigzagCounter: 0, // Счетчик смен направления
            trail: []
        };
        
        this.bossBullets.push(bullet);
    },

    // 🌊 Приливная волна (для Azure Leviathan)
    createTidalWave(centerX, centerY, color) {
        const config = this.getBossConfig();
        const bulletCount = 7;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i - 3) * 0.5; // От -1.5 до +1.5 радиан (~172° веер)
            const bullet = {
                x: centerX - config.BULLET_SIZE / 2,
                y: centerY,
                width: config.BULLET_SIZE,
                height: config.BULLET_SIZE,
                vx: Math.sin(angle) * config.BULLET_SPEED * 0.73,
                vy: Math.cos(angle) * config.BULLET_SPEED,
                color: color,
                type: 'wave',
                waveTime: i * 200,
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
    },

    // 🌊 Большая пуля для первой фазы
    createLargeBullet(centerX, centerY, color) {
        const config = this.getBossConfig();
        const bullet = {
            x: centerX - (config.BULLET_SIZE + 10) / 2,
            y: centerY,
            width: config.BULLET_SIZE + 10,
            height: config.BULLET_SIZE + 10,
            vx: 0,
            vy: config.BULLET_SPEED * 0.85,
            color: color,
            type: 'large',
            trail: []
        };
        
        this.bossBullets.push(bullet);
    },

    // 🎯 Прямая пуля
    createStraightBullet(centerX, centerY, color, speedMultiplier = 1) {
        const config = this.getBossConfig();
        const bullet = {
            x: centerX - config.BULLET_SIZE / 2,
            y: centerY,
            width: config.BULLET_SIZE,
            height: config.BULLET_SIZE,
            vx: 0,
            vy: config.BULLET_SPEED * speedMultiplier,
            color: color,
            type: 'straight',
            trail: []
        };
        
        this.bossBullets.push(bullet);
    },

    // ⭕ Круговая атака
    createCircularAttack(centerX, centerY, color, speedMultiplier = 0.8) {
        const config = this.getBossConfig();
        const bulletCount = 8;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const bullet = {
                x: centerX - config.BULLET_SIZE / 2,
                y: centerY,
                width: config.BULLET_SIZE,
                height: config.BULLET_SIZE,
                vx: Math.cos(angle) * config.BULLET_SPEED * speedMultiplier,
                vy: Math.sin(angle) * config.BULLET_SPEED * speedMultiplier,
                color: color,
                type: 'circular',
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
    },

    // 💥 Взрывчатые пули
    createExplosiveBullets(centerX, centerY, color, count) {
        const config = this.getBossConfig();
        
        for (let i = 0; i < count; i++) {
            // Ограничиваем угол только нижней полусферой (от 0 до π)
            const angle = Math.random() * Math.PI; // Только вниз (0-180°)
            const speedVariation = 0.5 + Math.random() * 0.5; // Рандом скорости 0.5-1.0
            const bullet = {
                x: centerX - config.BULLET_SIZE / 2,
                y: centerY,
                width: config.BULLET_SIZE + 4,
                height: config.BULLET_SIZE + 4,
                vx: Math.cos(angle) * config.BULLET_SPEED * speedVariation,
                vy: Math.abs(Math.sin(angle) * config.BULLET_SPEED * speedVariation), // Всегда положительный (вниз)
                color: color,
                type: 'explosive',
                timer: 2000 + Math.random() * 1000,
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
    },

    // ☄️ Метеор (большая пуля с огненным следом)
    createMeteorBullet(x, y, color, speedMultiplier = 1) {
        const config = this.getBossConfig();
        const bullet = {
            x: x - (config.BULLET_SIZE + 8) / 2,
            y: y,
            width: config.BULLET_SIZE + 8,
            height: config.BULLET_SIZE + 8,
            vx: 0,
            vy: config.BULLET_SPEED * 1.0 * speedMultiplier, // Увеличили с 0.7 до 1.0
            color: color,
            type: 'meteor',
            trail: []
        };
        
        this.bossBullets.push(bullet);
    },

    // 🌪️ Берсерк атака (много пуль во все стороны)
    createBerserkAttack(centerX, centerY, color, speedMultiplier = 1) {
        const config = this.getBossConfig();
        const bulletCount = 12;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const speed = config.BULLET_SPEED * (1 + Math.random() * 0.5) * speedMultiplier;
            
            const bullet = {
                x: centerX - config.BULLET_SIZE / 2,
                y: centerY,
                width: config.BULLET_SIZE,
                height: config.BULLET_SIZE,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                type: 'berserk',
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
    },

    // 🌀 Спиральная атака
    createSpiralAttack(centerX, centerY, color) {
        const config = this.getBossConfig();
        const bulletCount = 6;
        const spiralTime = Date.now() * 0.001;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = spiralTime + (i / bulletCount) * Math.PI * 2;
            const bullet = {
                x: centerX - config.BULLET_SIZE / 2,
                y: centerY,
                width: config.BULLET_SIZE,
                height: config.BULLET_SIZE,
                vx: Math.cos(angle) * config.BULLET_SPEED * 0.8,
                vy: Math.sin(angle) * config.BULLET_SPEED * 0.8 + config.BULLET_SPEED * 0.3,
                color: color,
                type: 'spiral',
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
    },

    // 📡 Телепортация + атака
    createTeleportAttack(boss, oldX, oldY) {
        // Телепортируем босса в случайное место
        const newX = Math.random() * (this.canvas.width - boss.width);
        boss.x = newX;
        
        // Создаем эффект телепортации
        this.createTeleportEffect(oldX + boss.width/2, oldY + boss.height/2);
        this.createTeleportEffect(newX + boss.width/2, boss.y + boss.height/2);
        
        // Стреляем с новой позиции
        this.createStraightBullet(newX + boss.width/2, boss.y + boss.height, boss.color);
    },

    // 🌊 Гравитационная волна
    createGravityWave(centerX, centerY, color) {
        const config = this.getBossConfig();
        const bulletCount = 16;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const radius = 50 + i * 10;
            
            const bullet = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                width: config.BULLET_SIZE,
                height: config.BULLET_SIZE,
                vx: Math.cos(angle) * config.BULLET_SPEED * 0.5,
                vy: Math.sin(angle) * config.BULLET_SPEED * 0.5,
                color: color,
                type: 'gravity',
                trail: []
            };
            
            this.bossBullets.push(bullet);
        }
    },

    // 🎭 Создание клонов
    createCloneAttack(boss) {
        // Пока что просто создаем много пуль
        this.createCircularAttack(boss.x + boss.width/2, boss.y + boss.height, boss.color);
    },

    // 🌪️ Финальная хаотичная атака
    createChaosAttack(boss) {
        // Комбинируем несколько типов атак
        this.createSpiralAttack(boss.x + boss.width/2, boss.y + boss.height, boss.color);
        
        setTimeout(() => {
            this.createBerserkAttack(boss.x + boss.width/2, boss.y + boss.height, boss.color);
        }, 500);
        
        setTimeout(() => {
            this.createExplosiveBullets(boss.x + boss.width/2, boss.y + boss.height, boss.color, 3);
        }, 1000);
    },

    // 💥 Взрыв пули
    explodeBullet(bullet) {
        // Создаем 4 осколка в разные стороны
        const fragmentCount = 4;
        for (let i = 0; i < fragmentCount; i++) {
            const angle = (i / fragmentCount) * Math.PI * 2;
            const fragment = {
                x: bullet.x,
                y: bullet.y,
                width: bullet.width / 2,
                height: bullet.height / 2,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                color: bullet.color,
                type: 'fragment',
                trail: []
            };
            
            this.bossBullets.push(fragment);
        }
        
        // Создаем эффект взрыва
        this.createExplosionParticles(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.color);
        
        // Удаляем оригинальную пулю
        const index = this.bossBullets.indexOf(bullet);
        if (index > -1) {
            this.bossBullets.splice(index, 1);
        }
    }
});

