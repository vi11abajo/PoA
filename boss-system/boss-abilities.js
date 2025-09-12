// ⭐ PHAROS INVADERS - СПЕЦСПОСОБНОСТИ БОСОВ


Object.assign(BossSystemV2.prototype, {
    // 🟢 БОСС 1 - EMERALD WARLORD - "Regeneration" (восстановление HP)
    regenerationAbility(boss) {
        const now = Date.now();
        
        if (now - boss.uniqueData.lastRegenTime < boss.uniqueData.regenCooldown) {
            return;
        }
        
        const regenAmount = Math.ceil(boss.maxHP * 0.1);
        boss.currentHP = Math.min(boss.maxHP, boss.currentHP + regenAmount);
        
        this.createRegenerationEffect(boss);
        
        boss.uniqueData.lastRegenTime = now;
        // Устанавливаем новый рандомный интервал для следующей регенерации
        boss.uniqueData.regenCooldown = 5000 + Math.random() * 5000; // От 5 до 10 секунд
        
    },

    // 🔵 БОСС 2 - AZURE LEVIATHAN - "Water Shield" (блокирует 3 попадания)
    waterShieldAbility(boss) {
        if (boss.uniqueData.shieldHP <= 0) {
            boss.uniqueData.shieldHP = boss.uniqueData.maxShieldHP;
            
            this.createWaterShieldEffect(boss);
            
        }
    },

    // 🟡 БОСС 3 - SOLAR KRAKEN - "Meteor Shower" (метеоритный дождь)
    meteorShowerAbility(boss) {
        const meteorCount = 8 + Math.floor(Math.random() * 5); // 8-12 метеоритов
        
        // Создаем предупреждающие индикаторы
        for (let i = 0; i < meteorCount; i++) {
            const x = Math.random() * (this.canvas.width - 60) + 30; // Отступ от краев
            
            // Добавляем индикатор предупреждения
            this.meteorWarnings = this.meteorWarnings || [];
            this.meteorWarnings.push({
                x: x,
                y: this.canvas.height - 10, // Внизу экрана
                timer: 1500, // 1.5 секунды до падения
                maxTimer: 1500,
                size: 30,
                alpha: 1.0
            });
            
            // Планируем падение метеорита через 1.5 секунды
            setTimeout(() => {
                this.createMeteorBullet(x, -20, boss.color, 0.8); // Медленные крупные метеориты
            }, 1500);
        }
        
        this.createMeteorShowerEffect(boss);
        
    },

    // 🔴 БОСС 4 - CRIMSON BEHEMOTH - "Rage" (рандомная активация 7-15 сек, +30% ко всему)
    rageModeAbility(boss) {
        boss.uniqueData.rageMode = true;
        boss.uniqueData.rageDuration = 6000 + Math.random() * 3000; // 6-9 секунд
        boss.uniqueData.rageStartTime = Date.now();
        
        // Увеличиваем все показатели на 55% (1.55x)
        boss.speed = this.getBossConfig().SPEED * 1.55;
        boss.uniqueData.rageSpeedMultiplier = 1.55; // Для пуль
        boss.uniqueData.rageFrequencyMultiplier = 1.55; // Для частоты атак
        boss.uniqueData.immuneToSlowdown = true; // Иммунитет к замедлению только в rage
        
        this.createRageModeEffect(boss);
        
    },

    // 🟣 БОСС 5 - VOID SOVEREIGN - "Temporal Freeze" (замораживает пули игрока на 3 секунды)
    temporalFreezeAbility(boss) {
        if (window.bullets && window.bullets.length > 0) {
            this.playerFrozenBullets = [...window.bullets];
            this.frozenBulletsTime = 3000; // 3 секунды
            
            window.bullets.forEach(bullet => {
                bullet.frozenVy = bullet.vy || bullet.speed || 8;
                bullet.vy = 0;
                bullet.speed = 0;
            });
            
            this.createTemporalFreezeEffect();
            
        }
    },

    // 🔓 Размораживание пуль игрока
    unfreezeBullets() {
        if (window.bullets) {
            window.bullets.forEach(bullet => {
                if (bullet.frozenVy !== undefined) {
                    bullet.vy = bullet.frozenVy;
                    bullet.speed = bullet.frozenVy;
                    delete bullet.frozenVy;
                }
            });
        }
        
        this.playerFrozenBullets = [];
    },

    // ====== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ДЛЯ СПЕЦСПОСОБНОСТЕЙ ======

    // 💚 Эффект восстановления
    createRegenerationEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        for (let i = 0; i < 20; i++) {
            this.bossParticles.push({
                x: centerX + (Math.random() - 0.5) * boss.width,
                y: centerY + (Math.random() - 0.5) * boss.height,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 60,
                maxLife: 60,
                size: Math.random() * 3 + 2,
                color: '#00ff88',
                type: 'regeneration'
            });
        }
    },

    // 💧 Эффект водного щита
    createWaterShieldEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const radius = boss.width * 0.344; // Уменьшили на 18% от 0.42 (0.42 * 0.82 = 0.344)
            
            this.bossParticles.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5,
                life: 90,
                maxLife: 90,
                size: 4,
                color: '#0099ff',
                type: 'shield'
            });
        }
    },

    // ☄️ Эффект метеоритного дождя
    createMeteorShowerEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        // Создаем энергетическую ауру вокруг босса
        for (let i = 0; i < 25; i++) {
            this.bossParticles.push({
                x: centerX + (Math.random() - 0.5) * boss.width,
                y: centerY + (Math.random() - 0.5) * boss.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 80,
                maxLife: 80,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00',
                type: 'meteor_aura'
            });
        }
        
        // Дополнительные искры поднимающиеся вверх
        for (let i = 0; i < 15; i++) {
            this.bossParticles.push({
                x: centerX + (Math.random() - 0.5) * boss.width * 0.8,
                y: centerY + boss.height / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 4 - 2,
                life: 60,
                maxLife: 60,
                size: Math.random() * 3 + 1,
                color: '#ffcc33',
                type: 'meteor_sparks'
            });
        }
    },
    
    // 💥 Создание метеоритной пули (используется в boss-attacks.js)
    createMeteorBullet(x, y, color, speedMultiplier = 1) {
        const config = this.getBossConfig();
        const bullet = {
            x: x - (config.BULLET_SIZE + 8) / 2,
            y: y,
            width: config.BULLET_SIZE + 8,
            height: config.BULLET_SIZE + 8,
            vx: 0,
            vy: config.BULLET_SPEED * 0.7 * speedMultiplier,
            color: color,
            type: 'meteor',
            trail: []
        };
        
        this.bossBullets.push(bullet);
    },

    // 🔥 Эффект режима ярости
    createRageModeEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        for (let i = 0; i < 30; i++) {
            this.bossParticles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 45,
                maxLife: 45,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#ff3333' : '#ff8800',
                type: 'rage'
            });
        }
    },

    // 🕰️ Эффект заморозки времени
    createTemporalFreezeEffect() {
        if (!this.canvas) return;
        
        for (let i = 0; i < 40; i++) {
            this.bossParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.8,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: 120,
                maxLife: 120,
                size: Math.random() * 3 + 1,
                color: '#9966ff',
                type: 'freeze'
            });
        }
    },

    // 🛡️💥 Эффект разрушения щита
    createShieldBreakEffect(boss) {
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        
        // Мощный взрыв частиц
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            
            this.bossParticles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60,
                maxLife: 60,
                size: Math.random() * 5 + 3,
                color: '#0099ff',
                type: 'shield_break'
            });
        }
        
        // Дополнительные яркие частицы
        for (let i = 0; i < 12; i++) {
            this.bossParticles.push({
                x: centerX + (Math.random() - 0.5) * 40,
                y: centerY + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 45,
                maxLife: 45,
                size: Math.random() * 4 + 2,
                color: '#ffffff',
                type: 'shield_break_flash'
            });
        }
        
    },

    // 🌟 Получение состояния спецэффектов (для UI и рендеринга)
    getSpecialEffectsState() {
        return {
            frozenBulletsTime: this.frozenBulletsTime
        };
    }
});

