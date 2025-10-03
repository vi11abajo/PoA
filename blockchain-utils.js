// ⛓️ BLOCKCHAIN UTILS
// Утилиты для работы с blockchain

window.blockchainUtils = {
    /**
     * Форматирование gas стоимости
     * @param {number|string} gasUsed - Использованный gas
     * @param {number|string} gasPrice - Цена gas (в wei)
     * @returns {string} Стоимость в PHRS
     */
    formatGas(gasUsed, gasPrice) {
        if (!window.Web3 || !Web3.utils) {
            return '0';
        }

        const totalCost = BigInt(gasUsed) * BigInt(gasPrice);
        return window.formatPHRS(totalCost.toString(), 6);
    },

    /**
     * Ожидание подтверждения транзакции
     * @param {string} txHash - Hash транзакции
     * @param {number} maxAttempts - Максимальное количество попыток
     * @param {number} interval - Интервал проверки (мс)
     * @returns {Promise<Object>} Receipt транзакции
     */
    async waitForTransaction(txHash, maxAttempts = 60, interval = 2000) {
        if (!window.walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        for (let i = 0; i < maxAttempts; i++) {
            try {
                // Проверяем статус транзакции
                const receipt = await window.walletConnector.getTransactionReceipt(txHash);

                if (receipt) {
                    // Проверяем статус выполнения
                    if (receipt.status === false || receipt.status === '0x0') {
                        throw new Error('Transaction failed');
                    }

                    return receipt;
                }
            } catch (error) {
                // Если ошибка не связана с отсутствием receipt - пробрасываем
                if (error.message !== 'Transaction not found') {
                    throw error;
                }
            }

            // Ждем перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error('Transaction timeout');
    },

    /**
     * Получить URL эксплорера для транзакции
     * @param {string} txHash - Hash транзакции
     * @param {string} chainId - Chain ID
     * @returns {string} URL
     */
    getExplorerUrl(txHash, chainId = '688688') {
        const explorers = {
            '688688': 'https://testnet-explorer.pharosnetwork.xyz/tx',
            '1': 'https://etherscan.io/tx',
            '5': 'https://goerli.etherscan.io/tx',
            '137': 'https://polygonscan.com/tx'
        };

        const baseUrl = explorers[chainId] || explorers['688688'];
        return `${baseUrl}/${txHash}`;
    },

    /**
     * Получить URL эксплорера для адреса
     */
    getAddressExplorerUrl(address, chainId = '688688') {
        const explorers = {
            '688688': 'https://testnet-explorer.pharosnetwork.xyz/address',
            '1': 'https://etherscan.io/address',
            '5': 'https://goerli.etherscan.io/address',
            '137': 'https://polygonscan.com/address'
        };

        const baseUrl = explorers[chainId] || explorers['688688'];
        return `${baseUrl}/${address}`;
    },

    /**
     * Проверка валидности адреса
     * @param {string} address - Адрес для проверки
     * @returns {boolean}
     */
    isValidAddress(address) {
        if (!address || typeof address !== 'string') {
            return false;
        }

        // Проверка формата
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return false;
        }

        // Проверка checksum (если адрес в mixed case)
        if (window.Web3 && Web3.utils && Web3.utils.isAddress) {
            return Web3.utils.isAddress(address);
        }

        return true;
    },

    /**
     * Проверка валидности transaction hash
     */
    isValidTxHash(txHash) {
        if (!txHash || typeof txHash !== 'string') {
            return false;
        }

        return /^0x[a-fA-F0-9]{64}$/.test(txHash);
    },

    /**
     * Конвертация Wei в Ether
     */
    weiToEther(wei) {
        if (!window.Web3 || !Web3.utils) {
            return '0';
        }

        return Web3.utils.fromWei(wei.toString(), 'ether');
    },

    /**
     * Конвертация Ether в Wei
     */
    etherToWei(ether) {
        if (!window.Web3 || !Web3.utils) {
            return '0';
        }

        return Web3.utils.toWei(ether.toString(), 'ether');
    },

    /**
     * Получить баланс адреса
     */
    async getBalance(address) {
        if (!window.walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        if (!this.isValidAddress(address)) {
            throw new Error('Invalid address');
        }

        const balance = await window.walletConnector.getBalance(address);
        return balance;
    },

    /**
     * Получить баланс в читаемом формате
     */
    async getBalanceFormatted(address, decimals = 4) {
        const balance = await this.getBalance(address);
        return window.formatPHRS(balance, decimals);
    },

    /**
     * Проверка достаточности баланса
     */
    async hasEnoughBalance(address, requiredAmount) {
        const balance = await this.getBalance(address);
        return BigInt(balance) >= BigInt(requiredAmount);
    },

    /**
     * Расчет стоимости транзакции
     */
    calculateTransactionCost(gasLimit, gasPrice) {
        const cost = BigInt(gasLimit) * BigInt(gasPrice);
        return cost.toString();
    },

    /**
     * Оценка gas для транзакции
     */
    async estimateGas(transaction) {
        if (!window.walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        try {
            const estimate = await window.walletConnector.estimateGas(transaction);
            return estimate;
        } catch (error) {
            console.error('Gas estimation failed:', error);
            throw error;
        }
    },

    /**
     * Получить текущую цену gas
     */
    async getGasPrice() {
        if (!window.walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        try {
            const gasPrice = await window.walletConnector.getGasPrice();
            return gasPrice;
        } catch (error) {
            console.error('Failed to get gas price:', error);
            throw error;
        }
    },

    /**
     * Проверка подключения к правильной сети
     */
    async checkNetwork(expectedChainId) {
        if (!window.walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        const currentChainId = await window.walletConnector.getChainId();

        if (currentChainId.toString() !== expectedChainId.toString()) {
            throw new Error(`Wrong network. Please switch to chain ${expectedChainId}`);
        }

        return true;
    },

    /**
     * Запрос на переключение сети
     */
    async switchNetwork(chainId, networkConfig) {
        if (!window.walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        try {
            await window.walletConnector.switchChain(chainId);
            return true;
        } catch (error) {
            // Если сеть не добавлена, пытаемся добавить
            if (error.code === 4902 && networkConfig) {
                await window.walletConnector.addChain(networkConfig);
                return true;
            }

            throw error;
        }
    },

    /**
     * Короткий hash для отображения
     */
    shortHash(hash, startChars = 6, endChars = 4) {
        if (!hash || hash.length < startChars + endChars) {
            return hash;
        }

        return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
    },

    /**
     * Парсинг ошибки контракта
     */
    parseContractError(error) {
        const message = error.message || error.toString();

        // Известные ошибки контракта
        const knownErrors = {
            'insufficient funds': 'Insufficient balance',
            'gas required exceeds allowance': 'Gas limit too low',
            'execution reverted': 'Transaction reverted',
            'user rejected': 'User rejected transaction',
            'nonce too low': 'Nonce error, please try again',
            'replacement transaction underpriced': 'Gas price too low',
            'already known': 'Transaction already pending'
        };

        // Ищем известные ошибки
        for (const [pattern, friendlyMessage] of Object.entries(knownErrors)) {
            if (message.toLowerCase().includes(pattern)) {
                return friendlyMessage;
            }
        }

        // Пытаемся извлечь revert reason
        const revertMatch = message.match(/revert (.+?)["'\n]/i);
        if (revertMatch) {
            return `Contract error: ${revertMatch[1]}`;
        }

        return 'Transaction failed';
    },

    /**
     * Безопасный вызов контракта с retry
     */
    async safeContractCall(contractMethod, args = [], options = {}) {
        const { maxRetries = 3, retryDelay = 2000 } = options;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await contractMethod(...args);
            } catch (error) {
                // Если последняя попытка - бросаем ошибку
                if (attempt === maxRetries - 1) {
                    throw new Error(this.parseContractError(error));
                }

                // Ждем перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    },

    /**
     * Мониторинг события контракта
     */
    watchEvent(contract, eventName, callback, filter = {}) {
        if (!contract || !contract.events || !contract.events[eventName]) {
            throw new Error(`Event '${eventName}' not found`);
        }

        const event = contract.events[eventName](filter);

        event.on('data', callback);
        event.on('error', (error) => {
            console.error(`Error watching event '${eventName}':`, error);
        });

        // Возвращаем функцию отписки
        return () => {
            event.removeAllListeners();
        };
    },

    /**
     * Получить историю транзакций адреса
     * (требует поддержки провайдером)
     */
    async getTransactionHistory(address, limit = 10) {
        // Это зависит от конкретного провайдера
        // Для Pharos Testnet можно использовать API эксплорера
        console.log('Transaction history not implemented for this network');
        return [];
    }
};
