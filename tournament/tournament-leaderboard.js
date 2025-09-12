// 🏆 PHAROS INVADERS - TOURNAMENT LEADERBOARD
// Управление лидербордом турнира (ИСПРАВЛЕНО - убран двойной подсчет попыток)

class TournamentLeaderboard {
    constructor(tournamentId = 1) {
        this.tournamentId = tournamentId;
        this.leaderboard = [];

    }

    // Получить сохраненный лидерборд
    getStoredLeaderboard() {
        try {
            const stored = localStorage.getItem(`tournament_leaderboard_${this.tournamentId}`);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            Logger.error('❌ Error loading leaderboard:', error);
            return [];
        }
    }

    // Сохранить лидерборд
    saveLeaderboard(leaderboard) {
        try {
            localStorage.setItem(
                `tournament_leaderboard_${this.tournamentId}`,
                JSON.stringify(leaderboard)
            );
            this.leaderboard = leaderboard;
        } catch (error) {
            Logger.error('❌ Error saving leaderboard:', error);
        }
    }

    // 🔥 ИСПРАВЛЕНО: Добавить результат игрока в лидерборд (БЕЗ увеличения попыток здесь)
    addPlayerScore(walletAddress, score, playerName = null) {
        try {

            // Получаем текущий лидерборд
            let leaderboard = this.getStoredLeaderboard();

            // Ищем существующего игрока
            let playerIndex = leaderboard.findIndex(entry =>
                entry.player.toLowerCase() === walletAddress.toLowerCase()
            );

            if (playerIndex !== -1) {
                // Игрок уже есть - добавляем новую попытку
                leaderboard[playerIndex].scores.push(score);

                // 🔥 ИСПРАВЛЕНО: НЕ увеличиваем attempts здесь! Это делается в tournament-storage.js
                // leaderboard[playerIndex].attempts = leaderboard[playerIndex].scores.length; // УБРАНО

                leaderboard[playerIndex].bestScore = Math.max(...leaderboard[playerIndex].scores);

                // Обновляем имя если передано новое
                if (playerName && playerName.trim()) {
                    leaderboard[playerIndex].playerName = playerName.trim();
                }

            } else {
                // Новый игрок
                const newPlayer = {
                    player: walletAddress,
                    playerName: playerName && playerName.trim() ? playerName.trim() : `Player${leaderboard.length + 1}`,
                    scores: [score],
                    bestScore: score,
                    attempts: 1, // 🔥 ИСПРАВЛЕНО: Только для новых игроков устанавливаем 1
                    timestamp: Math.floor(Date.now() / 1000)
                };

                leaderboard.push(newPlayer);
            }

            // Сортируем по лучшему результату
            leaderboard.sort((a, b) => b.bestScore - a.bestScore);

            // Сохраняем обновленный лидерборд
            this.saveLeaderboard(leaderboard);


            return leaderboard;

        } catch (error) {
            Logger.error('❌ Error adding player score:', error);
            return this.getStoredLeaderboard();
        }
    }

    // 🔥 НОВОЕ: Метод для обновления количества попыток игрока (вызывается из storage)
    updatePlayerAttempts(walletAddress, attempts) {
        try {
            let leaderboard = this.getStoredLeaderboard();
            let playerIndex = leaderboard.findIndex(entry =>
                entry.player.toLowerCase() === walletAddress.toLowerCase()
            );

            if (playerIndex !== -1) {
                leaderboard[playerIndex].attempts = attempts;
                this.saveLeaderboard(leaderboard);
            }
        } catch (error) {
            Logger.error('❌ Error updating player attempts:', error);
        }
    }

    // Получить статистику игрока
    getPlayerStats(walletAddress) {
        const leaderboard = this.getStoredLeaderboard();
        const player = leaderboard.find(entry =>
            entry.player.toLowerCase() === walletAddress.toLowerCase()
        );

        if (player) {
            return {
                bestScore: player.bestScore,
                attempts: player.attempts,
                scores: [...player.scores],
                rank: leaderboard.findIndex(p => p.player.toLowerCase() === walletAddress.toLowerCase()) + 1,
                playerName: player.playerName,
                timestamp: player.timestamp
            };
        }

        return {
            bestScore: 0,
            attempts: 0,
            scores: [],
            rank: 0,
            playerName: null,
            timestamp: 0
        };
    }

