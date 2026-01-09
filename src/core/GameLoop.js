/**
 * GameLoop - Fixed timestep game loop met interpolatie
 *
 * Dit zorgt voor:
 * - Consistente physics updates (60 UPS)
 * - Smooth rendering onafhankelijk van framerate
 * - Delta time voor animaties
 */
export class GameLoop {
    constructor(options = {}) {
        // Timing configuratie
        this.targetUPS = options.targetUPS || 60;           // Updates per second
        this.maxFrameSkip = options.maxFrameSkip || 5;      // Max updates per frame
        this.timestep = 1000 / this.targetUPS;              // Ms per update

        // State
        this.isRunning = false;
        this.isPaused = false;
        this.accumulator = 0;
        this.lastTime = 0;
        this.frameId = null;

        // Performance tracking
        this.fps = 0;
        this.ups = 0;
        this.frameCount = 0;
        this.updateCount = 0;
        this.lastPerfTime = 0;
        this.deltaTime = 0;

        // Callbacks
        this.onUpdate = options.onUpdate || (() => {});
        this.onRender = options.onRender || (() => {});
        this.onStats = options.onStats || (() => {});
    }

    /**
     * Start de game loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.lastPerfTime = this.lastTime;
        this.accumulator = 0;

        console.log('🎮 Game loop started');
        this.loop(this.lastTime);
    }

    /**
     * Stop de game loop
     */
    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        console.log('🛑 Game loop stopped');
    }

    /**
     * Pauzeer/hervat de game
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastTime = performance.now();
            this.accumulator = 0;
        }
        console.log(this.isPaused ? '⏸️ Game paused' : '▶️ Game resumed');
        return this.isPaused;
    }

    /**
     * De hoofdloop - wordt elk frame aangeroepen
     */
    loop = (currentTime) => {
        if (!this.isRunning) return;

        this.frameId = requestAnimationFrame(this.loop);

        // Bereken delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Voorkom spiral of death bij grote delta's
        if (this.deltaTime > 250) {
            this.deltaTime = 250;
        }

        // Update performance stats elke seconde
        this.updatePerformanceStats(currentTime);

        if (this.isPaused) {
            // Render nog steeds bij pauze (voor UI etc)
            this.onRender(0);
            return;
        }

        // Accumulator voor fixed timestep
        this.accumulator += this.deltaTime;

        // Fixed timestep updates
        let updates = 0;
        while (this.accumulator >= this.timestep && updates < this.maxFrameSkip) {
            this.onUpdate(this.timestep / 1000); // Convert to seconds
            this.accumulator -= this.timestep;
            this.updateCount++;
            updates++;
        }

        // Bereken interpolatie alpha voor smooth rendering
        const alpha = this.accumulator / this.timestep;

        // Render met interpolatie
        this.onRender(alpha);
        this.frameCount++;
    }

    /**
     * Update FPS/UPS counters
     */
    updatePerformanceStats(currentTime) {
        const elapsed = currentTime - this.lastPerfTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.ups = Math.round((this.updateCount * 1000) / elapsed);

            this.onStats({
                fps: this.fps,
                ups: this.ups,
                deltaTime: this.deltaTime
            });

            this.frameCount = 0;
            this.updateCount = 0;
            this.lastPerfTime = currentTime;
        }
    }

    /**
     * Get huidige stats
     */
    getStats() {
        return {
            fps: this.fps,
            ups: this.ups,
            deltaTime: this.deltaTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }
}
