// 🏆 PHAROS INVADERS - TOURNAMENT ADAPTER
// Файл-переводчик: адаптирует основные файлы игры для турнирного режима
// БЕЗ ИЗМЕНЕНИЯ оригинальных файлов

class TournamentAdapter {
    constructor() {
        this.isActive = false;
        this.tournamentData = null;
        this.originalFunctions = {}; // Сохраняем оригинальные функции
        this.tournamentCallbacks = {
            onScoreUpdate: null,
            onLivesChange: null,
            onLevelChange: null,
            onGameOver: null
        };

    }

    // ========== ОСНОВНЫЕ МЕТОДЫ ==========

    // Активация турнирного режима
    activate(tournamentData, callbacks = {}) {
        if (this.isActive) {
            Logger.warn('⚠️ Tournament adapter already active');
            return;
        }

        this.tournamentData = tournamentData;
        this.tournamentCallbacks = { ...this.tournamentCallbacks, ...callbacks };


        // Сохраняем оригинальные функции
        this.saveOriginalFunctions();

        // Устанавливаем перехватчики
        this.interceptPaymentSystem();
        this.interceptGameOver();
        this.interceptScoreSaving();
        this.interceptGameEvents();
        this.setupTournamentUI();

        this.isActive = true;
    }

    // Деактивация турнирного режима
    deactivate() {
        if (!this.isActive) {
            return;
        }


        // Восстанавливаем оригинальные функции
        this.restoreOriginalFunctions();

        this.isActive = false;
        this.tournamentData = null;

    }

    // ========== СОХРАНЕНИЕ ОРИГИНАЛЬНЫХ ФУНКЦИЙ ==========

    saveOriginalFunctions() {
        // Сохраняем функции, которые будем перехватывать
        if (typeof window.startGame === 'function') {
            this.originalFunctions.startGame = window.startGame;
        }

        if (typeof window.showGameOver === 'function') {
            this.originalFunctions.showGameOver = window.showGameOver;
        }

        if (typeof window.saveScoreToBlockchain === 'function') {
            this.originalFunctions.saveScoreToBlockchain = window.saveScoreToBlockchain;
        }

        if (typeof window.restartGame === 'function') {
            this.originalFunctions.restartGame = window.restartGame;
        }

    }

    restoreOriginalFunctions() {
        // Восстанавливаем все сохраненные функции
        Object.keys(this.originalFunctions).forEach(funcName => {
            if (this.originalFunctions[funcName]) {
                window[funcName] = this.originalFunctions[funcName];
            }
        });

        this.originalFunctions = {};
    }

    // ========== ПЕРЕХВАТЧИКИ ==========

    // 1. Перехват системы оплаты
    interceptPaymentSystem() {
        if (!this.originalFunctions.startGame) return;

        window.startGame = () => {

            // Принудительно устанавливаем оплаченный статус
            if (typeof window.hasPaidFee !== 'undefined') {
                window.hasPaidFee = true;
            }

            // Устанавливаем турнирные переменные
            window.tournamentMode = true;
            window.tournamentData = this.tournamentData;

            // Генерируем уникальную игровую сессию
            if (typeof window.currentGameSession !== 'undefined') {
                window.currentGameSession = `tournament_${this.tournamentData.tournamentId}_${this.tournamentData.attempt}`;
            }

            // Запускаем оригинальную игру
            this.originalFunctions.startGame();

            // Настраиваем мониторинг игровых событий
            this.setupGameMonitoring();
        };

    }

