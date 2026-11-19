import * as THREE from 'three';

const cache = new Map<string, THREE.MeshLambertMaterial>();

export function lambert(hex: number, opacity = 1) {
  const key = `${hex}:${opacity}`;
  let mat = cache.get(key);
  if (!mat) {
    mat = new THREE.MeshLambertMaterial({
      color: hex,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    });
    cache.set(key, mat);
  }
  return mat;
}

export function makeSpeckle(base: string, speck: string, count: number, alpha = 0.35) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) throw new Error('canvas');
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < count; i++) {
    g.globalAlpha = alpha * (0.4 + Math.random() * 0.6);
    g.fillStyle = speck;
    const s = 1 + Math.random() * 2.5;
    g.fillRect(Math.random() * 256, Math.random() * 256, s, s);
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
