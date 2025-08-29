// 🎮 GAME CONSTANTS
// Все магические числа игры в одном месте для удобства настройки

const GAME_CONSTANTS = {
    // Производительность и FPS
    TARGET_FPS: 60,
    MAX_GAME_EVENT_LOG: 100,
    
    // Игрок
    PLAYER: {
        WIDTH: 60,
        HEIGHT: 60,
        SPEED: 6,
        SHOT_COOLDOWN: 300,
        BULLET_SPEED: 8
    },
    
    // Счет и очки
    SCORING: {
        VIOLET_CRAB: 100,
        RED_CRAB: 80,
        YELLOW_CRAB: 60,
        BLUE_CRAB: 40,
        GREEN_CRAB: 20,
        MAX_LEVEL_SCORES: {
            1: 3000,
            2: 6000,
            3: 16000
        }
    },
    
    // Пули крабов
    CRAB_BULLETS: {
        SPEED: 2.5,
        BASE_FIRE_RATE: 0.0008,
        CONFIG_DIVIDER: 100
    },
    
    // UI и анимация
    UI: {
        BUBBLE_INTERVAL: 500,
        BUBBLE_TIMEOUT: 8000,
        BUBBLE_MAX_SIZE: 20,
        BUBBLE_MIN_SIZE: 10,
        BUBBLE_MAX_DELAY: 2
    },
    
    // Системные таймауты
    TIMEOUTS: {
        TOURNAMENT_CHECK: 1000
    }
};

// Вычисляемые константы
GAME_CONSTANTS.FRAME_TIME = 1000 / GAME_CONSTANTS.TARGET_FPS;

console.log('🎮 Game constants loaded');