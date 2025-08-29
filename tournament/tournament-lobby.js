// 🏆 PHAROS INVADERS - TOURNAMENT LOBBY
// ⚡ ТОЛЬКО БЛОКЧЕЙН РЕЖИМ - NO LOCAL FALLBACKS FOREVER! ⚡
// 🚀 Работает ИСКЛЮЧИТЕЛЬНО с смарт-контрактами Pharos Testnet
// 🔒 Все данные, попытки, регистрации и счета ТОЛЬКО через blockchain

class TournamentLobby {
    constructor() {
        this.walletConnector = null;
        this.currentTournamentId = 1;
        this.currentTournamentStatus = 'NOT_STARTED';
        this.currentUserStatus = 'disconnected';
        this.isRegistering = false;
        this.updateInterval = null;
        this.timerInterval = null;

        // Инициализируем зависимости
        this.leaderboard = null;
        this.storage = null;

        // Tournament monitoring
        this.tournamentMonitorInterval = null;
        this.isMonitoringActive = false;
        this.lastCheckedTournaments = new Set();
        
        // 🛠️ Централизованное управление таймерами (предотвращение утечек памяти)
        this.timers = {
            intervals: new Map(),      // именованные интервалы
            timeouts: new Set(),       // все timeout'ы
            updateLoop: null,          // основной цикл обновления
            monitoring: null           // мониторинг турниров
        };
        
        // ⚡ Локальные попытки для случаев, когда счет не улучшен
        this.playerAttempts = 0;
        this.playerRegistered = false;

    }

    // 🛠️ БЕЗОПАСНЫЕ МЕТОДЫ УПРАВЛЕНИЯ ТАЙМЕРАМИ
    
    // Создать безопасный интервал с автоматической очисткой
    createSafeInterval(callback, delay, name) {
        // Очищаем старый интервал если есть
        if (this.timers.intervals.has(name)) {
            clearInterval(this.timers.intervals.get(name));
        }
        
        const intervalId = setInterval(callback, delay);
        this.timers.intervals.set(name, intervalId);
        console.log(`⏰ Created safe interval: ${name}`);
        return intervalId;
    }
    
    // Создать безопасный timeout с автоматическим отслеживанием
    createSafeTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            callback();
            // Автоматически удаляем из отслеживания после выполнения
            this.timers.timeouts.delete(timeoutId);
        }, delay);
        
        this.timers.timeouts.add(timeoutId);
        return timeoutId;
    }
    
    // Очистить конкретный интервал
    clearSafeInterval(name) {
        if (this.timers.intervals.has(name)) {
            clearInterval(this.timers.intervals.get(name));
            this.timers.intervals.delete(name);
            console.log(`🧹 Cleared safe interval: ${name}`);
        }
    }
    
    // Очистить все таймеры (предотвращение утечек)
    clearAllTimers() {
        // Очищаем все интервалы
        this.timers.intervals.forEach((intervalId, name) => {
            clearInterval(intervalId);
            console.log(`🧹 Cleared interval: ${name}`);
        });
        this.timers.intervals.clear();
        
        // Очищаем все timeout'ы
        this.timers.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.timers.timeouts.clear();
        
        // Очищаем старые переменные для совместимости
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.tournamentMonitorInterval) {
            clearInterval(this.tournamentMonitorInterval);
            this.tournamentMonitorInterval = null;
        }
        
        console.log('🧹 All timers cleared - no memory leaks!');
    }

    // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙН ПОДКЛЮЧЕНИЯ ⚡
    requireBlockchainConnection(operation = 'operation') {
        if (!this.walletConnector || !this.walletConnector.connected) {
            throw new Error(`🚫 ${operation} requires wallet connection! Tournament works ONLY with blockchain.`);
        }
        
        if (!window.tournamentManager || !window.tournamentManager.connected) {
            throw new Error(`🚫 ${operation} requires blockchain connection! Tournament works ONLY with smart contracts.`);
        }
        
        console.log(`✅ Blockchain connection verified for ${operation}`);
    }
// УДАЛЕНО: createFallbackStorage - только блокчейн, никаких fallback!
    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    // Инициализация лобби
async init() {
    try {
        console.log('🚀 Starting Tournament Lobby...');

        // ДОБАВЛЕНО: Очистка некорректных данных при инициализации
        const oldAttempts = parseInt(localStorage.getItem('tournament_attempts') || '0');
        if (oldAttempts > 3) {
            console.log(`🧹 Cleaning invalid attempts on init: ${oldAttempts} -> removed`);
            localStorage.removeItem('tournament_attempts');
        }

        // Ждем немного для загрузки других скриптов
        await this.sleep(1000);

        // Инициализируем зависимости
        await this.initDependencies();

        // Остальной код функции без изменений...
        this.initWalletConnector();
        this.setupUI();
        this.startUpdateLoop();

        console.log('✅ Tournament Lobby ready');

    } catch (error) {
        console.error('❌ Failed to initialize Tournament Lobby:', error);
        this.showError('Failed to initialize tournament system. Please refresh the page.');
    }
}

    // Инициализация зависимостей