    // 2. Перехват Game Over
    interceptGameOver() {
        if (!this.originalFunctions.showGameOver) return;

        window.showGameOver = () => {

            // Получаем финальный счет
            const finalScore = typeof window.score !== 'undefined' ? window.score : 0;
            const finalLevel = typeof window.level !== 'undefined' ? window.level : 1;
            const finalLives = typeof window.lives !== 'undefined' ? window.lives : 0;

            // Создаем объект результата игры
            const gameResult = {
                score: finalScore,
                level: finalLevel,
                lives: finalLives,
                duration: this.getGameDuration(),
                timestamp: Date.now(),
                attempt: this.tournamentData.attempt,
                tournamentId: this.tournamentData.tournamentId
            };

            // Логируем результат

            // Показываем турнирный экран завершения
            this.showTournamentGameOver(gameResult);

            // Вызываем коллбек если есть
            if (this.tournamentCallbacks.onGameOver) {
                this.tournamentCallbacks.onGameOver(gameResult);
            }
        };

    }

    // 3. Перехват сохранения результата
    interceptScoreSaving() {
        if (!this.originalFunctions.saveScoreToBlockchain) return;

        window.saveScoreToBlockchain = (playerName, score) => {

            // Вместо блокчейна сохраняем в турнирную систему
            this.saveTournamentScore(score, playerName);

            // Показываем сообщение об успехе
            this.showTournamentScoreSubmitted(score, playerName);
        };

    }

    // 4. Перехват игровых событий для коллбеков
    interceptGameEvents() {
        // Мониторим изменения счета
        this.setupScoreMonitoring();

        // Мониторим изменения жизней
        this.setupLivesMonitoring();

        // Мониторим изменения уровня
        this.setupLevelMonitoring();

    }

    // ========== МОНИТОРИНГ ИГРОВЫХ ПЕРЕМЕННЫХ ==========

    setupGameMonitoring() {
        // Запускаем периодический мониторинг игровых переменных
        if (this.gameMonitorInterval) {
            clearInterval(this.gameMonitorInterval);
        }

        this.lastKnownValues = {
            score: 0,
            lives: 3,
            level: 1
        };

        this.gameMonitorInterval = setInterval(() => {
            this.checkGameVariables();
        }, 100); // Проверяем каждые 100мс
    }

    checkGameVariables() {
        if (!this.isActive) return;

        // Проверяем счет
        if (typeof window.score !== 'undefined' && window.score !== this.lastKnownValues.score) {
            this.lastKnownValues.score = window.score;
            if (this.tournamentCallbacks.onScoreUpdate) {
                this.tournamentCallbacks.onScoreUpdate(window.score);
            }
        }

        // Проверяем жизни
        if (typeof window.lives !== 'undefined' && window.lives !== this.lastKnownValues.lives) {
            this.lastKnownValues.lives = window.lives;
            if (this.tournamentCallbacks.onLivesChange) {
                this.tournamentCallbacks.onLivesChange(window.lives);
            }
        }

        // Проверяем уровень
        if (typeof window.level !== 'undefined' && window.level !== this.lastKnownValues.level) {
            this.lastKnownValues.level = window.level;
            if (this.tournamentCallbacks.onLevelChange) {
                this.tournamentCallbacks.onLevelChange(window.level);
            }
        }
    }

    setupScoreMonitoring() {
        // Создаем Proxy для отслеживания изменений счета (если возможно)
        if (typeof window.score !== 'undefined') {
            let scoreValue = window.score;

            Object.defineProperty(window, 'score', {
                get: () => scoreValue,
                set: (value) => {
                    scoreValue = value;
                    if (this.tournamentCallbacks.onScoreUpdate) {
                        this.tournamentCallbacks.onScoreUpdate(value);
                    }
                },
                configurable: true
            });
        }
    }

    setupLivesMonitoring() {
        if (typeof window.lives !== 'undefined') {
            let livesValue = window.lives;

            Object.defineProperty(window, 'lives', {
                get: () => livesValue,
                set: (value) => {
                    livesValue = value;
                    if (this.tournamentCallbacks.onLivesChange) {
                        this.tournamentCallbacks.onLivesChange(value);
                    }
                },
                configurable: true
            });
        }
    }

