// 💼 TOURNAMENT WALLET CONNECTOR
// Упрощенный wallet connector для турнирной системы

class TournamentWalletConnector {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;

        this.config = {
            NETWORK_NAME: 'Pharos Testnet',
            RPC_URL: 'https://testnet.dplabs-internal.com',
            CHAIN_ID: TOURNAMENT_CONSTANTS.BLOCKCHAIN.PHAROS_TESTNET_CHAIN_ID,
        };

        this.createWalletModal();
    }

    // Создание модального окна для подключения кошелька
    createWalletModal() {
        // Проверяем, есть ли уже модалка
        if (document.getElementById('wallet-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'wallet-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(0, 17, 34, 0.95) 0%, rgba(0, 51, 102, 0.9) 100%);
                padding: 30px;
                border-radius: 20px;
                border: 2px solid #00ddff;
                box-shadow: 0 0 50px rgba(0, 221, 255, 0.8);
                max-width: 400px;
                width: 90%;
                text-align: center;
                color: #00ddff;
                position: relative;
            ">
                <button onclick="tournamentWalletConnector.hideWalletModal()" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: #00ddff;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                ">×</button>

                <h3 style="margin-bottom: 25px; font-size: 24px; color: #00ddff;">Connect Your Wallet</h3>
                <div id="wallet-message" style="margin: 15px 0;"></div>

                <div onclick="tournamentWalletConnector.connectWallet('metamask')" style="
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    margin: 10px 0;
                    border: 1px solid rgba(0, 221, 255, 0.3);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(0, 221, 255, 0.05);
                ">
                    <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/mmicon.png"
                         alt="MetaMask" style="width: 32px; height: 32px; margin-right: 15px; border-radius: 6px;">
                    <span style="font-size: 16px; font-weight: bold;">MetaMask</span>
                </div>

                <div onclick="tournamentWalletConnector.connectWallet('okx')" style="
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    margin: 10px 0;
                    border: 1px solid rgba(0, 221, 255, 0.3);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(0, 221, 255, 0.05);
                ">
                    <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/okxicon.png"
                         alt="OKX" style="width: 32px; height: 32px; margin-right: 15px; border-radius: 6px;">
                    <span style="font-size: 16px; font-weight: bold;">OKX Wallet</span>
                </div>
            </div>
        `;

        // Добавляем hover эффекты
        modal.addEventListener('mouseover', (e) => {
            if (e.target.closest('[onclick*="connectWallet"]')) {
                e.target.closest('div').style.background = 'rgba(0, 221, 255, 0.15)';
                e.target.closest('div').style.borderColor = '#00ddff';
                e.target.closest('div').style.transform = 'translateX(5px)';
            }
        });

        modal.addEventListener('mouseout', (e) => {
            if (e.target.closest('[onclick*="connectWallet"]')) {
                e.target.closest('div').style.background = 'rgba(0, 221, 255, 0.05)';
                e.target.closest('div').style.borderColor = 'rgba(0, 221, 255, 0.3)';
                e.target.closest('div').style.transform = 'translateX(0)';
            }
        });

        document.body.appendChild(modal);
    }

    // Показать модалку кошелька
    async showWalletModal() {
        if (this.connected) {
            await this.disconnect();
        } else {
            const modal = document.getElementById('wallet-modal');
            if (modal) modal.style.display = 'flex';
        }
    }

    // Скрыть модалку кошелька
    hideWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) modal.style.display = 'none';
        this.clearMessage();
    }

    // Подключение кошелька
    async connectWallet(walletType) {
        try {
            this.showLoading('Connecting...');

            let provider = null;

            if (walletType === 'metamask') {
                if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                    provider = window.ethereum;
                } else {
                    throw new Error('MetaMask not detected. Please install MetaMask extension.');
                }
            } else if (walletType === 'okx') {
                if (typeof window.okexchain !== 'undefined') {
                    provider = window.okexchain;
                } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isOkxWallet) {
                    provider = window.ethereum;
                } else {
                    throw new Error('OKX Wallet not detected. Please install OKX Wallet extension.');
                }
            } else {
                throw new Error('Unsupported wallet type');
            }

            this.web3 = new Web3(provider);
            
            // Делаем web3 доступным глобально для tournament-ui.js
            window.web3 = this.web3;

            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please unlock your wallet.');
            }

            this.account = accounts[0];
            this.walletType = walletType;

            // Проверяем сеть
            const chainId = await this.web3.eth.getChainId();
            if (chainId.toString() !== this.config.CHAIN_ID) {
                await this.switchNetwork();
            }

            this.connected = true;
            this.hideWalletModal();
            this.showSuccess('Wallet connected successfully!');

            // Обновляем UI
            this.updateWalletButton();

            // Уведомляем турнирное лобби о подключении
            if (window.tournamentLobby) {
                window.tournamentLobby.onWalletConnected(this.account);
            }


        } catch (error) {
            Logger.error('Connection error:', error);
            this.showError(error.message);
        }
    }

    // Отключение кошелька
    async disconnect() {
        this.web3 = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        
        // Очищаем глобальный web3
        window.web3 = null;
        this.updateWalletButton();

        // Уведомляем турнирное лобби об отключении
        if (window.tournamentLobby) {
            await window.tournamentLobby.onWalletDisconnected();
        }

    }

    // Переключение сети
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${parseInt(this.config.CHAIN_ID).toString(16)}` }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${parseInt(this.config.CHAIN_ID).toString(16)}`,
                        chainName: this.config.NETWORK_NAME,
                        rpcUrls: [this.config.RPC_URL],
                        nativeCurrency: { name: 'PHRS', symbol: 'PHRS', decimals: 18 }
                    }]
                });
            } else {
                throw switchError;
            }
        }
    }

    // Обновление кнопки кошелька
    updateWalletButton() {
        const walletButton = document.getElementById('walletButton');
        const walletStatus = document.getElementById('walletStatus');

        if (walletButton && walletStatus) {
            if (this.connected && this.account) {
                walletButton.classList.add('connected');
                const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                walletStatus.textContent = shortAddress;
            } else {
                walletButton.classList.remove('connected');
                walletStatus.textContent = 'Connect Wallet';
            }
        }
    }

    // Показать загрузку
    showLoading(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div style="
                    border: 3px solid rgba(0, 221, 255, 0.3);
                    border-top: 3px solid #00ddff;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <p>${message}</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    // Показать ошибку
    showError(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div style="
                    background: rgba(255, 102, 102, 0.2);
                    border: 1px solid #ff6666;
                    color: #ff6666;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 14px;
                ">${message}</div>
            `;
            setTimeout(() => this.clearMessage(), TOURNAMENT_CONSTANTS.TIMEOUTS.MESSAGE_DISPLAY);
        }
    }

    // Показать успех
    showSuccess(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div style="
                    background: rgba(0, 255, 136, 0.2);
                    border: 1px solid #00ff88;
                    color: #00ff88;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 14px;
                ">${message}</div>
            `;
            setTimeout(() => this.clearMessage(), TOURNAMENT_CONSTANTS.TIMEOUTS.SUCCESS_MESSAGE);
        }
    }

    // Очистить сообщение
    clearMessage() {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) messageEl.innerHTML = '';
    }

    // Получить баланс
    async getBalance() {
        if (!this.web3 || !this.account) return '0';

        try {
            const balance = await this.web3.eth.getBalance(this.account);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            Logger.error('Balance error:', error);
            return '0';
        }
    }

    // Отправить транзакцию
    async sendTransaction(to, value, data = '0x') {
        if (!this.web3 || !this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            const gasEstimate = await this.web3.eth.estimateGas({
                from: this.account,
                to: to,
                value: value,
                data: data
            });

            const tx = await this.web3.eth.sendTransaction({
                from: this.account,
                to: to,
                value: value,
                data: data,
                gas: Math.round(gasEstimate * 1.2)
            });

            return tx.transactionHash;

        } catch (error) {
            Logger.error('Transaction error:', error);
            throw error;
        }
    }

    // Получить состояние подключения
    getConnectionState() {
        return {
            connected: this.connected,
            account: this.account,
            walletType: this.walletType,
            chainId: this.config.CHAIN_ID
        };
    }

    // Метод init для совместимости с основным коннектором
    init() {
        // Турнирный коннектор уже инициализирован в конструкторе
        return true;
    }
}

// Создаем глобальный экземпляр
window.tournamentWalletConnector = new TournamentWalletConnector();

// Делаем его доступным как walletConnector для совместимости
// Используем setTimeout чтобы перезаписать основной коннектор после его загрузки
setTimeout(() => {
    window.walletConnector = window.tournamentWalletConnector;
}, 100);

// Обновляем функцию handleWalletToggle
window.handleWalletToggle = async function() {
    if (window.tournamentWalletConnector) {
        await window.tournamentWalletConnector.showWalletModal();
    } else {
        alert('Wallet connector not ready. Please refresh the page.');
    }
};

