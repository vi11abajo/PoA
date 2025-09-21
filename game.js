// game.js - FULL GAME RESTORED WITH CONFIG SPEED SETTINGS + TOURNAMENT MODE + PERFORMANCE OPTIMIZATIONS


// 🏆 ТУРНИРНЫЙ РЕЖИМ - добавлено в начало
let tournamentMode = window.tournamentMode || false;
let tournamentData = window.tournamentData || null;

// 🚀 PERFORMANCE OPTIMIZER - добавлено для оптимизации
let performanceOptimizer = null;
let performanceMonitor = null;

// Game variables
let gameState = 'start';
let score = 0;
let lives = 5;
const MAX_LIVES = 100;
let level = 1;
let gameSpeed = 1;
let hasPaidFee = false;

// Canvas and timing variables (moved to top to prevent initialization errors)
let canvas, ctx;
let deltaTime = 0;

// Система динамических очков
let levelStartTime = 0;
let currentScoreMultiplier = 1.0;
let scoreAlreadySaved = false;
let currentGameSession = null;

// Timer management for memory leak prevention
const gameTimers = {
    intervals: new Map(),
    timeouts: new Set()
};

// Canvas rendering optimization
const renderCache = {
    lastPlayerShadow: null,
    lastCrabShadow: null,
    shadowsEnabled: true
};

// 🎯 Функция уничтожения врагов (для системы бонусов)
function destroyInvader(invader, index) {
    // 🔊 Звук смерти краба
    if (window.soundManager) {
        soundManager.playSound('crabDeath', 0.4, 0.8 + Math.random() * 0.4);
    }

    // Получаем очки за уничтожение
    const points = getInvaderScore(invader.row);
    
    // Защита от undefined score
    if (score === undefined || score === null || isNaN(score)) {
        score = 0;
        console.warn('⚠️ Score was undefined, reset to 0');
    }
    
    score += points;
    window.score = score; // Синхронизируем с глобальной переменной

    // Проверяем скоровые триггеры для easter egg'ов
    if (window.easterEggManager) {
        window.easterEggManager.onScoreUpdate(score);
    }

    // Уведомляем easterEggManager об убийстве моба
    if (window.easterEggManager) {
        window.easterEggManager.onMobKilled();
    }

    // Шанс выпадения бонуса
    if (window.tryCreateBoost) {
        window.tryCreateBoost(
            invader.x + invader.width / 2,
            invader.y + invader.height / 2
        );
    }
}

// Экспортируем для системы бонусов
window.destroyInvader = destroyInvader;
window.getInvaderScore = getInvaderScore;

// 🎯 Функция синхронизации счета (для системы бонусов)
function syncScore(newScore) {
    if (newScore !== undefined && newScore !== null) {
        score = newScore;
        window.score = score;

        // Проверяем скоровые триггеры для easter egg'ов
        if (window.easterEggManager) {
            window.easterEggManager.onScoreUpdate(score);
        }

        // Score synced
    } else {
        console.warn(`⚠️ syncScore called with invalid value: ${newScore}`);
    }
}
window.syncScore = syncScore;

// 💚 Функция синхронизации жизней (для системы бонусов)
function syncLives(newLives) {
    lives = newLives;
    window.lives = lives;
    // Lives synced
}
window.syncLives = syncLives;

// 🧊 Функция синхронизации скорости игры (для системы бонусов)
function syncGameSpeed(newGameSpeed) {
    gameSpeed = newGameSpeed;
    window.gameSpeed = gameSpeed;
    // GameSpeed synced
}
window.syncGameSpeed = syncGameSpeed;

// 🏃 Функция движения врагов (для системы бонусов)
function moveInvaders() {
    for (let invader of invaders) {
        if (invader.alive) {
            // Получаем множитель от SPEED_TAMER
            let speedTamerMultiplier = 1;
            if (window.boostManager && window.boostManager.speedTamerStacks > 0 && window.BOOST_CONSTANTS) {
                const reduction = window.boostManager.speedTamerStacks * window.BOOST_CONSTANTS.EFFECTS.SPEED_TAMER.reduction;
                speedTamerMultiplier = Math.max(0.1, 1 - reduction);
            }
            
            const currentSpeed = invaderSpeed * speedTamerMultiplier * deltaTime;
            invader.x += currentSpeed * invaderDirection;
            invader.animFrame += 0.08 * deltaTime;
            invader.clawOffset += 0.12 * deltaTime;
        }
    }
}

// Экспортируем для системы бонусов
window.moveInvaders = moveInvaders;

// 💔 Функция получения урона игроком (для системы бонусов)
function damagePlayer(damage = 1) {
    lives -= damage;
    
    if (lives <= 0) {
        gameState = 'gameOver';
        return true; // Игрок умер
    }
    
    return false; // Игрок жив
}

// Экспортируем для системы бонусов
window.damagePlayer = damagePlayer;
window.updatePlayer = updatePlayer;
window.renderPlayer = drawPlayer;

// Экспортируем переменные для системы бонусов
window.score = score;
window.shotCooldown = 250;
window.invaderSpeed = 1; // Будет обновлено после инициализации переменной
window.gameSpeed = gameSpeed;
// Осторожно с deltaTime - может быть undefined на старте
if (typeof deltaTime !== 'undefined') {
    window.deltaTime = deltaTime;
} else {
    window.deltaTime = 0;
}
// Canvas и ctx будут экспортированы в initCanvas() после инициализации

// Collision detection optimization
function fastCollisionCheck(rect1, rect2) {
    return !(rect1.x >= rect2.x + rect2.width || 
             rect2.x >= rect1.x + rect1.width ||
             rect1.y >= rect2.y + rect2.height ||
             rect2.y >= rect1.y + rect1.height);
}

function broadPhaseCollisionCheck(bullet, invader, threshold = 100) {
    const dx = (bullet.x + bullet.width/2) - (invader.x + invader.width/2);
    const dy = (bullet.y + bullet.height/2) - (invader.y + invader.height/2);
    return (dx * dx + dy * dy) < threshold * threshold;
}

function createSafeInterval(callback, delay, name) {
    const intervalId = setInterval(callback, delay);
    if (name) {
        gameTimers.intervals.set(name, intervalId);
    }
    return intervalId;
}

function createSafeTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
        callback();
        gameTimers.timeouts.delete(timeoutId);
    }, delay);
    gameTimers.timeouts.add(timeoutId);
    return timeoutId;
}

function clearAllGameTimers() {
    // Clear all intervals
    gameTimers.intervals.forEach((intervalId, name) => {
        clearInterval(intervalId);
    });
    gameTimers.intervals.clear();
    
    // Clear all timeouts
    gameTimers.timeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    gameTimers.timeouts.clear();
}

// Optimized rendering functions
function setPlayerShadow(ctx) {
    if (renderCache.shadowsEnabled && renderCache.lastPlayerShadow !== '#00ddff') {
        ctx.shadowColor = '#00ddff';
        ctx.shadowBlur = 15;
        renderCache.lastPlayerShadow = '#00ddff';
    }
}

function setCrabShadow(ctx, color) {
    if (renderCache.shadowsEnabled && renderCache.lastCrabShadow !== color) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        renderCache.lastCrabShadow = color;
    }
}

function clearShadow(ctx) {
    if (renderCache.shadowsEnabled) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        renderCache.lastPlayerShadow = null;
        renderCache.lastCrabShadow = null;
    }
}

// 🔥 НОВАЯ ПЕРЕМЕННАЯ V2: состояние босса
let bossActive = false;

// 🥞 TOASTY SYSTEM (как в Mortal Kombat)
let toastySystem = {
    image: null,
    element: null,
    isShowing: false,

    init() {
        // Загружаем изображение
        this.image = new Image();
        this.image.src = '../images/pika.png';

        // Создаем HTML элемент для отображения
        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            left: -200px;
            bottom: 20%;
            z-index: 10003;
            pointer-events: none;
            transition: left 0.3s ease-out;
        `;

        const img = document.createElement('img');
        img.src = '../images/pika.png';
        img.style.cssText = `
            width: 150px;
            height: auto;
            filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.7));
        `;

        this.element.appendChild(img);

        // В турнирном режиме прикрепляем к турнирному модалу
        if (window.tournamentMode || tournamentMode) {
            const gameModal = document.querySelector('.tournament-game-modal');
            if (gameModal) {
                gameModal.appendChild(this.element);
            } else {
                document.body.appendChild(this.element);
            }
        } else {
            document.body.appendChild(this.element);
        }

    },

    show() {
        if (this.isShowing) return;

        this.isShowing = true;

        // Воспроизводим звук
        if (window.soundManager) {
            soundManager.playSound('toasty', 1.0, 1.0);
        }

        // Анимация появления
        this.element.style.left = '20px';

        // Автоматически скрываем через 3.33 секунды
        setTimeout(() => {
            this.hide();
        }, 3330);

    },

    hide() {
        this.element.style.left = '-200px';

        setTimeout(() => {
            this.isShowing = false;
        }, 300); // Ждем завершения анимации
    },

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
};

// 🚢 SAILOR SYSTEM (справа экрана)
let sailorSystem = {
    image: null,
    element: null,
    isShowing: false,

    init() {
        if (this.element) return; // Уже инициализирован

        // Создаем контейнер
        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            right: -200px;
            bottom: 20%;
            z-index: 10003;
            pointer-events: none;
            transition: right 0.3s ease-out;
        `;

        const img = document.createElement('img');
        img.src = '../images/sailor.png';
        img.style.cssText = `
            width: 150px;
            height: auto;
            filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.7));
        `;

        this.element.appendChild(img);

        // В турнирном режиме прикрепляем к турнирному модалу
        if (window.tournamentMode || tournamentMode) {
            const gameModal = document.querySelector('.tournament-game-modal');
            if (gameModal) {
                gameModal.appendChild(this.element);
            } else {
                document.body.appendChild(this.element);
            }
        } else {
            document.body.appendChild(this.element);
        }

    },

    show() {
        if (this.isShowing) return;

        this.isShowing = true;

        // Воспроизводим звук
        if (window.soundManager) {
            soundManager.playSound('cu', 1.0, 1.0);
        }

        // Анимация появления справа
        this.element.style.right = '20px';

        // Автоматически скрываем через 3.33 секунды
        setTimeout(() => {
            this.hide();
        }, 3330);

    },

    hide() {
        if (!this.isShowing) return;

        this.isShowing = false;
        this.element.style.right = '-200px';

    },

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
};

