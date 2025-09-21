// 🎵 PHAROS INVADERS - SOUND MANAGER
// Система управления звуками и музыкой

class SoundManager {
    // 🎯 Определяем правильный путь к папке sounds в зависимости от текущей страницы
    detectSoundsPath() {
        const currentPath = window.location.pathname;

        // Если мы в подпапке (например, tournament/), нужен относительный путь
        if (currentPath.includes('/tournament/') || currentPath.includes('\\tournament\\')) {
            return '../sounds';
        }

        // Для основных страниц используем прямой путь
        return 'sounds';
    }

    constructor() {
        // 🔊 Основные настройки - теперь используем только индивидуальные громкости
        this.musicEnabled = true;

        // 🎵 Музыкальные треки
        this.currentMusic = null;
        this.musicPaused = false;
        this.musicStates = new Map(); // Сохраняем состояния всех треков

        // 🎛️ Индивидуальные настройки громкости для каждого звука (0.0 - 1.0)
        this.soundVolumes = {
            // Музыка
            menu: 0.05,
            tournamentLobby: 0.06,
            gameplay: 0.06,
            boss: 0.1,

            // Игрок
            playerShoot: 0.4,
            multiShot: 0.25,   // Звук мультишота (файл shoot2.wav)
            player1: 0.7,     // Звук при попадании в цель (файл 1.wav)
            player3: 0.7,     // Звук при получении урона (файл 3.wav)
            player12: 0.7,    // Звук при получении жизни/усиления (файл 12.wav)

            // Враги
            crabDeath: 0.75,
            bossHit: 0.35,

            // UI
            buttonClick: 0.6,
            toasty: 0.9, // Громко как в оригинале!
            cu: 0.9, // Громко как sailor!

            // Усиления
            boostDefault: 0.56,
            boostCoinShower: 0.55,
            boostAutoTarget: 0.4,
            boostGravityWell: 0.5,
            boostHealthBoost: 0.55,
            boostIceFreeze: 0.56,
            boostInvincibility: 0.45,
            boostMultiShot: 0.56,
            boostPiercingBullets: 0.56,
            boostPointsFreeze: 0.48,
            boostRapidFire: 0.64,
            boostRicochet: 0.63,
            boostScoreMultiplier: 0.48,
            boostShieldBarrier: 0.55,
            boostSpeedTamer: 0.5,
            boostWaveBlast: 0.72
        };

        // 📂 Пути к звуковым файлам (только существующие файлы)
        const soundsBasePath = this.detectSoundsPath();
        this.soundPaths = {
            music: {
                menu: `${soundsBasePath}/music/menu.mp3`,
                tournamentLobby: `${soundsBasePath}/music/tournamentLobby.mp3`,
                gameplay: `${soundsBasePath}/music/gameplay.mp3`,
                boss: `${soundsBasePath}/music/boss.mp3`
                // victory - добавим когда появится файл
            },
            sfx: {
                // Игрок
                playerShoot: `${soundsBasePath}/sfx/player/shoot.wav`,
                multiShot: `${soundsBasePath}/sfx/player/shoot2.wav`,
                player1: `${soundsBasePath}/sfx/player/1.wav`,
                player3: `${soundsBasePath}/sfx/player/3.wav`,
                player12: `${soundsBasePath}/sfx/player/12.wav`,

                // Враги
                crabDeath: `${soundsBasePath}/sfx/enemies/crab-death.wav`,
                bossHit: `${soundsBasePath}/sfx/enemies/boss-hit.wav`,

                // UI
                buttonClick: `${soundsBasePath}/sfx/ui/button.wav`,
                toasty: `${soundsBasePath}/sfx/ui/toasty.wav`,
                cu: `${soundsBasePath}/sfx/ui/CU.wav`,

                // Усиления - все найденные файлы
                boostDefault: `${soundsBasePath}/sfx/boosts/default.wav`,
                boostCoinShower: `${soundsBasePath}/sfx/boosts/coinShower.wav`,
                boostAutoTarget: `${soundsBasePath}/sfx/boosts/Auto-Target.wav`,
                boostGravityWell: `${soundsBasePath}/sfx/boosts/GravityWell.wav`,
                boostHealthBoost: `${soundsBasePath}/sfx/boosts/HealthBoost.wav`,
                boostIceFreeze: `${soundsBasePath}/sfx/boosts/IceFreeze.wav`,
                boostInvincibility: `${soundsBasePath}/sfx/boosts/Invincibility.wav`,
                boostMultiShot: `${soundsBasePath}/sfx/boosts/Multi-Shot.wav`,
                boostPiercingBullets: `${soundsBasePath}/sfx/boosts/PiercingBullets.wav`,
                boostPointsFreeze: `${soundsBasePath}/sfx/boosts/PointsFreeze.wav`,
                boostRapidFire: `${soundsBasePath}/sfx/boosts/RapidFire.wav`,
                boostRicochet: `${soundsBasePath}/sfx/boosts/Ricochet.wav`,
                boostScoreMultiplier: `${soundsBasePath}/sfx/boosts/ScoreMultiplier.wav`,
                boostShieldBarrier: `${soundsBasePath}/sfx/boosts/ShieldBarrier.wav`,
                boostSpeedTamer: `${soundsBasePath}/sfx/boosts/timeFramer.wav`, // timeFramer.wav = speedTamer
                boostWaveBlast: `${soundsBasePath}/sfx/boosts/WaveBlast.wav`
            }
            // ambient - добавим когда появятся файлы
        };

        // 🎮 Загруженные звуки
        this.loadedSounds = new Map();
        this.loadedMusic = new Map();

        // 🔇 Состояние звука
        this.muted = false;
        this.enabled = true;

        // 📱 Мобильная совместимость
        this.audioContext = null;
        this.unlocked = false;

        this.init();
    }

