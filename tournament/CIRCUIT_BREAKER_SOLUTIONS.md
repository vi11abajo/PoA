# 🚨 MetaMask Circuit Breaker Solutions

## Что такое Circuit Breaker?
Circuit Breaker - это защитный механизм MetaMask, который временно блокирует взаимодействие с контрактом при обнаружении подозрительной активности или проблем.

## 🔍 Признаки активации Circuit Breaker:
- Ошибка: `"Execution prevented because the circuit breaker is open"`
- Все транзакции к контракту блокируются
- Read-only вызовы могут работать или не работать

## 🛠 Решения:

### 1. **Подождать** ⏰
- Circuit Breaker обычно автоматически деактивируется через 5-15 минут
- Попробуйте снова через некоторое время

### 2. **Перезапустить MetaMask** 🔄
```
1. Откройте MetaMask
2. Настройки → Дополнительно → Сбросить аккаунт (Reset Account)
3. Или полностью перезапустите браузер
```

### 3. **Проверить сеть** 🌐
```javascript
// В консоли браузера проверьте:
console.log('Current network:', await window.ethereum.request({method: 'eth_chainId'}));
console.log('Expected network:', '0xa7c5c'); // 688688 в hex
```

### 4. **Проверить адрес контракта** 📍
```javascript
// В консоли проверьте:
console.log('Contract address:', window.tournamentManager.config.CONTRACT_ADDRESS);
// Ожидается: 0x454064eA4517A80b0388EEeFFFBf2Efb85a86061
```

### 5. **Использовать альтернативный RPC** 🔗
- Измените RPC URL в MetaMask если основной недоступен
- Pharos Testnet RPC: `https://testnet.dplabs-internal.com`

## 🧪 Тестирование:

### Используйте тестовый файл:
```
Откройте: tournament/test-contract.html
Нажмите: "Test Circuit Breaker"
```

### Консольные команды:
```javascript
// Проверить статус circuit breaker
await window.tournamentManager.checkCircuitBreakerStatus();

// Протестировать простой read-only вызов
await window.tournamentManager.contract.methods.tournamentCounter().call();

// Получить код контракта (проверить что контракт существует)
await window.web3.eth.getCode('0x454064eA4517A80b0388EEeFFFBf2Efb85a86061');
```

## 🔄 Fallback режим:
Если circuit breaker активен, система автоматически переключается в локальный режим:
- Регистрация сохраняется локально
- Результаты игр сохраняются локально
- Лидерборд работает в локальном режиме
- Позже можно повторить попытку подключения к блокчейну

## ⚠️ Если проблема не решается:

1. **Проверьте статус сети Pharos Testnet**
2. **Убедитесь что контракт деплоен корректно**  
3. **Попробуйте другой кошелек (OKX вместо MetaMask)**
4. **Свяжитесь с администратором турнира**

## 📊 Диагностика:
```javascript
// Полная диагностика системы
window.tournamentLobby.healthCheck();

// Информация о подключении
console.log('TournamentManager connected:', window.tournamentManager?.connected);
console.log('Wallet connected:', window.walletConnector?.connected);
console.log('Current account:', window.walletConnector?.account);
```

---

*Система спроектирована с fallback механизмом, поэтому турнир будет работать даже при временной блокировке контракта.*