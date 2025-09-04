// game.js - FULL GAME RESTORED WITH CONFIG SPEED SETTINGS + TOURNAMENT MODE + PERFORMANCE OPTIMIZATIONS

// Logger.log('Loading full game.js...'); // Removed - Logger not available yet

// 🏆 ТУРНИРНЫЙ РЕЖИМ - добавлено в начало
let tournamentMode = false;
let tournamentData = null;

// 🚀 PERFORMANCE OPTIMIZER - добавлено для оптимизации
let performanceOptimizer = null;
let performanceMonitor = null;

// Game variables
let gameState = 'start';
let score = 0;
let lives = 5;
let level = 1;
let gameSpeed = 1;
let hasPaidFee = false;
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

// НОВАЯ ПЕРЕМЕННАЯ: состояние босса
let bossActive = false;

// ПЕРЕМЕННАЯ ДЛЯ ЗАДЕРЖКИ МЕЖДУ УРОВНЯМИ
let levelTransitionActive = false;

// FPS variables
let lastTime = 0;
const targetFPS = GAME_CONSTANTS.TARGET_FPS;
const frameTime = GAME_CONSTANTS.FRAME_TIME;
let deltaTime = 0;

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

// Canvas and game objects
let canvas, ctx;

// Game objects
const player = {
    x: 370,
    y: 520,
    width: 60,
    height: 60,
    speed: 6
};

let bullets = [];
let invaders = [];
let invaderBullets = [];
let particles = [];
let ripples = [];

// Game settings - теперь используем значения из конфига
const invaderRows = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.INVADERS_ROWS) ? GAME_CONFIG.INVADERS_ROWS : 5;
const invaderCols = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.INVADERS_COLS) ? GAME_CONFIG.INVADERS_COLS : 10;
const invaderWidth = 35;
const invaderHeight = 30;
let invaderSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_BASE) ? GAME_CONFIG.CRAB_SPEED_BASE : 1;
let invaderDirection = 1;
let invaderDropDistance = 25;

// Controls
const keys = {};
let lastShotTime = 0;
const shotCooldown = 300;

// 🔐 ФУНКЦИЯ РАСЧЕТА МАКСИМАЛЬНО ВОЗМОЖНОГО СЧЕТА
// Фиксированные максимальные значения для каждого уровня (без буферов)
function calculateMaxScore() {
    const maxScores = {
        1: 3000,
        2: 6000,
        3: 16000,    // boss 1
        4: 19000,
        5: 22000,
        6: 42000,    // boss 2
        7: 45000,
        8: 48000,
        9: 78000,    // boss 3
        10: 81000,
        11: 84000,
        12: 124000,  // boss 4
        13: 127000,
        14: 130000,
        15: 180000   // boss 5
    };
    
    return maxScores[level] || 180000;
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
                animFrame: 0,
                clawOffset: Math.random() * Math.PI * 2
            });
        }
    }
}

// Create player bullet
function createBullet() {
    const now = Date.now();
    const adjustedCooldown = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_FIRE_RATE)
        ? shotCooldown * (100 / GAME_CONFIG.PLAYER_FIRE_RATE)
        : shotCooldown;

    if (now - lastShotTime > adjustedCooldown) {
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
                vy: -bulletSpeed
            });
        } else {
            bullet = {
                x: player.x + player.width / 2 - 3,
                y: player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: [],
                vy: -bulletSpeed
            };
        }
        if (bullet) {
            bullets.push(bullet);
        }
        lastShotTime = now;
        createRipple(player.x + player.width / 2, player.y);
    }
}

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
                vy: bulletSpeed
            });
        } else {
            bullet = {
                x: invader.x + invader.width / 2 - 4,
                y: invader.y + invader.height,
                width: 8,
                height: 8,
                speed: bulletSpeed,
                wobble: 0,
                vy: bulletSpeed
            };
        }
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