    // 🚀 ИНИЦИАЛИЗАЦИЯ
    async init() {
        try {
            // Создаем AudioContext для лучшей совместимости
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Загружаем настройки из localStorage
            this.loadSettings();

            // Подготавливаем обработку мобильных устройств
            this.setupMobileAudio();

        } catch (error) {
            Logger.error('❌ Sound Manager initialization failed:', error);
            this.enabled = false;
        }
    }

    // 📱 НАСТРОЙКА МОБИЛЬНОГО АУДИО
    setupMobileAudio() {
        const unlockAudio = () => {
            if (this.unlocked) return;

            // Воспроизводим тишину для разблокировки
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);

            this.unlocked = true;

            // 🎵 Обновляем состояние кнопки музыки после разблокировки
            setTimeout(() => {
                const button = document.getElementById('musicToggleBtn');
                if (button && !this.currentMusic) {
                    button.innerHTML = '🎵 MUSIC: OFF';
                    button.style.background = 'rgba(255,100,100,0.2)';
                    button.style.borderColor = 'rgba(255,100,100,0.5)';
                }
                // В турнирном режиме автоматически запускаем музыку лобби
                if ((window.tournamentMode || typeof tournamentMode !== 'undefined' && tournamentMode) && !this.currentMusic) {
                    setTimeout(() => {
                        this.playMusic('tournamentLobby', true);
                    }, 200);
                }
            }, 100);

            // Удаляем обработчики
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
            document.removeEventListener('mousedown', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
            document.removeEventListener('click', unlockAudio);
        };

        // Добавляем обработчики для разблокировки аудио
        document.addEventListener('touchstart', unlockAudio, false);
        document.addEventListener('touchend', unlockAudio, false);
        document.addEventListener('mousedown', unlockAudio, false);
        document.addEventListener('keydown', unlockAudio, false);
        document.addEventListener('click', unlockAudio, false);
    }

    // 📂 ЗАГРУЗКА ЗВУКА
    async loadSound(key, path, isMusic = false) {
        if (!this.enabled) return null;

        try {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';

            return new Promise((resolve, reject) => {
                audio.onloadeddata = () => {
                    const individualVolume = this.getSoundVolume(key);

                    if (isMusic) {
                        audio.loop = true;
                        audio.volume = individualVolume;
                        this.loadedMusic.set(key, audio);
                    } else {
                        audio.volume = individualVolume;
                        this.loadedSounds.set(key, audio);
                    }
                    resolve(audio);
                };

                audio.onerror = () => {
                    resolve(null); // Не блокируем игру из-за отсутствующих звуков
                };

                audio.src = path;
            });
        } catch (error) {
            Logger.error(`❌ Error loading sound ${key}:`, error);
            return null;
        }
    }

    // 🔄 ПРЕДВАРИТЕЛЬНАЯ ЗАГРУЗКА ЗВУКОВ
    async preloadSounds() {
        if (!this.enabled) return;

        const loadPromises = [];

        // Загружаем музыку
        for (const [key, path] of Object.entries(this.soundPaths.music)) {
            loadPromises.push(this.loadSound(key, path, true));
        }

        // Загружаем звуковые эффекты
        for (const [key, path] of Object.entries(this.soundPaths.sfx)) {
            loadPromises.push(this.loadSound(key, path, false));
        }

        // Загружаем атмосферные звуки (если есть)
        if (this.soundPaths.ambient) {
            for (const [key, path] of Object.entries(this.soundPaths.ambient)) {
                loadPromises.push(this.loadSound(key, path, false));
            }
        }

        try {
            await Promise.all(loadPromises);
            const loadedMusic = this.loadedMusic.size;
            const loadedSounds = this.loadedSounds.size;
        } catch (error) {
            Logger.error('❌ Error preloading sounds:', error);
        }
    }

