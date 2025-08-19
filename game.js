// game.js - CLEAN FIXED version

console.log('🎮 Loading game.js...');

// Game variables
let gameState = 'start';
let score = 0;
let lives = 5;
let level = 1;
let gameSpeed = 1;
let hasPaidFee = false;
let scoreAlreadySaved = false;
let currentGameSession = null;

// Canvas and game objects
let canvas, ctx, player;

// Initialize canvas when DOM is ready
function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        player = {
            x: 400,
            y: 550,
            width: 60,
            height: 60
        };
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

// Simple drawing function
function drawGame() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple player (octopus)
    ctx.fillStyle = '#00ddff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw octopus emoji as placeholder
    ctx.font = '40px Arial';
    ctx.fillText('🐙', player.x + 10, player.y + 35);
    
    // Draw some crabs as targets
    ctx.font = '30px Arial';
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            ctx.fillText('🦀', 100 + i * 120, 80 + j * 80);
        }
    }
    
    // Simple game text
    ctx.fillStyle = '#00ddff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 GAME RUNNING! 🎮', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press SPACE to test controls', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Use ← → arrows to move octopus', canvas.width / 2, canvas.height / 2 + 80);
}

// Start game function - MAIN FUNCTION
async function startGame() {
    try {
        console.log('🚀 START GAME CALLED!');
        
        // Initialize canvas if not done
        if (!canvas) {
            initCanvas();
        }
        
        // Check if wallet connector exists
        if (!window.walletConnector) {
            console.log('❌ No wallet connector');
            alert('Wallet connector not found. Please refresh the page.');
            return;
        }
        
        console.log('✅ Wallet connector found');
        
        // Check if wallet is connected
        if (!walletConnector.connected) {
            console.log('💼 Wallet not connected, showing modal...');
            window.pendingGameStart = true;
            walletConnector.showWalletModal();
            return;
        }
        
        console.log('✅ Wallet connected, starting game...');
        
        // Reset game variables
        hasPaidFee = false;
        scoreAlreadySaved = false;
        currentGameSession = null;
        
        // Show payment modal
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
        
        // Actually start the game
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
    
    // Reset game state
    gameState = 'playing';
    score = 0;
    lives = 5;
    level = 1;
    
    // Hide screens
    const startScreen = document.getElementById('startScreen');
    const gameOver = document.getElementById('gameOver');
    
    if (startScreen) startScreen.style.display = 'none';
    if (gameOver) gameOver.style.display = 'none';
    
    document.body.classList.remove('game-over-active');
    
    // Start game loop
    gameLoop();
    console.log('✅ Game started successfully!');
    
    // Auto-end game after 10 seconds for demo
    setTimeout(() => {
        if (gameState === 'playing') {
            endGame();
        }
    }, 10000);
}

// Simple game loop
function gameLoop() {
    if (gameState === 'playing') {
        drawGame();
        updateUI();
        requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameOver') {
        showGameOver();
    }
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (levelEl) levelEl.textContent = level;
    
    // Increase score gradually for demo
    score += 10;
}

function endGame() {
    score = Math.floor(Math.random() * 5000) + 1000; // Random final score
    gameState = 'gameOver';
    showGameOver();
}

function showGameOver() {
    document.body.classList.add('game-over-active');
    
    const finalScoreEl = document.getElementById('finalScore');
    const gameOverEl = document.getElementById('gameOver');
    const blockchainSection = document.getElementById('blockchainSection');
    
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameOverEl) gameOverEl.style.display = 'block';
    
    if (window.walletConnector && walletConnector.connected && hasPaidFee && currentGameSession) {
        if (blockchainSection) blockchainSection.style.display = 'block';
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
        
        // Hide save form
        const saveButton = document.getElementById('saveScoreButton');
        if (saveButton) saveButton.style.display = 'none';
        if (playerNameEl) playerNameEl.style.display = 'none';
        
        // Show transaction hash
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

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!player) return;
    
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        console.log('🚀 SPACE pressed - shooting!');
    }
    
    if (e.code === 'ArrowLeft' && gameState === 'playing') {
        player.x = Math.max(0, player.x - 20);
        console.log('⬅️ Moving left');
    }
    
    if (e.code === 'ArrowRight' && gameState === 'playing') {
        player.x = Math.min(canvas.width - player.width, player.x + 20);
        console.log('➡️ Moving right');
    }
});

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
    console.log('🎮 Game loaded and ready!');
    
    // Initialize canvas
    initCanvas();
    
    // Show start screen
    const startScreen = document.getElementById('startScreen');
    if (startScreen) startScreen.style.display = 'block';
    
    // Create bubbles effect
    createBubbles();
    
    // Wait a bit for wallet connector
    setTimeout(() => {
        if (window.walletConnector) {
            console.log('✅ WalletConnector ready:', walletConnector.connected);
        } else {
            console.log('❌ WalletConnector not found');
        }
    }, 1000);
});

console.log('✅ game.js loaded successfully!');