    // Обновить лидерборд в UI (теперь принимает leaderboardBody как параметр)
    updateLeaderboardUI(leaderboardBody, options = {}) {
        if (!leaderboardBody) {
            Logger.error('❌ Leaderboard body element not provided');
            return;
        }

        // Получаем реальные данные лидерборда
        const leaderboard = this.getStoredLeaderboard();


        leaderboardBody.innerHTML = '';

        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #66ccff;">
                        <em>No scores yet. Be the first to play!</em>
                    </td>
                </tr>
            `;
            return;
        }

        // Показываем топ-100 игроков (или другое количество если указано)
        const maxPlayers = options.maxPlayers || (TOURNAMENT_CONFIG.LEADERBOARD_MAX_ENTRIES || 100);
        const topPlayers = leaderboard.slice(0, maxPlayers);
        const currentWallet = options.currentWallet;

        topPlayers.forEach((entry, index) => {
            const rank = index + 1;
            const row = document.createElement('tr');

            // Подсвечиваем топ-3
            if (rank <= 3) {
                row.classList.add('top-3');
            }

            // Подсвечиваем текущего игрока
            if (currentWallet &&
                entry.player.toLowerCase() === currentWallet.toLowerCase()) {
                row.style.backgroundColor = 'rgba(0, 221, 255, 0.2)';
                row.style.border = '1px solid #00ddff';
            }

            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            const prizePercent = rank === 1 ? '60%' : rank === 2 ? '25%' : rank === 3 ? '5%' : '-';

            // 🔥 ИСПРАВЛЕНО: Показываем правильное количество попыток (максимум 3)
            const attemptsInfo = `${Math.min(entry.attempts, 3)}/3`;
            const scoreDisplay = `${TournamentUtils.formatNumber(entry.bestScore)}`;

            row.innerHTML = `
                <td class="rank-cell">${medal} ${rank}</td>
                <td class="name-cell">
                    ${entry.playerName}
                    <div style="font-size: 10px; color: #66ccff; margin-top: 2px;">
                        ${attemptsInfo} attempts
                    </div>
                </td>
                <td class="address-cell">${TournamentUtils.formatAddress(entry.player)}</td>
                <td class="score-cell">
                    ${scoreDisplay}
                    ${entry.scores.length > 1 ?
                        `<div style="font-size: 10px; color: #aaccff; margin-top: 2px;">
                            All: ${entry.scores.slice(-3).join(', ')}
                        </div>` : ''
                    }
                </td>
                <td class="prize-cell">${prizePercent}</td>
            `;

            leaderboardBody.appendChild(row);
        });

    }

    // 🔥 НОВОЕ: Очистить данные игрока при регистрации в новом турнире
    clearPlayerData(walletAddress) {
        try {
            let leaderboard = this.getStoredLeaderboard();

            // Удаляем игрока из лидерборда если есть
            leaderboard = leaderboard.filter(entry =>
                entry.player.toLowerCase() !== walletAddress.toLowerCase()
            );

            this.saveLeaderboard(leaderboard);
        } catch (error) {
            Logger.error('❌ Error clearing player data:', error);
        }
    }

    // Получить топ игроков (для других модулей)
    getTopPlayers(limit = 100) {
        const leaderboard = this.getStoredLeaderboard();
        return leaderboard.slice(0, limit);
    }

    // Получить общую статистику лидерборда
    getLeaderboardStats() {
        const leaderboard = this.getStoredLeaderboard();

        if (leaderboard.length === 0) {
            return {
                totalPlayers: 0,
                totalGames: 0,
                averageScore: 0,
                highestScore: 0,
                averageAttempts: 0
            };
        }

        const totalGames = leaderboard.reduce((sum, player) => sum + Math.min(player.attempts, 3), 0);
        const totalScore = leaderboard.reduce((sum, player) => sum + player.bestScore, 0);
        const highestScore = Math.max(...leaderboard.map(p => p.bestScore));
        const averageScore = Math.round(totalScore / leaderboard.length);
        const averageAttempts = Math.round((totalGames / leaderboard.length) * 10) / 10;

        return {
            totalPlayers: leaderboard.length,
            totalGames: totalGames,
            averageScore: averageScore,
            highestScore: highestScore,
            averageAttempts: averageAttempts
        };
    }

    // Получить позицию игрока в лидерборде
    getPlayerRank(walletAddress) {
        const leaderboard = this.getStoredLeaderboard();
        const playerIndex = leaderboard.findIndex(entry =>
            entry.player.toLowerCase() === walletAddress.toLowerCase()
        );
        return playerIndex >= 0 ? playerIndex + 1 : 0;
    }

    // Проверить, может ли игрок еще играть
    canPlayerPlay(walletAddress) {
        const stats = this.getPlayerStats(walletAddress);
        return stats.attempts < 3;
    }

    // Очистить лидерборд (для админа или тестирования)
    clearLeaderboard() {
        try {
            localStorage.removeItem(`tournament_leaderboard_${this.tournamentId}`);
            this.leaderboard = [];
            return true;
        } catch (error) {
            Logger.error('❌ Error clearing leaderboard:', error);
            return false;
        }
    }

    // Экспортировать лидерборд в JSON
    exportLeaderboard() {
        const leaderboard = this.getStoredLeaderboard();
        const stats = this.getLeaderboardStats();

        return {
            tournamentId: this.tournamentId,
            exportTime: new Date().toISOString(),
            stats: stats,
            players: leaderboard
        };
    }

    // Импортировать лидерборд из JSON
    importLeaderboard(data) {
        try {
            if (!data.players || !Array.isArray(data.players)) {
                throw new Error('Invalid leaderboard data format');
            }

            // Валидируем структуру данных
            const validatedPlayers = data.players.filter(player => {
                return player.player &&
                       player.scores &&
                       Array.isArray(player.scores) &&
                       typeof player.bestScore === 'number' &&
                       typeof player.attempts === 'number';
            });

            // Сортируем по лучшему результату
            validatedPlayers.sort((a, b) => b.bestScore - a.bestScore);

            this.saveLeaderboard(validatedPlayers);

            return true;
        } catch (error) {
            Logger.error('❌ Error importing leaderboard:', error);
            return false;
        }
    }

    // Смена турнира
    setTournamentId(newTournamentId) {
        this.tournamentId = newTournamentId;
    }

    // Получить текущий ID турнира
    getTournamentId() {
        return this.tournamentId;
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TournamentLeaderboard;
} else if (typeof window !== 'undefined') {
    window.TournamentLeaderboard = TournamentLeaderboard;
}

