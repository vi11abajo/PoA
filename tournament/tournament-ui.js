// 🎨 PHAROS INVADERS - TOURNAMENT UI
// Управление интерфейсом турнирной системы

class TournamentUI {
    constructor() {
        this.elements = {};
        this.gameModal = null;
        this.game = null;
        this.notifications = [];
        this.timers = {};
        this.isClosing = false;
        this.gameOverProcessed = false;
        this.closeGameTimer = null;
        this.init();
    }



    // Инициализация UI
    init() {
        this.cacheElements();
        this.createGameModal();
        this.setupEventListeners();
        this.injectStyles();
    }

    // Кэширование DOM элементов
    cacheElements() {
        this.elements = {
            // Основные элементы
            body: document.body,
            mainContainer: document.querySelector('.main-container'),

            // Информация о турнире
            tournamentId: document.getElementById('tournamentId'),
            entryFee: document.getElementById('entryFee'),
            participantCount: document.getElementById('participantCount'),

            // Статус пользователя
            userStatus: document.getElementById('userStatus'),
            attemptIndicators: document.getElementById('attemptIndicators'),
            registerButton: document.getElementById('registerButton'),
            playButton: document.getElementById('playButton'),

            // Турнирный статус
            tournamentStatus: document.getElementById('tournamentStatus'),
            tournamentTimer: document.getElementById('tournamentTimer'),
            timerDisplay: document.getElementById('timerDisplay'),

            // Призовой фонд
            totalPrize: document.getElementById('totalPrize'),
            firstPrize: document.getElementById('firstPrize'),
            secondPrize: document.getElementById('secondPrize'),
            thirdPrize: document.getElementById('thirdPrize'),

            // Лидерборд
            leaderboardBody: document.getElementById('leaderboardBody'),
            refreshButton: document.getElementById('refreshButton'),

            // Админ панель
            adminPanel: document.getElementById('adminPanel'),
            startTournamentBtn: document.getElementById('startTournamentBtn'),
            endTournamentBtn: document.getElementById('endTournamentBtn'),
            distributePrizesBtn: document.getElementById('distributePrizesBtn')
        };

    }

