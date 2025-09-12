// ⭐ BOOST SYSTEM
// Основной файл системы бонусов-бустеров

// Подключаем все компоненты системы бонусов
function initializeBoostSystem() {
    // Проверяем, что все компоненты загружены
    if (!window.BOOST_CONSTANTS) {
        console.error('BOOST_CONSTANTS not loaded');
        return false;
    }

    if (!window.boostManager) {
        console.error('BoostManager not loaded');
        return false;
    }

    if (!window.boostEffects) {
        console.error('BoostEffects not loaded');
        return false;
    }

    if (!window.boostIntegration) {
        console.error('BoostIntegration not loaded');
        return false;
    }

    // Инициализируем интеграцию
    window.boostIntegration.initialize();

    return true;
}

// 🎮 Основные функции для работы с бонусами из игры

// Создание случайного бонуса (вызывается при уничтожении краба)
function tryCreateBoost(x, y) {
    const roll = Math.random();
    const dropChance = BOOST_CONSTANTS.SPAWN.DROP_CHANCE;
    
    if (roll < dropChance && window.boostManager) {
        const boost = window.boostManager.createDroppingBoost(x, y);
        return boost;
    }
    
    return null;
}

// Принудительное создание бонуса определенного типа
function createSpecificBoost(x, y, boostType) {
    if (window.boostManager) {
        return window.boostManager.createDroppingBoost(x, y, boostType);
    }
    return null;
}

// Проверка активности бонуса
function isBoostActive(boostType) {
    return window.boostManager ? window.boostManager.isBoostActive(boostType) : false;
}

// Получение данных активного бонуса
function getActiveBoost(boostType) {
    return window.boostManager ? window.boostManager.getActiveBoost(boostType) : null;
}

// Деактивация бонуса
function deactivateBoost(boostType) {
    if (window.boostManager) {
        window.boostManager.deactivateBoost(boostType);
    }
}

// Получение количества стаков Speed Tamer
function getSpeedTamerStacks() {
    return window.boostManager ? window.boostManager.speedTamerStacks : 0;
}

// Очистка всех бонусов
function clearAllBoosts() {
    if (window.boostManager) {
        window.boostManager.activeBoosts.clear();
        window.boostManager.droppingBoosts = [];
        window.boostManager.speedTamerStacks = 0;
    }
    
    if (window.boostEffects) {
        window.boostEffects.clear();
    }
}

// 🎯 Функции для интеграции с игровыми системами

// Модификация скорости стрельбы (для Rapid Fire)
function getModifiedShotCooldown(baseCooldown) {
    if (isBoostActive('RAPID_FIRE')) {
        return baseCooldown / BOOST_CONSTANTS.EFFECTS.RAPID_FIRE.multiplier;
    }
    return baseCooldown;
}

// Модификация цвета пуль (для различных эффектов)
function getModifiedBulletColor(defaultColor) {
    if (isBoostActive('RAPID_FIRE')) {
        return '#ffff00'; // Желтый для Rapid Fire
    } else if (isBoostActive('MULTI_SHOT')) {
        return '#ff4444'; // Красный для Multi-Shot
    } else if (isBoostActive('PIERCING_BULLETS')) {
        return '#ffffff'; // Белый для Piercing
    }
    return defaultColor;
}

// Проверка пробивания пуль (для Piercing Bullets)
function shouldBulletPierce() {
    return isBoostActive('PIERCING_BULLETS');
}

// Модификация множителя очков (для Score Multiplier)
function getScoreMultiplier() {
    if (isBoostActive('SCORE_MULTIPLIER')) {
        return BOOST_CONSTANTS.EFFECTS.SCORE_MULTIPLIER.multiplier;
    }
    return 1;
}

// Проверка заморозки decay (для Points Freeze)
function isPointsDecayFrozen() {
    return isBoostActive('POINTS_FREEZE');
}

// Модификация скорости врагов (для Ice Freeze и Speed Tamer)
function getEnemySpeedMultiplier() {
    let multiplier = 1;
    
    // Ice Freeze
    if (isBoostActive('ICE_FREEZE')) {
        multiplier *= BOOST_CONSTANTS.EFFECTS.ICE_FREEZE.slowdown;
    }
    
    // Speed Tamer
    const stacks = getSpeedTamerStacks();
    if (stacks > 0) {
        const reduction = stacks * BOOST_CONSTANTS.EFFECTS.SPEED_TAMER.reduction;
        multiplier *= (1 - reduction);
    }
    
    return Math.max(0.1, multiplier); // Минимум 10% от оригинальной скорости
}

// Проверка неуязвимости (для Invincibility)
function isPlayerInvincible() {
    return isBoostActive('INVINCIBILITY');
}

// Проверка наличия щита (для Shield Barrier)
function hasActiveShield() {
    return isBoostActive('SHIELD_BARRIER');
}