// 🎲 EASTER EGG MANAGER (управляет редким появлением Toasty и Sailor по событиям)
let easterEggManager = {
    mobsKilledInRound: 0,
    totalMobsInRound: 0,
    milestone77Triggered: false,
    // Новые скоровые триггеры
    pikaTriggered: false,      // Пика при 3000 очков
    sailorTriggered: false,    // Сейлор при 6000 очков

    init() {
        this.resetRoundProgress();
    },

    resetRoundProgress() {
        this.mobsKilledInRound = 0;
        this.totalMobsInRound = 0;
        this.milestone77Triggered = false;
        // НЕ сбрасываем скоровые триггеры при переходе между раундами
        // this.pikaTriggered = false;
        // this.sailorTriggered = false;
    },

    setTotalMobsInRound(count) {
        this.totalMobsInRound = count;
        this.mobsKilledInRound = 0;
        this.milestone77Triggered = false;
    },

    onMobKilled() {
        this.mobsKilledInRound++;
        const percentage = (this.mobsKilledInRound / this.totalMobsInRound) * 100;

        // Проверяем 77% порог
        if (!this.milestone77Triggered && percentage >= 77) {
            this.milestone77Triggered = true;
            this.tryShowEasterEgg(0.20, 'mob_77_percent'); // 20% шанс
        }
    },

    onBossDefeated() {
        this.tryShowEasterEgg(0.12, 'boss_defeated'); // 12% шанс
    },

    onBoostPickup() {
        this.tryShowEasterEgg(0.04, 'boost_pickup'); // 4% шанс
    },

    onScoreUpdate(currentScore) {
        // Проверяем триггер Пики на 3000 очков (100% шанс)
        if (!this.pikaTriggered && currentScore >= 3000) {
            this.pikaTriggered = true;
            this.showSpecificEasterEgg('toasty', 'score_3000_pika');
        }

        // Проверяем триггер Сейлора на 6000 очков (100% шанс)
        if (!this.sailorTriggered && currentScore >= 6000) {
            this.sailorTriggered = true;
            this.showSpecificEasterEgg('sailor', 'score_6000_sailor');
        }
    },

    tryShowEasterEgg(chance, trigger) {
        // Показываем только во время игры и если никто не показывается
        if (gameState !== 'playing' || toastySystem.isShowing || sailorSystem.isShowing) {
            return;
        }

        const random = Math.random();
        if (random <= chance) {
            this.showRandomEasterEgg(trigger);
        }

    },

    showRandomEasterEgg(trigger) {
        // Случайно выбираем какой easter egg показать
        const random = Math.random();

        if (random < 0.5) {
            // 50% шанс для Toasty (слева)
            toastySystem.show();
        } else {
            // 50% шанс для Sailor (справа)
            sailorSystem.show();
        }
    },

    showSpecificEasterEgg(type, trigger) {
        // Показываем только во время игры
        if (gameState !== 'playing') {
            return;
        }

        // Для скоровых триггеров со 100% шансом - ждем пока никто не показывается
        if (trigger.includes('score_')) {
            if (toastySystem.isShowing || sailorSystem.isShowing) {
                // Пытаемся показать через 2 секунды
                setTimeout(() => {
                    this.showSpecificEasterEgg(type, trigger);
                }, 2000);
                return;
            }
        } else {
            // Для других триггеров - просто не показываем если что-то уже показывается
            if (toastySystem.isShowing || sailorSystem.isShowing) {
                return;
            }
        }

        if (type === 'toasty') {
            toastySystem.show();
        } else if (type === 'sailor') {
            sailorSystem.show();
        }
    },

    destroy() {
        this.resetRoundProgress();
        // Сбрасываем скоровые триггеры при полном перезапуске игры
        this.pikaTriggered = false;
        this.sailorTriggered = false;
    }
};

// ПЕРЕМЕННАЯ ДЛЯ ЗАДЕРЖКИ МЕЖДУ УРОВНЯМИ
let levelTransitionActive = false;

// FPS variables
let lastTime = 0;
const targetFPS = GAME_CONSTANTS.TARGET_FPS;
const frameTime = GAME_CONSTANTS.FRAME_TIME;

// Load game images
const octopusImage = new Image();
let octopusImageLoaded = false;

const crabImages = {
    violet: new Image(),
    red: new Image(),
    yellow: new Image(),
    blue: new Image(),
    green: new Image()
};

let crabImagesLoaded = {
    violet: false,
    red: false,
    yellow: false,
    blue: false,
    green: false
};

// Set image sources
octopusImage.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/octopus.png';
octopusImage.onload = () => { octopusImageLoaded = true; };
octopusImage.onerror = () => { octopusImageLoaded = false; };

crabImages.violet.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabViolet.png';
crabImages.red.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabRed.png';
crabImages.yellow.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabYellow.png';
crabImages.blue.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBlue.png';
crabImages.green.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabGreen.png';

Object.keys(crabImages).forEach(color => {
    crabImages[color].onload = () => {
        crabImagesLoaded[color] = true;
    };
    crabImages[color].onerror = () => {
        crabImagesLoaded[color] = false;
    };
});

// Canvas and game objects (moved to top)

// Game objects
const player = {
    x: 370,
    y: 520,
    width: 60,
    height: 60,
    speed: 6
};

// Делаем player доступным глобально для системы бонусов
window.player = player;

let bullets = [];
let invaders = [];
let invaderBullets = [];
window.crabBullets = invaderBullets; // Экспорт для системы бонусов
let particles = [];
let ripples = [];
let healEffects = [];

// Game settings - теперь используем значения из конфига
const invaderRows = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.INVADERS_ROWS) ? GAME_CONFIG.INVADERS_ROWS : 5;
const invaderCols = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.INVADERS_COLS) ? GAME_CONFIG.INVADERS_COLS : 10;
const invaderWidth = 35;
const invaderHeight = 30;
let invaderSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_BASE) ? GAME_CONFIG.CRAB_SPEED_BASE : 1;
let invaderDirection = 1;
let invaderDropDistance = 25;

// Экспортируем переменные после их объявления
window.invaderDirection = invaderDirection;
window.invaderSpeed = invaderSpeed; // Обновляем правильное значение

// Controls
const keys = {};
let lastShotTime = 0;
let shotCooldown = 300; // Изменено на let для системы бонусов

// 🔐 ФУНКЦИЯ РАСЧЕТА МАКСИМАЛЬНО ВОЗМОЖНОГО СЧЕТА
// Кумулятивные максимальные значения с учетом всех предыдущих уровней
function calculateMaxScore() {
    const cumulativeMaxScores = {
        1: 10000,      // 10,000
        2: 21000,      // 10,000 + 11,000
        3: 41000,      // 21,000 + 20,000 (boss)
        4: 53000,      // 41,000 + 12,000
        5: 66000,      // 53,000 + 13,000
        6: 106000,     // 66,000 + 40,000 (boss)
        7: 120000,     // 106,000 + 14,000
        8: 135000,     // 120,000 + 15,000
        9: 195000,     // 135,000 + 60,000 (boss)
        10: 211000,    // 195,000 + 16,000
        11: 228000,    // 211,000 + 17,000
        12: 308000,    // 228,000 + 80,000 (boss)
        13: 326000,    // 308,000 + 18,000
        14: 345000,    // 326,000 + 19,000
        15: 445000     // 345,000 + 100,000 (boss) - ФИНАЛЬНЫЙ МАКСИМУМ
    };
    
    return cumulativeMaxScores[level] || 445000;
}

// 🔐 ФУНКЦИЯ ЛОГИРОВАНИЯ ИГРОВЫХ СОБЫТИЙ
function logGameEvent(eventType, data) {
    if (!window.gameEventLog) {
        window.gameEventLog = [];
    }

    window.gameEventLog.push({
        type: eventType,
        data: data,
        timestamp: Date.now(),
        level: level,
        score: score
    });

    if (window.gameEventLog.length > 100) {
        window.gameEventLog.shift();
    }
}

function initCanvas() {
    // Сначала пробуем найти основной canvas
    canvas = document.getElementById('gameCanvas');

    // Если не найден, ищем турнирный canvas
    if (!canvas) {
        canvas = document.getElementById('tournamentGameCanvas');
    }

    // Если ничего не найдено, создаем canvas
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        canvas.width = 800;
        canvas.height = 600;

        // Добавляем canvas в модальное окно если оно есть
        const gameModal = document.querySelector('.tournament-game-modal');
        if (gameModal) {
            gameModal.appendChild(canvas);
        } else {
            document.body.appendChild(canvas);
        }
    }

    if (canvas) {
        ctx = canvas.getContext('2d');
        
        // Обновляем экспорты для системы бонусов
        window.canvas = canvas;
        window.ctx = ctx;
    } else {
        Logger.error('Failed to initialize canvas');
    }
}

// Create bubbles effect
function createBubbles() {
    const bubblesContainer = document.querySelector('.bubbles');
    if (!bubblesContainer) return;

    createSafeInterval(() => {
        if (Math.random() < 0.3) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.width = bubble.style.height = (Math.random() * GAME_CONSTANTS.UI.BUBBLE_MAX_SIZE + GAME_CONSTANTS.UI.BUBBLE_MIN_SIZE) + 'px';
            bubble.style.animationDelay = Math.random() * GAME_CONSTANTS.UI.BUBBLE_MAX_DELAY + 's';
            bubble.style.animationDuration = (Math.random() * 4 + 4) + 's';
            bubblesContainer.appendChild(bubble);

            createSafeTimeout(() => {
                if (bubble.parentNode) {
                    bubble.remove();
                }
            }, GAME_CONSTANTS.UI.BUBBLE_TIMEOUT);
        }
    }, GAME_CONSTANTS.UI.BUBBLE_INTERVAL, 'bubbles');
}

// Keyboard events
document.addEventListener('keydown', (e) => {
    // Игнорируем игровые клавиши если пользователь печатает в поле ввода
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    keys[e.code] = true;

    if (e.code === 'KeyP' && gameState === 'playing') {
        gameState = 'paused';
    } else if (e.code === 'KeyP' && gameState === 'paused') {
        gameState = 'playing';
        requestAnimationFrame(gameLoop);
    }

    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') {
            startGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    // Игнорируем игровые клавиши если пользователь печатает в поле ввода
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    keys[e.code] = false;
});

