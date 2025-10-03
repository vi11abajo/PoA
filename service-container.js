// 💉 SERVICE CONTAINER
// Dependency Injection контейнер для управления зависимостями

class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.aliases = new Map();
    }

    // ========================================
    // РЕГИСТРАЦИЯ СЕРВИСОВ
    // ========================================

    /**
     * Регистрация сервиса
     * @param {string} name - Имя сервиса
     * @param {Function} factory - Фабрика для создания сервиса
     * @param {Object} options - Опции { singleton: boolean, aliases: string[] }
     */
    register(name, factory, options = {}) {
        const { singleton = false, aliases = [] } = options;

        this.services.set(name, {
            factory: factory,
            singleton: singleton
        });

        // Регистрируем алиасы
        aliases.forEach(alias => {
            this.aliases.set(alias, name);
        });

        return this;
    }

    /**
     * Регистрация singleton сервиса
     */
    registerSingleton(name, factory, options = {}) {
        return this.register(name, factory, { ...options, singleton: true });
    }

    /**
     * Регистрация экземпляра напрямую
     */
    registerInstance(name, instance, options = {}) {
        this.singletons.set(name, instance);

        // Регистрируем алиасы
        const { aliases = [] } = options;
        aliases.forEach(alias => {
            this.aliases.set(alias, name);
        });

        return this;
    }

    // ========================================
    // ПОЛУЧЕНИЕ СЕРВИСОВ
    // ========================================

    /**
     * Получить сервис
     * @param {string} name - Имя сервиса
     * @returns {any} Экземпляр сервиса
     */
    get(name) {
        // Проверяем алиасы
        const actualName = this.aliases.get(name) || name;

        // Если есть готовый singleton
        if (this.singletons.has(actualName)) {
            return this.singletons.get(actualName);
        }

        // Получаем описание сервиса
        const service = this.services.get(actualName);
        if (!service) {
            throw new Error(`Service '${name}' not registered`);
        }

        // Создаем новый экземпляр
        try {
            const instance = service.factory(this);

            // Если singleton - сохраняем
            if (service.singleton) {
                this.singletons.set(actualName, instance);
            }

            return instance;
        } catch (error) {
            throw new Error(`Failed to create service '${name}': ${error.message}`);
        }
    }

    /**
     * Получить несколько сервисов
     */
    getMultiple(...names) {
        return names.map(name => this.get(name));
    }

    /**
     * Проверить наличие сервиса
     */
    has(name) {
        const actualName = this.aliases.get(name) || name;
        return this.services.has(actualName) || this.singletons.has(actualName);
    }

    // ========================================
    // LAZY LOADING
    // ========================================

    /**
     * Создать ленивую ссылку на сервис
     */
    lazy(name) {
        return () => this.get(name);
    }

    // ========================================
    // УПРАВЛЕНИЕ
    // ========================================

    /**
     * Удалить сервис
     */
    remove(name) {
        const actualName = this.aliases.get(name) || name;

        this.services.delete(actualName);
        this.singletons.delete(actualName);

        // Удаляем алиасы
        for (const [alias, target] of this.aliases.entries()) {
            if (target === actualName) {
                this.aliases.delete(alias);
            }
        }

        return this;
    }

    /**
     * Очистить все singleton экземпляры
     */
    clearSingletons() {
        this.singletons.clear();
        return this;
    }

    /**
     * Полная очистка контейнера
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
        this.aliases.clear();
        return this;
    }

    // ========================================
    // УТИЛИТЫ
    // ========================================

    /**
     * Получить список всех зарегистрированных сервисов
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }

    /**
     * Получить список всех singleton экземпляров
     */
    getSingletonInstances() {
        return Array.from(this.singletons.keys());
    }

    /**
     * Получить информацию о сервисе
     */
    getServiceInfo(name) {
        const actualName = this.aliases.get(name) || name;
        const service = this.services.get(actualName);

        if (!service) {
            return null;
        }

        return {
            name: actualName,
            singleton: service.singleton,
            instantiated: this.singletons.has(actualName),
            aliases: Array.from(this.aliases.entries())
                .filter(([_, target]) => target === actualName)
                .map(([alias]) => alias)
        };
    }

    /**
     * Вывести отчет в консоль
     */
    debug() {
        console.group('💉 Service Container Debug');
        console.log('Registered services:', this.getRegisteredServices());
        console.log('Singleton instances:', this.getSingletonInstances());
        console.log('Aliases:', Array.from(this.aliases.entries()));

        console.group('Service Details:');
        this.getRegisteredServices().forEach(name => {
            console.log(name, this.getServiceInfo(name));
        });
        console.groupEnd();

        console.groupEnd();
    }
}

