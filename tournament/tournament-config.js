// 🏆 PHAROS INVADERS - TOURNAMENT CONFIG
// Централизованная конфигурация турнирной системы

const TOURNAMENT_CONFIG = {
    // 🏗️ КОНТРАКТЫ И СЕТЬ
    NETWORK_NAME: 'Pharos Testnet',
    RPC_URL: 'https://testnet.dplabs-internal.com',
    CHAIN_ID: '688688',
    TOURNAMENT_CONTRACT_ADDRESS: '0x454064eA4517A80b0388EEeFFFBf2Efb85a86061',
    GAME_CONTRACT_ADDRESS: '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e',

    // 👑 АДМИНИСТРИРОВАНИЕ
    ADMIN_ADDRESS: '0x59F74eD82A08F80cff5D7E8055f6a24A18595F64',

    // 🎯 ТУРНИР ID УПРАВЛЕНИЕ  
    DEFAULT_TOURNAMENT_ID: 2,              // Базовый Tournament ID (обновляется админ-панелью)
    CURRENT_ACTIVE_TOURNAMENT_ID: null,    // ID текущего активного турнира
    AUTO_GENERATE_TOURNAMENT_ID: true,     // Включить автогенерацию ID
    ID_GENERATION_STRATEGY: 'sequential',  // sequential, random, timestamp

    // 💰 ФИНАНСОВЫЕ ПАРАМЕТРЫ
    ENTRY_FEE: '0.005', // PHRS
    PRIZE_DISTRIBUTION: {
        FIRST_PLACE: 60,    // 60% пула
        SECOND_PLACE: 25,   // 25% пула
        THIRD_PLACE: 5,     // 5% пула
        OWNER_FEE: 10       // 10% пула (остальные 90% распределяются)
    },

    // ⏰ ВРЕМЕННЫЕ ПАРАМЕТРЫ
    TOURNAMENT_DURATION: 600,        // 10 минут в секундах
    AUTO_UPDATE_INTERVAL: 33000,     // Обновление данных каждые 33 сек
    TIMER_UPDATE_INTERVAL: 1000,     // Обновление таймера каждую секунду
    WARNING_TIME_THRESHOLD: 120,     // Предупреждение за 2 минуты

    // 🎮 ИГРОВЫЕ ПАРАМЕТРЫ
    MAX_ATTEMPTS: 3,                 // Максимум попыток на турнир
    CANVAS_WIDTH: 800,              // Размер игрового поля
    CANVAS_HEIGHT: 600,
    GAME_TIMEOUT: 300000,           // 5 минут максимум на одну игру

    // 🔒 БЕЗОПАСНОСТЬ
    MAX_REASONABLE_SCORE: 999999,    // Максимальный разумный счет
    SCORE_VALIDATION: true,          // Включить валидацию счетов
    EVENT_LOGGING: true,             // Логирование игровых событий
    ANTICHEAT_ENABLED: true,         // Система античитов

    // 🎨 UI ПАРАМЕТРЫ
    LEADERBOARD_UPDATE_INTERVAL: 15000,  // Обновление лидерборда каждые 15 сек
    LEADERBOARD_MAX_ENTRIES: 100,        // Показывать топ-100
    NOTIFICATION_DURATION: 5000,         // Уведомления исчезают через 5 сек
    MODAL_ANIMATION_DURATION: 300,       // Анимация модальных окон 300мс

    // 🏷️ ТУРНИРНЫЕ СТАТУСЫ
    TOURNAMENT_STATES: {
        NOT_STARTED: 'not-started',
        ACTIVE: 'active',
        TIME_EXPIRED: 'time-expired',
        ENDED: 'ended'
    },

    // 👤 СТАТУСЫ ИГРОКОВ
    PLAYER_STATES: {
        NOT_REGISTERED: 'not-registered',
        REGISTERED: 'registered',
        PLAYING: 'playing',
        FINISHED: 'finished'
    },

    // 🎯 ИГРОВЫЕ КОНСТАНТЫ (из основной игры)
    GAME_CONFIG: {
        CRAB_SPEED: 60,
        CRAB_FIRE_RATE: 66,
        CRAB_BULLET_SPEED: 87,
        PLAYER_LIVES: 3,              // В турнире меньше жизней для сложности
        PLAYER_SPEED: 110,
        PLAYER_FIRE_RATE: 130,
        PLAYER_BULLET_SPEED: 115,
        LEVEL_DIFFICULTY: 83,
        SCORE_MULTIPLIER: 100,
        INVADERS_ROWS: 5,
        INVADERS_COLS: 10
    },

    // 🖼️ РЕСУРСЫ
    IMAGES: {
        OCTOPUS: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/octopus.png',
        PHAROS_LOGO: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/pharos.png',
        CRABS: {
            VIOLET: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabViolet.png',
            RED: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabRed.png',
            YELLOW: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabYellow.png',
            BLUE: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBlue.png',
            GREEN: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabGreen.png'
        },
        BOSSES: {
            1: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSGreen.png',
            2: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossBlue.png',
            3: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossYellow.png',
            4: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossRed.png',
            5: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBossViolet.png'
        }
    },

    // 📱 RESPONSIVE
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,

    // 🌐 API ENDPOINTS (если нужны)
    API: {
        TOURNAMENT_STATS: '/api/tournament/stats',
        LEADERBOARD: '/api/tournament/leaderboard'
    },

    // 🔧 DEBUG
    DEBUG_MODE: false,
    CONSOLE_LOGGING: true,
    PERFORMANCE_MONITORING: false
};

