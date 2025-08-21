// 👑 PHAROS INVADERS - BOSS SYSTEM
// Полная система боссов с ИИ, анимацией и эффектами

console.log('👑 Loading boss system...');

// Переменные босса
let currentBoss = null;
let bossImages = {};
let bossImagesLoaded = {};
let bossBullets = [];
let bossParticles = [];

// Состояния босса
const BOSS_STATES = {
    APPEARING: 'appearing',
    FIGHTING: 'fighting', 
    DAMAGED: 'damaged',
    DYING: 'dying',
    DEAD: 'dead'
};

// Загрузка изображений боссов
function loadBossImages() {
    Object.keys(BOSS_CONFIG.BOSS_IMAGES).forEach(bossNumber => {
        const img = new Image();
        const url = BOSS_CONFIG.BOSS_IMAGES[bossNumber];
        
        bossImages[bossNumber] = img;
        bossImagesLoaded[bossNumber] = false;
        
        img.src = url;
        img.onload = () => {
            bossImagesLoaded[bossNumber] = true;
            console.log(`👑 Boss ${bossNumber} image loaded`);
        };
        img.onerror = () => {
            bossImagesLoaded[bossNumber] = false;
            console.log(`❌ Boss ${bossNumber} image failed`);
        };
    });
}

// Создание босса
function createBoss(level) {
    if (!isBossLevel(level)) return null;
    
    const bossNumber = getBossNumber(level);
    const canvas = document.getElementById('gameCanvas');
    
    currentBoss = {
        // Базовые параметры
        x: canvas.width / 2 - BOSS_CONFIG.BOSS_WIDTH / 2,
        y: -BOSS_CONFIG.BOSS_HEIGHT, // Начинаем сверху экрана
        width: BOSS_CONFIG.BOSS_WIDTH,
        height: BOSS_CONFIG.BOSS_HEIGHT,
        
        // Характеристики
        bossNumber: bossNumber,
        maxHP: getBossHP(bossNumber),
        currentHP: getBossHP(bossNumber),
        
        // Движение
        speed: BOSS_CONFIG.BOSS_SPEED,
        direction: 1, // 1 = вправо, -1 = влево
        baseY: BOSS_CONFIG.BOSS_START_Y,
        movementRange: BOSS_CONFIG.BOSS_MOVEMENT_RANGE,
        
        // Анимация
        animationFrame: 0,
        bobOffset: 0,
        
        // Состояние
        state: BOSS_STATES.APPEARING,
        lastShotTime: 0,
        nextShotDelay: getRandomShotDelay(), // НОВОЕ: рандомная задержка до следующего выстрела
        damageFlashTime: 0,
        deathStartTime: 0,

        // Эффекты
        scale: 1.0,
        alpha: 1.0,
        flashAlpha: 0,

        // Изображение
        image: bossImages[bossNumber],
        color: getBossColor(bossNumber),
        name: getBossName(bossNumber)
    };

    console.log(`👑 Boss created: ${currentBoss.name} (HP: ${currentBoss.maxHP})`);
    return currentBoss;
}

// Обновление босса
function updateBoss(deltaTime) {
    if (!currentBoss) return;

    const boss = currentBoss;
    const canvas = document.getElementById('gameCanvas');

    // Обновляем анимацию
    boss.animationFrame += BOSS_CONFIG.BOSS_ANIMATION_SPEED * deltaTime;
    boss.bobOffset += BOSS_CONFIG.BOSS_BOB_SPEED * deltaTime;

    // Обновляем состояние в зависимости от фазы
    switch (boss.state) {
        case BOSS_STATES.APPEARING:
            updateBossAppearing(boss, deltaTime);
            break;

        case BOSS_STATES.FIGHTING:
            updateBossFighting(boss, deltaTime, canvas);
            break;

        case BOSS_STATES.DAMAGED:
            updateBossDamaged(boss, deltaTime, canvas);
            break;

        case BOSS_STATES.DYING:
            updateBossDying(boss, deltaTime);
            break;
    }

    // Обновляем пули босса
    updateBossBullets(deltaTime);

    // Обновляем частицы босса
    updateBossParticles(deltaTime);
}

