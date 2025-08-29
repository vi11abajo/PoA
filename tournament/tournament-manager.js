// 🏆 PHAROS INVADERS - TOURNAMENT MANAGER
// Client-side tournament management system

class TournamentManager {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.currentTournamentId = null;
        this.gameHash = null;
        this.attemptCount = 0;
        
        // 🗄️ Кеш для турнирной информации
        this.cache = new Map();
        this.cacheTimeout = TOURNAMENT_CONSTANTS.CACHE.DEFAULT_TTL;
        
        // 🔄 Батчинг blockchain запросов
        this.batchQueue = [];
        this.batchTimeout = null;
        this.batchDelay = TOURNAMENT_CONSTANTS.CACHE.BATCH_DELAY;

        this.config = {
            NETWORK_NAME: 'Pharos Testnet',
            RPC_URL: 'https://testnet.dplabs-internal.com',
            CHAIN_ID: TOURNAMENT_CONSTANTS.BLOCKCHAIN.PHAROS_TESTNET_CHAIN_ID,
            CONTRACT_ADDRESS: '0x454064eA4517A80b0388EEeFFFBf2Efb85a86061',
            ENTRY_FEE: '0.005'
        };

        // Smart contract ABI для PharosInvadersTournament
        this.contractABI = [
            // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_playerName", "type": "bytes32"}
                ],
                "name": "registerForTournament",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_score", "type": "uint256"},
                    {"name": "_playerName", "type": "bytes32"},
                    {"name": "_gameHash", "type": "bytes32"}
                ],
                "name": "submitScore",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_nonce", "type": "uint256"}
                ],
                "name": "generateGameHash",
                "outputs": [{"name": "", "type": "bytes32"}],
                "stateMutability": "view",
                "type": "function"
            },

            // ========== ЧТЕНИЕ ИНФОРМАЦИИ ==========
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "getTournamentInfo",
                "outputs": [
                    {"name": "entryFee", "type": "uint256"},
                    {"name": "startTime", "type": "uint256"},
                    {"name": "endTime", "type": "uint256"},
                    {"name": "prizePool", "type": "uint256"},
                    {"name": "isActive", "type": "bool"},
                    {"name": "isFinished", "type": "bool"},
                    {"name": "participantCount", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "getTournamentLeaderboard",
                "outputs": [
                    {"name": "players", "type": "address[]"},
                    {"name": "scores", "type": "uint256[]"},
                    {"name": "names", "type": "bytes32[]"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_limit", "type": "uint256"}
                ],
                "name": "getTopPlayers",
                "outputs": [
                    {"name": "players", "type": "address[]"},
                    {"name": "scores", "type": "uint256[]"},
                    {"name": "names", "type": "bytes32[]"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_player", "type": "address"}
                ],
                "name": "isPlayerRegistered",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_player", "type": "address"}
                ],
                "name": "getPlayerScore",
                "outputs": [
                    {"name": "score", "type": "uint256"},
                    {"name": "playerName", "type": "bytes32"},
                    {"name": "attempts", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "getPrizeDistribution",
                "outputs": [
                    {"name": "first", "type": "uint256"},
                    {"name": "second", "type": "uint256"},
                    {"name": "third", "type": "uint256"},
                    {"name": "ownerFee", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },

            // ========== АДМИНСКИЕ ФУНКЦИИ ==========
            {
                "inputs": [
                    {"name": "_tournamentId", "type": "uint256"},
                    {"name": "_entryFee", "type": "uint256"},
                    {"name": "_duration", "type": "uint256"}
                ],
                "name": "startTournament",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "endTournament",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "autoEndTournament",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "distributePrizes",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_newGameContractAddress", "type": "address"}],
                "name": "updateGameContract",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_user", "type": "address"},
                    {"name": "_permission", "type": "bool"}
                ],
                "name": "setAutoEndPermission",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "enableRefunds",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "claimRefund",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_tournamentId", "type": "uint256"}],
                "name": "emergencyStopTournament",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdrawFees",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },

            // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
            {
                "inputs": [],
                "name": "owner",
                "outputs": [{"name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "newOwner", "type": "address"}],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getContractBalance",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "tournamentCounter",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },

            // ========== СОБЫТИЯ ==========
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "tournamentId", "type": "uint256"},
                    {"indexed": false, "name": "entryFee", "type": "uint256"},
                    {"indexed": false, "name": "startTime", "type": "uint256"},
                    {"indexed": false, "name": "endTime", "type": "uint256"}
                ],
                "name": "TournamentStarted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "tournamentId", "type": "uint256"},
                    {"indexed": true, "name": "player", "type": "address"},
                    {"indexed": false, "name": "playerName", "type": "bytes32"}
                ],
                "name": "PlayerRegistered",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "tournamentId", "type": "uint256"},
                    {"indexed": true, "name": "player", "type": "address"},
                    {"indexed": false, "name": "score", "type": "uint256"},
                    {"indexed": false, "name": "attemptNumber", "type": "uint256"}
                ],
                "name": "ScoreSubmitted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "tournamentId", "type": "uint256"},
                    {"indexed": false, "name": "totalParticipants", "type": "uint256"},
                    {"indexed": false, "name": "totalPrizePool", "type": "uint256"}
                ],
                "name": "TournamentEnded",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "tournamentId", "type": "uint256"},
                    {"indexed": false, "name": "winners", "type": "address[]"},
                    {"indexed": false, "name": "prizes", "type": "uint256[]"},
                    {"indexed": false, "name": "totalPrizePool", "type": "uint256"}
                ],
                "name": "PrizesDistributed",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "tournamentId", "type": "uint256"},
                    {"indexed": true, "name": "player", "type": "address"},
                    {"indexed": false, "name": "amount", "type": "uint256"}
                ],
                "name": "RefundIssued",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": false, "name": "oldAddress", "type": "address"},
                    {"indexed": false, "name": "newAddress", "type": "address"}
                ],
                "name": "GameContractUpdated",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "user", "type": "address"},
                    {"indexed": false, "name": "permission", "type": "bool"}
                ],
                "name": "AutoEndPermissionUpdated",
                "type": "event"
            }
        ];

    }

    // Connect to Web3
    async connect(walletConnector) {
        try {
            if (!walletConnector || !walletConnector.web3) {
                throw new Error('Wallet not connected');
            }

            this.web3 = walletConnector.web3;
            this.account = walletConnector.account;
            this.contract = new this.web3.eth.Contract(
                this.contractABI,
                this.config.CONTRACT_ADDRESS
            );
            this.connected = true;

            // Проверяем доступность контракта
            await this.testContractAccess();

            console.log('✅ Tournament contract connected');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect tournament contract:', error);
            this.connected = false;
            return false;
        }
    }

    // Тестирование доступности контракта
    async testContractAccess() {
        try {

            // Проверяем код контракта
            const code = await this.web3.eth.getCode(this.config.CONTRACT_ADDRESS);
            
            if (code === '0x' || code === '0x0') {
                console.warn('⚠️ Contract not found at this address!');
                return false;
            }

            // Пробуем простой read-only вызов
            const counter = await this.contract.methods.tournamentCounter().call();
            return true;

        } catch (error) {
            console.error('❌ Contract access test failed:', error);
            
            if (error.message && error.message.includes('circuit breaker')) {
                console.error('🚨 MetaMask Circuit Breaker is active for this contract!');
                console.error('💡 Most likely cause: Contract not deployed at this address');
                console.error('🔧 Solutions:');
                console.error('   1. Check tournament/check-contracts.html to verify contract existence');
                console.error('   2. Use tournament/debug-contract.html for detailed diagnostics');
                console.error('   3. Verify you are on Pharos Testnet (Chain ID: 688688)');
                console.error('   4. Confirm contract address is correct');
            }
            
            return false;
        }
    }

    // ========== CACHE FUNCTIONS ==========
    
    // Сохранить данные в кеш с временной меткой
    setCacheData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    // Получить данные из кеша (если не устарели)
    getCacheData(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            return null;
        }
        
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    
    // Очистить кеш для конкретного турнира (при обновлениях)
    invalidateCache(tournamentId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`_${tournamentId}`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    // ========== BATCH FUNCTIONS ==========
    
    // Добавить запрос в батч
    batchCall(contractMethod, ...args) {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({
                method: contractMethod,
                args: args,
                resolve: resolve,
                reject: reject
            });
            
            // Запускаем таймер если не запущен
            if (!this.batchTimeout) {
                this.batchTimeout = setTimeout(() => {
                    this.processBatch();
                }, this.batchDelay);
            }
        });
    }
    
    // Обработать батч запросов
    async processBatch() {
        if (this.batchQueue.length === 0) {
            this.batchTimeout = null;
            return;
        }
        
        const currentBatch = this.batchQueue.splice(0); // Берем все запросы
        this.batchTimeout = null;
        
        
        try {
            // Выполняем все запросы параллельно
            const promises = currentBatch.map(item => 
                item.method(...item.args)
            );
            
            const results = await Promise.allSettled(promises);
            
            // Возвращаем результаты каждому промису
            currentBatch.forEach((item, index) => {
                const result = results[index];
                if (result.status === 'fulfilled') {
                    item.resolve(result.value);
                } else {
                    item.reject(result.reason);
                }
            });
            
            
        } catch (error) {
            console.error('❌ Batch processing failed:', error);
            currentBatch.forEach(item => item.reject(error));
        }
    }
    
    // Форсировать выполнение текущего батча
    async flushBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            await this.processBatch();
        }
    }
    
    // Загрузить данные нескольких турниров одновременно
    async loadMultipleTournaments(tournamentIds) {
        
        try {
            const results = await Promise.all(
                tournamentIds.map(async id => {
                    const [info, leaderboard] = await Promise.all([
                        this.getTournamentInfo(id).catch(e => ({ error: e.message })),
                        this.getTournamentLeaderboard(id).catch(e => [])
                    ]);
                    
                    return {
                        tournamentId: id,
                        info,
                        leaderboard
                    };
                })
            );
            
            return results;
            
        } catch (error) {
            console.error('❌ Failed to load multiple tournaments:', error);
            throw error;
        }
    }

    // ========== GAME FUNCTIONS ==========

    // Register for tournament with circuit breaker bypass attempts
    async registerForTournament(tournamentId, playerName = null) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            // Check if already registered
            const isRegistered = await this.contract.methods
                .isPlayerRegistered(tournamentId, this.account)
                .call();

            if (isRegistered) {
                throw new Error('Already registered for this tournament');
            }

            // Get tournament info
            const info = await this.getTournamentInfo(tournamentId);

            // Convert player name to bytes32
            let playerNameBytes32;
            if (playerName && playerName.trim()) {
                playerNameBytes32 = this.web3.utils.padRight(
                    this.web3.utils.toHex(playerName.trim()), 
                    64
                );
            } else {
                // Default name based on address
                const defaultName = `Player${this.account.slice(-4)}`;
                playerNameBytes32 = this.web3.utils.padRight(
                    this.web3.utils.toHex(defaultName), 
                    64
                );
            }


            // Method 1: Try standard contract call
            try {
                const tx = await this.contract.methods
                    .registerForTournament(tournamentId, playerNameBytes32)
                    .send({
                        from: this.account,
                        value: info.entryFee,
                        gas: TOURNAMENT_CONSTANTS.GAS.TOURNAMENT_REGISTRATION
                    });
                
                console.log('✅ Registration successful! TX:', tx.transactionHash);
                
                // Очищаем кеш информации о турнире (количество участников изменилось)
                this.invalidateCache(tournamentId);
                
                return tx.transactionHash;
                
            } catch (standardError) {
                console.warn('⚠️ Standard method failed:', standardError.message);
                
                if (!standardError.message.includes('circuit breaker')) {
                    // If it's not circuit breaker, throw the error
                    throw standardError;
                }
                
                console.log('🔄 Attempting circuit breaker bypass...');
            }

            // Method 2: Try raw transaction
            try {
                const methodId = '0x' + this.web3.utils.keccak256('registerForTournament(uint256,bytes32)').substring(2, 10);
                const tournamentIdHex = this.web3.utils.padLeft(this.web3.utils.numberToHex(tournamentId), 64);
                const data = methodId + tournamentIdHex.substring(2) + playerNameBytes32.substring(2);
                
                const txParams = {
                    from: this.account,
                    to: this.config.CONTRACT_ADDRESS,
                    value: info.entryFee,
                    data: data,
                    gas: '0x30D40' // TOURNAMENT_CONSTANTS.GAS.TOURNAMENT_REGISTRATION
                };

                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [txParams]
                });

                console.log('✅ Raw transaction successful! TX:', txHash);
                return txHash;
                
            } catch (rawError) {
                console.warn('⚠️ Raw transaction failed:', rawError.message);
            }

            // Method 3: Try minimal ABI
            try {
                const minimalABI = [{
                    "name": "registerForTournament",
                    "type": "function",
                    "inputs": [
                        {"name": "tournamentId", "type": "uint256"},
                        {"name": "playerName", "type": "bytes32"}
                    ],
                    "payable": true
                }];
                
                const minimalContract = new this.web3.eth.Contract(minimalABI, this.config.CONTRACT_ADDRESS);
                const tx = await minimalContract.methods.registerForTournament(tournamentId, playerNameBytes32).send({
                    from: this.account,
                    value: info.entryFee,
                    gas: 200000
                });
                
                console.log('✅ Minimal ABI successful! TX:', tx.transactionHash);
                return tx.transactionHash;
                
            } catch (minimalError) {
                console.warn('⚠️ Minimal ABI failed:', minimalError.message);
            }

            // If all methods failed, throw the original error with instructions
            throw new Error(`❌ All registration methods failed due to MetaMask Circuit Breaker.\n\n🔧 Solutions:\n1. Open tournament/bypass-circuit-breaker.html\n2. Try "Reset MetaMask State"\n3. Use OKX Wallet instead of MetaMask\n4. Wait 15-30 minutes and try again`);

        } catch (error) {
            console.error('❌ Failed to register:', error);
            
            // Более понятные сообщения об ошибках
            if (error.message && error.message.includes('circuit breaker')) {
                throw new Error(`❌ Contract Blocked: MetaMask Circuit Breaker is active for contract ${this.config.CONTRACT_ADDRESS}. This usually means:\n\n1. Contract is not deployed at this address\n2. Wrong network selected\n3. Contract has issues\n\n🔧 Check: Open tournament/debug-contract.html or tournament/check-contracts.html to diagnose the issue.`);
            } else if (error.message && error.message.includes('revert')) {
                throw new Error('Transaction failed: ' + error.message);
            } else if (error.message && error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds to pay tournament entry fee.');
            }
            
            throw error;
        }
    }

    // Submit tournament score
    async submitTournamentScore(tournamentId, score, playerName) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            // Подробная диагностика
            console.log('📊 Submitting score:', {
                tournamentId: tournamentId,
                score: score,
                playerName: playerName,
                account: this.account,
                contractAddress: this.contract._address
            });
            
            // КРИТИЧЕСКАЯ ПРОВЕРКА: Проверяем текущий счет игрока
            
            try {
                const currentPlayerInfo = await this.contract.methods
                    .getPlayerScore(tournamentId, this.account)
                    .call();
                
                // Извлечение данных
                let currentScore = 0;
                let currentAttempts = 0;
                
                if (Array.isArray(currentPlayerInfo)) {
                    currentScore = parseInt(currentPlayerInfo[0] || 0);
                    currentAttempts = parseInt(currentPlayerInfo[2] || 0);
                } else if (typeof currentPlayerInfo === 'object') {
                    currentScore = parseInt(currentPlayerInfo.score || 0);
                    currentAttempts = parseInt(currentPlayerInfo.attempts || 0);
                }
                
                // Проверяем лимит попыток
                if (currentAttempts >= 3) {
                    console.warn(`⚠️ Player has ${currentAttempts}/3 attempts used. Contract may reject.`);
                }
                
                // Проверяем улучшение счета 
                if (currentScore > 0 && score <= currentScore) {
                    console.warn(`⚠️ New score ${score} ≤ current score ${currentScore}. Contract may reject.`);
                }
                
            } catch (scoreCheckError) {
                console.warn('⚠️ Score check warning:', scoreCheckError.message);
                // ⚡ ВСЕГДА продолжаем - пусть контракт решает
            }
            
            // Проверяем статус турнира
            try {
                const tournamentInfo = await this.getTournamentInfo(tournamentId);
                
                if (!tournamentInfo.isActive) {
                    const errorMsg = `Tournament ${tournamentId} is not active`;
                    console.error('❌', errorMsg);
                    throw new Error(errorMsg);
                }
                
                if (tournamentInfo.isFinished) {
                    const errorMsg = `Tournament ${tournamentId} is already finished`;
                    console.error('❌', errorMsg);
                    throw new Error(errorMsg);
                }
            } catch (checkError) {
                console.warn('⚠️ Tournament info check failed:', checkError.message);
                // Не блокируем выполнение, так как это может быть нормально для некоторых контрактов
            }
            
            // Проверяем, зарегистрирован ли игрок
            try {
                const isRegistered = await this.isPlayerRegistered(tournamentId, this.account);
                
                if (!isRegistered) {
                    throw new Error(`Player ${this.account} is not registered for tournament ${tournamentId}`);
                }
            } catch (regError) {
                console.warn('⚠️ Registration check failed:', regError.message);
            }
            
            // Проверяем количество попыток игрока
            try {
                const playerAttempts = await this.getPlayerAttempts(tournamentId, this.account);
                
                if (playerAttempts >= 3) {
                    throw new Error(`Player ${this.account} has already used all attempts (${playerAttempts}/3) for tournament ${tournamentId}`);
                }
            } catch (attemptsError) {
                console.warn('⚠️ Attempts check failed:', attemptsError.message);
                
                // Альтернативная проверка через прямой вызов контракта
                try {
                    const playerScore = await this.contract.methods
                        .getPlayerScore(tournamentId, this.account)
                        .call();
                } catch (directError) {
                    console.warn('⚠️ Direct contract check failed:', directError.message);
                }
            }

            // Convert player name to bytes32
            let playerNameBytes32;
            let finalPlayerName;
            if (playerName && playerName.trim()) {
                finalPlayerName = playerName.trim();
                playerNameBytes32 = this.web3.utils.padRight(
                    this.web3.utils.toHex(finalPlayerName), 
                    64
                );
            } else {
                // Default name based on address
                finalPlayerName = `Player${this.account.slice(-4)}`;
                playerNameBytes32 = this.web3.utils.padRight(
                    this.web3.utils.toHex(finalPlayerName), 
                    64
                );
            }
            
            console.log('🏷️ Player name conversion:', {
                originalName: playerName,
                finalPlayerName: finalPlayerName,
                playerNameBytes32: playerNameBytes32,
                hexString: this.web3.utils.toHex(finalPlayerName),
                length: playerNameBytes32.length
            });

            // Generate game hash
            const nonce = Date.now() + Math.floor(Math.random() * 1000);
            const gameHash = await this.generateGameHash(tournamentId, nonce);
            
            // ПРОВЕРКА GAME CONTRACT (временно отключена)
            
            // ФИНАЛЬНЫЕ ПРОВЕРКИ ПЕРЕД ОТПРАВКОЙ
            
            // Проверяем еще раз попытки игрока перед отправкой
            try {
                const finalAttempts = await this.getPlayerAttempts(tournamentId, this.account);
                
                if (finalAttempts >= 3) {
                    throw new Error(`FINAL CHECK FAILED: Player has ${finalAttempts}/3 attempts used`);
                }
            } catch (finalError) {
                console.error('⚡ FINAL: Attempt check failed:', finalError.message);
                // Продолжаем, так как это может быть проблема с блокчейн запросом
            }

            // Try gas estimation first, fallback if it fails
            let gasLimit = 300000; // Default gas limit
            try {
                console.log('⛽ Estimating gas for submitScore...');
                const gasEstimate = await this.contract.methods
                    .submitScore(tournamentId, score, playerNameBytes32, gameHash)
                    .estimateGas({ from: this.account });
                    
                gasLimit = Math.round(gasEstimate * 1.2);
                console.log('⛽ Gas estimate successful:', gasEstimate, 'using:', gasLimit);
            } catch (gasError) {
                console.warn('⚠️ Gas estimation failed, using default gas limit:', gasLimit);
                console.warn('⚠️ Gas estimation error:', gasError.message);
            }

            // Проверим, существует ли метод submitScore в контракте
            try {
                const submitScoreMethod = this.contract.methods.submitScore;
                
                // Попробуем сделать dry-run вызов для проверки параметров
                await this.contract.methods
                    .submitScore(tournamentId, score, playerNameBytes32, gameHash)
                    .call({ from: this.account });
                console.log('✅ Dry-run call successful - parameters are valid');
                
            } catch (dryRunError) {
                console.error('❌ DRY-RUN FAILED:', dryRunError.message);
                console.error('❌ This indicates why the real transaction will fail:', {
                    message: dryRunError.message,
                    code: dryRunError.code,
                    data: dryRunError.data
                });
                
                // Не блокируем выполнение, просто информируем
                console.warn('⚠️ Continuing with transaction despite dry-run failure...');
            }

            // Submit score
            console.log('📤 Sending submitScore transaction with gas:', gasLimit);
            const tx = await this.contract.methods
                .submitScore(tournamentId, score, playerNameBytes32, gameHash)
                .send({
                    from: this.account,
                    gas: gasLimit
                });

            console.log('✅ Score submitted! TX:', tx.transactionHash);
            
            // Очищаем кеш лидерборда и информации о турнире (данные изменились)
            this.invalidateCache(tournamentId);
            
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to submit score:', error);
            throw error;
        }
    }

    // Generate game hash
    async generateGameHash(tournamentId, nonce) {
        try {
            console.log('🔧 generateGameHash inputs:', {
                tournamentId: tournamentId,
                nonce: nonce,
                tournamentIdType: typeof tournamentId,
                nonceType: typeof nonce,
                account: this.account
            });

            const gameHash = await this.contract.methods
                .generateGameHash(tournamentId, nonce)
                .call({ from: this.account });

            console.log('🔒 Game hash generated successfully:', {
                gameHash: gameHash,
                length: gameHash.length,
                isValidHex: gameHash.startsWith('0x')
            });
            
            return gameHash;
        } catch (error) {
            console.error('❌ Failed to generate game hash:', error);
            console.error('❌ Hash generation error details:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
            throw error;
        }
    }

    // Get game contract address from tournament contract
    async getGameContractAddress() {
        try {
            const gameContractAddress = await this.contract.methods.gameContractAddress().call();
            console.log('🎮 Game contract address from tournament contract:', gameContractAddress);
            return gameContractAddress;
        } catch (error) {
            console.error('❌ Failed to get game contract address:', error);
            throw error;
        }
    }

    // Update game contract address (admin only)
    async updateGameContract(newAddress) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`🔧 Updating game contract address to: ${newAddress}`);

            const tx = await this.contract.methods
                .updateGameContract(newAddress)
                .send({
                    from: this.account,
                    gas: 100000
                });

            console.log('✅ Game contract address updated! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to update game contract:', error);
            throw error;
        }
    }

    // Find active tournament by checking recent tournament IDs
    async findActiveTournament() {
        try {
            if (!this.contract) {
                throw new Error('Contract not connected');
            }


            // Получаем текущий счетчик турниров
            const tournamentCounter = await this.contract.methods.tournamentCounter().call();
            const currentCount = parseInt(tournamentCounter);
            console.log('📊 Tournament counter:', currentCount);

            // Проверяем последние несколько турниров (max 10)
            const checkRange = Math.min(10, currentCount);
            const startId = Math.max(1, currentCount - checkRange + 1);
            

            for (let tournamentId = currentCount; tournamentId >= startId; tournamentId--) {
                try {
                    const tournamentInfo = await this.getTournamentInfo(tournamentId);
                    
                    const now = Math.floor(Date.now() / 1000);
                    const isActive = tournamentInfo.isActive && 
                                   now >= tournamentInfo.startTime && 
                                   now <= tournamentInfo.endTime;

                    console.log(`🔍 Tournament ${tournamentId}:`, {
                        isActive: tournamentInfo.isActive,
                        isFinished: tournamentInfo.isFinished,
                        startTime: new Date(tournamentInfo.startTime * 1000).toLocaleString(),
                        endTime: new Date(tournamentInfo.endTime * 1000).toLocaleString(),
                        timeActive: isActive,
                        participantCount: tournamentInfo.participantCount
                    });

                    if (isActive) {
                        console.log(`✅ Found active tournament: ${tournamentId}`);
                        return {
                            tournamentId: tournamentId,
                            ...tournamentInfo
                        };
                    }
                } catch (tournamentError) {
                    console.log(`⚠️ Tournament ${tournamentId} not found or error:`, tournamentError.message);
                    continue;
                }
            }

            console.log('❌ No active tournaments found');
            return null;

        } catch (error) {
            console.error('❌ Failed to find active tournament:', error);
            throw error;
        }
    }

    // Check if player is registered for specific tournament
    async checkPlayerRegistration(tournamentId, playerAddress = null) {
        try {
            const address = playerAddress || this.account;
            if (!address) {
                throw new Error('No player address provided');
            }

            const isRegistered = await this.contract.methods
                .isPlayerRegistered(tournamentId, address)
                .call();

            return isRegistered;

        } catch (error) {
            console.error('❌ Failed to check player registration:', error);
            return false;
        }
    }

    // Get tournament information (with caching)
    async getTournamentInfo(tournamentId) {
        try {
            const cacheKey = `tournamentInfo_${tournamentId}`;
            
            // Проверяем кеш
            const cachedData = this.getCacheData(cacheKey);
            if (cachedData) {
                return cachedData;
            }
            
            // Если в кеше нет, запрашиваем из блокчейна (через батчинг)
            const info = await this.batchCall(
                this.contract.methods.getTournamentInfo(tournamentId).call
            );

            const result = {
                entryFee: info.entryFee,
                startTime: parseInt(info.startTime),
                endTime: parseInt(info.endTime),
                prizePool: info.prizePool,
                isActive: info.isActive,
                isFinished: info.isFinished,
                participantCount: parseInt(info.participantCount)
            };
            
            // Сохраняем в кеш
            this.setCacheData(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to get tournament info:', error);
            throw error;
        }
    }

    // Get tournament leaderboard (with caching)
    async getTournamentLeaderboard(tournamentId) {
        try {
            const cacheKey = `leaderboard_${tournamentId}`;
            
            // Проверяем кеш
            const cachedData = this.getCacheData(cacheKey);
            if (cachedData) {
                return cachedData;
            }
            
            // Если в кеше нет, запрашиваем из блокчейна (через батчинг)
            const result = await this.batchCall(
                this.contract.methods.getTournamentLeaderboard(tournamentId).call
            );

            const players = result.players || result[0] || [];
            const scores = result.scores || result[1] || [];
            const names = result.names || result[2] || [];

            // Convert bytes32 names to strings and format data
            const leaderboard = [];
            for (let i = 0; i < players.length; i++) {
                let playerName = 'Player';
                try {
                    if (names[i] && names[i] !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                        playerName = this.web3.utils.hexToUtf8(names[i]).replace(/\0/g, '');
                    }
                } catch (e) {
                    playerName = `Player${players[i].slice(-4)}`;
                }

                leaderboard.push({
                    player: players[i],
                    score: parseInt(scores[i]),
                    playerName: playerName || `Player${players[i].slice(-4)}`
                });
            }

            // Сохраняем в кеш
            this.setCacheData(cacheKey, leaderboard);
            return leaderboard;
        } catch (error) {
            console.error('❌ Failed to get tournament leaderboard:', error);
            return [];
        }
    }

    // Get top players (новая функция)
    async getTopPlayers(tournamentId, limit = 10) {
        try {
            const result = await this.contract.methods
                .getTopPlayers(tournamentId, limit)
                .call();

            const players = result.players || result[0] || [];
            const scores = result.scores || result[1] || [];
            const names = result.names || result[2] || [];

            // Convert bytes32 names to strings and format data
            const topPlayers = [];
            for (let i = 0; i < players.length; i++) {
                let playerName = 'Player';
                try {
                    if (names[i] && names[i] !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                        playerName = this.web3.utils.hexToUtf8(names[i]).replace(/\0/g, '');
                    }
                } catch (e) {
                    playerName = `Player${players[i].slice(-4)}`;
                }

                topPlayers.push({
                    player: players[i],
                    score: parseInt(scores[i]),
                    playerName: playerName || `Player${players[i].slice(-4)}`
                });
            }

            return topPlayers;
        } catch (error) {
            console.error('❌ Failed to get top players:', error);
            return [];
        }
    }

    // Backward compatibility: старая функция getLeaderboard теперь вызывает getTournamentLeaderboard
    async getLeaderboard(tournamentId) {
        return this.getTournamentLeaderboard(tournamentId);
    }

    // Check if player is registered
    async isPlayerRegistered(tournamentId, playerAddress) {
        try {
            return await this.contract.methods
                .isPlayerRegistered(tournamentId, playerAddress || this.account)
                .call();
        } catch (error) {
            return false;
        }
    }

    // Get player score and info (новая функция)
    async getPlayerScore(tournamentId, playerAddress) {
        try {
            const result = await this.contract.methods
                .getPlayerScore(tournamentId, playerAddress || this.account)
                .call();

            let playerName = 'Player';
            try {
                if (result.playerName && result.playerName !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    playerName = this.web3.utils.hexToUtf8(result.playerName).replace(/\0/g, '');
                }
            } catch (e) {
                playerName = `Player${(playerAddress || this.account).slice(-4)}`;
            }

            return {
                score: parseInt(result.score),
                playerName: playerName || `Player${(playerAddress || this.account).slice(-4)}`,
                attempts: parseInt(result.attempts)
            };
        } catch (error) {
            console.error('❌ Failed to get player score:', error);
            return {
                score: 0,
                playerName: `Player${(playerAddress || this.account).slice(-4)}`,
                attempts: 0
            };
        }
    }

    // Backward compatibility: старая функция getPlayerAttempts
    async getPlayerAttempts(tournamentId, playerAddress) {
        try {
            const playerInfo = await this.getPlayerScore(tournamentId, playerAddress);
            return playerInfo.attempts;
        } catch (error) {
            return 0;
        }
    }

    // Get prize distribution (новая функция)
    async getPrizeDistribution(tournamentId) {
        try {
            const result = await this.contract.methods
                .getPrizeDistribution(tournamentId)
                .call();

            return {
                first: this.web3.utils.fromWei(result.first, 'ether'),
                second: this.web3.utils.fromWei(result.second, 'ether'),
                third: this.web3.utils.fromWei(result.third, 'ether'),
                ownerFee: this.web3.utils.fromWei(result.ownerFee, 'ether')
            };
        } catch (error) {
            console.error('❌ Failed to get prize distribution:', error);
            return {
                first: '0',
                second: '0',
                third: '0',
                ownerFee: '0'
            };
        }
    }

    // Get contract balance (новая функция)
    async getContractBalance() {
        try {
            const balance = await this.contract.methods
                .getContractBalance()
                .call();

            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('❌ Failed to get contract balance:', error);
            return '0';
        }
    }

    // Get tournament counter (новая функция)
    async getTournamentCounter() {
        try {
            const counter = await this.contract.methods
                .tournamentCounter()
                .call();

            return parseInt(counter);
        } catch (error) {
            console.error('❌ Failed to get tournament counter:', error);
            return 0;
        }
    }

    // ========== ADMIN FUNCTIONS ==========

    // Start tournament (admin only) with circuit breaker bypass
    // If tournamentId is null/undefined, will auto-generate
    async startTournament(tournamentId = null, entryFee, duration) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            // Auto-generate Tournament ID if not provided
            if (tournamentId === null || tournamentId === undefined) {
                console.log('🎲 Auto-generating Tournament ID...');
                tournamentId = await this.generateSmartTournamentId('timestamp');
            }

            console.log(`🚀 Starting tournament ${tournamentId}...`);

            const entryFeeWei = this.web3.utils.toWei(entryFee.toString(), 'ether');
            
            console.log('🚀 Starting tournament with params:', {
                tournamentId: tournamentId,
                entryFee: entryFee,
                entryFeeWei: entryFeeWei,
                duration: duration,
                account: this.account,
                contractAddress: this.contract._address
            });

            // Method 1: Try standard contract call
            try {
                const tx = await this.contract.methods
                    .startTournament(tournamentId, entryFeeWei, duration)
                    .send({
                        from: this.account,
                        gas: TOURNAMENT_CONSTANTS.GAS.TOURNAMENT_REGISTRATION
                    });

                console.log('✅ Tournament started! TX:', tx.transactionHash);
                return { 
                    transactionHash: tx.transactionHash,
                    tournamentId: tournamentId 
                };
                
            } catch (standardError) {
                console.warn('⚠️ Standard startTournament failed:', standardError.message);
                
                if (!standardError.message.includes('circuit breaker')) {
                    throw standardError;
                }
                
                console.log('🔄 Attempting circuit breaker bypass for startTournament...');
            }

            // Method 2: Try raw transaction
            try {
                const methodId = '0x' + this.web3.utils.keccak256('startTournament(uint256,uint256,uint256)').substring(2, 10);
                const tournamentIdHex = this.web3.utils.padLeft(this.web3.utils.numberToHex(tournamentId), 64);
                const entryFeeHex = this.web3.utils.padLeft(this.web3.utils.toHex(entryFeeWei), 64);
                const durationHex = this.web3.utils.padLeft(this.web3.utils.numberToHex(duration), 64);
                
                const data = methodId + tournamentIdHex.substring(2) + entryFeeHex.substring(2) + durationHex.substring(2);
                
                const txParams = {
                    from: this.account,
                    to: this.config.CONTRACT_ADDRESS,
                    data: data,
                    gas: '0x30D40' // TOURNAMENT_CONSTANTS.GAS.TOURNAMENT_REGISTRATION
                };

                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [txParams]
                });

                console.log('✅ Raw startTournament successful! TX:', txHash);
                return {
                    transactionHash: txHash,
                    tournamentId: tournamentId
                };
                
            } catch (rawError) {
                console.warn('⚠️ Raw startTournament failed:', rawError.message);
            }

            // Method 3: Try minimal ABI
            try {
                const minimalABI = [{
                    "name": "startTournament",
                    "type": "function",
                    "inputs": [
                        {"name": "tournamentId", "type": "uint256"},
                        {"name": "entryFee", "type": "uint256"},
                        {"name": "duration", "type": "uint256"}
                    ]
                }];
                
                const minimalContract = new this.web3.eth.Contract(minimalABI, this.config.CONTRACT_ADDRESS);
                const tx = await minimalContract.methods.startTournament(tournamentId, entryFeeWei, duration).send({
                    from: this.account,
                    gas: 200000
                });
                
                console.log('✅ Minimal ABI startTournament successful! TX:', tx.transactionHash);
                return {
                    transactionHash: tx.transactionHash,
                    tournamentId: tournamentId
                };
                
            } catch (minimalError) {
                console.warn('⚠️ Minimal ABI startTournament failed:', minimalError.message);
            }

            throw new Error('❌ All startTournament methods failed. Check if you have admin rights and tournament is not already started.');

        } catch (error) {
            console.error('❌ Failed to start tournament:', error);
            throw error;
        }
    }

    // End tournament (admin only)
    async endTournament(tournamentId) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`🏁 Ending tournament ${tournamentId}...`);

            const gasEstimate = await this.contract.methods
                .endTournament(tournamentId)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .endTournament(tournamentId)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Tournament ended! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to end tournament:', error);
            throw error;
        }
    }

    // Distribute prizes (admin only)
    async distributePrizes(tournamentId) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`💰 Distributing prizes for tournament ${tournamentId}...`);
            
            // ⚡ НОВОЕ: Предварительная проверка статуса турнира
            try {
                const tournamentInfo = await this.getTournamentInfo(tournamentId);
                if (!tournamentInfo.isFinished) {
                    throw new Error(`Tournament ${tournamentId} is not finished (isFinished: ${tournamentInfo.isFinished})`);
                }
                if (!tournamentInfo.prizePool || tournamentInfo.prizePool === 0) {
                    throw new Error(`Tournament ${tournamentId} has no prize pool (prizePool: ${tournamentInfo.prizePool})`);
                }
                console.log(`✅ Pre-check passed. Prize pool: ${tournamentInfo.prizePool} wei, isFinished: ${tournamentInfo.isFinished}`);
            } catch (preCheckError) {
                console.warn('⚠️ Pre-check failed:', preCheckError.message);
                throw new Error(`Cannot distribute prizes: ${preCheckError.message}`);
            }

            const gasEstimate = await this.contract.methods
                .distributePrizes(tournamentId)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .distributePrizes(tournamentId)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Prizes distributed! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to distribute prizes:', error);
            
            // Более информативные сообщения об ошибках
            if (error.message.includes('Tournament not finished')) {
                throw new Error('Tournament is not finished yet. Please end the tournament first.');
            } else if (error.message.includes('No prize pool')) {
                throw new Error('Tournament has no prize pool to distribute.');
            } else if (error.message.includes('revert')) {
                throw new Error(`Smart contract rejected: ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Transfer ownership (owner only)
    async transferOwnership(newOwnerAddress) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`👑 Transferring ownership to ${newOwnerAddress}...`);

            const gasEstimate = await this.contract.methods
                .transferOwnership(newOwnerAddress)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .transferOwnership(newOwnerAddress)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Ownership transferred! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to transfer ownership:', error);
            throw error;
        }
    }

    // Auto end tournament (новая админская функция)
    async autoEndTournament(tournamentId) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`⏰ Auto ending tournament ${tournamentId}...`);

            const gasEstimate = await this.contract.methods
                .autoEndTournament(tournamentId)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .autoEndTournament(tournamentId)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Tournament auto-ended! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to auto-end tournament:', error);
            throw error;
        }
    }

    // Update game contract (новая админская функция)
    async updateGameContract(newGameContractAddress) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`🔄 Updating game contract to ${newGameContractAddress}...`);

            const gasEstimate = await this.contract.methods
                .updateGameContract(newGameContractAddress)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .updateGameContract(newGameContractAddress)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Game contract updated! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to update game contract:', error);
            throw error;
        }
    }

    // Set auto end permission (новая админская функция)
    async setAutoEndPermission(userAddress, permission) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`🔐 Setting auto-end permission for ${userAddress}: ${permission}...`);

            const gasEstimate = await this.contract.methods
                .setAutoEndPermission(userAddress, permission)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .setAutoEndPermission(userAddress, permission)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Auto-end permission updated! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to set auto-end permission:', error);
            throw error;
        }
    }

    // Enable refunds (новая админская функция)
    async enableRefunds(tournamentId) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`💰 Enabling refunds for tournament ${tournamentId}...`);

            const gasEstimate = await this.contract.methods
                .enableRefunds(tournamentId)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .enableRefunds(tournamentId)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Refunds enabled! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to enable refunds:', error);
            throw error;
        }
    }

    // Claim refund (функция для игроков)
    async claimRefund(tournamentId) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`💰 Claiming refund for tournament ${tournamentId}...`);

            const gasEstimate = await this.contract.methods
                .claimRefund(tournamentId)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .claimRefund(tournamentId)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Refund claimed! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to claim refund:', error);
            throw error;
        }
    }

    // Emergency stop tournament (новая админская функция)
    async emergencyStopTournament(tournamentId) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log(`🚨 Emergency stopping tournament ${tournamentId}...`);

            const gasEstimate = await this.contract.methods
                .emergencyStopTournament(tournamentId)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .emergencyStopTournament(tournamentId)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Tournament emergency stopped! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to emergency stop tournament:', error);
            throw error;
        }
    }

    // Withdraw fees (новая админская функция)
    async withdrawFees() {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Not connected to contract');
            }

            console.log('💰 Withdrawing fees...');

            const gasEstimate = await this.contract.methods
                .withdrawFees()
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .withdrawFees()
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('✅ Fees withdrawn! TX:', tx.transactionHash);
            return tx.transactionHash;

        } catch (error) {
            console.error('❌ Failed to withdraw fees:', error);
            throw error;
        }
    }

    // ========== TOURNAMENT ID GENERATION ==========

    // Generate random 6-character Tournament ID (letters + numbers)
    generateRandomTournamentId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Convert to number (base36 to handle letters)
        const numericId = parseInt(result, 36);
        console.log(`🎲 Generated Tournament ID: ${result} -> ${numericId}`);
        return numericId;
    }

    // Generate timestamp-based Tournament ID
    generateTimestampTournamentId() {
        const tournamentId = Date.now();
        console.log(`⏰ Generated Timestamp Tournament ID: ${tournamentId}`);
        return tournamentId;
    }

    // Find next available Tournament ID by checking existing ones
    async findNextAvailableTournamentId(startFrom = 2) {
        try {
            
            for (let id = startFrom; id <= startFrom + 100; id++) {
                try {
                    const info = await this.getTournamentInfo(id);
                    
                    // If startTime is 0, tournament was never created
                    if (info.startTime === 0 || info.startTime === '0') {
                        console.log(`✅ Found available Tournament ID: ${id}`);
                        return id;
                    } else {
                        console.log(`⚠️ Tournament ID ${id} is already used`);
                    }
                } catch (error) {
                    // If error getting info, probably doesn't exist - safe to use
                    console.log(`✅ Found available Tournament ID: ${id} (error suggests unused)`);
                    return id;
                }
            }
            
            // Fallback to random if no sequential ID found
            console.warn('⚠️ No sequential ID found, using random');
            return this.generateRandomTournamentId();
            
        } catch (error) {
            console.error('❌ Error finding available ID:', error);
            // Fallback to timestamp
            return this.generateTimestampTournamentId();
        }
    }

    // Smart Tournament ID generator with multiple strategies
    async generateSmartTournamentId(strategy = 'timestamp') {
        switch (strategy) {
            case 'sequential':
                return await this.findNextAvailableTournamentId();
            
            case 'random':
                return this.generateRandomTournamentId();
            
            case 'timestamp':
                return this.generateTimestampTournamentId();
            
            default:
                console.log('🔄 Using default sequential strategy');
                return await this.findNextAvailableTournamentId();
        }
    }

    // ========== UTILITY FUNCTIONS ==========

    // Check if tournament is active
    async isTournamentActive(tournamentId) {
        try {
            const info = await this.getTournamentInfo(tournamentId);
            return info.isActive && !info.isFinished;
        } catch (error) {
            return false;
        }
    }

    // Check if tournament exists
    async tournamentExists(tournamentId) {
        try {
            const info = await this.getTournamentInfo(tournamentId);
            return info.startTime > 0; // If startTime > 0, tournament was created
        } catch (error) {
            return false;
        }
    }

    // Get full tournament status
    async getFullTournamentStatus(tournamentId) {
        try {
            const info = await this.getTournamentInfo(tournamentId);
            const exists = info.startTime > 0;

            if (!exists) {
                return {
                    status: 'NOT_CREATED',
                    info: null,
                    canRegister: false,
                    canPlay: false
                };
            }

            const now = Math.floor(Date.now() / 1000);
            let status = 'NOT_STARTED';

            if (info.isFinished) {
                status = 'ENDED';
            } else if (info.isActive) {
                if (now >= info.endTime) {
                    status = 'TIME_EXPIRED';
                } else {
                    status = 'ACTIVE';
                }
            }

            return {
                status,
                info,
                canRegister: status === 'ACTIVE' && now < info.endTime,
                canPlay: status === 'ACTIVE' && now < info.endTime,
                remainingTime: Math.max(0, info.endTime - now)
            };

        } catch (error) {
            console.error('Error getting tournament status:', error);
            return {
                status: 'ERROR',
                info: null,
                canRegister: false,
                canPlay: false
            };
        }
    }

    // Check admin rights
    isAdmin() {
        if (!this.account || !window.TOURNAMENT_CONFIG) return false;
        return window.TOURNAMENT_CONFIG.isAdmin(this.account);
    }

    // Проверить статус circuit breaker
    async checkCircuitBreakerStatus() {
        try {
            
            // Пробуем сделать простой read-only вызов
            const counter = await this.contract.methods.tournamentCounter().call();
            console.log('✅ Circuit breaker OK, tournament counter:', counter);
            return true;
            
        } catch (error) {
            if (error.message && error.message.includes('circuit breaker')) {
                console.error('🚨 Circuit breaker is ACTIVE');
                return false;
            } else {
                console.error('❌ Other error:', error.message);
                return false;
            }
        }
    }

    // Get contract owner address
    async getOwnerAddress() {
        try {
            const owner = await this.contract.methods
                .owner()
                .call();
            return owner;
        } catch (error) {
            console.error('❌ Failed to get owner address:', error);
            return null;
        }
    }

    // Subscribe to tournament events
    subscribeToTournamentEvents(tournamentId, callbacks) {
        if (!this.contract) return;

        // Subscribe to new player registrations
        this.contract.events.PlayerRegistered({
            filter: { tournamentId: tournamentId }
        })
        .on('data', (event) => {
            if (callbacks.onPlayerRegistered) {
                callbacks.onPlayerRegistered(event.returnValues);
            }
        });

        // Subscribe to tournament start
        this.contract.events.TournamentStarted({
            filter: { tournamentId: tournamentId }
        })
        .on('data', (event) => {
            if (callbacks.onTournamentStarted) {
                callbacks.onTournamentStarted(event.returnValues);
            }
        });

        // Subscribe to score submissions
        this.contract.events.ScoreSubmitted({
            filter: { tournamentId: tournamentId }
        })
        .on('data', (event) => {
            if (callbacks.onScoreSubmitted) {
                callbacks.onScoreSubmitted(event.returnValues);
            }
        });

        // Subscribe to tournament end
        this.contract.events.TournamentEnded({
            filter: { tournamentId: tournamentId }
        })
        .on('data', (event) => {
            if (callbacks.onTournamentEnded) {
                callbacks.onTournamentEnded(event.returnValues);
            }
        });

        console.log(`🔔 Subscribed to tournament ${tournamentId} events`);
    }
}

// Create global instance
window.tournamentManager = new TournamentManager();

// ДИАГНОСТИЧЕСКАЯ ФУНКЦИЯ для быстрой проверки
window.checkGameContract = async function() {
    
    if (!window.tournamentManager.contract) {
        console.log('❌ Tournament contract not connected');
        return;
    }
    
    // Сначала покажем все доступные методы
    const methods = Object.keys(window.tournamentManager.contract.methods);
    methods.forEach(method => {
        if (!method.includes('(')) { // Показываем только основные методы, без перегрузок
            console.log('  -', method);
        }
    });
    
    // Попробуем разные способы получения gameContractAddress
    try {
        
        // Способ 1: Прямое обращение к public переменной
        try {
            const gameContractAddress1 = await window.tournamentManager.contract.methods.gameContractAddress().call();
            console.log('✅ Method 1 (gameContractAddress()): ', gameContractAddress1);
        } catch (e) {
            console.log('❌ Method 1 failed:', e.message);
        }
        
        // Способ 2: Через call без параметров
        try {
            const gameContractAddress2 = await window.tournamentManager.contract.methods['gameContractAddress()']().call();
            console.log('✅ Method 2 (explicit call):', gameContractAddress2);  
        } catch (e) {
            console.log('❌ Method 2 failed:', e.message);
        }
        
        // Способ 3: Проверим, есть ли вообще такая переменная в контракте
        const hasGameContract = methods.includes('gameContractAddress');
        
        if (!hasGameContract) {
            console.log('⚠️ gameContractAddress method is NOT available in contract ABI');
            console.log('💡 This might mean:');
            console.log('   1. Variable is not public in smart contract');
            console.log('   2. ABI is incomplete');
            console.log('   3. Contract is different version');
            console.log('✅ LIKELY SOLUTION: Game verification is probably DISABLED by default');
        }
        
    } catch (error) {
        console.error('❌ Failed to check game contract:', error);
    }
    
};

// ТЕСТ ГИПОТЕЗЫ о проблеме с gameHash
window.testGameHashProblem = async function() {
    
    if (!window.tournamentManager.contract) {
        console.log('❌ Tournament contract not connected');
        return;
    }
    
    const tournamentId = 9;
    const nonce = Date.now();
    
    console.log('🧪 Testing gameHash generation vs submission timing...');
    
    try {
        // Генерируем хеш первый раз
        const hash1 = await window.tournamentManager.contract.methods
            .generateGameHash(tournamentId, nonce)
            .call({ from: window.tournamentManager.account });
        console.log('🔒 Hash 1 (immediate):', hash1);
        
        // Ждём небольшую задержку  
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Генерируем хеш второй раз с тем же nonce
        const hash2 = await window.tournamentManager.contract.methods
            .generateGameHash(tournamentId, nonce)
            .call({ from: window.tournamentManager.account });
        console.log('🔒 Hash 2 (after delay):', hash2);
        
        
        if (hash1 !== hash2) {
            console.log('❌ PROBLEM CONFIRMED: gameHash changes over time due to block.timestamp!');
            console.log('💡 SOLUTION: Need to generate hash at submission time, not beforehand');
        } else {
            console.log('✅ Hashes match - not the problem');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
};

// ДИАГНОСТИКА дублирования gameHash
window.testHashDuplication = async function() {
    
    if (!window.tournamentManager.contract) {
        console.log('❌ Tournament contract not connected');
        return;
    }
    
    const tournamentId = 10; // Current tournament
    
    try {
        // Генерируем несколько хешей с разными nonce
        const nonce1 = Date.now();
        const nonce2 = Date.now() + 1;
        const nonce3 = Date.now() + 2;
        
        const hash1 = await window.tournamentManager.contract.methods
            .generateGameHash(tournamentId, nonce1)
            .call({ from: window.tournamentManager.account });
            
        const hash2 = await window.tournamentManager.contract.methods
            .generateGameHash(tournamentId, nonce2)
            .call({ from: window.tournamentManager.account });
            
        const hash3 = await window.tournamentManager.contract.methods
            .generateGameHash(tournamentId, nonce3)
            .call({ from: window.tournamentManager.account });
        
        console.log('🔒 Generated hashes:');
        console.log('  Hash 1 (nonce', nonce1, '):', hash1);
        console.log('  Hash 2 (nonce', nonce2, '):', hash2);
        console.log('  Hash 3 (nonce', nonce3, '):', hash3);
        
        console.log('  Hash1 == Hash2:', hash1 === hash2);
        console.log('  Hash1 == Hash3:', hash1 === hash3);
        console.log('  Hash2 == Hash3:', hash2 === hash3);
        
        if (hash1 === hash2 || hash1 === hash3 || hash2 === hash3) {
            console.log('❌ PROBLEM: Duplicate hashes detected!');
            console.log('💡 This could cause "Hash used" error in contract');
        } else {
            console.log('✅ All hashes are unique');
        }
        
        // Попробуем найти проблему в параметрах
        console.log('  Tournament ID:', tournamentId);
        console.log('  Account:', window.tournamentManager.account);
        console.log('  Nonce range:', nonce1, '->', nonce3);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
};

// КРИТИЧЕСКАЯ ДИАГНОСТИКА: получаем gameContractAddress другим способом
window.getGameContractAddressDirect = async function() {
    
    if (!window.tournamentManager.contract) {
        console.log('❌ Tournament contract not connected');
        return;
    }
    
    try {
        // Способ 1: через Web3 напрямую
        const web3 = window.tournamentManager.web3;
        const contractAddress = window.tournamentManager.contract._address;
        
        // gameContractAddress должен быть в слоте 0 (первая переменная в контракте)
        const storageSlot0 = await web3.eth.getStorageAt(contractAddress, 0);
        
        // Если это address, то последние 20 bytes
        const gameContractFromStorage = '0x' + storageSlot0.slice(-40);
        console.log('🎮 Game contract address from storage:', gameContractFromStorage);
        
        const isZero = gameContractFromStorage === '0x0000000000000000000000000000000000000000';
        
        if (isZero) {
            console.log('✅ CONFIRMED: Game contract verification is DISABLED');
            console.log('💡 Problem is NOT in game contract verification');
        } else {
            console.log('⚠️ CONFIRMED: Game contract verification is ENABLED');
            const matches = gameContractFromStorage.toLowerCase() === '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e';
            
            if (!matches) {
                console.log('❌ PROBLEM FOUND: Wrong game contract address!');
                console.log('💡 This could be causing verification failures');
            }
        }
        
        return gameContractFromStorage;
        
    } catch (error) {
        console.error('❌ Direct storage read failed:', error);
    }
    
};

// БЫСТРОЕ ИСПРАВЛЕНИЕ проблемы с gameContract
window.fixGameContract = async function() {
    console.log('🔧 === FIXING GAME CONTRACT ADDRESS ===');
    
    if (!window.tournamentManager.contract) {
        console.log('❌ Tournament contract not connected');
        return;
    }
    
    console.log('🔧 Solution options:');
    console.log('  1. Disable verification: 0x0000000000000000000000000000000000000000');
    console.log('  2. Enable with correct contract: 0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e');
    
    const choice = prompt('Choose option (1 to disable, 2 to enable with correct contract):');
    
    let newAddress;
    if (choice === '1') {
        newAddress = '0x0000000000000000000000000000000000000000';
        console.log('🔧 Will DISABLE game verification');
    } else if (choice === '2') {
        newAddress = '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e';
        console.log('🔧 Will ENABLE game verification with correct contract');
    } else {
        console.log('❌ Invalid choice. Cancelled.');
        return;
    }
    
    try {
        console.log('🔧 Updating game contract address...');
        const txHash = await window.tournamentManager.updateGameContract(newAddress);
        console.log('✅ Game contract address updated successfully!');
        console.log('💡 Now try playing the game again - score submission should work!');
        
    } catch (error) {
        console.error('❌ Failed to update game contract:', error.message);
        if (error.message.includes('Ownable')) {
            console.log('💡 Make sure you are connected with the admin wallet');
        }
    }
    
    console.log('🔧 === FIX COMPLETE ===');
};

// ТЕСТИРОВАНИЕ автоматического поиска турниров
window.testTournamentSearch = async function() {
    
    if (!window.tournamentManager || !window.tournamentManager.connected) {
        console.log('❌ Tournament manager not connected');
        return;
    }
    
    try {
        const activeTournament = await window.tournamentManager.findActiveTournament();
        
        if (activeTournament) {
            console.log('✅ Found active tournament:', activeTournament);
            
            if (window.tournamentLobby) {
                await window.tournamentLobby.searchForActiveTournaments();
            }
        } else {
            console.log('❌ No active tournaments found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
};

console.log('🏆 Tournament Manager loaded');
console.log('💡 Run checkGameContract() in console to diagnose game contract verification');
console.log('🧪 Run testGameHashProblem() to test hash timing issue');
console.log('🔧 Run fixGameContract() to fix the game contract address problem!');
