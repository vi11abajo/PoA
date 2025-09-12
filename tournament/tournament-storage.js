// 🏆 PHAROS INVADERS - TOURNAMENT LOBBY (исправленный)
// Основное управление турнирным лобби с ПРАВИЛЬНЫМ подсчетом попыток

class TournamentLobby {
    constructor() {
        this.walletConnector = null;
        this.currentTournamentId = 1;
        this.currentTournamentStatus = 'not-started';
        this.currentUserStatus = 'disconnected';
        this.isRegistering = false;
        this.updateInterval = null;
        this.timerInterval = null;

        // Инициализируем зависимости
        this.leaderboard = null;
        this.storage = null;

    }

    // Инициализация лобби
    async init() {
        try {

            // Ждем немного для загрузки других скриптов
            await this.sleep(1000);

            // Инициализируем зависимости
            this.initDependencies();

            // Инициализируем компоненты
            this.initWalletConnector();
            this.setupUI();
            this.startUpdateLoop();


        } catch (error) {
            Logger.error('❌ Failed to initialize Tournament Lobby:', error);
            this.showError('Failed to initialize tournament system. Please refresh the page.');
        }
    }

    // Инициализация зависимостей
    initDependencies() {
        try {
            // Инициализируем TournamentLeaderboard
            if (typeof TournamentLeaderboard !== 'undefined') {
                this.leaderboard = new TournamentLeaderboard(this.currentTournamentId);
            } else {
                Logger.error('❌ TournamentLeaderboard not found');
            }

            // Инициализируем TournamentStorage
            if (typeof TournamentStorage !== 'undefined') {
                this.storage = new TournamentStorage(this.currentTournamentId);
            } else {
                Logger.error('❌ TournamentStorage not found');
            }
        } catch (error) {
            Logger.error('❌ Failed to initialize dependencies:', error);
        }
    }

    // Инициализация кошелька
    initWalletConnector() {
        if (window.tournamentWalletConnector) {
            this.walletConnector = window.tournamentWalletConnector;
        } else {
        }
    }

    // Настройка UI
    setupUI() {
        this.updateBasicInfo();
        this.setupButtons();
    }

    // Обновление базовой информации
    updateBasicInfo() {
        const tournamentIdEl = document.getElementById('tournamentId');
        if (tournamentIdEl) {
            tournamentIdEl.textContent = `#${this.currentTournamentId}`;
        }

        const entryFeeEl = document.getElementById('entryFee');
        if (entryFeeEl) {
            entryFeeEl.textContent = `${TOURNAMENT_CONFIG.ENTRY_FEE} PHRS`;
        }

        const participantCountEl = document.getElementById('participantCount');
        if (participantCountEl) {
            participantCountEl.textContent = '0';
        }

        const totalPrizeEl = document.getElementById('totalPrize');
        if (totalPrizeEl) {
            totalPrizeEl.textContent = '0 PHRS';
        }
    }

    // Настройка кнопок
    setupButtons() {
        const registerButton = document.getElementById('registerButton');
        const playButton = document.getElementById('playButton');

        if (registerButton) {
            registerButton.onclick = () => this.handleRegisterForTournament();
        }

        if (playButton) {
            playButton.onclick = () => this.handlePlayTournamentGame();
            playButton.disabled = true;
        }

        this.checkAdminStatus();
        this.updateButtonStates();
    }

    // Проверка админского статуса
    checkAdminStatus() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;

