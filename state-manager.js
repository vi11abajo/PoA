// 🏗️ STATE MANAGER
// Централизованное управление состоянием приложения

class StateManager {
    constructor() {
        this.state = {
            // Game state
            game: {
                score: 0,
                lives: 5,
                level: 1,
                status: 'menu', // 'menu', 'playing', 'paused', 'gameOver'
                hasPaidFee: false,
                scoreAlreadySaved: false,
                currentSession: null,
                highScore: 0
            },

            // Wallet state
            wallet: {
                connected: false,
                address: null,
                balance: '0',
                chainId: null,
                connector: null
            },

            // Tournament state
            tournament: {
                isActive: false,
                registered: false,
                attemptsLeft: 3,
                attemptsUsed: 0,
                playerName: null,
                currentTournamentId: null,
                bestScore: 0,
                timeLeft: 0
            },

            // Boosts state
            boosts: {
                active: new Map(),
                dropping: [],
                speedTamerStacks: 0
            },

            // Boss state
            boss: {
                active: false,
                type: null,
                health: 0,
                maxHealth: 0,
                phase: 1
            },

            // UI state
            ui: {
                modalOpen: null, // 'wallet', 'gameStart', 'gameOver', null
                loading: false,
                loadingMessage: '',
                notification: null,
                menuOpen: false
            },

            // Performance state
            performance: {
                fps: 60,
                frameTime: 0,
                optimizationLevel: 'normal' // 'low', 'normal', 'high'
            }
        };

        // Подписчики на изменения
        this.listeners = new Map();

        // История изменений (для отладки)
        this.history = [];
        this.historyLimit = 50;

        // Инициализация
        this.loadFromStorage();
    }

    // ========================================
    // ОСНОВНЫЕ МЕТОДЫ
    // ========================================

