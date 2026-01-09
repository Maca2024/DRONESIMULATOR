/**
 * InputManager - Handles keyboard and mouse input
 *
 * Features:
 * - Keyboard state tracking
 * - Key pressed/released events
 * - Mouse position and button tracking
 * - Configurable key bindings
 */
export class InputManager {
    constructor() {
        // Keyboard state
        this.keys = new Map();
        this.keysPressed = new Set();  // Keys pressed this frame
        this.keysReleased = new Set(); // Keys released this frame

        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            buttons: new Map(),
            wheel: 0
        };

        // Action bindings
        this.bindings = new Map([
            ['moveUp', ['KeyW', 'ArrowUp']],
            ['moveDown', ['KeyS', 'ArrowDown']],
            ['moveLeft', ['KeyA', 'ArrowLeft']],
            ['moveRight', ['KeyD', 'ArrowRight']],
            ['thrustUp', ['Space']],
            ['thrustDown', ['ShiftLeft', 'ShiftRight']],
            ['pause', ['KeyP']],
            ['debug', ['F3']]
        ]);

        this.canvas = null;
        this.bound = false;
    }

    /**
     * Bind input events to canvas/window
     */
    bind(canvas) {
        if (this.bound) return;

        this.canvas = canvas;

        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        // Mouse events
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('wheel', this.handleWheel);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.bound = true;
        console.log('🎮 Input manager bound');
    }

    /**
     * Unbind all events
     */
    unbind() {
        if (!this.bound) return;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('wheel', this.handleWheel);
        }

        this.bound = false;
    }

    /**
     * Clear per-frame state (call at end of update)
     */
    endFrame() {
        this.keysPressed.clear();
        this.keysReleased.clear();
        this.mouse.wheel = 0;
    }

    // Event handlers
    handleKeyDown = (e) => {
        if (!this.keys.get(e.code)) {
            this.keysPressed.add(e.code);
        }
        this.keys.set(e.code, true);

        // Prevent default for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }
    }

    handleKeyUp = (e) => {
        this.keys.set(e.code, false);
        this.keysReleased.add(e.code);
    }

    handleMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    handleMouseDown = (e) => {
        this.mouse.buttons.set(e.button, true);
    }

    handleMouseUp = (e) => {
        this.mouse.buttons.set(e.button, false);
    }

    handleWheel = (e) => {
        this.mouse.wheel = Math.sign(e.deltaY);
        e.preventDefault();
    }

    /**
     * Check if a key is currently held
     */
    isKeyDown(code) {
        return this.keys.get(code) || false;
    }

    /**
     * Check if a key was pressed this frame
     */
    isKeyPressed(code) {
        return this.keysPressed.has(code);
    }

    /**
     * Check if a key was released this frame
     */
    isKeyReleased(code) {
        return this.keysReleased.has(code);
    }

    /**
     * Check if an action is active (any bound key is held)
     */
    isAction(action) {
        const codes = this.bindings.get(action);
        if (!codes) return false;
        return codes.some(code => this.isKeyDown(code));
    }

    /**
     * Check if an action was just pressed
     */
    isActionPressed(action) {
        const codes = this.bindings.get(action);
        if (!codes) return false;
        return codes.some(code => this.isKeyPressed(code));
    }

    /**
     * Get movement vector based on input
     */
    getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.isAction('moveLeft')) x -= 1;
        if (this.isAction('moveRight')) x += 1;
        if (this.isAction('moveUp')) y -= 1;
        if (this.isAction('moveDown')) y += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }

        return { x, y };
    }

    /**
     * Get vertical thrust input
     */
    getThrust() {
        let thrust = 0;
        if (this.isAction('thrustUp')) thrust += 1;
        if (this.isAction('thrustDown')) thrust -= 1;
        return thrust;
    }

    /**
     * Check if key should prevent default
     */
    isGameKey(code) {
        for (const [, codes] of this.bindings) {
            if (codes.includes(code)) return true;
        }
        return false;
    }

    /**
     * Get mouse position
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /**
     * Check if mouse button is held
     */
    isMouseDown(button = 0) {
        return this.mouse.buttons.get(button) || false;
    }
}