// Фаза появления босса
function updateBossAppearing(boss, deltaTime) {
    // Медленно опускаем босса вниз
    const appearSpeed = 100 * deltaTime;
    boss.y += appearSpeed;

    // Эффект появления
    boss.scale = Math.min(1.0, boss.scale + 0.02 * deltaTime);
    boss.alpha = Math.min(1.0, boss.alpha + 0.03 * deltaTime);

    // Когда достиг нужной позиции - переходим в режим боя
    if (boss.y >= boss.baseY) {
        boss.y = boss.baseY;
        boss.state = BOSS_STATES.FIGHTING;
        boss.scale = 1.0;
        boss.alpha = 1.0;

        // Создаем эффект приземления
        createBossLandingEffect(boss);
        console.log(`👑 ${boss.name} has entered the battle!`);
    }
}

// Фаза сражения
function updateBossFighting(boss, deltaTime, canvas) {
    // Горизонтальное движение
    boss.x += boss.speed * boss.direction * deltaTime;

    // Проверяем границы и меняем направление
    if (boss.x <= 0) {
        boss.x = 0;
        boss.direction = 1;
    } else if (boss.x >= canvas.width - boss.width) {
        boss.x = canvas.width - boss.width;
        boss.direction = -1;
    }

    // Вертикальное покачивание
    const bobbing = Math.sin(boss.bobOffset) * BOSS_CONFIG.BOSS_VERTICAL_BOB;
    boss.y = boss.baseY + bobbing;

    // Стрельба
    updateBossShooting(boss);

    // Убираем эффект мигания от урона
    if (boss.damageFlashTime > 0) {
        boss.damageFlashTime -= deltaTime;
        boss.flashAlpha = Math.max(0, boss.damageFlashTime / BOSS_CONFIG.BOSS_DAMAGE_FLASH_TIME);

        if (boss.damageFlashTime <= 0) {
            boss.state = BOSS_STATES.FIGHTING;
            boss.flashAlpha = 0;
        }
    }
}

// Фаза получения урона
function updateBossDamaged(boss, deltaTime, canvas) {
    // Продолжаем движение, но медленнее
    boss.x += boss.speed * 0.5 * boss.direction * deltaTime;

    // Проверяем границы
    if (boss.x <= 0) {
        boss.x = 0;
        boss.direction = 1;
    } else if (boss.x >= canvas.width - boss.width) {
        boss.x = canvas.width - boss.width;
        boss.direction = -1;
    }

    // Вертикальное покачивание
    const bobbing = Math.sin(boss.bobOffset) * BOSS_CONFIG.BOSS_VERTICAL_BOB;
    boss.y = boss.baseY + bobbing;

    // ИСПРАВЛЕНО: Босс продолжает стрелять даже при получении урона
    updateBossShooting(boss);

    // Эффект мигания
    boss.damageFlashTime -= deltaTime;
    boss.flashAlpha = Math.max(0, boss.damageFlashTime / BOSS_CONFIG.BOSS_DAMAGE_FLASH_TIME);

    if (boss.damageFlashTime <= 0) {
        boss.state = BOSS_STATES.FIGHTING;
        boss.flashAlpha = 0;
    }
}

// Фаза смерти
function updateBossDying(boss, deltaTime) {
    const deathProgress = (Date.now() - boss.deathStartTime) / BOSS_CONFIG.BOSS_DEATH_ANIMATION_TIME;

    if (deathProgress < 1.0) {
        // Анимация смерти
        boss.scale = Math.max(0.1, 1.0 - deathProgress * 0.5);
        boss.alpha = Math.max(0, 1.0 - deathProgress);
        boss.y += 50 * deltaTime; // Медленно падает

        // Создаем частицы взрыва
        if (Math.random() < 0.3) {
            createBossDeathParticles(boss);
        }
    } else {
        // Босс умер
        boss.state = BOSS_STATES.DEAD;
        currentBoss = null;

        // Создаем финальный взрыв
        createBossFinalExplosion(boss);

        console.log(`👑 ${boss.name} has been defeated!`);
    }
}

