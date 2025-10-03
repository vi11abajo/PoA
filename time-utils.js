// ⏰ TIME UTILS
// Утилиты для работы со временем и таймерами

window.timeUtils = {
    /**
     * Форматирование времени турнира (MM:SS)
     * @param {number} milliseconds - Миллисекунды
     * @returns {string} Отформатированное время
     */
    formatTournamentTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Форматирование времени с часами (HH:MM:SS)
     */
    formatTimeWithHours(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Форматирование даты для leaderboard (относительное время)
     */
    formatLeaderboardDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;

        // Менее минуты назад
        if (diff < 60000) {
            return 'Just now';
        }

        // Менее часа назад
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }

        // Менее дня назад
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }

        // Менее недели назад
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }

        // Полная дата
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    },

    /**
     * Форматирование полной даты и времени
     */
    formatFullDateTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Создать countdown таймер
     * @param {number} endTime - Время окончания (timestamp)
     * @param {Function} callback - Функция обратного вызова
     * @returns {Function} Функция очистки
     */
    createCountdown(endTime, callback) {
        const update = () => {
            const now = Date.now();
            const remaining = endTime - now;

            if (remaining <= 0) {
                callback({
                    finished: true,
                    remaining: 0,
                    formatted: '0:00',
                    percentage: 0
                });
                return true; // Остановить таймер
            }

            callback({
                finished: false,
                remaining: remaining,
                formatted: this.formatTournamentTime(remaining),
                percentage: null // можно передать общую длительность для расчета
            });

            return false; // Продолжить таймер
        };

        // Первый вызов сразу
        if (update()) {
            return () => {}; // Уже завершен
        }

        // Устанавливаем интервал
        const interval = setInterval(() => {
            if (update()) {
                clearInterval(interval);
            }
        }, 1000);

        // Возвращаем функцию очистки
        return () => clearInterval(interval);
    },

    /**
     * Создать таймер с процентами прогресса
     * @param {number} startTime - Время начала
     * @param {number} duration - Длительность (миллисекунды)
     * @param {Function} callback - Функция обратного вызова
     */
    createProgressTimer(startTime, duration, callback) {
        const endTime = startTime + duration;

        return this.createCountdown(endTime, (data) => {
            if (!data.finished) {
                const elapsed = Date.now() - startTime;
                data.percentage = Math.min(100, (elapsed / duration) * 100);
            }
            callback(data);
        });
    },

    /**
     * Debounce функция с таймером
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle функция с таймером
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Задержка (Promise)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Timeout для Promise
     */
    timeout(promise, ms, errorMessage = 'Operation timeout') {
        return Promise.race([
            promise,
            this.delay(ms).then(() => {
                throw new Error(errorMessage);
            })
        ]);
    },

    /**
     * Retry с экспоненциальной задержкой
     */
    async retryWithBackoff(fn, maxAttempts = 3, initialDelay = 1000) {
        let lastError;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt < maxAttempts - 1) {
                    const delay = initialDelay * Math.pow(2, attempt);
                    await this.delay(delay);
                }
            }
        }

        throw lastError;
    },

    /**
     * Получить timestamp в секундах (для blockchain)
     */
    getTimestampSeconds() {
        return Math.floor(Date.now() / 1000);
    },

    /**
     * Проверка истечения времени
     */
    isExpired(timestamp, durationMs) {
        return Date.now() > timestamp + durationMs;
    },

    /**
     * Получить оставшееся время
     */
    getTimeRemaining(endTime) {
        const remaining = endTime - Date.now();
        return Math.max(0, remaining);
    },

    /**
     * Форматирование длительности (человекопонятное)
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);

        if (seconds < 60) {
            return `${seconds} seconds`;
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }

        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
    },

    /**
     * FPS таймер для анимаций
     */
    createAnimationTimer(fps = 60) {
        const interval = 1000 / fps;
        let lastTime = Date.now();
        let animationFrameId = null;

        const animate = (callback) => {
            const now = Date.now();
            const delta = now - lastTime;

            if (delta >= interval) {
                lastTime = now - (delta % interval);
                callback(delta);
            }

            animationFrameId = requestAnimationFrame(() => animate(callback));
        };

        return {
            start: (callback) => {
                lastTime = Date.now();
                animate(callback);
            },
            stop: () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }
        };
    }
};
