import * as THREE from 'three';
import { formatParkTime } from '../util';

export interface BillRow {
  name: string;
  title: string;
  state: string;
  live: boolean;
  here: boolean;
}

export interface TagView {
  text: string;
  world: THREE.Vector3;
  emphasis?: boolean;
}

export class Hud {
  private readonly clock: HTMLElement;
  private readonly bill: HTMLElement;
  private readonly card: HTMLElement;
  private readonly who: HTMLElement;
  private readonly zh: HTMLElement;
  private readonly en: HTMLElement;
  private readonly mute: HTMLButtonElement;
  private readonly tags: HTMLElement;
  private readonly tagPool: HTMLDivElement[] = [];
  private readonly now: HTMLElement;
  private readonly stick: HTMLElement;
  private readonly knob: HTMLElement;
  private readonly mini: HTMLCanvasElement;
  private readonly diag: HTMLElement;
  readonly move = { x: 0, y: 0 };

  constructor(onMute: (muted: boolean) => void) {
    const root = document.getElementById('hud');
    if (!root) throw new Error('hud');
    root.innerHTML = `
      <div class="panel brand-panel">
        <div class="brand">万岁山</div>
        <div class="clock"></div>
        <div class="now"></div>
        <div class="bill"></div>
      </div>
      <div class="title-card panel hidden"></div>
      <div class="sub panel">
        <div class="who"></div>
        <div class="zh"></div>
        <div class="en"></div>
      </div>
      <div class="hint">WASD / 方向键移动 · 拖拽张望 · Shift 跑 · 站住便看戏</div>
      <button type="button" class="btn" id="mute">声音 关</button>
      <div class="stick" id="stick"><div class="stick-knob"></div></div>
      <div class="look-hint">右侧拖拽张望</div>
      <canvas class="minimap" width="160" height="160"></canvas>
      <div class="diag hidden"></div>
    `;
    this.clock = root.querySelector('.clock')!;
    this.bill = root.querySelector('.bill')!;
    this.card = root.querySelector('.title-card')!;
    this.who = root.querySelector('.who')!;
    this.zh = root.querySelector('.zh')!;
    this.en = root.querySelector('.en')!;
    this.mute = root.querySelector('#mute')!;
    this.tags = document.getElementById('tags')!;
    this.now = root.querySelector('.now')!;
    this.stick = root.querySelector('#stick')!;
    this.knob = root.querySelector('.stick-knob')!;
    this.mini = root.querySelector('.minimap')!;
    this.diag = root.querySelector('.diag')!;
    this.bindStick();
    this.syncChrome(window.innerWidth);
    let muted = true;
    this.mute.addEventListener('click', () => {
      muted = !muted;
      this.mute.textContent = muted ? '声音 关' : '声音 开';
      onMute(muted);
    });
  }

  update(opts: {
    parkTime: number;
    rows: BillRow[];
    watching: boolean;
    title: string;
    titleEn: string;
    place: string;
    speaker: string;
    zh: string;
    en: string;
    now: string;
    marks: { x: number; z: number; live: boolean }[];
    player: { x: number; z: number; yaw: number };
    tags: TagView[];
    camera: THREE.Camera;
    width: number;
    height: number;
  }) {
    this.syncChrome(opts.width);
    this.clock.textContent = formatParkTime(opts.parkTime);
    this.now.textContent = opts.now;
    this.bill.innerHTML = opts.rows
      .map((r) => {
        const mark = r.here ? '▶ ' : '';
        const cls = r.live ? 'live' : 'soon';
        return `<div class="row ${cls}${r.here ? ' here' : ''}"><span>${mark}${r.name}</span><b>${r.title}</b><em>${r.state}</em></div>`;
      })
      .join('');
    this.card.classList.toggle('hidden', !opts.watching);
    this.card.innerHTML = `<div class="card-title">${opts.title}</div><div class="card-en">${opts.titleEn}</div><div class="card-place">${opts.place}</div>`;
    const hasLine = opts.zh.length > 0;
    (this.who.parentElement as HTMLElement).classList.toggle('hidden', !hasLine);
    this.who.textContent = opts.speaker;
    this.zh.textContent = opts.zh;
    this.en.textContent = opts.en;

    const v = new THREE.Vector3();
    for (let i = 0; i < opts.tags.length; i++) {
      let el = this.tagPool[i];
      if (!el) {
        el = document.createElement('div');
        el.className = 'tag';
        this.tags.appendChild(el);
        this.tagPool.push(el);
      }
      const tag = opts.tags[i];
      v.copy(tag.world).project(opts.camera);
      const behind = v.z > 1;
      const x = (v.x * 0.5 + 0.5) * opts.width;
      const y = (-v.y * 0.5 + 0.5) * opts.height;
      const overHud =
        (x < 320 && y < 270) ||
        (y < 130 && Math.abs(x - opts.width / 2) < 220) ||
        (y > opts.height - 160 && Math.abs(x - opts.width / 2) < 400);
      if (behind || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1 || overHud) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = 'block';
      el.classList.toggle('speak', !!tag.emphasis);
      el.textContent = tag.text;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
    for (let i = opts.tags.length; i < this.tagPool.length; i++) this.tagPool[i].style.display = 'none';
    this.drawMap(opts.player, opts.marks);
  }

  setDiag(text: string | null) {
    this.diag.classList.toggle('hidden', !text);
    if (text) this.diag.textContent = text;
  }

  private syncChrome(width: number) {
    const compact = width < 820;
    document.body.classList.toggle('compact', compact);
    this.stick.classList.toggle('on', compact);
  }

  private bindStick() {
    const set = (clientX: number, clientY: number) => {
      const rect = this.stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = rect.width * 0.34 || 1;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, max);
      dx = (dx / len) * clamped;
      dy = (dy / len) * clamped;
      this.move.x = dx / max;
      this.move.y = dy / max;
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const end = () => {
      this.move.x = 0;
      this.move.y = 0;
      this.knob.style.transform = 'translate(0px, 0px)';
    };
    this.stick.addEventListener('pointerdown', (e) => {
      this.stick.setPointerCapture(e.pointerId);
      set(e.clientX, e.clientY);
    });
    this.stick.addEventListener('pointermove', (e) => {
      if (!this.stick.hasPointerCapture(e.pointerId)) return;
      set(e.clientX, e.clientY);
    });
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);
  }

  private drawMap(player: { x: number; z: number; yaw: number }, marks: { x: number; z: number; live: boolean }[]) {
    const ctx = this.mini.getContext('2d');
    if (!ctx) return;
    const w = this.mini.width;
    const h = this.mini.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(54, 36, 24, 0.2)';
    ctx.fillRect(0, 0, w, h);
    const p = (x: number, z: number) => [(x + 42) / 84 * w, (z + 42) / 84 * h];
    ctx.strokeStyle = 'rgba(240, 215, 164, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    for (const mark of marks) {
      const [x, y] = p(mark.x, mark.z);
      ctx.fillStyle = mark.live ? '#e2b15a' : '#8a7560';
      ctx.beginPath();
      ctx.arc(x, y, mark.live ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const [px, py] = p(player.x, player.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(Math.sin(player.yaw), -Math.cos(player.yaw)));
    ctx.fillStyle = '#fff6e8';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.fill();
    ctx.restore();
  }
}