    // Создание игрового модала
    createGameModal() {
        const modal = document.createElement('div');
        modal.className = 'tournament-game-modal';
        modal.innerHTML = `
            <div class="game-modal-content">
                <div class="game-header">
                    <h2>🏆 Tournament Game</h2>
                    <button class="close-game-btn" onclick="tournamentUI.forceExitGame()">✖</button>
                </div>

                <canvas id="tournamentGameCanvas" width="800" height="600"></canvas>

                <div class="game-ui">
                    <div class="game-stats">
                        <span>Score: <span id="gameScore">0</span></span>
                        <span>Lives: <span id="gameLives">3</span></span>
                        <span>Level: <span id="gameLevel">1</span></span>
                    </div>
                    
                    <div class="game-controls">
                        <!-- EXIT button removed - close functionality moved to X button in header -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.gameModal = modal;

        // Создаем панель бустов отдельно, вне модального окна
        this.createExternalBoostPanel();

    }

    // Создание внешней панели бустов
    createExternalBoostPanel() {
        const boostPanel = document.createElement('div');
        boostPanel.id = 'boostPanel';
        boostPanel.className = 'tournament-boost-panel-external';
        boostPanel.innerHTML = `
            <div class="boost-panel-header">
                <span>⭐ Active Boosts</span>
            </div>
            <div id="boostPanelContent" class="boost-panel-content">
                <!-- Активные бонусы будут добавлены динамически -->
            </div>
        `;

        document.body.appendChild(boostPanel);
        this.boostPanel = boostPanel;

        // Панель скрыта по умолчанию, будет показана BoostManager'ом при наличии бустов
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Закрытие модала при клике вне его
        if (this.gameModal) {
            this.gameModal.addEventListener('click', (e) => {
                if (e.target === this.gameModal) {
                    this.forceExitGame();
                }
            });
        }

        // Обработка клавиатуры для игры
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.gameModal && this.gameModal.classList.contains('active')) {
                this.forceExitGame();
            }
        });

    }

    // ========== ОБНОВЛЕНИЕ ДАННЫХ ==========

    // Обновить информацию о турнире
    updateTournamentInfo(info) {
         if (this.elements.entryFee && tournamentInfo.entryFee) {
            this.elements.entryFee.textContent =
                `${TournamentUtils.formatCurrency(
                    window.web3.utils.fromWei(tournamentInfo.entryFee, 'ether')
                )} PHRS`;
        }

    }

    // Обновить статус пользователя
    updateUserStatus(status) {
        if (!this.elements.userStatus) return;

        let statusText = '';
        let statusClass = '';

        switch (status.status) {
            case 'disconnected':
                statusText = '🔌 Connect Wallet';
                statusClass = 'disconnected';
                break;
            case 'connected':
                statusText = '💰 Register to Play';
                statusClass = 'connected';
                break;
            case 'registered':
                statusText = `🎮 Ready to Play (${status.attempts}/3 attempts used)`;
                statusClass = 'registered';
                break;
            case 'finished':
                statusText = '✅ All attempts completed';
                statusClass = 'finished';
                break;
        }

        this.elements.userStatus.textContent = statusText;
        this.elements.userStatus.className = `user-status ${statusClass}`;

        this.updateButtons(status);
    }

    // Обновить кнопки в зависимости от статуса
    updateButtons(status) {
        if (this.elements.registerButton) {
            this.elements.registerButton.style.display =
                status.status === 'connected' ? 'block' : 'none';
        }

        if (this.elements.playButton) {
            this.elements.playButton.style.display =
                status.status === 'registered' && status.attempts < 3 ? 'block' : 'none';
        }
    }

    addBackToTournamentButton() {
        // Проверяем есть ли уже кнопка
        if (document.getElementById('backToTournamentBtn')) {
            return; // Кнопка уже есть
        }

        // Найдем game-ui контейнер
        const gameUI = document.querySelector('.game-ui');
        if (gameUI) {
            // Создаем заметную кнопку возврата
            const backButton = document.createElement('button');
            backButton.id = 'backToTournamentBtn';
            backButton.className = 'back-tournament-btn';
            backButton.style.cssText = `
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin: 10px;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
                transition: all 0.3s ease;
            `;
            backButton.textContent = '🏆 Back to Tournament';

            // Добавляем hover эффект
            backButton.addEventListener('mouseenter', () => {
                backButton.style.transform = 'translateY(-2px)';
                backButton.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)';
            });

            backButton.addEventListener('mouseleave', () => {
                backButton.style.transform = 'translateY(0)';
                backButton.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
            });

            // Обработчик клика
            backButton.addEventListener('click', () => {
                this.closeGame();
            });

            // Добавляем кнопку в UI
            gameUI.appendChild(backButton);

            // Скрываем стандартную кнопку закрытия если она есть
            const closeBtn = gameUI.querySelector('.close-game-btn');
            if (closeBtn) {
                closeBtn.style.display = 'none';
            }

        }
    }

    // Обновить индикаторы попыток
    updateAttemptIndicators(attempts) {
        if (!this.elements.attemptIndicators) {
            return;
        }

        const dots = this.elements.attemptIndicators.querySelectorAll('.attempt-dot');
        
        if (dots.length === 0) {
            return;
        }
        
        dots.forEach((dot, index) => {
            const attemptNumber = index + 1;
            
            // Сбрасываем все классы, оставляя только базовый
            dot.className = 'attempt-dot';
            
            if (attemptNumber <= attempts) {
                // Попытка использована - добавляем класс completed
                dot.classList.add('completed');
            } else if (attemptNumber === attempts + 1 && attempts < 3) {
                // Следующая попытка (активная) - добавляем класс current
                dot.classList.add('current');
            }
            // Остальные остаются базовыми (неиспользованными)
        });
        
    }

    // Обновить статус турнира
    updateTournamentStatus(status, timeRemaining, tournamentId = null) {
        if (!this.elements.tournamentStatus) return;

        this.elements.tournamentStatus.className = `tournament-status ${status}`;

        let statusText = TournamentUtils.getStatusText(status);
        
        // Добавляем ID турнира если он активен
        if (status.toLowerCase() === 'active' && tournamentId) {
            statusText += ` (ID: ${tournamentId})`;
        }
        
        this.elements.tournamentStatus.textContent = statusText;

        // Обновляем таймер
        if (status.toLowerCase() === 'active') {
            this.showTimer();
            if (timeRemaining !== undefined && timeRemaining > 0) {
                this.updateTimer(timeRemaining);
            }
        } else {
            this.hideTimer();
        }
    }

    // Показать таймер
    showTimer() {
        const timerSection = document.getElementById('tournamentTimerSection');
        if (timerSection) {
            timerSection.style.display = 'block';
        }
    }

    // Скрыть таймер
    hideTimer() {
        const timerSection = document.getElementById('tournamentTimerSection');
        if (timerSection) {
            timerSection.style.display = 'none';
        }
    }

    // Обновить таймер
    updateTimer(seconds) {
        const timerElement = document.getElementById('tournamentTimer');
        if (!timerElement) return;

        if (seconds <= 0) {
            timerElement.textContent = '00:00';
            timerElement.className = 'info-value timer-display critical';
            return;
        }

        // Форматируем время
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        timerElement.textContent = timeString;

        // Меняем стиль в зависимости от оставшегося времени
        timerElement.className = 'info-value timer-display';
        if (seconds <= 60) {
            timerElement.classList.add('critical');
        } else if (seconds <= 300) { // 5 минут
            timerElement.classList.add('warning');
        }

    }

    // Показать таймер турнира
    showTournamentTimer(timeRemaining) {
        if (!this.elements.tournamentTimer || !this.elements.timerDisplay) return;

        this.elements.tournamentTimer.style.display = 'block';

        // Очищаем предыдущий таймер
        if (this.timers.countdown) {
            clearInterval(this.timers.countdown);
        }

        // Обновляем таймер каждую секунду
        const updateTimer = () => {
            const remaining = Math.max(0, timeRemaining);
            this.elements.timerDisplay.textContent = TournamentUtils.formatTime(remaining);

            // Предупреждение если время заканчивается
            if (remaining <= TOURNAMENT_CONFIG.WARNING_TIME_THRESHOLD) {
                this.elements.timerDisplay.classList.add('warning');
            } else {
                this.elements.timerDisplay.classList.remove('warning');
            }

            timeRemaining--;

            if (timeRemaining < 0) {
                clearInterval(this.timers.countdown);
            }
        };

        updateTimer(); // Сразу обновляем
        this.timers.countdown = setInterval(updateTimer, 1000);
    }

    // Скрыть таймер турнира
    hideTournamentTimer() {
        if (this.elements.tournamentTimer) {
            this.elements.tournamentTimer.style.display = 'none';
        }

        if (this.timers.countdown) {
            clearInterval(this.timers.countdown);
            delete this.timers.countdown;
        }
    }

    // Обновить призовой фонд
    updatePrizePool(totalPrizeWei) {
        if (!totalPrizeWei) return;

        // Конвертируем wei в ether
        let totalPrize;
        if (window.web3 && window.web3.utils) {
            totalPrize = window.web3.utils.fromWei(totalPrizeWei, 'ether');
        } else if (window.Web3) {
            // Создаем временный экземпляр Web3 для конвертации
            const tempWeb3 = new window.Web3();
            totalPrize = tempWeb3.utils.fromWei(totalPrizeWei, 'ether');
        } else {
            // Fallback: простое деление на 10^18
            totalPrize = (parseFloat(totalPrizeWei) / 1e18).toString();
        }

        // Обновляем общий приз
        if (this.elements.totalPrize) {
            TournamentUtils.animateCurrency(
                this.elements.totalPrize,
                parseFloat(this.elements.totalPrize.textContent.replace(' PHRS', '')) || 0,
                parseFloat(totalPrize)
            );
        }

        // Обновляем разбивку призов
        this.updatePrizeBreakdown(totalPrize);
    }

    // Обновить разбивку призового фонда
    updatePrizeBreakdown(totalPrizeAmount) {
        if (!totalPrizeAmount) return;

        const total = parseFloat(totalPrizeAmount);

        // Конвертируем ether обратно в wei для расчета призов
        let totalPrizeWei;
        if (window.web3 && window.web3.utils) {
            totalPrizeWei = window.web3.utils.toWei(totalPrizeAmount, 'ether');
        } else if (window.Web3) {
            const tempWeb3 = new window.Web3();
            totalPrizeWei = tempWeb3.utils.toWei(totalPrizeAmount, 'ether');
        } else {
            // Fallback: умножение на 10^18
            totalPrizeWei = (parseFloat(totalPrizeAmount) * 1e18).toString();
        }

        // Создаем фоллбек Web3 объект если основной недоступен
        const web3Instance = window.web3 || this.createWeb3Fallback();

        // Расчет призов по конфигурации
        const prizes = TOURNAMENT_CONFIG.calculatePrizes(totalPrizeWei, web3Instance);

        if (this.elements.firstPrize) {
            this.elements.firstPrize.textContent = `${TournamentUtils.formatCurrency(prizes.first)} PHRS`;
        }

        if (this.elements.secondPrize) {
            this.elements.secondPrize.textContent = `${TournamentUtils.formatCurrency(prizes.second)} PHRS`;
        }

        if (this.elements.thirdPrize) {
            this.elements.thirdPrize.textContent = `${TournamentUtils.formatCurrency(prizes.third)} PHRS`;
        }
    }

    // Обновить лидерборд (оптимизированная версия)
    updateLeaderboard(leaderboard) {
        if (!this.elements.leaderboardBody || !Array.isArray(leaderboard)) return;

        const sortedBoard = TournamentUtils.sortByScore(leaderboard);
        const topPlayers = sortedBoard.slice(0, TOURNAMENT_CONFIG.LEADERBOARD_MAX_ENTRIES || 100);
        

        // 📊 Проверяем, изменился ли лидерборд
        if (this.lastLeaderboardHash && this.isSameLeaderboard(topPlayers)) {
            return;
        }

        // Сохраняем хеш для следующего сравнения
        this.lastLeaderboardHash = this.generateLeaderboardHash(topPlayers);

        let html = '';

        if (topPlayers.length === 0) {
            html = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #888;">
                        No scores yet. Be the first to play!
                    </td>
                </tr>
            `;
        } else {
            topPlayers.forEach((entry, index) => {
                const rank = index + 1;
                const medal = TournamentUtils.getMedal(rank);
                const percentage = TournamentUtils.getPrizePercentage(rank);
                const rankColor = TournamentUtils.getRankColor(rank);

                html += `
                    <tr style="color: ${rankColor}" data-player="${entry.player}">
                        <td>${medal} ${rank}</td>
                        <td>${entry.playerName || 'Anonymous'}</td>
                        <td title="${entry.player}">${TournamentUtils.formatAddress(entry.player)}</td>
                        <td>${TournamentUtils.formatNumber(entry.score)}</td>
                        <td>${percentage}</td>
                    </tr>
                `;
            });
        }