// НОВАЯ ФУНКЦИЯ: Генерация рандомной задержки между выстрелами
function getRandomShotDelay() {
    const minDelay = BOSS_CONFIG.BOSS_SHOT_MIN_DELAY || 2000;
    const maxDelay = BOSS_CONFIG.BOSS_SHOT_MAX_DELAY || 5000;
    return minDelay + Math.random() * (maxDelay - minDelay);
}

// Система стрельбы босса - ОБНОВЛЕНО с рандомными интервалами
function updateBossShooting(boss) {
    const now = Date.now();

    // Проверяем, пришло ли время стрелять
    if (now - boss.lastShotTime >= boss.nextShotDelay) {
        if (BOSS_CONFIG.BOSS_MULTI_SHOT) {
            createBossMultiShot(boss);
        } else {
            createBossSingleShot(boss);
        }

        boss.lastShotTime = now;
        boss.nextShotDelay = getRandomShotDelay(); // Устанавливаем новую рандомную задержку

        console.log(`👑 Boss fired! Next shot in ${boss.nextShotDelay}ms`); // Отладка
    }
}

// Одиночный выстрел босса
function createBossSingleShot(boss) {
    const bulletX = boss.x + boss.width / 2 - BOSS_CONFIG.BOSS_BULLET_SIZE / 2;
    const bulletY = boss.y + boss.height;

    bossBullets.push({
        x: bulletX,
        y: bulletY,
        width: BOSS_CONFIG.BOSS_BULLET_SIZE,
        height: BOSS_CONFIG.BOSS_BULLET_SIZE,
        speed: BOSS_CONFIG.BOSS_BULLET_SPEED,
        vx: 0,
        vy: BOSS_CONFIG.BOSS_BULLET_SPEED,
        color: boss.color,
        trail: []
    });
}

// Мульти-выстрел босса
function createBossMultiShot(boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height;
    const shotCount = BOSS_CONFIG.BOSS_SHOTS_COUNT;
    const spread = BOSS_CONFIG.BOSS_SHOT_SPREAD;

    for (let i = 0; i < shotCount; i++) {
        const angle = (i - (shotCount - 1) / 2) * spread;
        const vx = Math.sin(angle) * BOSS_CONFIG.BOSS_BULLET_SPEED;
        const vy = Math.cos(angle) * BOSS_CONFIG.BOSS_BULLET_SPEED;

        bossBullets.push({
            x: centerX - BOSS_CONFIG.BOSS_BULLET_SIZE / 2,
            y: centerY,
            width: BOSS_CONFIG.BOSS_BULLET_SIZE,
            height: BOSS_CONFIG.BOSS_BULLET_SIZE,
            speed: BOSS_CONFIG.BOSS_BULLET_SPEED,
            vx: vx,
            vy: vy,
            color: boss.color,
            trail: []
        });
    }
}

// Обновление пуль босса
function updateBossBullets(deltaTime) {
    bossBullets = bossBullets.filter(bullet => {
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;

        // Добавляем след
        bullet.trail.push({x: bullet.x + bullet.width/2, y: bullet.y + bullet.height/2});
        if (bullet.trail.length > 6) bullet.trail.shift();

        // Удаляем если вышла за экран
        const canvas = document.getElementById('gameCanvas');
        return bullet.y < canvas.height + 50 &&
               bullet.x > -50 &&
               bullet.x < canvas.width + 50;
    });
}

// Нанесение урона боссу
function damageBoss(damage) {
    if (!currentBoss || currentBoss.state === BOSS_STATES.DYING || currentBoss.state === BOSS_STATES.DEAD) {
        return false;
    }

    currentBoss.currentHP -= damage;
    currentBoss.state = BOSS_STATES.DAMAGED;
    currentBoss.damageFlashTime = BOSS_CONFIG.BOSS_DAMAGE_FLASH_TIME;
    currentBoss.flashAlpha = 1.0;

    // Создаем частицы попадания
    createBossHitParticles(currentBoss);

    console.log(`👑 Boss took ${damage} damage! HP: ${currentBoss.currentHP}/${currentBoss.maxHP}`);

    // Проверяем смерть
    if (currentBoss.currentHP <= 0) {
        currentBoss.currentHP = 0;
        currentBoss.state = BOSS_STATES.DYING;
        currentBoss.deathStartTime = Date.now();

        // Очищаем пули босса
        bossBullets = [];

        return true; // Босс убит
    }

    return false; // Босс еще жив
}

