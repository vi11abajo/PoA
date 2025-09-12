// 👑 BOSS CONFIGURATION
// Конфигурация босов для Pharos Invaders

const BOSS_CONFIG = {
    // Уровни появления босов
    BOSS_LEVELS: [3, 6, 9, 12, 15],
    
    // Базовые характеристики
    BASE_HP: 50,
    HP_INCREASE_PER_BOSS: 25,
    BASE_SCORE: 1000,
    
    // Размеры и движение
    WIDTH: 200,
    HEIGHT: 160,
    START_Y: 70,
    SPEED: 2.0,
    
    // Общие параметры атак
    BULLET_SPEED: 3,
    BULLET_SIZE: 10,
    
    // Данные босов
    BOSSES: {
        1: {
            name: 'Emerald Warlord',
            color: '#33cc66',
            image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSGreen.png',
            phases: 1,
            attackPatterns: ['spread', 'spiral'],
            specialAbilities: ['shield', 'charge']
        },
        2: {
            name: 'Crimson Destroyer',
            color: '#cc3366',
            image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSRed.png',
            phases: 2,
            attackPatterns: ['burst', 'tracking'],
            specialAbilities: ['rage', 'barrage']
        },
        3: {
            name: 'Azure Guardian',
            color: '#3366cc',
            image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSBlue.png',
            phases: 2,
            attackPatterns: ['wave', 'cross'],
            specialAbilities: ['teleport', 'freeze']
        },
        4: {
            name: 'Golden Emperor',
            color: '#cc9933',
            image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSGold.png',
            phases: 3,
            attackPatterns: ['spiral', 'burst', 'laser'],
            specialAbilities: ['blindness', 'summon']
        },
        5: {
            name: 'Phantom King',
            color: '#9933cc',
            image: 'https://raw.githubusercontent.com/vi11abajo/PoA/main/images/crabBOSSPurple.png',
            phases: 3,
            attackPatterns: ['chaos', 'vortex', 'phantom'],
            specialAbilities: ['phase', 'mirror', 'ultimate']
        }
    }
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BOSS_CONFIG;
} else {
    window.BOSS_CONFIG = BOSS_CONFIG;
}