        this.elements.leaderboardBody.innerHTML = html;
    }

    // 🔍 Генерировать хеш для сравнения лидерборда
    generateLeaderboardHash(players) {
        if (!players || players.length === 0) return 'empty';
        
        return players
            .map(p => `${p.player}:${p.score}`)
            .join('|');
    }
    
    // 🔍 Проверить, одинаковый ли лидерборд
    isSameLeaderboard(newPlayers) {
        const newHash = this.generateLeaderboardHash(newPlayers);
        return newHash === this.lastLeaderboardHash;
    }
    
    // ⚡ Инкрементальное обновление одного игрока
    updatePlayerInLeaderboard(player, newScore, playerName) {
        const rows = this.elements.leaderboardBody?.querySelectorAll('tr[data-player]');
        if (!rows) return false;
        
        let playerRow = null;
        for (const row of rows) {
            if (row.dataset.player === player) {
                playerRow = row;
                break;
            }
        }
        
        if (playerRow) {
            // Обновляем существующую строку
            const cells = playerRow.querySelectorAll('td');
            if (cells.length >= 4) {
                cells[3].textContent = TournamentUtils.formatNumber(newScore);
                return true;
            }
        }
        
        return false; // Не нашли игрока, нужно полное обновление
    }
    
    // 📱 Виртуализация для больших списков лидеров
    updateLeaderboardVirtualized(leaderboard, maxVisible = 100) {
        if (!this.elements.leaderboardBody || !Array.isArray(leaderboard)) return;
        
        const sortedBoard = TournamentUtils.sortByScore(leaderboard);
        
        if (sortedBoard.length <= maxVisible) {
            // Если данных мало, используем обычное обновление
            return this.updateLeaderboard(leaderboard);
        }
        
        
        // Показываем только верхние результаты + счетчик остальных
        const topPlayers = sortedBoard.slice(0, maxVisible);
        const remainingCount = sortedBoard.length - maxVisible;
        
        let html = '';
        
        topPlayers.forEach((entry, index) => {
            const rank = index + 1;
            const medal = TournamentUtils.getMedal(rank);
            const percentage = TournamentUtils.getPrizePercentage(rank);
            const rankColor = TournamentUtils.getRankColor(rank);

            html += `
                <tr style="color: ${rankColor}" data-player="${entry.player}">
                    <td>${medal} ${rank}</td>
                    <td>${entry.playerName || 'Anonymous'}</td>
                    <td title="${entry.player}">${TournamentUtils.formatAddress(entry.player)}</td>
                    <td>${TournamentUtils.formatNumber(entry.score)}</td>
                    <td>${percentage}</td>
                </tr>
            `;
        });
        
        // Добавляем строку с информацией об остальных игроках
        if (remainingCount > 0) {
            html += `
                <tr style="color: #666; font-style: italic;">
                    <td colspan="5" style="text-align: center; padding: 10px;">
                        ... и еще ${remainingCount} игроков
                        <button onclick="this.style.display='none'; window.tournamentUI?.showAllLeaderboard?.()" 
                                style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">
                            Показать всех
                        </button>
                    </td>
                </tr>
            `;
        }
        
        this.elements.leaderboardBody.innerHTML = html;
        
        // Сохраняем полный список для функции "показать всех"
        this.fullLeaderboardData = sortedBoard;
    }
    
    // 📋 Показать весь лидерборд (по требованию)
    showAllLeaderboard() {
        if (this.fullLeaderboardData) {
            this.updateLeaderboard(this.fullLeaderboardData);
        }
    }

    // Показать/скрыть админ панель
    showAdminPanel(show) {
        if (this.elements.adminPanel) {
            this.elements.adminPanel.style.display = show ? 'block' : 'none';
        }
    }

    // ========== ИГРОВЫЕ ФУНКЦИИ ==========

    // Открыть игру
    openGame() {
        // Сбрасываем флаги при открытии новой игры
        this.gameOverProcessed = false;
        this.isClosing = false;
        if (this.closeGameTimer) {
            clearTimeout(this.closeGameTimer);
            this.closeGameTimer = null;
        }
        
        // Проверяем доступность адаптера
        if (!window.tournamentAdapter) {
            Logger.error('❌ Tournament Adapter not loaded');
            this.showError('Tournament system not ready. Please refresh the page.');
            return;
        }

        // Получаем данные турнира
        const tournamentData = this.getTournamentData();
        if (!tournamentData) {
            Logger.error('❌ No tournament data available');
            this.showError('Tournament data not available');
            return;
        }

        // Настраиваем коллбеки для адаптера
        const callbacks = {
            onScoreUpdate: (score) => {
                const scoreEl = document.getElementById('gameScore');
                if (scoreEl) scoreEl.textContent = TournamentUtils.formatNumber(score);
            },
            onLivesChange: (lives) => {
                const livesEl = document.getElementById('gameLives');
                if (livesEl) livesEl.textContent = lives;
            },
            onLevelChange: (level) => {
                const levelEl = document.getElementById('gameLevel');
                if (levelEl) levelEl.textContent = level;
            },
            onGameOver: (gameResult) => {
                this.handleGameOver(gameResult);
            }
        };

        // Активируем адаптер
        window.tournamentAdapter.activate(tournamentData, callbacks);

        // Проверяем, что модальное окно существует в DOM
        if (!this.gameModal || !document.body.contains(this.gameModal)) {
            this.createGameModal();
            this.setupEventListeners();
        }

        // Проверяем, что панель бустов существует
        if (!this.boostPanel || !document.body.contains(this.boostPanel)) {
            this.createExternalBoostPanel();
        }

        // Показываем панель бустов при запуске игры
        if (this.boostPanel) {
            this.boostPanel.style.display = 'block';
        }

        // Принудительно показываем модал
        this.gameModal.style.display = 'flex';
        this.gameModal.classList.add('active');
        

        // Загружаем основные файлы игры и запускаем
        this.loadAndStartGame();

    }

    // Инициализация canvas для игры
    initGameCanvas() {

        // Найдем canvas для игры
        const canvas = document.getElementById('tournamentGameCanvas');
        if (!canvas) {
            Logger.error('❌ Tournament game canvas not found');
            return;
        }

        // Устанавливаем размеры canvas (логические размеры для игры)
        canvas.width = 800;
        canvas.height = 600;

        // Настраиваем контекст
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Очищаем canvas
            ctx.fillStyle = '#001122';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Добавляем текст загрузки
            ctx.fillStyle = '#00ddff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎮 Loading Tournament Game...', canvas.width / 2, canvas.height / 2);
            
            
            // Устанавливаем глобальную переменную для игры
            window.tournamentCanvas = canvas;
            window.tournamentCtx = ctx;
        }

    }
    
    // Загрузить основные файлы игры и запустить
    loadAndStartGame() {
        // Проверяем, загружены ли основные функции игры

        // Пробуем разные варианты запуска игры
        if (typeof window.startGame === 'function') {
            this.initGameCanvas();
            setTimeout(() => window.startGame(), 100);
            return;
        }

        if (typeof window.actuallyStartGame === 'function') {
            this.initGameCanvas();
            setTimeout(() => window.actuallyStartGame(), 100);
            return;
        }

        // Проверяем доступные функции игры
        const gameFunctions = Object.keys(window).filter(key =>
            key.toLowerCase().includes('game') ||
            key.toLowerCase().includes('start') ||
            key.toLowerCase().includes('init')
        );


        // Если ничего не найдено, выводим детальную информацию
        Logger.error('❌ Game files not properly loaded. Available functions:', gameFunctions);
        this.showError('Game engine not available. Please check that all game scripts are loaded correctly.');
    }

    // Принудительно выйти из игры с завершением попытки
    forceExitGame() {
        
        // Получаем текущий счет из игры
        let currentScore = 0;
        const scoreEl = document.getElementById('gameScore');
        if (scoreEl) {
            currentScore = parseInt(scoreEl.textContent) || 0;
        }
        
        // Завершаем попытку с текущим счетом
        const gameResult = {
            score: currentScore,
            level: 1,
            lives: 0,
            duration: Date.now() - (window.gameStartTime || Date.now()),
            timestamp: Date.now(),
            forceExit: true
        };
        
        
        // Отправляем результат
        if (window.tournamentLobby && typeof window.tournamentLobby.submitGameScore === 'function') {
            window.tournamentLobby.submitGameScore(gameResult.score);
        }
        
        // Закрываем игру
        this.closeGame();
    }

    // Закрыть игру
    closeGame() {
        // Предотвращаем множественные вызовы
        if (this.isClosing) {
            return;
        }
        this.isClosing = true;

        // Принудительно скрываем модальное окно
        this.gameModal.style.display = 'none';
        this.gameModal.classList.remove('active');

        // Скрываем внешнюю панель бустов
        if (this.boostPanel) {
            this.boostPanel.style.display = 'none';
            this.boostPanel.classList.remove('show');
        }

        if (this.game) {
            this.game.destroy();
            this.game = null;
        }

        // ДОПОЛНИТЕЛЬНО: Убираем все возможные game over экраны
        const gameOverScreens = document.querySelectorAll('#tournament-game-over, .tournament-game-over');
        gameOverScreens.forEach(screen => {
            screen.style.display = 'none';
            screen.remove();
        });


        // Очищаем добавленные кнопки при закрытии
        const backBtn = document.getElementById('backToTournamentBtn');
        if (backBtn && backBtn.parentNode) {
            backBtn.remove();
        }

        // Показываем обратно стандартную кнопку закрытия
        const closeBtn = document.querySelector('.close-game-btn');
        if (closeBtn) {
            closeBtn.style.display = 'block';
        }


        // Очищаем таймеры
        if (this.closeGameTimer) {
            clearTimeout(this.closeGameTimer);
            this.closeGameTimer = null;
        }

        // Сбрасываем флаги через небольшую задержку
        setTimeout(() => {
            this.isClosing = false;
            this.gameOverProcessed = false;
        }, 500);
    }

    // Обработка окончания игры
    handleGameOver(gameResult) {
        // Защита от множественных вызовов
        if (this.gameOverProcessed) {
            return;
        }
        this.gameOverProcessed = true;
        
        // ⚡ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Увеличиваем попытки при КАЖДОЙ игре
        if (window.tournamentLobby && window.tournamentLobby.walletConnector && window.tournamentLobby.walletConnector.connected) {
            const currentAttempts = window.tournamentLobby.playerAttempts || 0;
            window.tournamentLobby.playerAttempts = currentAttempts + 1;
            
            // Сохраняем в localStorage
            const attemptKey = `tournament_${window.tournamentLobby.currentTournamentId}_attempts_${window.tournamentLobby.walletConnector.account}`;
            localStorage.setItem(attemptKey, window.tournamentLobby.playerAttempts.toString());
        }

        // Автоматически отправляем результат
        if (window.tournamentLobby && typeof window.tournamentLobby.submitGameScore === 'function') {
            window.tournamentLobby.submitGameScore(gameResult.score);
        }

        // Получаем актуальное количество попыток ПОСЛЕ отправки счета
        setTimeout(() => {
            let attempts = 0;
            if (window.tournamentLobby && window.tournamentLobby.storage &&
                window.tournamentLobby.walletConnector && window.tournamentLobby.walletConnector.connected) {
                attempts = window.tournamentLobby.storage.getPlayerAttempts(window.tournamentLobby.walletConnector.account);
            }


            if (attempts >= 3) {
                this.addBackToTournamentButton();
            } else {
                
                // Защита от множественных таймеров закрытия
                if (this.closeGameTimer) {
                    clearTimeout(this.closeGameTimer);
                }
                this.closeGameTimer = setTimeout(() => {
                    this.closeGame();
                }, 3000);
            }
        }, 1000);
    }

    // ========== УВЕДОМЛЕНИЯ ==========

    // Показать уведомление
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `tournament-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${TournamentUtils.escapeHtml(message)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✖</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 100);

        // Автоудаление
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        this.notifications.push(notification);
    }

    // Получить иконку уведомления
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    // Показать ошибку
    showError(message) {
        this.showNotification(message, 'error');
        Logger.error('🚨 UI Error:', message);
    }

    // Показать успех
    showSuccess(message) {
        // Отключено: не показывать success уведомления
        return;
    }

    // Показать предупреждение
    showWarning(message) {
        this.showNotification(message, 'warning');
        Logger.warn('⚠️ UI Warning:', message);
    }

    // ========== УТИЛИТЫ ==========

    // Показать загрузку
    showLoading(message = 'Loading...') {
        // Удаляем предыдущую загрузку
        this.hideLoading();

        const loading = document.createElement('div');
        loading.id = 'tournament-loading';
        loading.className = 'tournament-loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${TournamentUtils.escapeHtml(message)}</p>
            </div>
        `;

        document.body.appendChild(loading);
        setTimeout(() => loading.classList.add('show'), 100);
    }

    // Скрыть загрузку
    hideLoading() {
        const loading = document.getElementById('tournament-loading');
        if (loading) {
            loading.classList.remove('show');
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }, 300);
        }
    }

    // Обновить все элементы интерфейса
    updateAll(data) {
        if (data.tournamentInfo) {
            this.updateTournamentInfo(data.tournamentInfo);
            this.updatePrizePool(data.tournamentInfo.prizePool);
        }

        if (data.userStatus) {
            this.updateUserStatus(data.userStatus);
            this.updateAttemptIndicators(data.userStatus.attempts);
        }

        if (data.tournamentStatus) {
            this.updateTournamentStatus(data.tournamentStatus, data.timeRemaining);
        }

        if (data.leaderboard) {
            this.updateLeaderboard(data.leaderboard);
        }

        if (data.showAdminPanel !== undefined) {
            this.showAdminPanel(data.showAdminPanel);
        }
    }

    // Получить состояние UI
    getState() {
        return {
            gameModalOpen: this.gameModal && this.gameModal.classList.contains('active'),
            gameActive: this.game !== null,
            elementsLoaded: Object.keys(this.elements).length > 0,
            notificationsCount: this.notifications.length,
            timersActive: Object.keys(this.timers).length
        };
    }

    // Очистка ресурсов
    cleanup() {
        // Очищаем таймеры
        Object.values(this.timers).forEach(timer => clearInterval(timer));
        this.timers = {};

        // Удаляем уведомления
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.notifications = [];

        // Закрываем игру
        if (this.game) {
            this.closeGame();
        }

    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ АДАПТЕРА ==========

    // Получить данные турнира
    getTournamentData() {
        // Пытаемся получить данные из localStorage
        const savedData = localStorage.getItem('tournamentMode');
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (error) {
                Logger.error('❌ Error parsing tournament data:', error);
            }
        }

        // Альтернативно берем из lobby
        if (window.tournamentLobby) {
            const lobby = window.tournamentLobby;
            const attempts = lobby.getUserAttempts ? lobby.getUserAttempts() : 0;

            return {
                tournamentId: lobby.currentTournamentId || 1,
                attempt: attempts + 1,
                maxAttempts: 3,
                playerAddress: lobby.walletConnector?.account
            };
        }

        // Дефолтные данные
        return {
            tournamentId: 1,
            attempt: 1,
            maxAttempts: 3,
            playerAddress: null
        };
    }

    // Инъекция стилей
    injectStyles() {
        if (document.getElementById('tournament-ui-styles')) return;

        const style = document.createElement('style');
        style.id = 'tournament-ui-styles';
        style.textContent = `
            /* Tournament Game Modal */
            .tournament-game-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }

            .tournament-game-modal.active {
                display: flex;
            }

            .game-modal-content {
                position: relative;
                background: linear-gradient(135deg, rgba(0, 17, 34, 0.95) 0%, rgba(0, 51, 102, 0.9) 100%);
                border: 3px solid #ffd700;
                border-radius: 20px;
                padding: 15px;
                box-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
                width: 850px;
                height: 750px;
                max-width: 95vw;
                max-height: 95vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .game-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                color: #ffd700;
                flex-shrink: 0;
            }
            
            #tournamentGameCanvas {
                width: 800px;
                height: 600px;
                border: 2px solid #ffd700;
                border-radius: 10px;
                background: #001122;
                display: block;
                margin: 0 auto;
                flex-shrink: 0;
            }

            .close-game-btn {
                background: #ff4444;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                font-size: 16px;
            }

            .close-game-btn:hover {
                background: #ff6666;
            }

            .game-ui {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
                padding: 8px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                flex-shrink: 0;
            }

            .game-stats span {
                margin-right: 20px;
                color: #00ddff;
                font-weight: bold;
            }

            .game-controls button {
                margin-left: 10px;
                background: #007acc;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }

            .game-controls button:hover {
                background: #0099ff;
            }

            /* Notifications */
            .tournament-notification {
                position: fixed;
                top: 20px;
                right: -400px;
                width: 350px;
                z-index: 10001;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: right 0.3s ease-out;
            }

            .tournament-notification.show {
                right: 20px;
            }

            .notification-content {
                display: flex;
                align-items: center;
                padding: 15px;
                color: white;
                font-weight: bold;
            }

            .notification-success .notification-content {
                background: linear-gradient(135deg, #4caf50, #45a049);
            }

            .notification-error .notification-content {
                background: linear-gradient(135deg, #f44336, #d32f2f);
            }

            .notification-warning .notification-content {
                background: linear-gradient(135deg, #ff9800, #f57c00);
            }

            .notification-info .notification-content {
                background: linear-gradient(135deg, #2196f3, #1976d2);
            }

            .notification-icon {
                font-size: 20px;
                margin-right: 10px;
            }

            .notification-message {
                flex: 1;
            }

            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
                opacity: 0.7;
            }

            .notification-close:hover {
                opacity: 1;
            }

            /* Loading */
            .tournament-loading-overlay {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10002;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .tournament-loading-overlay.show {
                opacity: 1;
            }

            .loading-content {
                text-align: center;
                color: white;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #ffd700;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            }

            .loading-message {
                font-size: 18px;
                font-weight: bold;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Attempt indicators */
            .attempt-dot {
                display: inline-block;
                margin: 0 5px;
                font-size: 20px;
            }

            .attempt-dot.attempt-used {
                opacity: 1;
            }

            .attempt-dot.attempt-available {
                opacity: 0.5;
            }

            /* Tournament status */
            .tournament-status {
                padding: 10px;
                border-radius: 8px;
                font-weight: bold;
                text-align: center;
            }

            .tournament-status.ACTIVE {
                background: rgba(76, 175, 80, 0.2);
                color: #4caf50;
                border: 2px solid #4caf50;
            }

            .tournament-status.TIME_EXPIRED {
                background: rgba(255, 152, 0, 0.2);
                color: #ff9800;
                border: 2px solid #ff9800;
            }

            .tournament-status.ENDED {
                background: rgba(244, 67, 54, 0.2);
                color: #f44336;
                border: 2px solid #f44336;
            }

            .tournament-status.NOT_STARTED {
                background: rgba(158, 158, 158, 0.2);
                color: #9e9e9e;
                border: 2px solid #9e9e9e;
            }

            /* Timer warning */
            .warning {
                color: #ff4444 !important;
                animation: pulse 1s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Responsive */
            @media (max-width: 900px) {
                .game-modal-content {
                    margin: 5px;
                    padding: 10px;
                    width: calc(100vw - 20px);
                    height: calc(100vh - 20px);
                    overflow: hidden;
                }

                #tournamentGameCanvas {
                    width: calc(100vw - 60px);
                    height: calc((100vw - 60px) * 0.75);
                    max-width: 750px;
                    max-height: 500px;
                    border: 2px solid #ffd700;
                    border-radius: 10px;
                    background: #001122;
                    display: block;
                    margin: 0 auto;
                }

                .game-ui {
                    flex-direction: column;
                    gap: 5px;
                    padding: 5px;
                }

                .tournament-notification {
                    width: calc(100vw - 40px);
                    right: -100vw;
                }

                .tournament-notification.show {
                    right: 20px;
                }
            }

            /* Tournament Boost Panel - External (outside modal) */
            .tournament-boost-panel-external {
                position: fixed;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.95));
                border: 2px solid #00ddff;
                border-radius: 12px;
                padding: 0;
                box-shadow: 0 0 20px rgba(0, 221, 255, 0.3);
                backdrop-filter: blur(10px);
                min-width: 200px;
                max-width: 250px;
                min-height: 40px;
                opacity: 0;
                max-height: 0;
                overflow: hidden;
                transition: all 0.3s ease;
                z-index: 10001;
                display: none;
            }

            .tournament-boost-panel-external.show {
                opacity: 1;
                max-height: 600px;
                padding: 12px;
            }

            .boost-panel-header {
                text-align: center;
                color: #00ddff;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .boost-panel-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 500px;
                overflow-y: auto;
            }

            .boost-item {
                background: rgba(0, 221, 255, 0.1);
                border: 1px solid #00ddff;
                border-radius: 8px;
                padding: 8px;
                width: 100%;
                text-align: center;
                backdrop-filter: blur(5px);
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            .boost-item:hover {
                background: rgba(0, 221, 255, 0.2);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 221, 255, 0.4);
            }

            .boost-name {
                color: #00ff88;
                font-size: 12px;
                font-weight: bold;
                display: block;
                margin-bottom: 2px;
            }

            .boost-timer {
                color: #66ccff;
                font-size: 11px;
                display: block;
            }

            .boost-progress {
                width: 100%;
                height: 3px;
                background: rgba(0, 221, 255, 0.2);
                border-radius: 2px;
                margin-top: 4px;
                overflow: hidden;
            }

            .boost-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #00ff88, #00ddff);
                border-radius: 2px;
                transition: width 0.1s ease;
            }

            .boost-progress-bar.critical {
                background: linear-gradient(90deg, #ff4444, #ff8800);
                animation: criticalPulse 0.5s ease-in-out infinite alternate;
            }

            @keyframes criticalPulse {
                from { opacity: 0.7; }
                to { opacity: 1; }
            }

            /* Стили для различных типов бонусов */
            .boost-item[data-boost="RAPID_FIRE"] { border-color: #ffff00; }
            .boost-item[data-boost="SHIELD_BARRIER"] { border-color: #0088ff; }
            .boost-item[data-boost="SCORE_MULTIPLIER"] { border-color: #ffd700; }
            .boost-item[data-boost="INVINCIBILITY"] { 
                border-color: #ff00ff; 
                background: linear-gradient(45deg, rgba(255, 0, 255, 0.1), rgba(0, 255, 255, 0.1));
            }
        `;

        document.head.appendChild(style);
    }

    // Создать фоллбек Web3 объект для расчетов
    createWeb3Fallback() {
        return {
            utils: {
                fromWei: (value, unit) => {
                    if (unit === 'ether') {
                        return (parseFloat(value) / 1e18).toString();
                    }
                    return value;
                },
                toBN: (value) => {
                    const num = parseFloat(value);
                    return {
                        mul: (other) => ({
                            div: (divisor) => Math.floor(num * parseFloat(other.toString()) / parseFloat(divisor.toString())).toString()
                        }),
                        sub: (other) => (num - parseFloat(other.toString())).toString(),
                        toString: () => Math.floor(num).toString()
                    };
                }
            }
        };
    }
}