// Обработка урона по щиту
function processShieldDamage() {
    const shield = getActiveBoost('SHIELD_BARRIER');
    if (!shield) return false;
    
    const hitsBlocked = shield.hitsBlocked || 0;
    shield.hitsBlocked = hitsBlocked + 1;
    
    if (shield.hitsBlocked >= BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits) {
        deactivateBoost('SHIELD_BARRIER');
    }
    
    return true; // Урон заблокирован
}

// 🎨 Функции для создания эффектов

// Создание эффекта исцеления
function createHealEffect(x, y) {
    if (window.boostEffects) {
        window.boostEffects.createHealthBoostEffect(x, y);
    }
}

// Создание эффекта монет
function createCoinEffect(points) {
    if (window.boostEffects) {
        window.boostEffects.createCoinShowerEffect(points);
    }
}

// Создание волнового эффекта
function createWaveEffect() {
    if (window.boostEffects) {
        window.boostEffects.createWaveBlastEffect();
    }
}

// 📊 Функции для отладки и тестирования

// Активация всех бонусов (для тестирования)
function activateAllBoosts() {
    const allBoosts = [];
    for (const boosts of Object.values(BOOST_CONSTANTS.RARITY.DISTRIBUTION)) {
        allBoosts.push(...boosts);
    }
    
    for (const boostType of allBoosts) {
        if (window.boostManager) {
            window.boostManager.activateBoost(boostType);
        }
    }
}

// Получение статистики бонусов
function getBoostStats() {
    const stats = {
        activeBoosts: window.boostManager ? window.boostManager.activeBoosts.size : 0,
        droppingBoosts: window.boostManager ? window.boostManager.droppingBoosts.length : 0,
        speedTamerStacks: getSpeedTamerStacks(),
        particles: window.boostEffects ? window.boostEffects.particles.length : 0,
        effects: window.boostEffects ? window.boostEffects.effects.length : 0
    };
    
    return stats;
}

// Вывод отладочной информации
function debugBoosts() {
    const stats = getBoostStats();
    return stats; // Возвращаем статистику без логирования
}

// 🔧 Утилиты для настройки

// Изменение шанса выпадения бонусов
function setBoostDropChance(chance) {
    BOOST_CONSTANTS.SPAWN.DROP_CHANCE = Math.max(0, Math.min(1, chance));
}

// Изменение времени жизни падающих бонусов
function setBoostLifetime(milliseconds) {
    BOOST_CONSTANTS.SPAWN.LIFETIME = Math.max(1000, milliseconds);
}

// Изменение шансов редкости
function setRarityChances(common, rare, epic, legendary) {
    const total = common + rare + epic + legendary;
    if (total !== 100) {
        console.warn('Rarity chances should sum to 100%');
        return false;
    }
    
    BOOST_CONSTANTS.RARITY.CHANCES.COMMON = common;
    BOOST_CONSTANTS.RARITY.CHANCES.RARE = rare;
    BOOST_CONSTANTS.RARITY.CHANCES.EPIC = epic;
    BOOST_CONSTANTS.RARITY.CHANCES.LEGENDARY = legendary;
    
    return true;
}

// Экспортируем все функции в глобальную область
window.initializeBoostSystem = initializeBoostSystem;
window.tryCreateBoost = tryCreateBoost;
window.createSpecificBoost = createSpecificBoost;
window.isBoostActive = isBoostActive;
window.getActiveBoost = getActiveBoost;
window.deactivateBoost = deactivateBoost;
window.getSpeedTamerStacks = getSpeedTamerStacks;
window.clearAllBoosts = clearAllBoosts;

window.getModifiedShotCooldown = getModifiedShotCooldown;
window.getModifiedBulletColor = getModifiedBulletColor;
window.shouldBulletPierce = shouldBulletPierce;
window.getScoreMultiplier = getScoreMultiplier;
window.isPointsDecayFrozen = isPointsDecayFrozen;
window.getEnemySpeedMultiplier = getEnemySpeedMultiplier;
window.isPlayerInvincible = isPlayerInvincible;
window.hasActiveShield = hasActiveShield;
window.processShieldDamage = processShieldDamage;

window.createHealEffect = createHealEffect;
window.createCoinEffect = createCoinEffect;
window.createWaveEffect = createWaveEffect;

window.activateAllBoosts = activateAllBoosts;
window.getBoostStats = getBoostStats;
window.debugBoosts = debugBoosts;
window.setBoostDropChance = setBoostDropChance;
window.setBoostLifetime = setBoostLifetime;
window.setRarityChances = setRarityChances;

// Инициализируем систему при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!initializeBoostSystem()) {
            console.error('❌ Failed to initialize Boost System');
        }
    }, 2000);
});

// Boost System loaded silently