    /**
     * Получить состояние по пути
     * @param {string} path - Путь к значению (например, 'game.score')
     * @returns {any} Значение
     */
    getState(path) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }

        return value;
    }

    /**
     * Установить состояние по пути
     * @param {string} path - Путь к значению
     * @param {any} value - Новое значение
     */
    setState(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();

        // Навигация до целевого объекта
        let target = this.state;
        for (const key of keys) {
            if (!target[key]) target[key] = {};
            target = target[key];
        }

        const oldValue = target[lastKey];

        // Не обновляем если значение не изменилось
        if (oldValue === value) return;

        // Устанавливаем новое значение
        target[lastKey] = value;

        // Добавляем в историю
        this.addToHistory(path, oldValue, value);

        // Уведомляем подписчиков
        this.notify(path, value, oldValue);

        // Сохраняем в localStorage (для некоторых путей)
        this.persistState(path);
    }

    /**
     * Обновить несколько значений за раз
     * @param {Object} updates - Объект с обновлениями { 'game.score': 100, 'game.lives': 3 }
     */
    batchUpdate(updates) {
        Object.entries(updates).forEach(([path, value]) => {
            this.setState(path, value);
        });
    }

    /**
     * Сбросить состояние игры
     */
    resetGameState() {
        this.batchUpdate({
            'game.score': 0,
            'game.lives': 5,
            'game.level': 1,
            'game.status': 'menu',
            'game.hasPaidFee': false,
            'game.scoreAlreadySaved': false,
            'game.currentSession': null
        });

        // Очищаем бусты
        this.state.boosts.active.clear();
        this.state.boosts.dropping = [];
        this.state.boosts.speedTamerStacks = 0;

        // Сбрасываем босса
        this.batchUpdate({
            'boss.active': false,
            'boss.type': null,
            'boss.health': 0,
            'boss.maxHealth': 0,
            'boss.phase': 1
        });
    }

    // ========================================
    // ПОДПИСКИ
    // ========================================

    /**
     * Подписаться на изменения
     * @param {string} path - Путь для отслеживания
     * @param {Function} callback - Функция обратного вызова (newValue, oldValue)
     * @returns {Function} Функция отписки
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }

        this.listeners.get(path).push(callback);

        // Возвращаем функцию отписки
        return () => {
            const callbacks = this.listeners.get(path);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Уведомить подписчиков об изменении
     * @param {string} path - Путь который изменился
     * @param {any} newValue - Новое значение
     * @param {any} oldValue - Старое значение
     */
    notify(path, newValue, oldValue) {
        // Уведомляем точных подписчиков
        const callbacks = this.listeners.get(path);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Error in state listener for '${path}':`, error);
                }
            });
        }

        // Уведомляем родительские пути (например, если изменился 'game.score', уведомляем 'game')
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentCallbacks = this.listeners.get(parentPath);

            if (parentCallbacks) {
                const parentValue = this.getState(parentPath);
                parentCallbacks.forEach(cb => {
                    try {
                        cb(parentValue, parentValue, path);
                    } catch (error) {
                        console.error(`Error in parent state listener for '${parentPath}':`, error);
                    }
                });
            }
        }
    }

    // ========================================
    // ИСТОРИЯ
    // ========================================

    /**
     * Добавить изменение в историю
     */
    addToHistory(path, oldValue, newValue) {
        this.history.push({
            timestamp: Date.now(),
            path: path,
            oldValue: oldValue,
            newValue: newValue
        });

        // Ограничиваем размер истории
        if (this.history.length > this.historyLimit) {
            this.history.shift();
        }
    }

    /**
     * Получить историю изменений
     * @param {string} path - Путь для фильтрации (опционально)
     * @returns {Array} История изменений
     */
    getHistory(path = null) {
        if (!path) return this.history;
        return this.history.filter(entry => entry.path === path);
    }

    /**
     * Очистить историю
     */
    clearHistory() {
        this.history = [];
    }

    // ========================================
    // PERSISTENCE (localStorage)
    // ========================================

    /**
     * Сохранить состояние в localStorage
     */
    persistState(path) {
        // Сохраняем только определенные пути
        const persistPaths = [
            'game.highScore',
            'wallet.address',
            'tournament.playerName',
            'performance.optimizationLevel'
        ];

        if (persistPaths.includes(path)) {
            try {
                const value = this.getState(path);
                localStorage.setItem(`state_${path}`, JSON.stringify(value));
            } catch (error) {
                console.error('Error persisting state:', error);
            }
        }
    }

    /**
     * Загрузить состояние из localStorage
     */
    loadFromStorage() {
        const persistPaths = [
            'game.highScore',
            'wallet.address',
            'tournament.playerName',
            'performance.optimizationLevel'
        ];

        persistPaths.forEach(path => {
            try {
                const stored = localStorage.getItem(`state_${path}`);
                if (stored !== null) {
                    const value = JSON.parse(stored);

                    // Устанавливаем без уведомления (это начальная загрузка)
                    const keys = path.split('.');
                    const lastKey = keys.pop();
                    let target = this.state;
                    for (const key of keys) {
                        if (!target[key]) target[key] = {};
                        target = target[key];
                    }
                    target[lastKey] = value;
                }
            } catch (error) {
                console.error(`Error loading state for '${path}':`, error);
            }
        });
    }

    // ========================================
    // УТИЛИТЫ
    // ========================================

    /**
     * Получить снимок всего состояния
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Восстановить состояние из снимка
     */
    restoreSnapshot(snapshot) {
        this.state = JSON.parse(JSON.stringify(snapshot));

        // Уведомляем всех подписчиков о полном обновлении
        this.listeners.forEach((callbacks, path) => {
            const value = this.getState(path);
            callbacks.forEach(cb => cb(value, value, path));
        });
    }

    /**
     * Вывести состояние в консоль (для отладки)
     */
    debug() {
        console.group('🏗️ State Manager Debug');
        console.log('Current State:', this.getSnapshot());
        console.log('Listeners:', Array.from(this.listeners.keys()));
        console.log('History (last 10):', this.history.slice(-10));
        console.groupEnd();
    }
}

// Создаем глобальный экземпляр
window.stateManager = new StateManager();

// Экспортируем для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
