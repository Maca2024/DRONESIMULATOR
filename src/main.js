/**
 * Drone Simulator - Main Entry Point
 *
 * Een modulaire game met:
 * - Fixed timestep game loop (60 UPS)
 * - Smooth rendering met interpolatie
 * - Physics-based drone movement
 * - Input handling
 */

import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { Renderer } from './core/Renderer.js';
import { Drone } from './entities/Drone.js';

class Game {
    constructor() {
        // Get canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found!');
        }

        // Initialize core systems
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager();
        this.input.bind(this.canvas);

        // Create entities
        this.entities = [];
        this.drone = new Drone(this.canvas.width / 2, 400);
        this.entities.push(this.drone);

        // Game state
        this.time = 0;
        this.showDebug = true;

        // Landing pad position
        this.landingPad = {
            x: 512,
            y: 718,
            width: 80
        };

        // Initialize game loop
        this.gameLoop = new GameLoop({
            targetUPS: 60,
            onUpdate: this.update.bind(this),
            onRender: this.render.bind(this),
            onStats: this.updateStats.bind(this)
        });

        // Setup UI
        this.setupUI();

        console.log('🚁 Drone Simulator initialized!');
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        // Cache DOM elements
        this.fpsElement = document.getElementById('fps');
        this.upsElement = document.getElementById('ups');
        this.entitiesElement = document.getElementById('entities');
        this.deltaElement = document.getElementById('delta');
    }

    /**
     * Start the game
     */
    start() {
        this.gameLoop.start();
        console.log('🎮 Game started! Use WASD to move, SPACE for thrust, P to pause');
    }

    /**
     * Main update function - fixed timestep
     */
    update(dt) {
        this.time += dt;

        // Handle pause toggle
        if (this.input.isActionPressed('pause')) {
            this.gameLoop.togglePause();
        }

        // Toggle debug
        if (this.input.isActionPressed('debug')) {
            this.showDebug = !this.showDebug;
            document.getElementById('debug-panel').style.display =
                this.showDebug ? 'block' : 'none';
        }

        // Update all entities
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(dt, this.input);
            }
        }

        // Clear per-frame input state
        this.input.endFrame();
    }

    /**
     * Main render function - called every frame with interpolation alpha
     */
    render(alpha) {
        // Clear and draw background
        this.renderer.clear();
        this.renderer.drawBackground(this.time * 1000);

        // Draw landing pad
        this.renderer.drawLandingPad(
            this.landingPad.x,
            this.landingPad.y,
            this.landingPad.width
        );

        // Render all entities
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.renderer.ctx, alpha);
            }
        }

        // Draw pause overlay
        if (this.gameLoop.isPaused) {
            this.drawPauseOverlay();
        }
    }

    /**
     * Draw pause screen
     */
    drawPauseOverlay() {
        const ctx = this.renderer.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

        ctx.font = '20px Arial';
        ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    /**
     * Update debug stats display
     */
    updateStats(stats) {
        if (!this.showDebug) return;

        this.fpsElement.textContent = stats.fps;
        this.upsElement.textContent = stats.ups;
        this.entitiesElement.textContent = this.entities.length;
        this.deltaElement.textContent = stats.deltaTime.toFixed(1);
    }
}

// Initialize and start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new Game();
        game.start();

        // Expose for debugging
        window.game = game;
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});
