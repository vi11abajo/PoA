import Web3 from 'web3';
import { BLOCKCHAIN_CONFIG, CONTRACT_ABI } from './config.js';

class GameContract {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
  }

  async initialize() {
    try {
      if (window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        
        // Запрос доступа к кошельку
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        this.account = accounts[0];
        
        // Проверка сети
        const chainId = await this.web3.eth.getChainId();
        if (chainId.toString() !== BLOCKCHAIN_CONFIG.CHAIN_ID) {
          await this.switchNetwork();
        }
        
        // Инициализация контракта
        this.contract = new this.web3.eth.Contract(
          CONTRACT_ABI,
          BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS
        );
        
        return true;
      } else {
        throw new Error('MetaMask not installed');
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      return false;
    }
  }

  async switchNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(BLOCKCHAIN_CONFIG.CHAIN_ID).toString(16)}` }]
      });
    } catch (error) {
      console.error('Network switch error:', error);
      throw error;
    }
  }

  async startGame() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const gasEstimate = await this.contract.methods.startGame().estimateGas({
        from: this.account,
        value: this.web3.utils.toWei(BLOCKCHAIN_CONFIG.GAME_FEE, 'ether')
      });

      const tx = await this.contract.methods.startGame().send({
        from: this.account,
        value: this.web3.utils.toWei(BLOCKCHAIN_CONFIG.GAME_FEE, 'ether'),
        gas: Math.round(gasEstimate * 1.2)
      });

      return tx.transactionHash;
    } catch (error) {
      console.error('Start game error:', error);
      throw error;
    }
  }

  async recordScore(score, playerName) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const gasEstimate = await this.contract.methods
        .recordScore(score, playerName)
        .estimateGas({ from: this.account });

      const tx = await this.contract.methods
        .recordScore(score, playerName)
        .send({
          from: this.account,
          gas: Math.round(gasEstimate * 1.2)
        });

      return tx.transactionHash;
    } catch (error) {
      console.error('Record score error:', error);
      throw error;
    }
  }

  async getTopScores(limit = 10) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const scores = await this.contract.methods.getTopScores(limit).call();
      return scores.map(score => ({
        player: score.player,
        score: parseInt(score.score),
        timestamp: parseInt(score.timestamp),
        playerName: score.playerName
      }));
    } catch (error) {
      console.error('Get top scores error:', error);
      throw error;
    }
  }

  async getPlayerRecords(playerAddress = null) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const address = playerAddress || this.account;
      const records = await this.contract.methods.getPlayerRecords(address).call();
      
      return records.map(record => ({
        player: record.player,
        score: parseInt(record.score),
        timestamp: parseInt(record.timestamp),
        playerName: record.playerName
      }));
    } catch (error) {
      console.error('Get player records error:', error);
      throw error;
    }
  }
}

export default GameContract;
