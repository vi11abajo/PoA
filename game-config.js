// 🎮 PHAROS INVADERS - GAME CONFIGURATION
// Отдельный файл для быстрой настройки баланса игры
// Измените значения здесь и перезагрузите страницу

const GAME_CONFIG = {
    // 🦀 НАСТРОЙКИ КРАБОВ
    CRAB_SPEED: 60,        // Скорость движения крабов в % (50 = медленнее, 150 = быстрее)
    CRAB_FIRE_RATE: 66,    // Частота стрельбы крабов в % (50 = реже, 200 = чаще)
                           // НОВОЕ: Использует логарифмический рост по уровням для баланса
    CRAB_BULLET_SPEED: 87, // Скорость пуль крабов в % (80 = медленнее, 120 = быстрее)
    
    // 🚀 НОВЫЕ НАСТРОЙКИ СКОРОСТИ КРАБОВ
    CRAB_SPEED_BASE: 1,               // Базовая скорость крабов (1 = стандарт, 2 = в 2 раза быстрее)
    CRAB_SPEED_LEVEL_INCREASE: 0.25,  // Прирост скорости за уровень (0.25 вместо 0.5)
    CRAB_SPEED_KILL_MULTIPLIER: 0.00125, // Влияние убийства крабов на скорость (0.025/20)
    GAME_SPEED_LEVEL_INCREASE: 0.07,  // Прирост общей скорости игры за уровень
    
    // 🐙 НАСТРОЙКИ ИГРОКА
    PLAYER_LIVES: 5,        // Количество жизней (1-10)
    PLAYER_SPEED: 110,      // Скорость движения игрока в % (50 = медленнее, 150 = быстрее)
    PLAYER_FIRE_RATE: 130,  // Скорость стрельбы игрока в % (50 = медленнее, 200 = быстрее)
    PLAYER_BULLET_SPEED: 115, // Скорость пуль игрока в % (80 = медленнее, 150 = быстрее)
    
    // ⚙️ НАСТРОЙКИ УРОВНЯ
    LEVEL_DIFFICULTY: 83,  // Общая сложность в % (80 = легче, 120 = сложнее)
    SCORE_MULTIPLIER: 100,  // Множитель очков в % (150 = больше очков, 50 = меньше)
    WAVE_SPEED_INCREASE: 5, // Прирост скорости каждую волну в % (10 = медленнее, 30 = быстрее)
    
    // 💰 БЛОКЧЕЙН НАСТРОЙКИ
    GAME_FEE: '0.001',      // Game start fee in PHRS (e.g.: '0.001', '0.005', '0.01')
    
    // 📝 НАСТРОЙКИ ЛОГИРОВАНИЯ
    DEBUG_MODE: false,      // Включить отладочные сообщения (true/false)
    LOG_LEVEL: 'ERROR',     // Уровень логирования: DEBUG, INFO, WARN, ERROR
    
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
// CRAB_SPEED: 80, CRAB_FIRE_RATE: 50, PLAYER_LIVES: 5, SCORE_MULTIPLIER: 120, GAME_FEE: ''
// CRAB_SPEED_BASE: 0.8, CRAB_SPEED_LEVEL_INCREASE: 0.2, CRAB_SPEED_KILL_MULTIPLIER: 0.001

// 🔴 СЛОЖНЫЙ РЕЖИМ:
// CRAB_SPEED: 130, CRAB_FIRE_RATE: 120, PLAYER_LIVES: 2, LEVEL_DIFFICULTY: 120, GAME_FEE: '0.002'
// CRAB_SPEED_BASE: 1.5, CRAB_SPEED_LEVEL_INCREASE: 0.4, CRAB_SPEED_KILL_MULTIPLIER: 0.002

// ⚡ БЫСТРАЯ ИГРА:
// CRAB_SPEED: 150, PLAYER_SPEED: 150, PLAYER_FIRE_RATE: 150, WAVE_SPEED_INCREASE: 30
// CRAB_SPEED_BASE: 2, CRAB_SPEED_LEVEL_INCREASE: 0.5, GAME_SPEED_LEVEL_INCREASE: 0.15

// 🎮 АРКАДНЫЙ РЕЖИМ:
// DOUBLE_SHOT: true, BULLET_PENETRATION: true, SCORE_MULTIPLIER: 200, PARTICLE_COUNT: 150

// 💻 ДЛЯ СЛАБЫХ ПК:
// PARTICLE_COUNT: 50, ANIMATION_SPEED: 80, INVADERS_ROWS: 4, INVADERS_COLS: 8

// 🏆 СОРЕВНОВАТЕЛЬНЫЙ:
// PLAYER_LIVES: 1, CRAB_SPEED: 110, CRAB_FIRE_RATE: 100, SCORE_MULTIPLIER: 100, GAME_FEE: '0.005'
// CRAB_SPEED_BASE: 1.2, CRAB_SPEED_LEVEL_INCREASE: 0.3, CRAB_SPEED_KILL_MULTIPLIER: 0.002

// 🐌 ОЧЕНЬ МЕДЛЕННЫЙ (для новичков):
// CRAB_SPEED_BASE: 0.5, CRAB_SPEED_LEVEL_INCREASE: 0.1, CRAB_SPEED_KILL_MULTIPLIER: 0.0005, CRAB_FIRE_RATE: 40

// 📊 ЛОГАРИФМИЧЕСКИЙ РОСТ СТРЕЛЬБЫ:
// Уровень 1: базовая частота * 0.69 | Уровень 4: базовая частота * 1.61
// Уровень 10: базовая частота * 2.40 (вместо * 10 в старой системе!)

// 💰 НАСТРОЙКИ КОМИССИИ:
// GAME_FEE: '0.0001' - Очень дешево (для тестов)
// GAME_FEE: '0.001'  - Стандартно (текущая цена)
// GAME_FEE: '0.005'  - Дорого (для турниров)
// GAME_FEE: '0.01'   - Очень дорого (для премиум режима)