// Создаем глобальный контейнер
window.container = new ServiceContainer();

// ========================================
// РЕГИСТРАЦИЯ БАЗОВЫХ СЕРВИСОВ
// ========================================

// State Manager
container.registerSingleton('stateManager', () => {
    if (!window.StateManager) {
        throw new Error('StateManager class not loaded');
    }
    return window.stateManager || new StateManager();
});

// Error Boundary
container.registerSingleton('errorBoundary', () => {
    if (!window.ErrorBoundary) {
        throw new Error('ErrorBoundary class not loaded');
    }
    return window.errorBoundary || new ErrorBoundary();
});

// Logger
container.registerSingleton('logger', () => {
    if (!window.Logger) {
        throw new Error('Logger class not loaded');
    }
    return window.logger || new Logger();
});

// Sound Manager
container.registerSingleton('soundManager', () => {
    if (!window.SoundManager) {
        throw new Error('SoundManager not loaded');
    }
    return window.soundManager;
});

// Performance Optimizer
container.registerSingleton('performanceOptimizer', () => {
    if (!window.PerformanceOptimizer) {
        throw new Error('PerformanceOptimizer not loaded');
    }
    return window.performanceOptimizer;
});

// Performance Monitor
container.registerSingleton('performanceMonitor', () => {
    if (!window.PerformanceMonitor) {
        throw new Error('PerformanceMonitor not loaded');
    }
    return window.performanceMonitor;
});

// Wallet Connector
container.registerSingleton('walletConnector', (c) => {
    if (!window.walletConnector) {
        throw new Error('Wallet connector not loaded');
    }

    // Можно добавить зависимости если нужно
    const stateManager = c.get('stateManager');
    const errorBoundary = c.get('errorBoundary');

    // Подключаем к walletConnector
    if (stateManager && !window.walletConnector._stateManager) {
        window.walletConnector._stateManager = stateManager;
    }

    if (errorBoundary && !window.walletConnector._errorBoundary) {
        window.walletConnector._errorBoundary = errorBoundary;
    }

    return window.walletConnector;
});

// Boost Manager
container.registerSingleton('boostManager', (c) => {
    if (!window.BoostManager) {
        throw new Error('BoostManager not loaded');
    }

    // Если уже создан глобальный экземпляр
    if (window.boostManager) {
        return window.boostManager;
    }

    // Создаем новый с зависимостями
    const stateManager = c.get('stateManager');
    const errorBoundary = c.get('errorBoundary');

    const manager = new BoostManager();
    manager._stateManager = stateManager;
    manager._errorBoundary = errorBoundary;

    window.boostManager = manager;
    return manager;
});

// Boost Effects
container.registerSingleton('boostEffects', () => {
    if (!window.boostEffects) {
        throw new Error('BoostEffects not loaded');
    }
    return window.boostEffects;
});

// Boss System
container.registerSingleton('bossSystem', () => {
    if (!window.BossSystem) {
        throw new Error('BossSystem not loaded');
    }
    return window.bossSystem || new BossSystem();
});

// Экспортируем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceContainer;
}