async initDependencies() {
    try {
        console.log('🔧 Initializing dependencies...');

        // Проверяем доступность классов
        console.log('🔧 TournamentLeaderboard available:', typeof TournamentLeaderboard);
        console.log('🔧 TournamentStorage available:', typeof TournamentStorage);

        // Инициализируем TournamentLeaderboard
        if (typeof TournamentLeaderboard !== 'undefined') {
            this.leaderboard = new TournamentLeaderboard(this.currentTournamentId);
            console.log('✅ Tournament Leaderboard ready');
        } else {
            console.error('❌ TournamentLeaderboard not found');
        }

        // ИСПРАВЛЕНО: Упрощенная инициализация TournamentStorage
        if (typeof TournamentStorage !== 'undefined') {
            // Создаем экземпляр только если еще не создан
            if (!this.storage || typeof this.storage.getPlayerAttempts !== 'function') {
                this.storage = new TournamentStorage(this.currentTournamentId);
                console.log('✅ Tournament Storage created');
            }

            // Проверяем корректность методов
            if (this.storage && typeof this.storage.getPlayerAttempts === 'function') {
                console.log('✅ Storage methods verified');
            } else {
                console.error('❌ Storage object invalid');
                throw new Error('Storage methods not available');
            }

        } else {
            console.error('❌ TournamentStorage class not found');
            throw new Error('🚫 TournamentStorage class required - no local fallbacks! Tournament works ONLY with blockchain.');
        }

    } catch (error) {
        console.error('❌ Failed to initialize dependencies:', error);
        throw new Error('🚫 Dependencies failed to load - no local fallbacks! Tournament works ONLY with blockchain.');
    }
}
    // Инициализация кошелька
    initWalletConnector() {
        if (window.tournamentWalletConnector) {
            this.walletConnector = window.tournamentWalletConnector;
            console.log('✅ Tournament wallet connector ready');
        } else if (window.walletConnector) {
            this.walletConnector = window.walletConnector;
            console.log('✅ Main wallet connector ready');
        } else {
            console.log('⏳ Wallet connector not ready yet');
        }
    }

    // Настройка UI
    setupUI() {
        // Обновляем базовую информацию
        this.updateBasicInfo();

        // Настраиваем кнопки
        this.setupButtons();

        console.log('✅ UI setup complete');
    }

    // ========== ОБНОВЛЕНИЕ ДАННЫХ ==========

    // Обновление базовой информации
    updateBasicInfo() {
        // Турнир ID
        const tournamentIdEl = document.getElementById('tournamentId');
        if (tournamentIdEl) {
            tournamentIdEl.textContent = `#${this.currentTournamentId}`;
        }

        // Entry fee
        const entryFeeEl = document.getElementById('entryFee');
        if (entryFeeEl) {
            entryFeeEl.textContent = `${TOURNAMENT_CONFIG.ENTRY_FEE} PHRS`;
        }

        // Participant count (начальное значение)
        const participantCountEl = document.getElementById('participantCount');
        if (participantCountEl) {
            participantCountEl.textContent = '0';
        }
    }

    // Настройка кнопок
    setupButtons() {
        // Кнопка регистрации
        const registerBtn = document.getElementById('registerButton');
        if (registerBtn) {
            registerBtn.onclick = () => this.handleRegisterForTournament();
        }

        // Кнопка игры
        const playBtn = document.getElementById('playButton');
        if (playBtn) {
            playBtn.onclick = () => this.handlePlayTournamentGame();
        }

        // Кнопка обновления
        const refreshBtn = document.getElementById('refreshButton');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.updateData();
        }

        // Админ кнопки
        this.setupAdminButtons();
    }

    // Настройка админ кнопок
    setupAdminButtons() {
        const startBtn = document.getElementById('startTournamentBtn');
        if (startBtn) {
            startBtn.onclick = () => this.handleStartTournament();
        }

        const endBtn = document.getElementById('endTournamentBtn');
        if (endBtn) {
            endBtn.onclick = () => this.handleEndTournament();
        }

        const distributePrizesBtn = document.getElementById('distributePrizesBtn');
        if (distributePrizesBtn) {
            distributePrizesBtn.onclick = () => this.handleDistributePrizes();
        }
    }

    // Запуск цикла обновления
    startUpdateLoop() {
        // Обновляем данные каждые 30 секунд БЕЗОПАСНО
        this.createSafeInterval(() => {
            this.updateData();
        }, TOURNAMENT_CONFIG.AUTO_UPDATE_INTERVAL || 30000, 'dataUpdate');

        // Первое обновление БЕЗОПАСНО  
        this.createSafeTimeout(() => this.updateData(), 2000);

        console.log('⏰ Safe update loop started - no memory leaks');
    }

    // Обновление всех данных
    async updateData() {
        try {
            console.log('🔄 Updating tournament data...');

            // Проверяем подключение кошелька
            await this.checkWalletConnection();

            // ВСЕГДА обновляем админ панель
            this.updateAdminPanel();

            // ВСЕГДА обновляем пользовательские функции (для всех пользователей)
            await this.updateUserStatus();
            await this.updateButtonStates();

            // 💰 Обновляем прайз пул турнира
            await this.updateTournamentPrizePool();

            // Обновляем лидерборд (async)
            await this.updateLeaderboard();

            console.log('✅ Data update complete');

        } catch (error) {
            console.error('❌ Error updating data:', error);
        }
    }

    // ========== УПРАВЛЕНИЕ КОШЕЛЬКОМ ==========

    // Проверка подключения кошелька
    async checkWalletConnection() {
        const wasConnected = this.currentUserStatus !== 'disconnected';
        const isConnected = this.walletConnector && this.walletConnector.connected;

        if (isConnected && !wasConnected) {
            console.log('✅ Wallet connected');
            await this.onWalletConnected();
        } else if (!isConnected && wasConnected) {
            console.log('🔌 Wallet disconnected');
            await this.onWalletDisconnected();
        }
    }

    // Обработка подключения кошелька
    async onWalletConnected() {
        // Инициализируем walletConnector если еще не инициализирован
        if (!this.walletConnector) {
            console.log('🔧 Initializing wallet connector in onWalletConnected...');
            this.initWalletConnector();
        }
        
        if (!this.walletConnector) {
            console.error('❌ Wallet connector still not available in onWalletConnected');
            return;
        }
        console.log('👛 Wallet connected:', this.walletConnector.account);

        this.currentUserStatus = 'connected';

        // 🔥 ИСПРАВЛЕНИЕ: Подключаем TournamentManager к кошельку
        if (window.tournamentManager && this.walletConnector) {
            try {
                console.log('🔗 Connecting TournamentManager to wallet...');
                console.log('🔧 WalletConnector details:', {
                    connected: this.walletConnector.connected,
                    account: this.walletConnector.account,
                    hasWeb3: !!this.walletConnector.web3,
                    web3Type: typeof this.walletConnector.web3
                });
                
                const connected = await window.tournamentManager.connect(this.walletConnector);
                if (connected) {
                    console.log('✅ TournamentManager connected to blockchain');
                } else {
                    console.warn('⚠️ TournamentManager connection failed');
                }
            } catch (error) {
                console.error('❌ Error connecting TournamentManager:', error);
            }
        } else {
            console.log('🔧 Connection check failed:', {
                tournamentManagerAvailable: !!window.tournamentManager,
                walletConnectorAvailable: !!this.walletConnector
            });
        }

        // Обновляем обычные кнопки для ВСЕХ пользователей (включая админа)
        await this.updateUserStatusDisplay();
        await this.updateButtonStates();
        
        // ИСПРАВЛЕНО: Обновляем админ панель после подключения кошелька
        this.updateAdminPanel();

        // ДОПОЛНИТЕЛЬНЫЙ DEBUG: Принудительно проверяем админку
        console.log('🔧 User connected, admin panel:', this.isAdmin() ? 'shown' : 'hidden');
        console.log('🔧 FORCE Admin check for address:', this.walletConnector.account);
        
        // Принудительно обновляем админ панель еще раз через секунду
        this.createSafeTimeout(() => {
            console.log('🔧 DELAYED Admin check...');
            this.updateAdminPanel();
        }, 1000);

        // ⚡ НОВОЕ: Автоматический поиск активных турниров
        await this.searchForActiveTournaments();
        
        // Запускаем периодическую проверку турниров
        this.startTournamentMonitoring();
    }

    // ⚡ ПОИСК АКТИВНЫХ ТУРНИРОВ ⚡
    async searchForActiveTournaments() {
        try {
            console.log('🔍 Searching for active tournaments...');
            
            if (!window.tournamentManager || !window.tournamentManager.connected) {
                console.log('⚠️ Tournament manager not connected, skipping search');
                return;
            }

            const activeTournament = await window.tournamentManager.findActiveTournament();
            
            if (activeTournament) {
                console.log('✅ Found active tournament:', activeTournament.tournamentId);
                
                // Обновляем текущий турнир
                this.currentTournamentId = activeTournament.tournamentId;
                this.currentTournamentStatus = 'ACTIVE';
                
                // Проверяем регистрацию игрока
                if (this.walletConnector && this.walletConnector.account) {
                    const isRegistered = await window.tournamentManager.checkPlayerRegistration(
                        activeTournament.tournamentId,
                        this.walletConnector.account
                    );
                    
                    console.log('🎯 Player registration status:', isRegistered);
                    
                    // Обновляем UI
                    await this.updateTournamentUI(activeTournament, isRegistered);
                }
            } else {
                console.log('❌ No active tournaments found');
                this.currentTournamentStatus = 'NOT_STARTED';
                this.updateNoActiveTournamentUI();
            }
            
        } catch (error) {
            console.error('❌ Error searching for active tournaments:', error);
        }
    }

    // Обновить UI для активного турнира
    async updateTournamentUI(activeTournament, isRegistered) {
        try {
            console.log('🎨 Updating tournament UI for tournament', activeTournament.tournamentId);
            
            // ⚡ КРИТИЧЕСКИ ВАЖНО: Обновляем состояние игрока
            console.log('🔧 Setting player registration status:', isRegistered);
            this.playerRegistered = isRegistered;
            
            // Получаем количество попыток игрока
            try {
                if (isRegistered) {
                    const playerAttempts = await this.getUserAttempts();
                    console.log('🎯 Player attempts from blockchain:', playerAttempts);
                    this.playerAttempts = playerAttempts;
                }
            } catch (attemptsError) {
                console.warn('⚠️ Could not get player attempts:', attemptsError.message);
                this.playerAttempts = 0;
            }
            
            // Обновляем информацию о турнире
            this.updateTournamentStatus('ACTIVE');
            
            // ⚡ ВАЖНО: Принудительно обновляем статус пользователя
            await this.updateUserStatus(isRegistered ? 'registered' : 'connected');
            
            // Обновляем кнопки с корректным состоянием
            await this.updateButtonStates();
            
            // ⚡ Обновляем индикаторы попыток
            if (window.tournamentUI && isRegistered) {
                console.log('🔄 Updating attempt indicators with', this.playerAttempts, 'attempts');
                window.tournamentUI.updateAttemptIndicators(this.playerAttempts);
            }
            
            // Загружаем лидерборд и обновляем все данные
            await this.updateData();
            
            // Показываем уведомление
            this.showSuccess(`🏆 Active Tournament Found! Tournament #${activeTournament.tournamentId}!`);
            
            if (!isRegistered) {
                console.log('🎯 Player not registered - enabling registration button');
            } else {
                console.log('✅ Player already registered - showing play button, attempts:', this.playerAttempts);
            }
            
        } catch (error) {
            console.error('❌ Error updating tournament UI:', error);
        }
    }

    // Обновить UI когда нет активных турниров
    updateNoActiveTournamentUI() {
        console.log('📝 No active tournaments - updating UI');
        this.updateTournamentStatus('NOT_STARTED');
        
        // Показать сообщение
        const statusElement = document.getElementById('tournamentStatus');
        if (statusElement) {
            statusElement.textContent = 'No Active Tournaments';
            statusElement.className = 'tournament-status waiting';
        }
    }

    // Запустить периодический мониторинг турниров
    startTournamentMonitoring() {
        if (this.isMonitoringActive) {
            console.log('🔄 Tournament monitoring already active');
            return;
        }
        
        console.log('🔄 Starting tournament monitoring (every 60 seconds)...');
        this.isMonitoringActive = true;
        
        // БЕЗОПАСНЫЙ мониторинг турниров
        this.createSafeInterval(async () => {
            console.log('🔄 Periodic tournament check...');
            await this.searchForActiveTournaments();
        }, 60000, 'tournamentMonitoring');
    }

    // Остановить мониторинг турниров
    stopTournamentMonitoring() {
        console.log('⏹️ Stopping tournament monitoring');
        this.clearSafeInterval('tournamentMonitoring');
        this.isMonitoringActive = false;
        
        // Совместимость со старым кодом
        if (this.tournamentMonitorInterval) {
            clearInterval(this.tournamentMonitorInterval);
            this.tournamentMonitorInterval = null;
        }
    }

    // Скрыть кнопки обычного пользователя (для админа)
    hideUserButtons() {
        const registerBtn = document.getElementById('registerButton');
        const playBtn = document.getElementById('playButton');

        if (registerBtn) {
            registerBtn.style.display = 'none';
        }

        if (playBtn) {
            playBtn.style.display = 'none';
        }

        // Скрываем статус пользователя для админа
        if (window.tournamentUI && typeof window.tournamentUI.updateUserStatus === 'function') {
            window.tournamentUI.updateUserStatus({
                status: 'admin',
                attempts: 0
            });
        }
    }

    // Обработка отключения кошелька
    async onWalletDisconnected() {
        console.log('🔌 Wallet disconnected');

        this.currentUserStatus = 'disconnected';
        
        // Скрываем поле ввода имени
        this.hidePlayerNameSection();

        // ⚡ НОВОЕ: Остановить мониторинг турниров
        this.stopTournamentMonitoring();

        // 🔥 ИСПРАВЛЕНИЕ: Отключаем TournamentManager
        if (window.tournamentManager) {
            window.tournamentManager.web3 = null;
            window.tournamentManager.contract = null;
            window.tournamentManager.account = null;
            window.tournamentManager.connected = false;
            console.log('🔌 TournamentManager disconnected');
        }

        // Скрываем админ панель
        this.updateAdminPanel();

        // Показываем обычные кнопки
        await this.updateUserStatusDisplay();

        // Сбрасываем состояние турнира
        this.currentTournamentStatus = 'NOT_STARTED';
        this.updateNoActiveTournamentUI();
        await this.updateButtonStates();
    }

    // ========== СТАТУС ПОЛЬЗОВАТЕЛЯ ==========

    // Обновление статуса пользователя
    async updateUserStatus(forceStatus = null) {
        try {
            if (forceStatus) {
                console.log('🔧 Force setting user status to:', forceStatus);
                this.currentUserStatus = forceStatus;
            } else {
                // Проверяем реальный статус
                if (!this.walletConnector || !this.walletConnector.connected) {
                    this.currentUserStatus = 'disconnected';
                } else {
                    // ⚡ ИСПРАВЛЕНО: Правильная проверка регистрации
                    const playerAddress = this.walletConnector.account;
                    console.log('🔍 Checking user status for:', playerAddress, 'in tournament:', this.currentTournamentId);
                    
                    // Проверяем регистрацию через правильный метод блокчейна
                    let isRegistered = false;
                    if (window.tournamentManager && window.tournamentManager.connected && this.currentTournamentId) {
                        try {
                            isRegistered = await window.tournamentManager.checkPlayerRegistration(
                                this.currentTournamentId, 
                                playerAddress
                            );
                            
                            // ⚡ ВАЖНО: Обновляем локальное состояние
                            this.playerRegistered = isRegistered;
                            console.log('🔄 Updated playerRegistered:', this.playerRegistered);
                            
                            if (isRegistered) {
                                // Получаем количество попыток
                                const attempts = await this.getUserAttempts();
                                this.playerAttempts = attempts;
                                console.log('🎯 Player attempts updated from blockchain:', attempts);
                                console.log('🔄 Updated playerAttempts:', this.playerAttempts);
                            } else {
                                this.playerAttempts = 0;
                                console.log('🔄 Reset playerAttempts to 0 (not registered)');
                            }
                            
                        } catch (error) {
                            console.warn('⚠️ Cannot verify registration from blockchain:', error.message);
                            isRegistered = false;
                        }
                    }
                    
                    if (isRegistered) {
                        // ⚡ Проверяем количество попыток для определения статуса
                        const totalAttempts = await this.getUserAttempts();
                        if (totalAttempts >= TOURNAMENT_CONSTANTS.GAME.MAX_ATTEMPTS) {
                            this.currentUserStatus = 'finished';
                            console.log('🏁 Player status: finished (all attempts used)');
                        } else {
                            this.currentUserStatus = 'registered';
                            console.log(`🎮 Player status: registered (${totalAttempts}/3 attempts used)`);
                        }
                    } else {
                        this.currentUserStatus = 'connected';
                    }
                    
                    console.log(`👤 User status determined: ${this.currentUserStatus} (registered: ${isRegistered})`);
                }
            }

            await this.updateUserStatusDisplay();

        } catch (error) {
            console.error('❌ Error updating user status:', error);
            this.currentUserStatus = 'disconnected';
        }
    }

    // Обновление отображения статуса пользователя
    async updateUserStatusDisplay() {
        if (window.tournamentUI) {
            // ⚡ ИСПРАВЛЕНО: getUserAttempts() возвращает Promise, нужен await
            const attempts = await this.getUserAttempts();

            const statusData = {
                status: this.currentUserStatus,
                attempts: attempts
            };

            console.log('🔄 Updating UI with status:', statusData);
            window.tournamentUI.updateUserStatus(statusData);
            window.tournamentUI.updateAttemptIndicators(attempts);
        }

        // Также обновляем текстовые элементы если есть
        await this.updateStatusText();
    }

    // Обновить текстовый статус пользователя
    async updateStatusText() {
        const statusElement = document.getElementById('userStatus');
        if (!statusElement) return;

        let statusText = '';
        const isAdmin = this.isAdmin();
        // ⚡ ИСПРАВЛЕНО: getUserAttempts() возвращает Promise, нужен await
        const attempts = await this.getUserAttempts();

        switch (this.currentUserStatus) {
            case 'disconnected':
                statusText = '🔌 Connect Wallet to Participate';
                break;
            case 'connected':
                statusText = isAdmin ?
                    '🔧 Admin Connected - You can also participate!' :
                    '💰 Register for Tournament';
                break;
            case 'registered':
                statusText = isAdmin ?
                    `🔧 Admin Registered - ${attempts}/3 attempts used` :
                    `🎮 Ready to Play - ${attempts}/3 attempts used`;
                break;
            case 'finished':
                statusText = isAdmin ?
                    '🔧 Admin - All attempts completed' :
                    '✅ All attempts completed';
                break;
        }

        console.log('📝 Status text updated:', statusText);
        statusElement.textContent = statusText;
    }

    // Получить количество попыток через блокчейн или локально
    async getUserAttempts() {
        if (!this.walletConnector || !this.walletConnector.connected) {
            console.log('🎯 getUserAttempts: No wallet connection');
            return this.playerAttempts || 0;
        }

        if (!window.tournamentManager || !window.tournamentManager.connected) {
            console.log('🎯 getUserAttempts: No blockchain connection, using local attempts:', this.playerAttempts);
            return this.playerAttempts || 0;
        }

        try {
            const playerInfo = await window.tournamentManager.getPlayerScore(
                this.currentTournamentId, 
                this.walletConnector.account
            );
            const blockchainAttempts = playerInfo ? playerInfo.attempts || 0 : 0;
            
            // ⚡ Используем максимум из блокчейна и локальных попыток
            // Загружаем локальные попытки из localStorage
            const attemptKey = `tournament_${this.currentTournamentId}_attempts_${this.walletConnector.account}`;
            const storedAttempts = parseInt(localStorage.getItem(attemptKey) || '0');
            const localAttempts = Math.max(this.playerAttempts || 0, storedAttempts);
            const totalAttempts = Math.max(blockchainAttempts, localAttempts);
            
            
            // Обновляем локальные попытки
            this.playerAttempts = totalAttempts;
            
            return totalAttempts;
        } catch (error) {
            return this.playerAttempts || 0;
        }
    }

    // ========== ИГРОВАЯ ЛОГИКА ==========

    // Обработка регистрации в турнире - ТОЛЬКО БЛОКЧЕЙН
    async handleRegisterForTournament() {
        if (this.isRegistering) {
            console.log('⏳ Registration already in progress');
            return;
        }

        if (!this.walletConnector || !this.walletConnector.connected) {
            this.showError('Please connect your wallet first');
            return;
        }

        if (this.currentTournamentStatus !== 'ACTIVE') {
            this.showError('Tournament is not active. Please wait for admin to start it.');
            return;
        }

        try {
            this.isRegistering = true;
            this.showLoading('Registering for tournament on blockchain...');

            // Получаем имя игрока (Discord username или fallback)
            const customPlayerName = this.getPlayerName();
            const playerName = customPlayerName || this.getDefaultPlayerName();

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Tournament Registration');

            console.log('🔗 Registering ONLY via blockchain...');
            const txHash = await window.tournamentManager.registerForTournament(
                this.currentTournamentId, 
                playerName
            );
            console.log('✅ Blockchain registration successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Successfully registered on blockchain! TX: ${txHash.slice(0, 8)}...`);

            // ⚡ Сбрасываем локальные попытки при новой регистрации
            this.playerAttempts = 0;
            const attemptKey = `tournament_${this.currentTournamentId}_attempts_${this.walletConnector.account}`;
            localStorage.removeItem(attemptKey);
            console.log('🔄 Local attempts reset for new registration');

            // Обновляем статус
            this.currentUserStatus = 'registered';
            await this.updateUserStatusDisplay();
            await this.updateButtonStates();
            
            // Показываем поле ввода имени игрока
            this.showPlayerNameSection();

        } catch (error) {
            this.hideLoading();
            console.error('❌ Blockchain registration failed:', error);
            this.showError('🚫 Registration failed on blockchain: ' + error.message + '\n\nTournament works ONLY with blockchain - no local modes available.');
        } finally {
            this.isRegistering = false;
        }
    }

    // Обработка игры в турнире
    async handlePlayTournamentGame() {
        if (!this.walletConnector || !this.walletConnector.connected) {
            this.showError('Please connect your wallet first');
            return;
        }

        if (this.currentUserStatus !== 'registered') {
            this.showError('Please register for the tournament first');
            return;
        }

        // ⚠️ ОБЯЗАТЕЛЬНАЯ ПРОВЕРКА: Discord username должен быть задан
        if (!this.hasDiscordUsername()) {
            this.showError('Discord username is required to play. Please enter your Discord username first.');
            this.showPlayerNameSection(); // Показываем поле ввода
            return;
        }

        // ⚡ ИСПРАВЛЕНО: getUserAttempts() возвращает Promise, нужен await
        const attempts = await this.getUserAttempts();
        if (attempts >= TOURNAMENT_CONSTANTS.GAME.MAX_ATTEMPTS) {
            this.showError(`You have used all ${TOURNAMENT_CONSTANTS.GAME.MAX_ATTEMPTS} attempts`);
            return;
        }

        try {
            // ИСПРАВЛЕНО: НЕ увеличиваем попытки здесь - они увеличиваются в submitGameScore
            console.log(`🎮 Starting game. Current attempts: ${attempts}/3`);
            // Удалили: this.storage.incrementPlayerAttempts(this.walletConnector.account);

            // Сохраняем данные для турнирного режима
            const tournamentData = {
                tournamentId: this.currentTournamentId,
                attempt: attempts + 1, // ⚡ Теперь attempts это нормальное число, не Promise
                maxAttempts: 3,
                playerAddress: this.walletConnector.account
            };
            
            console.log('📊 Tournament data prepared:', tournamentData);

            localStorage.setItem('tournamentMode', JSON.stringify(tournamentData));

            // ИСПРАВЛЕНО: Принудительно используем модальное окно турнирной игры
            console.log('🎮 Opening tournament game in modal window...');
            if (window.tournamentUI && typeof window.tournamentUI.openGame === 'function') {
                console.log('✅ Using tournamentUI.openGame modal');
                window.tournamentUI.openGame();
            } else {
                console.log('❌ tournamentUI.openGame not available - trying fallback');
                // ИСПРАВЛЕНО: Простой fallback без сложной логики
                console.log('🔧 Using basic game modal fallback...');
                
                // Используем базовое модальное окно - оно уже работает отлично
                this.createBasicGameModal();
            }

        } catch (error) {
            console.error('❌ Error starting tournament game:', error);
            this.showError('Failed to start game: ' + error.message);
        }
    }

async submitGameScore(score, playerName = null) {
    try {
        console.log(`📊 Submitting score ONLY to blockchain: ${score}`);

        if (!this.walletConnector || !this.walletConnector.connected) {
            throw new Error('Wallet not connected');
        }

        if (typeof score !== 'number' || score < 0 || score > 9999999) {
            throw new Error('Invalid score');
        }

        // ⚡ НОВОЕ: Проверяем текущий счет ИГРОКА ДО отправки
        try {
            const currentPlayerInfo = await window.tournamentManager.getPlayerScore(
                this.currentTournamentId,
                this.walletConnector.account
            );
            
            const currentScore = currentPlayerInfo ? currentPlayerInfo.score || 0 : 0;
            const blockchainAttempts = currentPlayerInfo ? currentPlayerInfo.attempts || 0 : 0;
            
            // ⚡ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Используем общие попытки (блокчейн + локальные)
            const currentAttempts = await this.getUserAttempts();
            
            
            // Проверяем лимит попыток
            if (currentAttempts >= 3) {
                throw new Error(`You have already used all 3 attempts (${currentAttempts}/3). Score submission is not possible.`);
            }
            
            // Проверяем улучшение счета
            if (currentScore > 0 && score <= currentScore) {
                console.warn('⚠️ Score not improved - counting attempt locally without blockchain submission');
                
                // ⚡ НОВАЯ ЛОГИКА: НЕ отправляем в блокчейн, засчитываем локально
                
                // ⚡ Показываем сообщение об успешном засчете попытки
                this.showSuccess(`✅ Attempt ${currentAttempts}/3 counted! New score ${score} is not better than current ${currentScore}.`);
                
                // ⚡ НЕ увеличиваем попытки здесь - это уже сделано в handleGameOver()
                console.log(`📊 Attempt already counted in handleGameOver: ${currentAttempts}/3`);
                
                // Обновляем UI без отправки в блокчейн
                try {
                    if (typeof this.updateButtonStates === 'function') {
                        await this.updateButtonStates();
                    }
                    await this.updateUserStatusDisplay();
                } catch (updateError) {
                    console.warn('⚠️ Error updating UI after local attempt count:', updateError);
                }
                
                console.log('✅ Local attempt counting complete - no blockchain submission needed');
                return; // Прекращаем выполнение - не отправляем в блокчейн
                
            } else if (score > currentScore) {
                }
            
        } catch (checkError) {
            console.error('❌ Error checking current score:', checkError.message);
            
            // ⚡ НЕ блокируем отправку - пусть контракт решает
            // if (checkError.message.includes('уже использовали все')) {
            //     this.showError(checkError.message);
            //     return;
            // }
            
            // Для остальных ошибок - продолжаем
            }

        this.showLoading('Submitting score to blockchain...');
        
        // Подготавливаем имя игрока (обязательный Discord username или fallback)
        const customPlayerName = this.getPlayerName();
        const finalPlayerName = playerName || customPlayerName || this.getDefaultPlayerName();

        // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
        this.requireBlockchainConnection('Score Submission');
        const txHash = await window.tournamentManager.submitTournamentScore(
            this.currentTournamentId,
            score,
            finalPlayerName
        );

        this.hideLoading();
        this.showSuccess(`Score ${score} submitted to blockchain! TX: ${txHash.slice(0, 8)}...`);

        // ⚡ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Синхронизируем локальные попытки с блокчейном
        try {
            const updatedPlayerInfo = await window.tournamentManager.getPlayerScore(
                this.currentTournamentId,
                this.walletConnector.account
            );
            const newBlockchainAttempts = updatedPlayerInfo ? updatedPlayerInfo.attempts || 0 : 0;
            
            // Обновляем локальные попытки до соответствия с блокчейном
            if (newBlockchainAttempts > this.playerAttempts) {
                this.playerAttempts = newBlockchainAttempts;
                
                // Обновляем localStorage
                const attemptKey = `tournament_${this.currentTournamentId}_attempts_${this.walletConnector.account}`;
                localStorage.setItem(attemptKey, this.playerAttempts.toString());
            }
            
        } catch (syncError) {
            console.warn('⚠️ Could not sync attempts after blockchain submission:', syncError.message);
        }

        // Обновляем UI после успешной отправки в блокчейн
        if (typeof this.updateLeaderboard === 'function') {
            await this.updateLeaderboard();
        }
        if (typeof this.updateButtonStates === 'function') {
            await this.updateButtonStates();
        }
        await this.updateUserStatusDisplay();
        
        // ⚡ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обновляем индикаторы попыток после отправки в блокчейн
        if (window.tournamentUI && typeof window.tournamentUI.updateAttemptIndicators === 'function') {
            const latestAttempts = await this.getUserAttempts();
            window.tournamentUI.updateAttemptIndicators(latestAttempts);
        }
        

    } catch (error) {
        this.hideLoading();
        console.error('❌ Blockchain score submission failed:', error);
        
        // ⚡ Обрабатываем разные типы ошибок по-разному
        if (error.message.includes('SCORE NOT IMPROVED') || 
            error.message.includes('Score must be higher than current score')) {
            
            // Попытка засчитана, но счет не обновлен
            this.showSuccess('✅ Attempt counted! But score not improved - leaderboard remains unchanged.');
            
        } else if (error.message.includes('Maximum attempts reached') || 
                   error.message.includes('ATTEMPTS LIMIT')) {
            
            // Превышен лимит попыток
            this.showError('❌ You have already used all 3 attempts!');
            
        } else {
            // Обычная ошибка блокчейна
            this.showError('🚫 Blockchain submission error: ' + error.message);
        }
        
        // ⚡ В любом случае обновляем UI (попытка могла быть засчитана)
        try {
            if (typeof this.updateButtonStates === 'function') {
                await this.updateButtonStates();
            }
            await this.updateUserStatusDisplay();
            
            // Обновляем лидерборд на всякий случай
            if (typeof this.updateLeaderboard === 'function') {
                this.createSafeTimeout(() => this.updateLeaderboard(), 1000);
            }
        } catch (updateError) {
            console.warn('⚠️ Error updating UI after failed submission:', updateError);
        }
    }
}

    // ИСПРАВЛЕНО: Базовое модальное окно игры как fallback
    createBasicGameModal() {
        console.log('🛠️ Creating basic game modal as fallback...');
        
        // Удаляем существующее модальное окно если есть
        const existingModal = document.getElementById('tournamentGameModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Создаем простое модальное окно
        const modal = document.createElement('div');
        modal.id = 'tournamentGameModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #001122, #003366);
                padding: 30px;
                border-radius: 20px;
                border: 3px solid #00ddff;
                box-shadow: 0 0 40px rgba(0, 221, 255, 0.6);
                text-align: center;
                color: #00ddff;
            ">
                <h2 style="margin-bottom: 20px;">🎮 Tournament Game</h2>
                <canvas id="tournamentGameCanvas" width="800" height="600" style="
                    border: 2px solid #00ddff;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #001122, #002244);
                "></canvas>
                <div style="margin-top: 20px;">
                    <button onclick="
                        // ИСПРАВЛЕНО: Полностью останавливаем игру и очищаем все
                        console.log('🛑 Stopping game and closing modal...');
                        
                        // Остановка всех игровых циклов и переменных
                        if (typeof window.stopGame === 'function') window.stopGame();
                        
                        // Останавливаем все возможные игровые циклы
                        window.gameRunning = false;
                        window.gameActive = false;
                        window.gamePaused = true;
                        
                        // Очищаем все интервалы и таймеры
                        if (window.gameInterval) { clearInterval(window.gameInterval); window.gameInterval = null; }
                        if (window.gameLoopId) { cancelAnimationFrame(window.gameLoopId); window.gameLoopId = null; }
                        if (window.bossSystemInterval) { clearInterval(window.bossSystemInterval); window.bossSystemInterval = null; }
                        if (window.animationId) { cancelAnimationFrame(window.animationId); window.animationId = null; }
                        
                        // Очищаем игровые массивы
                        if (window.invaders) window.invaders.length = 0;
                        if (window.bullets) window.bullets.length = 0;
                        if (window.enemyBullets) window.enemyBullets.length = 0;
                        if (window.currentBoss) window.currentBoss = null;
                        
                        // Удаляем дополнительные canvas элементы если они были созданы
                        const extraCanvases = document.querySelectorAll('canvas:not(#tournamentGameCanvas)');
                        extraCanvases.forEach(canvas => {
                            if (canvas.id === 'gameCanvas' || canvas.parentElement === document.body) {
                                console.log('🧹 Removing extra canvas:', canvas.id);
                                canvas.remove();
                            }
                        });
                        
                        // Очищаем глобальные переменные игры
                        window.canvas = null;
                        window.ctx = null;
                        
                        console.log('🎮 Game stopped and modal closed');
                        this.parentElement.parentElement.parentElement.remove();
                    " style="
                        background: #ff4444;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Close Game</button>
                    <span style="color: #66ccff; font-size: 14px;">Use ← → and SPACE to play</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ИСПРАВЛЕНО: Правильно запускаем игру на модальном canvas
        console.log('🚀 Starting tournament game in modal...');
        
        // Ждем пока модальное окно появится в DOM
        this.createSafeTimeout(() => {
            const tournamentCanvas = document.getElementById('tournamentGameCanvas');
            if (!tournamentCanvas) {
                console.error('❌ Tournament canvas not found');
                return;
            }
            
            // Устанавливаем canvas как активный
            window.canvas = tournamentCanvas;
            window.ctx = tournamentCanvas.getContext('2d');
            
            // ИСПРАВЛЕНО: Активируем турнирный режим
            const tournamentData = {
                tournamentId: this.currentTournamentId,
                attempt: this.getUserAttempts() + 1,
                maxAttempts: 3,
                playerAddress: this.walletConnector.account
            };
            
            localStorage.setItem('tournamentMode', JSON.stringify(tournamentData));
            console.log('🏆 Tournament mode activated:', tournamentData);
            console.log('✅ Tournament canvas set as active:', tournamentCanvas);
            
            // ИСПРАВЛЕНО: НЕ вызываем initCanvas - он создает дополнительный canvas
            // Игра должна использовать уже созданный window.canvas из модального окна
            
            if (typeof window.actuallyStartGame === 'function') {
                console.log('🎮 Starting game directly on tournament canvas...');
                window.actuallyStartGame();
            } else if (typeof window.startGame === 'function') {
                console.log('🎮 Starting game (fallback) on tournament canvas...');
                window.startGame();
            } else {
                console.error('❌ No game start function found');
                console.log('Available functions:', {
                    actuallyStartGame: typeof window.actuallyStartGame,
                    startGame: typeof window.startGame,
                    initCanvas: typeof window.initCanvas,
                    initGame: typeof window.initGame
                });
            }
        }, 100);
    }
    // Функция обновления игрока в лидерборде  
    updatePlayerInLeaderboard(walletAddress, newBestScore, playerName, attempts, allScores) {
    if (!this.leaderboard) return;

    try {
        // Получаем текущий лидерборд
        const leaderboard = this.leaderboard.getStoredLeaderboard();

        // Находим игрока
        const playerIndex = leaderboard.findIndex(entry =>
            entry.player.toLowerCase() === walletAddress.toLowerCase()
        );

        if (playerIndex !== -1) {
            // Обновляем существующую запись
            leaderboard[playerIndex].bestScore = newBestScore;
            leaderboard[playerIndex].scores = [...allScores]; // Сохраняем все счета для истории
            leaderboard[playerIndex].attempts = attempts;
            leaderboard[playerIndex].timestamp = Date.now();
            if (playerName) {
                leaderboard[playerIndex].playerName = playerName;
            }

            // Пересортировываем по лучшему счету
            leaderboard.sort((a, b) => b.bestScore - a.bestScore);

            // Сохраняем обновленный лидерборд
            this.leaderboard.saveLeaderboard(leaderboard);

            console.log(`✅ Player ${walletAddress} updated in leaderboard with best score: ${newBestScore}`);
        }
    } catch (error) {
        console.error('Error updating player in leaderboard:', error);
    }
}

    // ========== ПРАЙЗ ПУЛ ==========

    // Обновление прайз пула турнира
    async updateTournamentPrizePool() {
        try {
            if (!this.currentTournamentId || !window.tournamentManager) {
                console.log('🔍 Prize pool update skipped - missing tournament ID or manager');
                return;
            }

            console.log(`🔍 Getting tournament info for ID: ${this.currentTournamentId}`);

            // Получаем информацию о турнире с блокчейна
            const tournamentInfo = await window.tournamentManager.getTournamentInfo(this.currentTournamentId);
            
            console.log('🔍 Tournament info received:', tournamentInfo);
            
            if (tournamentInfo) {
                console.log(`🔍 Prize pool value: ${tournamentInfo.prizePool} wei (type: ${typeof tournamentInfo.prizePool})`);
                
                if (tournamentInfo.prizePool && tournamentInfo.prizePool !== '0') {
                    console.log(`💰 Updating prize pool: ${tournamentInfo.prizePool} wei`);
                    
                    // Обновляем UI через tournamentUI
                    if (window.tournamentUI && typeof window.tournamentUI.updatePrizePool === 'function') {
                        window.tournamentUI.updatePrizePool(tournamentInfo.prizePool);
                    } else {
                        console.log('❌ tournamentUI.updatePrizePool not available');
                    }
                } else {
                    console.log('💰 Prize pool is 0 or empty, not updating UI');
                }
            } else {
                console.log('❌ No tournament info received');
            }

        } catch (error) {
            console.error('❌ Failed to update tournament prize pool:', error);
        }
    }

    // ========== ЛИДЕРБОРД ==========

    // Обновление лидерборда
    async updateLeaderboard() {
        try {
            let leaderboard = [];
            let isBlockchainData = false;

            // ТОЛЬКО БЛОКЧЕЙН ДАННЫЕ - никаких fallback!
            if (!window.tournamentManager || !window.tournamentManager.connected) {
                console.warn('🚫 TournamentManager not connected - no leaderboard available');
                leaderboard = [];
            } else if (this.currentTournamentStatus === 'ACTIVE') {
                try {
                    console.log('🔗 Fetching leaderboard ONLY from blockchain...');
                    const blockchainLeaderboard = await window.tournamentManager.getTournamentLeaderboard(this.currentTournamentId);
                    
                    if (blockchainLeaderboard && blockchainLeaderboard.length > 0) {
                        leaderboard = blockchainLeaderboard;
                        isBlockchainData = true;
                        console.log(`✅ Blockchain leaderboard loaded: ${leaderboard.length} entries`);
                    } else {
                        console.log('ℹ️ No entries in blockchain leaderboard yet');
                        leaderboard = [];
                        isBlockchainData = true;
                    }
                } catch (blockchainError) {
                    console.error('❌ Failed to fetch blockchain leaderboard:', blockchainError);
                    leaderboard = [];
                }
            } else {
                console.log('ℹ️ Tournament not active - no leaderboard data');
                leaderboard = [];
            }

            // Сортируем лидерборд по убыванию счета
            if (leaderboard && leaderboard.length > 0) {
                leaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));
            }

            // 🎨 Обновляем UI
            if (window.tournamentUI && typeof window.tournamentUI.updateLeaderboard === 'function') {
                window.tournamentUI.updateLeaderboard(leaderboard);
            }

            const dataSource = isBlockchainData ? 'blockchain' : 'empty';
            console.log(`📊 Leaderboard updated from ${dataSource}: ${leaderboard.length} entries`);

            // Дополнительное логирование для топ-3
            if (leaderboard.length > 0) {
                console.log('🏆 Current top 3:', leaderboard.slice(0, 3).map((entry, i) => 
                    `${i+1}. ${entry.playerName || 'Unknown'}: ${entry.score || 0}`
                ));
            }

        } catch (error) {
            console.error('❌ Error updating leaderboard:', error);

            // Показываем пустой лидерборд в случае ошибки
            if (window.tournamentUI && typeof window.tournamentUI.updateLeaderboard === 'function') {
                window.tournamentUI.updateLeaderboard([]);
            }
        }
    }

    // Получить сохраненный лидерборд (для отладки)
    getStoredLeaderboard() {
        if (this.leaderboard) {
            return this.leaderboard.getLeaderboard();
        } else if (this.storage) {
            return this.storage.getLeaderboard();
        }
        return [];
    }

    // ========== СОСТОЯНИЕ КНОПОК ==========

    // Обновление состояния кнопок
