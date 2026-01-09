/**
 * Drone - De speelbare drone entity
 *
 * Features:
 * - Physics-based movement
 * - Gravity en thrust
 * - Rotor animatie
 * - Collision bounds
 */
export class Drone {
    constructor(x, y) {
        // Position
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Physics properties
        this.mass = 1;
        this.drag = 0.98;
        this.gravity = 400;         // Pixels per second^2
        this.thrustPower = 600;     // Upward thrust
        this.moveSpeed = 300;       // Horizontal movement

        // Visual properties
        this.width = 60;
        this.height = 20;
        this.rotorAngle = 0;
        this.rotorSpeed = 0;
        this.tilt = 0;              // Visual tilt based on movement

        // State
        this.isThrusting = false;
        this.altitude = 0;
    }

    /**
     * Update physics
     */
    update(dt, input) {
        // Store previous position for interpolation
        this.prevX = this.x;
        this.prevY = this.y;

        // Get input
        const movement = input.getMovementVector();
        const thrust = input.getThrust();

        // Apply thrust
        this.isThrusting = thrust > 0;
        if (thrust > 0) {
            this.vy -= this.thrustPower * dt;
            this.rotorSpeed = Math.min(this.rotorSpeed + dt * 20, 1);
        } else if (thrust < 0) {
            this.vy += this.thrustPower * 0.5 * dt;
            this.rotorSpeed = Math.max(this.rotorSpeed - dt * 10, 0.2);
        } else {
            // Hover mode - counter gravity partially
            this.rotorSpeed = Math.max(this.rotorSpeed - dt * 5, 0.3);
        }

        // Apply horizontal movement
        this.vx += movement.x * this.moveSpeed * dt;

        // Apply gravity
        this.vy += this.gravity * dt;

        // Apply drag
        this.vx *= this.drag;
        this.vy *= this.drag;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Update visual tilt based on horizontal velocity
        this.tilt = (this.vx / this.moveSpeed) * 0.3;

        // Update rotor animation
        this.rotorAngle += this.rotorSpeed * dt * 50;

        // Calculate altitude (from bottom of screen)
        this.altitude = 768 - this.y - 50; // Ground level at y=718

        // Ground collision
        if (this.y > 718) {
            this.y = 718;
            this.vy = 0;
            if (this.vx !== 0) {
                this.vx *= 0.8; // Ground friction
            }
        }

        // Ceiling collision
        if (this.y < 50) {
            this.y = 50;
            this.vy = Math.abs(this.vy) * 0.3;
        }

        // Side boundaries
        if (this.x < 30) {
            this.x = 30;
            this.vx = 0;
        }
        if (this.x > 994) {
            this.x = 994;
            this.vx = 0;
        }
    }

    /**
     * Get interpolated position for rendering
     */
    getInterpolatedPosition(alpha) {
        return {
            x: this.prevX + (this.x - this.prevX) * alpha,
            y: this.prevY + (this.y - this.prevY) * alpha
        };
    }

    /**
     * Render de drone
     */
    render(ctx, alpha) {
        const pos = this.getInterpolatedPosition(alpha);

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(this.tilt);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 50 + (768 - 50 - this.y) * 0.1, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
        ctx.fill();

        // Body highlight
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 3, -this.height / 2 + 3, this.width - 6, 8, 3);
        ctx.fill();

        // LED lights
        ctx.fillStyle = this.isThrusting ? '#0f0' : '#f00';
        ctx.beginPath();
        ctx.arc(-this.width / 2 + 8, 0, 3, 0, Math.PI * 2);
        ctx.arc(this.width / 2 - 8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Rotor arms
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -5);
        ctx.lineTo(-this.width / 2 - 15, -20);
        ctx.moveTo(this.width / 2, -5);
        ctx.lineTo(this.width / 2 + 15, -20);
        ctx.stroke();

        // Rotors
        this.drawRotor(ctx, -this.width / 2 - 15, -20);
        this.drawRotor(ctx, this.width / 2 + 15, -20);

        // Thrust effect
        if (this.isThrusting) {
            this.drawThrustEffect(ctx);
        }

        ctx.restore();

        // Altitude indicator
        this.drawAltitudeIndicator(ctx, pos);
    }

    drawRotor(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Rotor blur effect when spinning fast
        if (this.rotorSpeed > 0.5) {
            ctx.fillStyle = `rgba(100, 100, 100, ${this.rotorSpeed * 0.3})`;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rotor blades
        ctx.rotate(this.rotorAngle);
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawThrustEffect(ctx) {
        const gradient = ctx.createLinearGradient(0, 10, 0, 40);
        gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.lineTo(4, 30 + Math.random() * 10);
        ctx.lineTo(-4, 30 + Math.random() * 10);
        ctx.closePath();
        ctx.fill();
    }

    drawAltitudeIndicator(ctx, pos) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(this.altitude)}m`, pos.x, pos.y - 35);
        ctx.restore();
    }

    /**
     * Get collision bounds
     */
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
