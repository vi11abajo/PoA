// 📊 PHAROS INVADERS - PERFORMANCE MONITOR
// Утилиты для мониторинга производительности игры

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: []
            },
            memory: {
                used: 0,
                peak: 0,
                poolStats: {}
            },
            rendering: {
                drawCalls: 0,
                batchedRenders: 0,
                skippedFrames: 0
            },
            collision: {
                checksPerFrame: 0,
                optimizedChecks: 0,
                totalChecks: 0
            }
        };
        
        this.isEnabled = false;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.updateInterval = 1000; // 1 секунда
        this.lastUpdate = 0;
        
        // DOM элементы для отображения
        this.debugPanel = null;
        this.createDebugPanel();
    }

    enable() {
        this.isEnabled = true;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'block';
        }
    }

    disable() {
        this.isEnabled = false;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none';
        }
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    // Создание панели отладки
    createDebugPanel() {
        // Проверяем, не существует ли панель уже
        this.debugPanel = document.getElementById('performance-debug-panel');
        if (this.debugPanel) return;

        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'performance-debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ffff;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
            display: none;
            border: 1px solid #00ffff;
        `;

        this.debugPanel.innerHTML = `
            <div style="text-align: center; margin-bottom: 5px; color: #ffd700;">
                📊 PERFORMANCE MONITOR
            </div>
            <div id="fps-display">FPS: 0</div>
            <div id="memory-display">Memory: 0 KB</div>
            <div id="pool-display">Pools: 0</div>
            <div id="collision-display">Collisions: 0</div>
            <div id="render-display">Renders: 0</div>
            <hr style="border-color: #00ffff; margin: 5px 0;">
            <div style="font-size: 10px; opacity: 0.7;">
                Press 'P' to toggle
            </div>
        `;

        document.body.appendChild(this.debugPanel);

        // Добавляем обработчик клавиши P
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' && !e.ctrlKey && !e.altKey) {
                this.toggle();
                e.preventDefault();
            }
        });
    }

    // Обновление метрик FPS
    updateFPS(currentTime) {
        if (!this.isEnabled) return;

        this.frameCount++;
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime > 0) {
            const fps = 1000 / deltaTime;
            this.metrics.fps.current = fps;
            
            // Обновляем min/max
            this.metrics.fps.min = Math.min(this.metrics.fps.min, fps);
            this.metrics.fps.max = Math.max(this.metrics.fps.max, fps);
            
            // Добавляем в историю
            this.metrics.fps.history.push(fps);
            if (this.metrics.fps.history.length > 60) { // Храним последние 60 кадров
                this.metrics.fps.history.shift();
            }
            
            // Вычисляем среднее
            this.metrics.fps.average = this.metrics.fps.history.reduce((a, b) => a + b, 0) / this.metrics.fps.history.length;
        }
        
        this.lastFrameTime = currentTime;
    }

    // Обновление метрик памяти
    updateMemory(optimizer) {
        if (!this.isEnabled || !optimizer) return;

        try {
            // Получаем статистику пулов объектов
            this.metrics.memory.poolStats = optimizer.getPoolStats();
            
            // Примерный расчет используемой памяти
            let totalMemory = 0;
            Object.values(this.metrics.memory.poolStats).forEach(pool => {
                totalMemory += pool.total * 50; // Примерно 50 байт на объект
            });
            
            this.metrics.memory.used = totalMemory;
            this.metrics.memory.peak = Math.max(this.metrics.memory.peak, totalMemory);
            
        } catch (error) {
            console.warn('Memory monitoring error:', error);
        }
    }

    // Обновление метрик коллизий
    updateCollisionStats(checksThisFrame, optimized = false) {
        if (!this.isEnabled) return;
        
        this.metrics.collision.checksPerFrame = checksThisFrame;
        this.metrics.collision.totalChecks += checksThisFrame;
        
        if (optimized) {
            this.metrics.collision.optimizedChecks += checksThisFrame;
        }
    }

    // Обновление метрик рендеринга
    updateRenderStats(drawCalls, batched = false) {
        if (!this.isEnabled) return;
        
        this.metrics.rendering.drawCalls += drawCalls;
        if (batched) {
            this.metrics.rendering.batchedRenders++;
        }
    }

    // Обновление отображения метрик
    updateDisplay(currentTime) {
        if (!this.isEnabled || !this.debugPanel) return;

        // Обновляем только каждую секунду
        if (currentTime - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = currentTime;

        const fpsDisplay = document.getElementById('fps-display');
        const memoryDisplay = document.getElementById('memory-display');
        const poolDisplay = document.getElementById('pool-display');
        const collisionDisplay = document.getElementById('collision-display');
        const renderDisplay = document.getElementById('render-display');

        if (fpsDisplay) {
            const fps = Math.round(this.metrics.fps.current);
            const avgFps = Math.round(this.metrics.fps.average);
            fpsDisplay.textContent = `FPS: ${fps} (avg: ${avgFps})`;
            
            // Цветовая индикация FPS
            if (fps > 50) {
                fpsDisplay.style.color = '#00ff00';
            } else if (fps > 30) {
                fpsDisplay.style.color = '#ffff00';
            } else {
                fpsDisplay.style.color = '#ff6666';
            }
        }

        if (memoryDisplay) {
            const memoryKB = Math.round(this.metrics.memory.used / 1024);
            const peakKB = Math.round(this.metrics.memory.peak / 1024);
            memoryDisplay.textContent = `Memory: ${memoryKB} KB (peak: ${peakKB} KB)`;
        }

        if (poolDisplay) {
            const poolStats = this.metrics.memory.poolStats;
            let totalActive = 0;
            let totalReused = 0;
            
            Object.values(poolStats).forEach(pool => {
                totalActive += pool.active;
                totalReused += pool.reused;
            });
            
            poolDisplay.textContent = `Pools: ${totalActive} active, ${totalReused} reused`;
        }

        if (collisionDisplay) {
            const optimizationPercent = this.metrics.collision.totalChecks > 0 
                ? Math.round((this.metrics.collision.optimizedChecks / this.metrics.collision.totalChecks) * 100)
                : 0;
            collisionDisplay.textContent = `Collisions: ${this.metrics.collision.checksPerFrame}/frame (${optimizationPercent}% optimized)`;
        }

        if (renderDisplay) {
            renderDisplay.textContent = `Renders: ${this.metrics.rendering.drawCalls} calls, ${this.metrics.rendering.batchedRenders} batched`;
        }

        // Сбрасываем счетчики кадра
        this.metrics.rendering.drawCalls = 0;
        this.metrics.rendering.batchedRenders = 0;
    }

    // Получение отчета о производительности
    getReport() {
        return {
            timestamp: Date.now(),
            fps: {
                current: Math.round(this.metrics.fps.current),
                average: Math.round(this.metrics.fps.average),
                min: Math.round(this.metrics.fps.min === Infinity ? 0 : this.metrics.fps.min),
                max: Math.round(this.metrics.fps.max)
            },
            memory: {
                used: Math.round(this.metrics.memory.used / 1024), // KB
                peak: Math.round(this.metrics.memory.peak / 1024), // KB
                poolStats: this.metrics.memory.poolStats
            },
            optimization: {
                collisionOptimization: this.metrics.collision.totalChecks > 0 
                    ? Math.round((this.metrics.collision.optimizedChecks / this.metrics.collision.totalChecks) * 100)
                    : 0,
                batchRenderingUsage: this.metrics.rendering.batchedRenders
            }
        };
    }

    // Логирование отчета в консоль
    logReport() {
        const report = this.getReport();
        // Performance Report - FPS, Memory, Optimization metrics available
    }

    // Сброс метрик
    reset() {
        this.metrics = {
            fps: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: []
            },
            memory: {
                used: 0,
                peak: 0,
                poolStats: {}
            },
            rendering: {
                drawCalls: 0,
                batchedRenders: 0,
                skippedFrames: 0
            },
            collision: {
                checksPerFrame: 0,
                optimizedChecks: 0,
                totalChecks: 0
            }
        };
        
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
    }

    // Очистка ресурсов
    destroy() {
        if (this.debugPanel && this.debugPanel.parentNode) {
            this.debugPanel.parentNode.removeChild(this.debugPanel);
        }
        this.debugPanel = null;
        this.isEnabled = false;
    }
}

// Глобальный экземпляр монитора
let globalPerformanceMonitor = null;

// Функция для получения или создания монитора
function getPerformanceMonitor() {
    if (!globalPerformanceMonitor) {
        globalPerformanceMonitor = new PerformanceMonitor();
    }
    return globalPerformanceMonitor;
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, getPerformanceMonitor };
} else if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
    window.getPerformanceMonitor = getPerformanceMonitor;
}