        if (this.walletConnector && this.walletConnector.connected) {
            const isAdmin = TOURNAMENT_CONFIG.isAdmin(this.walletConnector.account);
            adminPanel.style.display = isAdmin ? 'block' : 'none';

            if (isAdmin) {
            }
        }
    }

    // Обработка подключения кошелька
    onWalletConnected(account) {

        this.updateUserStatus('connected');
        this.checkAdminStatus();
    }

    // Обработка отключения кошелька
    onWalletDisconnected() {

        this.updateUserStatus('disconnected');

        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }

    // 🔥 ИСПРАВЛЕНО: Обработка регистрации в турнире
    async handleRegisterForTournament() {
        try {
            if (!this.walletConnector || !this.walletConnector.connected) {
                this.showError('Please connect your wallet first');
                return;
            }

            this.showLoading('Registering for tournament...');

            // Симуляция регистрации
            await this.sleep(2000);

            this.hideLoading();
            this.showSuccess('Successfully registered for tournament!');

            this.updateUserStatus('registered');

            // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Полная очистка данных при регистрации
            if (this.storage) {
                this.storage.clearPlayerDataOnRegistration(this.walletConnector.account);
            }
            this.resetAttemptIndicators();

        } catch (error) {
            this.hideLoading();
            Logger.error('Registration error:', error);
            this.showError('Failed to register: ' + error.message);
        }
    }

    // Начать турнирную игру
    handlePlayTournamentGame() {
        if (!this.walletConnector || !this.walletConnector.connected) {
            this.showError('Please connect your wallet first');
            return;
        }

  if (this.storage && !this.storage.canPlayerPlay(this.walletConnector.account)) {
    this.showError('You have used all 3 attempts for this tournament');
    return;
}

        // Открываем игру через UI
        if (window.tournamentUI) {
            window.tournamentUI.openGame();
        } else {
            this.showError('Game UI not available');
        }
    }

    // 🔥 ИСПРАВЛЕНО: Отправка результата игры
    async submitGameScore(score, playerName = null) {
        try {

            if (!this.walletConnector || !this.walletConnector.connected) {
                throw new Error('Wallet not connected');
            }

            // Валидация счета
            if (typeof score !== 'number' || score < 0 || score > 445000) {
                throw new Error('Invalid score');
            }

            this.showLoading('Submitting score...');

            // Симуляция отправки счета в блокчейн
            await this.sleep(2000);

            // 🔥 ИСПРАВЛЕНО: Правильная последовательность обновлений
            // 1. Сначала увеличиваем попытки в storage
            if (this.storage) {
                this.storage.incrementPlayerAttempts(this.walletConnector.account);
                this.storage.updateUserLastGame(this.walletConnector.account, score);
            }

            // 2. Затем добавляем результат в лидерборд (БЕЗ увеличения попыток там)
            if (this.leaderboard) {
                this.leaderboard.addPlayerScore(this.walletConnector.account, score, playerName);
            }

            this.hideLoading();
            this.showSuccess(`Score ${score} submitted successfully!`);

            // 3. Обновляем UI
            this.updateAttemptIndicators();
            this.updateLeaderboard();

        } catch (error) {
            this.hideLoading();
            Logger.error('Score submission error:', error);
            this.showError('Failed to submit score: ' + error.message);
        }
    }

    // Начать турнир (админ функция)
    async handleStartTournament() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Starting tournament...');
            await this.sleep(2000);

            this.hideLoading();
            this.showSuccess('Tournament started!');

            this.currentTournamentStatus = 'active';
            this.updateTournamentStatus('active');
            this.updateButtonStates();

            // Сохраняем статус в storage
            if (this.storage) {
                this.storage.saveTournamentStatus('active');
            }

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to start tournament: ' + error.message);
        }
    }

    // Завершить турнир (админ функция)
    async handleEndTournament() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Ending tournament...');
            await this.sleep(2000);

            this.hideLoading();
            this.showSuccess('Tournament ended and prizes distributed!');

            this.currentTournamentStatus = 'ended';
            this.updateTournamentStatus('ended');
            this.updateButtonStates();

            // Сохраняем статус в storage
            if (this.storage) {
                this.storage.saveTournamentStatus('ended');
            }

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to end tournament: ' + error.message);
        }
    }

    // Проверка админских прав
    isAdmin() {
        return this.walletConnector &&
               this.walletConnector.connected &&
               TOURNAMENT_CONFIG.isAdmin(this.walletConnector.account);
    }

    // Обновление статуса пользователя
    updateUserStatus(status) {
        Logger.debug('Call stack for updateUserStatus');

        if (typeof status === 'object') {
            Logger.error('🚨 CRITICAL: OBJECT FOUND! Source must be fixed!');
            alert('DEVELOPMENT ERROR: Object passed to updateUserStatus! Check console for details.');
            return;
        }

        if (typeof status !== 'string') {
            Logger.error('❌ CRITICAL: Not a string:', status);
            return;
        }

        const oldStatus = this.currentUserStatus;
        this.currentUserStatus = status;

        console.log('User status changed:', {
            from: oldStatus,
            to: status,
            currentTournamentStatus: this.currentTournamentStatus
        });

        setTimeout(() => {
            this.updateButtonStates();
        }, 100);
    }

    // Обновление состояния кнопок
    updateButtonStates() {
        const registerButton = document.getElementById('registerButton');
        const playButton = document.getElementById('playButton');

        if (!registerButton || !playButton) {
            return;
        }

        const walletConnected = this.walletConnector && this.walletConnector.connected;
        const tournamentStarted = this.currentTournamentStatus === 'active';
        const isRegistered = this.currentUserStatus === 'registered';

        console.log('Updating button states:', {
            walletConnected,
            tournamentStarted,
            isRegistered,
            currentUserStatus: this.currentUserStatus,
            currentTournamentStatus: this.currentTournamentStatus
        });

        // Логика кнопки регистрации
        if (isRegistered) {
            registerButton.textContent = 'Registered';
            registerButton.disabled = true;
            registerButton.className = 'action-button';
        } else if (!walletConnected && !tournamentStarted) {
            registerButton.textContent = 'Tournament Not Started';
            registerButton.disabled = true;
            registerButton.className = 'action-button';
        } else if (!walletConnected && tournamentStarted) {
            registerButton.textContent = 'Connect Wallet to Register';
            registerButton.disabled = false;
            registerButton.className = 'action-button';
        } else if (walletConnected && !tournamentStarted) {
            registerButton.textContent = 'Tournament Not Started';
            registerButton.disabled = true;
            registerButton.className = 'action-button';
        } else if (walletConnected && tournamentStarted) {
            registerButton.textContent = 'Register for Tournament';
            registerButton.disabled = false;
            registerButton.className = 'action-button';
        }

        // 🔥 ИСПРАВЛЕНО: Логика кнопки игры с проверкой попыток
        const wasPlayButtonDisabled = playButton.disabled;
        let playButtonDisabled = !isRegistered;

        // Дополнительная проверка попыток если зарегистрирован
        if (isRegistered && this.storage && this.walletConnector && this.walletConnector.connected) {
            const canPlay = this.storage.canPlayerPlay(this.walletConnector.account);
            if (!canPlay) {
                playButtonDisabled = true;
                playButton.textContent = '🚫 No attempts left';
            } else {
                playButton.textContent = '🎮 Play Game';
            }
        }

        playButton.disabled = playButtonDisabled;
        playButton.className = 'action-button tournament-play';

        if (wasPlayButtonDisabled && !playButton.disabled) {
        }

        console.log('Button states updated:', {
            registerText: registerButton.textContent,
            registerDisabled: registerButton.disabled,
            playDisabled: playButton.disabled
        });
    }

    // Сброс индикаторов попыток
    resetAttemptIndicators() {

        const attemptIndicators = document.getElementById('attemptIndicators');
        if (!attemptIndicators) return;

        const dots = attemptIndicators.querySelectorAll('.attempt-dot');
        dots.forEach((dot, index) => {
            dot.className = 'attempt-dot';
        });

    }

    // 🔥 ИСПРАВЛЕНО: Обновление индикаторов попыток
    updateAttemptIndicators() {

        const attemptIndicators = document.getElementById('attemptIndicators');
        if (!attemptIndicators) return;

        // Получаем текущее количество попыток из storage
        let currentAttempts = 0;
        if (this.storage && this.walletConnector && this.walletConnector.connected) {
            currentAttempts = this.storage.getPlayerAttempts(this.walletConnector.account);
        }

        const dots = attemptIndicators.querySelectorAll('.attempt-dot');
        dots.forEach((dot, index) => {
            const attemptNumber = index + 1;

            dot.className = 'attempt-dot';

            if (attemptNumber <= currentAttempts) {
                dot.classList.add('completed');
            } else if (attemptNumber === currentAttempts + 1 && currentAttempts < 3) {
                dot.classList.add('current');
            }
        });


        // Если достигли лимита попыток, деактивируем кнопку игры
        if (currentAttempts >= 3) {
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.disabled = true;
                playButton.textContent = '🚫 No attempts left';
            }
        } else {
        }

        // Обновляем через tournament UI если доступно
        if (window.tournamentUI && typeof window.tournamentUI.updateAttemptIndicators === 'function') {
            window.tournamentUI.updateAttemptIndicators(currentAttempts);
        }
    }

    // Обновление статуса турнира
    updateTournamentStatus(status) {
        const statusEl = document.getElementById('tournamentStatus');
        const timerEl = document.getElementById('tournamentTimer');

        if (statusEl) {
            statusEl.className = `tournament-status ${status}`;

            switch (status) {
                case 'active':
                    statusEl.textContent = '✅ Tournament Active';
                    if (timerEl) timerEl.style.display = 'block';
                    this.startTimer();
                    break;
                case 'ended':
                    statusEl.textContent = '🏁 Tournament Ended';
                    if (timerEl) timerEl.style.display = 'none';
                    this.stopTimer();
                    break;
                default:
                    statusEl.textContent = '🚫 Tournament Not Started';
                    if (timerEl) timerEl.style.display = 'none';
                    break;
            }
        }
    }

    // Запуск таймера
    startTimer() {
        this.stopTimer();

        let timeRemaining = TOURNAMENT_CONFIG.TOURNAMENT_DURATION;

        this.timerInterval = setInterval(() => {
            timeRemaining--;

            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                const minutes = Math.floor(timeRemaining / 60);
                const seconds = timeRemaining % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                if (timeRemaining <= TOURNAMENT_CONFIG.WARNING_TIME_THRESHOLD) {
                    timerDisplay.classList.add('warning');
                }
            }

            if (timeRemaining <= 0) {
                this.stopTimer();
                this.updateTournamentStatus('ended');
                this.showError('Tournament time expired!');
            }
        }, 1000);
    }

    // Остановка таймера
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Запуск цикла обновлений
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.updateData();
        }, TOURNAMENT_CONFIG.AUTO_UPDATE_INTERVAL);

        this.updateData();
    }

    // Остановка цикла обновлений
    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Обновление данных
    async updateData() {
        try {
            this.checkWalletStatus();
            this.checkAdminStatus();
            this.updateLeaderboard();
        } catch (error) {
            Logger.error('Update error:', error);
        }
    }

    // Проверка статуса кошелька
    checkWalletStatus() {
        const walletButton = document.getElementById('walletButton');
        const walletStatus = document.getElementById('walletStatus');

        if (this.walletConnector && this.walletConnector.connected) {
            if (walletButton) {
                walletButton.classList.add('connected');
            }
            if (walletStatus) {
                const shortAddress = `${this.walletConnector.account.slice(0, 6)}...${this.walletConnector.account.slice(-4)}`;
                walletStatus.textContent = shortAddress;
            }

            if (this.currentUserStatus === 'disconnected') {
                this.updateUserStatus('connected');
            }
        } else {
            if (walletButton) {
                walletButton.classList.remove('connected');
            }
            if (walletStatus) {
                walletStatus.textContent = 'Connect Wallet';
            }

            if (this.currentUserStatus !== 'disconnected') {
                this.updateUserStatus('disconnected');
            }
        }
    }

    // Обновление лидерборда
    updateLeaderboard() {
        const leaderboardBody = document.getElementById('leaderboardBody');
        if (!leaderboardBody) return;

        if (this.leaderboard) {
            // Используем новый метод из TournamentLeaderboard
            const currentWallet = this.walletConnector && this.walletConnector.connected
                ? this.walletConnector.account : null;

            this.leaderboard.updateLeaderboardUI(leaderboardBody, {
                maxPlayers: TOURNAMENT_CONFIG.LEADERBOARD_MAX_ENTRIES || 100,
                currentWallet: currentWallet
            });

            // Обновляем счетчик участников
            const leaderboardData = this.leaderboard.getStoredLeaderboard();
            const participantCountEl = document.getElementById('participantCount');
            if (participantCountEl) {
                participantCountEl.textContent = leaderboardData.length.toString();
            }

            // Обновляем призовой фонд
            this.updatePrizeBreakdown(leaderboardData.length);
        }
    }

    // Обновление разбивки призового фонда
    updatePrizeBreakdown(participantCount) {
        const firstPrizeEl = document.getElementById('firstPrize');
        const secondPrizeEl = document.getElementById('secondPrize');
        const thirdPrizeEl = document.getElementById('thirdPrize');
        const totalPrizeEl = document.getElementById('totalPrize');

        if (firstPrizeEl && secondPrizeEl && thirdPrizeEl && totalPrizeEl) {
            const entryFee = parseFloat(TOURNAMENT_CONFIG.ENTRY_FEE);
            const totalPrize = entryFee * participantCount;

            totalPrizeEl.textContent = `${totalPrize.toFixed(3)} PHRS`;

            const firstPrize = (totalPrize * 0.60).toFixed(3);
            const secondPrize = (totalPrize * 0.25).toFixed(3);
            const thirdPrize = (totalPrize * 0.05).toFixed(3);

            firstPrizeEl.textContent = `${firstPrize} PHRS`;
            secondPrizeEl.textContent = `${secondPrize} PHRS`;
            thirdPrizeEl.textContent = `${thirdPrize} PHRS`;
        }
    }

    // УТИЛИТЫ

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'tournament-loading';
        loading.className = 'loading-indicator';
        loading.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('tournament-loading');
        if (loading && loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }
    }

    showError(message) {
        if (window.tournamentUI) {
            window.tournamentUI.showError(message);
        } else {
            alert('Error: ' + message);
        }
        Logger.error('Tournament Error:', message);
    }

    showSuccess(message) {
        if (window.tournamentUI) {
            window.tournamentUI.showSuccess(message);
        } else {
            alert('Success: ' + message);
        }
    }

    // Проверка здоровья системы
    healthCheck() {
        const status = {
            walletConnected: this.walletConnector && this.walletConnector.connected,
            leaderboardReady: this.leaderboard !== null,
            storageReady: this.storage !== null,
            tournamentManagerReady: typeof window.tournamentManager !== 'undefined',
            tournamentUIReady: typeof window.tournamentUI !== 'undefined',
            blockchainAccessible: typeof window.web3 !== 'undefined' || typeof window.Web3 !== 'undefined'
        };

        return status;
    }

    // Получение состояния лобби
    getState() {
        return {
            currentTournamentId: this.currentTournamentId,
            currentTournamentStatus: this.currentTournamentStatus,
            currentUserStatus: this.currentUserStatus,
            walletConnected: this.walletConnector && this.walletConnector.connected,
            updateLoopActive: this.updateInterval !== null,
            timerActive: this.timerInterval !== null,
            leaderboardReady: this.leaderboard !== null,
            storageReady: this.storage !== null
        };
    }

    // Очистка ресурсов
    destroy() {
        this.stopUpdateLoop();
        this.stopTimer();
    }
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ для HTML

