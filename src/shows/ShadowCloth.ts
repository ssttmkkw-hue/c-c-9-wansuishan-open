import * as THREE from 'three';

/** Original shadow-play cloth: warm lamp, black paper figures, no sourced art. */
export class ShadowCloth {
  readonly mesh: THREE.Mesh;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly tex: THREE.CanvasTexture;
  private readonly lamp: THREE.Mesh;

  constructor(parent: THREE.Object3D) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 320;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('shadow canvas');
    this.ctx = ctx;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 1.42),
      new THREE.MeshBasicMaterial({ map: this.tex, side: THREE.DoubleSide }),
    );
    this.mesh.position.set(0, 1.5, 0.88);
    parent.add(this.mesh);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6), new THREE.MeshLambertMaterial({ color: 0x3a2418 }));
    pole.position.set(-1.28, 1.15, 1.05);
    this.lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xffc56a, emissive: 0xff6a18, emissiveIntensity: 1.1 }),
    );
    this.lamp.position.set(-1.28, 1.78, 1.05);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.16, 8), new THREE.MeshLambertMaterial({ color: 0x6a2a18 }));
    shade.position.set(-1.28, 1.96, 1.05);
    parent.add(pole, this.lamp, shade);
  }

  update(showTime: number) {
    const g = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const flick = 0.86 + Math.sin(showTime * 17) * 0.06 + Math.sin(showTime * 41) * 0.03;
    const sky = g.createRadialGradient(150, 150, 20, 256, 160, 340);
    sky.addColorStop(0, `rgba(255, 214, 140, ${flick})`);
    sky.addColorStop(0.45, '#e7a15a');
    sky.addColorStop(1, '#8a3d22');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    g.strokeStyle = 'rgba(90, 32, 18, 0.45)';
    g.lineWidth = 6;
    g.strokeRect(18, 16, w - 36, h - 32);

    const pose = Math.floor(showTime / 5) % 6;
    this.drawGround(g);
    this.drawCrane(g, pose, showTime);
    this.drawBoatman(g, pose, showTime);
    if (pose === 0 || pose === 4) this.drawMoon(g);

    this.tex.needsUpdate = true;
    const pulse = 0.85 + Math.sin(showTime * 9) * 0.15;
    this.lamp.scale.setScalar(pulse);
  }

  private drawGround(g: CanvasRenderingContext2D) {
    g.fillStyle = '#1a0c0a';
    g.beginPath();
    g.moveTo(40, 250);
    g.quadraticCurveTo(256, 230, 470, 258);
    g.lineTo(470, 300);
    g.lineTo(40, 300);
    g.fill();
  }

  private drawMoon(g: CanvasRenderingContext2D) {
    g.fillStyle = '#2a120c';
    g.beginPath();
    g.arc(400, 78, 28, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e7a15a';
    g.beginPath();
    g.arc(412, 74, 22, 0, Math.PI * 2);
    g.fill();
  }

  private drawCrane(g: CanvasRenderingContext2D, pose: number, t: number) {
    const wing = pose === 1 || pose === 2 ? -70 : pose === 5 ? -20 : -40;
    const bob = Math.sin(t * 2) * 6;
    g.save();
    g.translate(150, 168 + bob);
    g.fillStyle = '#140806';
    g.beginPath();
    g.ellipse(0, 10, 46, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(-10, -8, 16, 22, -0.4, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#140806';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-18, -22);
    g.quadraticCurveTo(-40, -50, -28, -78);
    g.stroke();
    g.beginPath();
    g.moveTo(-28, -78);
    g.lineTo(-8, -74);
    g.stroke();
    g.save();
    g.rotate((wing * Math.PI) / 180);
    g.beginPath();
    g.moveTo(6, 0);
    g.quadraticCurveTo(70, -40, 120, -10);
    g.quadraticCurveTo(70, 10, 10, 12);
    g.fill();
    g.restore();
    g.beginPath();
    g.moveTo(30, 16);
    g.lineTo(24, 48);
    g.lineTo(46, 48);
    g.lineTo(38, 16);
    g.fill();
    g.restore();
  }

  private drawBoatman(g: CanvasRenderingContext2D, pose: number, t: number) {
    const lean = pose === 2 ? 0.4 : pose === 3 ? 0.8 : 0.15;
    const arm = pose === 3 ? -1.4 : -0.6 + Math.sin(t * 1.4) * 0.15;
    g.save();
    g.translate(330, 188);
    g.rotate(lean * 0.25);
    g.fillStyle = '#120806';
    g.fillRect(-34, 18, 78, 10);
    g.beginPath();
    g.moveTo(-40, 28);
    g.lineTo(50, 28);
    g.lineTo(36, 42);
    g.lineTo(-24, 42);
    g.fill();
    g.fillRect(-8, -28, 16, 48);
    g.beginPath();
    g.arc(0, -40, 12, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.translate(6, -10);
    g.rotate(arm);
    g.fillRect(0, -3, 54, 6);
    g.restore();
    g.strokeStyle = '#120806';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(58, -6);
    g.lineTo(78, 36);
    g.stroke();
    g.restore();
  }
}
