// game.js - FULL GAME RESTORED WITH CONFIG SPEED SETTINGS

console.log('🎮 Loading full game.js...');

// Game variables
let gameState = 'start';
let score = 0;
let lives = 5;
let level = 1;
let gameSpeed = 1;
let hasPaidFee = false;
let scoreAlreadySaved = false;
let currentGameSession = null;

// FPS variables
let lastTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;
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
octopusImage.onload = () => { octopusImageLoaded = true; console.log('🐙 Octopus image loaded'); };
octopusImage.onerror = () => { octopusImageLoaded = false; console.log('❌ Octopus image failed'); };

crabImages.violet.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabViolet.png';
crabImages.red.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabRed.png';
crabImages.yellow.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabYellow.png';
crabImages.blue.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBlue.png';
crabImages.green.src = 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabGreen.png';

Object.keys(crabImages).forEach(color => {
    crabImages[color].onload = () => { 
        crabImagesLoaded[color] = true; 
        console.log(`🦀 ${color} crab loaded`);
    };
    crabImages[color].onerror = () => { 
        crabImagesLoaded[color] = false; 
        console.log(`❌ ${color} crab failed`);
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
let invaderSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_BASE) ? GAME_CONFIG.CRAB_SPEED_BASE : 1; // Используем настройку из конфига
let invaderDirection = 1;
let invaderDropDistance = 25;

// Controls
const keys = {};
let lastShotTime = 0;
const shotCooldown = 300;

// Initialize canvas
function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        console.log('✅ Canvas initialized');
    }
}

// Create bubbles effect
function createBubbles() {
    const bubblesContainer = document.querySelector('.bubbles');
    if (!bubblesContainer) return;
    
    setInterval(() => {
        if (Math.random() < 0.3) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.width = bubble.style.height = (Math.random() * 20 + 10) + 'px';
            bubble.style.animationDelay = Math.random() * 2 + 's';
            bubble.style.animationDuration = (Math.random() * 4 + 4) + 's';
            bubblesContainer.appendChild(bubble);
            
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.remove();
                }
            }, 8000);
        }
    }, 500);
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
    // Применяем настройку скорости стрельбы из конфига
    const adjustedCooldown = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_FIRE_RATE) 
        ? shotCooldown * (100 / GAME_CONFIG.PLAYER_FIRE_RATE) 
        : shotCooldown;
        
    if (now - lastShotTime > adjustedCooldown) {
        // Применяем настройку скорости пуль игрока
        const bulletSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_BULLET_SPEED) 
            ? 8 * (GAME_CONFIG.PLAYER_BULLET_SPEED / 100) 
            : 8;
            
        bullets.push({
            x: player.x + player.width / 2 - 3,
            y: player.y,
            width: 6,
            height: 15,
            speed: bulletSpeed,
            trail: []
        });
        lastShotTime = now;
        createRipple(player.x + player.width / 2, player.y);
    }
}

// Create crab bullet
function createInvaderBullet(invader) {
    // Применяем настройку частоты стрельбы крабов из конфига
    const baseFireRate = 0.0008 * level;
    const adjustedFireRate = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_FIRE_RATE) 
        ? baseFireRate * (GAME_CONFIG.CRAB_FIRE_RATE / 100) 
        : baseFireRate;
        
    if (Math.random() < adjustedFireRate) {
        // Применяем настройку скорости пуль крабов
        const bulletSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_BULLET_SPEED) 
            ? 2.5 * (GAME_CONFIG.CRAB_BULLET_SPEED / 100) 
            : 2.5;
            
        invaderBullets.push({
            x: invader.x + invader.width / 2 - 4,
            y: invader.y + invader.height,
            width: 8,
            height: 8,
            speed: bulletSpeed,
            wobble: 0
        });
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
    // Применяем настройку скорости игрока из конфига
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
    // Player bullets
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed * deltaTime;
        bullet.trail.push({x: bullet.x + bullet.width/2, y: bullet.y + bullet.height});
        if (bullet.trail.length > 8) bullet.trail.shift();
        return bullet.y > -bullet.height;
    });

    // Crab bullets
    invaderBullets = invaderBullets.filter(bullet => {
        bullet.y += bullet.speed * deltaTime;
        bullet.wobble += 0.2 * deltaTime;
        bullet.x += Math.sin(bullet.wobble) * 0.5 * deltaTime;
        return bullet.y < canvas.height;
    });
}