// Создаем глобальный экземпляр
window.tournamentUI = new TournamentUI();

// ЭКСТРЕННАЯ ФУНКЦИЯ ПОЛНОЙ ОЧИСТКИ
window.emergencyCleanup = function() {
    
    // 1. Останавливаем все игровые циклы
    if (typeof window.stopGame === 'function') window.stopGame();
    window.gameRunning = false;
    window.gameActive = false;
    window.gamePaused = true;
    
    // 2. Очищаем все интервалы и таймеры
    if (window.gameInterval) { clearInterval(window.gameInterval); window.gameInterval = null; }
    if (window.gameLoopId) { cancelAnimationFrame(window.gameLoopId); window.gameLoopId = null; }
    if (window.bossSystemInterval) { clearInterval(window.bossSystemInterval); window.bossSystemInterval = null; }
    if (window.animationId) { cancelAnimationFrame(window.animationId); window.animationId = null; }
    
    // 3. Удаляем только Game Over экраны, НЕ основное модальное окно
    const gameOverScreens = document.querySelectorAll(`
        #tournament-game-over,
        .tournament-game-over,
        [id*="game-over"],
        [class*="game-over"]
    `);
    
    gameOverScreens.forEach(screen => {
        screen.style.display = 'none';
        screen.remove();
    });
    
    // 4. Скрываем основное модальное окно, но НЕ удаляем
    const tournamentModal = document.querySelector('.tournament-game-modal');
    if (tournamentModal) {
        tournamentModal.style.display = 'none';
        tournamentModal.classList.remove('active');
    }
    
    // 5. Деактивируем Tournament Adapter
    if (window.tournamentAdapter) {
        window.tournamentAdapter.deactivate();
    }
    
};