async updateButtonStates() {
    const registerButton = document.getElementById('registerButton');
    const playButton = document.getElementById('playButton');

    if (!registerButton || !playButton) {
        console.log('❌ Button elements not found');
        return;
    }

    const walletConnected = this.walletConnector && this.walletConnector.connected;
    const tournamentStarted = this.currentTournamentStatus === 'ACTIVE';
    const isRegistered = this.currentUserStatus === 'registered';

    // Проверяем попытки через блокчейн
    let allAttemptsUsed = false;
    if (walletConnected) {
        try {
            const attempts = await this.getUserAttempts();
            allAttemptsUsed = attempts >= 3;
            console.log(`🎯 Player attempts from blockchain: ${attempts}/3, All used: ${allAttemptsUsed}`);
        } catch (error) {
            console.log('🎯 Cannot get attempts from blockchain:', error);
            allAttemptsUsed = false;
        }
    }

    console.log('🔄 Updating buttons with state:', {
        walletConnected,
        tournamentStarted,
        isRegistered,
        allAttemptsUsed,
        storageAvailable: !!this.storage,
        storageType: typeof this.storage
    });

    // Остальная логика кнопок без изменений...
    if (allAttemptsUsed) {
        registerButton.textContent = 'All Attempts Completed';
        registerButton.disabled = true;
        registerButton.className = 'action-button no-attempts';
        console.log('🔒 Set button to: All Attempts Completed (disabled)');
    } else if (isRegistered) {
        registerButton.textContent = 'Registered';
        registerButton.disabled = true;
        registerButton.className = 'action-button';
        console.log('✅ Set button to: Registered (disabled)');
    } else if (!tournamentStarted) {
        registerButton.textContent = 'Tournament Not Started';
        registerButton.disabled = true;
        registerButton.className = 'action-button';
        console.log('⏸️ Set button to: Tournament Not Started (disabled)');
    } else if (!walletConnected && tournamentStarted) {
        registerButton.textContent = 'Connect Wallet to Register';
        registerButton.disabled = false;
        registerButton.className = 'action-button';
        console.log('🔗 Set button to: Connect Wallet to Register (enabled)');
    } else if (walletConnected && tournamentStarted) {
        registerButton.textContent = 'Register for Tournament';
        registerButton.disabled = false;
        registerButton.className = 'action-button';
        console.log('🎯 Set button to: Register for Tournament (enabled)');
    }

    // Проверяем наличие Discord username
    const hasDiscordUsername = this.hasDiscordUsername();

    // Логика кнопки игры
    let playButtonDisabled = true;
    let playButtonText = '🎮 Play Game';

    if (allAttemptsUsed) {
        playButtonDisabled = true;
        playButtonText = '🚫 No attempts left';
    } else if (!hasDiscordUsername && isRegistered) {
        playButtonDisabled = true;
        playButtonText = '💬 Discord username required';
    } else if (isRegistered && walletConnected && tournamentStarted) {
        playButtonDisabled = false;
        playButtonText = '🎮 Play Game';
    }

    playButton.disabled = playButtonDisabled;
    playButton.textContent = playButtonText;
    playButton.className = playButtonDisabled ? 'action-button no-attempts' : 'action-button tournament-play';

    console.log('🎯 Final button states:', {
        registerText: registerButton.textContent,
        registerDisabled: registerButton.disabled,
        playText: playButton.textContent,
        playDisabled: playButton.disabled
    });
}
    // ========== АДМИН ФУНКЦИИ ==========

    // Проверка админских прав
    isAdmin() {
        if (!this.walletConnector || !this.walletConnector.connected) {
            console.log('🔧 Admin check: wallet not connected');
            return false;
        }

        if (!window.TOURNAMENT_CONFIG) {
            console.log('🔧 Admin check: config not available');
            return false;
        }

        const isAdmin = window.TOURNAMENT_CONFIG.isAdmin(this.walletConnector.account);
        console.log('🔧 Admin check result:', {
            account: this.walletConnector.account,
            accountLower: this.walletConnector.account?.toLowerCase(),
            isAdmin: isAdmin,
            adminAddress: window.TOURNAMENT_CONFIG.ADMIN_ADDRESS,
            adminAddressLower: window.TOURNAMENT_CONFIG.ADMIN_ADDRESS?.toLowerCase(),
            configAvailable: !!window.TOURNAMENT_CONFIG,
            accountMatch: this.walletConnector.account?.toLowerCase() === window.TOURNAMENT_CONFIG.ADMIN_ADDRESS?.toLowerCase()
        });

        return isAdmin;
    }

    // Обновление админ панели
    updateAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) {
            console.warn('⚠️ Admin panel element not found');
            return;
        }

        const isAdmin = this.isAdmin();
        console.log('🔧 Admin check:', {
            isAdmin,
            walletConnected: !!(this.walletConnector && this.walletConnector.connected),
            walletAccount: this.walletConnector?.account,
            configAvailable: !!window.TOURNAMENT_CONFIG
        });

        if (isAdmin) {
            adminPanel.style.display = 'block';
            adminPanel.classList.add('show');
            console.log('✅ Admin panel shown');
        } else {
            adminPanel.classList.remove('show');
            // Скрываем с анимацией
            this.createSafeTimeout(() => {
                if (!adminPanel.classList.contains('show')) {
                    adminPanel.style.display = 'none';
                }
            }, 400); // Время анимации
            console.log('👤 Admin panel hidden (not admin)');
        }

        // Также обновляем UI через tournamentUI если доступно
        if (window.tournamentUI && typeof window.tournamentUI.showAdminPanel === 'function') {
            window.tournamentUI.showAdminPanel(isAdmin);
        }
    }

    // Запуск турнира (админ функция) - ТОЛЬКО БЛОКЧЕЙН
    async handleStartTournament() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Starting tournament ONLY on blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Tournament Start');

            console.log('🔗 Starting tournament ONLY via blockchain...');
            
            // Параметры турнира
            const entryFeeEth = TOURNAMENT_CONFIG.ENTRY_FEE || '0.005';
            const durationSeconds = TOURNAMENT_CONFIG.TOURNAMENT_DURATION || 600; // 10 минут
            
            console.log('📋 Tournament start parameters:', {
                tournamentId: this.currentTournamentId,
                entryFeeEth: entryFeeEth,
                durationSeconds: durationSeconds,
                adminAddress: this.walletConnector.account
            });
            
            // Проверяем текущий статус турнира перед запуском
            try {
                const existingTournamentInfo = await window.tournamentManager.getTournamentInfo(this.currentTournamentId);
                console.log('🔍 Existing tournament info:', existingTournamentInfo);
                
                if (existingTournamentInfo && existingTournamentInfo.status !== 'NOT_STARTED') {
                    throw new Error(`Tournament ${this.currentTournamentId} already exists with status: ${existingTournamentInfo.status}`);
                }
            } catch (checkError) {
                console.log('🔍 Tournament check error (may be normal if tournament doesn\'t exist):', checkError.message);
            }
            
            // Используем автогенерацию ID турнира для избежания конфликтов
            const result = await window.tournamentManager.startTournament(
                null, // null означает автогенерацию ID
                entryFeeEth,
                durationSeconds
            );
            
            // Обрабатываем результат (может быть строкой или объектом)
            const txHash = typeof result === 'string' ? result : result.transactionHash;
            const newTournamentId = typeof result === 'object' ? result.tournamentId : null;
            
            console.log('✅ Blockchain tournament start successful:', txHash);
            
            // Обновляем текущий ID турнира если получили новый
            if (newTournamentId) {
                console.log(`🔄 Updated tournament ID: ${this.currentTournamentId} → ${newTournamentId}`);
                this.currentTournamentId = newTournamentId;
            }

            this.hideLoading();
            this.showSuccess(`Tournament #${this.currentTournamentId} started on blockchain! TX: ${txHash.slice(0, 8)}...`);

            // Обновляем статус турнира
            this.currentTournamentStatus = 'ACTIVE';
            this.updateTournamentStatus('ACTIVE');

            // Принудительно обновляем все данные
            this.updateData();

        } catch (error) {
            this.hideLoading();
            console.error('❌ Blockchain tournament start failed:', error);
            this.showError('🚫 Failed to start tournament on blockchain: ' + error.message + '\n\nTournament works ONLY with blockchain - no local modes available.');
        }
    }

    // Очистка данных турнира - только локальное UI
    async clearTournamentData() {
        try {
            console.log('🧹 Clearing only local UI data - blockchain data managed by smart contracts...');

            // Очищаем только localStorage UI данные
            localStorage.removeItem('tournamentMode');

            // Сбрасываем UI статус
            if (this.walletConnector && this.walletConnector.connected) {
                console.log('🔄 Resetting UI status to connected');
                this.currentUserStatus = 'connected';
                
                // Обновляем отображение
                await this.updateUserStatusDisplay();
                await this.updateButtonStates();
            } else {
                this.currentUserStatus = 'disconnected';
            }

            console.log('✅ Local UI data cleared - blockchain data intact');

        } catch (error) {
            console.error('❌ Error clearing UI data:', error);
        }
    }

    // Завершить турнир (админ функция) - ТОЛЬКО БЛОКЧЕЙН
    async handleEndTournament() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Ending tournament ONLY on blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Tournament End');

            console.log('🔗 Ending tournament ONLY via blockchain...');
            
            const txHash = await window.tournamentManager.endTournament(this.currentTournamentId);
            console.log('✅ Blockchain tournament end successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Tournament ended on blockchain! TX: ${txHash.slice(0, 8)}...`);

            // Обновляем статус турнира
            this.currentTournamentStatus = 'ENDED';
            this.updateTournamentStatus('ENDED');

        } catch (error) {
            this.hideLoading();
            console.error('❌ Blockchain tournament end failed:', error);
            this.showError('🚫 Failed to end tournament on blockchain: ' + error.message + '\n\nTournament works ONLY with blockchain - no local modes available.');
        }
    }

    // Распределить призы (админ функция) - ТОЛЬКО БЛОКЧЕЙН
    async handleDistributePrizes() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Checking tournament status and distributing prizes...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Prize Distribution');

            // ⚡ НОВОЕ: Проверяем статус турнира перед распределением
            const tournamentInfo = await window.tournamentManager.getTournamentInfo(this.currentTournamentId);
            console.log('🔍 Tournament status before prize distribution:', tournamentInfo);
            
            if (!tournamentInfo.isFinished) {
                throw new Error(`Tournament ${this.currentTournamentId} is not finished yet. Please end the tournament first.`);
            }
            
            if (!tournamentInfo.prizePool || tournamentInfo.prizePool === 0) {
                throw new Error(`Tournament ${this.currentTournamentId} has no prize pool to distribute.`);
            }
            
            console.log(`💰 Tournament is ready for prize distribution. Prize pool: ${tournamentInfo.prizePool} wei`);
            
            const txHash = await window.tournamentManager.distributePrizes(this.currentTournamentId);

            this.hideLoading();
            this.showSuccess(`Prizes distributed on blockchain! TX: ${txHash.slice(0, 8)}...`);

        } catch (error) {
            this.hideLoading();
            console.error('❌ Blockchain prize distribution failed:', error);
            this.showError('🚫 Failed to distribute prizes: ' + error.message);
        }
    }

    // ========== НОВЫЕ АДМИНСКИЕ ФУНКЦИИ ==========

    // Автозавершение турнира
    async handleAutoEndTournament() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Auto-ending tournament on blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Tournament Auto-End');

            const txHash = await window.tournamentManager.autoEndTournament(this.currentTournamentId);
            console.log('✅ Auto-end successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Tournament auto-ended on blockchain! TX: ${txHash.slice(0, 8)}...`);

            // Обновляем статус
            this.currentTournamentStatus = 'ENDED';
            this.updateTournamentStatus('ENDED');

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to auto-end tournament: ' + error.message);
        }
    }

    // Экстренная остановка турнира
    async handleEmergencyStopTournament() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        const confirmed = confirm('⚠️ Emergency stop will refund all participants. Are you sure?');
        if (!confirmed) return;

        try {
            this.showLoading('Emergency stopping tournament on blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Emergency Stop');

            const txHash = await window.tournamentManager.emergencyStopTournament(this.currentTournamentId);
            console.log('✅ Emergency stop successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Tournament emergency stopped on blockchain! TX: ${txHash.slice(0, 8)}...`);

            // Очищаем данные и обновляем статус
            await this.clearTournamentData();
            this.currentTournamentStatus = 'ENDED';
            this.updateTournamentStatus('ENDED');

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to emergency stop tournament: ' + error.message);
        }
    }

    // Включить возвраты
    async handleEnableRefunds() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        try {
            this.showLoading('Enabling refunds on blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Enable Refunds');

            const txHash = await window.tournamentManager.enableRefunds(this.currentTournamentId);
            console.log('✅ Enable refunds successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Refunds enabled on blockchain! TX: ${txHash.slice(0, 8)}...`);

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to enable refunds: ' + error.message);
        }
    }

    // Получить возврат средств (для игроков)
    async handleClaimRefund() {
        if (!this.walletConnector || !this.walletConnector.connected) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            this.showLoading('Claiming refund from blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Claim Refund');

            const txHash = await window.tournamentManager.claimRefund(this.currentTournamentId);
            console.log('✅ Refund claim successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Refund claimed from blockchain! TX: ${txHash.slice(0, 8)}...`);

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to claim refund: ' + error.message);
        }
    }

    // Вывод комиссий (только владелец)
    async handleWithdrawFees() {
        if (!this.isAdmin()) {
            this.showError('Admin access required');
            return;
        }

        const confirmed = confirm('💰 Withdraw all accumulated fees?');
        if (!confirmed) return;

        try {
            this.showLoading('Withdrawing fees from blockchain...');

            // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
            this.requireBlockchainConnection('Withdraw Fees');

            const txHash = await window.tournamentManager.withdrawFees();
            console.log('✅ Withdraw fees successful:', txHash);

            this.hideLoading();
            this.showSuccess(`Fees withdrawn from blockchain! TX: ${txHash.slice(0, 8)}...`);

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to withdraw fees: ' + error.message);
        }
    }

    // Получить информацию о контракте - ТОЛЬКО БЛОКЧЕЙН
    async getContractInfo() {
        // ⚡ КРИТИЧЕСКАЯ ПРОВЕРКА БЛОКЧЕЙНА
        this.requireBlockchainConnection('Contract Info');

        try {
            this.showLoading('Loading contract info...');

            const balance = await window.tournamentManager.getContractBalance();
            const counter = await window.tournamentManager.getTournamentCounter();
            const prizeDistribution = await window.tournamentManager.getPrizeDistribution(this.currentTournamentId);
            
            this.hideLoading();

            const info = {
                contractBalance: balance,
                tournamentCounter: counter,
                currentTournamentPrizes: prizeDistribution
            };

            console.log('📊 Contract Info:', info);
            alert(`📊 Contract Info:\n\nBalance: ${balance} PHRS\nTournament Counter: ${counter}\n\nCurrent Tournament Prizes:\n1st: ${prizeDistribution.first} PHRS\n2nd: ${prizeDistribution.second} PHRS\n3rd: ${prizeDistribution.third} PHRS\nOwner Fee: ${prizeDistribution.ownerFee} PHRS`);

            return info;

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to get contract info: ' + error.message);
        }
    }

    // ========== СТАТУС ТУРНИРА ==========

    // Обновление статуса турнира
    updateTournamentStatus(status) {
        this.currentTournamentStatus = status;

        if (window.tournamentUI) {
            window.tournamentUI.updateTournamentStatus(status, 0);
        }

        // Сохраняем в storage
        if (this.storage) {
            this.storage.saveTournamentStatus(status);
        }
    }

    // ========== УТИЛИТЫ ==========

    // Задержка
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Показать загрузку
    showLoading(message) {
        if (window.tournamentUI) {
            window.tournamentUI.showLoading(message);
        }
    }

    // Скрыть загрузку
    hideLoading() {
        if (window.tournamentUI) {
            window.tournamentUI.hideLoading();
        }
    }

