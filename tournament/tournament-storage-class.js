// 💾 PHAROS INVADERS - TOURNAMENT STORAGE
// Система хранения данных турнира в localStorage

class TournamentStorage {
    constructor(tournamentId) {
        this.tournamentId = tournamentId;
        this.storagePrefix = `tournament_${tournamentId}_`;
        this.playerAttemptsKey = this.storagePrefix + 'player_attempts';
        this.playerGamesKey = this.storagePrefix + 'player_games';
        this.tournamentStatusKey = this.storagePrefix + 'status';
        this.tournamentInfoKey = this.storagePrefix + 'info';
        this.leaderboardKey = this.storagePrefix + 'leaderboard';

        // Инициализация хранилища
        this.initStorage();
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    // Инициализация хранилища
    initStorage() {
        try {
            // Создаем базовые структуры данных если их нет
            if (!localStorage.getItem(this.playerAttemptsKey)) {
                localStorage.setItem(this.playerAttemptsKey, JSON.stringify({}));
            }

            if (!localStorage.getItem(this.playerGamesKey)) {
                localStorage.setItem(this.playerGamesKey, JSON.stringify({}));
            }

            if (!localStorage.getItem(this.tournamentStatusKey)) {
                this.saveTournamentStatus('not-started');
            }

        } catch (error) {
            Logger.error('❌ Error initializing storage:', error);
        }
    }

    // ========== УПРАВЛЕНИЕ ПОПЫТКАМИ ==========

    // Увеличить количество попыток игрока
    incrementPlayerAttempts(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ incrementPlayerAttempts: No player address provided');
            return;
        }

        try {
            const attempts = this.getStoredPlayerAttempts();
            const currentAttempts = attempts[playerAddress.toLowerCase()] || 0;

            // ИСПРАВЛЕНО: Не позволяем превышать лимит попыток
            if (currentAttempts >= 3) {
                Logger.warn(`⚠️ Attempt to increment beyond limit: ${currentAttempts}/3 for ${playerAddress}`);
                return currentAttempts; // Возвращаем текущее значение без изменений
            }

            const newAttempts = currentAttempts + 1;
            attempts[playerAddress.toLowerCase()] = newAttempts;
            localStorage.setItem(this.playerAttemptsKey, JSON.stringify(attempts));

            return newAttempts;

        } catch (error) {
            Logger.error('❌ Error incrementing player attempts:', error);
            return 0;
        }
    }

    // Проверить, может ли игрок играть
    canPlayerPlay(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ canPlayerPlay: No player address provided');
            return false;
        }

        const attempts = this.getStoredPlayerAttempts();
        const playerAttempts = attempts[playerAddress.toLowerCase()] || 0;
        const canPlay = playerAttempts < 3;