// Create crabs
function createInvaders() {
    invaders = [];
    const startX = 50;
    const startY = 50;
    const spacingX = 65;
    const spacingY = 55;

    for (let row = 0; row < invaderRows; row++) {
        for (let col = 0; col < invaderCols; col++) {
            let crabType = 'green';
            if (row === 0) crabType = 'violet';
            else if (row === 1) crabType = 'red';
            else if (row === 2) crabType = 'yellow';
            else if (row === 3) crabType = 'blue';
            else if (row === 4) crabType = 'green';

            invaders.push({
                x: startX + col * spacingX,
                y: startY + row * spacingY,
                width: invaderWidth,
                height: invaderHeight,
                alive: true,
                type: crabType,
                row: row, // добавляем номер ряда для новой системы очков
                animFrame: 0,
                clawOffset: Math.random() * Math.PI * 2
            });
        }
    }

    // Уведомляем easterEggManager о количестве мобов в раунде
    if (easterEggManager) {
        easterEggManager.setTotalMobsInRound(invaders.length);
    }
}

// Create player bullet
function createBullet() {
    const now = Date.now();
    // Используем глобальную переменную если доступна (для системы бонусов)
    const currentCooldown = window.shotCooldown !== undefined ? window.shotCooldown : shotCooldown;
    const adjustedCooldown = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_FIRE_RATE)
        ? currentCooldown * (100 / GAME_CONFIG.PLAYER_FIRE_RATE)
        : currentCooldown;

    if (now - lastShotTime > adjustedCooldown) {
        // 🔊 Звук выстрела игрока
        if (window.soundManager) {
            soundManager.playSound('playerShoot', 0.6, 1.0 + Math.random() * 0.2);
        }

        const bulletSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_BULLET_SPEED)
            ? 8 * (GAME_CONFIG.PLAYER_BULLET_SPEED / 100)
            : 8;

        // 🚀 Используем object pooling для пуль игрока если доступен
        let bullet;
        if (performanceOptimizer) {
            bullet = performanceOptimizer.getPooledObject('playerBullets', {
                x: player.x + player.width / 2 - 3,
                y: player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: [],
                vy: -bulletSpeed,
                vx: 0, // Всегда строго вверх
                piercing: window.boostManager && window.boostManager.isBoostActive('PIERCING_BULLETS'),
                color: (window.boostManager && window.boostManager.isBoostActive('PIERCING_BULLETS')) ? '#ffffff' : null,
                // Очищаем старые флаги бонусов
                multiShot: false,
                autoTarget: false,
                originalVx: undefined,
                originalVy: undefined
            });
        } else {
            bullet = {
                x: player.x + player.width / 2 - 3,
                y: player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: [],
                vy: -bulletSpeed,
                vx: 0, // Всегда строго вверх
                piercing: window.boostManager && window.boostManager.isBoostActive('PIERCING_BULLETS'),
                color: (window.boostManager && window.boostManager.isBoostActive('PIERCING_BULLETS')) ? '#ffffff' : null,
                // Очищаем старые флаги бонусов
                multiShot: false,
                autoTarget: false,
                originalVx: undefined,
                originalVy: undefined
            };
        }
        if (bullet) {
            bullets.push(bullet);
        }
        lastShotTime = now;
        createRipple(player.x + player.width / 2, player.y);
    }
}

// Экспортируем для системы бонусов
window.createBullet = createBullet;
window.lastShotTime = () => lastShotTime;
window.setLastShotTime = (time) => { lastShotTime = time; };

// Create crab bullet
function createInvaderBullet(invader) {
    const baseFireRate = 0.0008 * Math.log(level + 1);
    const adjustedFireRate = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_FIRE_RATE)
        ? baseFireRate * (GAME_CONFIG.CRAB_FIRE_RATE / 100)
        : baseFireRate;

    if (Math.random() < adjustedFireRate) {
        const bulletSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_BULLET_SPEED)
            ? 2.5 * (GAME_CONFIG.CRAB_BULLET_SPEED / 100)
            : 2.5;

        // 🚀 Используем object pooling для пуль крабов если доступен
        let bullet;
        if (performanceOptimizer) {
            bullet = performanceOptimizer.getPooledObject('crabBullets', {
                x: invader.x + invader.width / 2 - 4,
                y: invader.y + invader.height,
                width: 8,
                height: 8,
                speed: bulletSpeed,
                wobble: 0,
                vy: bulletSpeed,
                fromCrab: true
            });
            // Очищаем флаги из предыдущего использования
            if (bullet) {
                delete bullet.absorbed;
                delete bullet.vx;
                delete bullet.vy;
                delete bullet.ricochet;
                delete bullet.color; // Сбрасываем цвет к стандартному
                delete bullet.autoTargeted; // Очищаем AUTO_TARGET флаги
                delete bullet.originalVx;
                delete bullet.originalVy;
                bullet.justCreated = true; // Помечаем как только что созданную
                bullet.creationTime = Date.now();
            }
        } else {
            bullet = {
                x: invader.x + invader.width / 2 - 4,
                y: invader.y + invader.height,
                width: 8,
                height: 8,
                speed: bulletSpeed,
                wobble: 0,
                vy: bulletSpeed,
                fromCrab: true,
                justCreated: true, // Помечаем как только что созданную
                creationTime: Date.now()
            };
        }
        
        // Bullet created successfully
        if (bullet) {
            invaderBullets.push(bullet);
        }
    }
}

// Create explosion particles
function createExplosion(x, y, color, isOctopus = false) {
    const particleCount = isOctopus ? 15 : 12;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 40,
            maxLife: 40,
            color: color,
            size: Math.random() * 4 + 2,
            isInk: isOctopus
        });
    }
}

// Create water ripple
function createRipple(x, y) {
    ripples.push({
        x: x,
        y: y,
        size: 0,
        maxSize: 50,
        life: 30
    });
}

function createHealEffect(x, y, healAmount) {
    healEffects.push({
        x: x,
        y: y,
        startY: y,
        text: `💙 +${healAmount}`,
        life: 120, // 2 секунды при 60 FPS
        maxLife: 120,
        alpha: 1.0,
        wobbleTime: 0
    });
}

// Система динамических очков
function isBossLevel(levelNum) {
    return [3, 6, 9, 12, 15].includes(levelNum);
}

function updateScoreMultiplier() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - levelStartTime;
    
    // Каждые 2.5 секунды уменьшаем на 1%
    const intervalsPassedFloat = elapsedTime / GAME_CONSTANTS.SCORING.DECAY_INTERVAL;
    const intervalsPassed = Math.floor(intervalsPassedFloat);
    
    // Рассчитываем текущий множитель
    const decayAmount = intervalsPassed * GAME_CONSTANTS.SCORING.DECAY_RATE;
    currentScoreMultiplier = Math.max(GAME_CONSTANTS.SCORING.MIN_PERCENTAGE, 1.0 - decayAmount);
}

function getInvaderScore(rowIndex) {
    // Определяем базовые очки по ряду (ряд 0 = верхний фиолетовый, ряд 4 = нижний зеленый)
    const rowScores = [
        GAME_CONSTANTS.SCORING.BASE_SCORES.ROW_5, // ряд 0 (верхний - фиолетовый)
        GAME_CONSTANTS.SCORING.BASE_SCORES.ROW_4, // ряд 1 (красный)
        GAME_CONSTANTS.SCORING.BASE_SCORES.ROW_3, // ряд 2 (желтый)
        GAME_CONSTANTS.SCORING.BASE_SCORES.ROW_2, // ряд 3 (синий)
        GAME_CONSTANTS.SCORING.BASE_SCORES.ROW_1  // ряд 4 (нижний - зеленый)
    ];
    
    let baseScore = rowScores[rowIndex] || 7; // fallback к минимальным очкам
    
    // Применяем множитель уровня если это не босс уровень
    if (!isBossLevel(level) && GAME_CONSTANTS.SCORING.LEVEL_MULTIPLIERS[level]) {
        baseScore = Math.floor(baseScore * GAME_CONSTANTS.SCORING.LEVEL_MULTIPLIERS[level]);
    }
    
    // Применяем временное уменьшение очков
    updateScoreMultiplier();
    const finalScore = Math.max(1, Math.floor(baseScore * currentScoreMultiplier));
    
    return finalScore;
}

function initLevelScoring() {
    levelStartTime = Date.now();
    currentScoreMultiplier = 1.0;

    // Сбрасываем прогресс easterEggManager для нового уровня
    if (window.easterEggManager) {
        window.easterEggManager.resetRoundProgress();
    }
}

// Update player
function updatePlayer(deltaTime) {
    const playerSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_SPEED)
        ? player.speed * (GAME_CONFIG.PLAYER_SPEED / 100)
        : player.speed;
    const moveSpeed = playerSpeed * deltaTime;

    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= moveSpeed;
    }
    if (keys['ArrowRight'] && player.x < (canvas ? canvas.width : 800) - player.width) {
        player.x += moveSpeed;
    }
    if (keys['Space']) {
        createBullet();
    }
}