    setupLevelMonitoring() {
        if (typeof window.level !== 'undefined') {
            let levelValue = window.level;

            Object.defineProperty(window, 'level', {
                get: () => levelValue,
                set: (value) => {
                    levelValue = value;
                    if (this.tournamentCallbacks.onLevelChange) {
                        this.tournamentCallbacks.onLevelChange(value);
                    }
                },
                configurable: true
            });
        }
    }

    // ========== ТУРНИРНЫЕ UI ФУНКЦИИ ==========

    setupTournamentUI() {
        // Добавляем турнирную информацию в UI
        this.addTournamentInfo();

        // Модифицируем кнопки
        this.modifyGameButtons();
    }

    addTournamentInfo() {
        // Находим элемент UI для добавления турнирной информации
        const uiElement = document.querySelector('.ui') || document.querySelector('#ui') || document.body;

        if (uiElement) {
            // Удаляем предыдущее уведомление если есть
            const existingInfo = document.getElementById('tournament-info');
            if (existingInfo) {
                existingInfo.remove();
            }

            const tournamentInfo = document.createElement('div');
            tournamentInfo.id = 'tournament-info';
            tournamentInfo.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(255, 215, 0, 0.9);
                color: #000;
                padding: 10px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 1000;
                font-size: 14px;
                transition: opacity 0.5s ease-out;
            `;

            tournamentInfo.innerHTML = `
                🏆 TOURNAMENT MODE<br>
                Attempt: ${this.tournamentData.attempt}/${this.tournamentData.maxAttempts}<br>
                Tournament ID: #${this.tournamentData.tournamentId}
            `;

            uiElement.appendChild(tournamentInfo);

            // Автоматически скрываем через 5 секунд
            setTimeout(() => {
                if (tournamentInfo && tournamentInfo.parentNode) {
                    tournamentInfo.style.opacity = '0';
                    setTimeout(() => {
                        if (tournamentInfo && tournamentInfo.parentNode) {
                            tournamentInfo.remove();
                        }
                    }, 500); // Даем время для анимации исчезновения
                }
            }, 5000);
        }
    }

    modifyGameButtons() {
        // Скрываем или модифицируем кнопки, которые не нужны в турнире
        const blockchainSection = document.querySelector('.blockchain-section');
        if (blockchainSection) {
            blockchainSection.style.display = 'none';
        }
    }

    // ========== ТУРНИРНЫЕ ЭКРАНЫ ==========

    showTournamentGameOver(gameResult) {
        // Создаем турнирный экран Game Over
        const gameOverDiv = document.getElementById('gameOver') || this.createGameOverDiv();

        gameOverDiv.innerHTML = `
            <div class="tournament-game-over" style="
                background: linear-gradient(135deg, rgba(0, 17, 34, 0.95) 0%, rgba(0, 51, 102, 0.9) 100%);
                border: 3px solid #ffd700;
                border-radius: 20px;
                padding: 30px;
                text-align: center;
                color: white;
                max-width: 500px;
                margin: 0 auto;
            ">
                <h2 style="color: #ffd700; margin-bottom: 20px;">🏆 Tournament Game Complete!</h2>

                <div style="margin: 20px 0;">
                    <div style="font-size: 24px; margin: 10px 0;">
                        Final Score: <span style="color: #00ddff;">${TournamentUtils.formatNumber(gameResult.score)}</span>
                    </div>
                    <div style="font-size: 18px; margin: 10px 0;">
                        Level Reached: <span style="color: #00ddff;">${gameResult.level}</span>
                    </div>
                    <div style="font-size: 16px; margin: 10px 0;">
                        Attempt: <span style="color: #ffd700;">${gameResult.attempt}/${this.tournamentData.maxAttempts}</span>
                    </div>
                </div>

                <div style="margin-top: 30px;">
                    <button onclick="tournamentAdapter.handleTournamentContinue()" style="
                        background: #007acc;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        margin: 10px;
                        cursor: pointer;
                        font-weight: bold;
                    ">🏆 Back to Tournament</button>
                </div>
            </div>
        `;

        gameOverDiv.style.display = 'flex';

        // Автоматически скрываем через несколько секунд
        setTimeout(() => {
            this.handleTournamentContinue();
        }, 5000);
    }

    createGameOverDiv() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'tournament-game-over';
        gameOverDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        document.body.appendChild(gameOverDiv);
        return gameOverDiv;
    }

    showTournamentScoreSubmitted(score, playerName) {

        // Показываем уведомление через tournament UI если доступно
        if (window.tournamentUI && window.tournamentUI.showSuccess) {
            window.tournamentUI.showSuccess(`Score ${TournamentUtils.formatNumber(score)} submitted successfully!`);
        }
    }

    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========

    handleTournamentContinue() {
        
        // АГРЕССИВНО очищаем ВСЕ game over экраны
        const allGameOverScreens = document.querySelectorAll('#tournament-game-over, .tournament-game-over, [id*="game-over"], [class*="game-over"]');
        allGameOverScreens.forEach(screen => {
            screen.style.display = 'none';
            screen.remove();
        });

        // Деактивируем адаптер
        this.deactivate();

        // Возвращаемся в турнирное лобби
        if (window.tournamentUI && window.tournamentUI.closeGame) {
            window.tournamentUI.closeGame();
        } else {
            // Альтернативно - перенаправляем на страницу лобби
            window.location.href = '/tournament';
        }
    }

    // ========== УТИЛИТЫ ==========

    saveTournamentScore(score, playerName) {
        // Сохраняем результат через tournament lobby
        if (window.tournamentLobby && window.tournamentLobby.submitGameScore) {
            window.tournamentLobby.submitGameScore(score, playerName);
        } else {
            Logger.warn('⚠️ Tournament lobby not available for score submission');
        }
    }

    getGameDuration() {
        // Пытаемся получить длительность игры из основной игры
        if (typeof window.gameStartTime !== 'undefined') {
            return Date.now() - window.gameStartTime;
        }
        return 0;
    }

    // ========== ДИАГНОСТИКА ==========

    getStatus() {
        return {
            isActive: this.isActive,
            tournamentData: this.tournamentData,
            hasOriginalFunctions: Object.keys(this.originalFunctions).length > 0,
            monitoringActive: !!this.gameMonitorInterval,
            availableFunctions: {
                startGame: typeof window.startGame === 'function',
                showGameOver: typeof window.showGameOver === 'function',
                saveScoreToBlockchain: typeof window.saveScoreToBlockchain === 'function'
            }
        };
    }

    // ========== ОЧИСТКА ==========

    cleanup() {
        // Останавливаем мониторинг
        if (this.gameMonitorInterval) {
            clearInterval(this.gameMonitorInterval);
            this.gameMonitorInterval = null;
        }

        // Удаляем турнирную информацию из UI
        const tournamentInfo = document.getElementById('tournament-info');
        if (tournamentInfo) {
            tournamentInfo.remove();
        }

        // Деактивируем адаптер
        this.deactivate();

    }
}

// ========== ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ==========

// Создаем глобальный экземпляр адаптера
window.tournamentAdapter = new TournamentAdapter();

// Автоматическая очистка при выгрузке страницы
window.addEventListener('beforeunload', () => {
    if (window.tournamentAdapter) {
        window.tournamentAdapter.cleanup();
    }
});

// Debug функции
window.debugTournamentAdapter = {
    getStatus: () => window.tournamentAdapter.getStatus(),
    activate: (tournamentData) => {
        window.tournamentAdapter.activate(tournamentData || {
            tournamentId: 1,
            attempt: 1,
            maxAttempts: 3
        });
    },
    deactivate: () => window.tournamentAdapter.deactivate(),
    cleanup: () => window.tournamentAdapter.cleanup()
};

