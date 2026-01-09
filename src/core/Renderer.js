/**
 * Renderer - Handles all canvas rendering
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Background elements
        this.clouds = this.generateClouds(5);
        this.trees = this.generateTrees(8);
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw the background
     */
    drawBackground(time) {
        const ctx = this.ctx;

        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.6, '#B0E0E6');
        skyGradient.addColorStop(1, '#98D8C8');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Sun
        ctx.fillStyle = '#FFE87C';
        ctx.beginPath();
        ctx.arc(850, 100, 50, 0, Math.PI * 2);
        ctx.fill();

        // Sun glow
        const sunGlow = ctx.createRadialGradient(850, 100, 40, 850, 100, 100);
        sunGlow.addColorStop(0, 'rgba(255, 232, 124, 0.3)');
        sunGlow.addColorStop(1, 'rgba(255, 232, 124, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(850, 100, 100, 0, Math.PI * 2);
        ctx.fill();

        // Clouds
        this.drawClouds(time);

        // Mountains in background
        this.drawMountains();

        // Trees
        this.drawTrees();

        // Ground
        this.drawGround();
    }

    generateClouds(count) {
        const clouds = [];
        for (let i = 0; i < count; i++) {
            clouds.push({
                x: Math.random() * this.width,
                y: 50 + Math.random() * 150,
                size: 30 + Math.random() * 40,
                speed: 5 + Math.random() * 10
            });
        }
        return clouds;
    }

    drawClouds(time) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        for (const cloud of this.clouds) {
            const x = (cloud.x + time * cloud.speed * 0.01) % (this.width + 100) - 50;
            this.drawCloud(x, cloud.y, cloud.size);
        }
    }

    drawCloud(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMountains() {
        const ctx = this.ctx;

        // Far mountains
        ctx.fillStyle = '#6B8E6B';
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(150, 450);
        ctx.lineTo(300, 550);
        ctx.lineTo(450, 400);
        ctx.lineTo(600, 500);
        ctx.lineTo(750, 420);
        ctx.lineTo(900, 520);
        ctx.lineTo(1024, 480);
        ctx.lineTo(1024, 600);
        ctx.closePath();
        ctx.fill();

        // Near mountains
        ctx.fillStyle = '#4A6B4A';
        ctx.beginPath();
        ctx.moveTo(0, 650);
        ctx.lineTo(200, 550);
        ctx.lineTo(350, 620);
        ctx.lineTo(500, 530);
        ctx.lineTo(700, 600);
        ctx.lineTo(850, 540);
        ctx.lineTo(1024, 620);
        ctx.lineTo(1024, 650);
        ctx.closePath();
        ctx.fill();
    }

    generateTrees(count) {
        const trees = [];
        for (let i = 0; i < count; i++) {
            trees.push({
                x: 50 + (i / count) * (this.width - 100) + Math.random() * 50,
                size: 40 + Math.random() * 30
            });
        }
        return trees;
    }

    drawTrees() {
        const ctx = this.ctx;
        for (const tree of this.trees) {
            this.drawTree(tree.x, 718, tree.size);
        }
    }

    drawTree(x, y, size) {
        const ctx = this.ctx;

        // Trunk
        ctx.fillStyle = '#4A3728';
        ctx.fillRect(x - size * 0.1, y - size * 0.5, size * 0.2, size * 0.5);

        // Foliage
        ctx.fillStyle = '#2D5A2D';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 1.2);
        ctx.lineTo(x - size * 0.4, y - size * 0.5);
        ctx.lineTo(x + size * 0.4, y - size * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, y - size * 1.5);
        ctx.lineTo(x - size * 0.35, y - size * 0.9);
        ctx.lineTo(x + size * 0.35, y - size * 0.9);
        ctx.closePath();
        ctx.fill();
    }

    drawGround() {
        const ctx = this.ctx;

        // Grass
        const grassGradient = ctx.createLinearGradient(0, 718, 0, 768);
        grassGradient.addColorStop(0, '#4A7A4A');
        grassGradient.addColorStop(1, '#3D5A3D');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, 718, this.width, 50);

        // Grass detail
        ctx.strokeStyle = '#5A8A5A';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, 718);
            ctx.lineTo(i + 5, 708);
            ctx.stroke();
        }
    }

    /**
     * Draw landing pad
     */
    drawLandingPad(x, y, width) {
        const ctx = this.ctx;

        // Pad base
        ctx.fillStyle = '#555';
        ctx.fillRect(x - width / 2, y, width, 10);

        // H marking
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('H', x, y - 5);

        // Lights
        const time = Date.now() / 500;
        ctx.fillStyle = Math.sin(time) > 0 ? '#0F0' : '#030';
        ctx.beginPath();
        ctx.arc(x - width / 2 + 5, y + 5, 3, 0, Math.PI * 2);
        ctx.arc(x + width / 2 - 5, y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
