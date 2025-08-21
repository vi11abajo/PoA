// 👑 PHAROS INVADERS - BOSS CONFIGURATION
// Настройки всех боссов в игре

const BOSS_CONFIG = {
    // 🎯 ОБЩИЕ НАСТРОЙКИ БОССОВ
    BOSS_LEVELS: [3, 6, 9, 12, 15],  // Уровни на которых появляются боссы
    BASE_BOSS_HP: 50,                // Здоровье первого босса
    BOSS_HP_INCREASE: 25,            // Прирост здоровья каждого следующего босса
    
    // 🎨 РАЗМЕРЫ И ПОЗИЦИЯ
    BOSS_WIDTH: 240,                 // Ширина босса (увеличено в 2 раза)
    BOSS_HEIGHT: 200,                // Высота босса (увеличено в 2 раза)
    BOSS_START_Y: 80,                // Начальная Y позиция (сверху)

    // ⚡ ДВИЖЕНИЕ БОССА
    BOSS_SPEED: 2,                   // Скорость движения босса
    BOSS_MOVEMENT_RANGE: 600,        // Дальность движения влево-вправо
    BOSS_VERTICAL_BOB: 15,           // Амплитуда вертикального покачивания
    BOSS_BOB_SPEED: 0.02,            // Скорость покачивания

    // 🔫 СТРЕЛЬБА БОССА
    BOSS_SHOT_MIN_DELAY: 2000,       // Минимальная задержка между выстрелами (мс)
    BOSS_SHOT_MAX_DELAY: 5000,       // Максимальная задержка между выстрелами (мс)
    BOSS_BULLET_SPEED: 4,            // Скорость пуль босса
    BOSS_BULLET_SIZE: 12,            // Размер пуль босса
    BOSS_MULTI_SHOT: true,           // Стреляет ли босс несколькими пулями
    BOSS_SHOTS_COUNT: 3,             // Количество пуль за выстрел
    BOSS_SHOT_SPREAD: 0.8,           // Разброс пуль (увеличено с 0.3 до 0.8 для больших промежутков)
                                     // 0.2 = узкий разброс (сложно), 0.8 = средний разброс, 1.2+ = широкий разброс (легко)

    // 🎭 АНИМАЦИЯ И ЭФФЕКТЫ
    BOSS_ANIMATION_SPEED: 0.05,      // Скорость анимации
    BOSS_DAMAGE_FLASH_TIME: 37,      // Время мигания при получении урона (уменьшено еще в 2 раза)
    BOSS_DEATH_ANIMATION_TIME: 2000, // Время анимации смерти (мс)

    // 💰 НАГРАДЫ
    BOSS_SCORE_MULTIPLIER: 10,       // Множитель очков за убийство босса
    BOSS_BASE_SCORE: 1000,           // Базовые очки за первого босса

    // 🖼️ ИЗОБРАЖЕНИЯ БОССОВ
    BOSS_IMAGES: {
        1: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSGreen.png',  // Босс 1 (3 уровень) - Зеленый
        2: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossBlue.png',   // Босс 2 (6 уровень) - Синий
        3: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossYellow.png', // Босс 3 (9 уровень) - Желтый
        4: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossRed.png',    // Босс 4 (12 уровень) - Красный
        5: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossViolet.png'  // Босс 5 (15 уровень) - Фиолетовый
    },

    // 🎨 ЦВЕТА БОССОВ (для партиклов и эффектов)
    BOSS_COLORS: {
        1: '#33cc66',  // Зеленый (соответствует crabBOSSGreen)
        2: '#3366ff',  // Синий (соответствует crabBossBlue)
        3: '#ffdd33',  // Желтый (соответствует crabBossYellow)
        4: '#ff3333',  // Красный (соответствует crabBossRed)
        5: '#9966ff'   // Фиолетовый (соответствует crabBossViolet)
    },

    // 🏷️ ИМЕНА БОССОВ - Эпичные титулы
    BOSS_NAMES: {
        1: 'Emerald Warlord',     // Изумрудный Полководец (зеленый, 3 уровень)
        2: 'Azure Leviathan',     // Лазурный Левиафан (синий, 6 уровень)
        3: 'Solar Kraken',        // Солнечный Кракен (желтый, 9 уровень)
        4: 'Crimson Behemoth',    // Багровый Бегемот (красный, 12 уровень)
        5: 'Void Sovereign'       // Повелитель Пустоты (фиолетовый, 15 уровень)
    }
};

// 🧮 ФУНКЦИИ ДЛЯ РАСЧЕТА ПАРАМЕТРОВ БОССА

// Получить здоровье босса по его номеру
function getBossHP(bossNumber) {
    return BOSS_CONFIG.BASE_BOSS_HP + (bossNumber - 1) * BOSS_CONFIG.BOSS_HP_INCREASE;
}

// Получить очки за убийство босса
function getBossScore(bossNumber) {
    return BOSS_CONFIG.BOSS_BASE_SCORE * bossNumber * BOSS_CONFIG.BOSS_SCORE_MULTIPLIER;
}

// Проверить, является ли уровень боссовым
function isBossLevel(level) {
    return BOSS_CONFIG.BOSS_LEVELS.includes(level);
}

// Получить номер босса по уровню
function getBossNumber(level) {
    const index = BOSS_CONFIG.BOSS_LEVELS.indexOf(level);
    return index !== -1 ? index + 1 : 0;
}

// Получить изображение босса
function getBossImage(bossNumber) {
    return BOSS_CONFIG.BOSS_IMAGES[bossNumber] || BOSS_CONFIG.BOSS_IMAGES[1];
}

// Получить цвет босса
function getBossColor(bossNumber) {
    return BOSS_CONFIG.BOSS_COLORS[bossNumber] || BOSS_CONFIG.BOSS_COLORS[1];
}

// Получить имя босса
function getBossName(bossNumber) {
    return BOSS_CONFIG.BOSS_NAMES[bossNumber] || 'Unknown Boss';
}

// 📝 ПРИМЕРЫ НАСТРОЕК:

// 🟢 ЛЕГКИЕ БОССЫ:
// BASE_BOSS_HP: 30, BOSS_HP_INCREASE: 15, BOSS_FIRE_RATE: 0.005

// 🔴 СЛОЖНЫЕ БОССЫ:
// BASE_BOSS_HP: 80, BOSS_HP_INCREASE: 40, BOSS_FIRE_RATE: 0.015, BOSS_SHOTS_COUNT: 5

// ⚡ БЫСТРЫЕ БОССЫ:
// BOSS_SPEED: 4, BOSS_BULLET_SPEED: 6, BOSS_ANIMATION_SPEED: 0.1

// 🐌 МЕДЛЕННЫЕ ТАНКИ:
// BOSS_SPEED: 1, BASE_BOSS_HP: 100, BOSS_HP_INCREASE: 50

// 💥 АГРЕССИВНЫЕ БОССЫ:
// BOSS_FIRE_RATE: 0.02, BOSS_SHOTS_COUNT: 7, BOSS_SHOT_SPREAD: 0.5

console.log('👑 Boss config loaded:', BOSS_CONFIG);