        return canPlay;
    }

    // Получить количество попыток игрока
    getPlayerAttempts(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ getPlayerAttempts: No player address provided');
            return 0;
        }

        try {
            const attempts = this.getStoredPlayerAttempts();
            const playerAttempts = attempts[playerAddress.toLowerCase()] || 0;
            return playerAttempts;
        } catch (error) {
            Logger.error('❌ Error getting player attempts:', error);
            return 0;
        }
    }

    // Сбросить попытки игрока
    resetPlayerAttempts(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ resetPlayerAttempts: No player address provided');
            return false;
        }

        try {
            const attempts = this.getStoredPlayerAttempts();
            attempts[playerAddress.toLowerCase()] = 0;
            localStorage.setItem(this.playerAttemptsKey, JSON.stringify(attempts));

            return true;

        } catch (error) {
            Logger.error('❌ Error resetting player attempts:', error);
            return false;
        }
    }

    // Очистить данные игрока при регистрации
    clearPlayerDataOnRegistration(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ clearPlayerDataOnRegistration: No player address provided');
            return false;
        }

        try {

            // 1. Сбрасываем попытки
            const attempts = this.getStoredPlayerAttempts();
            attempts[playerAddress.toLowerCase()] = 0;
            localStorage.setItem(this.playerAttemptsKey, JSON.stringify(attempts));

            // 2. Очищаем игровые данные
            const games = this.getStoredPlayerGames();
            delete games[playerAddress.toLowerCase()];
            localStorage.setItem(this.playerGamesKey, JSON.stringify(games));

            return true;

        } catch (error) {
            Logger.error('❌ Error clearing player data:', error);
            return false;
        }
    }

    // ========== УПРАВЛЕНИЕ ИГРАМИ ==========

    // Сохранить результат игры
    saveGameResult(playerAddress, gameData) {
        if (!playerAddress || !gameData) {
            Logger.error('❌ saveGameResult: Invalid parameters');
            return false;
        }

        try {
            const games = this.getStoredPlayerGames();
            const playerKey = playerAddress.toLowerCase();

            // Инициализируем данные игрока если их нет
            if (!games[playerKey]) {
                games[playerKey] = {
                    scores: [],
                    bestScore: 0,
                    totalGames: 0,
                    lastPlayed: null,
                    averageScore: 0
                };
            }

            // Обновляем данные
            const player = games[playerKey];
            player.scores.push(gameData.score);
            player.bestScore = Math.max(player.bestScore, gameData.score);
            player.totalGames = player.scores.length;
            player.lastPlayed = Date.now();
            player.averageScore = Math.round(player.scores.reduce((sum, score) => sum + score, 0) / player.scores.length);

            // Добавляем метаданные игры если есть
            if (gameData.level) player.lastLevel = gameData.level;
            if (gameData.duration) player.lastDuration = gameData.duration;

            localStorage.setItem(this.playerGamesKey, JSON.stringify(games));

            return true;

        } catch (error) {
            Logger.error('❌ Error saving game result:', error);
            return false;
        }
    }

    // Получить данные игр игрока
    getPlayerGameData(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ getPlayerGameData: No player address provided');
            return null;
        }

        try {
            const games = this.getStoredPlayerGames();
            const playerData = games[playerAddress.toLowerCase()];

            if (!playerData) {
                return {
                    scores: [],
                    bestScore: 0,
                    totalGames: 0,
                    lastPlayed: null,
                    averageScore: 0
                };
            }

            return playerData;

        } catch (error) {
            Logger.error('❌ Error getting player game data:', error);
            return null;
        }
    }

    // Получить лучший результат игрока
    getPlayerBestScore(playerAddress) {
        const gameData = this.getPlayerGameData(playerAddress);
        return gameData ? gameData.bestScore : 0;
    }

    // ========== СТАТУС ТУРНИРА ==========

    // Сохранить статус турнира
    saveTournamentStatus(status) {
        try {
            const tournamentData = {
                status: status,
                lastUpdated: Date.now(),
                updatedBy: 'system'
            };

            localStorage.setItem(this.tournamentStatusKey, JSON.stringify(tournamentData));
            return true;

        } catch (error) {
            Logger.error('❌ Error saving tournament status:', error);
            return false;
        }
    }

    // Получить статус турнира
    getTournamentStatus() {
        try {
            const data = localStorage.getItem(this.tournamentStatusKey);
            if (data) {
                const tournamentData = JSON.parse(data);
                return tournamentData.status || 'not-started';
            }
            return 'not-started';

        } catch (error) {
            Logger.error('❌ Error getting tournament status:', error);
            return 'not-started';
        }
    }

    // Получить полные данные статуса турнира
    getTournamentStatusData() {
        try {
            const data = localStorage.getItem(this.tournamentStatusKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            Logger.error('❌ Error getting tournament status data:', error);
            return null;
        }
    }

    // ========== ИНФОРМАЦИЯ О ТУРНИРЕ ==========

    // Сохранить информацию о турнире
    saveTournamentInfo(info) {
        try {
            const tournamentInfo = {
                ...info,
                lastUpdated: Date.now()
            };

            localStorage.setItem(this.tournamentInfoKey, JSON.stringify(tournamentInfo));
            return true;

        } catch (error) {
            Logger.error('❌ Error saving tournament info:', error);
            return false;
        }
    }

    // Получить информацию о турнире
    getTournamentInfo() {
        try {
            const data = localStorage.getItem(this.tournamentInfoKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            Logger.error('❌ Error getting tournament info:', error);
            return null;
        }
    }

    // ========== ЛИДЕРБОРД ==========

    // Сохранить лидерборд
    saveLeaderboard(leaderboard) {
        try {
            const leaderboardData = {
                entries: leaderboard,
                lastUpdated: Date.now()
            };

            localStorage.setItem(this.leaderboardKey, JSON.stringify(leaderboardData));
            return true;

        } catch (error) {
            Logger.error('❌ Error saving leaderboard:', error);
            return false;
        }
    }

    // Получить лидерборд
    getLeaderboard() {
        try {
            const data = localStorage.getItem(this.leaderboardKey);
            if (data) {
                const leaderboardData = JSON.parse(data);
                return leaderboardData.entries || [];
            }
            return [];

        } catch (error) {
            Logger.error('❌ Error getting leaderboard:', error);
            return [];
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    // Получить сохраненные попытки
    getStoredPlayerAttempts() {
        try {
            const data = localStorage.getItem(this.playerAttemptsKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            Logger.error('❌ Error parsing stored attempts:', error);
            return {};
        }
    }

    // Получить сохраненные игры
    getStoredPlayerGames() {
        try {
            const data = localStorage.getItem(this.playerGamesKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            Logger.error('❌ Error parsing stored games:', error);
            return {};
        }
    }

    // ========== СТАТИСТИКА И АНАЛИЗ ==========

    // Получить статистику хранилища
    getStorageStats() {
        try {
            const attempts = this.getStoredPlayerAttempts();
            const games = this.getStoredPlayerGames();

            const stats = {
                tournamentId: this.tournamentId,
                totalPlayers: Object.keys(attempts).length,
                totalGamesPlayed: Object.values(games).reduce((sum, player) => sum + (player.totalGames || 0), 0),
                playersWithAttempts: Object.values(attempts).filter(count => count > 0).length,
                averageAttemptsUsed: this.calculateAverageAttempts(attempts),
                topScore: this.getTopScore(games),
                storageUsed: this.calculateStorageUsage(),
                lastActivity: this.getLastActivity(games)
            };

            return stats;

        } catch (error) {
            Logger.error('❌ Error getting storage stats:', error);
            return null;
        }
    }

    // Рассчитать средние попытки
    calculateAverageAttempts(attempts) {
        const values = Object.values(attempts).filter(count => count > 0);
        if (values.length === 0) return 0;
        return Math.round((values.reduce((sum, count) => sum + count, 0) / values.length) * 100) / 100;
    }

    // Получить топ счет
    getTopScore(games) {
        let topScore = 0;
        let topPlayer = null;

        Object.entries(games).forEach(([address, data]) => {
            if (data.bestScore > topScore) {
                topScore = data.bestScore;
                topPlayer = address;
            }
        });

        return { score: topScore, player: topPlayer };
    }

    // Получить последнюю активность
    getLastActivity(games) {
        let lastActivity = 0;

        Object.values(games).forEach(data => {
            if (data.lastPlayed && data.lastPlayed > lastActivity) {
                lastActivity = data.lastPlayed;
            }
        });

        return lastActivity;
    }

    // Рассчитать использование хранилища
    calculateStorageUsage() {
        let totalSize = 0;
        const keys = [
            this.playerAttemptsKey,
            this.playerGamesKey,
            this.tournamentStatusKey,
            this.tournamentInfoKey,
            this.leaderboardKey
        ];

        try {
            keys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    totalSize += data.length;
                }
            });

            const sizeKB = totalSize / 1024;
            return {
                bytes: totalSize,
                kb: Math.round(sizeKB * 100) / 100,
                formatted: sizeKB < 1 ? `${totalSize} B` : `${Math.round(sizeKB * 100) / 100} KB`
            };

        } catch (error) {
            Logger.error('❌ Error calculating storage usage:', error);
            return { bytes: 0, kb: 0, formatted: 'unknown' };
        }
    }

    // ========== ВАЛИДАЦИЯ И ЦЕЛОСТНОСТЬ ==========

    // Проверить целостность данных
    validateData() {
        try {
            const attempts = this.getStoredPlayerAttempts();
            const games = this.getStoredPlayerGames();

            let isValid = true;
            const issues = [];

            // Проверяем попытки
            Object.entries(attempts).forEach(([address, attemptCount]) => {
                if (typeof attemptCount !== 'number' || attemptCount < 0 || attemptCount > 3) {
                    isValid = false;
                    issues.push(`Invalid attempt count for ${address}: ${attemptCount}`);
                }

                if (!TournamentUtils.isValidEthereumAddress(address)) {
                    isValid = false;
                    issues.push(`Invalid Ethereum address: ${address}`);
                }
            });

            // Проверяем игры
            Object.entries(games).forEach(([address, gameData]) => {
                if (!gameData || typeof gameData !== 'object') {
                    isValid = false;
                    issues.push(`Invalid game data for ${address}`);
                    return;
                }

                if (!gameData.scores || !Array.isArray(gameData.scores)) {
                    isValid = false;
                    issues.push(`Invalid scores array for ${address}`);
                }

                if (typeof gameData.bestScore !== 'number' || gameData.bestScore < 0) {
                    isValid = false;
                    issues.push(`Invalid best score for ${address}: ${gameData.bestScore}`);
                }
            });

            return { isValid, issues };

        } catch (error) {
            Logger.error('❌ Error validating data:', error);
            return { isValid: false, issues: [error.message] };
        }
    }

    // Починить поврежденные данные
    repairData() {
        try {

            const attempts = this.getStoredPlayerAttempts();
            const games = this.getStoredPlayerGames();

            let repaired = 0;

            // Чиним попытки
            Object.entries(attempts).forEach(([address, attemptCount]) => {
                if (typeof attemptCount !== 'number' || attemptCount < 0 || attemptCount > 3) {
                    attempts[address] = Math.max(0, Math.min(3, parseInt(attemptCount) || 0));
                    repaired++;
                }
            });

            // Чиним игровые данные
            Object.entries(games).forEach(([address, gameData]) => {
                if (!gameData || typeof gameData !== 'object') {
                    games[address] = this.createEmptyPlayerData();
                    repaired++;
                    return;
                }

                if (!gameData.scores || !Array.isArray(gameData.scores)) {
                    gameData.scores = [];
                    repaired++;
                }

                if (typeof gameData.bestScore !== 'number') {
                    gameData.bestScore = Math.max(...gameData.scores, 0);
                    repaired++;
                }

                if (typeof gameData.totalGames !== 'number') {
                    gameData.totalGames = gameData.scores.length;
                    repaired++;
                }
            });

            // Сохраняем исправленные данные
            localStorage.setItem(this.playerAttemptsKey, JSON.stringify(attempts));
            localStorage.setItem(this.playerGamesKey, JSON.stringify(games));

            return repaired;

        } catch (error) {
            Logger.error('❌ Error repairing data:', error);
            return 0;
        }
    }

    // Создать пустые данные игрока
    createEmptyPlayerData() {
        return {
            scores: [],
            bestScore: 0,
            totalGames: 0,
            lastPlayed: null,
            averageScore: 0
        };
    }

    // ========== ЭКСПОРТ/ИМПОРТ ==========

    // Экспорт всех данных
    exportData() {
        try {
            const data = {
                tournamentId: this.tournamentId,
                attempts: this.getStoredPlayerAttempts(),
                games: this.getStoredPlayerGames(),
                status: this.getTournamentStatusData(),
                info: this.getTournamentInfo(),
                leaderboard: this.getLeaderboard(),
                stats: this.getStorageStats(),
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };

            return data;

        } catch (error) {
            Logger.error('❌ Error exporting data:', error);
            return null;
        }
    }

    // Импорт данных
    importData(data) {
        try {
            if (!data || data.tournamentId !== this.tournamentId) {
                throw new Error('Invalid data or tournament ID mismatch');
            }

            let imported = 0;

            if (data.attempts) {
                localStorage.setItem(this.playerAttemptsKey, JSON.stringify(data.attempts));
                imported++;
            }

            if (data.games) {
                localStorage.setItem(this.playerGamesKey, JSON.stringify(data.games));
                imported++;
            }

            if (data.status) {
                localStorage.setItem(this.tournamentStatusKey, JSON.stringify(data.status));
                imported++;
            }

            if (data.info) {
                this.saveTournamentInfo(data.info);
                imported++;
            }

            if (data.leaderboard) {
                this.saveLeaderboard(data.leaderboard);
                imported++;
            }

            return true;

        } catch (error) {
            Logger.error('❌ Error importing data:', error);
            return false;
        }
    }

    // ========== ОЧИСТКА ==========

    // Очистить все данные турнира
    clearAllTournamentData() {
        try {
            const keys = [
                this.playerAttemptsKey,
                this.playerGamesKey,
                this.tournamentStatusKey,
                this.tournamentInfoKey,
                this.leaderboardKey
            ];

            keys.forEach(key => {
                localStorage.removeItem(key);
            });

            return true;

        } catch (error) {
            Logger.error('❌ Error clearing tournament data:', error);
            return false;
        }
    }

    // Очистить данные игрока
    clearPlayerData(playerAddress) {
        if (!playerAddress) {
            Logger.error('❌ clearPlayerData: No player address provided');
            return false;
        }

        try {
            const attempts = this.getStoredPlayerAttempts();
            const games = this.getStoredPlayerGames();

            delete attempts[playerAddress.toLowerCase()];
            delete games[playerAddress.toLowerCase()];

            localStorage.setItem(this.playerAttemptsKey, JSON.stringify(attempts));
            localStorage.setItem(this.playerGamesKey, JSON.stringify(games));

            return true;

        } catch (error) {
            Logger.error('❌ Error clearing player data:', error);
            return false;
        }
    }

    // ========== ОТЛАДКА ==========

    // Получить отладочную информацию
    getDebugInfo() {
        return {
            tournamentId: this.tournamentId,
            storageKeys: {
                attempts: this.playerAttemptsKey,
                games: this.playerGamesKey,
                status: this.tournamentStatusKey,
                info: this.tournamentInfoKey,
                leaderboard: this.leaderboardKey
            },
            stats: this.getStorageStats(),
            validation: this.validateData(),
            browserSupport: {
                localStorage: typeof Storage !== 'undefined',
                json: typeof JSON !== 'undefined'
            }
        };
    }
}

// Экспорт класса
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TournamentStorage;
} else if (typeof window !== 'undefined') {
    window.TournamentStorage = TournamentStorage;
}

