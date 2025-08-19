// 🎮 PHAROS INVADERS - GAME CONFIGURATION
// Отдельный файл для быстрой настройки баланса игры
// Измените значения здесь и перезагрузите страницу

const GAME_CONFIG = {
    // 🦀 НАСТРОЙКИ КРАБОВ
    CRAB_SPEED: 75,        // Скорость движения крабов в % (50 = медленнее, 150 = быстрее)
    CRAB_FIRE_RATE: 77,    // Частота стрельбы крабов в % (50 = реже, 200 = чаще)
    CRAB_BULLET_SPEED: 87, // Скорость пуль крабов в % (80 = медленнее, 120 = быстрее)
    
    // 🐙 НАСТРОЙКИ ИГРОКА
    PLAYER_LIVES: 5,        // Количество жизней (1-10)
    PLAYER_SPEED: 110,      // Скорость движения игрока в % (50 = медленнее, 150 = быстрее)
    PLAYER_FIRE_RATE: 110,  // Скорость стрельбы игрока в % (50 = медленнее, 200 = быстрее)
    PLAYER_BULLET_SPEED: 115, // Скорость пуль игрока в % (80 = медленнее, 150 = быстрее)
    
    // ⚙️ НАСТРОЙКИ УРОВНЯ
    LEVEL_DIFFICULTY: 93,  // Общая сложность в % (80 = легче, 120 = сложнее)
    SCORE_MULTIPLIER: 100,  // Множитель очков в % (150 = больше очков, 50 = меньше)
    WAVE_SPEED_INCREASE: 6, // Прирост скорости каждую волну в % (10 = медленнее, 30 = быстрее)
    
    // 💰 БЛОКЧЕЙН НАСТРОЙКИ
    GAME_FEE: '0.001',      // Комиссия за старт игры в PHRS (например: '0.001', '0.005', '0.01')
    
    // 🎨 ВИЗУАЛЬНЫЕ НАСТРОЙКИ
    PARTICLE_COUNT: 88,    // Количество частиц в % (50 = меньше для слабых ПК, 150 = больше)
    ANIMATION_SPEED: 100,   // Скорость анимаций в % (80 = медленнее, 120 = быстрее)
    
    // 🚀 РАЗМЕРЫ ПОЛЯ
    INVADERS_ROWS: 5,       // Количество рядов крабов (3-8)
    INVADERS_COLS: 10,      // Количество столбцов крабов (8-15)
    
    // 🔥 ЭКСПЕРИМЕНТАЛЬНЫЕ ФУНКЦИИ
    BULLET_PENETRATION: false, // Пули игрока проходят через крабов (true/false)
    DOUBLE_SHOT: false,     // Двойная стрельба игрока (true/false)
    SHIELD_MODE: false,     // Режим щита - блокировка пуль пробелом (true/false)
};

// 📝 ПРИМЕРЫ НАСТРОЕК:

// 🟢 ЛЕГКИЙ РЕЖИМ:
// CRAB_SPEED: 80, CRAB_FIRE_RATE: 70, PLAYER_LIVES: 5, SCORE_MULTIPLIER: 120, GAME_FEE: ''

// 🔴 СЛОЖНЫЙ РЕЖИМ:
// CRAB_SPEED: 130, CRAB_FIRE_RATE: 150, PLAYER_LIVES: 2, LEVEL_DIFFICULTY: 120, GAME_FEE: '0.002'

// ⚡ БЫСТРАЯ ИГРА:
// CRAB_SPEED: 150, PLAYER_SPEED: 150, PLAYER_FIRE_RATE: 150, WAVE_SPEED_INCREASE: 30

// 🎮 АРКАДНЫЙ РЕЖИМ:
// DOUBLE_SHOT: true, BULLET_PENETRATION: true, SCORE_MULTIPLIER: 200, PARTICLE_COUNT: 150

// 💻 ДЛЯ СЛАБЫХ ПК:
// PARTICLE_COUNT: 50, ANIMATION_SPEED: 80, INVADERS_ROWS: 4, INVADERS_COLS: 8

// 🏆 СОРЕВНОВАТЕЛЬНЫЙ:
// PLAYER_LIVES: 1, CRAB_SPEED: 110, CRAB_FIRE_RATE: 120, SCORE_MULTIPLIER: 100, GAME_FEE: '0.005'

// 💰 НАСТРОЙКИ КОМИССИИ:
// GAME_FEE: '0.0001' - Очень дешево (для тестов)
// GAME_FEE: '0.001'  - Стандартно (текущая цена)
// GAME_FEE: '0.005'  - Дорого (для турниров)
// GAME_FEE: '0.01'   - Очень дорого (для премиум режима)

console.log('🎮 Game config loaded:', GAME_CONFIG);