    // 🎵 ВОСПРОИЗВЕДЕНИЕ МУЗЫКИ С КРОССФЕЙДОМ
    playMusic(track, fadeIn = false, crossfade = false) {
        if (!this.enabled || this.muted || !this.musicEnabled) {
            return;
        }

        const music = this.loadedMusic.get(track);
        if (!music) {
            // Тихо игнорируем отсутствующие треки - не спамим в консоль
            return;
        }

        // Если уже играет этот же трек, ничего не делаем
        if (this.currentMusic === music && !music.paused) {
            return;
        }

        // Сохраняем состояние текущего трека
        if (this.currentMusic && !this.currentMusic.paused) {
            const currentTrackName = this.getCurrentTrackName();
            if (currentTrackName) {
                this.musicStates.set(currentTrackName, {
                    currentTime: this.currentMusic.currentTime,
                    volume: this.currentMusic.volume
                });
            }
        }

        // Кроссфейд: плавно затухаем старый трек
        if (crossfade && this.currentMusic && !this.currentMusic.paused) {
            this.fadeOut(this.currentMusic, 1000);
        } else if (this.currentMusic) {
            // Обычная остановка без кроссфейда
            this.currentMusic.pause();
        }

        // Восстанавливаем состояние нового трека
        const savedState = this.musicStates.get(track);
        if (savedState) {
            music.currentTime = savedState.currentTime;
        } else {
            music.currentTime = 0;
        }

        this.currentMusic = music;

        // Используем индивидуальную громкость для этого трека
        const individualVolume = this.getSoundVolume(track);
        music.volume = fadeIn ? 0 : individualVolume;

        music.play().then(() => {
            if (fadeIn) {
                this.fadeIn(music, individualVolume, 1000);
            }
        }).catch(error => {
            Logger.error(`❌ Error playing music ${track}:`, error);
        });
    }

    // 🎛️ ПОЛУЧЕНИЕ ИНДИВИДУАЛЬНОЙ ГРОМКОСТИ ЗВУКА
    getSoundVolume(trackName) {
        return this.soundVolumes[trackName] || 1.0; // По умолчанию 100% если не настроено
    }

    // 🎵 ПОЛУЧЕНИЕ ИМЕНИ ТЕКУЩЕГО ТРЕКА
    getCurrentTrackName() {
        if (!this.currentMusic) return null;

        for (const [trackName, audio] of this.loadedMusic.entries()) {
            if (audio === this.currentMusic) {
                return trackName;
            }
        }
        return null;
    }

    // 🔊 ВОСПРОИЗВЕДЕНИЕ ЗВУКОВОГО ЭФФЕКТА
    playSound(effect, volume = 1.0, pitch = 1.0) {
        if (!this.enabled || this.muted) return;

        const sound = this.loadedSounds.get(effect);
        if (!sound) {
            return;
        }

        try {
            // Клонируем аудио для одновременного воспроизведения
            const audioClone = sound.cloneNode();

            // Используем индивидуальную громкость для этого звука
            const individualVolume = this.getSoundVolume(effect);
            const finalVolume = Math.min(1.0, (volume * individualVolume));
            audioClone.volume = finalVolume;

            // Изменяем высоту тона если нужно
            if (pitch !== 1.0) {
                audioClone.playbackRate = pitch;
            }

            audioClone.play().catch(error => {
                Logger.error(`❌ Error playing sound ${effect}:`, error);
            });
        } catch (error) {
            Logger.error(`❌ Error cloning sound ${effect}:`, error);
        }
    }

    // 🎁 ВОСПРОИЗВЕДЕНИЕ ЗВУКА УСИЛЕНИЯ С FALLBACK
    playBoostSound(boostName, volume = 0.7, pitch = 1.0) {
        if (!this.enabled || this.muted) return;

        // Преобразуем имя усиления в формат звукового ключа
        const specificSoundKey = `boost${boostName.charAt(0).toUpperCase()}${boostName.slice(1)}`;

        // Проверяем есть ли специфичный звук для этого усиления
        if (this.loadedSounds.has(specificSoundKey)) {
            this.playSound(specificSoundKey, volume, pitch);
        } else {
            // Используем общий звук усиления
            this.playSound('boostDefault', volume, pitch);
        }
    }

    // 🎚️ ПЛАВНОЕ ПОЯВЛЕНИЕ ЗВУКА
    fadeIn(audio, targetVolume, duration) {
        const startVolume = 0;
        const volumeStep = targetVolume / (duration / 50);
        let currentVolume = startVolume;

        const fadeInterval = setInterval(() => {
            currentVolume += volumeStep;
            if (currentVolume >= targetVolume) {
                currentVolume = targetVolume;
                clearInterval(fadeInterval);
            }
            audio.volume = currentVolume;
        }, 50);
    }

