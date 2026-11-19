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

  constructor(onMute: (muted: boolean) => void) {
    const root = document.getElementById('hud');
    if (!root) throw new Error('hud');
    root.innerHTML = `
      <div class="panel brand-panel">
        <div class="brand">万岁山</div>
        <div class="clock"></div>
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
    `;
    this.clock = root.querySelector('.clock')!;
    this.bill = root.querySelector('.bill')!;
    this.card = root.querySelector('.title-card')!;
    this.who = root.querySelector('.who')!;
    this.zh = root.querySelector('.zh')!;
    this.en = root.querySelector('.en')!;
    this.mute = root.querySelector('#mute')!;
    this.tags = document.getElementById('tags')!;
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
    tags: TagView[];
    camera: THREE.Camera;
    width: number;
    height: number;
  }) {
    this.clock.textContent = formatParkTime(opts.parkTime);
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
  }
}