// Update player
function updatePlayer(deltaTime) {
    const playerSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_SPEED)
        ? player.speed * (GAME_CONFIG.PLAYER_SPEED / 100)
        : player.speed;
    const moveSpeed = playerSpeed * deltaTime;

    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= moveSpeed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
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
        bullet.y -= bullet.speed * deltaTime;
        bullet.trail.push({x: bullet.x + bullet.width/2, y: bullet.y + bullet.height});
        if (bullet.trail.length > 8) bullet.trail.shift();
        
        if (bullet.y <= -bullet.height) {
            // Возвращаем пулю в пул при выходе за границы если доступен
            if (performanceOptimizer) {
                performanceOptimizer.returnToPool('playerBullets', bullet);
            }
            return false;
        }
        return true;
    });

    // 🚀 Обновляем пули крабов с возвратом в object pool
    invaderBullets = invaderBullets.filter(bullet => {
        bullet.y += bullet.speed * deltaTime;
        bullet.wobble += 0.2 * deltaTime;
        bullet.x += Math.sin(bullet.wobble) * 0.5 * deltaTime;
        
        if (bullet.y >= canvas.height) {
            // Возвращаем пулю в пул при выходе за границы если доступен
            if (performanceOptimizer) {
                performanceOptimizer.returnToPool('crabBullets', bullet);
            }
            return false;
        }
        return true;
    });
    
    // 🚀 Обновляем пространственную сетку для оптимизации коллизий
    if (performanceOptimizer && (bullets.length > 10 || invaderBullets.length > 10)) {
        const allObjects = [...bullets, ...invaderBullets, ...invaders.filter(inv => inv.alive), player];
        performanceOptimizer.updateSpatialGrid(allObjects);
    }
}

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

    const currentSpeed = invaderSpeed * speedMultiplier * gameSpeed * crabSpeedModifier * deltaTime;

    for (let invader of aliveInvaders) {
        if ((invader.x <= 0 && invaderDirection === -1) ||
            (invader.x >= canvas.width - invader.width && invaderDirection === 1)) {
            shouldDrop = true;
            break;
        }
    }

    if (shouldDrop) {
        invaderDirection *= -1;
        for (let invader of invaders) {
            if (invader.alive) {
                invader.y += invaderDropDistance;
            }
        }
    }

    for (let invader of invaders) {
        if (invader.alive) {
            invader.x += currentSpeed * invaderDirection;
            invader.animFrame += 0.08 * deltaTime;
            invader.clawOffset += 0.12 * deltaTime;
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
}

// Check collisions
function checkCollisions() {
    if (bossActive && window.BOSS_SYSTEM) {
        const bossCollision = window.BOSS_SYSTEM.checkBossCollisions(bullets);

        for (let i = bossCollision.bulletsToRemove.length - 1; i >= 0; i--) {
            bullets.splice(bossCollision.bulletsToRemove[i], 1);
        }

        if (bossCollision.bossKilled) {
            score += bossCollision.scoreGained;
            bossActive = false;
        }

        const playerHit = window.BOSS_SYSTEM.checkBossBulletsCollision(player);
        if (playerHit) {
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#6666ff', true);
            lives--;

            if (lives <= 0) {
                gameState = 'gameOver';
                return;
            }
        }
    }

    if (!bossActive) {
        const bulletsToRemove = [];
        const invadersToRemove = [];
        
        for (let i = 0; i < bullets.length; i++) {
            let bulletHit = false;
            
            for (let j = 0; j < invaders.length && !bulletHit; j++) {
                if (invaders[j].alive &&
                    broadPhaseCollisionCheck(bullets[i], invaders[j]) &&
                    fastCollisionCheck(bullets[i], invaders[j])) {
                    
                    bulletHit = true;

                    let crabColor = getCrabColor(invaders[j].type);
                    createExplosion(invaders[j].x + invaders[j].width/2,
                                  invaders[j].y + invaders[j].height/2, crabColor);

                    createRipple(invaders[j].x + invaders[j].width/2,
                               invaders[j].y + invaders[j].height/2);

                    let points = {
                        'violet': GAME_CONSTANTS.SCORING.VIOLET_CRAB,
                        'red': GAME_CONSTANTS.SCORING.RED_CRAB,
                        'yellow': GAME_CONSTANTS.SCORING.YELLOW_CRAB,
                        'blue': GAME_CONSTANTS.SCORING.BLUE_CRAB,
                        'green': GAME_CONSTANTS.SCORING.GREEN_CRAB
                    }[invaders[j].type];

                    if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.SCORE_MULTIPLIER) {
                        points = Math.round(points * (GAME_CONFIG.SCORE_MULTIPLIER / 100));
                    }

                    score += points;
                    invaders[j].alive = false;
                    bulletsToRemove.push(i);
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
                lives--;

                if (lives <= 0) {
                    gameState = 'gameOver';
                }
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
        ctx.drawImage(octopusImage, centerX - imageSize/2, centerY - imageSize/2, imageSize, imageSize);
        clearShadow(ctx);

        ctx.strokeStyle = '#00ddff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

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
                        console.log('Image not loaded for crab type:', invader.type, 
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

        ctx.fillStyle = '#6666ff';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#6666ff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#aaaaff';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    for (let bullet of invaderBullets) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
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

        if (bossActive && window.BOSS_SYSTEM) {
            window.BOSS_SYSTEM.updateBoss(deltaTime);
        }

        checkCollisions();

        let aliveInvaders = invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0 && !bossActive && !levelTransitionActive) {
            levelTransitionActive = true;
            
            // Задержка 2 секунды перед появлением врагов следующего уровня
            createSafeTimeout(() => {
                const nextLevel = level + 1;

                const gameSpeedIncrease = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE)
                    ? GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE
                    : 0.07;

                const invaderSpeedIncrease = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE)
                    ? GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE
                    : 0.25;

                gameSpeed += gameSpeedIncrease;
                invaderSpeed += invaderSpeedIncrease;

                if (window.BOSS_SYSTEM && typeof isBossLevel === 'function' && isBossLevel(nextLevel)) {
                    level = nextLevel;

                    if (!window.BOSS_SYSTEM.canvas && canvas) {
                        window.BOSS_SYSTEM.canvas = canvas;
                        window.BOSS_SYSTEM.ctx = ctx;
                    }

                    if (window.BOSS_SYSTEM.canvas) {
                        window.BOSS_SYSTEM.createBoss(level);
                        bossActive = true;
                    } else {
                        Logger.error('Cannot create boss: canvas not available');
                        // Fallback: создаем обычный уровень
                        createInvaders();
                        level = nextLevel;
                    }
                } else {
                    level = nextLevel;
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

        if (bossActive && window.BOSS_RENDERER) {
            window.BOSS_RENDERER.renderBossSystem(ctx);
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

        if (!canvas) {
            initCanvas();
        }

        // 🏆 ТУРНИРНЫЙ РЕЖИМ - пропускаем оплату и модальные окна
        if (tournamentMode) {
            hasPaidFee = true;
            currentGameSession = `tournament_${tournamentData.tournamentId}_${tournamentData.attempt}`;

            logGameEvent('game_started', {
                tournamentMode: tournamentMode,
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
                showLoading('Processing payment...');
                await walletConnector.payGameFee();
                hasPaidFee = true;
                currentGameSession = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                hideLoading();
            } else {
            }
        } else {
            // Если функция не существует, просто запускаем игру без оплаты
            hasPaidFee = false;
        }

        actuallyStartGame();

    } catch (error) {
        hideLoading();
        Logger.error('Error starting game:', error);
        alert('Error: ' + error.message);
    }
}

function actuallyStartGame() {

    gameState = 'playing';
    score = 0;
    level = 1;
    gameSpeed = 1;

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

    invaderSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_BASE)
        ? GAME_CONFIG.CRAB_SPEED_BASE
        : 1;

    lives = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_LIVES)
        ? GAME_CONFIG.PLAYER_LIVES
        : 5;

    bossActive = false;
    levelTransitionActive = false;
    if (window.BOSS_SYSTEM) {
        window.BOSS_SYSTEM.clearBossSystem();
    }

    // 🚀 Используем object pooling вместо создания новых массивов
    bullets = [];
    invaderBullets = [];
    particles = [];
    ripples = [];

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

    player.x = canvas.width / 2 - 30;
    player.y = canvas.height - 80;

    // 🔧 ДОБАВЬТЕ ЭТОТ КОД ЗДЕСЬ:
    // Экспортируем переменные и canvas в window для турнирного режима
    window.canvas = canvas;
    window.ctx = ctx;
    window.score = score;
    window.level = level;
    window.lives = lives;
    window.bullets = bullets;
    window.invaders = invaders;

    if (window.BOSS_SYSTEM && canvas) {
        window.BOSS_SYSTEM.canvas = canvas;
        window.BOSS_SYSTEM.ctx = ctx;
    }

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
            console.log('Performance Stats:', performanceOptimizer.getPerformanceStats());
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

    if (window.walletConnector && walletConnector.connected && hasPaidFee && currentGameSession) {
        if (blockchainSection) {
            blockchainSection.style.display = 'block';

            const saveButton = document.getElementById('saveScoreButton');
            const playerName = document.getElementById('playerName');
            const saveStatus = document.getElementById('save-status');

            if (saveButton) saveButton.style.display = 'inline-block';
            if (playerName) {
                playerName.style.display = 'block';
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
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading && loading.parentNode) {
        loading.parentNode.removeChild(loading);
    }
}

// Экспорт функций
window.startGame = startGame;
window.restartGame = restartGame;
window.saveScoreToBlockchain = saveScoreToBlockchain;
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
window.bullets = bullets;
window.invaders = invaders;
window.canvas = canvas;
window.ctx = ctx;

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    Logger.log('Full game loaded and ready!');

    initCanvas();

    if (window.BOSS_SYSTEM) {
        window.BOSS_SYSTEM.initBossSystem();
    }

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

Logger.log('Full game.js loaded successfully with tournament mode!');
Logger.log('Game variables exported to window');