window.handleWalletToggle = async function() {
    if (window.tournamentWalletConnector) {
        if (window.tournamentWalletConnector.connected) {
            await window.tournamentWalletConnector.disconnect();
        } else {
            await window.tournamentWalletConnector.showWalletModal();
        }
    } else {
        alert('Wallet connector not ready. Please refresh the page.');
    }
};

window.handleRegisterForTournament = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleRegisterForTournament();
    } else {
    }
};

window.handlePlayTournamentGame = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handlePlayTournamentGame();
    } else {
    }
};

window.handleStartTournament = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleStartTournament();
    } else {
    }
};

window.handleEndTournament = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleEndTournament();
    } else {
    }
};

// Создание глобального экземпляра
window.tournamentLobby = new TournamentLobby();

// Автоматическая инициализация при загрузке страницы
window.addEventListener('load', async () => {

    try {
        await window.tournamentLobby.init();

        setTimeout(() => {
            const health = window.tournamentLobby.healthCheck();
            if (health.walletConnected && health.tournamentManagerReady) {
            } else {
            }
        }, 2000);

    } catch (error) {
        Logger.error('❌ Failed to initialize tournament lobby:', error);
    }
});

// 🔥 ИСПРАВЛЕННЫЕ Debug функции
window.debugTournamentLobby = {
    getState: () => window.tournamentLobby.getState(),
    healthCheck: () => window.tournamentLobby.healthCheck(),
    forceUpdate: () => window.tournamentLobby.updateData(),

    mockRegister: () => {
        window.tournamentLobby.updateUserStatus('registered');
    },

    mockConnect: () => {
        window.tournamentLobby.updateUserStatus('connected');
    },

    mockDisconnect: () => {
        window.tournamentLobby.updateUserStatus('disconnected');
    },

    // 🔥 ИСПРАВЛЕНО: Тест с правильным подсчетом попыток
    addTestScore: (score, playerName) => {
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            return;
        }
        window.tournamentLobby.submitGameScore(score, playerName);
    },

    getLeaderboard: () => {
        if (window.tournamentLobby.leaderboard) {
            const leaderboard = window.tournamentLobby.leaderboard.getStoredLeaderboard();
            return leaderboard;
        }
        return null;
    },

    clearLeaderboard: () => {
        if (window.tournamentLobby.leaderboard) {
            window.tournamentLobby.leaderboard.clearLeaderboard();
            window.tournamentLobby.updateLeaderboard();
        }
    },

    getPlayerStats: () => {
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            return null;
        }
        if (window.tournamentLobby.leaderboard) {
            const stats = window.tournamentLobby.leaderboard.getPlayerStats(window.tournamentLobby.walletConnector.account);
            return stats;
        }
        return null;
    },

    // 🔥 НОВЫЕ debug функции для storage
    getStorageStats: () => {
        if (window.tournamentLobby.storage) {
            const stats = window.tournamentLobby.storage.getStorageStats();
            return stats;
        }
        return null;
    },

    getPlayerAttempts: () => {
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            return 0;
        }
        if (window.tournamentLobby.storage) {
            const attempts = window.tournamentLobby.storage.getPlayerAttempts();
            return attempts;
        }
        return 0;
    },

    resetPlayerAttempts: () => {
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            return;
        }
        if (window.tournamentLobby.storage) {
            window.tournamentLobby.storage.resetPlayerAttempts();
            window.tournamentLobby.updateAttemptIndicators();
        }
    },

    clearAllData: () => {
        if (window.tournamentLobby.storage) {
            window.tournamentLobby.storage.clearAllTournamentData();
        }
        if (window.tournamentLobby.leaderboard) {
            window.tournamentLobby.leaderboard.clearLeaderboard();
        }
        window.tournamentLobby.updateLeaderboard();
    },

    simulateGame: (finalScore) => {
        const score = finalScore || Math.floor(Math.random() * 10000) + 1000;
        window.tournamentLobby.submitGameScore(score, `Player${Date.now()}`);
    },

    // Тест полного цикла регистрации
    testRegistrationFlow: () => {

        // 1. Подключаем кошелек
        window.debugTournamentLobby.mockConnect();

        // 2. Ждем и регистрируемся
        setTimeout(() => {
            window.debugTournamentLobby.mockRegister();
        }, 1000);

        // 3. Проверяем что попытки сброшены
        setTimeout(() => {
            const attempts = window.debugTournamentLobby.getPlayerAttempts();
        }, 2000);
    },

    // Симуляция 3 игр подряд
    testFullGameFlow: async () => {

        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            window.debugTournamentLobby.mockConnect();
            await new Promise(resolve => setTimeout(resolve, 500));
            window.debugTournamentLobby.mockRegister();
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Играем 3 игры
        for (let i = 1; i <= 3; i++) {
            const score = Math.floor(Math.random() * 5000) + 1000;
            window.tournamentLobby.submitGameScore(score, `TestPlayer`);

            // Ждем между играми
            if (i < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Проверяем что попытки исчерпаны
        setTimeout(() => {
            const attempts = window.debugTournamentLobby.getPlayerAttempts();

            const canPlay = window.tournamentLobby.storage.canPlayerPlay();
        }, 1500);
    }
};