// Проверка коллизий с боссом
function checkBossCollisions(playerBullets) {
    if (!currentBoss || currentBoss.state === BOSS_STATES.DYING || currentBoss.state === BOSS_STATES.DEAD) {
        return {bulletsToRemove: [], bossKilled: false, scoreGained: 0};
    }

    const bulletsToRemove = [];
    let bossKilled = false;
    let scoreGained = 0;

    // Проверяем попадания пуль игрока в босса
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];

        if (bullet.x < currentBoss.x + currentBoss.width &&
            bullet.x + bullet.width > currentBoss.x &&
            bullet.y < currentBoss.y + currentBoss.height &&
            bullet.y + bullet.height > currentBoss.y) {

            // Попадание!
            bulletsToRemove.push(i);

            if (damageBoss(1)) {
                // Босс убит
                bossKilled = true;
                scoreGained = getBossScore(currentBoss.bossNumber);
            }

            break; // Одна пуля = один урон
        }
    }

    return {bulletsToRemove, bossKilled, scoreGained};
}

// Проверка коллизий пуль босса с игроком
function checkBossBulletsCollision(player) {
    const bulletsToRemove = [];

    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bullet = bossBullets[i];

        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {

            bulletsToRemove.push(i);
            // Сразу удаляем пулю из массива
            bossBullets.splice(i, 1);
        }
    }

    return bulletsToRemove.length > 0; // Возвращаем true если было попадание
}

// Создание эффекта приземления
function createBossLandingEffect(boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height;

    for (let i = 0; i < 20; i++) {
        bossParticles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 60,
            maxLife: 60,
            size: Math.random() * 3 + 2,
            color: boss.color,
            type: 'landing'
        });
    }
}

// Создание частиц попадания
function createBossHitParticles(boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    for (let i = 0; i < 8; i++) {
        bossParticles.push({
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

// Создание частиц смерти
function createBossDeathParticles(boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    for (let i = 0; i < 5; i++) {
        bossParticles.push({
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

// Создание финального взрыва
function createBossFinalExplosion(boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    for (let i = 0; i < 50; i++) {
        bossParticles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 80,
            maxLife: 80,
            size: Math.random() * 6 + 3,
            color: i % 3 === 0 ? '#ffffff' : boss.color,
            type: 'explosion'
        });
    }
}

// Обновление частиц босса
function updateBossParticles(deltaTime) {
    bossParticles = bossParticles.filter(particle => {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vy += 0.1 * deltaTime; // Гравитация
        particle.life -= deltaTime;
        return particle.life > 0;
    });
}

// Получение состояния босса для UI
function getBossStatus() {
    if (!currentBoss) return null;

    return {
        name: currentBoss.name,
        currentHP: currentBoss.currentHP,
        maxHP: currentBoss.maxHP,
        hpPercentage: (currentBoss.currentHP / currentBoss.maxHP) * 100,
        state: currentBoss.state,
        bossNumber: currentBoss.bossNumber
    };
}

// Инициализация системы боссов
function initBossSystem() {
    loadBossImages();
    console.log('👑 Boss system initialized');
}

// Очистка системы боссов
function clearBossSystem() {
    currentBoss = null;
    bossBullets = [];
    bossParticles = [];
}

// Экспорт функций
window.BOSS_SYSTEM = {
    initBossSystem,
    clearBossSystem,
    createBoss,
    updateBoss,
    updateBossBullets,
    updateBossParticles,
    damageBoss,
    checkBossCollisions,
    checkBossBulletsCollision,
    getBossStatus,
    getCurrentBoss: () => currentBoss,
    getBossBullets: () => bossBullets,
    getBossParticles: () => bossParticles
};

console.log('👑 Boss system loaded successfully!');