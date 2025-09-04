// 🛠️ PHAROS INVADERS - TOURNAMENT UTILITIES
// Вспомогательные функции для турнирной системы

const TournamentUtils = {

    // 📧 ФОРМАТИРОВАНИЕ АДРЕСОВ
    formatAddress(address) {
        if (!address || typeof address !== 'string') return '';
        if (address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    // ⏰ ФОРМАТИРОВАНИЕ ВРЕМЕНИ
    formatTime(seconds) {
        if (typeof seconds !== 'number' || seconds < 0) return '00:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    },

    // 🕐 ПОЛУЧИТЬ ЧЕЛОВЕКОЧИТАЕМОЕ ВРЕМЯ
    getHumanTime(timestamp) {
        try {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        } catch (error) {
            return 'Invalid date';
        }
    },

    // 📊 ФОРМАТИРОВАНИЕ ЧИСЕЛ
    formatNumber(number) {
        if (typeof number !== 'number') return '0';
        return number.toLocaleString();
    },

    // 💰 ФОРМАТИРОВАНИЕ ВАЛЮТЫ
    formatCurrency(amount, decimals = 3) {
        if (typeof amount !== 'string' && typeof amount !== 'number') return '0.000';

        const num = parseFloat(amount);
        if (isNaN(num)) return '0.000';

        return num.toFixed(decimals);
    },

    // 🔒 ВАЛИДАЦИЯ ДАННЫХ
    validateScore(score) {
        if (typeof score !== 'number') return false;
        if (!Number.isInteger(score)) return false;
        if (score < 0) return false;
        if (score > TOURNAMENT_CONFIG.MAX_REASONABLE_SCORE) return false;
        return true;
    },

    validatePlayerName(name) {
        if (!name || typeof name !== 'string') return false;

        // Удаляем пробелы по краям
        name = name.trim();

        // Проверяем длину
        if (name.length < 1 || name.length > 20) return false;

        // Проверяем на недопустимые символы (только буквы, цифры, пробелы)
        if (!/^[a-zA-Z0-9\s]+$/.test(name)) return false;

        // Проверяем на подозрительные паттерны
        const suspiciousPatterns = [
            'script', 'onclick', 'onerror', 'javascript:',
            '<', '>', '&', '"', "'", '\\', '/'
        ];

        const lowerName = name.toLowerCase();
        for (let pattern of suspiciousPatterns) {
            if (lowerName.includes(pattern)) return false;
        }

        return true;
    },

    // 🧹 САНИТИЗАЦИЯ ИМЕНИ ИГРОКА
    sanitizePlayerName(name) {
        if (!name || typeof name !== 'string') return '';

        // Удаляем пробелы по краям
        name = name.trim();

        // Удаляем опасные символы
        name = name.replace(/[<>'"&\\\/]/g, '');

        // Обрезаем до максимальной длины
        if (name.length > 20) {
            name = name.substring(0, 20);
        }

        return name;
    },

    // 🏆 РАБОТА С РЕЙТИНГОМ
    sortByScore(leaderboard) {
        if (!Array.isArray(leaderboard)) return [];

        return leaderboard
            .filter(entry => entry && typeof entry.score === 'number')
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));
    },

    // 🏆 НАЙТИ ПОЗИЦИЮ ИГРОКА
    findPlayerRank(leaderboard, playerAddress) {
        if (!Array.isArray(leaderboard) || !playerAddress) return 0;

        const sortedBoard = this.sortByScore(leaderboard);
        const playerEntry = sortedBoard.find(entry =>
            entry.player && entry.player.toLowerCase() === playerAddress.toLowerCase()
        );

        return playerEntry ? playerEntry.rank : 0;
    },

    // 🥇 ПОЛУЧИТЬ ПОЗИЦИЮ В РЕЙТИНГЕ
    getRankPosition(leaderboard, playerAddress) {
        const sortedBoard = this.sortByScore(leaderboard);
        const index = sortedBoard.findIndex(entry =>
            entry.player && entry.player.toLowerCase() === playerAddress.toLowerCase()
        );
        return index >= 0 ? index + 1 : 0;
    },

    // 🏆 ПОЛУЧИТЬ ПРОЦЕНТ ПРИЗА ПО ПОЗИЦИИ
    getPrizePercentage(rank) {
        switch (rank) {
            case 1: return `${TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.FIRST_PLACE}%`;
            case 2: return `${TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.SECOND_PLACE}%`;
            case 3: return `${TOURNAMENT_CONFIG.PRIZE_DISTRIBUTION.THIRD_PLACE}%`;
            default: return '-';
        }
    },

    // 🥇 ПОЛУЧИТЬ МЕДАЛЬ ПО ПОЗИЦИИ
    getMedal(rank) {
        const medals = ['🥇', '🥈', '🥉'];
        return rank <= 3 ? medals[rank - 1] : '';
    },

    // 🎨 ПОЛУЧИТЬ ЦВЕТ ПО ПОЗИЦИИ
    getRankColor(rank) {
        switch (rank) {
            case 1: return '#ffd700'; // Золотой
            case 2: return '#c0c0c0'; // Серебряный
            case 3: return '#cd7f32'; // Бронзовый
            default: return '#00ddff'; // Обычный
        }
    },

    // 🔐 ГЕНЕРАЦИЯ БЕЗОПАСНОГО ID
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `tournament_${timestamp}_${random}`;
    },

    // 📱 ОПРЕДЕЛЕНИЕ УСТРОЙСТВА
    isMobile() {
        return window.innerWidth <= TOURNAMENT_CONFIG.MOBILE_BREAKPOINT;
    },

    isTablet() {
        return window.innerWidth <= TOURNAMENT_CONFIG.TABLET_BREAKPOINT &&
               window.innerWidth > TOURNAMENT_CONFIG.MOBILE_BREAKPOINT;
    },

    isDesktop() {
        return window.innerWidth > TOURNAMENT_CONFIG.TABLET_BREAKPOINT;
    },

    // 🌐 РАБОТА С URL
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    setUrlParameter(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
    },

    removeUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete(name);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
    },

    // 💾 ЛОКАЛЬНОЕ ХРАНИЛИЩЕ
    saveToStorage(key, data) {
        try {
            localStorage.setItem(`tournament_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            Logger.error('Storage save error:', error);
            return false;
        }
    },

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`tournament_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            Logger.error('Storage load error:', error);
            return null;
        }
    },

    removeFromStorage(key) {
        try {
            localStorage.removeItem(`tournament_${key}`);
            return true;
        } catch (error) {
            Logger.error('Storage remove error:', error);
            return false;
        }
    },

    clearTournamentStorage() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('tournament_')) {
                    localStorage.removeItem(key);
                }
            });
            Logger.log('Tournament storage cleared');
            return true;
        } catch (error) {
            Logger.error('Error clearing tournament storage:', error);
            return false;
        }
    },

    // 🔍 ВАЛИДАЦИЯ ТРАНЗАКЦИЙ
    isValidTransactionHash(txHash) {
        if (!txHash || typeof txHash !== 'string') return false;
        return /^0x[a-fA-F0-9]{64}$/.test(txHash);
    },

    isValidEthereumAddress(address) {
        if (!address || typeof address !== 'string') return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },

    // 🎭 АНИМАЦИИ И ЭФФЕКТЫ
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Плавная анимация числа
    animateNumber(element, from, to, duration = 1000) {
        if (!element) return;

        const start = Date.now();
        const difference = to - from;

        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutCubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + difference * easeProgress);

            element.textContent = this.formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    },

    // Анимация валюты
    animateCurrency(element, from, to, duration = 1000, decimals = 3) {
        if (!element) return;

        const start = Date.now();
        const difference = to - from;

        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = from + difference * easeProgress;

            element.textContent = this.formatCurrency(current, decimals) + ' PHRS';

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    },

    // 🎯 ОПРЕДЕЛЕНИЕ СТАТУСА ТУРНИРА
    getTournamentStatus(tournamentInfo) {
        if (!tournamentInfo) return TOURNAMENT_CONFIG.TOURNAMENT_STATES.NOT_STARTED;

        const currentTime = Math.floor(Date.now() / 1000);

        if (tournamentInfo.isFinished) {
            return TOURNAMENT_CONFIG.TOURNAMENT_STATES.ENDED;
        } else if (tournamentInfo.isActive) {
            if (currentTime >= tournamentInfo.endTime) {
                return TOURNAMENT_CONFIG.TOURNAMENT_STATES.TIME_EXPIRED;
            } else {
                return TOURNAMENT_CONFIG.TOURNAMENT_STATES.ACTIVE;
            }
        } else {
            return TOURNAMENT_CONFIG.TOURNAMENT_STATES.NOT_STARTED;
        }
    },

    getStatusText(status) {
        switch (status) {
            case 'NOT_STARTED': return '🚫 Not Started';
            case 'ACTIVE': return '✅ Active';
            case 'TIME_EXPIRED': return '⏰ Time Expired';
            case 'ENDED': return '🏁 Ended';
            case 'ERROR': return '❌ Error';
            default: return '❓ Unknown';
        }
    },

    // 🔊 ЗВУКОВЫЕ ЭФФЕКТЫ
    playSound(soundName) {
        // Заглушка для будущих звуковых эффектов
        if (TOURNAMENT_CONFIG.DEBUG_MODE) {
            Logger.log(`🔊 Playing sound: ${soundName}`);
        }
    },

    // 📊 СТАТИСТИКА
    calculateWinRate(wins, totalGames) {
        if (totalGames === 0) return 0;
        return Math.round((wins / totalGames) * 100);
    },

    calculateAverageScore(scores) {
        if (!Array.isArray(scores) || scores.length === 0) return 0;
        const sum = scores.reduce((total, score) => total + (score || 0), 0);
        return Math.round(sum / scores.length);
    },

    // 🎨 ЦВЕТОВЫЕ УТИЛИТЫ
    hexToRgba(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return null;
    },

    // ⚡ ПРОИЗВОДИТЕЛЬНОСТЬ
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

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

    // 🛡️ БЕЗОПАСНОСТЬ
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 🎮 ИГРОВАЯ ЛОГИКА
    calculateGameDifficulty(level) {
        if (level <= 1) return 'Easy';
        if (level <= 5) return 'Normal';
        if (level <= 10) return 'Hard';
        return 'Extreme';
    },

    // 📈 ПРОГРЕСС
    calculateProgress(current, total) {
        if (total === 0) return 0;
        return Math.min(Math.max((current / total) * 100, 0), 100);
    },

    // 🎪 DOM УТИЛИТЫ
    fadeIn(element, duration = 300) {
        if (!element) return;

        element.style.opacity = 0;
        element.style.display = 'block';

        const start = Date.now();

        const fade = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            element.style.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };

        requestAnimationFrame(fade);
    },

    fadeOut(element, duration = 300) {
        if (!element) return;

        const start = Date.now();
        const startOpacity = parseFloat(window.getComputedStyle(element).opacity) || 1;

        const fade = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            element.style.opacity = startOpacity * (1 - progress);

            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(fade);
            }
        };

        requestAnimationFrame(fade);
    },

    // 🔧 ОТЛАДКА
    log(message, type = 'info') {
        if (!TOURNAMENT_CONFIG.CONSOLE_LOGGING) return;

        const timestamp = new Date().toISOString();
        const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';

        Logger.log(`${emoji} [${timestamp}] ${message}`);
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TournamentUtils;
} else if (typeof window !== 'undefined') {
    window.TournamentUtils = TournamentUtils;
}

Logger.log('🛠️ Tournament utilities loaded');