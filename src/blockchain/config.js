export const BLOCKCHAIN_CONFIG = {
  NETWORK_NAME: 'Pharos Testnet',
  RPC_URL: 'https://testnet.dplabs-internal.com', // Замените на актуальный
  CHAIN_ID: '688688', // Замените на актуальный Chain ID
  CONTRACT_ADDRESS: '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e', // Вставьте адрес контракта
  GAME_FEE: '0.001' // В PHRS
};

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "FeesWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "player", "type": "address"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "player", "type": "address"},
      {"indexed": false, "name": "score", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"},
      {"indexed": false, "name": "playerName", "type": "string"}
    ],
    "name": "ScoreRecorded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_score", "type": "uint256"},
      {"name": "_playerName", "type": "string"}
    ],
    "name": "recordScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_limit", "type": "uint256"}],
    "name": "getTopScores",
    "outputs": [
      {
        "components": [
          {"name": "player", "type": "address"},
          {"name": "score", "type": "uint256"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "playerName", "type": "string"}
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
