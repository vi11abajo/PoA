// ⭐ BOOST CONSTANTS
// Все константы бонусов-бустеров для удобной настройки

const BOOST_CONSTANTS = {
    // 🛠️ Отладка
    DEBUG_MODE: false,        // Отладочные логи отключены для продакшена
    
    // ⏱️ Базовые времена действия бонусов (в миллисекундах)
    DURATIONS: {
        RAPID_FIRE: 10000,      // 10 секунд
        SHIELD_BARRIER: -1,     // Действует пока не разбит
        SCORE_MULTIPLIER: 10000, // 10 секунд  
        POINTS_FREEZE: 10000,   // 10 секунд
        MULTI_SHOT: 10000,      // 10 секунд
        HEALTH_BOOST: 0,        // Мгновенный эффект
        PIERCING_BULLETS: 10000, // 10 секунд
        INVINCIBILITY: 10000,   // 10 секунд
        GRAVITY_WELL: 10000,    // 10 секунд
        RICOCHET: 10000,        // 10 секунд
        RANDOM_CHAOS: [10000, 15000], // 10-15 секунд (рандомно)
        ICE_FREEZE: 10000,      // 10 секунд
        AUTO_TARGET: 7770,      // 7.77 секунд
        COIN_SHOWER: 0,         // Мгновенный эффект
        WAVE_BLAST: 0,          // Мгновенный эффект
        SPEED_TAMER: -1         // Навсегда
    },

    // 🎯 Параметры эффектов бонусов
    EFFECTS: {
        RAPID_FIRE: {
            multiplier: 2           // Увеличение скорости стрельбы в 2 раза
        },
        SHIELD_BARRIER: {
            hits: 3                 // Блокирует 3 попадания
        },
        SCORE_MULTIPLIER: {
            multiplier: 2           // Удваивает очки
        },
        MULTI_SHOT: {
            bullets: 3              // 3 пули одновременно
        },
        HEALTH_BOOST: {
            heal: 1                 // Восстанавливает 1 здоровье
        },
        ICE_FREEZE: {
            slowdown: 0.5           // Замедляет до 50% скорости 
        },
        POINTS_FREEZE: {
            freeze: true            // Замораживает счетчики врагов
        },
        COIN_SHOWER: {
            percentage: 0.25        // 25% от текущего счета
        },
        PIERCING_BULLETS: {
            pierce: true            // Пули проходят сквозь врагов
        },
        INVINCIBILITY: {
            immune: true            // Полная неуязвимость к урону
        },
        SPEED_TAMER: {
            reduction: 0.1          // Уменьшает на 10% за стак (нормальный баланс)
        }
    },

    // 🎲 Система редкости и шансов выпадения
    RARITY: {
        // Шансы выпадения по редкости (стандартные настройки)
        CHANCES: {
            COMMON: 50,      // 50%
            RARE: 35,        // 35%
            EPIC: 12,        // 12%
            LEGENDARY: 3     // 3%
        },

        // Распределение бонусов по редкости (стандартная балансировка)
        DISTRIBUTION: {
            COMMON: ['RAPID_FIRE', 'ICE_FREEZE', 'HEALTH_BOOST', 'POINTS_FREEZE'],
            RARE: ['SHIELD_BARRIER', 'AUTO_TARGET', 'INVINCIBILITY', 'MULTI_SHOT', 'SCORE_MULTIPLIER', 'RICOCHET'],
            EPIC: ['WAVE_BLAST', 'COIN_SHOWER', 'GRAVITY_WELL', 'PIERCING_BULLETS'],
            LEGENDARY: ['RANDOM_CHAOS', 'SPEED_TAMER']
        },

        // Цвета по редкости
        COLORS: {
            COMMON: '#ffffff',      // Белый
            RARE: '#00ddff',        // Голубой
            EPIC: '#9f00ff',        // Фиолетовый
            LEGENDARY: '#ffd700'    // Золотой
        }
    },

    // 🎯 Механика появления
    SPAWN: {
        DROP_CHANCE: 0.0277,     // 2.77% шанс выпадения (2-3 бонуса за уровень)
        FALL_SPEED: 1.5,         // Скорость падения
        LIFETIME: 6000,          // 6 секунд жизни на экране
        SIZE: 60,                // Размер бонуса в пикселях
        GLOW_RADIUS: 0           // Радиус свечения (отключено)
    },

    // 🎨 Визуальные эффекты
    VISUAL: {
        RAPID_FIRE: { color: '#ffff00', glow: true },      // Желтый с свечением
        SHIELD_BARRIER: { color: '#0088ff', glow: true },  // Синий с свечением  
        SCORE_MULTIPLIER: { color: '#ffd700', glow: true }, // Золотой с свечением
        POINTS_FREEZE: { color: '#88ddff', particles: true }, // Голубой с частицами
        MULTI_SHOT: { color: '#ff4444', trail: true },     // Красный со следом
        HEALTH_BOOST: { color: '#0088ff', heal: true },    // Синий с исцелением
        PIERCING_BULLETS: { color: '#ffffff', energy: true }, // Белый с энергией
        INVINCIBILITY: { color: '#rainbow', sparkle: true }, // Радужный с искрами
        GRAVITY_WELL: { color: '#330066', distort: true }, // Темный с искажением
        RICOCHET: { color: '#00ff44', shield: true },  // Зеленый со щитом
        RANDOM_CHAOS: { color: '#multicolor', random: true }, // Разноцветный
        ICE_FREEZE: { color: '#aaeeff', frost: true },     // Ледяной с морозом
        AUTO_TARGET: { color: '#ff0000', crosshair: true }, // Красный с прицелом
        COIN_SHOWER: { color: '#ffd700', coins: true },    // Золотой с монетами
        WAVE_BLAST: { color: '#0088ff', wave: true },      // Синий с волной
        SPEED_TAMER: { color: '#8844aa', snail: true }     // Фиолетовый с улиткой
    },

    // 🎵 Звуковые эффекты
    SOUNDS: {
        DROP: 'boost_drop.wav',
        PICKUP: 'boost_pickup.wav',
        ACTIVATE: 'boost_activate.wav',
        EXPIRE: 'boost_expire.wav'
    },

    // 📝 Тексты и иконки
    INFO: {
        RAPID_FIRE: { icon: '⚡', name: 'Rapid Fire' },
        SHIELD_BARRIER: { icon: '🛡️', name: 'Shield Barrier' },
        SCORE_MULTIPLIER: { icon: '💎', name: 'Score Multiplier' },
        POINTS_FREEZE: { icon: '⏰', name: 'Points Freeze' },
        MULTI_SHOT: { icon: '🔥', name: 'Multi-Shot' },
        HEALTH_BOOST: { icon: '💙', name: 'Health Boost' },
        PIERCING_BULLETS: { icon: '🎯', name: 'Piercing Bullets' },
        INVINCIBILITY: { icon: '⭐', name: 'Invincibility' },
        GRAVITY_WELL: { icon: '🌀', name: 'Gravity Well' },
        RICOCHET: { icon: '🛡️', name: 'Ricochet' },
        RANDOM_CHAOS: { icon: '🎲', name: 'Random Chaos' },
        ICE_FREEZE: { icon: '🧊', name: 'Ice Freeze' },
        AUTO_TARGET: { icon: '🎯', name: 'Auto-Target' },
        COIN_SHOWER: { icon: '💰', name: 'Coin Shower' },
        WAVE_BLAST: { icon: '🌊', name: 'Wave Blast' },
        SPEED_TAMER: { icon: '🐌', name: 'Speed Tamer' }
    }
};

// Экспортируем константы
window.BOOST_CONSTANTS = BOOST_CONSTANTS;