// ========== DEBUG И ТЕСТИРОВАНИЕ ==========

// Debug функции для тестирования адаптера
window.debugTournamentUI = {
    // Тест адаптера
    testAdapter: () => {

        if (!window.tournamentAdapter) {
            Logger.error('❌ Tournament Adapter not found');
            return;
        }

        const testData = {
            tournamentId: 999,
            attempt: 1,
            maxAttempts: 3,
            playerAddress: '0x1234567890123456789012345678901234567890'
        };

        const testCallbacks = {
        };

        window.tournamentAdapter.activate(testData, testCallbacks);

        // Показываем статус
        setTimeout(() => {
        }, 1000);
    },

    // Деактивировать адаптер
    deactivateAdapter: () => {
        if (window.tournamentAdapter) {
            window.tournamentAdapter.deactivate();
        }
    },

    // Тест открытия игры
    testGameOpen: () => {
        if (window.tournamentUI) {
            window.tournamentUI.openGame();
        }
    },

    // Симуляция результата игры
    simulateGameOver: (score = 12345) => {

        const gameResult = {
            score: score,
            level: 5,
            lives: 0,
            duration: 180000,
            timestamp: Date.now()
        };

        if (window.tournamentUI) {
            window.tournamentUI.handleGameOver(gameResult);
        }
    },

    // Получить статус всех компонентов
    getSystemStatus: () => {
        const status = {
            tournamentUI: typeof window.tournamentUI !== 'undefined',
            tournamentAdapter: typeof window.tournamentAdapter !== 'undefined',
            tournamentLobby: typeof window.tournamentLobby !== 'undefined',
            gameLoaded: typeof window.startGame === 'function',
            adapterStatus: window.tournamentAdapter ? window.tournamentAdapter.getStatus() : null
        };

        return status;
    }
};

