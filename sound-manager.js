// 🎵 PHAROS INVADERS - SOUND MANAGER
// Система управления звуками и музыкой

class SoundManager {
    // 🎯 Определяем правильный путь к папке sounds в зависимости от текущей страницы
    detectSoundsPath() {
        const currentPath = window.location.pathname;

        // Если мы в подпапке (например, tournament/), нужен относительный путь
        if (currentPath.includes('/tournament/') || currentPath.includes('\\tournament\\')) {
            Logger.info('🎵 Detected tournament page, using ../sounds path');
            return '../sounds';
        }

        // Для основных страниц используем прямой путь
        Logger.info('🎵 Detected main page, using sounds path');
        return 'sounds';
    }

    constructor() {
        // 🔊 Основные настройки
        this.masterVolume = 0.7;
        this.musicVolume = 0.5; // 50% как запрошено
        this.sfxVolume = 0.8;
        this.ambientVolume = 0.3;

        // 🎵 Музыкальные треки
        this.currentMusic = null;
        this.musicPaused = false;
        this.musicStates = new Map(); // Сохраняем состояния всех треков

        // 🎛️ Индивидуальные настройки громкости для каждого звука (0.0 - 1.0)
        this.soundVolumes = {
            // Музыка - все треки на 6% (на 20% тише чем было)
            menu: 0.06,
            tournamentLobby: 0.06,
            gameplay: 0.06,
            boss: 0.06,

            // Игрок
            playerShoot: 0.6,
            player1: 0.7,
            player3: 0.7,
            player12: 0.7,

            // Враги
            crabDeath: 0.8,

            // UI
            buttonClick: 0.8,
            toasty: 0.9, // Громко как в оригинале!
            cu: 0.9, // Громко как sailor!

            // Усиления (на 20% тише)
            boostDefault: 0.56,
            boostCoinShower: 0.48,
            boostAutoTarget: 0.56,
            boostGravityWell: 0.64,
            boostHealthBoost: 0.48,
            boostIceFreeze: 0.56,
            boostInvincibility: 0.64,
            boostMultiShot: 0.56,
            boostPiercingBullets: 0.56,
            boostPointsFreeze: 0.48,
            boostRapidFire: 0.64,
            boostRicochet: 0.56,
            boostScoreMultiplier: 0.48,
            boostShieldBarrier: 0.64,
            boostSpeedTamer: 0.56,
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
                player1: `${soundsBasePath}/sfx/player/1.wav`,
                player3: `${soundsBasePath}/sfx/player/3.wav`,
                player12: `${soundsBasePath}/sfx/player/12.wav`,

                // Враги
                crabDeath: `${soundsBasePath}/sfx/enemies/crab-death.wav`,

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

            Logger.info('🎵 Sound Manager initialized successfully');
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
            Logger.info('📱 Mobile audio unlocked');

            // 🎵 Обновляем состояние кнопки музыки после разблокировки
            setTimeout(() => {
                const button = document.getElementById('musicToggleBtn');
                if (button && !this.currentMusic) {
                    button.innerHTML = '🎵 MUSIC: OFF';
                    button.style.background = 'rgba(255,100,100,0.2)';
                    button.style.borderColor = 'rgba(255,100,100,0.5)';
                }
                Logger.info('🎵 Audio unlocked - user can now start music manually');
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
                        audio.volume = this.musicVolume * this.masterVolume * individualVolume;
                        this.loadedMusic.set(key, audio);
                        // Logger.info(`🎵 Music loaded: ${key}, volume: ${(individualVolume * 100).toFixed(0)}%`);
                    } else {
                        audio.volume = this.sfxVolume * this.masterVolume * individualVolume;
                        this.loadedSounds.set(key, audio);
                        // Logger.info(`🔊 Sound loaded: ${key}, volume: ${(individualVolume * 100).toFixed(0)}%`);
                    }
                    resolve(audio);
                };

                audio.onerror = () => {
                    // Logger.warn(`⚠️ Failed to load sound: ${path}`); // Убираем спам в консоль
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
            Logger.info(`🎵 Sound system ready: ${loadedMusic} music tracks, ${loadedSounds} sound effects`);
        } catch (error) {
            Logger.error('❌ Error preloading sounds:', error);
        }
    }

    // 🎵 ВОСПРОИЗВЕДЕНИЕ МУЗЫКИ С КРОССФЕЙДОМ
    playMusic(track, fadeIn = false, crossfade = false) {
        if (!this.enabled || this.muted) {
            Logger.warn(`⚠️ Music playback blocked: enabled=${this.enabled}, muted=${this.muted}`);
            return;
        }

        const music = this.loadedMusic.get(track);
        if (!music) {
            // Тихо игнорируем отсутствующие треки - не спамим в консоль
            return;
        }

        // Если уже играет этот же трек, ничего не делаем
        if (this.currentMusic === music && !music.paused) {
            Logger.info(`🎵 Track ${track} already playing, continuing...`);
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
                Logger.info(`💾 Saved state for ${currentTrackName}: ${this.currentMusic.currentTime.toFixed(2)}s`);
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
            Logger.info(`🔄 Restored ${track} from ${savedState.currentTime.toFixed(2)}s`);
        } else {
            music.currentTime = 0;
        }

        this.currentMusic = music;

        // Используем индивидуальную громкость для этого трека
        const individualVolume = this.getSoundVolume(track);
        const finalVolume = this.musicVolume * this.masterVolume * individualVolume;
        music.volume = fadeIn ? 0 : finalVolume;

        Logger.info(`🎵 Playing music: ${track}, individual: ${individualVolume}, final: ${finalVolume.toFixed(2)}`);

        music.play().then(() => {
            if (fadeIn) {
                this.fadeIn(music, finalVolume, 1000);
            }
            Logger.info(`✅ Music playing successfully: ${track}`);
        }).catch(error => {
            Logger.error(`❌ Error playing music ${track}:`, error);
            Logger.info(`Audio context state: ${this.audioContext?.state}, unlocked: ${this.unlocked}`);
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
            // Тихо игнорируем отсутствующие звуки - не спамим в консоль
            return;
        }

        try {
            // Клонируем аудио для одновременного воспроизведения
            const audioClone = sound.cloneNode();

            // Используем индивидуальную громкость для этого звука
            const individualVolume = this.getSoundVolume(effect);
            const finalVolume = Math.min(1.0, (this.sfxVolume * this.masterVolume * volume * individualVolume));
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
            Logger.info(`🎵 Playing specific boost sound: ${specificSoundKey}`);
        } else {
            // Используем общий звук усиления
            this.playSound('boostDefault', volume, pitch);
            Logger.info(`🎵 Playing default boost sound for: ${boostName} (${specificSoundKey} not found)`);
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
        Logger.info('🔇 Music stopped');
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
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
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

    // 🎛️ НАСТРОЙКА ГРОМКОСТИ
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        this.saveSettings();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
        this.saveSettings();
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    // 🔄 ОБНОВЛЕНИЕ ВСЕХ ГРОМКОСТЕЙ
    updateAllVolumes() {
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
    }

    // 🎛️ УСТАНОВКА ИНДИВИДУАЛЬНОЙ ГРОМКОСТИ ЗВУКА
    setSoundVolume(soundName, volume) {
        this.soundVolumes[soundName] = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        Logger.info(`🎛️ Set ${soundName} volume to ${(volume * 100).toFixed(0)}%`);
    }

    // 💾 СОХРАНЕНИЕ НАСТРОЕК
    saveSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            ambientVolume: this.ambientVolume,
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
                this.masterVolume = settings.masterVolume || 0.7;
                this.musicVolume = settings.musicVolume || 0.5;
                this.sfxVolume = settings.sfxVolume || 0.8;
                this.ambientVolume = settings.ambientVolume || 0.3;
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
            muted: this.muted,
            currentMusic: this.currentMusic ? 'playing' : 'none',
            volumes: {
                master: this.masterVolume,
                music: this.musicVolume,
                sfx: this.sfxVolume,
                ambient: this.ambientVolume
            },
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