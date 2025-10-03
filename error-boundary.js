// 🛡️ ERROR BOUNDARY
// Централизованная обработка ошибок приложения

class ErrorBoundary {
    constructor() {
        this.handlers = new Map();
        this.errorLog = [];
        this.maxLogSize = 100;

        // Настройки
        this.config = {
            showNotifications: true,
            logToConsole: true,
            logToStorage: true,
            reportToServer: false // можно включить для отправки на сервер
        };

        // Инициализация
        this.setupGlobalHandlers();
        this.loadErrorLog();
    }

    // ========================================
    // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ
    // ========================================

    /**
     * Регистрация обработчика для конкретной зоны
     * @param {string} zone - Зона ('wallet', 'game', 'tournament', etc.)
     * @param {Function} handler - Обработчик (error, context) => Promise<void>
     */
    register(zone, handler) {
        this.handlers.set(zone, handler);
    }

    /**
     * Удаление обработчика
     * @param {string} zone - Зона
     */
    unregister(zone) {
        this.handlers.delete(zone);
    }

    // ========================================
    // ОБРАБОТКА ОШИБОК
    // ========================================

    /**
     * Обработать ошибку
     * @param {Error} error - Объект ошибки
     * @param {string} zone - Зона возникновения
     * @param {Object} context - Дополнительный контекст
     */
    async handleError(error, zone = 'global', context = {}) {
        // Логируем
        if (this.config.logToConsole) {
            console.error(`[${zone}] Error:`, error, context);
        }

        // Добавляем в лог
        this.addToLog(error, zone, context);

        // Пытаемся обработать через специфичный обработчик
        const handler = this.handlers.get(zone);
        if (handler) {
            try {
                const handled = await handler(error, context);
                if (handled) {
                    return; // Обработано успешно
                }
            } catch (handlerError) {
                console.error(`Error in error handler for '${zone}':`, handlerError);
            }
        }

        // Дефолтная обработка
        this.defaultHandler(error, zone, context);
    }

    /**
     * Дефолтный обработчик
     */
    defaultHandler(error, zone, context) {
        // Получаем понятное сообщение для пользователя
        const userMessage = this.getUserFriendlyMessage(error, zone);

        // Показываем уведомление
        if (this.config.showNotifications && window.showNotification) {
            window.showNotification(userMessage, 'error', 5000);
        }

        // Отправляем на сервер (если включено)
        if (this.config.reportToServer) {
            this.reportToServer(error, zone, context);
        }
    }

    // ========================================
    // WRAPPER ДЛЯ ФУНКЦИЙ
    // ========================================

