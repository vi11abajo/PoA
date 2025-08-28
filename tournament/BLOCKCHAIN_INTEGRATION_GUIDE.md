# 🏆 PHAROS INVADERS TOURNAMENT - BLOCKCHAIN INTEGRATION GUIDE

## 📋 Обзор изменений

Турнирная система была полностью интегрирована с smart contract `PharosInvadersTournament` по адресу:
**`0x454064eA4517A80b0388EEeFFFBf2Efb85a86061`**

### 🔄 Основные изменения:

1. ✅ **Обновлен адрес контракта** и полный ABI
2. ✅ **Модифицированы функции регистрации** для работы с `bytes32` именами игроков
3. ✅ **Обновлена логика отправки результатов** с интеграцией blockchain
4. ✅ **Добавлены новые админские функции** из контракта
5. ✅ **Реализована hybrid логика**: blockchain + локальный fallback

---

## 🚀 Быстрый старт

### 1. Подключение кошелька
```javascript
// Кошелек подключается автоматически через TournamentWalletConnector
// Поддерживаются MetaMask и OKX Wallet
window.tournamentWalletConnector.showWalletModal();
```

### 2. Регистрация в турнире
```javascript
// Админ запускает турнир
await window.tournamentLobby.handleStartTournament();

// Игрок регистрируется (с оплатой entry fee)
await window.tournamentLobby.handleRegisterForTournament();
```

### 3. Игра и отправка результатов  
```javascript
// Игрок играет в турнире
await window.tournamentLobby.handlePlayTournamentGame();

// Результат автоматически отправляется в blockchain
// через window.tournamentLobby.submitGameScore(score, playerName)
```

---

## 🔧 Технические детали

### Контракт: PharosInvadersTournament

**Адрес:** `0x454064eA4517A80b0388EEeFFFBf2Efb85a86061`
**Сеть:** Pharos Testnet (Chain ID: 688688)
**RPC:** https://testnet.dplabs-internal.com

### Основные функции контракта:

#### Для игроков:
- `registerForTournament(uint256 _tournamentId, bytes32 _playerName)` - регистрация с оплатой
- `submitScore(uint256 _tournamentId, uint256 _score, bytes32 _playerName, bytes32 _gameHash)` - отправка результата
- `generateGameHash(uint256 _tournamentId, uint256 _nonce)` - генерация хэша игры
- `claimRefund(uint256 _tournamentId)` - получение возврата средств

#### Для админов:
- `startTournament(uint256 _tournamentId, uint256 _entryFee, uint256 _duration)` - запуск турнира
- `endTournament(uint256 _tournamentId)` - завершение турнира
- `distributePrizes(uint256 _tournamentId)` - распределение призов
- `autoEndTournament(uint256 _tournamentId)` - автозавершение
- `emergencyStopTournament(uint256 _tournamentId)` - экстренная остановка
- `enableRefunds(uint256 _tournamentId)` - включение возвратов
- `withdrawFees()` - вывод комиссий

#### Чтение данных:
- `getTournamentInfo(uint256 _tournamentId)` - информация о турнире
- `getTournamentLeaderboard(uint256 _tournamentId)` - лидерборд
- `getTopPlayers(uint256 _tournamentId, uint256 _limit)` - топ игроки
- `getPlayerScore(uint256 _tournamentId, address _player)` - результат игрока
- `getPrizeDistribution(uint256 _tournamentId)` - распределение призов

---

## 💻 Примеры использования

### Регистрация с custom именем:
```javascript
// В будущем можно добавить UI для ввода имени
const playerName = "MyAwesomeName";
await window.tournamentManager.registerForTournament(1, playerName);
```

### Получение лидерборда:
```javascript
// Новая функция - возвращает топ игроков из blockchain
const leaderboard = await window.tournamentManager.getTournamentLeaderboard(1);
console.log('🏆 Blockchain Leaderboard:', leaderboard);

// Получить топ-3
const top3 = await window.tournamentManager.getTopPlayers(1, 3);
console.log('🥇 Top 3:', top3);
```

### Информация о призах:
```javascript
const prizes = await window.tournamentManager.getPrizeDistribution(1);
console.log('💰 Prize Distribution:', prizes);
// { first: "0.027", second: "0.01125", third: "0.00225", ownerFee: "0.005" }
```

