// 🏆 PHAROS INVADERS - TOURNAMENT CONSTANTS
// Централизованные константы для всей турнирной системы

const TOURNAMENT_CONSTANTS = {
    // ⏰ ВРЕМЕННЫЕ ИНТЕРВАЛЫ (миллисекунды)
    TIMEOUTS: {
        MESSAGE_DISPLAY: 5000,          // показ уведомлений 5 сек
        SUCCESS_MESSAGE: 3000,          // успешные сообщения 3 сек
        UI_ANIMATION: 100,              // анимации UI 100мс
        LOADING_MIN_DISPLAY: 1000,      // минимальный показ загрузки
        GAME_MONITOR_CHECK: 100,        // проверка игры каждые 100мс
        DATA_UPDATE_INTERVAL: 33000,    // обновление данных 33 сек
        TIMER_TICK: 1000,               // тик таймера каждую секунду
    },

    // 💾 КЕШИРОВАНИЕ
    CACHE: {
        DEFAULT_TTL: 30000,             // время жизни кеша 30 сек
        TOURNAMENT_INFO_TTL: 30000,     // кеш информации о турнире
        LEADERBOARD_TTL: 15000,         // кеш лидерборда 15 сек
        BATCH_DELAY: 100,               // задержка группировки запросов
    },

    // ⛽ GAS ЛИМИТЫ
    GAS: {
        TOURNAMENT_REGISTRATION: 200000,
        SCORE_SUBMISSION: 300000,
        TOURNAMENT_START: 200000,
        TOURNAMENT_END: 150000,
        DEFAULT_LIMIT: 200000,
        SAFETY_MULTIPLIER: 1.2,         // множитель безопасности для gas
    },

    // 🎮 ИГРОВЫЕ ПРАВИЛА  
    GAME: {
        MAX_ATTEMPTS: 3,                // максимум попыток на турнир
        MAX_SCORE: 1000000,             // максимальный счет
        MIN_VALID_SCORE: 1,             // минимальный валидный счет
        MIN_SCORE_THRESHOLD: 100,       // минимум для попадания в топ
        SINGLE_GAME_TIMEOUT: 300000,    // 5 минут максимум на игру
    },

    // 🌐 БЛОКЧЕЙН
    BLOCKCHAIN: {
        PHAROS_TESTNET_CHAIN_ID: '688688',
        CONNECTION_TIMEOUT: 10000,       // таймаут подключения
        TRANSACTION_TIMEOUT: 120000,     // таймаут транзакции 2 мин
    },

    // 📊 ЛИДЕРБОРД
    LEADERBOARD: {
        MEDAL_POSITIONS: 3,              // топ-3 получают медали
        MAX_DISPLAY_PLAYERS: 50,         // максимум игроков на экране
        VIRTUALIZATION_THRESHOLD: 50,    // с какого кол-ва включать виртуализацию
        PRIZE_WINNERS: 3,                // кол-во призовых мест
    },

    // 🎨 UI КОНСТАНТЫ
    UI: {
        MODAL_Z_INDEX: 10000,           // z-index для модальных окон
        NOTIFICATION_Z_INDEX: 2000,      // z-index для уведомлений
        TOOLTIP_Z_INDEX: 1000,          // z-index для подсказок
        OPACITY_FULL: 1.0,              // полная непрозрачность
        OPACITY_TRANSPARENT: 0.0,       // полная прозрачность
        BORDER_RADIUS: 20,              // стандартный радиус границ
    },

    // 🔢 ТЕХНИЧЕСКИЕ ЛИМИТЫ
    LIMITS: {
        MAX_LEADERBOARD_UPDATE_COUNT: 10,  // максимум записей для обновления
        BATCH_REQUEST_LIMIT: 10,           // максимум запросов в батче
        MAX_TOURNAMENT_SEARCH_RANGE: 100,  // диапазон поиска турниров
        START_TOURNAMENT_ID_FROM: 2,       // с какого ID начинать поиск
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TOURNAMENT_CONSTANTS;
} else if (typeof window !== 'undefined') {
    window.TOURNAMENT_CONSTANTS = TOURNAMENT_CONSTANTS;
}