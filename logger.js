// 📝 PHAROS INVADERS - LOGGING SYSTEM
// Централизованная система логирования с контролем уровней

class Logger {
    constructor() {
        // Получаем настройки из конфигурации или используем значения по умолчанию
        this.debugMode = window.GAME_CONFIG?.DEBUG_MODE ?? false;
        this.logLevel = window.GAME_CONFIG?.LOG_LEVEL ?? 'INFO'; // DEBUG, INFO, WARN, ERROR
        
        // Цветовая схема для логов (если браузер поддерживает)
        this.colors = {
            DEBUG: 'color: #888; font-style: italic;',
            INFO: 'color: #00ddff; font-weight: bold;',
            WARN: 'color: #ffaa00; font-weight: bold;',
            ERROR: 'color: #ff4444; font-weight: bold; background: rgba(255,68,68,0.1); padding: 2px 4px; border-radius: 3px;'
        };
        
        // Иерархия уровней логирования
        this.levelPriority = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
    }
    
    /**
     * Проверяет, должен ли лог выводиться на основе текущего уровня
     */
    shouldLog(level) {
        return this.levelPriority[level] >= this.levelPriority[this.logLevel];
    }
    
    /**
     * Форматирует сообщение с временной меткой и префиксом
     */
    formatMessage(level, message, emoji = '') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = emoji ? `${emoji} ` : '';
        return `[${timestamp}] ${prefix}${message}`;
    }
    
    /**
     * Отладочные сообщения - показываются только в режиме разработки
     */
    debug(message, ...args) {
        if (this.debugMode && this.shouldLog('DEBUG')) {
            const formattedMessage = this.formatMessage('DEBUG', message, '🔍');
            console.log(`%c${formattedMessage}`, this.colors.DEBUG, ...args);
        }
    }
    
    /**
     * Информационные сообщения - для важных событий игры
     */
    info(message, ...args) {
        if (this.shouldLog('INFO')) {
            const formattedMessage = this.formatMessage('INFO', message, '🎮');
            console.log(`%c${formattedMessage}`, this.colors.INFO, ...args);
        }
    }
    
    /**
     * Логирование игровых событий с эмодзи
     */
    log(message, emoji = '🎮', ...args) {
        if (this.shouldLog('INFO')) {
            const formattedMessage = this.formatMessage('INFO', message, emoji);
            console.log(`%c${formattedMessage}`, this.colors.INFO, ...args);
        }
    }
    
    /**
     * Предупреждения - всегда показываются в консоли
     */
    warn(message, ...args) {
        if (this.shouldLog('WARN')) {
            const formattedMessage = this.formatMessage('WARN', message, '⚠️');
            console.warn(`%c${formattedMessage}`, this.colors.WARN, ...args);
        }
    }
    
    /**
     * Ошибки - всегда показываются в консоли
     */
    error(message, ...args) {
        if (this.shouldLog('ERROR')) {
            const formattedMessage = this.formatMessage('ERROR', message, '❌');
            console.error(`%c${formattedMessage}`, this.colors.ERROR, ...args);
        }
    }
    
    /**
     * Логирование производительности
     */
    perf(label, timeMs) {
        if (this.debugMode && this.shouldLog('DEBUG')) {
            const message = `Performance: ${label} took ${timeMs.toFixed(2)}ms`;
            const formattedMessage = this.formatMessage('DEBUG', message, '⚡');
            console.log(`%c${formattedMessage}`, this.colors.DEBUG);
        }
    }
    
    /**
     * Групповое логирование для связанных сообщений
     */
    group(title, callback) {
        if (this.debugMode) {
            console.group(`🎮 ${title}`);
            callback();
            console.groupEnd();
        }
    }
    
    /**
     * Логирование состояния объектов (только в debug режиме)
     */
    state(objectName, state) {
        if (this.debugMode && this.shouldLog('DEBUG')) {
            console.group(`🔍 ${objectName} State`);
            console.table(state);
            console.groupEnd();
        }
    }
    
    /**
     * Изменение уровня логирования во время выполнения
     */
    setLogLevel(level) {
        if (this.levelPriority.hasOwnProperty(level)) {
            this.logLevel = level;
        } else {
            this.error(`Invalid log level: ${level}. Available: DEBUG, INFO, WARN, ERROR`);
        }
    }

    /**
     * Включение/отключение режима отладки
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

// Создаём глобальный экземпляр логгера
window.Logger = new Logger();

// Добавляем статические методы для обратной совместимости
Logger.log = (...args) => window.Logger.log(...args);
Logger.info = (...args) => window.Logger.info(...args);
Logger.debug = (...args) => window.Logger.debug(...args);
Logger.warn = (...args) => window.Logger.warn(...args);
Logger.error = (...args) => window.Logger.error(...args);

// Экспортируем для удобства использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

