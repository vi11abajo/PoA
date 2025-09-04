// Test constants loading
Logger.log('Testing TOURNAMENT_CONSTANTS...'); 
Logger.log('Cache TTL:', window.TOURNAMENT_CONSTANTS?.CACHE?.DEFAULT_TTL);
Logger.log('Max attempts:', window.TOURNAMENT_CONSTANTS?.GAME?.MAX_ATTEMPTS);
Logger.log('Chain ID:', window.TOURNAMENT_CONSTANTS?.BLOCKCHAIN?.PHAROS_TESTNET_CHAIN_ID);