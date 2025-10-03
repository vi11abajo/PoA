// 🔒 VALIDATION - Валидационная логика для форм и данных

/**
 * Валидация входных данных для сохранения score
 * @param {string} playerName - Имя игрока
 * @param {number} score - Счет игрока
 * @param {string} walletAddress - Адрес кошелька
 * @returns {Object} {valid: boolean, errors: string[]}
 */
window.validateScoreSubmission = function(playerName, score, walletAddress) {
    const errors = [];

    // Валидация имени игрока
    const nameValidation = window.validatePlayerName(playerName);
    if (!nameValidation.valid) {
        errors.push(nameValidation.error);
    }

    // Валидация score
    if (typeof score !== 'number' || score < 0) {
        errors.push('Invalid score value');
    }

    if (score > 999999999) {
        errors.push('Score value is too large');
    }

    // Валидация адреса кошелька
    if (!window.isValidAddress(walletAddress)) {
        errors.push('Invalid wallet address');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
};

/**
 * Валидация регистрации на турнир
 * @param {string} walletAddress - Адрес кошелька
 * @param {string} playerName - Имя игрока (Discord username)
 * @returns {Object} {valid: boolean, errors: string[]}
 */
window.validateTournamentRegistration = function(walletAddress, playerName) {
    const errors = [];

    // Валидация адреса кошелька
    if (!window.isValidAddress(walletAddress)) {
        errors.push('Please connect your wallet');
    }

    // Валидация Discord username (опционально при регистрации, обязательно при игре)
    if (playerName) {
        const nameValidation = window.validatePlayerName(playerName);
        if (!nameValidation.valid) {
            errors.push(`Discord username: ${nameValidation.error}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
};

/**
 * Валидация fee для игры/турнира
 * @param {string|number} feeAmount - Сумма fee
 * @param {string|number} requiredFee - Требуемый fee
 * @returns {Object} {valid: boolean, error: string}
 */
window.validateFee = function(feeAmount, requiredFee) {
    if (!feeAmount || !requiredFee) {
        return { valid: false, error: 'Fee amount not specified' };
    }

    const fee = parseFloat(feeAmount);
    const required = parseFloat(requiredFee);

    if (isNaN(fee) || isNaN(required)) {
        return { valid: false, error: 'Invalid fee format' };
    }

    if (fee < required) {
        return { valid: false, error: `Insufficient fee. Required: ${required} PHRS` };
    }

    return { valid: true, error: null };
};

/**
 * Валидация баланса кошелька
 * @param {string|number} balance - Баланс кошелька (в Wei или Ether)
 * @param {string|number} requiredAmount - Требуемая сумма
 * @param {boolean} isWei - Является ли balance в Wei (по умолчанию true)
 * @returns {Object} {valid: boolean, error: string}
 */
window.validateBalance = function(balance, requiredAmount, isWei = true) {
    try {
        let balanceEther;

        if (isWei && window.Web3 && Web3.utils) {
            balanceEther = parseFloat(Web3.utils.fromWei(balance.toString(), 'ether'));
        } else {
            balanceEther = parseFloat(balance);
        }

        const required = parseFloat(requiredAmount);

        if (isNaN(balanceEther) || isNaN(required)) {
            return { valid: false, error: 'Invalid balance format' };
        }

        if (balanceEther < required) {
            return {
                valid: false,
                error: `Insufficient balance. You have ${balanceEther.toFixed(4)} PHRS, need ${required} PHRS`
            };
        }

        return { valid: true, error: null };

    } catch (error) {
        console.error('Balance validation error:', error);
        return { valid: false, error: 'Failed to validate balance' };
    }
};

/**
 * Валидация transaction hash
 * @param {string} txHash - Hash транзакции
 * @returns {boolean} true если hash валидный
 */
window.isValidTransactionHash = function(txHash) {
    if (!txHash || typeof txHash !== 'string') return false;
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
};

/**
 * Валидация network/chain ID
 * @param {string|number} chainId - Chain ID
 * @param {string|number} expectedChainId - Ожидаемый Chain ID
 * @returns {Object} {valid: boolean, error: string}
 */
window.validateChainId = function(chainId, expectedChainId) {
    const current = chainId.toString();
    const expected = expectedChainId.toString();

    if (current !== expected) {
        return {
            valid: false,
            error: `Wrong network. Please switch to Pharos Testnet (Chain ID: ${expected})`
        };
    }

    return { valid: true, error: null };
};

/**
 * Валидация score для сохранения в контракт
 * @param {number} score - Счет игрока
 * @param {number} minScore - Минимальный счет для сохранения (по умолчанию 0)
 * @returns {Object} {valid: boolean, error: string}
 */
window.validateScoreValue = function(score, minScore = 0) {
    if (typeof score !== 'number' || isNaN(score)) {
        return { valid: false, error: 'Invalid score value' };
    }

    if (score < minScore) {
        return { valid: false, error: `Score must be at least ${minScore}` };
    }

    if (score > 999999999) {
        return { valid: false, error: 'Score value is too large' };
    }

    if (!Number.isInteger(score)) {
        return { valid: false, error: 'Score must be an integer' };
    }

    return { valid: true, error: null };
};

/**
 * Комплексная валидация формы игры
 * @param {Object} formData - Данные формы
 * @param {string} formData.playerName - Имя игрока
 * @param {number} formData.score - Счет
 * @param {string} formData.walletAddress - Адрес кошелька
 * @param {string|number} formData.balance - Баланс кошелька
 * @param {string|number} formData.fee - Fee для игры
 * @param {string|number} formData.chainId - Chain ID
 * @returns {Object} {valid: boolean, errors: string[]}
 */
window.validateGameForm = function(formData) {
    const errors = [];

    // Валидация имени
    if (formData.playerName) {
        const nameValidation = window.validatePlayerName(formData.playerName);
        if (!nameValidation.valid) {
            errors.push(nameValidation.error);
        }
    } else {
        errors.push('Player name is required');
    }

    // Валидация score
    if (formData.score !== undefined) {
        const scoreValidation = window.validateScoreValue(formData.score);
        if (!scoreValidation.valid) {
            errors.push(scoreValidation.error);
        }
    }

    // Валидация адреса
    if (!window.isValidAddress(formData.walletAddress)) {
        errors.push('Invalid wallet address');
    }

    // Валидация баланса (если указан)
    if (formData.balance !== undefined && formData.fee !== undefined) {
        const balanceValidation = window.validateBalance(
            formData.balance,
            formData.fee,
            typeof formData.balance === 'string' && formData.balance.length > 10 // Wei if large number
        );
        if (!balanceValidation.valid) {
            errors.push(balanceValidation.error);
        }
    }

    // Валидация chain ID (если указан)
    if (formData.chainId && formData.expectedChainId) {
        const chainValidation = window.validateChainId(formData.chainId, formData.expectedChainId);
        if (!chainValidation.valid) {
            errors.push(chainValidation.error);
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
};

/**
 * Sanitize user input для предотвращения XSS
 * @param {string} input - Пользовательский ввод
 * @returns {string} Очищенный текст
 */
window.sanitizeInput = function(input) {
    if (!input || typeof input !== 'string') return '';

    // Удаляем HTML теги
    let clean = input.replace(/<[^>]*>/g, '');

    // Экранируем специальные символы
    clean = clean.replace(/[<>'"]/g, (char) => {
        const map = {
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return map[char];
    });

    return clean.trim();
};

/**
 * Показать ошибки валидации пользователю
 * @param {string[]} errors - Массив ошибок
 * @param {string} containerId - ID контейнера для отображения ошибок
 */
window.displayValidationErrors = function(errors, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Error container not found:', containerId);
        return;
    }

    if (!errors || errors.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    const errorHtml = errors.map(error =>
        `<div class="validation-error">⚠️ ${window.escapeHtml(error)}</div>`
    ).join('');

    container.innerHTML = errorHtml;
    container.style.display = 'block';
};