showError(message) {
    console.error('❌ Error:', message);

    // Простое уведомление об ошибке без перезагрузки
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(255, 68, 68, 0.3);
        z-index: 10000;
        font-weight: bold;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Удаляем через 5 секунд
    tournamentLobby.createSafeTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

showWarning(message) {
    console.warn('⚠️ Warning:', message);

    // Предупреждение с оранжевым цветом
    const notification = document.createElement('div');
    notification.className = 'warning-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffaa00;
        color: #001122;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(255, 170, 0, 0.3);
        z-index: 10000;
        font-weight: bold;
        max-width: 300px;
        border-left: 4px solid #ff8800;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Удаляем через 6 секунд
    tournamentLobby.createSafeTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 6000);
}

showSuccess(message) {
    console.log('✅ Success:', message);

    // Простое уведомление без перезагрузки
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00ff88;
        color: #001122;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
        z-index: 10000;
        font-weight: bold;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Удаляем через 4 секунды
    tournamentLobby.createSafeTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

    // ========== ДИАГНОСТИКА ==========

    // Проверка здоровья системы
    healthCheck() {
        const status = {
            walletConnected: this.walletConnector && this.walletConnector.connected,
            storageReady: this.storage !== null,
            leaderboardReady: this.leaderboard !== null,
            tournamentManagerReady: typeof window.tournamentManager !== 'undefined',
            tournamentUIReady: typeof window.tournamentUI !== 'undefined',
            tournamentConfigReady: typeof window.TOURNAMENT_CONFIG !== 'undefined',
            currentUserStatus: this.currentUserStatus,
            currentTournamentStatus: this.currentTournamentStatus
        };

        console.log('🏥 Health Check:', status);
        return status;
    }

    // Получить состояние лобби
    getState() {
        return {
            currentTournamentId: this.currentTournamentId,
            currentTournamentStatus: this.currentTournamentStatus,
            currentUserStatus: this.currentUserStatus,
            isRegistering: this.isRegistering,
            userAttempts: this.getUserAttempts(),
            isAdmin: this.isAdmin(),
            walletConnected: this.walletConnector && this.walletConnector.connected,
            walletAddress: this.walletConnector && this.walletConnector.account,
            dependencies: {
                storage: this.storage !== null,
                leaderboard: this.leaderboard !== null
            }
        };
    }

    // Получить статистику игрока
    getPlayerStats(playerAddress) {
        if (!playerAddress || !this.storage) return null;

        const gameData = this.storage.getPlayerGameData(playerAddress);
        const attempts = this.storage.getPlayerAttempts(playerAddress);

        return {
            playerAddress,
            attempts,
            totalGames: gameData.totalGames || 0,
            bestScore: gameData.bestScore || 0,
            averageScore: gameData.averageScore || 0,
            scores: gameData.scores || []
        };
    }

    // ========== ОЧИСТКА ==========

    // Очистка ресурсов
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        console.log('🧹 Tournament Lobby cleanup completed');
    }

    // ========== ИМЕНИ ИГРОКА ==========

    // Показать секцию ввода имени
    showPlayerNameSection() {
        const playerNameSection = document.getElementById('playerNameSection');
        if (playerNameSection) {
            playerNameSection.style.display = 'block';
            
            // Загружаем сохраненное имя если есть
            const savedName = this.getPlayerName();
            const playerNameInput = document.getElementById('playerNameInput');
            if (playerNameInput && savedName && savedName !== this.getDefaultPlayerName()) {
                playerNameInput.value = savedName;
            }
        }
    }

    // Скрыть секцию ввода имени
    hidePlayerNameSection() {
        const playerNameSection = document.getElementById('playerNameSection');
        if (playerNameSection) {
            playerNameSection.style.display = 'none';
        }
    }

    // Получить имя игрока (только пользовательское Discord username)
    getPlayerName() {
        if (!this.walletConnector || !this.walletConnector.account) {
            return null;
        }

        const storageKey = `tournament_player_name_${this.walletConnector.account}`;
        const customName = localStorage.getItem(storageKey);
        
        if (customName && customName.trim()) {
            return customName.trim();
        }
        
        return null; // Возвращаем null если Discord username не задан
    }

    // Проверить, задан ли Discord username
    hasDiscordUsername() {
        const playerName = this.getPlayerName();
        return playerName !== null && playerName.length > 0;
    }

    // Получить имя по умолчанию
    getDefaultPlayerName() {
        if (!this.walletConnector || !this.walletConnector.account) {
            return 'Anonymous';
        }
        return `Player${this.walletConnector.account.slice(-4)}`;
    }

    // Сохранить пользовательское имя (обязательно)
    handleSavePlayerName() {
        const playerNameInput = document.getElementById('playerNameInput');
        if (!playerNameInput || !this.walletConnector || !this.walletConnector.account) {
            return;
        }

        const customName = playerNameInput.value.trim();
        const storageKey = `tournament_player_name_${this.walletConnector.account}`;

        // ⚠️ ОБЯЗАТЕЛЬНАЯ ПРОВЕРКА: Discord username должен быть введен
        if (!customName) {
            this.showError('Discord username is required to play in tournament');
            return;
        }

        // Валидация Discord username
        if (customName.length < 2) {
            this.showError('Discord username too short (min 2 characters)');
            return;
        }

        if (customName.length > 32) {
            this.showError('Discord username too long (max 32 characters)');
            return;
        }

        // Discord usernames могут содержать буквы, цифры, точки, подчеркивания
        if (!/^[a-zA-Z0-9._]+$/.test(customName)) {
            this.showError('Discord username can only contain letters, numbers, dots and underscores');
            return;
        }

        localStorage.setItem(storageKey, customName);
        this.showSuccess(`Discord username saved: "${customName}"`);

        // Обновляем состояние кнопок после сохранения имени
        this.updateButtonStates();

        // Скрываем секцию после сохранения
        this.createSafeTimeout(() => this.hidePlayerNameSection(), 2000);
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========

// Регистрация в турнире
window.handleRegisterForTournament = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleRegisterForTournament();
    } else {
        console.log('❌ Tournament lobby not ready');
    }
};