// Update crabs - ОБНОВЛЕНО С НОВЫМИ НАСТРОЙКАМИ СКОРОСТИ
function updateInvaders(deltaTime) {
    let shouldDrop = false;
    let aliveInvaders = invaders.filter(inv => inv.alive);

    // НОВАЯ ФОРМУЛА: используем настройки из конфига
    const killMultiplier = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_KILL_MULTIPLIER) 
        ? GAME_CONFIG.CRAB_SPEED_KILL_MULTIPLIER 
        : 0.00125; // Уменьшено в 20 раз с 0.025
    
    const totalInvaders = invaderRows * invaderCols;
    const speedMultiplier = 1 + (totalInvaders - aliveInvaders.length) * killMultiplier;
    
    // Применяем общий множитель скорости крабов из конфига
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
    // Player bullets vs crabs
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = invaders.length - 1; j >= 0; j--) {
            if (invaders[j].alive && 
                bullets[i].x < invaders[j].x + invaders[j].width &&
                bullets[i].x + bullets[i].width > invaders[j].x &&
                bullets[i].y < invaders[j].y + invaders[j].height &&
                bullets[i].y + bullets[i].height > invaders[j].y) {
                
                let crabColor = getCrabColor(invaders[j].type);
                createExplosion(invaders[j].x + invaders[j].width/2, 
                              invaders[j].y + invaders[j].height/2, crabColor);
                
                createRipple(invaders[j].x + invaders[j].width/2, 
                           invaders[j].y + invaders[j].height/2);
                
                let points = {
                    'violet': 100,
                    'red': 80,
                    'yellow': 60,
                    'blue': 40,
                    'green': 20
                }[invaders[j].type];
                
                // Применяем множитель очков из конфига
                if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.SCORE_MULTIPLIER) {
                    points = Math.round(points * (GAME_CONFIG.SCORE_MULTIPLIER / 100));
                }
                
                score += points;
                invaders[j].alive = false;
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Crab bullets vs player
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        if (invaderBullets[i].x < player.x + player.width &&
            invaderBullets[i].x + invaderBullets[i].width > player.x &&
            invaderBullets[i].y < player.y + player.height &&
            invaderBullets[i].y + invaderBullets[i].height > player.y) {
            
            createExplosion(player.x + player.width/2, player.y + player.height/2, 
                          '#6666ff', true);
            invaderBullets.splice(i, 1);
            lives--;
            
            if (lives <= 0) {
                gameState = 'gameOver';
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
        ctx.save();
        ctx.shadowColor = '#00ddff';
        ctx.shadowBlur = 15;
        
        const imageSize = 70;
        ctx.drawImage(
            octopusImage, 
            centerX - imageSize/2, 
            centerY - imageSize/2, 
            imageSize, 
            imageSize
        );
        
        ctx.restore();
        
        ctx.strokeStyle = '#00ddff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
    } else {
        // Fallback - draw simple octopus
        ctx.fillStyle = '#00ddff';
        ctx.font = '50px Arial';
        ctx.fillText('🐙', player.x, player.y + 40);
    }
}

// Draw crabs
function drawInvaders() {
    for (let invader of invaders) {
        if (invader.alive) {
            const centerX = invader.x + invader.width / 2;
            const centerY = invader.y + invader.height / 2;
            const bobbing = Math.sin(invader.animFrame) * 2;
            
            if (crabImagesLoaded[invader.type] && crabImages[invader.type].complete) {
                ctx.save();
                ctx.shadowColor = getCrabColor(invader.type);
                ctx.shadowBlur = 5;
                
                const imageSize = 40;
                ctx.drawImage(
                    crabImages[invader.type], 
                    centerX - imageSize/2, 
                    centerY - imageSize/2 + bobbing, 
                    imageSize, 
                    imageSize
                );
                
                ctx.restore();
                
            } else {
                // Fallback - draw emoji crab
                ctx.font = '25px Arial';
                ctx.fillText('🦀', invader.x, invader.y + 20 + bobbing);
            }
        }
    }
}

// Draw bullets
function drawBullets() {
    // Player bullets
    for (let bullet of bullets) {
        // Draw trail
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
        
        // Draw bullet
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

    // Crab bullets - RED COLOR
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
}

// Main game loop
function gameLoop(currentTime) {
    if (lastTime === 0) lastTime = currentTime;
    const rawDeltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    deltaTime = rawDeltaTime / frameTime;
    if (deltaTime > 3) deltaTime = 3;
    
    if (gameState === 'playing') {
        updatePlayer(deltaTime);
        updateBullets(deltaTime);
        updateInvaders(deltaTime);
        updateParticles(deltaTime);
        checkCollisions();

        let aliveInvaders = invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) {
            level++;
            
            // ОБНОВЛЕНО: используем настройки из конфига для прироста скорости
            const gameSpeedIncrease = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE) 
                ? GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE 
                : 0.07;
            
            const invaderSpeedIncrease = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE) 
                ? GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE 
                : 0.25; // Уменьшено с 0.5 до 0.25
            
            gameSpeed += gameSpeedIncrease;
            invaderSpeed += invaderSpeedIncrease;
            
            createInvaders();
            bullets = [];
            invaderBullets = [];
        }

        updateUI();
    }

    if (gameState === 'gameOver') {
        showGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawInvaders();
    drawBullets();
    drawParticles();
    drawRipples();
    drawUI();

    if (gameState === 'playing' || gameState === 'paused') {
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
}

// Start game function
async function startGame() {
    try {
        console.log('🚀 START GAME CALLED!');
        
        if (!canvas) {
            initCanvas();
        }
        
        if (!window.walletConnector) {
            console.log('❌ No wallet connector');
            alert('Wallet connector not found. Please refresh the page.');
            return;
        }
        
        console.log('✅ Wallet connector found');
        
        if (!walletConnector.connected) {
            console.log('💼 Wallet not connected, showing modal...');
            window.pendingGameStart = true;
            walletConnector.showWalletModal();
            return;
        }
        
        console.log('✅ Wallet connected, starting game...');
        
        hasPaidFee = false;
        scoreAlreadySaved = false;
        currentGameSession = null;
        
        const shouldPayFee = await walletConnector.showGameStartModal();
        
        if (shouldPayFee) {
            showLoading('Processing payment...');
            await walletConnector.payGameFee();
            hasPaidFee = true;
            currentGameSession = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            hideLoading();
            console.log('✅ Payment completed');
        } else {
            console.log('🎮 Playing offline');
        }
        
        actuallyStartGame();
        
    } catch (error) {
        hideLoading();
        console.error('❌ Error starting game:', error);
        alert('Error: ' + error.message);
    }
}

// Actually start the game
function actuallyStartGame() {
    console.log('🎮 Actually starting game...');
    
    gameState = 'playing';
    score = 0;
    level = 1;
    gameSpeed = 1;
    
    // ОБНОВЛЕНО: используем настройку базовой скорости из конфига
    invaderSpeed = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.CRAB_SPEED_BASE) 
        ? GAME_CONFIG.CRAB_SPEED_BASE 
        : 1;
    
    // ОБНОВЛЕНО: используем настройку жизней из конфига
    lives = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.PLAYER_LIVES) 
        ? GAME_CONFIG.PLAYER_LIVES 
        : 5;
    
    bullets = [];
    invaderBullets = [];
    particles = [];
    ripples = [];
    
    player.x = canvas.width / 2 - 30;
    player.y = canvas.height - 80;
    
    createInvaders();
    
    const startScreen = document.getElementById('startScreen');
    const gameOver = document.getElementById('gameOver');
    
    if (startScreen) startScreen.style.display = 'none';
    if (gameOver) gameOver.style.display = 'none';
    
    document.body.classList.remove('game-over-active');
    
    gameLoop(performance.now());
    console.log('✅ Game started successfully!');
}