### Админские функции:
```javascript
// Запуск турнира: ID=1, entry fee=0.005 ETH, длительность=600 секунд
await window.tournamentManager.startTournament(1, "0.005", 600);

// Экстренная остановка с возвратом всем участникам  
await window.tournamentLobby.handleEmergencyStopTournament();

// Получить информацию о контракте
await window.tournamentLobby.getContractInfo();
```

---

## 🔒 Безопасность

### Защита от читов:
1. **Хэширование игр:** Каждая игра генерирует уникальный хэш
2. **Лимит попыток:** Максимум 3 попытки на игрока  
3. **Верификация через GameContract:** (опционально)
4. **Временные ограничения:** Турниры имеют фиксированное время

### Экономическая модель:
- **Entry Fee:** Настраивается админом (по умолчанию 0.005 PHRS)
- **Комиссия:** 10% от призового фонда идет владельцу контракта
- **Распределение призов:**
  - 1 игрок: 90% призового фонда
  - 2 игрока: 65% / 25%  
  - 3+ игроков: 60% / 25% / 5%

---

## 🛠️ Troubleshooting

### Частые проблемы:

**1. "Wallet not connected"**
```javascript
// Проверить подключение
console.log(window.tournamentWalletConnector.connected);
// Переподключить
window.tournamentWalletConnector.showWalletModal();
```

**2. "Tournament not active"**
```javascript
// Проверить статус турнира
const info = await window.tournamentManager.getTournamentInfo(1);
console.log('Tournament active:', info.isActive);
```

**3. "Already registered"**
```javascript
// Проверить регистрацию
const isRegistered = await window.tournamentManager.isPlayerRegistered(1, userAddress);
console.log('Is registered:', isRegistered);
```

**4. "Max attempts reached"**
```javascript
// Проверить количество попыток
const playerInfo = await window.tournamentManager.getPlayerScore(1, userAddress);
console.log('Attempts:', playerInfo.attempts, '/3');
```

### Fallback режим:
Если blockchain недоступен, система автоматически переключается в локальный режим:
- ⚠️ Сообщения: "TournamentManager not connected, simulating..."  
- ✅ Функциональность: Все функции работают локально
- 🔄 Восстановление: При восстановлении подключения система автоматически переключается обратно

---

## 📊 Мониторинг

### Console логи:
```javascript
// Успешные операции
console.log('✅ Blockchain registration successful:', txHash);
console.log('✅ Score submitted to blockchain! TX:', txHash);

// Ошибки blockchain  
console.error('❌ Blockchain registration failed:', error);

// Fallback режим
console.log('⚠️ TournamentManager not connected, simulating...');
```

### Debug функции:
```javascript
// Проверить состояние системы
window.debugTournamentLobby.getSystemStatus();

// Добавить тестовый результат
window.debugTournamentLobby.addTestScore(5000, 'TestPlayer');

// Получить статистику игрока
window.debugTournamentLobby.getPlayerStats();
```

---

## 🔮 Roadmap

### Планируемые улучшения:

1. **UI для ввода имен игроков:** Добавить модальное окно для кастомных имен
2. **Real-time лидерборд:** Подключить события контракта для live обновлений  
3. **Мультитурниры:** Поддержка параллельных турниров
4. **NFT rewards:** Интеграция с NFT наградами для победителей
5. **Staking механизм:** Возможность stake PHRS токенов для участия

### Расширенная интеграция:
- **Oracles:** Подключение внешних данных для верификации
- **DAO governance:** Голосование сообщества за параметры турниров
- **Cross-chain support:** Поддержка других блокчейнов
- **Mobile app:** Мобильное приложение с Web3 интеграцией

---

## 👥 Команда и поддержка

**Разработчик:** @vi11abajo  
**Контракт:** x.com/iiidart  
**Адрес контракта:** `0x454064eA4517A80b0388EEeFFFBf2Efb85a86061`

### Для разработчиков:
- Все изменения обратно совместимы
- Локальный fallback гарантирует стабильность  
- Подробные console логи для отладки
- Полная документация API в коде

---

**🎮 Игра готова к запуску на blockchain! Да начнется турнир! 🏆**