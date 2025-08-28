// 🎮 PHAROS INVADERS - TOURNAMENT GAME
// Игровая логика для турнирного режима (адаптация game.js)

class TournamentGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'waiting'; // waiting, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameSpeed = 1;
        this.gameStartTime = 0;
        this.gameDuration = 0;

        // FPS переменные
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.deltaTime = 0;

        // Игровые объекты
        this.player = {
            x: 370,
            y: 520,
            width: 60,
            height: 60,
            speed: 6
        };

        this.bullets = [];
        this.invaders = [];
        this.invaderBullets = [];
        this.particles = [];
        this.ripples = [];

        // Настройки игры из конфига
        this.invaderRows = TOURNAMENT_CONFIG.GAME_CONFIG.INVADERS_ROWS;
        this.invaderCols = TOURNAMENT_CONFIG.GAME_CONFIG.INVADERS_COLS;
        this.invaderWidth = 35;
        this.invaderHeight = 30;
        this.invaderSpeed = 1;
        this.invaderDirection = 1;
        this.invaderDropDistance = 25;

        // Управление
        this.keys = {};
        this.lastShotTime = 0;
        this.shotCooldown = 300;

        // Изображения
        this.images = {
            octopus: null,
            crabs: {},
            loaded: {
                octopus: false,
                crabs: {}
            }
        };

        // Колбэки
        this.onScoreUpdate = null;
        this.onGameOver = null;
        this.onLivesChange = null;
        this.onLevelChange = null;

        this.initImages();
        this.setupEventListeners();

        console.log('🎮 Tournament Game initialized');
    }

    // Инициализация изображений
    initImages() {
        // Осьминог
        this.images.octopus = new Image();
        this.images.octopus.src = TOURNAMENT_CONFIG.IMAGES.OCTOPUS;
        this.images.octopus.onload = () => {
            this.images.loaded.octopus = true;
            console.log('🐙 Octopus image loaded');
        };
        this.images.octopus.onerror = () => {
            this.images.loaded.octopus = false;
            console.log('❌ Octopus image failed');
        };

        // Крабы
        Object.keys(TOURNAMENT_CONFIG.IMAGES.CRABS).forEach(color => {
            this.images.crabs[color.toLowerCase()] = new Image();
            this.images.crabs[color.toLowerCase()].src = TOURNAMENT_CONFIG.IMAGES.CRABS[color];
            this.images.loaded.crabs[color.toLowerCase()] = false;

            this.images.crabs[color.toLowerCase()].onload = () => {
                this.images.loaded.crabs[color.toLowerCase()] = true;
                console.log(`🦀 ${color} crab loaded`);
            };

            this.images.crabs[color.toLowerCase()].onerror = () => {
                this.images.loaded.crabs[color.toLowerCase()] = false;
                console.log(`❌ ${color} crab failed`);
            };
        });
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработчики клавиатуры
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Предотвращаем скролл на пробел
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;

        if (e.code === 'KeyP' && this.gameState === 'playing') {
            this.pauseGame();
        } else if (e.code === 'KeyP' && this.gameState === 'paused') {
            this.resumeGame();
        }

        if (e.code === 'Space' && this.gameState === 'waiting') {
            this.startGame();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    // Инициализация канваса
    initCanvas(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        // Устанавливаем размеры
        this.canvas.width = TOURNAMENT_CONFIG.CANVAS_WIDTH;
        this.canvas.height = TOURNAMENT_CONFIG.CANVAS_HEIGHT;

        console.log('✅ Tournament canvas initialized');
    }

    // Начать игру
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = TOURNAMENT_CONFIG.GAME_CONFIG.PLAYER_LIVES;
        this.gameSpeed = 1;
        this.invaderSpeed = 1;
        this.gameStartTime = Date.now();

        // Сброс игровых объектов
        this.bullets = [];
        this.invaderBullets = [];
        this.particles = [];
        this.ripples = [];

        // Позиция игрока
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height - 80;

        // Создаем крабов
        this.createInvaders();

        // Обновляем UI
        this.updateCallbacks();

        // Запускаем игровой цикл
        this.gameLoop(performance.now());

        console.log('🚀 Tournament game started');
    }

    // Пауза
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        }
    }

    // Возобновление
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    // Завершение игры
    endGame() {
        this.gameState = 'gameOver';
        this.gameDuration = Date.now() - this.gameStartTime;

        console.log(`🏁 Game ended. Score: ${this.score}, Duration: ${this.gameDuration}ms`);

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                level: this.level,
                duration: this.gameDuration,
                lives: this.lives
            });
        }
    }

    // Создание крабов
    createInvaders() {
        this.invaders = [];
        const startX = 50;
        const startY = 50;
        const spacingX = 65;
        const spacingY = 55;

        for (let row = 0; row < this.invaderRows; row++) {
            for (let col = 0; col < this.invaderCols; col++) {
                let crabType = 'green';
                if (row === 0) crabType = 'violet';
                else if (row === 1) crabType = 'red';
                else if (row === 2) crabType = 'yellow';
                else if (row === 3) crabType = 'blue';
                else if (row === 4) crabType = 'green';

                this.invaders.push({
                    x: startX + col * spacingX,
                    y: startY + row * spacingY,
                    width: this.invaderWidth,
                    height: this.invaderHeight,
                    alive: true,
                    type: crabType,
                    animFrame: 0,
                    clawOffset: Math.random() * Math.PI * 2
                });
            }
        }
    }

    // Обновление колбэков
    updateCallbacks() {
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onLivesChange) this.onLivesChange(this.lives);
        if (this.onLevelChange) this.onLevelChange(this.level);
    }

    // Основной игровой цикл
    gameLoop(currentTime) {
        if (this.gameState !== 'playing') return;

        // Вычисляем deltaTime
        if (this.lastTime === 0) this.lastTime = currentTime;
        const rawDeltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.deltaTime = rawDeltaTime / this.frameTime;
        if (this.deltaTime > 3) this.deltaTime = 3;

        // Обновляем игровые объекты
        this.updatePlayer();
        this.updateBullets();
        this.updateInvaders();
        this.updateParticles();
        this.checkCollisions();

        // Проверяем условия завершения уровня
        this.checkLevelCompletion();

        // Отрисовываем кадр
        this.render();

        // Продолжаем цикл
        if (this.gameState === 'playing') {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    // Обновление игрока
    updatePlayer() {
        const playerSpeed = this.player.speed *
            (TOURNAMENT_CONFIG.GAME_CONFIG.PLAYER_SPEED / 100) * this.deltaTime;

        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= playerSpeed;
        }
        if (this.keys['ArrowRight'] &&
            this.player.x < this.canvas.width - this.player.width) {
            this.player.x += playerSpeed;
        }
        if (this.keys['Space']) {
            this.createBullet();
        }
    }

    // Создание пули игрока
    createBullet() {
        const now = Date.now();
        const adjustedCooldown = this.shotCooldown *
            (100 / TOURNAMENT_CONFIG.GAME_CONFIG.PLAYER_FIRE_RATE);

        if (now - this.lastShotTime > adjustedCooldown) {
            const bulletSpeed = 8 *
                (TOURNAMENT_CONFIG.GAME_CONFIG.PLAYER_BULLET_SPEED / 100);

            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 3,
                y: this.player.y,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                trail: []
            });

            this.lastShotTime = now;
            this.createRipple(this.player.x + this.player.width / 2, this.player.y);
        }
    }

    // Обновление пуль
    updateBullets() {
        // Пули игрока
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed * this.deltaTime;
            bullet.trail.push({
                x: bullet.x + bullet.width / 2,
                y: bullet.y + bullet.height
            });
            if (bullet.trail.length > 8) bullet.trail.shift();
            return bullet.y > -bullet.height;
        });

        // Пули крабов
        this.invaderBullets = this.invaderBullets.filter(bullet => {
            bullet.y += bullet.speed * this.deltaTime;
            bullet.wobble += 0.2 * this.deltaTime;
            bullet.x += Math.sin(bullet.wobble) * 0.5 * this.deltaTime;
            return bullet.y < this.canvas.height;
        });
    }

    // Обновление крабов
    updateInvaders() {
        let shouldDrop = false;
        let aliveInvaders = this.invaders.filter(inv => inv.alive);

        // Рассчитываем скорость
        const killMultiplier = TOURNAMENT_CONFIG.GAME_CONFIG.CRAB_SPEED_KILL_MULTIPLIER || 0.00125;
        const totalInvaders = this.invaderRows * this.invaderCols;
        const speedMultiplier = 1 + (totalInvaders - aliveInvaders.length) * killMultiplier;
        const crabSpeedModifier = TOURNAMENT_CONFIG.GAME_CONFIG.CRAB_SPEED / 100;
        const currentSpeed = this.invaderSpeed * speedMultiplier *
                           this.gameSpeed * crabSpeedModifier * this.deltaTime;

        // Проверяем границы
        for (let invader of aliveInvaders) {
            if ((invader.x <= 0 && this.invaderDirection === -1) ||
                (invader.x >= this.canvas.width - invader.width &&
                 this.invaderDirection === 1)) {
                shouldDrop = true;
                break;
            }
        }

        // Опускаем крабов если нужно
        if (shouldDrop) {
            this.invaderDirection *= -1;
            for (let invader of this.invaders) {
                if (invader.alive) {
                    invader.y += this.invaderDropDistance;
                }
            }
        }

        // Двигаем крабов
        for (let invader of this.invaders) {
            if (invader.alive) {
                invader.x += currentSpeed * this.invaderDirection;
                invader.animFrame += 0.08 * this.deltaTime;
                invader.clawOffset += 0.12 * this.deltaTime;
                this.createInvaderBullet(invader);
            }
        }

        // Проверяем достижение игрока
        for (let invader of aliveInvaders) {
            if (invader.y + invader.height >= this.player.y) {
                this.endGame();
                break;
            }
        }
    }

    // Создание пули краба
    createInvaderBullet(invader) {
        const baseFireRate = 0.0008 * Math.log(this.level + 1);
        const adjustedFireRate = baseFireRate *
            (TOURNAMENT_CONFIG.GAME_CONFIG.CRAB_FIRE_RATE / 100);

        if (Math.random() < adjustedFireRate) {
            const bulletSpeed = 2.5 *
                (TOURNAMENT_CONFIG.GAME_CONFIG.CRAB_BULLET_SPEED / 100);

            this.invaderBullets.push({
                x: invader.x + invader.width / 2 - 4,
                y: invader.y + invader.height,
                width: 8,
                height: 8,
                speed: bulletSpeed,
                wobble: 0
            });
        }
    }

    // Обновление частиц и эффектов
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * this.deltaTime;
            particle.y += particle.vy * this.deltaTime;
            particle.vy += 0.2 * this.deltaTime; // гравитация
            particle.life -= this.deltaTime;
            return particle.life > 0;
        });

        this.ripples = this.ripples.filter(ripple => {
            ripple.size = (ripple.maxSize * (30 - ripple.life)) / 30;
            ripple.life -= this.deltaTime;
            return ripple.life > 0;
        });
    }

    // Проверка коллизий
    checkCollisions() {
        // Пули игрока vs крабы
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.invaders.length - 1; j >= 0; j--) {
                if (this.invaders[j].alive &&
                    this.bullets[i].x < this.invaders[j].x + this.invaders[j].width &&
                    this.bullets[i].x + this.bullets[i].width > this.invaders[j].x &&
                    this.bullets[i].y < this.invaders[j].y + this.invaders[j].height &&
                    this.bullets[i].y + this.bullets[i].height > this.invaders[j].y) {

                    // Попадание!
                    const crabColor = this.getCrabColor(this.invaders[j].type);
                    this.createExplosion(
                        this.invaders[j].x + this.invaders[j].width / 2,
                        this.invaders[j].y + this.invaders[j].height / 2,
                        crabColor
                    );

                    this.createRipple(
                        this.invaders[j].x + this.invaders[j].width / 2,
                        this.invaders[j].y + this.invaders[j].height / 2
                    );

                    // Начисляем очки
                    let points = this.getCrabPoints(this.invaders[j].type);
                    points = Math.round(points *
                        (TOURNAMENT_CONFIG.GAME_CONFIG.SCORE_MULTIPLIER / 100));

                    this.score += points;
                    this.invaders[j].alive = false;
                    this.bullets.splice(i, 1);

                    this.updateCallbacks();
                    break;
                }
            }
        }

        // Пули крабов vs игрок
        for (let i = this.invaderBullets.length - 1; i >= 0; i--) {
            if (this.invaderBullets[i].x < this.player.x + this.player.width &&
                this.invaderBullets[i].x + this.invaderBullets[i].width > this.player.x &&
                this.invaderBullets[i].y < this.player.y + this.player.height &&
                this.invaderBullets[i].y + this.invaderBullets[i].height > this.player.y) {

                // Попадание в игрока!
                this.createExplosion(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2,
                    '#6666ff',
                    true
                );

                this.invaderBullets.splice(i, 1);
                this.lives--;
                this.updateCallbacks();

                if (this.lives <= 0) {
                    this.endGame();
                }
            }
        }
    }

    // Проверка завершения уровня
    checkLevelCompletion() {
        const aliveInvaders = this.invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) {
            this.level++;

            // Увеличиваем сложность
            const gameSpeedIncrease = TOURNAMENT_CONFIG.GAME_CONFIG.GAME_SPEED_LEVEL_INCREASE || 0.07;
            const invaderSpeedIncrease = TOURNAMENT_CONFIG.GAME_CONFIG.CRAB_SPEED_LEVEL_INCREASE || 0.25;

            this.gameSpeed += gameSpeedIncrease;
            this.invaderSpeed += invaderSpeedIncrease;

            // Создаем новую волну
            this.createInvaders();
            this.bullets = [];
            this.invaderBullets = [];

            this.updateCallbacks();
        }
    }

    // Получить цвет краба
    getCrabColor(type) {
        const colors = {
            'violet': '#9966ff',
            'red': '#ff3333',
            'yellow': '#ffdd33',
            'blue': '#3366ff',
            'green': '#33cc66'
        };
        return colors[type] || '#cc3333';
    }

    // Получить очки за краба
    getCrabPoints(type) {
        const points = {
            'violet': 100,
            'red': 80,
            'yellow': 60,
            'blue': 40,
            'green': 20
        };
        return points[type] || 10;
    }

    // Создание взрыва
    createExplosion(x, y, color, isOctopus = false) {
        const particleCount = isOctopus ? 15 : 12;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
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

    // Создание ряби
    createRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            size: 0,
            maxSize: 50,
            life: 30
        });
    }

    // Отрисовка
    render() {
        if (!this.ctx) return;

        // Очищаем канвас
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем игровые объекты
        this.drawPlayer();
        this.drawInvaders();
        this.drawBullets();
        this.drawParticles();
        this.drawRipples();
        this.drawUI();
    }

    // Отрисовка игрока
    drawPlayer() {
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;

        if (this.images.loaded.octopus && this.images.octopus.complete) {
            this.ctx.save();
            this.ctx.shadowColor = '#00ddff';
            this.ctx.shadowBlur = 15;

            const imageSize = 70;
            this.ctx.drawImage(
                this.images.octopus,
                centerX - imageSize / 2,
                centerY - imageSize / 2,
                imageSize,
                imageSize
            );

            this.ctx.restore();

            // Обводка
            this.ctx.strokeStyle = '#00ddff';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        } else {
            // Fallback - emoji
            this.ctx.fillStyle = '#00ddff';
            this.ctx.font = '50px Arial';
            this.ctx.fillText('🐙', this.player.x, this.player.y + 40);
        }
    }

    // Отрисовка крабов
    drawInvaders() {
        for (let invader of this.invaders) {
            if (invader.alive) {
                const centerX = invader.x + invader.width / 2;
                const centerY = invader.y + invader.height / 2;
                const bobbing = Math.sin(invader.animFrame) * 2;

                if (this.images.loaded.crabs[invader.type] &&
                    this.images.crabs[invader.type].complete) {
                    this.ctx.save();
                    this.ctx.shadowColor = this.getCrabColor(invader.type);
                    this.ctx.shadowBlur = 5;

                    const imageSize = 40;
                    this.ctx.drawImage(
                        this.images.crabs[invader.type],
                        centerX - imageSize / 2,
                        centerY - imageSize / 2 + bobbing,
                        imageSize,
                        imageSize
                    );

                    this.ctx.restore();
                } else {
                    // Fallback - emoji
                    this.ctx.font = '25px Arial';
                    this.ctx.fillText('🦀', invader.x, invader.y + 20 + bobbing);
                }
            }
        }
    }

    // Отрисовка пуль
    drawBullets() {
        // Пули игрока
        for (let bullet of this.bullets) {
            // След
            this.ctx.strokeStyle = 'rgba(102, 102, 255, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            for (let i = 0; i < bullet.trail.length - 1; i++) {
                const alpha = i / bullet.trail.length;
                this.ctx.globalAlpha = alpha * 0.8;
                if (i < bullet.trail.length - 1) {
                    this.ctx.moveTo(bullet.trail[i].x, bullet.trail[i].y);
                    this.ctx.lineTo(bullet.trail[i + 1].x, bullet.trail[i + 1].y);
                }
            }
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;

            // Пуля
            this.ctx.fillStyle = '#6666ff';
            this.ctx.beginPath();
            this.ctx.arc(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                4, 0, Math.PI * 2
            );
            this.ctx.fill();

            this.ctx.shadowColor = '#6666ff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#aaaaff';
            this.ctx.beginPath();
            this.ctx.arc(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Пули крабов
        for (let bullet of this.invaderBullets) {
            this.ctx.strokeStyle = '#ff4444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                bullet.width / 2, 0, Math.PI * 2
            );
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                bullet.width / 2 - 1, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    // Отрисовка частиц
    drawParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    // Отрисовка ряби
    drawRipples() {
        for (let ripple of this.ripples) {
            this.ctx.strokeStyle = `rgba(0, 221, 255, ${ripple.life / 30})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.size, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    // Отрисовка UI
    drawUI() {
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
    }

    // Получить текущее состояние игры
    getGameState() {
        return {
            gameState: this.gameState,
            score: this.score,
            lives: this.lives,
            level: this.level,
            duration: this.gameState === 'playing' ?
                      Date.now() - this.gameStartTime : this.gameDuration
        };
    }

    // Установить колбэки
    setCallbacks(callbacks) {
        this.onScoreUpdate = callbacks.onScoreUpdate || null;
        this.onGameOver = callbacks.onGameOver || null;
        this.onLivesChange = callbacks.onLivesChange || null;
        this.onLevelChange = callbacks.onLevelChange || null;
    }

    // Уничтожить игру
    destroy() {
        this.gameState = 'destroyed';

        // Удаляем обработчики событий
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        console.log('🎮 Tournament game destroyed');
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TournamentGame;
} else if (typeof window !== 'undefined') {
    window.TournamentGame = TournamentGame;
}

console.log('🎮 Tournament game engine loaded');