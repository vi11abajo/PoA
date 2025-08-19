// game.js - FIXED version

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
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Simple player object
const player = {
    x: 400,
    y: 550,
    width: 60,
    height: 60
};

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
    if (!ctx) return;
    
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
    ctx.fillText('This is a demo - full game coming soon!', canvas.width / 2, canvas.height / 2 + 80);
}

// Start game function - MAIN FUNCTION
async function startGame() {
    try {
        console.log('🚀 START GAME CALLED!');
        
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
    gameSpeed = 1;
    
    // Hide screens
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.body.classList.remove('game-over-active');
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    console.log('✅ Game started successfully!');
}

// Simple game loop
function gameLoop() {
    if (gameState === 'playing') {
        // Draw the game
        drawGame();
        
        // Update UI
        updateUI();
        
        // Simple game logic - automatically end after 10 seconds for demo
        setTimeout(() => {
            if (gameState === 'playing') {
                score = Math.floor(Math.random() * 5000) + 1000; // Random score for demo
                lives = 0;
                gameState = 'gameOver';
            }
        }, 10000);
    }
    
    if (gameState === 'gameOver') {
        showGameOver();
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (levelEl) levelEl.textContent = level;
    
    // Increase score gradually for demo
    if (gameState === 'playing') {
        score += 10;
    }
}

function showGameOver() {
    document.body.classList.add('game-over-active');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    
    if (window.walletConnector && walletConnector.connected && hasPaidFee && currentGameSession) {
        document.getElementById('blockchainSection').style.display = 'block';
    } else {
        document.getElementById('blockchainSection').style.display = 'none';
    }
}

// Restart game
function restartGame() {
    document.body.classList.remove('game-over-active');
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    gameState = 'start';
    scoreAlreadySaved = false;
}

// Save score to blockchain
async function saveScoreToBlockchain() {
    const playerName = document.getElementById('playerName').value.trim();
    
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
        document.getElementById('saveScoreButton').style.display = 'none';
        document.getElementById('playerName').style.display = 'none';
        
        // Show transaction hash
        document.getElementById('save-status').innerHTML = `
            <div style="background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 12px; text-align: center;">
                <h4 style="margin-bottom: 10px; color: #00ff88; font-size: 14px;">Transaction Hash:</h4>
                <div style="font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all;">${txHash}</div>
            </div>
        `;
        
    } catch (error) {
        hideLoading();
        console.error('Save score error:', error);
        alert('Failed to save score: ' + error.message);
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        console.log('🚀 SPACE pressed - shooting!');
        // Add shooting logic here
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
    if (loading) {
        document.body.removeChild(loading);
    }
}

// Make functions globally available
window.startGame = startGame;
window.restartGame = restartGame;
window.saveScoreToBlockchain = saveScoreToBlockchain;

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('🎮 Game loaded and ready!');
    document.getElementById('startScreen').style.display = 'block';
    
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

console.log('✅ game.js loaded successfully!');// game.js - FIXED version

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

// Start game function - MAIN FUNCTION
async function startGame() {
    try {
        console.log('🚀 START GAME CALLED!');
        
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
    gameSpeed = 1;
    
    // Hide screens
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.body.classList.remove('game-over-active');
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    console.log('✅ Game started successfully!');
}

// Simple game loop
function gameLoop() {
    if (gameState === 'playing') {
        // Simple game logic here
        updateUI();
    }
    
    if (gameState === 'gameOver') {
        showGameOver();
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (levelEl) levelEl.textContent = level;
}

function showGameOver() {
    document.body.classList.add('game-over-active');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    
    if (window.walletConnector && walletConnector.connected && hasPaidFee && currentGameSession) {
        document.getElementById('blockchainSection').style.display = 'block';
    } else {
        document.getElementById('blockchainSection').style.display = 'none';
    }
}

// Restart game
function restartGame() {
    document.body.classList.remove('game-over-active');
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    gameState = 'start';
    scoreAlreadySaved = false;
}

// Save score to blockchain
async function saveScoreToBlockchain() {
    const playerName = document.getElementById('playerName').value.trim();
    
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
        document.getElementById('saveScoreButton').style.display = 'none';
        document.getElementById('playerName').style.display = 'none';
        
        // Show transaction hash
        document.getElementById('save-status').innerHTML = `
            <div style="background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 12px; text-align: center;">
                <h4 style="margin-bottom: 10px; color: #00ff88; font-size: 14px;">Transaction Hash:</h4>
                <div style="font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all;">${txHash}</div>
            </div>
        `;
        
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
    if (loading) {
        document.body.removeChild(loading);
    }
}

// Make functions globally available
window.startGame = startGame;
window.restartGame = restartGame;
window.saveScoreToBlockchain = saveScoreToBlockchain;

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('🎮 Game loaded and ready!');
    document.getElementById('startScreen').style.display = 'block';
});

console.log('✅ game.js loaded successfully!');
