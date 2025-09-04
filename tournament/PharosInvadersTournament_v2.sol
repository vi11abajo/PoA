// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PharosInvadersTournament v2.0
 * @dev Enhanced version with up to 50+ players in leaderboard (adjustable)
 * @dev x.com/iiidart
 * @author vi11abajo
 */

interface IGameContract {
    function verifyGame(bytes32 gameHash, uint256 score, address player, uint256 tournamentId) external view returns (bool);
}

contract PharosInvadersTournament is ReentrancyGuard, Ownable {
    using Address for address payable;
    
    // ========== СТРУКТУРЫ ==========
    
    struct Tournament {
        uint256 entryFee;          // Взнос за участие
        uint256 startTime;         // Время начала
        uint256 endTime;           // Время окончания  
        uint256 prizePool;         // Призовой фонд
        bool isActive;             // Активен ли турнир
        bool isFinished;           // Завершен ли турнир
        uint256 participantCount;  // Количество участников
        mapping(address => bool) isRegistered;     // Зарегистрирован ли игрок
        mapping(address => uint256) playerScores;  // Результаты игроков
        mapping(address => bytes32) playerNames;   // Имена игроков (оптимизировано)
        mapping(address => uint256) attemptCount;  // Количество попыток
        mapping(bytes32 => bool) usedHashes;       // Использованные хэши игр
        address[] participants;                     // Список участников
        address[] topPlayers;                      // Топ игроки (до maxLeaderboardSize)
        uint256[] topScores;                       // Топ результаты
    }
    
    // ========== ПЕРЕМЕННЫЕ ==========
    
    address public gameContractAddress;                    // Адрес игрового контракта для верификации
    uint256 public constant OWNER_FEE_PERCENT = 10;        // 10% комиссия
    uint256 public constant FIRST_PLACE_PERCENT = 60;      // 60% - 1 место (для 3+ игроков)
    uint256 public constant SECOND_PLACE_PERCENT = 25;     // 25% - 2 место (для 3+ игроков)  
    uint256 public constant THIRD_PLACE_PERCENT = 5;       // 5% - 3 место (для 3+ игроков)
    uint256 public constant MIN_DURATION = 10 minutes;     // Мин. длительность
    uint256 public constant MAX_ATTEMPTS = 3;              // Макс. попыток на игрока
    uint256 public constant MAX_SCORE = 1000000;           // Макс. возможный результат
    uint256 public constant MIN_SCORE_THRESHOLD = 100;     // Мин. результат для попадания в топ
    
    // ⭐ НОВАЯ ПЕРЕМЕННАЯ: Регулируемый размер лидерборда
    uint256 public maxLeaderboardSize = 50;                // По умолчанию 50, можно изменить
    uint256 public constant MAX_LEADERBOARD_LIMIT = 200;   // Абсолютный максимум для безопасности
    
    mapping(uint256 => Tournament) public tournaments;
    uint256 public tournamentCounter;
    
    // Для отслеживания возвратов средств
    mapping(uint256 => mapping(address => bool)) public refundClaimed;
    
    // Контроль доступа для автозавершения
    mapping(address => bool) public autoEndPermissions;
    
    // ========== СОБЫТИЯ ==========
    
    event TournamentStarted(
        uint256 indexed tournamentId,
        uint256 entryFee,
        uint256 startTime,
        uint256 endTime
    );
    
    event PlayerRegistered(
        uint256 indexed tournamentId,
        address indexed player,
        bytes32 playerName
    );
    
    event ScoreSubmitted(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 score,
        uint256 attemptNumber
    );
    
    event TournamentEnded(
        uint256 indexed tournamentId,
        uint256 totalParticipants,
        uint256 totalPrizePool
    );
    
    event PrizesDistributed(
        uint256 indexed tournamentId,
        address[] winners,
        uint256[] prizes,
        uint256 totalPrizePool
    );
    
    event RefundIssued(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 amount
    );
    
    event GameContractUpdated(
        address oldAddress,
        address newAddress
    );
    
    event AutoEndPermissionUpdated(
        address indexed user,
        bool permission
    );
    
    // ⭐ НОВОЕ СОБЫТИЕ: Изменение размера лидерборда
    event MaxLeaderboardSizeUpdated(
        uint256 oldSize,
        uint256 newSize
    );
    
    // ========== МОДИФИКАТОРЫ ==========
    
    modifier tournamentExists(uint256 _tournamentId) {
        require(_tournamentId > 0 && _tournamentId <= tournamentCounter, "Tournament not found");
        _;
    }
    
    modifier tournamentActive(uint256 _tournamentId) {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isActive, "Not active");
        require(block.timestamp >= tournament.startTime, "Not started");
        require(block.timestamp <= tournament.endTime, "Ended");
        _;
    }
    
    modifier canAutoEnd(uint256 _tournamentId) {
        require(
            owner() == msg.sender || autoEndPermissions[msg.sender],
            "No permission"
        );
        _;
    }
    
    // ========== КОНСТРУКТОР ==========
    
    constructor(address _gameContractAddress) Ownable(msg.sender) {
        gameContractAddress = _gameContractAddress; // Может быть address(0) изначально
        tournamentCounter = 0;
        // owner устанавливается автоматически через Ownable(msg.sender)
    }
    
    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    
    function startTournament(
        uint256 _tournamentId,
        uint256 _entryFee,
        uint256 _duration
    ) external onlyOwner {
        require(_tournamentId > 0, "Invalid ID");
        require(_entryFee > 0, "Invalid fee");
        require(_duration >= MIN_DURATION, "Too short");
        require(tournaments[_tournamentId].startTime == 0, "Exists");
        
        Tournament storage tournament = tournaments[_tournamentId];
        tournament.entryFee = _entryFee;
        tournament.startTime = block.timestamp;
        tournament.endTime = block.timestamp + _duration;
        tournament.isActive = true;
        tournament.isFinished = false;
        tournament.prizePool = 0;
        tournament.participantCount = 0;
        
        if (_tournamentId > tournamentCounter) {
            tournamentCounter = _tournamentId;
        }
        
        emit TournamentStarted(_tournamentId, _entryFee, tournament.startTime, tournament.endTime);
    }
    
    function registerForTournament(uint256 _tournamentId, bytes32 _playerName) 
        external 
        payable 
        tournamentExists(_tournamentId) 
        tournamentActive(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(!tournament.isRegistered[msg.sender], "Registered");
        require(msg.value == tournament.entryFee, "Wrong fee");
        require(_playerName != bytes32(0), "Name required");
        
        tournament.isRegistered[msg.sender] = true;
        tournament.playerNames[msg.sender] = _playerName;
        tournament.participants.push(msg.sender);
        tournament.participantCount++;
        tournament.prizePool += msg.value;
        
        emit PlayerRegistered(_tournamentId, msg.sender, _playerName);
    }
    
    /**
     * @dev Сгенерировать хэш игры для верификации
     * @param _tournamentId ID турнира
     * @param _nonce Случайное число
     */
    function generateGameHash(uint256 _tournamentId, uint256 _nonce) 
        external 
        view 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(
            msg.sender,
            _tournamentId,
            _nonce,
            block.timestamp
        ));
    }
    
    function submitScore(
        uint256 _tournamentId,
        uint256 _score,
        bytes32 _playerName,
        bytes32 _gameHash
    ) 
        external 
        tournamentExists(_tournamentId) 
        tournamentActive(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.isRegistered[msg.sender], "Not registered");
        require(_score > 0, "Invalid score");
        require(_score <= MAX_SCORE, "Score too high");
        require(_gameHash != 0, "Invalid hash");
        require(!tournament.usedHashes[_gameHash], "Hash used");
        require(tournament.attemptCount[msg.sender] < MAX_ATTEMPTS, "Max attempts");
        
        // Верификация через GameContract (пропускаем если адрес не установлен)
        if (gameContractAddress != address(0)) {
            require(IGameContract(gameContractAddress).verifyGame(_gameHash, _score, msg.sender, _tournamentId), "Invalid verification");
        }
        
        // Проверяем, что это лучший результат игрока и соответствует минимальному порогу
        if (_score <= tournament.playerScores[msg.sender]) {
            require(tournament.playerScores[msg.sender] == 0, "Not improved");
        }
        
        tournament.playerScores[msg.sender] = _score;
        tournament.playerNames[msg.sender] = _playerName;
        tournament.usedHashes[_gameHash] = true;
        tournament.attemptCount[msg.sender]++;
        
        // ⭐ ОБНОВЛЕННОЕ ОБНОВЛЕНИЕ ЛИДЕРБОРДА (до maxLeaderboardSize игроков)
        _updateLeaderboard(_tournamentId, msg.sender, _score);
        
        emit ScoreSubmitted(_tournamentId, msg.sender, _score, tournament.attemptCount[msg.sender]);
    }
    
    function endTournament(uint256 _tournamentId) 
        external 
        tournamentExists(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isActive, "Not active");
        
        bool canEnd = owner() == msg.sender || 
                     block.timestamp >= tournament.endTime || 
                     tournament.participantCount == 0;
        require(canEnd, "Cannot end");
        
        tournament.isActive = false;
        tournament.isFinished = true;
        
        emit TournamentEnded(_tournamentId, tournament.participantCount, tournament.prizePool);
    }
    
    function autoEndTournament(uint256 _tournamentId) 
        external 
        tournamentExists(_tournamentId) 
        canAutoEnd(_tournamentId)
    {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isActive && block.timestamp > tournament.endTime, "Cannot auto-end");
        
        tournament.isActive = false;
        tournament.isFinished = true;
        
        emit TournamentEnded(_tournamentId, tournament.participantCount, tournament.prizePool);
    }
    
    /**
     * @dev Распределить призы
     * @param _tournamentId ID турнира
     */
    function distributePrizes(uint256 _tournamentId) 
        external 
        onlyOwner 
        nonReentrant
        tournamentExists(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isFinished, "Tournament not finished");
        require(tournament.prizePool > 0, "No prize pool");
        
        uint256 totalPrizePool = tournament.prizePool;
        
        // Безопасные вычисления с проверкой переполнения (встроенно в Solidity 0.8+)
        uint256 ownerFee;
        uint256 remainingPool;
        
        unchecked {
            // Используем unchecked только там, где уверены в отсутствии переполнения
            ownerFee = (totalPrizePool * OWNER_FEE_PERCENT) / 100;
            remainingPool = totalPrizePool - ownerFee;
        }
        
        uint256 topPlayersCount = tournament.topPlayers.length;
        address[] memory winners = new address[](topPlayersCount);
        uint256[] memory prizes = new uint256[](topPlayersCount);
        
        // Распределяем призы в зависимости от количества участников
        if (topPlayersCount == 1) {
            // 1 игрок получает 90%
            winners[0] = tournament.topPlayers[0];
            prizes[0] = remainingPool;
        } else if (topPlayersCount == 2) {
            // 2 игрока: первый 65%, второй 25%
            winners[0] = tournament.topPlayers[0];
            winners[1] = tournament.topPlayers[1];
            unchecked {
                prizes[0] = (remainingPool * 65) / 100;
                prizes[1] = (remainingPool * 25) / 100;
            }
        } else {
            // 3+ игроков: 60%/25%/5%
            for (uint256 i = 0; i < topPlayersCount && i < 3; i++) {
                winners[i] = tournament.topPlayers[i];
                unchecked {
                    if (i == 0) prizes[i] = (remainingPool * 60) / 100;
                    else if (i == 1) prizes[i] = (remainingPool * 25) / 100;
                    else prizes[i] = (remainingPool * 5) / 100;
                }
            }
        }
        
        // Effects before Interactions
        tournament.prizePool = 0;
        
        // Безопасная отправка призов используя OpenZeppelin Address.sendValue
        for (uint256 i = 0; i < winners.length; i++) {
            if (prizes[i] > 0) {
                payable(winners[i]).sendValue(prizes[i]);
            }
        }
        
        // Отправляем комиссию владельцу
        if (ownerFee > 0) {
            payable(owner()).sendValue(ownerFee);
        }
        
        emit PrizesDistributed(_tournamentId, winners, prizes, totalPrizePool);
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    
    /**
     * @dev ⭐ ОБНОВЛЕННОЕ ОБНОВЛЕНИЕ ЛИДЕРБОРДА (поддержка до maxLeaderboardSize игроков)
     */
    function _updateLeaderboard(uint256 _tournamentId, address _player, uint256 _score) internal {
        if (_score < MIN_SCORE_THRESHOLD) return;
        
        Tournament storage tournament = tournaments[_tournamentId];
        
        // Проверяем, есть ли игрок уже в топе
        bool playerFound = false;
        uint256 playerIndex = 0;
        
        for (uint256 i = 0; i < tournament.topPlayers.length; i++) {
            if (tournament.topPlayers[i] == _player) {
                playerFound = true;
                playerIndex = i;
                break;
            }
        }
        
        if (playerFound) {
            // Игрок уже в топе - обновляем счет
            tournament.topScores[playerIndex] = _score;
        } else {
            // Новый игрок
            if (tournament.topPlayers.length < maxLeaderboardSize) {
                // Есть место в топе - добавляем
                tournament.topPlayers.push(_player);
                tournament.topScores.push(_score);
            } else {
                // Топ полон - проверяем, лучше ли новый счет худшего в топе
                uint256 worstScore = tournament.topScores[maxLeaderboardSize - 1];
                if (_score > worstScore) {
                    // Заменяем худшего игрока
                    tournament.topPlayers[maxLeaderboardSize - 1] = _player;
                    tournament.topScores[maxLeaderboardSize - 1] = _score;
                } else {
                    // Счет недостаточно хорош - не добавляем
                    return;
                }
            }
        }
        
        // Сортируем лидерборд по убыванию счета
        _sortLeaderboard(_tournamentId);
    }
    
    /**
     * @dev ⭐ ОПТИМИЗИРОВАННАЯ СОРТИРОВКА ЛИДЕРБОРДА (пузырьком с оптимизацией)
     */
    function _sortLeaderboard(uint256 _tournamentId) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        uint256 len = tournament.topPlayers.length;
        
        if (len <= 1) return; // Нечего сортировать
        
        // Сортировка пузырьком с оптимизацией (early exit)
        for (uint256 i = 0; i < len - 1; i++) {
            bool swapped = false;
            for (uint256 j = 0; j < len - i - 1; j++) {
                if (tournament.topScores[j] < tournament.topScores[j + 1]) {
                    // Меняем местами счета
                    (tournament.topScores[j], tournament.topScores[j + 1]) = 
                        (tournament.topScores[j + 1], tournament.topScores[j]);
                    
                    // Меняем местами игроков
                    (tournament.topPlayers[j], tournament.topPlayers[j + 1]) = 
                        (tournament.topPlayers[j + 1], tournament.topPlayers[j]);
                    
                    swapped = true;
                }
            }
            // Если не было обменов, массив уже отсортирован
            if (!swapped) break;
        }
    }
    
    // ========== ФУНКЦИИ ЧТЕНИЯ ==========
    
    /**
     * @dev Получить информацию о турнире
     */
    function getTournamentInfo(uint256 _tournamentId) 
        external 
        view 
        tournamentExists(_tournamentId) 
        returns (
            uint256 entryFee,
            uint256 startTime,
            uint256 endTime,
            uint256 prizePool,
            bool isActive,
            bool isFinished,
            uint256 participantCount
        ) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        return (
            tournament.entryFee,
            tournament.startTime,
            tournament.endTime,
            tournament.prizePool,
            tournament.isActive,
            tournament.isFinished,
            tournament.participantCount
        );
    }
    
    /**
     * @dev Проверить, зарегистрирован ли игрок
     */
    function isPlayerRegistered(uint256 _tournamentId, address _player) 
        external 
        view 
        tournamentExists(_tournamentId) 
        returns (bool) 
    {
        return tournaments[_tournamentId].isRegistered[_player];
    }
    
    /**
     * @dev Получить результат игрока
     */
    function getPlayerScore(uint256 _tournamentId, address _player) 
        external 
        view 
        tournamentExists(_tournamentId) 
        returns (uint256 score, bytes32 playerName, uint256 attempts) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        return (
            tournament.playerScores[_player],
            tournament.playerNames[_player],
            tournament.attemptCount[_player]
        );
    }
    
    /**
     * @dev Получить топ игроков турнира
     */
    function getTournamentLeaderboard(uint256 _tournamentId) 
        external 
        view 
        tournamentExists(_tournamentId) 
        returns (address[] memory players, uint256[] memory scores, bytes32[] memory names) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        uint256 length = tournament.topPlayers.length;
        
        bytes32[] memory playerNames = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            playerNames[i] = tournament.playerNames[tournament.topPlayers[i]];
        }
        
        return (tournament.topPlayers, tournament.topScores, playerNames);
    }
    
    /**
     * @dev ⭐ ОБНОВЛЕННАЯ функция получения топ игроков (поддержка до maxLeaderboardSize)
     */
    function getTopPlayers(uint256 _tournamentId, uint256 _limit) 
        external 
        view 
        tournamentExists(_tournamentId) 
        returns (address[] memory players, uint256[] memory scores, bytes32[] memory names) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        uint256 count = tournament.topPlayers.length;
        
        // Ограничиваем запрошенным лимитом
        if (count > _limit) count = _limit;
        // Ограничиваем максимальным размером лидерборда
        if (count > maxLeaderboardSize) count = maxLeaderboardSize;
        
        players = new address[](count);
        scores = new uint256[](count);
        names = new bytes32[](count);
        
        for (uint256 i = 0; i < count; i++) {
            players[i] = tournament.topPlayers[i];
            scores[i] = tournament.topScores[i];
            names[i] = tournament.playerNames[tournament.topPlayers[i]];
        }
    }
    
    /**
     * @dev Получить распределение призов
     */
    function getPrizeDistribution(uint256 _tournamentId) 
        external 
        view 
        tournamentExists(_tournamentId) 
        returns (uint256 first, uint256 second, uint256 third, uint256 ownerFee) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        uint256 totalPrizePool = tournament.prizePool;
        uint256 fee = (totalPrizePool * OWNER_FEE_PERCENT) / 100;
        uint256 remaining = totalPrizePool - fee;
        uint256 topPlayersCount = tournament.topPlayers.length;
        
        if (topPlayersCount == 1) {
            // 1 игрок: 90%
            return (remaining, 0, 0, fee);
        } else if (topPlayersCount == 2) {
            // 2 игрока: 65% / 25%
            return (
                (remaining * 65) / 100,
                (remaining * 25) / 100,
                0,
                fee
            );
        } else {
            // 3+ игроков: 60% / 25% / 5%
            return (
                (remaining * 60) / 100,
                (remaining * 25) / 100,
                (remaining * 5) / 100,
                fee
            );
        }
    }
    
    // ========== АДМИНСКИЕ ФУНКЦИИ ==========
    
    /**
     * @dev Обновить адрес игрового контракта
     */
    function updateGameContract(address _newGameContractAddress) external onlyOwner {
        require(_newGameContractAddress != gameContractAddress, "Same address");
        
        address oldAddress = gameContractAddress;
        gameContractAddress = _newGameContractAddress;
        
        emit GameContractUpdated(oldAddress, _newGameContractAddress);
    }
    
    /**
     * @dev ⭐ НОВАЯ ФУНКЦИЯ: Установить максимальный размер лидерборда
     */
    function setMaxLeaderboardSize(uint256 _newSize) external onlyOwner {
        require(_newSize > 0, "Size must be positive");
        require(_newSize <= MAX_LEADERBOARD_LIMIT, "Size too large");
        require(_newSize != maxLeaderboardSize, "Same size");
        
        uint256 oldSize = maxLeaderboardSize;
        maxLeaderboardSize = _newSize;
        
        emit MaxLeaderboardSizeUpdated(oldSize, _newSize);
    }
    
    /**
     * @dev Установить разрешение на автозавершение турниров
     */
    function setAutoEndPermission(address _user, bool _permission) external onlyOwner {
        require(_user != address(0), "Invalid address");
        autoEndPermissions[_user] = _permission;
        emit AutoEndPermissionUpdated(_user, _permission);
    }
    
    /**
     * @dev Разрешить возврат средств участникам турнира
     */
    function enableRefunds(uint256 _tournamentId) 
        external 
        onlyOwner 
        tournamentExists(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isFinished, "Tournament not finished");
        require(tournament.prizePool > 0, "No funds to refund");
        
        // Помечаем турнир как доступный для возвратов
        // (можно добавить флаг refundsEnabled в структуру Tournament)
        tournament.isActive = false;
        
        emit TournamentEnded(_tournamentId, tournament.participantCount, tournament.prizePool);
    }
    
    /**
     * @dev Получить возврат средств (для участников)
     */
    function claimRefund(uint256 _tournamentId) 
        external 
        nonReentrant
        tournamentExists(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        require(!tournament.isActive, "Tournament still active");
        require(tournament.isRegistered[msg.sender], "Not registered for tournament");
        require(!refundClaimed[_tournamentId][msg.sender], "Refund already claimed");
        require(tournament.prizePool > 0, "No funds available");
        
        uint256 refundAmount = tournament.entryFee;
        require(address(this).balance >= refundAmount, "Insufficient contract balance");
        
        // Effects before Interactions
        refundClaimed[_tournamentId][msg.sender] = true;
        
        // Безопасная отправка средств
        payable(msg.sender).sendValue(refundAmount);
        
        emit RefundIssued(_tournamentId, msg.sender, refundAmount);
    }
    
    /**
     * @dev Получить баланс контракта
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Снять комиссии (только для экстренных случаев)
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        // Безопасная отправка средств
        payable(owner()).sendValue(balance);
    }
    
    /**
     * @dev Экстренная остановка турнира
     */
    function emergencyStopTournament(uint256 _tournamentId) 
        external 
        onlyOwner 
        nonReentrant
        tournamentExists(_tournamentId) 
    {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.isActive, "Tournament not active");
        
        tournament.isActive = false;
        tournament.isFinished = true;
        
        uint256 entryFee = tournament.entryFee;
        
        // Effects before Interactions
        tournament.prizePool = 0;
        
        // Возвращаем взносы участникам используя безопасные переводы
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            payable(participant).sendValue(entryFee);
        }
        
        emit TournamentEnded(_tournamentId, tournament.participantCount, 0);
    }
    
    // ========== FALLBACK ==========
    
    receive() external payable {
        revert("Direct payments not accepted");
    }
}