// 🛠️ УТИЛИТАРНЫЕ ФУНКЦИИ КОНФИГУРАЦИИ

// Получить адрес администратора
TOURNAMENT_CONFIG.getAdminAddress = () => {
    return TOURNAMENT_CONFIG.ADMIN_ADDRESS.toLowerCase();
};

// Проверить, является ли адрес администратором
TOURNAMENT_CONFIG.isAdmin = (address) => {
    if (!address) return false;
    return address.toLowerCase() === TOURNAMENT_CONFIG.getAdminAddress();
};

// Получить размер комиссии в Wei
TOURNAMENT_CONFIG.getEntryFeeWei = (web3) => {
    return web3.utils.toWei(TOURNAMENT_CONFIG.ENTRY_FEE, 'ether');
};

// Рассчитать призовые суммы
TOURNAMENT_CONFIG.calculatePrizes = (totalPrizePool, web3) => {
    const prizePoolBN = web3.utils.toBN(totalPrizePool);
    const ownerFee = prizePoolBN.mul(web3.utils.toBN(TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.OWNER_FEE))
                                .div(web3.utils.toBN(100));
    const remaining = prizePoolBN.sub(ownerFee);

    const distributionSum = TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.FIRST_PLACE +
                           TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.SECOND_PLACE +
                           TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.THIRD_PLACE; // = 90

    return {
        first: web3.utils.fromWei(
            remaining.mul(web3.utils.toBN(TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.FIRST_PLACE))
                    .div(web3.utils.toBN(distributionSum)), 'ether'
        ),
        second: web3.utils.fromWei(
            remaining.mul(web3.utils.toBN(TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.SECOND_PLACE))
                    .div(web3.utils.toBN(distributionSum)), 'ether'
        ),
        third: web3.utils.fromWei(
            remaining.mul(web3.utils.toBN(TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.THIRD_PLACE))
                    .div(web3.utils.toBN(distributionSum)), 'ether'
        ),
        ownerFee: web3.utils.fromWei(ownerFee, 'ether'),
        total: web3.utils.fromWei(totalPrizePool, 'ether')
    };
};

// Получить Chain ID в hex формате
TOURNAMENT_CONFIG.getChainIdHex = () => {
    return `0x${parseInt(TOURNAMENT_CONFIG.CHAIN_ID).toString(16)}`;
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TOURNAMENT_CONFIG;
} else if (typeof window !== 'undefined') {
    window.TOURNAMENT_CONFIG = TOURNAMENT_CONFIG;
}

console.log('🏆 Tournament config loaded:', TOURNAMENT_CONFIG);