    /**
     * Обернуть async функцию для обработки ошибок
     * @param {Function} fn - Функция
     * @param {string} zone - Зона
     * @param {Object} options - Опции
     * @returns {Function} Обернутая функция
     */
    wrap(fn, zone, options = {}) {
        const { rethrow = false, fallback = null } = options;

        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                await this.handleError(error, zone, {
                    args,
                    functionName: fn.name
                });

                if (rethrow) {
                    throw error;
                }

                return fallback;
            }
        };
    }

    /**
     * Обернуть sync функцию
     */
    wrapSync(fn, zone, options = {}) {
        const { rethrow = false, fallback = null } = options;

        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError(error, zone, {
                    args,
                    functionName: fn.name
                });

                if (rethrow) {
                    throw error;
                }

                return fallback;
            }
        };
    }

    // ========================================
    // ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ
    // ========================================

    /**
     * Настройка глобальных обработчиков
     */
    setupGlobalHandlers() {
        // Необработанные промисы
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            this.handleError(
                event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
                'promise',
                { promise: event.promise }
            );
        });

        // JavaScript ошибки
        window.addEventListener('error', (event) => {
            // Пропускаем ошибки загрузки ресурсов
            if (event.target !== window) {
                return;
            }

            this.handleError(
                event.error || new Error(event.message),
                'javascript',
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            );
        });
    }

    // ========================================
    // СООБЩЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ
    // ========================================

    /**
     * Получить понятное сообщение для пользователя
     */
    getUserFriendlyMessage(error, zone) {
        // Специфичные коды ошибок
        const errorCodes = {
            // Wallet errors
            4001: 'Transaction rejected by user',
            4100: 'The requested account and/or method has not been authorized',
            4200: 'The Provider does not support the requested method',
            4900: 'The Provider is disconnected from all chains',
            4901: 'The Provider is not connected to the requested chain',
            '-32002': 'Please check your wallet',
            '-32603': 'Internal error. Please try again',

            // Game errors
            'insufficient_balance': 'Insufficient balance to play',
            'insufficient_fee': 'Insufficient fee amount',
            'game_already_running': 'Game is already running',
            'wallet_not_connected': 'Please connect your wallet first',

            // Tournament errors
            'tournament_not_active': 'Tournament is not active',
            'tournament_not_registered': 'Please register for tournament first',
            'tournament_no_attempts': 'No tournament attempts left',
            'player_name_required': 'Discord username is required',

            // Network errors
            'network_error': 'Network error. Please check your connection',
            'timeout': 'Request timeout. Please try again',

            // Contract errors
            'contract_error': 'Smart contract error. Please try again',
            'transaction_failed': 'Transaction failed. Please try again'
        };

        // Проверяем код ошибки
        if (error.code && errorCodes[error.code]) {
            return errorCodes[error.code];
        }

        // Проверяем сообщение ошибки
        const message = error.message?.toLowerCase() || '';

        if (message.includes('user rejected') || message.includes('user denied')) {
            return 'Transaction rejected by user';
        }

        if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
            return 'Insufficient balance';
        }

        if (message.includes('network') || message.includes('connection')) {
            return 'Network error. Please check your connection';
        }

        if (message.includes('timeout')) {
            return 'Request timeout. Please try again';
        }

        // Дефолтное сообщение по зонам
        const zoneMessages = {
            wallet: 'Wallet error. Please try again',
            game: 'Game error. Please restart the game',
            tournament: 'Tournament error. Please try again',
            blockchain: 'Blockchain error. Please try again'
        };

        if (zoneMessages[zone]) {
            return zoneMessages[zone];
        }

        // Общее сообщение
        return 'An error occurred. Please try again';
    }

    // ========================================
    // ЛОГИРОВАНИЕ
    // ========================================

    /**
     * Добавить ошибку в лог
     */
    addToLog(error, zone, context) {
        const logEntry = {
            timestamp: Date.now(),
            zone: zone,
            message: error.message,
            stack: error.stack,
            code: error.code,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            state: window.stateManager ? window.stateManager.getSnapshot() : null
        };

        this.errorLog.push(logEntry);

        // Ограничиваем размер лога
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Сохраняем в localStorage
        if (this.config.logToStorage) {
            this.saveErrorLog();
        }
    }

    /**
     * Получить лог ошибок
     */
    getErrorLog(zone = null) {
        if (!zone) return this.errorLog;
        return this.errorLog.filter(entry => entry.zone === zone);
    }

    /**
     * Очистить лог
     */
    clearErrorLog() {
        this.errorLog = [];
        if (this.config.logToStorage) {
            localStorage.removeItem('errorLog');
        }
    }

    /**
     * Сохранить лог в localStorage
     */
    saveErrorLog() {
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
        } catch (error) {
            console.error('Failed to save error log:', error);
        }
    }

    /**
     * Загрузить лог из localStorage
     */
    loadErrorLog() {
        try {
            const stored = localStorage.getItem('errorLog');
            if (stored) {
                this.errorLog = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load error log:', error);
            this.errorLog = [];
        }
    }

    // ========================================
    // ОТПРАВКА НА СЕРВЕР
    // ========================================

    /**
     * Отправить ошибку на сервер
     */
    async reportToServer(error, zone, context) {
        // Можно интегрировать Sentry, LogRocket и т.д.
        // Пока просто заглушка
        console.log('Would report to server:', { error, zone, context });
    }

    // ========================================
    // УТИЛИТЫ
    // ========================================

    /**
     * Получить статистику ошибок
     */
    getStatistics() {
        const stats = {
            total: this.errorLog.length,
            byZone: {},
            byCode: {},
            last24h: 0
        };

        const day = 24 * 60 * 60 * 1000;
        const now = Date.now();

        this.errorLog.forEach(entry => {
            // По зонам
            stats.byZone[entry.zone] = (stats.byZone[entry.zone] || 0) + 1;

            // По кодам
            if (entry.code) {
                stats.byCode[entry.code] = (stats.byCode[entry.code] || 0) + 1;
            }

            // За последние 24 часа
            if (now - entry.timestamp < day) {
                stats.last24h++;
            }
        });

        return stats;
    }

    /**
     * Вывести отчет в консоль
     */
    debug() {
        console.group('🛡️ Error Boundary Debug');
        console.log('Config:', this.config);
        console.log('Registered handlers:', Array.from(this.handlers.keys()));
        console.log('Error log size:', this.errorLog.length);
        console.log('Statistics:', this.getStatistics());
        console.log('Recent errors (last 5):', this.errorLog.slice(-5));
        console.groupEnd();
    }
}

// Создаем глобальный экземпляр
window.errorBoundary = new ErrorBoundary();

// Экспортируем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
}