function showGameOver() {
    document.body.classList.add('game-over-active');
    
    const finalScoreEl = document.getElementById('finalScore');
    const gameOverEl = document.getElementById('gameOver');
    const blockchainSection = document.getElementById('blockchainSection');
    
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameOverEl) gameOverEl.style.display = 'block';
    
    if (window.walletConnector && walletConnector.connected && hasPaidFee && currentGameSession) {
        if (blockchainSection) {
            blockchainSection.style.display = 'block';
            
            // Reset save form
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

// Restart game
function restartGame() {
    document.body.classList.remove('game-over-active');
    
    const gameOverEl = document.getElementById('gameOver');
    const startScreenEl = document.getElementById('startScreen');
    
    if (gameOverEl) gameOverEl.style.display = 'none';
    if (startScreenEl) startScreenEl.style.display = 'block';
    
    gameState = 'start';
    scoreAlreadySaved = false;
}

// Save score to blockchain
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
        console.error('Save score error:', error);
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

// Make functions globally available
window.startGame = startGame;
window.restartGame = restartGame;
window.saveScoreToBlockchain = saveScoreToBlockchain;

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('🎮 Full game loaded and ready!');
    
    initCanvas();
    
    const startScreen = document.getElementById('startScreen');
    if (startScreen) startScreen.style.display = 'block';
    
    createBubbles();
    
    setTimeout(() => {
        if (window.walletConnector) {
            console.log('✅ WalletConnector ready:', walletConnector.connected);
        } else {
            console.log('❌ WalletConnector not found');
        }
    }, 1000);
});

console.log('✅ Full game.js loaded successfully with config-based speed settings!');