// Update bullets
function updateBullets(deltaTime) {
    // 🚀 Обновляем пули игрока с возвратом в object pool
    bullets = bullets.filter(bullet => {
        // Поддержка полного движения для AUTO_TARGET или стандартное движение
        if (bullet.vy !== undefined) {
            bullet.y += bullet.vy * deltaTime; // AUTO_TARGET может изменить vy
        } else {
            bullet.y -= bullet.speed * deltaTime; // Обычное движение вверх
        }
        // Поддержка горизонтального движения для Multi-Shot и AUTO_TARGET
        if (bullet.vx !== undefined) {
            bullet.x += bullet.vx * deltaTime;
        }
        bullet.trail.push({x: bullet.x + bullet.width/2, y: bullet.y + bullet.height});
        if (bullet.trail.length > 8) bullet.trail.shift();
        
        if (bullet.y <= -bullet.height) {
            // Очищаем флаги перед возвратом в пул
            delete bullet.autoTargeted;
            delete bullet.originalVx;
            delete bullet.originalVy;
            // Возвращаем пулю в пул при выходе за границы если доступен
            if (performanceOptimizer) {
                performanceOptimizer.returnToPool('playerBullets', bullet);
            }
            return false;
        }
        return true;
    });

    // 🚀 Обновляем пули крабов с возвратом в object pool
    
    // Применяем эффекты бонусов к пулям врагов
    if (window.boostEffects && window.boostManager) {
        // RICOCHET - должен быть первым, чтобы отражать пули до других эффектов
        if (window.boostManager.isBoostActive('RICOCHET') && window.player) {
            window.boostEffects.applyRicochetEffect(invaderBullets, window.player);
        }
        
        if (window.boostManager.isBoostActive('GRAVITY_WELL')) {
            window.boostEffects.applyGravityWellEffect(invaderBullets);
        } else {
            // Сбрасываем эффекты гравитации если бонус неактивен
            for (const bullet of invaderBullets) {
                if (bullet.vx !== undefined || bullet.vy !== undefined || bullet.absorbed) {
                    delete bullet.vx;
                    delete bullet.vy;
                    delete bullet.absorbed; // ВАЖНО: сбрасываем флаг поглощения
                    // Восстанавливаем обычную скорость
                    bullet.speed = bullet.speed || 2;
                    bullet.wobble = bullet.wobble || 0;
                    
                    if (BOOST_CONSTANTS.DEBUG_MODE) {
                        // Reset gravity effects for bullet
                    }
                }
            }
        }
    }
    
    invaderBullets = invaderBullets.filter(bullet => {
        // Проверяем поглощена ли пуля гравитационным колодцем
        if (bullet.absorbed) {
            if (BOOST_CONSTANTS.DEBUG_MODE) {
                // Removing absorbed bullet
            }
            // Очищаем пулю перед возвратом в пул
            delete bullet.color;
            delete bullet.ricochet;
            delete bullet.autoTargeted;
            delete bullet.originalVx;
            delete bullet.originalVy;
            // Возвращаем пулю в пул если доступен
            if (performanceOptimizer) {
                performanceOptimizer.returnToPool('crabBullets', bullet);
            }
            return false; // Удаляем поглощенную пулю
        }
        
        // Снимаем флаг justCreated через 100мс после создания
        if (bullet.justCreated && bullet.creationTime && Date.now() - bullet.creationTime > 100) {
            bullet.justCreated = false;
        }
        
        // Используем vx и vy если они были изменены эффектами (например GRAVITY_WELL)
        if (bullet.vx !== undefined && bullet.vy !== undefined) {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
        } else {
            // Обычное движение пуль
            bullet.y += bullet.speed * deltaTime;
            bullet.wobble += 0.2 * deltaTime;
            bullet.x += Math.sin(bullet.wobble) * 0.5 * deltaTime;
        }
        
        if (bullet.y >= (canvas ? canvas.height : 600)) {
            // Очищаем пулю перед возвратом в пул
            delete bullet.color;
            delete bullet.ricochet;
            delete bullet.autoTargeted;
            delete bullet.originalVx;
            delete bullet.originalVy;
            // Возвращаем пулю в пул при выходе за границы если доступен
            if (performanceOptimizer) {
                performanceOptimizer.returnToPool('crabBullets', bullet);
            }
            return false;
        }
        return true;
    });
    
    // 🛡️ RICOCHET: Проверяем коллизии отраженных пуль с врагами
    if (window.boostManager && window.boostManager.isBoostActive('RICOCHET')) {
        const invadersToRemove = [];
        
        for (let i = invaderBullets.length - 1; i >= 0; i--) {
            const bullet = invaderBullets[i];
            if (bullet.ricochet) {
                let bulletHit = false;
                
                for (let j = 0; j < invaders.length && !bulletHit; j++) {
                    if (invaders[j].alive &&
                        broadPhaseCollisionCheck(bullet, invaders[j]) &&
                        fastCollisionCheck(bullet, invaders[j])) {
                        
                        bulletHit = true;
                        
                        let crabColor = getCrabColor(invaders[j].type);
                        createExplosion(invaders[j].x + invaders[j].width/2,
                                      invaders[j].y + invaders[j].height/2, crabColor);

                        createRipple(invaders[j].x + invaders[j].width/2,
                                   invaders[j].y + invaders[j].height/2);

                        // Получаем очки для логирования
                        const points = getInvaderScore(invaders[j].row);
                        
                        // Уничтожение врага через новую систему бонусов (как обычные пули)
                        if (window.destroyInvader) {
                            window.destroyInvader(invaders[j], j);
                        } else {
                            // Откат к старой системе
                            score += points;
                            window.score = score; // Синхронизируем с глобальной переменной

                            // Проверяем скоровые триггеры для easter egg'ов
                            if (window.easterEggManager) {
                                window.easterEggManager.onScoreUpdate(score);
                            }
                        }
                        
                        // Убиваем врага
                        invaders[j].alive = false;
                        invaders[j].destroyed = true;
                        invadersToRemove.push(j);
                        
                        // Очищаем и удаляем отраженную пулю
                        delete bullet.color;
                        delete bullet.ricochet;
                        if (performanceOptimizer) {
                            performanceOptimizer.returnToPool('crabBullets', bullet);
                        }
                        invaderBullets.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        // Синхронизируем счет
        if (invadersToRemove.length > 0 && window.syncScore) {
            window.syncScore(score);
        }
    }
    
    // 🚀 Обновляем пространственную сетку для оптимизации коллизий
    if (performanceOptimizer && (bullets.length > 10 || invaderBullets.length > 10)) {
        const allObjects = [...bullets, ...invaderBullets, ...invaders.filter(inv => inv.alive), player];
        performanceOptimizer.updateSpatialGrid(allObjects);
    }
}

// Экспортируем для системы бонусов
window.updateBullets = updateBullets;

// Update crabs
function updateInvaders(deltaTime) {
    let shouldDrop = false;
    let aliveInvaders = invaders.filter(inv => inv.alive);

    const killMultiplier = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_KILL_MULTIPLIER)
        ? GAME_CONFIG.CRAB_SPEED_KILL_MULTIPLIER
        : 0.00125;

    const totalInvaders = invaderRows * invaderCols;
    const speedMultiplier = 1 + (totalInvaders - aliveInvaders.length) * killMultiplier;

    const crabSpeedModifier = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED)
        ? GAME_CONFIG.CRAB_SPEED / 100
        : 1;

    // Получаем множитель от SPEED_TAMER
    let speedTamerMultiplier = 1;
    if (window.boostManager && window.boostManager.speedTamerStacks > 0 && window.BOOST_CONSTANTS) {
        const reduction = window.boostManager.speedTamerStacks * window.BOOST_CONSTANTS.EFFECTS.SPEED_TAMER.reduction;
        speedTamerMultiplier = Math.max(0.1, 1 - reduction); // Минимум 10% скорости
        // SPEED_TAMER applied
    }
    
    const currentSpeed = invaderSpeed * speedMultiplier * gameSpeed * crabSpeedModifier * speedTamerMultiplier * deltaTime;

    for (let invader of aliveInvaders) {
        if ((invader.x <= 0 && invaderDirection === -1) ||
            (invader.x >= (canvas ? canvas.width : 800) - invader.width && invaderDirection === 1)) {
            shouldDrop = true;
            break;
        }
    }

    if (shouldDrop) {
        invaderDirection *= -1;
        window.invaderDirection = invaderDirection; // Обновляем глобальную переменную
        for (let invader of invaders) {
            if (invader.alive) {
                invader.y += invaderDropDistance;
            }
        }
    }

    // Используем новую функцию движения врагов для интеграции с бонусами
    moveInvaders();
    
    // Создание пуль остаётся отдельно
    for (let invader of invaders) {
        if (invader.alive) {
            createInvaderBullet(invader);
        }
    }

    for (let invader of aliveInvaders) {
        if (invader.y + invader.height >= player.y) {
            gameState = 'gameOver';
            break;
        }
    }
}

// Update particles and effects
function updateParticles(deltaTime) {
    particles = particles.filter(particle => {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vy += 0.2 * deltaTime;
        particle.life -= deltaTime;
        return particle.life > 0;
    });

    ripples = ripples.filter(ripple => {
        ripple.size = (ripple.maxSize * (30 - ripple.life)) / 30;
        ripple.life -= deltaTime;
        return ripple.life > 0;
    });

    // Обновляем эффекты лечения
    healEffects = healEffects.filter(effect => {
        effect.wobbleTime += deltaTime;
        effect.life -= deltaTime;
        
        // Движение вверх
        effect.y = effect.startY - (effect.maxLife - effect.life) * 2; // 2 пикселя за кадр вверх
        
        // Покачивание по горизонтали
        effect.x += Math.sin(effect.wobbleTime * 0.01) * 0.5;
        
        // Затухание альфы к концу
        effect.alpha = Math.max(0, effect.life / effect.maxLife);
        
        return effect.life > 0;
    });
}

// Check collisions
function checkCollisions() {
    // 🔥 НОВАЯ СИСТЕМА БОСОВ V2
    if (bossActive && bossSystemV2) {
        const bossCollision = bossSystemV2.checkCollisionWithPlayerBullets(bullets);

        // Удаляем пули, которые попали в босса
        for (let i = bossCollision.bulletsToRemove.length - 1; i >= 0; i--) {
            bullets.splice(bossCollision.bulletsToRemove[i], 1);
        }

        // Проверяем, убит ли босс
        if (bossCollision.result.killed) {
            score += bossCollision.result.score;
            window.score = score; // Синхронизируем с глобальной переменной

            // Проверяем скоровые триггеры для easter egg'ов
            if (window.easterEggManager) {
                window.easterEggManager.onScoreUpdate(score);
            }
            
            // Восстанавливаем HP игрока
            if (bossCollision.result.healAmount) {
                const oldLives = lives;
                lives = Math.min(lives + bossCollision.result.healAmount, MAX_LIVES);
                
                // Создаем визуальный эффект лечения на месте босса
                const boss = bossSystemV2.getCurrentBoss();
                if (boss) {
                    const centerX = boss.x + boss.width / 2;
                    const centerY = boss.y + boss.height / 2;
                    createHealEffect(centerX, centerY, bossCollision.result.healAmount);
                }
                
            }
            
            // 🎁 100% дроп Random Chaos при убийстве босса
            const boss = bossSystemV2.getCurrentBoss();
            if (boss && window.createSpecificBoost) {
                const centerX = boss.x + boss.width / 2;
                const centerY = boss.y + boss.height / 2;
                window.createSpecificBoost(centerX, centerY, 'RANDOM_CHAOS');
            }

            bossActive = false;

            // Уведомляем easterEggManager о победе над боссом
            if (window.easterEggManager) {
                window.easterEggManager.onBossDefeated();
            }

            // 🎵 Возвращаемся к игровой музыке после победы над боссом с кроссфейдом (только если музыка включена)
            if (window.soundManager && !window.tournamentMode && !tournamentMode && soundManager.musicEnabled) {
                soundManager.playMusic('gameplay', true, true);
            }
            // В турнирном режиме музыка не меняется
        }

        // Проверяем коллизии пуль босса с игроком
        const playerHit = bossSystemV2.checkCollisionWithPlayer(player);
        if (playerHit) {
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#6666ff', true);
            // Используем новую систему получения урона
            if (damagePlayer(1)) {
                return; // Игрок умер
            }
        }
    }

    if (!bossActive) {
        const bulletsToRemove = [];
        const invadersToRemove = [];
        
        for (let i = 0; i < bullets.length; i++) {
            let bulletHit = false;
            
            for (let j = 0; j < invaders.length && (!bulletHit || bullets[i].piercing); j++) {
                if (invaders[j].alive &&
                    broadPhaseCollisionCheck(bullets[i], invaders[j]) &&
                    fastCollisionCheck(bullets[i], invaders[j])) {
                    
                    if (!bullets[i].piercing) {
                        bulletHit = true; // Обычная пуля уничтожается после первого попадания
                    }

                    let crabColor = getCrabColor(invaders[j].type);
                    createExplosion(invaders[j].x + invaders[j].width/2,
                                  invaders[j].y + invaders[j].height/2, crabColor);

                    createRipple(invaders[j].x + invaders[j].width/2,
                               invaders[j].y + invaders[j].height/2);

                    // Получаем очки для логирования
                    const points = getInvaderScore(invaders[j].row);
                    
                    // Уничтожение врага через новую систему бонусов
                    if (window.destroyInvader) {
                        window.destroyInvader(invaders[j], j);
                    } else {
                        // Откат к старой системе
                        score += points;
                        window.score = score; // Синхронизируем с глобальной переменной

                        // Проверяем скоровые триггеры для easter egg'ов
                        if (window.easterEggManager) {
                            window.easterEggManager.onScoreUpdate(score);
                        }
                        
                        // Шанс выпадения бонуса
                        if (window.tryCreateBoost) {
                            window.tryCreateBoost(
                                invaders[j].x + invaders[j].width / 2,
                                invaders[j].y + invaders[j].height / 2
                            );
                        }
                    }
                    
                    invaders[j].alive = false;
                    
                    // Пробивающие пули не удаляются при попадании
                    if (!bullets[i].piercing) {
                        bulletsToRemove.push(i);
                    }
                    invadersToRemove.push(j);

                    logGameEvent('crab_killed', {
                        crabType: invaders[j].type,
                        points: points,
                        position: {x: invaders[j].x, y: invaders[j].y}
                    });
                }
            }
        }
        
        // Remove bullets and invaders in reverse order to maintain indices
        bulletsToRemove.sort((a, b) => b - a);
        for (let i of bulletsToRemove) {
            // 🚀 Возвращаем пули в object pool если доступен
            const bullet = bullets[i];
            // Очищаем флаги перед возвратом в пул
            delete bullet.autoTargeted;
            delete bullet.originalVx;
            delete bullet.originalVy;
            if (performanceOptimizer) {
                performanceOptimizer.returnToPool('playerBullets', bullet);
            }
            bullets.splice(i, 1);
        }
    }

    if (!bossActive) {
        for (let i = invaderBullets.length - 1; i >= 0; i--) {
            if (invaderBullets[i].x < player.x + player.width &&
                invaderBullets[i].x + invaderBullets[i].width > player.x &&
                invaderBullets[i].y < player.y + player.height &&
                invaderBullets[i].y + invaderBullets[i].height > player.y) {

                createExplosion(player.x + player.width/2, player.y + player.height/2, '#6666ff', true);
                // 🚀 Возвращаем пулю краба в object pool если доступен
                const bullet = invaderBullets[i];
                if (performanceOptimizer) {
                    performanceOptimizer.returnToPool('crabBullets', bullet);
                }
                invaderBullets.splice(i, 1);
                
                // Используем новую систему получения урона
                damagePlayer(1);
            }
        }
    }
}

// Get crab color
function getCrabColor(type) {
    switch(type) {
        case 'violet': return '#9966ff';
        case 'red': return '#ff3333';
        case 'yellow': return '#ffdd33';
        case 'blue': return '#3366ff';
        case 'green': return '#33cc66';
        default: return '#cc3333';
    }
}

// Draw player
function drawPlayer() {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    if (octopusImageLoaded && octopusImage.complete) {
        setPlayerShadow(ctx);
        const imageSize = 70;
        
        // ⭐ Радужное свечение для Invincibility
        if (window.boostManager && window.boostManager.isBoostActive('INVINCIBILITY')) {
            const time = Date.now() * 0.01; // Увеличена скорость смены цветов в 2 раза
            const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#0000ff', '#8800ff'];
            const colorIndex = Math.floor(time) % colors.length;
            const glowIntensity = 0.6 + 0.4 * Math.sin(time * 3);
            
            ctx.save();
            
            // Создаем градиентную ауру для размытых границ
            const gradient = ctx.createRadialGradient(centerX, centerY, imageSize/4, centerX, centerY, imageSize/2 + 15);
            gradient.addColorStop(0, colors[colorIndex] + '80'); // 50% прозрачность в центре
            gradient.addColorStop(0.7, colors[colorIndex] + '40'); // 25% прозрачность в середине
            gradient.addColorStop(1, colors[colorIndex] + '00'); // Полностью прозрачный по краям
            
            ctx.fillStyle = gradient;
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 2);
            
            // Рисуем размытую ауру
            ctx.beginPath();
            ctx.arc(centerX, centerY, imageSize/2 + 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // Создаем радужные искры (минимальное количество)
            if (Math.random() < 0.05) { // Было 0.2, стало 0.05 - в 4 раза меньше
                const sparkleColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#0000ff', '#8800ff', '#ffffff'];
                const sparkleColor = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
                
                if (window.boostEffects) {
                    window.boostEffects.createParticle({
                        x: centerX + (Math.random() - 0.5) * imageSize,
                        y: centerY + (Math.random() - 0.5) * imageSize,
                        color: sparkleColor,
                        size: 2 + Math.random() * 3,
                        life: 800 + Math.random() * 400,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3
                    });
                }
            }
        }
        
        ctx.drawImage(octopusImage, centerX - imageSize/2, centerY - imageSize/2, imageSize, imageSize);
        clearShadow(ctx);

        // 🛡️ Отображаем щит только когда активен Shield Barrier
        if (window.boostManager && window.boostManager.isBoostActive('SHIELD_BARRIER')) {
            const boost = window.boostManager.getActiveBoost('SHIELD_BARRIER');
            const hitsBlocked = boost ? boost.hitsBlocked : 0;
            const maxHits = BOOST_CONSTANTS.EFFECTS.SHIELD_BARRIER.hits;
            
            // Цвет щита зависит от оставшихся блоков
            let shieldColor = '#00ddff';  // Полный щит
            if (hitsBlocked >= maxHits - 1) {
                shieldColor = '#ff4444';  // Критическое состояние (красный)
            } else if (hitsBlocked >= maxHits - 2) {
                shieldColor = '#ffaa44';  // Средний урон (оранжевый)
            }
            
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            // Добавим пульсацию щита
            const pulseAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
            ctx.fillStyle = shieldColor;
            ctx.globalAlpha = pulseAlpha;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

    } else {
        ctx.fillStyle = '#00ddff';
        ctx.font = '50px Arial';
        ctx.fillText('🐙', player.x, player.y + 40);
    }
}

// Draw crabs
function drawInvaders() {
    // 🚀 Используем batch rendering для группировки крабов по типу  
    // Временно отключен для диагностики проблемы с изображениями
    if (false && performanceOptimizer && invaders.length > 1) {
        const aliveInvaders = invaders.filter(inv => inv.alive).map(invader => ({
            ...invader,
            active: true, // Помечаем как активный для batch renderer
            imageKey: invader.type,
            centerX: invader.x + invader.width / 2,
            centerY: invader.y + invader.height / 2,
            bobbing: Math.sin(invader.animFrame) * 2
        }));
        
        const imageMap = new Map();
        Object.keys(crabImages).forEach(type => {
            if (crabImagesLoaded[type]) {
                imageMap.set(type, crabImages[type]);
            }
        });
        
        if (performanceOptimizer) {
            performanceOptimizer.renderBatch(ctx, aliveInvaders, imageMap);
        }
    } else {
        // Обычная отрисовка для малого количества крабов
        for (let invader of invaders) {
            if (invader.alive) {
                const centerX = invader.x + invader.width / 2;
                const centerY = invader.y + invader.height / 2;
                const bobbing = Math.sin(invader.animFrame) * 2;

                if (crabImagesLoaded[invader.type] && crabImages[invader.type].complete) {
                    setCrabShadow(ctx, getCrabColor(invader.type));
                    const imageSize = 40;
                    ctx.drawImage(crabImages[invader.type], centerX - imageSize/2,
                                 centerY - imageSize/2 + bobbing, imageSize, imageSize);

                } else {
                    // Отладочная информация для диагностики загрузки изображений
                    if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.DEBUG_MODE) {
                        console.warn('Image not loaded for crab type:', invader.type, 
                                  'loaded:', crabImagesLoaded[invader.type], 
                                  'complete:', crabImages[invader.type]?.complete);
                    }
                    ctx.font = '25px Arial';
                    ctx.fillText('🦀', invader.x, invader.y + 20 + bobbing);
                }
            }
        }
        
        // Clear shadows after rendering all invaders
        clearShadow(ctx);
    }
}

// Draw bullets
function drawBullets() {
    for (let bullet of bullets) {
        ctx.strokeStyle = 'rgba(102, 102, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < bullet.trail.length - 1; i++) {
            const alpha = i / bullet.trail.length;
            ctx.globalAlpha = alpha * 0.8;
            if (i < bullet.trail.length - 1) {
                ctx.moveTo(bullet.trail[i].x, bullet.trail[i].y);
                ctx.lineTo(bullet.trail[i + 1].x, bullet.trail[i + 1].y);
            }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Используем цвет пули если указан, иначе стандартный голубой
        const bulletColor = bullet.color || '#6666ff';
        const bulletLightColor = bullet.color ? bullet.color : '#aaaaff';
        
        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bulletLightColor;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    for (let bullet of invaderBullets) {
        // Используем bullet.color если есть, иначе стандартный красный
        const bulletColor = bullet.color || '#ff4444';
        let bulletFillColor;
        if (bullet.color === '#0088ff') {
            bulletFillColor = 'rgba(0, 136, 255, 0.3)'; // Синий с прозрачностью
        } else {
            bulletFillColor = 'rgba(255, 68, 68, 0.3)'; // Красный с прозрачностью
        }
        
        ctx.strokeStyle = bulletColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = bulletFillColor;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2 - 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw particles
function drawParticles() {
    for (let particle of particles) {
        let alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Draw ripples
function drawRipples() {
    for (let ripple of ripples) {
        ctx.strokeStyle = `rgba(0, 221, 255, ${ripple.life / 30})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.size, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawHealEffects() {
    ctx.save();
    for (let effect of healEffects) {
        ctx.globalAlpha = effect.alpha;
        ctx.fillStyle = '#0099ff'; // Синий цвет
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Обводка для лучшей читаемости
        ctx.strokeText(effect.text, effect.x, effect.y);
        ctx.fillText(effect.text, effect.x, effect.y);
    }
    ctx.restore();
}

// Draw UI overlays
function drawUI() {
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ddff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press P to continue', canvas.width/2, canvas.height/2 + 50);
    }
    
    // Отображаем сообщение о завершении уровня
    if (levelTransitionActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff88';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText(`Preparing Level ${level + 1}...`, canvas.width/2, canvas.height/2 + 50);
    }
}

// Main game loop
function gameLoop(currentTime) {
    if (lastTime === 0) lastTime = currentTime;
    const rawDeltaTime = currentTime - lastTime;
    lastTime = currentTime;

    deltaTime = rawDeltaTime / frameTime;
    if (deltaTime > 3) deltaTime = 3;
    
    // Синхронизируем deltaTime с window объектом
    window.deltaTime = deltaTime;

    // 🚀 Обновляем мониторинг производительности
    if (performanceMonitor) {
        performanceMonitor.updateFPS(currentTime);
        performanceMonitor.updateMemory(performanceOptimizer);
        performanceMonitor.updateDisplay(currentTime);
    }

    if (gameState === 'playing') {
        updatePlayer(deltaTime);
        updateBullets(deltaTime);
        updateInvaders(deltaTime);
        updateParticles(deltaTime);

        // 🔥 ОБНОВЛЕНИЕ НОВОЙ СИСТЕМЫ БОСОВ V2
        if (bossActive && bossSystemV2) {
            bossSystemV2.update(deltaTime);
        }
        
        // ⭐ ОБНОВЛЕНИЕ СИСТЕМЫ БОНУСОВ
        if (window.boostManager) {
            window.boostManager.update(deltaTime);
        }
        if (window.boostEffects) {
            window.boostEffects.update(deltaTime);
        }

        checkCollisions();

        let aliveInvaders = invaders.filter(inv => inv.alive);
        // Проверяем что можно начать следующий уровень (нет падающих бонусов)
        const canStartNextLevel = !window.boostManager || window.boostManager.canStartNextLevel();
        
        if (aliveInvaders.length === 0 && !bossActive && !levelTransitionActive && canStartNextLevel) {
            levelTransitionActive = true;
            
            // Задержка 2 секунды перед появлением врагов следующего уровня
            createSafeTimeout(() => {
                const nextLevel = level + 1;

                // 🎵 Определяем нужную музыку для следующего уровня
                const shouldPlayBossMusic = bossSystemV2 && bossSystemV2.isBossLevel(nextLevel);
                const targetMusic = shouldPlayBossMusic ? 'boss' : 'gameplay';

                // Плавный переход музыки при смене уровня (кроме турнирного режима, только если музыка включена)
                if (window.soundManager && !window.tournamentMode && !tournamentMode && soundManager.musicEnabled) {
                    soundManager.playMusic(targetMusic, true, true);
                }
                // В турнирном режиме музыка не меняется
                
                // Очищаем бонусы для нового уровня
                if (window.boostManager) {
                    window.boostManager.clearForNewLevel();
                }

                const gameSpeedIncrease = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE)
                    ? GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE
                    : 0.07;

                const invaderSpeedIncrease = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE)
                    ? GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE
                    : 0.25;

                gameSpeed += gameSpeedIncrease;
                invaderSpeed += invaderSpeedIncrease;

                // 🔥 СОЗДАНИЕ БОСА С НОВОЙ СИСТЕМОЙ V2
                if (bossSystemV2 && bossSystemV2.isBossLevel(nextLevel)) {
                    level = nextLevel;
                    initLevelScoring(); // инициализируем систему очков для босс уровня

                    const boss = bossSystemV2.createBoss(level);
                    if (boss) {
                        bossActive = true;
                        // Музыка босса уже была переключена на переходе уровня
                    } else {
                        Logger.error('Cannot create boss: initialization failed');
                        // Fallback: создаем обычный уровень
                        createInvaders();
                        level = nextLevel;
                    }
                } else {
                    level = nextLevel;
                    initLevelScoring(); // инициализируем систему очков для обычного уровня
                    createInvaders();
                }
                
                levelTransitionActive = false;
            }, 2000); // 2 секунды задержки
        }

        updateUI();

        if (gameState === 'gameOver') {
            showGameOver();
            return;
        }
    }

    // Clear and draw
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawPlayer();
        drawInvaders();
        drawBullets();
        drawParticles();
        drawRipples();
        drawHealEffects();
        
        // 🌀 Рендеринг эффектов бонусов
        if (window.boostEffects) {
            window.boostEffects.renderGravityWellEffect(ctx);
            window.boostEffects.renderPointsFreezeEffect(ctx);
            window.boostEffects.renderIceFreezeEffect(ctx);
            window.boostEffects.renderRicochetShield(ctx, player);
        }
        
        // ⭐ Рендеринг системы бонусов
        if (window.boostManager) {
            window.boostManager.render(ctx);
        }

        // 🔥 РЕНДЕРИНГ НОВОЙ СИСТЕМЫ БОСОВ V2
        if (bossActive && bossSystemV2) {
            bossSystemV2.render(ctx);
        }

        // ⭐ РЕНДЕРИНГ СИСТЕМЫ БОНУСОВ
        if (window.boostManager) {
            window.boostManager.render(ctx);
            window.boostManager.updateBoostPanel(); // Обновляем HTML панель
        }
        if (window.boostEffects) {
            window.boostEffects.render(ctx);
        }

        drawUI();
    }

    if (gameState === 'playing') {
        requestAnimationFrame(gameLoop);
    }
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');

    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (levelEl) levelEl.textContent = level;

    // 🔧 ДОБАВЬТЕ: Синхронизируем переменные с window
    window.score = score;
    window.level = level;
    window.lives = lives;
    window.bullets = bullets;
    window.invaders = invaders;
}

// 🏆 ТУРНИРНЫЕ ФУНКЦИИ

function updateTournamentUI() {
    const uiEl = document.querySelector('.ui');
    if (uiEl && tournamentMode && tournamentData) {
        uiEl.innerHTML += `
            <div style="margin-top: 10px; padding: 8px; background: rgba(255, 215, 0, 0.2); border-radius: 5px;">
                🏆 Tournament Mode<br>
                Attempt: ${tournamentData.attempt}/${tournamentData.maxAttempts}
            </div>
        `;
    }
}

async function submitTournamentScore() {
    if (!tournamentMode || !tournamentData) {
        alert('Not in tournament mode');
        return;
    }

    const playerName = prompt('Enter your name (1-20 characters):');
    if (!playerName) return;

    try {
        showLoading('Submitting tournament score...');

        if (!window.tournamentManager) {
            alert('Please include tournament-manager.js in your HTML');
            hideLoading();
            return;
        }

        await tournamentManager.connect(walletConnector);

        const txHash = await tournamentManager.submitTournamentScore(
            tournamentData.tournamentId,
            score,
            playerName
        );

        hideLoading();

        alert(`✅ Score submitted successfully!\nTransaction: ${txHash.slice(0, 10)}...`);

        localStorage.removeItem('tournamentMode');
        window.location.href = 'tournament-lobby.html';

    } catch (error) {
        hideLoading();
        Logger.error('Failed to submit score:', error);
        alert('Failed to submit score: ' + error.message);
    }
}

function backToTournamentLobby() {
    window.location.href = 'tournament-lobby.html';
}

// ОСНОВНЫЕ ФУНКЦИИ ИГРЫ

async function startGame() {
    try {
        // Starting game
        
        // Ensuring canvas is initialized
        initCanvas(); // initCanvas сам проверяет состояние canvas
        // Canvas initialized

        // 🏆 ТУРНИРНЫЙ РЕЖИМ - пропускаем оплату и модальные окна
        // Синхронизируем переменные турнирного режима
        tournamentMode = window.tournamentMode || tournamentMode;
        tournamentData = window.tournamentData || tournamentData;
        if (tournamentMode || window.tournamentMode) {
            hasPaidFee = true;
            currentGameSession = `tournament_${tournamentData?.tournamentId}_${tournamentData?.attempt}`;

            logGameEvent('game_started', {
                tournamentMode: tournamentMode || window.tournamentMode,
                timestamp: Date.now()
            });

            actuallyStartGame();
            return;
        }

        // Для обычной игры проверяем wallet connector
        if (!window.walletConnector) {
            alert('Wallet connector not found. Please refresh the page.');
            return;
        }

        if (!walletConnector.connected) {
            window.pendingGameStart = true;
            walletConnector.showWalletModal();
            return;
        }

        hasPaidFee = false;
        scoreAlreadySaved = false;
        currentGameSession = null;

        // Проверяем, существует ли функция showGameStartModal
        if (typeof walletConnector.showGameStartModal === 'function') {
            const shouldPayFee = await walletConnector.showGameStartModal();

            if (shouldPayFee) {
                // Деактивируем кнопку START BATTLE во время обработки платежа
                const startButtons = document.querySelectorAll('button[onclick="startGame()"]');
                startButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                });
                
                showLoading('Processing payment...');
                await walletConnector.payGameFee();
                hasPaidFee = true;
                currentGameSession = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                hideLoading();
                
                // Активируем кнопку обратно
                startButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });
            } else {
            }
        } else {
            // Если функция не существует, просто запускаем игру без оплаты
            hasPaidFee = false;
        }

        actuallyStartGame();

    } catch (error) {
        hideLoading();
        
        // Активируем кнопку обратно в случае ошибки
        const startButtons = document.querySelectorAll('button[onclick="startGame()"]');
        startButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        
        console.error('Full error details:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        Logger.error('Error starting game:', error);
        alert('Error: ' + error.message + '\nCheck console for details');
    }
}

function actuallyStartGame() {
    // Actually starting game

    // 🎵 Запускаем игровую музыку (кроме турнирного режима, только если музыка включена)
    if (window.soundManager && !window.tournamentMode && !tournamentMode && soundManager.musicEnabled) {
        soundManager.stopMusic(true); // Останавливаем музыку меню с fade out
        setTimeout(() => {
            soundManager.playMusic('gameplay', true, false); // Запускаем игровую музыку с fade in (без кроссфейда при старте)
        }, 500);
    }
    // В турнирном режиме продолжаем играть музыку лобби

    gameState = 'playing';
    score = 0;
    window.score = score; // Синхронизируем с глобальной переменной
    level = 1;
    window.level = level; // Синхронизируем уровень
    gameSpeed = 1;
    window.gameSpeed = gameSpeed; // Синхронизируем скорость игры

    // ⭐ ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ БОНУСОВ
    try {
        // Starting boost system initialization
        if (window.clearAllBoosts) {
            // Clearing all boosts
            window.clearAllBoosts();
        }
        
        // Инициализируем систему бонусов
        if (window.boostIntegration && !window.boostIntegration.initialized) {
            // Initializing boost integration
            window.boostIntegration.initialize();
        }
        // Boost system initialization completed
    } catch (boostError) {
        console.error('❌ Error in boost system initialization:', boostError);
        throw boostError;
    }
    
    // Убеждаемся что все системы бонусов доступны
    if (window.boostManager) {
        // Boost Manager ready
    } else {
        console.error('❌ Boost Manager not available');
    }
    
    if (window.boostEffects) {
        // Boost Effects ready  
    } else {
        console.error('❌ Boost Effects not available');
    }

    // 🚀 Инициализация оптимизатора производительности
    if (!performanceOptimizer && typeof PerformanceOptimizer !== 'undefined') {
        performanceOptimizer = new PerformanceOptimizer();
    }
    
    // 🚀 Инициализация монитора производительности  
    if (!performanceMonitor && typeof getPerformanceMonitor !== 'undefined') {
        performanceMonitor = getPerformanceMonitor();
        // Включаем монитор только в debug режиме
        if (GAME_CONFIG && GAME_CONFIG.DEBUG_MODE) {
            performanceMonitor.enable();
        }
    }

    // ПОЛНЫЙ СБРОС ВСЕХ ПАРАМЕТРОВ СКОРОСТИ К БАЗОВЫМ ЗНАЧЕНИЯМ
    // Сбрасываем базовую скорость врагов
    invaderSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_BASE) 
        ? GAME_CONFIG.CRAB_SPEED_BASE 
        : 1;
    window.invaderSpeed = invaderSpeed;
    
    // 🏆 ТУРНИРНЫЙ РЕЖИМ: Принудительно устанавливаем скорости как в обычной игре
    if (tournamentMode) {
        // Полностью сбрасываем все переменные скорости и уровня
        gameSpeed = 1;
        invaderSpeed = 1; 
        level = 1;
        
        // Очищаем любые сохраненные данные о скорости
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('gameSpeed');
            localStorage.removeItem('invaderSpeed');
            localStorage.removeItem('level');
        }
        
        // Принудительно синхронизируем ВСЕ глобальные переменные
        window.gameSpeed = 1;
        window.invaderSpeed = 1;
        window.level = 1;
        
        // Сбрасываем любые модификаторы скорости из game-config.js
        if (typeof GAME_CONFIG !== 'undefined') {
            // Игнорируем любые настройки повышенной скорости в турнире
            GAME_CONFIG.CRAB_SPEED = 100; // 100% = нормальная скорость
            GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE = 0; // Временно отключаем прогрессию
            GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE = 0; // Временно отключаем прогрессию
        }
        
        // Tournament mode: FORCED reset all speeds to base values
    }
    window.shotCooldown = shotCooldown; // Синхронизируем кулдаун стрельбы

    lives = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_LIVES)
        ? GAME_CONFIG.PLAYER_LIVES
        : 5;

    bossActive = false;
    levelTransitionActive = false;
    
    // 🔥 ОЧИЩЕНИЕ НОВОЙ СИСТЕМЫ БОСОВ V2
    if (bossSystemV2) {
        bossSystemV2.clearBoss();
    }

    // 🚀 Используем object pooling вместо создания новых массивов
    bullets = [];
    invaderBullets = [];
    particles = [];
    ripples = [];
    healEffects = [];

    // Загружаем настройки игрока если доступен
    if (performanceOptimizer) {
        const playerSettings = performanceOptimizer.loadPlayerSettings();
        if (playerSettings.playerName) {
            const playerNameEl = document.getElementById('playerName');
            if (playerNameEl) {
                playerNameEl.value = playerSettings.playerName;
            }
        }
    }

    player.x = (canvas ? canvas.width : 800) / 2 - 30;
    player.y = (canvas ? canvas.height : 600) - 80;

    // 🔧 ДОБАВЬТЕ ЭТОТ КОД ЗДЕСЬ:
    // Экспортируем переменные и canvas в window для турнирного режима
    window.canvas = canvas;
    window.ctx = ctx;
    window.score = score;
    window.level = level;
    window.lives = lives;
    window.bullets = bullets;
    window.invaders = invaders;

    // 🔥 ЭКСПОРТ CANVAS ДЛЯ НОВОЙ СИСТЕМЫ БОСОВ V2 - уже не нужно, система получает canvas автоматически

    initLevelScoring(); // инициализируем систему очков для первого уровня
    createInvaders();

    // Обновим window.invaders после создания крабов
    window.invaders = invaders;

    const startScreen = document.getElementById('startScreen');
    const gameOver = document.getElementById('gameOver');

    if (startScreen) startScreen.style.display = 'none';
    if (gameOver) gameOver.style.display = 'none';

    document.body.classList.remove('game-over-active');

    gameLoop(performance.now());
}

function showGameOver() {
    document.body.classList.add('game-over-active');

    // 🎵 Переключаемся на музыку меню при проигрыше (только если музыка включена)
    if (window.soundManager && !window.tournamentMode && !tournamentMode && soundManager.musicEnabled) {
        soundManager.stopMusic(true); // Останавливаем игровую музыку с fade out
        setTimeout(() => {
            soundManager.playMusic('menu', true, false); // Запускаем музыку меню
        }, 500);
    }
    // В турнирном режиме музыка не меняется

    // Останавливаем систему Toasty!
    if (typeof toastySystem !== 'undefined') {
        toastySystem.destroy();
    }

    // Останавливаем систему Sailor!
    if (typeof sailorSystem !== 'undefined') {
        sailorSystem.destroy();
    }

    // Останавливаем менеджер easter egg'ов!
    if (typeof easterEggManager !== 'undefined') {
        easterEggManager.destroy();
    }

    // 🚀 Сохраняем статистику игрока и обновляем рекорд если доступен
    if (performanceOptimizer) {
        const playerSettings = performanceOptimizer.loadPlayerSettings();
        playerSettings.gamesPlayed = (playerSettings.gamesPlayed || 0) + 1;
        
        if (score > (playerSettings.highScore || 0)) {
            playerSettings.highScore = score;
        }
        
        // Сохраняем имя игрока если введено
        const playerNameEl = document.getElementById('playerName');
        if (playerNameEl && playerNameEl.value && playerNameEl.value.trim()) {
            playerSettings.playerName = playerNameEl.value.trim();
        }
        
        performanceOptimizer.savePlayerSettings(playerSettings);
        
        // Выводим статистику производительности в консоль (только в debug режиме)
        if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG && GAME_CONFIG.DEBUG_MODE) {
            // Performance stats available
        }
    }

    const finalScoreEl = document.getElementById('finalScore');
    const gameOverEl = document.getElementById('gameOver');
    const blockchainSection = document.getElementById('blockchainSection');

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameOverEl) gameOverEl.style.display = 'block';

    // 🏆 ТУРНИРНЫЙ РЕЖИМ
    if (tournamentMode) {
        if (blockchainSection) {
            blockchainSection.innerHTML = `
                <h3>🏆 Tournament Score: ${score}</h3>
                <p>This score will be submitted to the tournament.</p>
                <button onclick="submitTournamentScore()" style="margin: 15px;">Submit Score</button>
                <button onclick="backToTournamentLobby()" style="margin: 15px;">Back to Lobby</button>
            `;
            blockchainSection.style.display = 'block';
        }
        return;
    }

    // 🔓 ОФЛАЙН ИЛИ БЛОКЧЕЙН РЕЖИМ
    if (hasPaidFee && currentGameSession) {
        if (blockchainSection) {
            blockchainSection.style.display = 'block';

            const saveButton = document.getElementById('saveScoreButton');
            const playerName = document.getElementById('playerName');
            const saveStatus = document.getElementById('save-status');

            if (saveButton) {
                saveButton.style.display = 'inline-block';
                // Меняем текст кнопки для офлайн режима
                if (currentGameSession.startsWith('offline_')) {
                    saveButton.textContent = 'Save Score Offline';
                    saveButton.onclick = () => {
                        const name = document.getElementById('playerName').value.trim();
                        if (name) saveScoreOffline(name, score);
                        else alert('Please enter your name');
                    };
                } else {
                    saveButton.textContent = 'Save Score to Blockchain';
                    saveButton.onclick = saveScoreToBlockchain;
                }
            }
            if (playerName) {
                playerName.style.display = 'block';
                // Даем фокус полю ввода для корректной работы клавиатуры
                setTimeout(() => {
                    playerName.focus();
                }, 100);

                // Предотвращаем срабатывание игровых клавиш при вводе текста
                playerName.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                });
                playerName.addEventListener('keyup', (e) => {
                    e.stopPropagation();
                });
                playerName.value = '';
            }
            if (saveStatus) saveStatus.innerHTML = '';
        }
    } else {
        if (blockchainSection) blockchainSection.style.display = 'none';
    }
}

function restartGame() {
    document.body.classList.remove('game-over-active');

    // Останавливаем систему Toasty!
    if (typeof toastySystem !== 'undefined') {
        toastySystem.destroy();
    }

    // Останавливаем систему Sailor!
    if (typeof sailorSystem !== 'undefined') {
        sailorSystem.destroy();
    }

    // Останавливаем менеджер easter egg'ов!
    if (typeof easterEggManager !== 'undefined') {
        easterEggManager.destroy();
    }

    // ⭐ ОЧИСТКА СИСТЕМЫ БОНУСОВ
    if (window.clearAllBoosts) {
        window.clearAllBoosts();
    }

    // 🚀 Очищаем пулы объектов для предотвращения утечек памяти если доступен
    if (performanceOptimizer) {
        // Возвращаем все активные объекты в пулы
        bullets.forEach(bullet => performanceOptimizer.returnToPool('playerBullets', bullet));
        invaderBullets.forEach(bullet => performanceOptimizer.returnToPool('crabBullets', bullet));
    }
    bullets.length = 0;
    invaderBullets.length = 0;

    const gameOverEl = document.getElementById('gameOver');
    const startScreenEl = document.getElementById('startScreen');

    if (gameOverEl) gameOverEl.style.display = 'none';
    if (startScreenEl) startScreenEl.style.display = 'block';

    gameState = 'start';
    scoreAlreadySaved = false;

    // Переинициализируем систему Toasty!
    if (typeof toastySystem !== 'undefined') {
        toastySystem.init();
    }

    // Переинициализируем систему Sailor!
    if (typeof sailorSystem !== 'undefined') {
        sailorSystem.init();
    }

    // Переинициализируем менеджер easter egg'ов!
    if (typeof easterEggManager !== 'undefined') {
        easterEggManager.init();
    }

    // 🎵 Возвращаемся к музыке меню при перезапуске (только если музыка включена)
    if (window.soundManager && !window.tournamentMode && !tournamentMode && soundManager.musicEnabled) {
        soundManager.stopMusic(true); // Останавливаем текущую музыку с fade out
        setTimeout(() => {
            soundManager.playMusic('menu', true, false); // Запускаем музыку меню
        }, 500);
    }
    // В турнирном режиме музыка не меняется

    logGameEvent('game_restarted', {
        tournamentMode: tournamentMode,
        timestamp: Date.now()
    });
}

async function saveScoreToBlockchain() {
    const playerNameEl = document.getElementById('playerName');
    const playerName = playerNameEl ? playerNameEl.value.trim() : '';

    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    if (!window.walletConnector || !walletConnector.connected) {
        alert('Wallet not connected');
        return;
    }

    if (!hasPaidFee || !currentGameSession) {
        alert('Game fee was not paid for this session.');
        return;
    }

    if (scoreAlreadySaved) {
        alert('You have already saved your score for this game session!');
        return;
    }

    // 🔐 ПРОВЕРКА ПОДОЗРИТЕЛЬНЫХ СЧЕТОВ
    const maxTheoreticalScore = calculateMaxScore();
    if (score > maxTheoreticalScore) {
        Logger.warn(`Suspicious score detected: ${score} > ${maxTheoreticalScore}`);
        alert('Score validation failed. Please contact support if this is an error.');
        return;
    }

    try {
        showLoading('Saving score to blockchain...');

        const txHash = await walletConnector.saveScore(score, playerName);

        hideLoading();
        scoreAlreadySaved = true;

        const saveButton = document.getElementById('saveScoreButton');
        if (saveButton) saveButton.style.display = 'none';
        if (playerNameEl) playerNameEl.style.display = 'none';

        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.innerHTML = `
                <div style="background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 12px; text-align: center;">
                    <h4 style="margin-bottom: 10px; color: #00ff88; font-size: 14px;">Transaction Hash:</h4>
                    <div style="font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all;">${txHash}</div>
                </div>
            `;
        }

    } catch (error) {
        hideLoading();
        Logger.error('Save score error:', error);
        alert('Failed to save score: ' + error.message);
    }
}

// Utility functions
function showLoading(message) {
    const loading = document.createElement('div');
    loading.id = 'loading-indicator';
    loading.className = 'loading-indicator';
    loading.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading && loading.parentNode) {
        loading.parentNode.removeChild(loading);
    }
}


// 🔓 ФУНКЦИЯ ЗАПУСКА ОФЛАЙН ИГРЫ
async function startOfflineGame() {
    try {
        initCanvas();

        hasPaidFee = true;
        currentGameSession = `offline_${Date.now()}`;

        logGameEvent('game_started', {
            offlineMode: true,
            timestamp: Date.now()
        });

        actuallyStartGame();
    } catch (error) {
        Logger.error('❌ Error starting offline game:', error);
        alert('Error starting offline game. Please try again.');
    }
}

// 🔓 ФУНКЦИЯ СОХРАНЕНИЯ ОЧКОВ В ОФЛАЙН РЕЖИМЕ
function saveScoreOffline(playerName, playerScore) {
    try {
        const scoreData = {
            name: playerName,
            score: playerScore,
            level: level,
            timestamp: Date.now(),
            session: currentGameSession
        };

        const existingScores = JSON.parse(localStorage.getItem('pharosInvadersScores') || '[]');
        existingScores.push(scoreData);
        existingScores.sort((a, b) => b.score - a.score);
        const topScores = existingScores.slice(0, 100);
        localStorage.setItem('pharosInvadersScores', JSON.stringify(topScores));

        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.innerHTML = `
                <div style="color: #00ff88; margin-top: 15px;">
                    ✅ Score saved offline! (${playerScore} points)
                    <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                        Saved to local storage as ${playerName}
                    </div>
                </div>
            `;
        }

        scoreAlreadySaved = true;
        const saveButton = document.getElementById('saveScoreButton');
        if (saveButton) saveButton.style.display = 'none';

    } catch (error) {
        Logger.error('❌ Error saving score offline:', error);
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.innerHTML = '<div style="color: #ff6666; margin-top: 15px;">❌ Error saving score offline</div>';
        }
    }
}

// 🔊 ЗВУКОВЫЕ ФУНКЦИИ
function playButtonSound() {
    if (window.soundManager) {
        soundManager.playSound('buttonClick', 0.5);
    }
}

// Экспорт функций
window.startGame = startGame;
window.startOfflineGame = startOfflineGame;
window.playButtonSound = playButtonSound;
window.restartGame = restartGame;
window.saveScoreToBlockchain = saveScoreToBlockchain;
window.saveScoreOffline = saveScoreOffline;
window.submitTournamentScore = submitTournamentScore;
window.backToTournamentLobby = backToTournamentLobby;
window.calculateMaxScore = calculateMaxScore;
window.logGameEvent = logGameEvent;
window.updateTournamentUI = updateTournamentUI;
window.actuallyStartGame = actuallyStartGame;

// Экспорт игровых переменных в window для турнирного режима
window.score = score;
window.level = level;
window.lives = lives;
window.MAX_LIVES = MAX_LIVES;
window.bullets = bullets;
window.invaders = invaders;
window.canvas = canvas;
window.ctx = ctx;

// 🔥 ИНИЦИАЛИЗАЦИЯ НОВОЙ СИСТЕМЫ БОСОВ V2
let bossSystemV2 = null;

// Инициализация при загрузке страницы
window.addEventListener('load', async () => {

    initCanvas();

    // 🎵 Инициализируем звуковую систему
    if (window.soundManager) {
        await soundManager.preloadSounds();
        // Запускаем нужную музыку в зависимости от режима (только если музыка включена)
        if (soundManager.musicEnabled) {
            if (window.tournamentMode || tournamentMode) {
                soundManager.playMusic('tournamentLobby', true);
            } else {
                soundManager.playMusic('menu', true);
            }
        }
    }

    // Инициализируем новую систему босов V2
    if (window.BossSystemV2) {
        bossSystemV2 = new BossSystemV2();
        window.bossSystemV2 = bossSystemV2; // Экспортируем для внешнего доступа
    }

    // 🥞 Инициализируем Toasty систему
    toastySystem.init();

    // 🚢 Инициализируем Sailor систему
    sailorSystem.init();

    // 🎲 Инициализируем менеджер случайных easter egg'ов
    easterEggManager.init();

    // Экспортируем easterEggManager для внешнего доступа
    window.easterEggManager = easterEggManager;

    // LEGACY: Старая система босов (закомментирована)
    /*
    if (window.BOSS_SYSTEM) {
        window.BOSS_SYSTEM.initBossSystem();
    }
    */

    // 🏆 Проверяем турнирный режим
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tournament') === 'true') {
        const savedTournamentData = localStorage.getItem('tournamentMode');
        if (savedTournamentData) {
            tournamentMode = true;
            tournamentData = JSON.parse(savedTournamentData);

            updateTournamentUI();
        }
    }

    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        if (tournamentMode && tournamentData) {
            const h1 = startScreen.querySelector('h1');
            const p = startScreen.querySelector('p');
            if (h1) h1.innerHTML = '🏆 TOURNAMENT GAME 🏆';
            if (p) p.innerHTML = `Attempt ${tournamentData.attempt} of ${tournamentData.maxAttempts}`;
        }
        startScreen.style.display = 'block';
    }

    createBubbles();

    createSafeTimeout(() => {
        if (window.walletConnector) {
        } else {
        }
    }, GAME_CONSTANTS.TIMEOUTS.TOURNAMENT_CHECK);
});

// Game cleanup function for proper shutdown
function stopGame() {
    gameState = 'end';
    clearAllGameTimers();
    
    // Clear any game loops if they exist
    if (window.gameInterval) {
        clearInterval(window.gameInterval);
        window.gameInterval = null;
    }
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
    }
    
    // Export for external access
    window.stopGame = stopGame;
}

// Export timer management functions for external use
window.createSafeInterval = createSafeInterval;
window.createSafeTimeout = createSafeTimeout;
window.clearAllGameTimers = clearAllGameTimers;
window.stopGame = stopGame;

