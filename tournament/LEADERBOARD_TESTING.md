# 📊 Тестирование блокчейн лидерборда

## ✅ Внесенные изменения

1. **Частота обновлений**: Изменена с 30 на 33 секунды (`AUTO_UPDATE_INTERVAL: 33000`)
2. **Интеграция с блокчейном**: `updateLeaderboard()` теперь получает данные из контракта
3. **Приоритет источников данных**:
   - 🥇 **Blockchain**: Данные из `getTournamentLeaderboard()`
   - 🥈 **Local fallback**: Локальные данные при недоступности blockchain

## 🔧 Как тестировать

### 1. Откройте консоль браузера и проверьте логи:

**При запуске турнира каждые 33 секунды должны появляться:**
```
🔄 Updating tournament data...
🔗 Fetching leaderboard from blockchain...
✅ Blockchain leaderboard loaded: X entries
📊 Leaderboard updated from blockchain: X entries
🏆 Current top 3: 1. PlayerName: 5000, 2. PlayerName: 4500, 3. PlayerName: 4000
✅ Data update complete
```

**При недоступности blockchain:**
```
⚠️ Failed to fetch blockchain leaderboard: [error]
💾 Using local leaderboard data...
📊 Leaderboard updated from local: X entries
```

### 2. Ручное тестирование через debug функции:

```javascript
// Тестирование получения данных из blockchain
await window.debugTournamentLobby.testBlockchainLeaderboard();

// Получение информации о турнире
await window.debugTournamentLobby.getBlockchainTournamentInfo();

// Принудительное обновление лидерборда
await window.tournamentLobby.updateLeaderboard();
```

### 3. Проверка системы статусов:

```javascript
// Проверить состояние подключений
console.log('TournamentManager connected:', window.tournamentManager?.connected);
console.log('Tournament status:', window.tournamentLobby.currentTournamentStatus);
console.log('Current tournament ID:', window.tournamentLobby.currentTournamentId);
```

## 📋 Алгоритм работы лидерборда

### При каждом обновлении (каждые 33 секунды):

1. **Проверяется**: `tournamentManager.connected` и `currentTournamentStatus === 'ACTIVE'`
2. **Если blockchain доступен**:
   - Вызывается `getTournamentLeaderboard(tournamentId)`
   - Данные сортируются по убыванию счета
   - Обновляется UI с пометкой "from blockchain"
3. **Если blockchain недоступен**:
   - Используются локальные данные из localStorage
   - Обновляется UI с пометкой "from local"

### При отправке результата игры:

1. Результат отправляется в blockchain через `submitTournamentScore()`
2. Результат сохраняется локально как fallback
3. **Сразу же** вызывается `await updateLeaderboard()` для обновления UI

## 🎯 Ожидаемое поведение

### ✅ Правильная работа:
- Лидерборд обновляется каждые 33 секунды автоматически
- При активном турнире данные берутся из blockchain
- При недоступности blockchain переключается на локальные данные
- После отправки результата лидерборд сразу обновляется
- В консоли видны подробные логи процесса

### ❌ Проблемы, на которые стоит обратить внимание:
- Отсутствие логов `🔗 Fetching leaderboard from blockchain...`
- Только локальные данные при запущенном турнире
- Ошибки в консоли при получении данных
- Лидерборд не обновляется после игры

## 🐛 Debug команды

```javascript
// Проверить статус системы
window.debugTournamentLobby.getSystemStatus();

// Очистить локальный лидерборд
window.debugTournamentLobby.clearLeaderboard();

// Добавить тестовый результат
window.debugTournamentLobby.addTestScore(7500, 'TestPlayer');

// Получить данные напрямую из контракта
await window.tournamentManager.getTournamentLeaderboard(1);
await window.tournamentManager.getTopPlayers(1, 10);
```

## 🔍 Мониторинг в реальном времени

Для отслеживания обновлений лидерборда в реальном времени:

```javascript
// Включить подробные логи для лидерборда
localStorage.setItem('debugLeaderboard', 'true');

// Мониторить обновления каждые 5 секунд
setInterval(async () => {
  console.log('🔍 Manual leaderboard check...');
  await window.tournamentLobby.updateLeaderboard();
}, 5000);
```

---

**Лидерборд теперь полностью интегрирован с блокчейном и обновляется каждые 33 секунды! 📊✨**