// Игра в турнире
window.handlePlayTournamentGame = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handlePlayTournamentGame();
    } else {
        console.log('❌ Tournament lobby not ready');
    }
};

// Админские функции
window.handleStartTournament = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleStartTournament();
    } else {
        console.log('❌ Tournament lobby not ready');
    }
};

window.handleEndTournament = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleEndTournament();
    } else {
        console.log('❌ Tournament lobby not ready');
    }
};

window.handleDistributePrizes = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleDistributePrizes();
    } else {
        console.log('❌ Tournament lobby not ready');
    }
};

// Сохранение имени игрока
window.handleSavePlayerName = function() {
    if (window.tournamentLobby) {
        window.tournamentLobby.handleSavePlayerName();
    } else {
        console.log('❌ Tournament lobby not ready');
    }
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// Создание глобального экземпляра
window.tournamentLobby = new TournamentLobby();

// Автоматическая инициализация при загрузке страницы
window.addEventListener('load', async () => {
    console.log('🚀 Tournament Lobby page loaded');

    try {
        await window.tournamentLobby.init();

        // Проверка здоровья через 2 секунды
        window.tournamentLobby.createSafeTimeout(() => {
            const health = window.tournamentLobby.healthCheck();
            if (health.walletConnected && health.tournamentManagerReady) {
                console.log('💚 All systems operational');
            } else {
                console.log('💡 System ready for wallet connection');
            }
        }, 2000);

    } catch (error) {
        console.error('❌ Failed to initialize tournament lobby:', error);
    }
});

// ========== DEBUG ФУНКЦИИ ==========

// Debug функции (доступны через консоль браузера)
window.debugTournamentLobby = {
    getState: () => window.tournamentLobby.getState(),
    healthCheck: () => window.tournamentLobby.healthCheck(),
    forceUpdate: () => window.tournamentLobby.updateData(),

    // Mock функции для тестирования
    mockConnect: () => {
        console.log('🧪 Mock connect - setting status to "connected"');
        window.tournamentLobby.updateUserStatus('connected');
    },

    mockRegister: () => {
        console.log('🧪 Mock register - setting status to "registered"');
        window.tournamentLobby.updateUserStatus('registered');
    },

    mockDisconnect: () => {
        console.log('🧪 Mock disconnect - setting status to "disconnected"');
        window.tournamentLobby.updateUserStatus('disconnected');
    },

    // Тестирование игр
    addTestScore: (score, playerName) => {
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            console.log('❌ Wallet not connected for test score');
            return;
        }
        console.log(`🧪 Adding test score: ${score} for ${playerName || 'current player'}`);
        window.tournamentLobby.submitGameScore(score, playerName);
    },

    addMultipleTestScores: () => {
        console.log('🧪 Adding multiple test scores...');
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            console.log('❌ Wallet not connected');
            return;
        }

        window.tournamentLobby.createSafeTimeout(() => window.debugTournamentLobby.addTestScore(5000, 'TestPlayer1'), 500);
        window.tournamentLobby.createSafeTimeout(() => window.debugTournamentLobby.addTestScore(7500, 'TestPlayer2'), 1000);
        window.tournamentLobby.createSafeTimeout(() => window.debugTournamentLobby.addTestScore(6200, 'TestPlayer3'), 1500);
    },

    // Лидерборд
    getLeaderboard: () => {
        const leaderboard = window.tournamentLobby.getStoredLeaderboard();
        console.log('🏆 Current leaderboard:', leaderboard);
        return leaderboard;
    },

    clearLeaderboard: () => {
        if (window.tournamentLobby.storage) {
            window.tournamentLobby.storage.saveLeaderboard([]);
        }
        console.log('🧹 Leaderboard cleared');
        window.tournamentLobby.updateLeaderboard();
    },

    // Статистика игрока
    getPlayerStats: () => {
        if (!window.tournamentLobby.walletConnector || !window.tournamentLobby.walletConnector.connected) {
            console.log('❌ Wallet not connected');
            return null;
        }
        const stats = window.tournamentLobby.getPlayerStats(window.tournamentLobby.walletConnector.account);
        console.log('📊 Your stats:', stats);
        return stats;
    },

    // Симуляция игры
    simulateGame: (finalScore) => {
        console.log(`🎮 Simulating game with score: ${finalScore || 'random'}`);
        const score = finalScore || Math.floor(Math.random() * 10000) + 1000;
        window.tournamentLobby.submitGameScore(score, `Player${Date.now().toString().slice(-4)}`);
    },

    // Тестирование блокчейн лидерборда
    testBlockchainLeaderboard: async () => {
        console.log('🔗 Testing blockchain leaderboard...');
        try {
            if (!window.tournamentManager || !window.tournamentManager.connected) {
                console.log('❌ TournamentManager not connected');
                return;
            }

            const tournamentId = window.tournamentLobby.currentTournamentId;
            console.log(`📋 Fetching leaderboard for tournament ${tournamentId}...`);

            const leaderboard = await window.tournamentManager.getTournamentLeaderboard(tournamentId);
            console.log('📊 Blockchain leaderboard result:', leaderboard);

            const topPlayers = await window.tournamentManager.getTopPlayers(tournamentId, 5);
            console.log('🏆 Top 5 players:', topPlayers);

            // Принудительное обновление UI лидерборда
            await window.tournamentLobby.updateLeaderboard();

        } catch (error) {
            console.error('❌ Blockchain leaderboard test failed:', error);
        }
    },

    // Информация о турнире из блокчейна
    getBlockchainTournamentInfo: async () => {
        console.log('🔗 Getting blockchain tournament info...');
        try {
            if (!window.tournamentManager || !window.tournamentManager.connected) {
                console.log('❌ TournamentManager not connected');
                return;
            }

            const tournamentId = window.tournamentLobby.currentTournamentId;
            const info = await window.tournamentManager.getTournamentInfo(tournamentId);
            console.log('📋 Tournament info:', info);

            const prizes = await window.tournamentManager.getPrizeDistribution(tournamentId);
            console.log('💰 Prize distribution:', prizes);

            return { info, prizes };

        } catch (error) {
            console.error('❌ Failed to get tournament info:', error);
        }
    }
};

console.log('🏆 Tournament Lobby loaded with full functionality');
console.log('🔧 Debug functions available at window.debugTournamentLobby');