// 🔧 УТИЛИТЫ - переиспользуемые функции для всего проекта

/**
 * Форматирование адреса кошелька
 * @param {string} address - Полный адрес кошелька
 * @param {number} startChars - Количество символов вначале (по умолчанию 6)
 * @param {number} endChars - Количество символов в конце (по умолчанию 4)
 * @returns {string} Отформатированный адрес вида 0x1234...5678
 */
window.formatAddress = function(address, startChars = 6, endChars = 4) {
    if (!address || typeof address !== 'string') return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Маскирование адреса кошелька (для публичных данных)
 * @param {string} address - Полный адрес кошелька
 * @returns {string} Замаскированный адрес вида 0x1234***5678
 */
window.maskAddress = function(address) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}***${address.slice(-6)}`;
};

/**
 * Управление модальными окнами - показать
 * @param {string|HTMLElement} modalElement - ID элемента или сам элемент
 */
window.showModal = function(modalElement) {
    const modal = typeof modalElement === 'string'
        ? document.getElementById(modalElement)
        : modalElement;

    if (!modal) {
        console.error('Modal element not found:', modalElement);
        return;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Блокируем скролл
};

/**
 * Управление модальными окнами - скрыть
 * @param {string|HTMLElement} modalElement - ID элемента или сам элемент
 */
window.hideModal = function(modalElement) {
    const modal = typeof modalElement === 'string'
        ? document.getElementById(modalElement)
        : modalElement;

    if (!modal) {
        console.error('Modal element not found:', modalElement);
        return;
    }

    modal.style.display = 'none';
    document.body.style.overflow = ''; // Восстанавливаем скролл
};

/**
 * Закрытие модального окна при клике вне его
 * @param {MouseEvent} event - Событие клика
 * @param {HTMLElement} modal - Модальное окно
 * @param {HTMLElement} modalContent - Содержимое модального окна
 */
window.handleModalOutsideClick = function(event, modal, modalContent) {
    if (event.target === modal && !modalContent.contains(event.target)) {
        hideModal(modal);
    }
};

/**
 * Валидация адреса Ethereum
 * @param {string} address - Адрес для проверки
 * @returns {boolean} true если адрес валидный
 */
window.isValidAddress = function(address) {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Валидация имени игрока
 * @param {string} name - Имя для проверки
 * @param {number} minLength - Минимальная длина (по умолчанию 2)
 * @param {number} maxLength - Максимальная длина (по умолчанию 32)
 * @returns {Object} {valid: boolean, error: string}
 */
window.validatePlayerName = function(name, minLength = 2, maxLength = 32) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Name is required' };
    }

    const trimmed = name.trim();

    if (trimmed.length < minLength) {
        return { valid: false, error: `Name must be at least ${minLength} characters` };
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `Name must be less than ${maxLength} characters` };
    }

    // Проверка на недопустимые символы
    if (!/^[a-zA-Z0-9_\s.-]+$/.test(trimmed)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }

    return { valid: true, error: null };
};

/**
 * Экранирование HTML для защиты от XSS
 * @param {string} text - Текст для экранирования
 * @returns {string} Экранированный текст
 */
window.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Функция переключения выпадающего меню
 */
window.toggleMenu = function() {
    const menu = document.getElementById('dropdownMenu');
    const menuButton = document.getElementById('menuButton');

    if (!menu || !menuButton) {
        console.error('Menu elements not found');
        return;
    }

    if (menu.style.display === 'none' || menu.style.display === '') {
        // Вычисляем позицию меню относительно кнопки
        const rect = menuButton.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom + 2) + 'px';
        menu.style.right = 'auto';
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
};

/**
 * Закрытие выпадающего меню при клике вне его
 */
window.initMenuClickOutside = function() {
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('dropdownMenu');
        const menuButton = document.getElementById('menuButton');

        if (menu && menuButton && !menu.contains(event.target) && !menuButton.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
};

/**
 * Обновление статуса кошелька в UI
 * @param {Object} walletConnector - Объект коннектора кошелька
 * @param {string} buttonId - ID кнопки кошелька (по умолчанию 'walletButton')
 * @param {string} statusId - ID элемента со статусом (по умолчанию 'walletStatus')
 */
window.updateWalletStatus = function(walletConnector, buttonId = 'walletButton', statusId = 'walletStatus') {
    const walletButton = document.getElementById(buttonId);
    const walletStatus = document.getElementById(statusId);

    if (!walletButton || !walletStatus) return;

    if (walletConnector && walletConnector.connected && walletConnector.account) {
        walletButton.classList.add('connected');
        walletStatus.textContent = formatAddress(walletConnector.account);
    } else {
        walletButton.classList.remove('connected');
        walletStatus.textContent = '💼 Connect Wallet';
    }
};

/**
 * Показать индикатор загрузки
 * @param {string} message - Сообщение для отображения
 * @returns {HTMLElement} Элемент индикатора загрузки
 */
window.showLoadingIndicator = function(message = 'Loading...') {
    // Удаляем существующий индикатор, если есть
    hideLoadingIndicator();

    const indicator = document.createElement('div');
    indicator.id = 'global-loading-indicator';
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <div>${message}</div>
        </div>
    `;

    document.body.appendChild(indicator);
    return indicator;
};

/**
 * Скрыть индикатор загрузки
 */
window.hideLoadingIndicator = function() {
    const indicator = document.getElementById('global-loading-indicator');
    if (indicator) {
        indicator.remove();
    }
};

/**
 * Показать уведомление
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип уведомления: 'success', 'error', 'info'
 * @param {number} duration - Длительность показа в мс (0 = бесконечно)
 */
window.showNotification = function(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Автоматическое удаление
    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    return notification;
};

/**
 * Форматирование числа с разделителями тысяч
 * @param {number} num - Число для форматирования
 * @returns {string} Отформатированное число
 */
window.formatNumber = function(num) {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US');
};

/**
 * Форматирование PHRS (Wei -> Ether)
 * @param {string|number} wei - Значение в Wei
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Значение в PHRS
 */
window.formatPHRS = function(wei, decimals = 4) {
    if (!window.Web3 || !Web3.utils) {
        console.error('Web3 not loaded');
        return wei;
    }

    const ether = Web3.utils.fromWei(wei.toString(), 'ether');
    return parseFloat(ether).toFixed(decimals);
};

/**
 * Копирование текста в буфер обмена
 * @param {string} text - Текст для копирования
 * @returns {Promise<boolean>} true если успешно
 */
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success', 2000);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy', 'error', 2000);
        return false;
    }
};

/**
 * Debounce функция (ограничение частоты вызовов)
 * @param {Function} func - Функция для вызова
 * @param {number} wait - Задержка в мс
 * @returns {Function} Debounced функция
 */
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle функция (ограничение частоты выполнения)
 * @param {Function} func - Функция для вызова
 * @param {number} limit - Минимальный интервал между вызовами в мс
 * @returns {Function} Throttled функция
 */
window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// 🎯 Инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenuClickOutside);
} else {
    initMenuClickOutside();
}