    // 🎚️ ПЛАВНОЕ ИСЧЕЗНОВЕНИЕ ЗВУКА
    fadeOut(audio, duration, pauseAtEnd = true) {
        const startVolume = audio.volume;
        const volumeStep = startVolume / (duration / 50);
        let currentVolume = startVolume;

        const fadeInterval = setInterval(() => {
            currentVolume -= volumeStep;
            if (currentVolume <= 0) {
                currentVolume = 0;
                if (pauseAtEnd) {
                    audio.pause();
                    // НЕ сбрасываем currentTime для кроссфейда
                }
                clearInterval(fadeInterval);
            }
            audio.volume = currentVolume;
        }, 50);
    }

    // ⏹️ ОСТАНОВКА МУЗЫКИ
    stopMusic(fadeOut = false) {
        if (!this.currentMusic) return;

        if (fadeOut) {
            this.fadeOut(this.currentMusic, 1000);
        } else {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        this.currentMusic = null;
    }

    // ⏸️ ПАУЗА/ВОЗОБНОВЛЕНИЕ МУЗЫКИ
    pauseMusic() {
        if (this.currentMusic && !this.musicPaused) {
            this.currentMusic.pause();
            this.musicPaused = true;
        }
    }

    resumeMusic() {
        if (this.currentMusic && this.musicPaused) {
            this.currentMusic.play();
            this.musicPaused = false;
        }
    }

    // 🔇 УПРАВЛЕНИЕ ЗВУКОМ
    mute() {
        this.muted = true;
        if (this.currentMusic) {
            this.currentMusic.volume = 0;
        }
        this.saveSettings();
    }

    unmute() {
        this.muted = false;
        if (this.currentMusic) {
            const individualVolume = this.getSoundVolume(this.currentMusic.dataset?.track || 'menu');
            this.currentMusic.volume = individualVolume;
        }
        this.saveSettings();
    }

    toggleMute() {
        if (this.muted) {
            this.unmute();
        } else {
            this.mute();
        }
    }

    // 🔄 ОБНОВЛЕНИЕ ГРОМКОСТИ ТЕКУЩЕЙ МУЗЫКИ
    updateCurrentMusicVolume() {
        if (this.currentMusic) {
            const track = this.currentMusic.dataset?.track || 'menu';
            const individualVolume = this.getSoundVolume(track);
            this.currentMusic.volume = individualVolume;
        }
    }

    // 🎛️ УСТАНОВКА ИНДИВИДУАЛЬНОЙ ГРОМКОСТИ ЗВУКА
    setSoundVolume(soundName, volume) {
        this.soundVolumes[soundName] = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        this.updateCurrentMusicVolume(); // Обновляем громкость если меняем текущий трек
    }

    // 💾 СОХРАНЕНИЕ НАСТРОЕК
    saveSettings() {
        const settings = {
            musicEnabled: this.musicEnabled,
            muted: this.muted,
            soundVolumes: this.soundVolumes // Сохраняем индивидуальные громкости
        };
        localStorage.setItem('pharosInvadersSoundSettings', JSON.stringify(settings));
    }

    // 📁 ЗАГРУЗКА НАСТРОЕК
    loadSettings() {
        try {
            const saved = localStorage.getItem('pharosInvadersSoundSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.musicEnabled = settings.musicEnabled !== false;
                this.muted = settings.muted || false;

                // Загружаем индивидуальные настройки громкости
                if (settings.soundVolumes) {
                    // Объединяем сохраненные настройки с базовыми
                    this.soundVolumes = { ...this.soundVolumes, ...settings.soundVolumes };
                }
            }
        } catch (error) {
            Logger.error('❌ Error loading sound settings:', error);
        }
    }

    // 📊 ПОЛУЧЕНИЕ ИНФОРМАЦИИ
    getStatus() {
        return {
            enabled: this.enabled,
            musicEnabled: this.musicEnabled,
            muted: this.muted,
            currentMusic: this.currentMusic ? 'playing' : 'none',
            individualVolumes: this.soundVolumes,
            loadedSounds: this.loadedSounds.size,
            loadedMusic: this.loadedMusic.size
        };
    }

    // 🧹 ОЧИСТКА
    destroy() {
        this.stopMusic();
        this.loadedSounds.clear();
        this.loadedMusic.clear();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// 🌐 Создаем глобальный экземпляр
window.soundManager = new SoundManager();

// 🎛️ Глобальные функции для тестирования (можно использовать в консоли)
window.setSoundVolume = (soundName, volume) => {
    if (window.soundManager) {
        window.soundManager.setSoundVolume(soundName, volume);
    }
};

window.getSoundStatus = () => {
    if (window.soundManager) {
        console.table(window.soundManager.soundVolumes);
        return window.soundManager.getStatus();
    }
};

// 📤 Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
}