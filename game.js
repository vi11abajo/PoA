// Update bullets
function updateBullets(deltaTime) {
    const playerBulletSpeed = (8 * GAME_CONFIG.PLAYER_BULLET_SPEED * deltaTime) / 100;
    const crabBulletSpeed = (2.5 * GAME_CONFIG.CRAB_BULLET_SPEED * deltaTime) / 100;
    
    bullets = bullets.filter(bullet => {
        bullet.y -= playerBulletSpeed;
        bullet.trail.push({x: bullet.x + bullet.width/2, y: bullet.y + bullet.height});
        if (bullet.trail.length > 8) bullet.trail.shift();
        return bullet.y > -bullet.height;
    });

    const wobbleSpeed = (0.2 * GAME_CONFIG.ANIMATION_SPEED * deltaTime) / 100;
    invaderBullets = invaderBullets.filter(bullet => {
        bullet.y += crabBulletSpeed;
        bullet.wobble += wobbleSpeed;
        bullet.x += Math.sin(bullet.wobble) * 0.5 * deltaTime;
        return bullet.y < canvas.height;
    });
}

// Update crabs
function updateInvaders(deltaTime) {
    let shouldDrop = false;
    let aliveInvaders = invaders.filter(inv => inv.alive);

    const speedMultiplier = 1 + (50 - aliveInvaders.length) * 0.025;
    const difficultyMultiplier = (GAME_CONFIG.LEVEL_DIFFICULTY * GAME_CONFIG.CRAB_SPEED) / 10000;
    const currentSpeed = invaderSpeed * speedMultiplier * gameSpeed * deltaTime * difficultyMultiplier;

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

    const animSpeed = (GAME_CONFIG.ANIMATION_SPEED * deltaTime) / 100;
    for (let invader of invaders) {
        if (invader.alive) {
            invader.x += currentSpeed * invaderDirection;
            invader.animFrame += 0.08 * animSpeed;
            invader.clawOffset += 0.12 * animSpeed;
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
    const particleSpeed = deltaTime;
    
    particles = particles.filter(particle => {
        particle.x += particle.vx * particleSpeed;
        particle.y += particle.vy * particleSpeed;
        particle.vy += 0.2 * particleSpeed;
        particle.life -= particleSpeed;
        return particle.life > 0;
    });

    ripples = ripples.filter(ripple => {
        ripple.size = (ripple.maxSize * (30 - ripple.life)) / 30;
        ripple.life -= particleSpeed;
        return ripple.life > 0;
    });
}

// Check collisions
function checkCollisions() {
    // Ink bullets vs crabs
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bulletDestroyed = false;
        
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
                
                let basePoints = {
                    'violet': 100,
                    'red': 80,
                    'yellow': 60,
                    'blue': 40,
                    'green': 20
                }[invaders[j].type];
                
                let points = Math.round((basePoints * GAME_CONFIG.SCORE_MULTIPLIER) / 100);
                score += points;
                
                invaders[j].alive = false;
                
                if (!GAME_CONFIG.BULLET_PENETRATION) {
                    bullets.splice(i, 1);
                    bulletDestroyed = true;
                    break;
                }
            }
        }
        
        if (bulletDestroyed) break;
    }

    // Crab bubbles vs octopus
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        let bulletHit = false;
        
        if (invaderBullets[i].x < player.x + player.width &&
            invaderBullets[i].x + invaderBullets[i].width > player.x &&
            invaderBullets[i].y < player.y + player.height &&
            invaderBullets[i].y + invaderBullets[i].height > player.y) {
            
            bulletHit = true;
        }
        
        if (bulletHit && GAME_CONFIG.SHIELD_MODE && keys['Space']) {
            createExplosion(invaderBullets[i].x, invaderBullets[i].y, '#00ddff');
            invaderBullets.splice(i, 1);
        } else if (bulletHit) {
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

// Get crab color (fallback colors)
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

// Draw player with octopus image
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
        // Fallback octopus drawing
        const helmetGradient = ctx.createRadialGradient(centerX, centerY - 10, 0, centerX, centerY - 10, 25);
        helmetGradient.addColorStop(0, '#8899aa');
        helmetGradient.addColorStop(0.5, '#556677');
        helmetGradient.addColorStop(1, '#334455');
        ctx.fillStyle = helmetGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#445566';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        const visorGradient = ctx.createRadialGradient(centerX, centerY - 10, 0, centerX, centerY - 10, 20);
        visorGradient.addColorStop(0, '#66bbff');
        visorGradient.addColorStop(1, '#2288dd');
        ctx.fillStyle = visorGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 8, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#334455';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 8, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#667788';
        ctx.fillRect(centerX - 28, centerY - 15, 8, 12);
        ctx.fillRect(centerX + 20, centerY - 15, 8, 12);
        
        ctx.fillStyle = '#00dddd';
        ctx.fillRect(centerX - 26, centerY - 13, 4, 2);
        ctx.fillRect(centerX + 22, centerY - 13, 4, 2);
        ctx.fillRect(centerX - 26, centerY - 8, 4, 2);
        ctx.fillRect(centerX + 22, centerY - 8, 4, 2);
        
        ctx.fillStyle = '#556677';
        ctx.fillRect(centerX - 3, centerY - 35, 6, 10);
        ctx.fillStyle = '#00dddd';
        ctx.fillRect(centerX - 2, centerY - 34, 4, 2);
        ctx.fillRect(centerX - 2, centerY - 30, 4, 2);
        
        ctx.strokeStyle = '#00dddd';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#00dddd';
        ctx.shadowBlur = 8;
        
        // Draw tentacles
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY + 8);
        ctx.lineTo(centerX - 18, centerY + 25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 12, centerY + 8);
        ctx.lineTo(centerX + 18, centerY + 25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY + 5);
        ctx.lineTo(centerX - 28, centerY + 22);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 20, centerY + 5);
        ctx.lineTo(centerX + 28, centerY + 22);
        ctx.stroke();
        
        ctx.strokeStyle = '#66ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 8, centerY + 10);
        ctx.lineTo(centerX - 10, centerY + 28);
        ctx.moveTo(centerX + 8, centerY + 10);
        ctx.lineTo(centerX + 10, centerY + 28);
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - 6, centerY - 12, 4, 0, Math.PI * 2);
        ctx.arc(centerX + 6, centerY - 12, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0066bb';
        ctx.beginPath();
        ctx.arc(centerX - 6, centerY - 12, 2.5, 0, Math.PI * 2);
        ctx.arc(centerX + 6, centerY - 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 13, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 7, centerY - 13, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

// Draw crabs with images
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
                // Fallback crab drawing
                ctx.fillStyle = getCrabColor(invader.type);
                ctx.fillRect(invader.x + 5, invader.y + 8 + bobbing, invader.width - 10, invader.height - 16);
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY + bobbing, invader.width/2 - 5, invader.height/2 - 8, 0, 0, Math.PI * 2);
                ctx.fill();
                
                const clawOffset = Math.sin(invader.clawOffset) * 3;
                ctx.fillRect(invader.x - 3 + clawOffset, invader.y + 12 + bobbing, 8, 6);
                ctx.fillRect(invader.x + invader.width - 5 - clawOffset, invader.y + 12 + bobbing, 8, 6);
                
                ctx.strokeStyle = getCrabColor(invader.type);
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    const legX = invader.x + 6 + i * 4;
                    const legY = invader.y + invader.height - 4 + bobbing;
                    const legBend = Math.sin(invader.animFrame + i * 0.5) * 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(legX, legY);
                    ctx.lineTo(legX + legBend, legY + 8);
                    ctx.stroke();
                }
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(centerX - 4, invader.y + 6 + bobbing, 2, 0, Math.PI * 2);
                ctx.arc(centerX + 4, invader.y + 6 + bobbing, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(centerX - 4, invader.y + 6 + bobbing, 1, 0, Math.PI * 2);
                ctx.arc(centerX + 4, invader.y + 6 + bobbing, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Draw bullets and effects
function drawBullets() {
    // Ink bullets
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

    // Crab bubbles - RED COLOR
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

// Draw UI
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

// Main game loop with FPS independence
function gameLoop(currentTime) {
    if (lastTime === 0) lastTime = currentTime;
    const rawDeltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    deltaTime = rawDeltaTime / frameTime;
    if (deltaTime > 3) deltaTime = 3;
    
    fpsCounter++;
    fpsTime += rawDeltaTime;
    if (fpsTime >= 1000) {
        currentFPS = Math.round((fpsCounter * 1000) / fpsTime);
        fpsCounter = 0;
        fpsTime = 0;
    }
    
    if (gameState === 'playing') {
        updatePlayer(deltaTime);
        updateBullets(deltaTime);
        updateInvaders(deltaTime);
        updateParticles(deltaTime);
        checkCollisions();

        let aliveInvaders = invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) {
            level++;
            const waveSpeedIncrease = (GAME_CONFIG.WAVE_SPEED_INCREASE / 100);
            gameSpeed += waveSpeedIncrease;
            invaderSpeed += 0.5 * (GAME_CONFIG.CRAB_SPEED / 100);
            createInvaders();
            bullets = [];
            invaderBullets = [];
        }

        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const levelEl = document.getElementById('level');
        
        if (scoreEl) scoreEl.textContent = score;
        if (livesEl) livesEl.textContent = lives;
        if (levelEl) levelEl.textContent = level;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawInvaders();
    drawBullets();
    drawParticles();
    drawRipples();
    drawUI();

    if (gameState === 'gameOver') {
        document.body.classList.add('game-over-active');
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOver').style.display = 'block';
        
        if (window.walletConnector && walletConnector.connected && hasPaidFee && currentGameSession) {
            document.getElementById('blockchainSection').style.display = 'block';
            
            document.getElementById('save-status').innerHTML = '';
            document.getElementById('playerName').value = '';
            document.getElementById('playerName').style.display = 'block';
            document.getElementById('saveScoreButton').style.display = 'inline-block';
            
            const h3Element = document.querySelector('#blockchainSection h3');
            const pElement = document.querySelector('#blockchainSection p');
            if (h3Element) h3Element.style.display = 'block';
            if (pElement) pElement.style.display = 'block';
            
            loadLeaderboard();
        } else {
            document.getElementById('blockchainSection').style.display = 'none';
        }
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Start game function
async function startGame() {
    try {
        console.log('🎮 Starting game...');
        
        if (!window.walletConnector) {
            console.log('❌ WalletConnector not found');
            alert('Wallet connector not found. Please refresh the page.');
            return;
        }
        
        if (!walletConnector.isInitialized) {
            console.log('⏳ Waiting for wallet initialization...');
            let attempts = 0;
            while (!walletConnector.isInitialized && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!walletConnector.isInitialized) {
                alert('Wallet initialization timeout. Please refresh the page.');
                return;
            }
        }
        
        hasPaidFee = false;
        scoreAlreadySaved = false;
        currentGameSession = null;
        
        if (!walletConnector.connected) {
            console.log('💼 Wallet not connected, showing modal...');
            window.pendingGameStart = true;
            walletConnector.showWalletModal();
            return;
        }
        
        console.log('💰 Wallet connected, showing payment modal...');
        const shouldPayFee = await walletConnector.showGameStartModal();
        
        if (shouldPayFee) {
            showLoading('Processing payment...');
            await walletConnector.payGameFee();
            hasPaidFee = true;
            currentGameSession = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            hideLoading();
            console.log('✅ Payment completed');
        } else {
            hasPaidFee = false;
            currentGameSession = null;
            console.log('🎮 Playing offline');
        }
        
        actuallyStartGame();
        
    } catch (error) {
        hideLoading();
        console.error('❌ Error starting game:', error);
        alert('Error starting game: ' + error.message);
    }
}

// Actually start the game
function actuallyStartGame() {
    document.body.classList.remove('game-over-active');
    
    gameState = 'playing';
    score = 0;
    lives = GAME_CONFIG.PLAYER_LIVES;
    level = 1;
    gameSpeed = 1;
    invaderSpeed = 1;
    
    bullets = [];
    invaderBullets = [];
    particles = [];
    ripples = [];
    
    player.x = canvas.width / 2 - 30;
    player.y = canvas.height - 80;
    
    createInvaders();
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    gameLoop(performance.now());
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
        alert('Game fee was not paid for this session. Cannot save score to blockchain.');
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
        
        document.getElementById('saveScoreButton').style.display = 'none';
        document.getElementById('playerName').style.display = 'none';
        const h3Element = document.querySelector('#blockchainSection h3');
        const pElement = document.querySelector('#blockchainSection p');
        if (h3Element) h3Element.style.display = 'none';
        if (pElement) pElement.style.display = 'none';
        
        document.getElementById('save-status').innerHTML = `
            <div style="background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 12px; text-align: center;">
                <h4 style="margin-bottom: 10px; color: #00ff88; font-size: 14px;">Transaction Hash:</h4>
                <div class="tx-copy-container" style="justify-content: center;">
                    <span style="font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all;">${txHash}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${txHash}')" style="margin-left: 10px; font-size: 10px; padding: 4px 8px;">📋 Copy</button>
                </div>
            </div>
        `;
        
        await loadLeaderboard();
        
    } catch (error) {
        hideLoading();
        console.error('Save score error:', error);
        alert('Failed to save score: ' + error.message);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        if (!window.walletConnector) return;
        
        const topScores = await walletConnector.getTopScores(3);
        const container = document.getElementById('leaderboard-container');
        
        if (topScores.length === 0) {
            container.innerHTML = '<p style="text-align: center; margin: 10px 0;">No scores yet - be the first!</p>';
            return;
        }

        let html = '<h4 style="color: #00ddff; margin-bottom: 10px; font-size: 14px;">🏆 Top 3 Players</h4>';
        html += '<div style="font-size: 10px; margin-bottom: 10px; color: #aaccff;"><strong>Name</strong> | <strong>Address</strong> | <strong>Score</strong></div>';
        
        topScores.forEach((record, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || '🅿️';
            const maskedAddress = maskAddress(record.player);
            
            html += `<div style="margin: 6px 0; padding: 6px; background: rgba(0, 221, 255, 0.1); border-radius: 5px; border-left: 3px solid #00ddff; font-size: 10px;">
                ${medal} <strong>${record.playerName}</strong> | ${maskedAddress} | <strong>${record.score}</strong>
            </div>`;
        });
        
        html += '<div style="text-align: center; margin-top: 12px;"><button onclick="window.location.href=\'leaderboard.html\';" style="padding: 6px 12px; font-size: 10px; background: rgba(0, 221, 255, 0.2); color: #00ddff; border: 1px solid #00ddff; border-radius: 5px; cursor: pointer;">View Full Leaderboard</button></div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
    }
}

// Utility functions
function maskAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}***${address.slice(-6)}`;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        const buttons = document.querySelectorAll('.copy-btn');
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick').includes(text)) {
                btn.textContent = '✓ Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '📋 Copy';
                    btn.classList.remove('copied');
                }, 2000);
            }
        });
        
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard');
    }
}

function restartGame() {
    document.body.classList.remove('game-over-active');
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    gameState = 'start';
    
    scoreAlreadySaved = false;
}

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

// Initialize game when page loads
window.addEventListener('load', () => {
    console.log('🎮 Game loaded');
    applyGameConfig();
    createBubbles();
    
    // Show start screen
    document.getElementById('startScreen').style.display = 'block';
    
    // Wait for wallet connector and log status
    setTimeout(() => {
        if (window.walletConnector) {
            console.log('🔗 WalletConnector status:', {
                initialized: walletConnector.isInitialized,
                connected: walletConnector.connected,
                account: walletConnector.account
            });
        } else {
            console.log('❌ WalletConnector not found');
        }
    }, 1000);
});

// Make functions globally available
window.startGame = startGame;
window.saveScoreToBlockchain = saveScoreToBlockchain;
window.restartGame = restartGame;
window.copyToClipboard = copyToClipboard;// game.js - Main game logic

// Game variables
let gameState = 'start';
let score = 0;
let lives = GAME_CONFIG.PLAYER_LIVES;
let level = 1;
let gameSpeed = 1;
let hasPaidFee = false;
let scoreAlreadySaved = false;
let currentGameSession = null;

// FPS-independent timing variables
let lastTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;
let deltaTime = 0;

// FPS counter for debugging
let fpsCounter = 0;
let fpsTime = 0;
let currentFPS = 0;

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
    crabImages[color].onload = () => { crabImagesLoaded[color] = true; };
    crabImages[color].onerror = () => { crabImagesLoaded[color] = false; };
});

// Create bubbles effect
function createBubbles() {
    const bubblesContainer = document.querySelector('.bubbles');
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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player octopus
const player = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 80,
    width: 60,
    height: 60,
    speed: 6
};

// Game objects arrays
let bullets = [];
let invaders = [];
let invaderBullets = [];
let particles = [];
let ripples = [];

// Crab settings
let invaderRows = GAME_CONFIG.INVADERS_ROWS;
let invaderCols = GAME_CONFIG.INVADERS_COLS;
const invaderWidth = 35;
const invaderHeight = 30;
let invaderSpeed = (1 * GAME_CONFIG.CRAB_SPEED) / 100;
let invaderDirection = 1;
let invaderDropDistance = 25;

// Controls
const keys = {};
let lastShotTime = 0;
const shotCooldown = (300 * 100) / GAME_CONFIG.PLAYER_FIRE_RATE;

// Apply game configuration
function applyGameConfig() {
    player.speed = (6 * GAME_CONFIG.PLAYER_SPEED) / 100;
    invaderSpeed = (1 * GAME_CONFIG.CRAB_SPEED) / 100;
    lives = GAME_CONFIG.PLAYER_LIVES;
    invaderRows = GAME_CONFIG.INVADERS_ROWS;
    invaderCols = GAME_CONFIG.INVADERS_COLS;
    console.log('🎮 Game config applied:', GAME_CONFIG);
}

// Keyboard events
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'KeyP' && gameState === 'playing') {
        gameState = 'paused';
    } else if (e.code === 'KeyP' && gameState === 'paused') {
        gameState = 'playing';
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

// Create ink bullet
function createBullet() {
    const now = Date.now();
    const actualCooldown = (300 * 100) / GAME_CONFIG.PLAYER_FIRE_RATE;
    
    if (now - lastShotTime > actualCooldown) {
        const bulletSpeed = (8 * GAME_CONFIG.PLAYER_BULLET_SPEED) / 100;
        
        if (GAME_CONFIG.DOUBLE_SHOT) {
            bullets.push({
                x: player.x + player.width / 2 - 8,
                y: player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: []
            });
            bullets.push({
                x: player.x + player.width / 2 + 2,
                y: player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: []
            });
        } else {
            bullets.push({
                x: player.x + player.width / 2 - 3,
                y: player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: []
            });
        }
        
        lastShotTime = now;
        createRipple(player.x + player.width / 2, player.y);
    }
}

// Create crab bubble
function createInvaderBullet(invader) {
    const fireRate = (0.0008 * level * GAME_CONFIG.CRAB_FIRE_RATE) / 100;
    const bulletSpeed = (2.5 * GAME_CONFIG.CRAB_BULLET_SPEED) / 100;
    
    if (Math.random() < fireRate) {
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
    const baseParticleCount = isOctopus ? 15 : 12;
    const particleCount = Math.round((baseParticleCount * GAME_CONFIG.PARTICLE_COUNT) / 100);
    
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
    const moveSpeed = player.speed * deltaTime;
    
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
    const playerBulletSpeed = (8 * GAME_CONFIG.PLAYER_BULLET_SPEED * deltaTime) / 100;
    const crabBulletSpeed = (2.5 * GAME_CONFIG.CRAB_BULLET_SPEED * deltaTime) / 100;
    
    bullets = bullets.filter(bullet => {
        bullet.y -= playerBulletSpeed;
        bullet.trail.
