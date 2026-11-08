/* ============================================================
   ЛОГОВО ЗЛА — один уровень в духе Diablo II
   колдунья · изометрия · магия · дроп · босс
   ============================================================ */
(() => {
'use strict';

/* ───────────────────────── утилиты ───────────────────────── */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const TAU = Math.PI * 2;

function h2(x, y, s = 0) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
function cacheText(el, txt) {
  if (el && el._txt !== String(txt)) { el.textContent = txt; el._txt = String(txt); }
}

/* ───────────────────────── DOM ───────────────────────── */
const canvas = $('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const lightCanvas = document.createElement('canvas');
const lctx = lightCanvas.getContext('2d');
const mm = $('#minimap');
const mmx = mm.getContext('2d');

const dom = {
  lifeFill: $('#life-fill'), lifeVal: $('#life-val'),
  manaFill: $('#mana-fill'), manaVal: $('#mana-val'),
  lvlBadge: $('#lvl-badge'), xpFill: $('#xp-fill'), xpText: $('#xp-text'),
  hpCount: $('#hp-count'), mpCount: $('#mp-count'),
  potionHp: $('#potion-hp'), potionMp: $('#potion-mp'),
  skills: $('#skills'), goldVal: $('#gold-val'), questCount: $('#quest-count'),
  bossbar: $('#bossbar'), bossFill: $('#boss-fill'),
  btnBag: $('#btn-bag'), bagNotif: $('#bag-notif'), btnSound: $('#btn-sound'),
  inventory: $('#inventory'), invGrid: $('#inv-grid'), invCount: $('#inv-count'),
  gearStats: $('#gear-stats'), btnCloseInv: $('#btn-close-inv'),
  overlayStart: $('#overlay-start'), overlayDeath: $('#overlay-death'),
  overlayWin: $('#overlay-win'), overlayPause: $('#overlay-pause'), overlayPortal: $('#overlay-portal'),
  btnStart: $('#btn-start'), btnRespawn: $('#btn-respawn'),
  btnAgain: $('#btn-again'), btnResume: $('#btn-resume'), btnPortalGo: $('#btn-portal-go'), btnPortalCancel: $('#btn-portal-cancel'),
  deathStats: $('#death-stats'), winStats: $('#win-stats'),
  tooltip: $('#tooltip'), toasts: $('#toasts'), areaBanner: $('#area-banner'),
  mapCard: $('#map-card'), equipSlots: $$('.equip-slot'),
};

/* иконки — только штрих, без эмодзи */
const ICONS = {
  ice: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 2.5 21 16l-5 13.5L11 16Z"/><path d="M16 3v26M11.4 16h9.2M12.8 8.4l6.4 4M19.2 8.4l-6.4 4M12.8 23.6l6.4-4M19.2 23.6l-6.4-4" opacity=".5"/></svg>`,
  fire: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 2.5c.8 5.4-1.3 7.4-3.3 9.6-2.7 3-3.7 5.4-3.7 8.2a6 6 0 0 0 12 0c0-3.2-1.2-5.3-3.1-7.4-.6 2.6-1.7 3.8-2.7 4.1.9-5.5 2-9.7.8-14.5Z"/><path d="M16.1 24.5a2.8 2.8 0 0 1-2.8-2.8c0-1.8 1.7-2.9 2.9-4.8 1.1 1.9 2.8 3 2.8 4.8a2.9 2.9 0 0 1-2.9 2.8Z" opacity=".5"/></svg>`,
  lightning: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M18.6 2.5 9.4 18h5.3l-1.6 11.5L22.6 14h-5.4l1.4-11.5Z"/><path d="M15.4 18h5.6" opacity=".35"/></svg>`,
  nova: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="16" cy="16" r="5.4"/><path d="M16 3.5v4M16 24.5v4M3.5 16h4M24.5 16h4M7.2 7.2l2.8 2.8M22 22l2.8 2.8M24.8 7.2 22 10M10 22l-2.8 2.8"/><circle cx="16" cy="16" r="9.4" opacity=".35" stroke-dasharray="2 4"/></svg>`,
  weapon: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.5 4.5c3.6 1 6 3.3 7 7-2.1 1.2-4.4 1-6-.4L12 20.6"/><path d="M10.6 18.8 6.2 25.8M8 15.8l8.3 8.3M15 14.6l2.6 2.6"/><circle cx="22.2" cy="9.8" r="2.4" fill="currentColor" opacity=".35" stroke="none"/></svg>`,
  armor: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.5 7 8l2 7-2.5 12H25L22.5 15l2-7-4-3.5c-1.2 2-2.7 3-4.9 3s-3.5-1-4.6-3Z"/><path d="M12 12c2.6 1.5 5.4 1.5 8 0" opacity=".5"/></svg>`,
  armor: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.5 7 8l2 7-2.5 12H25L22.5 15l2-7-4-3.5c-1.2 2-2.7 3-4.9 3s-3.5-1-4.6-3Z"/><path d="M12 12c2.6 1.5 5.4 1.5 8 0" opacity=".5"/></svg>`,
  charm: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 9c0-3.6 2.7-6 6-6s6 2.4 6 6" opacity=".6"/><path d="M16 9.5 21 16l-5 8.5L11 16Z"/><path d="M16 12.5v9" opacity=".4"/></svg>`,
  ring: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="3.5" opacity=".5"/><path d="M16 10v-2M16 24v-2M10 16H8M24 16h-2" opacity=".6"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l1.6 10.2a2 2 0 0 1-2 2.3H6.4a2 2 0 0 1-2-2.3Z"/><path d="M9 8V6.6A2.6 2.6 0 0 1 11.6 4h.8A2.6 2.6 0 0 1 15 6.6V8"/></svg>`,
};

/* ───────────────────────── константы мира ───────────────────────── */
const TW = 64, TH = 32, HW = 32, HH = 16, WALL_H = 46;
const MW = 64, MH = 64;
const OX = MH * HW + 64;
const OY = 160;
const FW = OX + MW * HW + 64;
const FH = OY + (MW + MH) * HH + 96;
const DPR = Math.min(1.75, window.devicePixelRatio || 1);
const WALK_SPEED = 4.65;

let CW = 0, CH = 0;

const state = {
  scene: 'menu',
  clock: 0,
  runStart: 0,
  selected: 0,
  player: null,
  enemies: [],
  boss: null,
  projectiles: [],
  particles: [],
  texts: [],
  loot: [],
  effects: [],
  chests: [],
  dust: [],
  camera: { x: OX, y: OY, shakeX: 0, shakeY: 0 },
  mouse: { x: 0, y: 0, tx: 0, ty: 0, left: false, right: false, leftMove: false, over: false },
  keys: Object.create(null),
  inv: { slots: [], equip: { weapon: null, armor: null, charm: null, ring1: null, ring2: null }, open: false, newLoot: false },
  potions: { hp: 3, mp: 3 },
  kills: 0,
  goldEarned: 0,
  uniquesFound: 0,
  pending: null,
  attackTarget: null,
  hover: { enemy: null, loot: null, chest: null },
  shake: 0,
  flash: 0,
  flashColor: '255,70,40',
  hurtFlash: 0,
  winTimer: 0,
  deathTimer: 0,
  revealT: 0,
  portal: null,
  portalT: 0,
  minimapT: 0,
  noManaT: 0,
  ambientT: 5,
  lastOrder: 0,
  tooltipKind: null,
  started: false,
};
let world = null;
let itemId = 0;
let enemyId = 0;
let particleId = 0;

/* ───────────────────────── звук ───────────────────────── */
const AudioSys = {
  ctx: null,
  master: null,
  noiseBuf: null,
  muted: false,
  get ready() { return !!this.ctx; },
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.52;
    this.master.connect(this.ctx.destination);

    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 2.6;
    }
    this.noiseBuf = buf;
    this.ambient();
  },
  ambient() {
    if (!this.ctx) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 180;
    const g = c.createGain(); g.gain.value = 0.045;
    src.connect(filt).connect(g).connect(this.master);
    src.start();
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = 48;
    const og = c.createGain(); og.gain.value = 0.012;
    osc.connect(og).connect(this.master); osc.start();
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.52;
  },
  tone(freq, dur, gain, type = 'sine', slideTo = 0, delay = 0) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, gain, type = 'lowpass', freq = 1200, q = 1, delay = 0) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  },
  drip() {
    if (!this.ctx || this.muted) return;
    const f = rand(700, 1500);
    this.tone(f, 0.24, 0.035, 'sine', f * 0.55);
    this.noise(0.12, 0.012, 'highpass', 2400);
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'ice':
        this.tone(1500, 0.2, 0.05, 'sine', 700);
        this.noise(0.24, 0.06, 'highpass', 2600);
        break;
      case 'fire':
        this.noise(0.5, 0.12, 'lowpass', 900, 0.8);
        this.tone(120, 0.4, 0.06, 'sine', 48);
        break;
      case 'boom':
        this.noise(0.55, 0.16, 'lowpass', 600, 0.7);
        this.tone(86, 0.5, 0.1, 'triangle', 32);
        break;
      case 'bolt':
        this.noise(0.16, 0.12, 'highpass', 3000);
        this.tone(220, 0.12, 0.06, 'sawtooth', 70);
        this.tone(1400, 0.09, 0.03, 'square', 300);
        break;
      case 'nova':
        this.tone(520, 0.45, 0.05, 'sine', 1200);
        this.noise(0.42, 0.08, 'highpass', 1800);
        break;
      case 'hit':
        this.noise(0.09, 0.07, 'bandpass', 1000, 1.4);
        this.tone(150, 0.09, 0.04, 'square', 80);
        break;
      case 'hurt':
        this.tone(110, 0.25, 0.08, 'sawtooth', 55);
        this.noise(0.2, 0.1, 'lowpass', 500);
        break;
      case 'coin':
        this.tone(980, 0.08, 0.035, 'sine', 1300);
        this.tone(1500, 0.12, 0.025, 'sine', 1800, 0.04);
        break;
      case 'potion':
        this.tone(330, 0.22, 0.05, 'sine', 180);
        this.noise(0.16, 0.03, 'lowpass', 700);
        break;
      case 'loot':
        this.tone(1200, 0.14, 0.04, 'sine', 1600);
        break;
      case 'level':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.55, 0.05, 'sine', f, i * 0.09));
        break;
      case 'death':
        this.tone(180, 1.1, 0.08, 'sawtooth', 40);
        this.noise(0.9, 0.08, 'lowpass', 380);
        break;
      case 'boss':
        this.tone(62, 1.3, 0.12, 'sawtooth', 38);
        this.tone(93, 1.1, 0.06, 'square', 48);
        break;
      case 'chest':
        this.noise(0.35, 0.05, 'bandpass', 600, 2);
        this.tone(140, 0.25, 0.04, 'triangle', 90);
        break;
      case 'empty':
        this.tone(120, 0.12, 0.03, 'square', 90);
        break;
      case 'click':
        this.tone(700, 0.05, 0.02, 'square', 500);
        break;
    }
  },
};

/* ───────────────────────── изометрия ───────────────────────── */
function toM(x, y) { return [OX + (x - y) * HW, OY + (x + y) * HH]; }
function toTile(mx, my) {
  const a = (mx - OX) / HW, b = (my - OY) / HH;
  return [(a + b) / 2, (b - a) / 2];
}
function screenOf(mx, my) {
  const c = state.camera;
  return [mx - c.x + CW / 2 + c.shakeX, my - c.y + CH * 0.47 + c.shakeY];
}
function screenToMap(sx, sy) {
  const c = state.camera;
  return [sx + c.x - CW / 2, sy + c.y - CH * 0.47];
}
function screenToTile(sx, sy) {
  const [mx, my] = screenToMap(sx, sy);
  return toTile(mx, my);
}
function snapCamera(instant) {
  const p = state.player;
  if (!p) return;
  const [mx, my] = toM(p.x, p.y);
  if (instant) { state.camera.x = mx; state.camera.y = my - 12; }
  clampCamera();
}
function clampCamera() {
  const c = state.camera;
  const minX = CW / 2 - 170, maxX = FW - CW / 2 + 170;
  const minY = CH * 0.47 - 170, maxY = FH - CH * 0.47 + 170;
  c.x = minX > maxX ? FW / 2 : clamp(c.x, minX, maxX);
  c.y = minY > maxY ? FH / 2 : clamp(c.y, minY, maxY);
}

/* ───────────────────────── данные ───────────────────────── */
const SKILLS = [
  { id: 'ice', name: 'Ледяная стрела', icon: 'ice', color: '#8fd2ff', mana: 6, cd: 0.55, base: [14, 21], desc: 'Осколок льда. Замедляет цель на две секунды.' },
  { id: 'fire', name: 'Огненный шар', icon: 'fire', color: '#ff9a45', mana: 14, cd: 1.0, base: [26, 34], desc: 'Взрывается при попадании, задевая всех рядом.' },
  { id: 'bolt', name: 'Молния', icon: 'lightning', color: '#badbff', mana: 20, cd: 1.35, base: [30, 42], desc: 'Бьёт цель и перескакивает на соседних врагов.' },
  { id: 'nova', name: 'Морозная нова', icon: 'nova', color: '#a8e7ff', mana: 26, cd: 2.6, base: [17, 24], desc: 'Волна льда вокруг колдуньи. Замораживает на 1,2 секунды.' },
];

const ENEMY_DEFS = {
  fallen: {
    name: 'Падший', hp: 34, speed: 2.15, dmg: [4, 7], range: 1.0, radius: 0.26,
    xp: 15, aggro: 6.5, atkCd: 1.0, windup: 0.26, scale: 1, ranged: false,
  },
  shaman: {
    name: 'Шаман племени', hp: 48, speed: 1.5, dmg: [6, 9], range: 1.0, radius: 0.28,
    xp: 26, aggro: 8.5, atkCd: 2.0, windup: 0.5, scale: 1.12, ranged: true, proj: 'shadow', projSpeed: 6.2, projDmg: [8, 12],
  },
  zombie: {
    name: 'Гнилой мертвец', hp: 84, speed: 1.05, dmg: [9, 14], range: 1.15, radius: 0.33,
    xp: 30, aggro: 6.5, atkCd: 1.5, windup: 0.5, scale: 1.18, ranged: false,
  },
  archer: {
    name: 'Костяной лучник', hp: 46, speed: 1.35, dmg: [7, 11], range: 1.0, radius: 0.28,
    xp: 27, aggro: 9, atkCd: 1.9, windup: 0.48, scale: 1.12, ranged: true, proj: 'arrow', projSpeed: 8.2, projDmg: [7, 11],
  },
  boss: {
    name: 'Кровавый Рог', hp: 560, speed: 1.35, dmg: [16, 24], range: 1.45, radius: 0.5,
    xp: 500, aggro: 15, atkCd: 1.8, windup: 0.62, scale: 1.8, ranged: false, boss: true,
  },
};

const ITEM_TYPES = { weapon: 'Посох/Оружие', armor: 'Одеяние', charm: 'Оберег', ring: 'Кольцо' };
const RARITY = {
  common: { label: 'Обычный', color: '#d6c9ab', cls: 'common' },
  magic: { label: 'Магический', color: '#8caef0', cls: 'magic' },
  rare: { label: 'Редкий', color: '#e6cb78', cls: 'rare' },
  unique: { label: 'Уникальный', color: '#d99a58', cls: 'unique' },
};
const ITEM_BASES = {
  weapon: ['Посох ученика', 'Обугленная ветвь', 'Жезл из кости', 'Ветвь старого дуба', 'Скипетр пепла'],
  armor: ['Дорожная роба', 'Кожаный доспех', 'Плащ странницы', 'Одеяние из шкур', 'Мантия сумрака'],
  charm: ['Амулет из клыка', 'Костяной оберег', 'Подвеска из янтаря', 'Печать тления'],
  ring: ['Кольцо с гранатом', 'Серебряное кольцо', 'Кольцо из обсидиана', 'Перстень пламени'],
};
const EPITHETS = ['Иней', 'Угли', 'Кровавая луна', 'Шёпот тьмы', 'Пустота', 'Погибель', 'Холодный свет', 'Тление', 'Последний вздох'];

/* ───────────────────────── генерация пещеры ───────────────────────── */
function makeWorld(seed) {
  const rnd = mulberry32(seed);
  const grid = Array.from({ length: MH }, () => Array(MW).fill(1));
  const rooms = {};

  const solid = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH || grid[y][x] === 1;
  const setFloor = (x, y) => { if (x > 1 && y > 1 && x < MW - 2 && y < MH - 2) grid[y][x] = 0; };

  const carveRoom = (name, cx, cy, rx, ry) => {
    const phase = rnd() * TAU;
    const wob1 = 0.055 + rnd() * 0.035;
    const wob2 = 0.03 + rnd() * 0.025;
    for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) {
      for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const ang = Math.atan2(ny, nx);
        const wob = Math.sin(ang * 3 + phase) * wob1 + Math.sin(ang * 5 - phase * 1.7) * wob2;
        if (nx * nx + ny * ny <= 1 + wob) setFloor(x, y);
      }
    }
    rooms[name] = { name, cx, cy, rx, ry };
  };

  const carveDisc = (cx, cy, r) => {
    const r2 = (r + 0.3) * (r + 0.3);
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const wob = 1 + 0.12 * Math.sin(x * 0.66 + y * 1.13 + seed % 17);
        if (dx * dx + dy * dy <= r2 * wob) setFloor(x, y);
      }
    }
  };

  const carvePath = (x1, y1, x2, y2, width) => {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(2, Math.ceil(d * 3));
    const px = -(y2 - y1) / (d || 1), py = (x2 - x1) / (d || 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wob = Math.sin(t * 8.5 + seed % 11) * (width * 0.24);
      carveDisc(x1 + (x2 - x1) * t + px * wob, y1 + (y2 - y1) * t + py * wob, width * rand(0.82, 1.08));
    }
  };

  carveRoom('entry', 15, 47, 5.7, 4.3);
  carveRoom('main', 29, 33, 8.6, 6.3);
  carveRoom('side', 14, 29, 4.5, 3.4);
  carveRoom('east', 45, 38, 5.7, 4.6);
  carveRoom('alcove', 22, 21, 3.9, 3.0);
  carveRoom('boss', 47, 15, 7.3, 5.9);

  carvePath(17, 43.5, 24, 38, 1.7);
  carvePath(20, 30.8, 17, 29.5, 1.4);
  carvePath(35, 34.5, 41, 37, 1.55);
  carvePath(26.8, 27.2, 23, 22.5, 1.35);
  carvePath(30, 26, 35.5, 21, 1.65);
  carvePath(36, 21, 42.5, 17, 1.65);
  carvePath(48.5, 33, 49, 23, 1.3);

  /* эрозия стен — пещера перестаёт быть набором комнат */
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 2; y < MH - 2; y++) {
      for (let x = 2; x < MW - 2; x++) {
        if (grid[y][x] === 0) continue;
        let n = 0;
        if (!solid(x - 1, y)) n++;
        if (!solid(x + 1, y)) n++;
        if (!solid(x, y - 1)) n++;
        if (!solid(x, y + 1)) n++;
        if (n >= 3 && rnd() < (pass ? 0.24 : 0.4)) grid[y][x] = 0;
      }
    }
  }
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) grid[y][x] = 1;
    }
  }

  /* колонны в святилище */
  const bossRoom = rooms.boss;
  const bx = Math.round(bossRoom.cx), by = Math.round(bossRoom.cy);
  [[-4, -3], [4, -3], [-4, 3], [4, 3]].forEach(([ox, oy]) => {
    const x = bx + ox, y = by + oy;
    if (grid[y][x] === 0) grid[y][x] = 1;
  });

  /* старт игрока */
  let start = null;
  outer:
  for (let r = 0; r < 7; r += 0.5) {
    for (let a = 0; a < 14; a++) {
      const ang = (a / 14) * TAU;
      const x = Math.floor(rooms.entry.cx + Math.cos(ang) * r);
      const y = Math.floor(rooms.entry.cy + 2.4 + Math.sin(ang) * r);
      if (!solid(x, y)) { start = { x: x + 0.5, y: y + 0.5 }; break outer; }
    }
  }
  if (!start) {
    for (let y = 2; y < MH - 2 && !start; y++) {
      for (let x = 2; x < MW - 2; x++) {
        if (grid[y][x] === 0) { start = { x: x + 0.5, y: y + 0.5 }; break; }
      }
    }
  }

  const floors = [], wallsRender = [];
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (grid[y][x] === 0) {
        floors.push([x, y]);
      } else {
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!solid(x + dx, y + dy)) { edge = true; break; }
          }
        }
        if (edge) {
          const [mx, my] = toM(x, y);
          wallsRender.push({ mx, my, topX: mx, topY: my, sortY: my + TH + 2, sprite: Math.floor(h2(x, y, 9) * 6) });
        }
      }
    }
  }

  const occupied = [];
  const freeSpot = (x, y, minR = 2, maxR = 5) => {
    for (let i = 0; i < 60; i++) {
      const ang = rnd() * TAU;
      const r = minR + rnd() * (maxR - minR);
      const tx = Math.floor(x + Math.cos(ang) * r);
      const ty = Math.floor(y + Math.sin(ang) * r * 0.78);
      if (solid(tx, ty)) continue;
      const wx = tx + 0.5, wy = ty + 0.5;
      if (occupied.some(o => Math.hypot(o.x - wx, o.y - wy) < 1.5)) continue;
      return { x: wx, y: wy, tx, ty };
    }
    return null;
  };

  /* костёр у входа */
  const props = [];
  let fireSpot = null;
  for (let i = 0; i < 60 && !fireSpot; i++) {
    const ang = rnd() * TAU, r = 1.5 + rnd() * 2.4;
    const tx = Math.floor(rooms.entry.cx + Math.cos(ang) * r);
    const ty = Math.floor(rooms.entry.cy + Math.sin(ang) * r * 0.7 - 0.8);
    if (solid(tx, ty)) continue;
    const wx = tx + 0.5, wy = ty + 0.5;
    if (Math.hypot(wx - start.x, wy - start.y) < 2.4) continue;
    fireSpot = { x: wx, y: wy };
  }
  if (fireSpot) {
    props.push({ type: 'campfire', x: fireSpot.x, y: fireSpot.y, phase: rnd() * TAU });
    occupied.push(fireSpot);
  }

  /* жаровни */
  const addBrazier = (x, y) => {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (solid(tx, ty)) return;
    const wx = tx + 0.5, wy = ty + 0.5;
    if (occupied.some(o => Math.hypot(o.x - wx, o.y - wy) < 1.6)) return;
    props.push({ type: 'brazier', x: wx, y: wy, phase: rnd() * TAU });
    occupied.push({ x: wx, y: wy });
  };
  addBrazier(bossRoom.cx - 3.4, bossRoom.cy + 2.6);
  addBrazier(bossRoom.cx + 3.4, bossRoom.cy + 2.6);
  addBrazier(rooms.main.cx + 3.8, rooms.main.cy - 2.2);

  /* сундуки */
  const chestSpots = [];
  const addChest = (room, minR, maxR) => {
    const s = freeSpot(room.cx, room.cy, minR, maxR);
    if (!s) return;
    chestSpots.push({ x: s.x, y: s.y, opened: false });
    occupied.push({ x: s.x, y: s.y });
  };
  addChest(rooms.side, 1.2, 3.4);
  addChest(rooms.east, 1.4, 4.0);
  addChest(rooms.alcove, 0.8, 2.4);
  addChest(rooms.boss, 2.6, 5.0);

  /* факелы на стенах */
  const wallCandidates = [];
  for (let y = 2; y < MH - 2; y++) {
    for (let x = 2; x < MW - 2; x++) {
      if (grid[y][x] === 1 && grid[y + 1] && grid[y + 1][x] === 0) wallCandidates.push([x, y]);
    }
  }
  const anchors = [
    [rooms.entry.cx, rooms.entry.cy],
    [rooms.main.cx - 5, rooms.main.cy],
    [rooms.main.cx + 5, rooms.main.cy],
    [rooms.side.cx, rooms.side.cy],
    [rooms.east.cx, rooms.east.cy],
    [rooms.boss.cx - 4, rooms.boss.cy + 3],
    [rooms.boss.cx + 4, rooms.boss.cy - 2],
  ];
  const torches = [];
  for (const [ax, ay] of anchors) {
    let best = null, bestD = 999;
    for (const [x, y] of wallCandidates) {
      if (torches.some(t => Math.hypot(t.wx - x, t.wy - y) < 5)) continue;
      const d = Math.hypot(x - ax, y - ay);
      if (d < bestD && d < 10) { bestD = d; best = [x, y]; }
    }
    if (!best) continue;
    const [wx, wy] = best;
    const [cx] = toM(wx + 0.5, wy + 0.5);
    const baseY = toM(wx, wy)[1] + TH;
    torches.push({ wx, wy, mx: cx, my: baseY - 30, depth: baseY + 4, phase: rnd() * TAU });
  }

  /* монстры */
  const spawns = [];
  const addSpawn = (type, x, y) => {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (solid(tx, ty)) return false;
    const wx = tx + 0.5, wy = ty + 0.5;
    if (start && Math.hypot(wx - start.x, wy - start.y) < 8.5) return false;
    if (occupied.some(o => Math.hypot(o.x - wx, o.y - wy) < 1.0)) return false;
    if (spawns.some(s => Math.hypot(s.x - wx, s.y - wy) < 1.0)) return false;
    spawns.push({ type, x: wx, y: wy });
    return true;
  };
  const scatter = (type, count, room, minR = 0, maxR = 0) => {
    const max = maxR || Math.min(room.rx * 0.72, 5.2);
    let placed = 0;
    for (let i = 0; i < 80 && placed < count; i++) {
      const ang = rnd() * TAU;
      const rr = minR + rnd() * (max - minR);
      const x = room.cx + Math.cos(ang) * rr;
      const y = room.cy + Math.sin(ang) * rr * (room.ry / room.rx);
      if (addSpawn(type, x, y)) placed++;
    }
  };

  scatter('fallen', 2, { cx: 22, cy: 40.5, rx: 2.4, ry: 2.0 }, 0, 2.2);
  scatter('fallen', 3, rooms.main);
  scatter('shaman', 2, rooms.main, 1.8);
  scatter('zombie', 2, rooms.main);
  scatter('zombie', 2, rooms.side);
  scatter('archer', 1, rooms.side, 1.5);
  scatter('zombie', 2, rooms.east);
  scatter('archer', 2, rooms.east, 1.2);
  scatter('shaman', 1, rooms.east, 1.5);
  scatter('zombie', 2, rooms.alcove);
  scatter('shaman', 1, rooms.alcove, 1.4);
  scatter('fallen', 3, rooms.boss, 1.6);
  const bossPos = { x: bx + 0.5, y: by + 0.5 };
  spawns.push({ type: 'boss', x: bossPos.x, y: bossPos.y });

  return {
    seed, grid, rooms, floors, wallsRender, torches, props, chestSpots, spawns, start,
    bossPos, bossRoom, ritual: { x: bossRoom.cx + 0.5, y: bossRoom.cy + 0.5 },
    floorCanvas: null, floorCtx: null,
  };
}

/* ───────────────────────── отрисовка пола (один раз) ───────────────────────── */
function diamondPath(g, mx, my, grow = 0) {
  g.beginPath();
  g.moveTo(mx, my - grow);
  g.lineTo(mx + HW + grow, my + HH);
  g.lineTo(mx, my + TH + grow);
  g.lineTo(mx - HW - grow, my + HH);
  g.closePath();
}
function isoCircle(g, mx, my, r) {
  g.beginPath();
  g.ellipse(mx, my, r * 45.25, r * 22.62, 0, 0, TAU);
}

function paintBloodDecal(g, mx, my, scale, alpha = 0.65) {
  g.save();
  g.globalAlpha = alpha;
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * TAU, r = Math.random() * 13 * scale;
    g.fillStyle = i % 3 === 0 ? '#340c08' : '#4d120c';
    g.beginPath();
    g.ellipse(mx + Math.cos(a) * r, my + Math.sin(a) * r * 0.5, rand(3, 10) * scale, rand(2, 5) * scale, rand(0, TAU), 0, TAU);
    g.fill();
  }
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * TAU, r = 16 + Math.random() * 22;
    g.fillStyle = '#3d0d09';
    g.beginPath();
    g.arc(mx + Math.cos(a) * r * scale, my + Math.sin(a) * r * 0.5 * scale, rand(1, 2.6) * scale, 0, TAU);
    g.fill();
  }
  g.restore();
}

function paintScorch(g, mx, my, r) {
  const grad = g.createRadialGradient(mx, my, 0, mx, my, r);
  grad.addColorStop(0, 'rgba(8,5,3,.55)');
  grad.addColorStop(0.6, 'rgba(10,7,4,.3)');
  grad.addColorStop(1, 'rgba(10,7,4,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(mx, my, r * 1.5, r * 0.8, 0, 0, TAU);
  g.fill();
}

function buildFloorImage(w) {
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  g.lineJoin = 'round';

  const tones = ['#3d3931', '#39352d', '#35312a', '#312e27', '#2d2b24'];
  for (const [tx, ty] of w.floors) {
    const [mx, my] = toM(tx, ty);
    const near = (w.grid[ty - 1] && w.grid[ty - 1][tx] === 0 ? 0 : 1) + (w.grid[ty + 1] && w.grid[ty + 1][tx] === 0 ? 0 : 1);
    let col = tones[Math.floor(h2(tx, ty, 3) * tones.length)];
    if (near > 0 && h2(tx, ty, 12) > 0.55) col = '#32342b';
    const shade = 1 + (h2(tx, ty, self ? 0 : 7) - 0.5) * 0.08;
    g.fillStyle = col;
    diamondPath(g, mx, my, 0.7);
    g.fill();
    if (shade > 1.01) {
      g.fillStyle = 'rgba(255,244,218,.018)';
      diamondPath(g, mx, my, 0.2);
      g.fill();
    }

    /* микротекстура */
    if (h2(tx, ty, 21) > 0.5) {
      for (let i = 0; i < 3; i++) {
        const a = h2(tx, ty, 30 + i) * TAU;
        const rr = h2(tx, ty, 40 + i) * 20;
        g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,240,210,.025)';
        g.beginPath();
        g.ellipse(mx + Math.cos(a) * rr, my + HH + Math.sin(a) * rr * 0.5, 1.6 + rr * 0.08, 0.9 + rr * 0.03, a, 0, TAU);
        g.fill();
      }
    }

    /* тёмный стык со стеной */
    g.strokeStyle = 'rgba(0,0,0,.28)';
    g.lineWidth = 5;
    const T = [mx, my], R = [mx + HW, my + HH], B = [mx, my + TH], L = [mx - HW, my + HH];
    const line = (a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    if (w.grid[ty - 1] && w.grid[ty - 1][tx] === 1) line(T, R);
    if (w.grid[ty + 1] && w.grid[ty + 1][tx] === 1) line(B, L);
    if (w.grid[ty][tx - 1] === 1) line(L, T);
    if (w.grid[ty][tx + 1] === 1) line(R, B);
  }

  /* мягкие тени от стен — рисуем в уменьшенном буфере и растягиваем (дешевле blur) */
  const sc = document.createElement('canvas');
  sc.width = Math.max(1, Math.ceil(FW / 4));
  sc.height = Math.max(1, Math.ceil(FH / 4));
  const sg = sc.getContext('2d');
  sg.scale(0.25, 0.25);
  sg.fillStyle = 'rgba(0,0,0,.5)';
  for (let y = 2; y < MH - 2; y++) {
    for (let x = 2; x < MW - 2; x++) {
      if (w.grid[y][x] !== 1) continue;
      let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (w.grid[y + dy] && w.grid[y + dy][x + dx] === 0) { edge = true; break; }
      }
      if (!edge) continue;
      const [mx, my] = toM(x, y);
      diamondPath(sg, mx, my + 8, 6);
      sg.fill();
    }
  }
  g.imageSmoothingEnabled = true;
  g.drawImage(sc, 0, 0, FW, FH);

  /* трещины и мелкий сор */
  for (const [tx, ty] of w.floors) {
    const [mx, my] = toM(tx, ty);
    const n = h2(tx, ty, 51);
    if (n > 0.78) {
      g.strokeStyle = 'rgba(0,0,0,.24)';
      g.lineWidth = 1.1;
      g.beginPath();
      const x0 = mx + (h2(tx, ty, 52) - 0.5) * 28;
      const y0 = my + 6 + h2(tx, ty, 53) * 20;
      g.moveTo(x0, y0);
      g.lineTo(x0 + 7, y0 + 4);
      g.lineTo(x0 + 13, y0 + 2);
      g.lineTo(x0 + 19, y0 + 7);
      g.stroke();
    }
    if (n < 0.16) {
      g.fillStyle = 'rgba(180,168,140,.12)';
      g.beginPath();
      g.ellipse(mx + (h2(tx, ty, 54) - 0.5) * 30, my + 8 + h2(tx, ty, 55) * 18, 2.2, 1.2, 0.4, 0, TAU);
      g.fill();
    }
    /* мох у стен */
    if (n > 0.55) {
      const nearWall = (w.grid[ty - 1] && w.grid[ty - 1][tx] === 1) || (w.grid[ty][tx - 1] === 1) || (w.grid[ty][tx + 1] === 1);
      if (nearWall) {
        g.fillStyle = 'rgba(73,92,55,.25)';
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.arc(mx + (h2(tx, ty, 60 + i) - 0.5) * 38, my + 6 + h2(tx, ty, 70 + i) * 22, 2 + h2(tx, ty, 80 + i) * 4, 0, TAU);
          g.fill();
        }
      }
    }
  }

  /* лужи */
  for (let i = 0; i < 16; i++) {
    const t = w.floors[Math.floor(h2(i, 3, 91) * w.floors.length)];
    if (!t) continue;
    const [mx, my] = toM(t[0], t[1]);
    const rx = 13 + h2(i, 6, 92) * 26, ry = rx * (0.36 + h2(i, 8, 93) * 0.12);
    const grd = g.createRadialGradient(mx, my + HH, 2, mx, my + HH, rx);
    grd.addColorStop(0, 'rgba(15,28,30,.55)');
    grd.addColorStop(0.8, 'rgba(17,27,29,.35)');
    grd.addColorStop(1, 'rgba(17,27,29,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(mx, my + HH, rx, ry, 0, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(150,190,190,.07)';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(mx - 2, my + HH - 2, rx * 0.55, ry * 0.4, -0.2, Math.PI, Math.PI * 1.8);
    g.stroke();
  }

  /* кости */
  for (let i = 0; i < 34; i++) {
    const t = w.floors[Math.floor(h2(i, 17, 101) * w.floors.length)];
    if (!t) continue;
    const [mx, my] = toM(t[0], t[1]);
    const x = mx + (h2(i, 19, 102) - 0.5) * 24;
    const y = my + 8 + h2(i, 23, 103) * 18;
    g.save();
    g.globalAlpha = 0.42;
    g.strokeStyle = '#b7ab8d';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(x - 7, y + 2); g.lineTo(x + 6, y - 2);
    g.moveTo(x - 5, y - 2); g.lineTo(x + 4, y + 3);
    g.stroke();
    if (i % 3 === 0) {
      g.fillStyle = '#b9ad90';
      g.beginPath(); g.arc(x + 8, y, 3.6, 0, TAU); g.fill();
      g.fillStyle = 'rgba(20,16,12,.8)';
      g.beginPath(); g.arc(x + 7, y - 0.6, 0.9, 0, TAU); g.arc(x + 9.4, y - 0.6, 0.9, 0, TAU); g.fill();
    }
    g.restore();
  }

  /* кровь */
  for (let i = 0; i < 8; i++) {
    const room = i < 4 ? w.bossRoom : w.rooms.main;
    const tx = Math.floor(room.cx + (h2(i, 31, 111) - 0.5) * room.rx * 1.2);
    const ty = Math.floor(room.cy + (h2(i, 37, 112) - 0.5) * room.ry * 1.2);
    if (w.grid[ty] && w.grid[ty][tx] === 0) {
      const [mx, my] = toM(tx, ty);
      paintBloodDecal(g, mx, my + HH, 0.9 + h2(i, 41, 113) * 0.7, 0.42);
    }
  }

  /* ритуальный круг */
  const [rx0, ry0] = toM(w.ritual.x - 0.5, w.ritual.y - 0.5);
  g.save();
  g.translate(rx0, ry0 + HH);
  g.strokeStyle = 'rgba(128,47,30,.55)';
  g.lineWidth = 2.4;
  g.beginPath(); g.ellipse(0, 0, 3.3 * 45.25, 3.3 * 22.6, 0, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(128,47,30,.3)';
  g.lineWidth = 1.2;
  g.beginPath(); g.ellipse(0, 0, 2.55 * 45.25, 2.55 * 22.6, 0, 0, TAU); g.stroke();
  g.beginPath(); g.ellipse(0, 0, 1.2 * 45.25, 1.2 * 22.6, 0, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(160,80,48,.42)';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const x = Math.cos(a) * 2.95 * 45.25, y = Math.sin(a) * 2.95 * 22.6;
    g.beginPath();
    g.moveTo(x - 4, y - 5); g.lineTo(x + 2, y); g.lineTo(x - 3, y + 5);
    g.stroke();
  }
  g.fillStyle = 'rgba(100,32,20,.22)';
  g.beginPath(); g.ellipse(0, 0, 1.1 * 45.25, 1.1 * 22.6, 0, 0, TAU); g.fill();
  g.restore();

  /* редкие светящиеся грибы */
  for (let i = 0; i < 18; i++) {
    const t = w.floors[Math.floor(h2(i, 51, 121) * w.floors.length)];
    if (!t) continue;
    const [mx, my] = toM(t[0], t[1]);
    const x = mx + (h2(i, 53, 122) - 0.5) * 20;
    const y = my + 10 + h2(i, 59, 123) * 12;
    g.fillStyle = 'rgba(90,160,150,.5)';
    g.beginPath(); g.arc(x, y, 1.5 + h2(i, 61, 124) * 1.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(120,220,205,.15)';
    g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
  }

  w.floorCanvas = c;
  w.floorCtx = g;
}

/* ───────────────────────── камни стен (спрайты) ───────────────────────── */
const WALL_SPRITES = [];
function buildWallSprites() {
  for (let v = 0; v < 6; v++) {
    const c = document.createElement('canvas');
    c.width = 72; c.height = 92;
    const g = c.getContext('2d');
    const T = [36, 8], R = [68, 24], B = [36, 40], L = [4, 24];
    const Bb = [36, 86], Rb = [68, 70], Lb = [4, 70];

    /* левая грань */
    let grd = g.createLinearGradient(4, 24, 36, 86);
    grd.addColorStop(0, v === 2 ? '#443b2c' : '#3c3529');
    grd.addColorStop(1, '#241f18');
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(...L); g.lineTo(...B); g.lineTo(...Bb); g.lineTo(...Lb); g.closePath(); g.fill();

    /* правая грань */
    grd = g.createLinearGradient(36, 40, 68, 86);
    grd.addColorStop(0, '#29241c');
    grd.addColorStop(1, '#15120e');
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(...B); g.lineTo(...R); g.lineTo(...Rb); g.lineTo(...Bb); g.closePath(); g.fill();

    /* верх */
    grd = g.createLinearGradient(36, 8, 36, 40);
    grd.addColorStop(0, v === 4 ? '#615849' : '#575042');
    grd.addColorStop(1, '#37322a');
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(...T); g.lineTo(...R); g.lineTo(...B); g.lineTo(...L); g.closePath(); g.fill();

    /* рёбра */
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(...L); g.lineTo(...B); g.lineTo(...R); g.stroke();
    g.strokeStyle = 'rgba(200,182,140,.14)';
    g.beginPath(); g.moveTo(...T); g.lineTo(...R); g.moveTo(...T); g.lineTo(...L); g.stroke();

    /* трещины */
    g.strokeStyle = 'rgba(0,0,0,.32)';
    g.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = 8 + h2(v, i, 5) * 52;
      const y = 34 + h2(v, i, 6) * 38;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (h2(v, i, 7) - 0.5) * 10, y + 8);
      g.lineTo(x + (h2(v, i, 8) - 0.5) * 12, y + 17);
      g.stroke();
    }

    /* мох и крошка */
    for (let i = 0; i < 7; i++) {
      g.fillStyle = `rgba(${74 + i * 3},${92 + i * 2},${55 + i * 2},.2)`;
      g.beginPath();
      g.arc(6 + h2(v, i, 11) * 56, 14 + h2(v, i, 12) * 20, 2 + h2(v, i, 13) * 4, 0, TAU);
      g.fill();
    }
    for (let i = 0; i < 22; i++) {
      g.fillStyle = i % 2 ? 'rgba(0,0,0,.16)' : 'rgba(230,210,170,.06)';
      g.beginPath();
      g.arc(4 + h2(v, i, 14) * 60, 12 + h2(v, i, 15) * 65, 0.6 + h2(v, i, 16) * 1.6, 0, TAU);
      g.fill();
    }
    WALL_SPRITES.push(c);
  }
}

/* ───────────────────────── игрок и характеристики ───────────────────────── */
function makePlayer(start) {
  const p = {
    x: start.x, y: start.y, r: 0.28, speed: WALK_SPEED,
    level: 1, xp: 0, xpNext: 200,
    life: 100, maxLife: 100, mana: 70, maxMana: 70,
    dmgBonus: 0, armor: 0, gearLife: 0, gearMana: 0,
    path: [], pathI: 0, dest: null, walkPhase: 0, moving: false,
    face: 1, cds: { ice: 0, fire: 0, bolt: 0, nova: 0 }, castAnim: 0,
    hurtT: 0, potionCdHp: 0, potionCdMp: 0, dead: false,
  };
  state.player = p;
  recalcStats(false);
  p.life = p.maxLife; p.mana = p.maxMana;
  return p;
}

function recalcStats(adjust) {
  const p = state.player;
  if (!p) return;
  const eq = state.inv.equip;
  let dmg = 0, armor = 0, life = 0, mana = 0;
  for (const slot of ['weapon', 'armor', 'charm', 'ring1', 'ring2']) {
    const it = eq[slot];
    if (!it) continue;
    if (it.stats.dmg) dmg += it.stats.dmg;
    if (it.stats.armor) armor += it.stats.armor;
    if (it.stats.life) life += it.stats.life;
    if (it.stats.mana) mana += it.stats.mana;
  }
  const oldMaxL = p.maxLife, oldMaxM = p.maxMana;
  p.dmgBonus = dmg; p.armor = armor; p.gearLife = life; p.gearMana = mana;
  p.maxLife = 84 + (p.level - 1) * 16 + life;
  p.maxMana = 58 + (p.level - 1) * 12 + mana;
  if (adjust) {
    const dl = p.maxLife - oldMaxL, dm = p.maxMana - oldMaxM;
    if (dl > 0) p.life += dl;
    if (dm > 0) p.mana += dm;
  }
  p.life = clamp(p.life, 1, p.maxLife);
  p.mana = clamp(p.mana, 0, p.maxMana);
}

function playerPower() {
  const p = state.player;
  return (1 + (p.level - 1) * 0.13) * (1 + p.dmgBonus / 100);
}

/* ───────────────────────── враги ───────────────────────── */
function spawnEnemy(type, x, y) {
  const def = ENEMY_DEFS[type];
  const e = {
    id: ++enemyId, type, def, x, y,
    hp: def.hp, maxHp: def.hp, r: def.radius, speed: def.speed,
    aggro: false, atkCd: rand(0.2, 0.9), windup: 0, attackKind: null,
    slowT: 0, freezeT: 0, hitT: 0, anim: rand(0, 10), face: 1,
    dead: false, fade: 1, boss: !!def.boss,
    special: rand(4, 6), summon1: false, summon2: false, avoidT: 0, avoidSign: 1,
    roarT: 0,
  };
  state.enemies.push(e);
  if (e.boss) state.boss = e;
  return e;
}

/* ───────────────────────── предметы ───────────────────────── */
function rollRarity(bonus = 0) {
  const r = Math.random() * 100 + bonus;
  if (r > 98.2) return 'unique';
  if (r > 86) return 'rare';
  if (r > 55) return 'magic';
  return 'common';
}

function makeItem(rarity) {
  const types = ['weapon', 'armor', 'charm', 'ring', 'ring'];
  const type = pick(types);
  const tier = { common: 0, magic: 1, rare: 2, unique: 3 }[rarity];
  const base = pick(ITEM_BASES[type] || ITEM_BASES.charm);
  const stats = {};
  if (type === 'weapon') {
    stats.dmg = 4 + tier * 11 + randi(0, 4);
    if (tier >= 2) stats.mana = 5 + tier * 7 + randi(0, 5);
  } else if (type === 'armor') {
    stats.armor = 2 + tier * 4 + randi(0, 3);
    if (tier >= 1) stats.life = 6 + tier * 11 + randi(0, 8);
  } else if (type === 'ring') {
    if (Math.random() < 0.5) stats.life = 4 + tier * 9 + randi(0, 7);
    else stats.mana = 4 + tier * 8 + randi(0, 6);
    if (tier >= 1 && !stats.life) stats.life = 3 + tier * 7;
    if (tier >= 1 && !stats.mana) stats.mana = 3 + tier * 6;
  } else {
    stats.life = 5 + tier * 10 + randi(0, 8);
    stats.mana = 4 + tier * 8 + randi(0, 6);
  }
  if (tier >= 2 && !stats.life) stats.life = 8 + tier * 9 + randi(0, 6);
  if (tier >= 2 && !stats.mana) stats.mana = 6 + tier * 6 + randi(0, 5);
  const name = rarity === 'common' ? base : `${base} «${pick(EPITHETS)}»`;
  return { id: ++itemId, type, rarity, name, icon: type, stats, tier };
}

function lootSpot(x, y) {
  if (!circleSolid(x, y, 0.2)) return { x, y };
  for (let r = 0.4; r < 4; r += 0.4) {
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * TAU;
      const nx = x + Math.cos(ang) * r, ny = y + Math.sin(ang) * r;
      if (!circleSolid(nx, ny, 0.2)) return { x: nx, y: ny };
    }
  }
  return { x, y };
}

function dropGold(x, y, amount) {
  const s = lootSpot(x, y);
  state.loot.push({ kind: 'gold', x: s.x + rand(-0.18, 0.18), y: s.y + rand(-0.18, 0.18), amount, t: rand(0, 9), picked: false });
}
function dropPotion(x, y, kind) {
  const s = lootSpot(x, y);
  state.loot.push({ kind: 'potion', potion: kind, x: s.x + rand(-0.2, 0.2), y: s.y + rand(-0.2, 0.2), t: rand(0, 9), picked: false });
}
function dropItem(x, y, item) {
  const s = lootSpot(x, y);
  state.loot.push({ kind: 'item', item, x: s.x, y: s.y, t: rand(0, 9), picked: false });
}

function dropEnemyLoot(e) {
  if (e.boss) {
    dropGold(e.x, e.y, randi(260, 380));
    dropPotion(e.x - 0.4, e.y + 0.2, 'hp');
    dropPotion(e.x + 0.4, e.y + 0.2, 'mp');
    const r1 = rollRarity(46), r2 = rollRarity(36);
    dropItem(e.x - 0.3, e.y - 0.5, makeItem(r1));
    dropItem(e.x + 0.45, e.y - 0.2, makeItem(r2));
    return;
  }
  if (Math.random() < 0.76) dropGold(e.x, e.y, e.type === 'zombie' ? randi(18, 48) : randi(8, 32));
  if (Math.random() < 0.17) dropPotion(e.x, e.y, Math.random() < 0.5 ? 'hp' : 'mp');
  if (Math.random() < 0.115) dropItem(e.x, e.y, makeItem(rollRarity(e.type === 'shaman' ? 10 : 0)));
}

function pickupLoot(l) {
  const p = state.player;
  if (l.kind === 'gold') {
    state.gold += l.amount;
    state.goldEarned += l.amount;
    addText(l.x, l.y, `+${l.amount}`, '#d8bb72', 12);
    AudioSys.play('coin');
  } else if (l.kind === 'potion') {
    if (state.potions[l.potion] >= 9) {
      addText(p.x, p.y - 0.7, 'Зелий уже достаточно', '#9c8f77', 12);
      return false;
    }
    state.potions[l.potion]++;
    toast(l.potion === 'hp' ? 'Зелье здоровья +1' : 'Зелье маны +1', l.potion === 'hp' ? 'bad' : 'magic');
    addText(l.x, l.y, '+1', l.potion === 'hp' ? '#ff7a66' : '#7db4ff', 12);
    AudioSys.play('potion');
  } else if (l.kind === 'item') {
    if (!addItem(l.item)) {
      addText(p.x, p.y - 0.7, 'Сумка полна', '#d1a05b', 13);
      AudioSys.play('empty');
      return false;
    }
    AudioSys.play('loot');
    toast(`Найдено: ${l.item.name}`, RARITY[l.item.rarity].cls);
  }
  l.picked = true;
  return true;
}

/* ───────────────────────── частицы, текст, эффекты ───────────────────────── */
function spawnParticles(x, y, count, opt = {}) {
  const colors = opt.colors || ['#ffb46b', '#ff7a33'];
  for (let i = 0; i < count; i++) {
    const a = opt.angle !== undefined ? opt.angle + rand(-0.7, 0.7) : rand(0, TAU);
    const sp = opt.speed !== undefined ? rand(opt.speed * 0.35, opt.speed) : rand(0.4, 2.2);
    state.particles.push({
      id: ++particleId,
      x: x + rand(-0.12, 0.12), y: y + rand(-0.12, 0.12),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      rise: opt.rise !== undefined ? rand(0, opt.rise) : 0,
      rv: opt.rise !== undefined ? rand(opt.rise * 0.5, opt.rise) : 0,
      size: rand(opt.size ? opt.size * 0.5 : 1.2, opt.size || 2.6),
      color: pick(colors),
      life: rand((opt.life || 0.6) * 0.55, opt.life || 0.6),
      t: 0, add: opt.add !== false, drag: opt.drag !== undefined ? opt.drag : 1.6,
    });
  }
}
function addText(x, y, text, color = '#f2e7ca', size = 13) {
  state.texts.push({ x, y, text, color, size, t: 0, life: 0.95, crit: size > 15 });
}
function addEffect(eff) {
  eff.t = 0;
  state.effects.push(eff);
}

/* ───────────────────────── урон ───────────────────────── */
function spellRoll(base) {
  let d = rand(base[0], base[1]) * playerPower();
  const crit = Math.random() < 0.09;
  if (crit) d *= 1.8;
  return { dmg: Math.max(1, Math.round(d)), crit };
}

function damageEnemy(e, amount, color = '#f2e7ca', crit = false) {
  if (!e || e.dead) return;
  const dmg = Math.max(1, Math.round(amount));
  e.hp -= dmg;
  e.hitT = 0.16;
  e.aggro = true;
  addText(e.x, e.y - 0.25 * (e.def.scale || 1), (crit ? '✶ ' : '') + dmg, crit ? '#ffd77a' : color, crit ? 17 : 13);
  spawnParticles(e.x, e.y - 0.15, crit ? 9 : 4, { colors: ['#8d1d12', '#5e100a'], speed: 1.6, life: 0.42, add: false, size: 2 });
  AudioSys.play('hit');
  if (e.hp <= 0) killEnemy(e);
}

function damagePlayer(amount) {
  const p = state.player;
  if (!p || p.dead || state.scene !== 'play') return;
  const reduce = p.armor / (p.armor + 55);
  const dmg = Math.max(1, Math.round(amount * (1 - reduce)));
  p.life -= dmg;
  p.hurtT = 0.4;
  state.hurtFlash = 0.5;
  state.shake = Math.max(state.shake, 5.5);
  addText(p.x, p.y - 0.9, `−${dmg}`, '#ff705a', 15);
  spawnParticles(p.x, p.y - 0.3, 7, { colors: ['#8d1d12', '#4d0b07'], speed: 1.8, life: 0.5, add: false });
  AudioSys.play('hurt');
  if (p.life <= 0) {
    p.life = 0;
    playerDie();
  }
}

function playerDie() {
  const p = state.player;
  if (p.dead) return;
  p.dead = true;
  p.path = [];
  state.scene = 'dead';
  state.deathTimer = 0;
  state.pending = null;
  state.shake = 9;
  AudioSys.play('death');
  spawnParticles(p.x, p.y - 0.3, 26, { colors: ['#7c1710', '#3f0805', '#1c0302'], speed: 2.6, life: 1.1, add: false, size: 3 });
  paintBloodDecal(world.floorCtx, ...toM(p.x, p.y), 1.2, 0.55);
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  e.fade = 1;
  e.windup = 0;
  state.kills++;
  const p = state.player;
  const xp = e.def.xp;
  gainXp(xp);
  dropEnemyLoot(e);
  const [mx, my] = toM(e.x, e.y);
  paintBloodDecal(world.floorCtx, mx, my, e.boss ? 2 : 0.9, e.boss ? 0.7 : 0.5);
  if (e.boss) {
    state.bossDead = true;
    state.shake = 12;
    state.flash = 0.35;
    state.flashColor = '255,120,50';
    AudioSys.play('boom');
    spawnParticles(e.x, e.y - 0.4, 50, { colors: ['#ffb15a', '#ff6a24', '#7a1a0d'], speed: 3.4, life: 1.2, size: 3.4 });
    addEffect({ kind: 'explosion', x: e.x, y: e.y, r: 2.2, color: '255,120,40', dur: 0.7 });
    toast('Кровавый Рог пал', 'rare');
    if (world && !state.portal) {
      state.portal = { x: e.x + 0.4, y: e.y - 0.2, active: true, t: 0 };
      state.portalT = 0;
      toast('Появился портал в следующее логово', 'rare');
    }
  } else {
    AudioSys.play('hit');
    spawnParticles(e.x, e.y - 0.2, 10, { colors: ['#7c1710', '#3f0805'], speed: 2, life: 0.6, add: false, size: 2.2 });
  }
  updateQuestCount();
  const alive = state.enemies.some(en => !en.dead);
  if (!alive && state.bossDead && state.scene === 'play' && state.winTimer <= 0) {
    state.winTimer = 0;
  }
}

function gainXp(n) {
  const p = state.player;
  p.xp += n;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = Math.round(200 * Math.pow(1.72, p.level - 1));
    const oldMax = p.maxLife;
    recalcStats(true);
    p.life = clamp(p.life + (p.maxLife - oldMax) + p.maxLife * 0.3, 1, p.maxLife);
    p.mana = p.maxMana;
    addEffect({ kind: 'levelup', x: p.x, y: p.y, dur: 1.1 });
    spawnParticles(p.x, p.y - 0.5, 30, { colors: ['#ffdf9b', '#d9ad55', '#fff2cb'], speed: 2.2, life: 1, add: true, size: 2.4, rise: 100 });
    toast(`Уровень ${p.level}`, 'rare');
    AudioSys.play('level');
    state.flash = 0.12;
    state.flashColor = '255,220,150';
  }
  updateHUD(true);
}

/* ───────────────────────── магия ───────────────────────── */
function castSkill(idx, tx, ty, silent = false) {
  const p = state.player;
  if (!p || state.scene !== 'play' || p.dead) return false;
  const s = SKILLS[idx];
  if (!s) return false;
  if (p.cds[s.id] > 0) return false;
  if (p.mana < s.mana) {
    if (!silent && state.clock > state.noManaT) {
      state.noManaT = state.clock + 1.1;
      addText(p.x, p.y - 0.85, 'Мало маны', '#82b5f2', 13);
      AudioSys.play('empty');
    }
    return false;
  }
  p.mana -= s.mana;
  p.cds[s.id] = s.cd;
  p.castAnim = 0.34;
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  p.face = (dx - dy) < 0 ? -1 : 1;
  state.pending = null;

  if (s.id === 'ice') {
    const r = spellRoll(s.base);
    state.projectiles.push({
      kind: 'ice', x: p.x, y: p.y - 0.05, vx: ux * 10.5, vy: uy * 10.5,
      r: 0.2, dmg: r.dmg, crit: r.crit, life: 1.45, from: 'player', slow: 2.2, trail: 0,
    });
    spawnParticles(p.x + ux * 0.3, p.y + uy * 0.3, 5, { colors: ['#bcecff', '#5fb6e8'], speed: 1.2, life: 0.3, size: 1.8, angle: Math.atan2(uy, ux), rise: 20 });
    AudioSys.play('ice');
    return true;
  }

  if (s.id === 'fire') {
    const r = spellRoll(s.base);
    state.projectiles.push({
      kind: 'fire', x: p.x, y: p.y - 0.05, vx: ux * 8.6, vy: uy * 8.6,
      r: 0.3, dmg: r.dmg, crit: r.crit, life: 1.55, from: 'player', trail: 0,
    });
    spawnParticles(p.x + ux * 0.3, p.y + uy * 0.3, 7, { colors: ['#ffc06a', '#ff7a2f'], speed: 1.3, life: 0.35, angle: Math.atan2(uy, ux), size: 2.4, rise: 30 });
    AudioSys.play('fire');
    return true;
  }

  if (s.id === 'bolt') {
    const alive = state.enemies.filter(e => !e.dead);
    let start = null, best = 6.5;
    for (const e of alive) {
      const dd = Math.hypot(e.x - tx, e.y - ty);
      if (dd < best) { best = dd; start = e; }
    }
    const segs = [];
    let fx = p.x, fy = p.y - 0.4;
    if (!start) {
      const hx = p.x + ux * Math.min(d, 5), hy = p.y + uy * Math.min(d, 5);
      segs.push([[fx, fy], [hx, hy]]);
    } else {
      const chain = [start];
      let cur = start;
      while (chain.length < 4) {
        let next = null, nd = 3.4;
        for (const e of alive) {
          if (e.dead || chain.includes(e)) continue;
          const dd = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (dd < nd) { nd = dd; next = e; }
        }
        if (!next) break;
        chain.push(next);
        cur = next;
      }
      let prevX = fx, prevY = fy;
      chain.forEach((e, i) => {
        const r = spellRoll(s.base);
        const mult = [1, 0.72, 0.52, 0.4][i] || 0.35;
        damageEnemy(e, r.dmg * mult, '#d7e8ff', r.crit);
        spawnParticles(e.x, e.y - 0.3, 7, { colors: ['#d7ecff', '#7fb8ff'], speed: 2.2, life: 0.4, size: 1.8, add: true });
        segs.push([[prevX, prevY], [e.x, e.y - 0.3], true]);
        prevX = e.x; prevY = e.y - 0.3;
      });
    }
    state.effects.push({ kind: 'lightning', segs, dur: 0.3, t: 0 });
    state.shake = Math.max(state.shake, 3);
    state.flash = 0.08;
    state.flashColor = '170,210,255';
    AudioSys.play('bolt');
    return true;
  }

  if (s.id === 'nova') {
    const r = spellRoll(s.base);
    for (const e of state.enemies) {
      if (e.dead) continue;
      const dd = Math.hypot(e.x - p.x, e.y - p.y);
      if (dd <= 3.05) {
        damageEnemy(e, r.dmg, '#bceeff', r.crit);
        e.slowT = Math.max(e.slowT, 2.6);
        e.freezeT = Math.max(e.freezeT, e.boss ? 0.45 : 1.2);
      }
    }
    addEffect({ kind: 'nova', x: p.x, y: p.y, dur: 0.62 });
    spawnParticles(p.x, p.y, 28, { colors: ['#c8f0ff', '#6db8e8', '#ffffff'], speed: 3.2, life: 0.7, size: 2, add: true, rise: 10 });
    AudioSys.play('nova');
    return true;
  }
  return false;
}

function explode(x, y, radius, dmg, crit) {
  for (const e of state.enemies) {
    if (e.dead) continue;
    const dd = Math.hypot(e.x - x, e.y - y);
    if (dd > radius) continue;
    const falloff = 1 - 0.45 * (dd / radius);
    damageEnemy(e, dmg * falloff, '#ffd0a0', crit);
  }
  addEffect({ kind: 'explosion', x, y, r: radius, color: '255,140,60', dur: 0.46 });
  spawnParticles(x, y, 22, { colors: ['#ffc46e', '#ff7a2f', '#a82a0c'], speed: 3.2, life: 0.7, size: 3, rise: 40 });
  const [mx, my] = toM(x, y);
  paintScorch(world.floorCtx, mx, my, radius * 26);
  state.shake = Math.max(state.shake, 6);
  AudioSys.play('boom');
}

/* ───────────────────────── снаряды ───────────────────────── */
function enemyShot(e, kind, dmgRange, speed, fanAngle = 0) {
  const p = state.player;
  let ang = Math.atan2(p.y - e.y, p.x - e.x) + fanAngle;
  const color = kind === 'arrow' ? '#d8c9a4' : kind === 'fire' ? '#ff9a45' : '#b06bff';
  let vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed;
  state.projectiles.push({
    kind, x: e.x, y: e.y - 0.35, vx, vy, r: kind === 'fire' ? 0.34 : 0.2,
    dmg: Math.round(rand(dmgRange[0], dmgRange[1])), life: 2.6, from: 'enemy', trail: 0,
  });
  spawnParticles(e.x, e.y - 0.35, 4, { colors: [color, '#ffffff'], speed: 0.8, life: 0.25, size: 1.6, rise: 20 });
}

function updateProjectiles(dt) {
  const p = state.player;
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const pr = state.projectiles[i];
    pr.life -= dt;
    if (pr.life <= 0) {
      if (pr.kind === 'fire' && pr.from === 'player') explode(pr.x, pr.y, 1.3, pr.dmg, pr.crit);
      state.projectiles.splice(i, 1);
      continue;
    }
    pr.trail = (pr.trail || 0) - dt;
    if (pr.trail <= 0) {
      pr.trail = 0.035;
      if (pr.kind === 'fire') spawnParticles(pr.x, pr.y - 0.1, 1, { colors: ['#ff9a45', '#ffc06a'], speed: 0.4, life: 0.35, size: 2.1, rise: 16 });
      else if (pr.kind === 'ice') spawnParticles(pr.x, pr.y - 0.1, 1, { colors: ['#bdeaff', '#6ab9e6'], speed: 0.3, life: 0.28, size: 1.4, rise: 8 });
      else if (pr.kind === 'shadow') spawnParticles(pr.x, pr.y - 0.1, 1, { colors: ['#a56adf', '#6a35a8'], speed: 0.3, life: 0.4, size: 1.6, rise: 10 });
    }

    const nx = pr.x + pr.vx * dt;
    const ny = pr.y + pr.vy * dt;
    if (circleSolid(nx, ny, 0.12)) {
      if (pr.kind === 'fire' && pr.from === 'player') explode(pr.x, pr.y, 1.3, pr.dmg, pr.crit);
      else spawnParticles(pr.x, pr.y - 0.1, 4, { colors: ['#bcecff', '#6a8a99'], speed: 1.1, life: 0.3, size: 1.4 });
      state.projectiles.splice(i, 1);
      continue;
    }
    pr.x = nx; pr.y = ny;

    if (pr.from === 'player') {
      let hit = null;
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.r + pr.r + 0.08) { hit = e; break; }
      }
      if (hit) {
        if (pr.kind === 'fire') {
          explode(pr.x, pr.y, 1.35, pr.dmg, pr.crit);
        } else if (pr.kind === 'ice') {
          damageEnemy(hit, pr.dmg, '#bceeff', pr.crit);
          hit.slowT = Math.max(hit.slowT, pr.slow || 2);
          spawnParticles(pr.x, pr.y, 10, { colors: ['#d8f4ff', '#70bfe8'], speed: 2, life: 0.5, size: 2, add: true });
        }
        state.projectiles.splice(i, 1);
        continue;
      }
    } else {
      if (!p.dead && Math.hypot(p.x - pr.x, p.y - pr.y) < p.r + pr.r + 0.15) {
        damagePlayer(pr.dmg);
        spawnParticles(pr.x, pr.y, 6, { colors: ['#ff9a45', '#7a1a0d'], speed: 1.6, life: 0.4, size: 1.8 });
        state.projectiles.splice(i, 1);
        continue;
      }
    }
  }
}

/* ───────────────────────── сундуки и взаимодействие ───────────────────────── */
function openChest(c) {
  if (c.opened) return;
  c.opened = true;
  AudioSys.play('chest');
  spawnParticles(c.x, c.y - 0.2, 16, { colors: ['#ffd98a', '#d9ad55', '#fff0c4'], speed: 1.6, life: 0.7, size: 2, rise: 40 });
  addEffect({ kind: 'ring', x: c.x, y: c.y, dur: 0.5, color: '201,169,92' });
  dropGold(c.x, c.y + 0.2, randi(45, 120));
  dropItem(c.x, c.y + 0.35, makeItem(rollRarity(16)));
  if (Math.random() < 0.6) dropItem(c.x + 0.3, c.y + 0.3, makeItem(rollRarity(6)));
  if (Math.random() < 0.8) dropPotion(c.x - 0.3, c.y + 0.2, Math.random() < 0.5 ? 'hp' : 'mp');
  toast('Сундук открыт', 'rare');
}

function tryInteract(l) {
  const p = state.player;
  if (l.kind === 'item') {
    if (dist(p.x, p.y, l.x, l.y) < 1.15) {
      if (pickupLoot(l)) state.loot.splice(state.loot.indexOf(l), 1);
    }
  }
}

function updatePending() {
  const pd = state.pending;
  if (!pd) return;
  const p = state.player;
  if (!p || p.dead) { state.pending = null; return; }

  if (pd.type === 'portal') {
    const pr = pd.ref;
    if (!state.portal || state.portal !== pr || !state.portal.active) { state.pending = null; return; }
    if (dist(p.x, p.y, pr.x, pr.y) < 1.15) {
      state.pending = null;
      showPortalPrompt();
      return;
    }
    if (!p.moving && !p.path.length) {
      orderMove(pr.x, pr.y);
    }
    return;
  }

  if (pd.type === 'loot') {
    const l = pd.ref;
    if (!l || l.picked) { state.pending = null; return; }
    if (dist(p.x, p.y, l.x, l.y) < 1.1) {
      if (pickupLoot(l)) state.loot.splice(state.loot.indexOf(l), 1);
      state.pending = null;
    }
  } else if (pd.type === 'chest') {
    const c = pd.ref;
    if (!c || c.opened) { state.pending = null; return; }
    if (dist(p.x, p.y, c.x, c.y) < 1.5) {
      openChest(c);
      state.pending = null;
    }
  }
}

/* ───────────────────────── коллизии и путь ───────────────────────── */
function solidAt(tx, ty) {
  return tx < 0 || ty < 0 || tx >= MW || ty >= MH || !world || world.grid[ty] === undefined || world.grid[ty][tx] === 1;
}
function circleSolid(x, y, r) {
  if (solidAt(Math.floor(x), Math.floor(y))) return true;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    if (solidAt(Math.floor(x + Math.cos(a) * r), Math.floor(y + Math.sin(a) * r))) return true;
  }
  return false;
}
function lineClear(x1, y1, x2, y2, r = 0.22) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.ceil(d / 0.18));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (circleSolid(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r)) return false;
  }
  return true;
}
function slideMove(o, dx, dy) {
  let moved = false;
  if (dx && !circleSolid(o.x + dx, o.y, o.r)) { o.x += dx; moved = true; }
  if (dy && !circleSolid(o.x, o.y + dy, o.r)) { o.y += dy; moved = true; }
  return moved;
}

const pfG = new Float32Array(MW * MH);
const pfFrom = new Int32Array(MW * MH);
const pfClosed = new Uint8Array(MW * MH);
const pfHeap = [];
const PF_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function pfPush(node) {
  pfHeap.push(node);
  let i = pfHeap.length - 1;
  while (i > 0) {
    const par = (i - 1) >> 1;
    if (pfHeap[par].f <= pfHeap[i].f) break;
    const tmp = pfHeap[par]; pfHeap[par] = pfHeap[i]; pfHeap[i] = tmp; i = par;
  }
}
function pfPop() {
  const top = pfHeap[0];
  const last = pfHeap.pop();
  if (pfHeap.length) {
    pfHeap[0] = last;
    let i = 0;
    while (true) {
      const l = i * 2 + 1, r = l + 1;
      let m = i;
      if (l < pfHeap.length && pfHeap[l].f < pfHeap[m].f) m = l;
      if (r < pfHeap.length && pfHeap[r].f < pfHeap[m].f) m = r;
      if (m === i) break;
      const tmp = pfHeap[i]; pfHeap[i] = pfHeap[m]; pfHeap[m] = tmp; i = m;
    }
  }
  return top;
}
function nearestFloor(tx, ty) {
  if (!solidAt(tx, ty)) return [tx, ty];
  for (let r = 1; r <= 10; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + dx, y = ty + dy;
        if (!solidAt(x, y)) return [x, y];
      }
    }
  }
  return null;
}
function findPath(sxc, syc, gxc, gyc) {
  const sx = clamp(Math.floor(sxc), 0, MW - 1), sy = clamp(Math.floor(syc), 0, MH - 1);
  const gx = clamp(Math.floor(gxc), 0, MW - 1), gy = clamp(Math.floor(gyc), 0, MH - 1);
  if (solidAt(gx, gy)) return null;
  pfG.fill(1e9); pfFrom.fill(-1); pfClosed.fill(0);
  pfHeap.length = 0;
  const start = sy * MW + sx, goal = gy * MW + gx;
  pfG[start] = 0;
  pfPush({ i: start, f: Math.hypot(gx - sx, gy - sy) });
  let found = false;
  while (pfHeap.length) {
    const node = pfPop();
    const i = node.i;
    if (pfClosed[i]) continue;
    pfClosed[i] = 1;
    if (i === goal) { found = true; break; }
    const cx = i % MW, cy = (i / MW) | 0;
    for (const [dx, dy] of PF_DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (solidAt(nx, ny)) continue;
      if (dx && dy && (solidAt(cx + dx, cy) || solidAt(cx, cy + dy))) continue;
      const ni = ny * MW + nx;
      if (pfClosed[ni]) continue;
      const cost = pfG[i] + (dx && dy ? 1.4142 : 1);
      if (cost < pfG[ni]) {
        pfG[ni] = cost;
        pfFrom[ni] = i;
        pfPush({ i: ni, f: cost + Math.hypot(gx - nx, gy - ny) });
      }
    }
  }
  if (!found) return null;
  const tiles = [];
  let cur = goal, guard = 0;
  while (cur !== start && guard++ < 9000) {
    tiles.push([cur % MW, (cur / MW) | 0]);
    cur = pfFrom[cur];
    if (cur < 0) return null;
  }
  tiles.reverse();
  const raw = tiles.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
  const out = [];
  let anchor = { x: sxc, y: syc };
  let idx = 0;
  while (idx < raw.length) {
    let far = idx;
    for (let j = raw.length - 1; j >= idx; j--) {
      if (lineClear(anchor.x, anchor.y, raw[j].x, raw[j].y, 0.24)) { far = j; break; }
    }
    out.push(raw[far]);
    anchor = raw[far];
    idx = far + 1;
  }
  return out;
}
function orderMove(x, y) {
  const p = state.player;
  if (!p || p.dead) return;
  let ix = Math.floor(x), iy = Math.floor(y);
  if (solidAt(ix, iy)) {
    const nf = nearestFloor(ix, iy);
    if (!nf) return;
    ix = nf[0]; iy = nf[1];
  }
  const path = findPath(p.x, p.y, ix + 0.5, iy + 0.5);
  if (path && path.length) {
    p.path = path;
    p.pathI = 0;
    p.dest = path[path.length - 1];
    p.moving = true;
  }
}

/* ───────────────────────── игрок ───────────────────────── */
function updatePlayer(dt) {
  const p = state.player;
  if (!p || p.dead) return;
  for (const k in p.cds) p.cds[k] = Math.max(0, p.cds[k] - dt);
  p.potionCdHp = Math.max(0, p.potionCdHp - dt);
  p.potionCdMp = Math.max(0, p.potionCdMp - dt);
  p.castAnim = Math.max(0, p.castAnim - dt);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.mana = clamp(p.mana + 4.6 * dt, 0, p.maxMana);
  p.life = clamp(p.life + 0.5 * dt, 0, p.maxLife);

  let vx = 0, vy = 0;
  let kx = 0, ky = 0;
  if (state.keys.KeyW || state.keys.ArrowUp) { kx -= 1; ky -= 1; }
  if (state.keys.KeyS || state.keys.ArrowDown) { kx += 1; ky += 1; }
  if (state.keys.KeyA || state.keys.ArrowLeft) { kx -= 1; ky += 1; }
  if (state.keys.KeyD || state.keys.ArrowRight) { kx += 1; ky -= 1; }
  if (kx || ky) {
    const l = Math.hypot(kx, ky);
    vx = (kx / l) * p.speed;
    vy = (ky / l) * p.speed;
    p.path = []; p.dest = null; p.moving = true;
  } else if (p.path.length) {
    const t = p.path[p.pathI];
    if (!t) { p.path = []; p.dest = null; p.moving = false; }
    else {
      const dx = t.x - p.x, dy = t.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.16) {
        p.pathI++;
        if (p.pathI >= p.path.length) { p.path = []; p.dest = null; p.moving = false; }
      } else {
        vx = (dx / d) * p.speed;
        vy = (dy / d) * p.speed;
        p.moving = true;
      }
    }
  } else {
    p.moving = false;
  }
  if (vx || vy) {
    p.walkPhase += dt * 9.5;
    const moved = slideMove(p, vx * dt, vy * dt);
    if (!moved) p.walkPhase += dt * 2;
    p.face = (vx - vy) < 0 ? -1 : 1;
  } else {
    p.walkPhase += dt * 1.6;
  }
  if (state.mouse.left && state.attackTarget) {
    const e = state.attackTarget;
    if (!e || e.dead) state.attackTarget = null;
    else {
      aimAt(e.x, e.y);
      castSkill(state.selected, e.x, e.y, true);
    }
  }
  if (state.mouse.left && state.mouse.leftMove && state.clock - state.lastOrder > 0.16) {
    state.lastOrder = state.clock;
    const [tx, ty] = screenToTile(state.mouse.x, state.mouse.y);
    state.pending = null;
    orderMove(tx, ty);
  }
  if (state.mouse.right) {
    const [tx, ty] = screenToTile(state.mouse.x, state.mouse.y);
    castSkill(state.selected, tx, ty, true);
  }
  updatePending();
}

/* ───────────────────────── ИИ врагов ───────────────────────── */
function startEnemyAttack(e, kind) {
  if (e.atkCd > 0 || e.dead) return;
  e.windup = e.def.windup + rand(0, 0.12);
  e.attackKind = kind;
  e.atkCd = e.def.atkCd;
}

function finishEnemyAttack(e) {
  const p = state.player;
  if (e.dead || !p || p.dead) { e.attackKind = null; return; }
  const dd = dist(e.x, e.y, p.x, p.y);
  if (e.attackKind === 'melee') {
    if (dd < e.def.range + 0.8) {
      damagePlayer(rand(e.def.dmg[0], e.def.dmg[1]));
      spawnParticles(p.x, p.y - 0.3, 5, { colors: ['#8d1d12', '#4a0805'], speed: 1.4, life: 0.4, size: 1.8, add: false });
    }
  } else if (e.attackKind === 'ranged') {
    if (lineClear(e.x, e.y, p.x, p.y, 0.18)) enemyShot(e, e.def.proj, e.def.projDmg, e.def.projSpeed);
  }
  e.attackKind = null;
}

function bossFan(e) {
  const p = state.player;
  const baseAng = Math.atan2(p.y - e.y, p.x - e.x);
  for (let i = -2; i <= 2; i++) {
    const off = i * 0.2;
    // временно подменяем угол через fanAngle
    enemyShot(e, 'fire', [9, 14], 5.8, off);
  }
  spawnParticles(e.x, e.y - 0.9, 20, { colors: ['#ffb45e', '#ff6a24'], speed: 2, life: 0.6, size: 2.6, rise: 40 });
  AudioSys.play('fire');
  state.shake = Math.max(state.shake, 3.5);
}

function summonWave(e, count) {
  let made = 0;
  for (let i = 0; i < 14 && made < count; i++) {
    const a = rand(0, TAU), r = rand(1.6, 3.2);
    const x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r;
    if (circleSolid(x, y, 0.3)) continue;
    const add = spawnEnemy('fallen', x, y);
    add.aggro = true;
    made++;
    spawnParticles(x, y - 0.2, 8, { colors: ['#b06bff', '#4a1a6c'], speed: 1.4, life: 0.6, size: 2, rise: 30, add: true });
  }
  if (made) {
    toast('Кровавый Рог зовёт стаю', 'bad');
    AudioSys.play('boss');
    updateQuestCount();
  }
}

function updateEnemies(dt) {
  const p = state.player;
  if (!p) return;
  for (const e of state.enemies) {
    if (e.dead) { e.fade -= dt * 1.7; continue; }
    e.anim += dt;
    e.hitT = Math.max(0, e.hitT - dt);
    e.atkCd = Math.max(0, e.atkCd - dt);
    e.slowT = Math.max(0, e.slowT - dt);
    e.freezeT = Math.max(0, e.freezeT - dt);

    const dx = p.x - e.x, dy = p.y - e.y;
    const dd = Math.hypot(dx, dy) || 0.0001;
    const ux = dx / dd, uy = dy / dd;

    if (!e.aggro && dd < e.def.aggro) {
      e.aggro = true;
      if (e.boss) {
        AudioSys.play('boss');
        state.shake = Math.max(state.shake, 7);
        addEffect({ kind: 'ring', x: e.x, y: e.y, dur: 0.9, color: '190,50,30' });
        toast('Кровавый Рог пробудился', 'bad');
      }
    }
    if (!e.aggro) continue;
    e.face = (dx - dy) < 0 ? -1 : 1;

    if (e.freezeT > 0) continue;

    if (e.boss) {
      e.special -= dt;
      if (e.special <= 0 && dd < 13) {
        bossFan(e);
        e.special = rand(6.5, 8.5);
      }
      if (e.hp < e.maxHp * 0.66 && !e.summon1) { e.summon1 = true; summonWave(e, 2); }
      if (e.hp < e.maxHp * 0.33 && !e.summon2) { e.summon2 = true; summonWave(e, 3); bossFan(e); }
      if (e.hp < e.maxHp * 0.4) {
        e.speed = e.def.speed * 1.22;
      }
    }

    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) finishEnemyAttack(e);
      continue;
    }

    if (e.def.ranged) {
      const los = lineClear(e.x, e.y, p.x, p.y, 0.18);
      if (dd > 6.4) moveEnemy(e, ux, uy, dt);
      else if (dd < 2.6) moveEnemy(e, -ux, -uy, dt);
      else if (Math.random() < 0.01) moveEnemy(e, ux, uy, dt);
      if (e.atkCd <= 0 && los && dd < 8.5) startEnemyAttack(e, 'ranged');
    } else {
      if (dd <= e.def.range + 0.1 && lineClear(e.x, e.y, p.x, p.y, 0.18)) {
        if (e.atkCd <= 0) startEnemyAttack(e, 'melee');
      } else {
        moveEnemy(e, ux, uy, dt);
      }
    }
  }
  state.enemies = state.enemies.filter(e => !e.dead || e.fade > 0);
}

function moveEnemy(e, ux, uy, dt) {
  let sx = 0, sy = 0;
  for (const o of state.enemies) {
    if (o === e || o.dead) continue;
    const dx = e.x - o.x, dy = e.y - o.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 0.0001 && d2 < 1.2) {
      const d = Math.sqrt(d2);
      const push = (1.1 - d) * 0.9;
      sx += (dx / d) * push;
      sy += (dy / d) * push;
    }
  }
  const sp = e.speed * (e.slowT > 0 ? 0.45 : 1);
  const mx = (ux * sp + sx * 1.6) * dt;
  const my = (uy * sp + sy * 1.6) * dt;
  const moved = slideMove(e, mx, my);
  if (!moved) {
    e.avoidT = 0.45;
    e.avoidSign = Math.random() < 0.5 ? -1 : 1;
  }
  if (e.avoidT > 0) {
    e.avoidT -= dt;
    const ax = -uy * e.avoidSign, ay = ux * e.avoidSign;
    slideMove(e, ax * sp * dt, ay * sp * dt);
  }
}

/* ───────────────────────── обновления ───────────────────────── */
function updateLoot(dt) {
  const p = state.player;
  if (!p || p.dead) return;
  for (let i = state.loot.length - 1; i >= 0; i--) {
    const l = state.loot[i];
    if (l.picked) { state.loot.splice(i, 1); continue; }
    l.t += dt;
    if (l.kind !== 'item') {
      const d = Math.hypot(p.x - l.x, p.y - l.y);
      if (d < 2.4 && d > 0.01) {
        const pull = Math.min(1, (2.4 - d) * 1.6) * dt * 3.2;
        l.x += (p.x - l.x) * pull;
        l.y += (p.y - l.y) * pull;
      }
      if (d < 0.9) {
        if (pickupLoot(l)) state.loot.splice(i, 1);
      }
    }
  }
}

function updateEffects(dt) {
  for (let i = state.effects.length - 1; i >= 0; i--) {
    const e = state.effects[i];
    e.t += dt;
    if (e.t >= e.dur) state.effects.splice(i, 1);
  }
}
function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.t += dt;
    if (p.t >= p.life) { state.particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rise += p.rv * dt;
    const damp = Math.exp(-p.drag * dt);
    p.vx *= damp; p.vy *= damp;
  }
}
function updateTexts(dt) {
  for (let i = state.texts.length - 1; i >= 0; i--) {
    const t = state.texts[i];
    t.t += dt;
    if (t.t >= t.life) state.texts.splice(i, 1);
  }
}
function updateCamera(dt) {
  const p = state.player;
  if (!p) return;
  const [mx, my] = toM(p.x, p.y);
  const k = 1 - Math.exp(-7.5 * dt);
  state.camera.x += (mx - state.camera.x) * k;
  state.camera.y += (my - 12 - state.camera.y) * k;
  clampCamera();
  state.shake *= Math.exp(-7 * dt);
  if (state.shake < 0.05) state.shake = 0;
  state.camera.shakeX = (Math.random() - 0.5) * state.shake * 1.7;
  state.camera.shakeY = (Math.random() - 0.5) * state.shake * 1.7;
  state.flash = Math.max(0, state.flash - dt * 2.2);
  state.hurtFlash = Math.max(0, state.hurtFlash - dt * 2.4);
}

function updateAmbientFX(dt) {
  if (!world) return;
  for (const prop of world.props) {
    if (prop.type === 'chest') continue;
    prop.fxT = (prop.fxT || 0) - dt;
    if (prop.fxT <= 0) {
      prop.fxT = rand(0.12, 0.4);
      spawnParticles(prop.x + rand(-0.1, 0.1), prop.y - 0.1, 1, {
        colors: prop.type === 'campfire' ? ['#ffb463', '#ff7a2d', '#ffe0a0'] : ['#ff9b4a', '#ffcf7d'],
        speed: 0.25, life: rand(0.5, 1.1), size: rand(1, 2.2), rise: rand(26, 60), add: true, drag: 0.4,
      });
    }
  }
  state.ambientT -= dt;
  if (state.ambientT <= 0) {
    state.ambientT = rand(5, 10);
    if (state.scene === 'play' || state.scene === 'menu') AudioSys.drip();
  }
}

function revealMap() {
  if (!world || !world.explored) return;
  const p = state.player;
  if (!p) return;
  const cx = Math.floor(p.x), cy = Math.floor(p.y);
  const R = 8;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R + 2) continue;
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
      if (world.grid[y][x] === 0) world.explored[y * MW + x] = 1;
    }
  }
}
function drawMinimap() {
  if (!world) return;
  const S = 150 / MW;
  mmx.clearRect(0, 0, 150, 150);
  mmx.fillStyle = '#090806';
  mmx.fillRect(0, 0, 150, 150);
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (!world.explored[y * MW + x]) continue;
      if (world.grid[y][x] === 0) {
        mmx.fillStyle = h2(x, y, 5) > 0.5 ? '#484237' : '#413c32';
        mmx.fillRect(x * S, y * S, S + 0.35, S + 0.35);
      }
    }
  }
  /* ориентиры */
  if (world.explored[Math.floor(world.start.y) * MW + Math.floor(world.start.x)]) {
    mmx.fillStyle = 'rgba(224,180,90,.55)';
    mmx.beginPath(); mmx.arc(world.start.x * S, world.start.y * S, 2, 0, TAU); mmx.fill();
  }
  const boss = state.boss;
  if (boss && !boss.dead) {
    const bx = Math.floor(boss.x), by = Math.floor(boss.y);
    if (world.explored[by * MW + bx]) {
      mmx.fillStyle = 'rgba(192,58,38,.9)';
      mmx.beginPath(); mmx.arc(boss.x * S, boss.y * S, 2.4, 0, TAU); mmx.fill();
    }
  }
  for (const c of state.chests) {
    if (c.opened) continue;
    const tx = Math.floor(c.x), ty = Math.floor(c.y);
    if (world.explored[ty * MW + tx]) {
      mmx.fillStyle = 'rgba(201,169,92,.85)';
      mmx.fillRect(c.x * S - 1.2, c.y * S - 1.2, 2.4, 2.4);
    }
  }
  const p = state.player;
  if (p) {
    mmx.fillStyle = '#f1ddb0';
    mmx.beginPath(); mmx.arc(p.x * S, p.y * S, 2.6, 0, TAU); mmx.fill();
    mmx.strokeStyle = 'rgba(241,221,176,.4)';
    mmx.lineWidth = 1;
    mmx.beginPath(); mmx.arc(p.x * S, p.y * S, 4.5, 0, TAU); mmx.stroke();
  }
  mmx.strokeStyle = 'rgba(201,169,92,.16)';
  mmx.strokeRect(0.5, 0.5, 149, 149);
}
function updateMinimap(dt) {
  if (state.scene === 'paused') return;
  state.revealT -= dt;
  if (state.revealT <= 0) {
    state.revealT = 0.16;
    if (state.scene === 'play') revealMap();
    drawMinimap();
  }
}

/* ───────────────────────── интерфейс ───────────────────────── */
let toastId = 0;
function toast(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.textContent = text;
  el.dataset.id = ++toastId;
  dom.toasts.appendChild(el);
  while (dom.toasts.children.length > 4) dom.toasts.removeChild(dom.toasts.firstChild);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2900);
}

function updateQuestCount() {
  const alive = state.enemies.filter(e => !e.dead).length;
  cacheText(dom.questCount, alive);
}

function updateHUD(force) {
  const p = state.player;
  if (!p) return;
  const hp = clamp(p.life / p.maxLife, 0, 1);
  const mp = clamp(p.mana / p.maxMana, 0, 1);
  dom.lifeFill.style.height = (hp * 100).toFixed(1) + '%';
  dom.manaFill.style.height = (mp * 100).toFixed(1) + '%';
  cacheText(dom.lifeVal, Math.ceil(p.life));
  cacheText(dom.manaVal, Math.floor(p.mana));
  cacheText(dom.lvlBadge, p.level);
  dom.xpFill.style.width = (clamp(p.xp / p.xpNext, 0, 1) * 100).toFixed(1) + '%';
  cacheText(dom.xpText, `${Math.floor(p.xp)} / ${p.xpNext}`);
  cacheText(dom.hpCount, state.potions.hp);
  cacheText(dom.mpCount, state.potions.mp);
  cacheText(dom.goldVal, state.gold);
  dom.potionHp.classList.toggle('empty', state.potions.hp <= 0);
  dom.potionMp.classList.toggle('empty', state.potions.mp <= 0);

  for (let i = 0; i < SKILLS.length; i++) {
    const s = SKILLS[i];
    const btn = dom.skills.children[i];
    if (!btn) continue;
    const cd = p.cds[s.id] || 0;
    const cooling = cd > 0.02;
    btn.classList.toggle('cooling', cooling);
    btn.classList.toggle('no-mana', p.mana < s.mana);
    btn.classList.toggle('active', state.selected === i);
    const fill = btn.querySelector('.sk-cd');
    if (fill) {
      const deg = cooling ? (1 - cd / s.cd) * 360 : 360;
      fill.style.background = cooling
        ? `conic-gradient(rgba(0,0,0,.74) ${deg}deg, rgba(0,0,0,0) ${deg}deg)`
        : 'none';
    }
  }

  const boss = state.boss;
  if (boss && !boss.dead && boss.aggro && state.scene === 'play') {
    dom.bossbar.classList.remove('hidden');
    dom.bossFill.style.width = (clamp(boss.hp / boss.maxHp, 0, 1) * 100).toFixed(1) + '%';
  } else {
    dom.bossbar.classList.add('hidden');
  }
}

function buildSkillUI() {
  dom.skills.innerHTML = '';
  SKILLS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'skill' + (i === state.selected ? ' active' : '');
    b.dataset.i = i;
    b.style.setProperty('--accent', s.color);
    b.setAttribute('aria-label', s.name);
    b.innerHTML = `
      <span class="sk-key">${i + 1}</span>
      <span class="sk-ico">${ICONS[s.icon]}</span>
      <span class="sk-cost">${s.mana}</span>
      <span class="sk-cd"></span>`;
    b.addEventListener('click', () => selectSkill(i));
    b.addEventListener('mouseenter', () => {
      showTooltip(`<div class="t-kicker">Заклинание</div><div class="t-name" style="color:${s.color}">${s.name}</div>
        <div class="t-type">Мана ${s.mana} · перезарядка ${s.cd.toFixed(2)} с</div>
        <div class="t-stat">${s.desc}</div>
        <div class="t-stat"><b>Урон:</b> ${Math.round(s.base[0])}–${Math.round(s.base[1])} · растёт с уровнем и посохом</div>
        <div class="t-hint">ПКМ — применить. Клавиша ${i + 1} — выбрать.</div>`);
    });
    b.addEventListener('mouseleave', hideTooltip);
    dom.skills.appendChild(b);
  });
}

function selectSkill(i) {
  state.selected = clamp(i, 0, SKILLS.length - 1);
  AudioSys.play('click');
  updateHUD();
}

/* ───────────────────────── предметы и сумка ───────────────────────── */
const INV_MAX = 16;
function itemIcon(item) { return ICONS[item.icon] || ICONS.charm; }

function rarityClass(r) {
  return r === 'magic' ? 'rarity-magic' : r === 'rare' ? 'rarity-rare' : r === 'unique' ? 'rarity-unique' : '';
}

function statLines(item) {
  const out = [];
  const s = item.stats;
  if (s.dmg) out.push(`<div class="t-stat fire"><b>+${s.dmg}%</b> к урону заклинаний</div>`);
  if (s.armor) out.push(`<div class="t-stat"><b>+${s.armor}</b> к броне</div>`);
  if (s.life) out.push(`<div class="t-stat life"><b>+${s.life}</b> к запасу жизни</div>`);
  if (s.mana) out.push(`<div class="t-stat mana"><b>+${s.mana}</b> к запасу маны</div>`);
  return out.join('') || '<div class="t-stat">Без свойств</div>';
}

function statLines(item) {
  const lines = [];
  const s = item.stats || {};
  if (s.dmg) lines.push(`<div><span>Урон</span><b>+${s.dmg}</b></div>`);
  if (s.armor) lines.push(`<div><span>Броня</span><b>+${s.armor}</b></div>`);
  if (s.life) lines.push(`<div><span>К максимуму жизни</span><b>+${s.life}</b></div>`);
  if (s.mana) lines.push(`<div><span>К максимуму маны</span><b>+${s.mana}</b></div>`);
  if (!lines.length) lines.push(`<div><span>Свойства</span><b>—</b></div>`);
  return `<div class="t-stats">${lines.join('')}</div>`;
}

function compareLine(label, val, cur) {
  if (val == null && cur == null) return '';
  const v = val || 0, c = cur || 0;
  if (v === c) return `<div class="t-cmp"><span>${label}</span><b class="n">${v >= 0 ? '+' + v : v}</b></div>`;
  if (v > c) return `<div class="t-cmp"><span>${label}</span><b class="g">+${v} (${v - c >= 0 ? '+' + (v-c) : (v-c)})</b></div>`;
  return `<div class="t-cmp"><span>${label}</span><b class="r">+${v} (${v-c})</b></div>`;
}

function itemTooltipHTML(item, ground = false) {
  const r = RARITY[item.rarity];
  let hint = ground
    ? '<div class="t-hint">Клик — подойти и подобрать</div>'
    : state.inv.equip[item.type] && state.inv.equip[item.type].id === item.id
      ? '<div class="t-eq">Надето · клик, чтобы снять</div>'
      : '<div class="t-hint">Клик — надеть</div>';
  // check if equipped elsewhere? for rings show differently
  if (item.type === 'ring' && !ground) {
    const eq = state.inv.equip;
    if ((eq.ring1 && eq.ring1.id === item.id) || (eq.ring2 && eq.ring2.id === item.id)) {
      hint = '<div class="t-eq">Надето · клик, чтобы снять</div>';
    } else {
      hint = '<div class="t-hint">Клик — надеть (на свободное кольцо)</div>';
    }
  }
  let cmp = '';
  if (!ground && state.inv && state.inv.open) {
    let cur = null;
    if (item.type === 'ring') {
      cur = state.inv.equip.ring1 || state.inv.equip.ring2;
    } else if (state.inv.equip[item.type]) {
      cur = state.inv.equip[item.type];
    }
    if (cur && cur.id !== item.id) {
      cmp = `<div class="t-line"></div><div class="t-cmp-head">Сравнение</div>` +
        compareLine('Урон', item.stats?.dmg, cur.stats?.dmg) +
        compareLine('Броня', item.stats?.armor, cur.stats?.armor) +
        compareLine('Жизнь', item.stats?.life, cur.stats?.life) +
        compareLine('Мана', item.stats?.mana, cur.stats?.mana);
    }
  }
  return `<div class="t-kicker">${r.label} предмет</div>
    <div class="t-name">${item.name}</div>
    <div class="t-type">${ITEM_TYPES[item.type] || item.type}</div>
    <div class="t-line"></div>
    ${statLines(item)}
    ${cmp}
    <div class="t-bind">
      ${hint}
    </div>`;
}

function showTooltip(html) {
  dom.tooltip.innerHTML = html;
  dom.tooltip.classList.remove('hidden');
  positionTooltip();
}
function positionTooltip() {
  const m = state.mouse;
  const w = dom.tooltip.offsetWidth || 285, h = dom.tooltip.offsetHeight || 140;
  let x = m.x + 18, y = m.y - h * 0.4;
  if (x + w > CW - 10) x = m.x - w - 18;
  y = clamp(y, 10, CH - h - 10);
  dom.tooltip.style.left = Math.round(x) + 'px';
  dom.tooltip.style.top = Math.round(y) + 'px';
}
function hideTooltip() { dom.tooltip.classList.add('hidden'); }

function renderInventory() {
  const inv = state.inv;
  /* экипировка */
  dom.equipSlots.forEach(slotEl => {
    const slot = slotEl.dataset.slot;
    const it = inv.equip[slot];
    const art = slotEl.querySelector('.slot-art');
    slotEl.classList.toggle('filled', !!it);
    slotEl.classList.remove('magic', 'rare', 'unique');
    if (it) slotEl.classList.add(it.rarity);
    let iconKey = slot;
    if (slot === 'ring1' || slot === 'ring2') iconKey = 'ring';
    else if (slot === 'charm') iconKey = 'charm';
    art.innerHTML = it ? itemIcon(it) : (ICONS[iconKey] || ICONS.charm);
  });
  /* характеристики */
  const p = state.player;
  if (p) {
    dom.gearStats.textContent =
      `Урон +${Math.round(p.dmgBonus)}% · Броня ${Math.round(p.armor)} · Жизнь +${Math.round(p.gearLife)} · Мана +${Math.round(p.gearMana)}`;
  }
  /* сумка */
  cacheText(dom.invCount, `${inv.slots.length} / ${INV_MAX}`);
  dom.invGrid.innerHTML = '';
  for (let i = 0; i < INV_MAX; i++) {
    const it = inv.slots[i];
    const d = document.createElement('div');
    d.className = 'slot' + (it ? ' ' + rarityClass(it.rarity) : '');
    if (it) {
      d.dataset.id = it.id;
      d.innerHTML = `<span class="slot-rarity"></span>${itemIcon(it)}`;
      d.addEventListener('mouseenter', () => { showTooltip(itemTooltipHTML(it)); d._tt = true; });
      d.addEventListener('mouseleave', () => { hideTooltip(); d._tt = false; });
      d.addEventListener('click', () => equipItem(it.id));
    }
    dom.invGrid.appendChild(d);
  }
  if (inv.newLoot) {
    dom.bagNotif.classList.remove('hidden');
  } else {
    dom.bagNotif.classList.add('hidden');
  }
}

function addItem(item) {
  if (state.inv.slots.length >= INV_MAX) return false;
  state.inv.slots.push(item);
  state.inv.newLoot = true;
  if (item.rarity === 'unique') state.uniquesFound++;
  renderInventory();
  return true;
}

function equipItem(id) {
  const inv = state.inv;
  const idx = inv.slots.findIndex(it => it.id === id);
  if (idx < 0) return;
  const item = inv.slots[idx];
  let slot = item.type;
  if (item.type === 'ring') {
    if (!inv.equip.ring1) slot = 'ring1';
    else if (!inv.equip.ring2) slot = 'ring2';
    else slot = 'ring1';
  }
  const old = inv.equip[slot];
  inv.slots.splice(idx, 1);
  inv.equip[slot] = item;
  if (old) inv.slots.push(old);
  recalcStats(true);
  AudioSys.play('click');
  renderInventory();
  updateHUD();
  toast(`Надето: ${item.name}`, RARITY[item.rarity].cls);
}

function unequipItem(slot) {
  const inv = state.inv;
  const item = inv.equip[slot];
  if (!item) return;
  if (inv.slots.length >= INV_MAX) {
    toast('Сумка полна — некуда снять', 'bad');
    AudioSys.play('empty');
    return;
  }
  inv.equip[slot] = null;
  inv.slots.push(item);
  recalcStats(true);
  AudioSys.play('click');
  renderInventory();
  updateHUD();
}

function usePotion(kind) {
  const p = state.player;
  if (!p || p.dead || state.scene !== 'play') return;
  const cdKey = kind === 'hp' ? 'potionCdHp' : 'potionCdMp';
  if (p[cdKey] > 0) return;
  if (state.potions[kind] <= 0) {
    toast('Зелий нет', 'bad');
    AudioSys.play('empty');
    return;
  }
  if (kind === 'hp' && p.life >= p.maxLife - 0.5) { toast('Жизнь полна'); return; }
  if (kind === 'mp' && p.mana >= p.maxMana - 0.5) { toast('Мана полна'); return; }
  state.potions[kind]--;
  p[cdKey] = 0.35;
  if (kind === 'hp') {
    const heal = Math.round(p.maxLife * 0.55 + 12);
    p.life = clamp(p.life + heal, 0, p.maxLife);
    addText(p.x, p.y - 0.85, `+${heal}`, '#8ce89a', 15);
    addEffect({ kind: 'ring', x: p.x, y: p.y, dur: 0.5, color: '150,60,50' });
  } else {
    const gain = Math.round(p.maxMana * 0.62 + 10);
    p.mana = clamp(p.mana + gain, 0, p.maxMana);
    addText(p.x, p.y - 0.85, `+${gain}`, '#7db4ff', 15);
    addEffect({ kind: 'ring', x: p.x, y: p.y, dur: 0.5, color: '70,120,210' });
  }
  spawnParticles(p.x, p.y - 0.3, 14, {
    colors: kind === 'hp' ? ['#e06650', '#8ce89a'] : ['#6fa8e8', '#bcecff'],
    speed: 1.6, life: 0.6, size: 2, rise: 40, add: true,
  });
  AudioSys.play('potion');
  updateHUD();
}

/* ───────────────────────── поиск цели под курсором ───────────────────────── */
function pickTarget(sx, sy) {
  const [mx, my] = screenToMap(sx, sy);
  if (state.portal && state.portal.active) {
    const [px, py] = toM(state.portal.x, state.portal.y);
    const d = Math.hypot(px - mx, py - 8 - my);
    if (d < 28) return { kind: 'portal', ref: state.portal };
  }
  let best = null, bestD = 26;
  for (const e of state.enemies) {
    if (e.dead) continue;
    const [ex, ey] = toM(e.x, e.y);
    const h = 26 * (e.def.scale || 1);
    const d = Math.hypot(ex - mx, ey - (my - h * 0.55)) - 10 * (e.def.scale || 1);
    if (d < bestD) { bestD = d; best = { kind: 'enemy', ref: e }; }
  }
  if (best) return best;
  for (const c of state.chests) {
    if (c.opened) continue;
    const [cx, cy] = toM(c.x, c.y);
    const d = Math.hypot(cx - mx, cy - 8 - my);
    if (d < 24) return { kind: 'chest', ref: c };
  }
  let lootBest = null, lootD = 22;
  for (const l of state.loot) {
    const [lx, ly] = toM(l.x, l.y);
    const d = Math.hypot(lx - mx, ly - 8 - my);
    if (d < lootD) { lootD = d; lootBest = l; }
  }
  if (lootBest) return { kind: 'loot', ref: lootBest };
  return null;
}

function aimAt(x, y) {
  const p = state.player;
  if (!p) return;
  const dx = x - p.x, dy = y - p.y;
  if (Math.abs(dx) + Math.abs(dy) > 0.05) p.face = (dx - dy) < 0 ? -1 : 1;
}

function leftAction(sx, sy) {
  const p = state.player;
  if (!p || p.dead || state.scene !== 'play') return 'none';
  const t = pickTarget(sx, sy);
  if (t && t.kind === 'enemy') {
    aimAt(t.ref.x, t.ref.y);
    state.attackTarget = t.ref;
    state.pending = null;
    castSkill(state.selected, t.ref.x, t.ref.y, true);
    return 'attack';
  }
  state.attackTarget = null;
  if (t && t.kind === 'portal') {
    const pr = t.ref;
    const d = Math.hypot(p.x - pr.x, p.y - pr.y);
    if (d < 1.2) {
      state.pending = null;
      showPortalPrompt();
      return 'portal';
    }
    state.pending = { type: 'portal', ref: pr };
    orderMove(pr.x, pr.y);
    return 'portal';
  }
  if (t && t.kind === 'loot') {
    state.pending = { type: 'loot', ref: t.ref };
    orderMove(t.ref.x, t.ref.y);
    return 'loot';
  }
  if (t && t.kind === 'chest') {
    state.pending = { type: 'chest', ref: t.ref };
    orderMove(t.ref.x, t.ref.y);
    return 'chest';
  }
  state.pending = null;
  const [tx, ty] = screenToTile(sx, sy);
  aimAt(tx, ty);
  orderMove(tx, ty);
  return 'move';
}

/* ───────────────────────── новый забег / смерть / победа ───────────────────────── */
function newRun(seed) {
  seed = (seed === undefined || seed === null) ? (Math.random() * 2147483647) | 0 : seed;
  state.seed = seed;
  world = makeWorld(seed);
  buildFloorImage(world);
  world.explored = new Uint8Array(MW * MH);
  world.wallsRender.sort((a, b) => a.sortY - b.sortY);
  world.floorsRender = world.floors.slice();

  state.scene = 'play';
  state.started = true;
  state.runStart = state.clock;
  state.kills = 0;
  state.gold = 0;
  state.goldEarned = 0;
  state.uniquesFound = 0;
  state.bossDead = false;
  state.winTimer = 0;
  state.deathTimer = 0;
  state.shake = 0;
  state.flash = 0;
  state.hurtFlash = 0;
  state.pending = null;
  state.attackTarget = null;
  state.boss = null;
  state.selected = 0;
  state.enemies = [];
  state.projectiles = [];
  state.particles = [];
  state.texts = [];
  state.loot = [];
  state.effects = [];
  state.chests = world.chestSpots.map(c => ({ x: c.x, y: c.y, opened: false, lid: 0 }));
  state.inv.slots = [];
  state.inv.equip = { weapon: null, armor: null, charm: null, ring1: null, ring2: null };
  state.inv.newLoot = false;
  state.potions = { hp: 3, mp: 3 };
  state.hover = { enemy: null, loot: null, chest: null };
  state.portal = null;
  state.portalT = 0;

  makePlayer(world.start);
  for (const s of world.spawns) spawnEnemy(s.type, s.x, s.y);

  buildSkillUI();
  renderInventory();
  updateHUD(true);
  updateQuestCount();
  hideTooltip();
  dom.overlayStart.classList.add('hidden');
  dom.overlayDeath.classList.add('hidden');
  dom.overlayWin.classList.add('hidden');
  dom.overlayPause.classList.add('hidden');
  if (dom.overlayPortal) dom.overlayPortal.classList.add('hidden');
  dom.inventory.classList.add('hidden');
  state.inv.open = false;
  dom.bossbar.classList.add('hidden');

  snapCamera(true);
  revealMap();
  drawMinimap();
  showBanner();
  AudioSys.init();
  toast('Логово зла ждёт', 'rare');
}

function goToNextLevel() {
  if (state.scene !== 'play') return;
  const p = state.player;
  if (!p) return;
  const saved = {
    level: p.level, xp: p.xp, xpNext: p.xpNext,
    maxLife: p.maxLife, maxMana: p.maxMana,
    life: p.life, mana: p.mana,
    gold: state.gold,
    inv: JSON.parse(JSON.stringify(state.inv)),
    potions: { hp: state.potions.hp, mp: state.potions.mp },
  };
  const newSeed = ((state.seed * 131542391) ^ ((Math.random() * 0xffffffff) | 0)) >>> 0;
  world = makeWorld(newSeed);
  buildFloorImage(world);
  world.explored = new Uint8Array(MW * MH);
  world.wallsRender.sort((a, b) => a.sortY - b.sortY);
  world.floorsRender = world.floors.slice();

  state.scene = 'play';
  state.started = true;
  state.runStart = state.clock;
  state.bossDead = false;
  state.winTimer = 0;
  state.deathTimer = 0;
  state.shake = 0;
  state.flash = 0;
  state.hurtFlash = 0;
  state.pending = null;
  state.attackTarget = null;
  state.boss = null;
  state.selected = 0;
  state.enemies = [];
  state.projectiles = [];
  state.particles = [];
  state.texts = [];
  state.loot = [];
  state.effects = [];
  state.chests = world.chestSpots.map(c => ({ x: c.x, y: c.y, opened: false, lid: 0 }));
  state.hover = { enemy: null, loot: null, chest: null };
  state.portal = null;
  state.portalT = 0;

  state.player.x = world.start.x;
  state.player.y = world.start.y;
  state.player.path = [];
  state.player.dest = null;
  state.player.moving = false;
  state.player.cds = { ice: 0, fire: 0, bolt: 0, nova: 0 };
  state.player.hurtT = 0;
  state.player.castAnim = 0;
  state.player.dead = false;
  state.player.level = saved.level;
  state.player.xp = saved.xp;
  state.player.xpNext = saved.xpNext;
  state.player.maxLife = saved.maxLife;
  state.player.maxMana = saved.maxMana;
  state.player.life = Math.min(saved.life, saved.maxLife);
  state.player.mana = Math.min(saved.mana, saved.maxMana);
  state.gold = saved.gold;
  state.inv = JSON.parse(JSON.stringify(saved.inv));
  state.potions = { hp: saved.potions.hp, mp: saved.potions.mp };
  state.seed = newSeed;

  for (const s of world.spawns) spawnEnemy(s.type, s.x, s.y);

  buildSkillUI();
  renderInventory();
  updateHUD(true);
  updateQuestCount();
  hideTooltip();
  dom.overlayStart.classList.add('hidden');
  dom.overlayDeath.classList.add('hidden');
  dom.overlayWin.classList.add('hidden');
  dom.overlayPause.classList.add('hidden');
  if (dom.overlayPortal) dom.overlayPortal.classList.add('hidden');
  dom.inventory.classList.add('hidden');
  state.inv.open = false;
  dom.bossbar.classList.add('hidden');

  snapCamera(true);
  revealMap();
  drawMinimap();
  showBanner();
  toast('Вы спустились глубже', 'rare');
  AudioSys.init();
}

function showBanner() {
  dom.areaBanner.classList.remove('show');
  void dom.areaBanner.offsetWidth;
  dom.areaBanner.classList.add('show');
}

function respawn() {
  const p = state.player;
  if (!p) return;
  const lost = Math.floor(state.gold * 0.2);
  state.gold -= lost;
  state.scene = 'play';
  state.deathTimer = 0;
  state.pending = null;
  state.projectiles = [];
  state.effects = [];
  state.enemies = [];
  state.boss = null;
  for (const s of world.spawns) spawnEnemy(s.type, s.x, s.y);
  p.dead = false;
  state.attackTarget = null;
  p.x = world.start.x;
  p.y = world.start.y;
  p.path = [];
  p.dest = null;
  p.moving = false;
  p.cds = { ice: 0, fire: 0, bolt: 0, nova: 0 };
  p.hurtT = 0;
  p.castAnim = 0;
  recalcStats(true);
  p.life = p.maxLife;
  p.mana = p.maxMana;
  state.hurtFlash = 0;
  state.bossDead = false;
  state.winTimer = 0;
  state.portal = null;
  state.portalT = 0;
  snapCamera(true);
  hideTooltip();
  dom.overlayDeath.classList.add('hidden');
  dom.bossbar.classList.add('hidden');
  if (dom.overlayPortal) dom.overlayPortal.classList.add('hidden');
  updateHUD(true);
  updateQuestCount();
  drawMinimap();
  toast(lost > 0 ? `Потеряно ${lost} золота` : 'Возрождение у входа', 'bad');
}
function showDeathOverlay() {
  const p = state.player;
  dom.deathStats.innerHTML = `
    <div><span>Убито тварей</span><b>${state.kills}</b></div>
    <div><span>Уровень</span><b>${p ? p.level : 1}</b></div>
    <div><span>Золото</span><b>${state.gold}</b></div>
    <div><span>Время</span><b>${fmtTime(state.clock - state.runStart)}</b></div>`;
  dom.overlayDeath.classList.remove('hidden');
  dom.bossbar.classList.add('hidden');
}
function showWinOverlay() {
  const p = state.player;
  dom.winStats.innerHTML = `
    <div><span>Убито тварей</span><b>${state.kills}</b></div>
    <div><span>Уровень</span><b>${p ? p.level : 1}</b></div>
    <div><span>Золото</span><b>${state.goldEarned}</b></div>
    <div><span>Уникальных</span><b>${state.uniquesFound}</b></div>
    <div><span>Время</span><b>${fmtTime(state.clock - state.runStart)}</b></div>
    <div><span>Сложность</span><b>Один забег</b></div>`;
  dom.overlayWin.classList.remove('hidden');
  dom.bossbar.classList.add('hidden');
}

function togglePause(force) {
  if (state.scene === 'menu' || state.scene === 'dead' || state.scene === 'won') return;
  const pause = force !== undefined ? force : state.scene !== 'paused';
  if (pause) {
    state.scene = 'paused';
    dom.overlayPause.classList.remove('hidden');
    hideTooltip();
  } else {
    state.scene = 'play';
    dom.overlayPause.classList.add('hidden');
  }
}

function toggleInventory(force) {
  const inv = state.inv;
  const open = force !== undefined ? force : !inv.open;
  inv.open = open;
  dom.inventory.classList.toggle('hidden', !open);
  if (open) {
    inv.newLoot = false;
    renderInventory();
    hideTooltip();
  } else {
    hideTooltip();
  }
}

function showPortalPrompt() {
  if (!dom.overlayPortal) return;
  if (state.scene === 'dead' || state.scene === 'won') return;
  if (dom.overlayPortal.classList.contains('hidden')) {
    if (state.scene === 'play') {
      state.scene = 'paused';
    } else if (state.scene !== 'paused') {
      return;
    }
    dom.overlayPortal.classList.remove('hidden');
    hideTooltip();
  }
}

function hidePortalPrompt() {
  if (!dom.overlayPortal) return;
  dom.overlayPortal.classList.add('hidden');
  if (state.scene === 'paused') state.scene = 'play';
}

/* ───────────────────────── ввод ───────────────────────── */
function bindUI() {
  window.addEventListener('resize', resize);

  dom.btnStart.addEventListener('click', () => {
    AudioSys.init();
    AudioSys.play('click');
    newRun();
  });
  dom.btnRespawn.addEventListener('click', () => { AudioSys.play('click'); respawn(); });
  dom.btnAgain.addEventListener('click', () => { AudioSys.play('click'); newRun(); });
  dom.btnResume.addEventListener('click', () => { AudioSys.play('click'); togglePause(false); });
  if (dom.btnPortalGo) dom.btnPortalGo.addEventListener('click', () => { AudioSys.play('click'); hidePortalPrompt(); goToNextLevel(); });
  if (dom.btnPortalCancel) dom.btnPortalCancel.addEventListener('click', () => { AudioSys.play('click'); hidePortalPrompt(); });
  dom.btnCloseInv.addEventListener('click', () => { AudioSys.play('click'); toggleInventory(false); });
  dom.btnBag.addEventListener('click', () => { AudioSys.play('click'); toggleInventory(); });
  dom.btnSound.addEventListener('click', () => {
    AudioSys.setMuted(!AudioSys.muted);
    dom.btnSound.classList.toggle('muted', AudioSys.muted);
    if (!AudioSys.muted) AudioSys.play('click');
  });
  dom.potionHp.addEventListener('click', () => usePotion('hp'));
  dom.potionMp.addEventListener('click', () => usePotion('mp'));

  dom.equipSlots.forEach(el => {
    el.addEventListener('click', () => {
      const slot = el.dataset.slot;
      if (state.inv.equip[slot]) {
        unequipItem(slot);
      } else {
        let first;
        if (slot === 'ring1' || slot === 'ring2') {
          first = state.inv.slots.find(it => it.type === 'ring');
        } else {
          first = state.inv.slots.find(it => it.type === slot);
        }
        if (first) equipItem(first.id);
        else toast('Ячейка пуста', 'bad');
      }
    });
    el.addEventListener('mouseenter', () => {
      const it = state.inv.equip[el.dataset.slot];
      if (it) showTooltip(itemTooltipHTML(it));
    });
    el.addEventListener('mouseleave', hideTooltip);
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    if (state.scene !== 'play') return;
    AudioSys.init();
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    state.mouse.x = sx; state.mouse.y = sy;
    if (e.button === 0) {
      state.mouse.left = true;
      state.mouse.leftMove = false;
      const kind = leftAction(sx, sy);
      state.mouse.leftMove = kind === 'move';
    } else if (e.button === 2) {
      state.mouse.right = true;
      const [tx, ty] = screenToTile(sx, sy);
      aimAt(tx, ty);
      castSkill(state.selected, tx, ty, true);
    }
  });
  window.addEventListener('pointerup', e => {
    if (e.button === 0) { state.mouse.left = false; state.mouse.leftMove = false; state.attackTarget = null; }
    if (e.button === 2) state.mouse.right = false;
  });
  window.addEventListener('pointercancel', () => { state.mouse.left = false; state.mouse.leftMove = false; state.mouse.right = false; state.attackTarget = null; });

  canvas.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
    state.mouse.over = true;
    if (state.scene === 'play') {
      const t = pickTarget(state.mouse.x, state.mouse.y);
      if (t) {
        if (t.kind === 'enemy') { state.hover.enemy = t.ref; state.hover.loot = null; state.hover.chest = null; state.tooltipKind = 'enemy'; hideTooltip(); }
        else if (t.kind === 'loot') { state.hover.loot = t.ref; state.hover.enemy = null; state.hover.chest = null; state.tooltipKind = 'loot'; }
        else if (t.kind === 'portal') { state.hover.enemy = state.hover.loot = state.hover.chest = null; state.tooltipKind = 'portal'; showTooltip(`<div class="t-kicker">Портал</div><div class="t-name">Спуститься глубже</div><div class="t-hint">Клик — перейти на следующий уровень</div>`); }
        else { state.hover.chest = t.ref; state.hover.enemy = null; state.hover.loot = null; state.tooltipKind = 'chest'; hideTooltip(); }
      } else {
        state.hover.enemy = state.hover.loot = state.hover.chest = null; state.tooltipKind = null;
      }
      if (state.hover.loot) {
        const l = state.hover.loot;
        if (l.kind === 'item') showTooltip(itemTooltipHTML(l.item, true));
        else if (l.kind === 'gold') showTooltip(`<div class="t-kicker">Добыча</div><div class="t-name">Золото ×${l.amount}</div><div class="t-hint">Подойдите, чтобы подобрать</div>`);
        else showTooltip(`<div class="t-kicker">Добыча</div><div class="t-name">${l.potion === 'hp' ? 'Зелье здоровья' : 'Зелье маны'}</div><div class="t-hint">Подойдите, чтобы подобрать</div>`);
      } else if (!document.querySelector('#inventory:hover') && !state.tooltipLock && state.tooltipKind !== 'portal') {
        hideTooltip();
      }
    }
  });
  canvas.addEventListener('pointerleave', () => { state.mouse.over = false; });

  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const code = e.code;
    if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3' || code === 'Digit4') {
      const i = Number(code.slice(-1)) - 1;
      if (i < SKILLS.length) { selectSkill(i); e.preventDefault(); }
      return;
    }
    if (code === 'KeyQ') { usePotion('hp'); return; }
    if (code === 'KeyE') { usePotion('mp'); return; }
    if (code === 'KeyI') { toggleInventory(); return; }
    if (code === 'KeyM') {
      AudioSys.init();
      AudioSys.setMuted(!AudioSys.muted);
      dom.btnSound.classList.toggle('muted', AudioSys.muted);
      return;
    }
    if (code === 'Escape') {
      if (state.inv.open) toggleInventory(false);
      else togglePause();
      return;
    }
    if (code === 'Space') {
      if (state.scene === 'play') togglePause(true);
      else if (state.scene === 'paused') togglePause(false);
      e.preventDefault();
      return;
    }
    state.keys[code] = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
      state.pending = null;
    }
  });
  document.addEventListener('keyup', e => {
    state.keys[e.code] = false;
  });
  window.addEventListener('blur', () => {
    state.keys = Object.create(null);
    state.mouse.left = false;
    state.mouse.right = false;
    state.mouse.leftMove = false;
  });
}

/* ───────────────────────── отрисовка: помощники ───────────────────────── */
function ell(g, x, y, rx, ry, color, rot = 0) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, TAU);
  g.fill();
}
function shadowAt(g, x, y, rx, alpha = 0.36) {
  const grd = g.createRadialGradient(x, y, 0, x, y, rx);
  grd.addColorStop(0, `rgba(0,0,0,${alpha})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(x, y, rx, rx * 0.4, 0, 0, TAU);
  g.fill();
}
function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}
function inView(x, y, margin = 180) {
  return x > -margin && x < CW + margin && y > -margin && y < CH + margin;
}
function glowBall(g, x, y, r, inner, outer, alpha = 1) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.globalAlpha = alpha;
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
  g.globalAlpha = 1;
}

/* ───────────────────────── отрисовка: колдунья ───────────────────────── */
function drawPlayer(g, sx, sy) {
  const p = state.player;
  if (!p) return;
  const dead = p.dead;
  const bob = p.moving ? Math.abs(Math.sin(p.walkPhase)) * 2.2 : Math.sin(p.walkPhase * 0.7) * 0.9;
  const lean = p.moving ? Math.sin(p.walkPhase) * 1.4 : 0;
  shadowAt(g, sx, sy, 22);

  g.save();
  g.translate(sx + lean, sy - bob);
  g.scale(p.face, 1);
  if (dead) g.rotate(-0.5);

  /* посох */
  const cast = p.castAnim > 0 ? p.castAnim / 0.34 : 0;
  g.save();
  g.translate(-11, -14);
  g.rotate(-0.06 + cast * -0.28);
  g.strokeStyle = '#3b2a1a';
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, 3);
  g.lineTo(-1, -40);
  g.stroke();
  g.strokeStyle = 'rgba(201,169,92,.55)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(-1, -38);
  g.stroke();
  const orbR = 4.4 + cast * 2.6;
  glowBall(g, -1, -43, orbR * 2.4, 'rgba(140,200,255,.85)', 'rgba(90,150,255,0)', 0.85);
  ell(g, -1, -43, orbR, orbR, '#d9f1ff');
  ell(g, -2, -44, orbR * 0.45, orbR * 0.45, '#ffffff');
  g.restore();

  /* задняя рука */
  g.strokeStyle = '#2a2138';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-5, -26);
  g.lineTo(-12, -18 + Math.sin(p.walkPhase) * 2);
  g.stroke();

  /* плащ */
  const flare = p.moving ? Math.sin(p.walkPhase * 2) * 2.6 : 0;
  poly(g, [[-9, -23], [9, -23], [13 + flare, -2], [7, 1], [-7, 1], [-13 - flare, -2]]);
  g.fillStyle = '#1d1830';
  g.fill();
  poly(g, [[-6, -22], [6, -22], [8 + flare * 0.6, -5], [0, -1], [-8 - flare * 0.6, -5]]);
  g.fillStyle = '#332a4e';
  g.fill();
  /* подол с золотой каймой */
  g.strokeStyle = 'rgba(196,166,96,.6)';
  g.lineWidth = 1.1;
  poly(g, [[-12 - flare, -3], [12 + flare, -3], [7, 0], [-7, 0]]);
  g.stroke();

  /* корсет */
  poly(g, [[-7, -33], [7, -33], [8, -22], [-8, -22]]);
  g.fillStyle = '#241c36';
  g.fill();
  g.strokeStyle = 'rgba(201,169,92,.5)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-5.5, -31); g.lineTo(-6.5, -23);
  g.moveTo(5.5, -31); g.lineTo(6.5, -23);
  g.stroke();

  /* голова и волосы */
  ell(g, 0, -38, 6.2, 7, '#e2c3a4');
  g.fillStyle = '#1a1420';
  g.beginPath();
  g.moveTo(-7.2, -38);
  g.quadraticCurveTo(-8.4, -47, 0, -47.5);
  g.quadraticCurveTo(8.4, -47, 7.2, -38);
  g.quadraticCurveTo(5, -44, 0, -43.5);
  g.quadraticCurveTo(-5, -44, -7.2, -38);
  g.fill();
  /* прядь */
  g.strokeStyle = '#141019';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-6, -36);
  g.quadraticCurveTo(-8, -30, -5.5, -26);
  g.stroke();
  /* глаза */
  ell(g, -2.2, -38, 0.9, 1.2, '#2a1a1a');
  ell(g, 2.2, -38, 0.9, 1.2, '#2a1a1a');

  /* рука с посохом */
  g.strokeStyle = '#2f2740';
  g.lineWidth = 4.6;
  g.beginPath();
  g.moveTo(5, -30);
  g.lineTo(13, -26 + cast * -6);
  g.stroke();
  ell(g, 13.6, -26 + cast * -6, 2, 2, '#dcc0a0');

  g.restore();

  if (p.hurtT > 0) {
    g.globalAlpha = Math.min(0.5, p.hurtT * 1.6);
    ell(g, sx, sy - 26, 16, 24, '#ff5a42');
    g.globalAlpha = 1;
  }
  if (p.life / p.maxLife < 0.3 && !dead) {
    const pulse = 0.25 + Math.sin(state.clock * 4) * 0.12;
    glowBall(g, sx, sy - 24, 30, `rgba(190,30,20,${pulse})`, 'rgba(190,30,20,0)');
  }
}

/* ───────────────────────── отрисовка: монстры ───────────────────────── */
function drawEnemy(g, e, sx, sy) {
  const d = e.def;
  const s = d.scale || 1;
  const t = e.anim;
  const bob = Math.sin(t * 3.4 + e.id) * 1.4 * s;
  const wind = e.windup > 0 ? 1 : 0;
  const frozen = e.freezeT > 0;
  const fade = e.dead ? clamp(e.fade, 0, 1) : 1;
  if (fade <= 0) return;

  g.save();
  g.globalAlpha = fade;
  shadowAt(g, sx, sy, 20 * s, 0.34 * fade);
  g.translate(sx, sy - bob);
  g.scale(e.face, 1);

  if (e.type === 'fallen') {
    g.strokeStyle = '#4a1b15';
    g.lineWidth = 2.4 * s;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-4 * s, -10 * s); g.lineTo(-6 * s, 0);
    g.moveTo(4 * s, -10 * s); g.lineTo(6 * s, 0);
    g.stroke();
    ell(g, 0, -17 * s, 8.6 * s, 9.4 * s, '#6b241b');
    ell(g, -1, -20 * s, 6.4 * s, 5.6 * s, '#7d2c1f');
    /* голова */
    ell(g, 0, -30 * s, 6 * s, 6.4 * s, '#8a3524');
    /* рога */
    g.fillStyle = '#d8c8a8';
    poly(g, [[-5 * s, -34 * s], [-9 * s, -42 * s], [-2.6 * s, -35 * s]]); g.fill();
    poly(g, [[5 * s, -34 * s], [9 * s, -42 * s], [2.6 * s, -35 * s]]); g.fill();
    /* глаза */
    ell(g, -2.4 * s, -30.5 * s, 1.4 * s, 1.5 * s, '#ffd05a');
    ell(g, 2.4 * s, -30.5 * s, 1.4 * s, 1.5 * s, '#ffd05a');
    /* когти */
    g.strokeStyle = '#c9b795';
    g.lineWidth = 1.6 * s;
    g.beginPath();
    g.moveTo(-7 * s, -16 * s + wind * -6); g.lineTo(-12 * s, -13 * s + wind * -9);
    g.moveTo(7 * s, -16 * s + wind * -6); g.lineTo(12 * s, -13 * s + wind * -9);
    g.stroke();
  } else if (e.type === 'shaman') {
    /* посох */
    g.strokeStyle = '#3a2a1c';
    g.lineWidth = 2.4 * s;
    g.beginPath();
    g.moveTo(11 * s, 0);
    g.lineTo(13 * s, -34 * s + wind * -4);
    g.stroke();
    glowBall(g, 13 * s, -35 * s, 9 * s, 'rgba(180,110,255,.9)', 'rgba(140,70,220,0)', 0.8);
    ell(g, 13 * s, -35 * s, 3 * s, 3 * s, '#c9a6ff');
    /* роба */
    poly(g, [[-8 * s, -12 * s], [8 * s, -12 * s], [11 * s, 0], [-11 * s, 0]]);
    g.fillStyle = '#2c2038';
    g.fill();
    poly(g, [[-6 * s, -30 * s], [6 * s, -30 * s], [8 * s, -12 * s], [-8 * s, -12 * s]]);
    g.fillStyle = '#3a2a4c';
    g.fill();
    /* капюшон */
    g.fillStyle = '#241a30';
    g.beginPath();
    g.moveTo(-7 * s, -29 * s);
    g.quadraticCurveTo(-8 * s, -41 * s, 0, -42 * s);
    g.quadraticCurveTo(8 * s, -41 * s, 7 * s, -29 * s);
    g.quadraticCurveTo(0, -33 * s, -7 * s, -29 * s);
    g.fill();
    ell(g, 0, -32 * s, 4.6 * s, 4 * s, '#0b080d');
    ell(g, -1.8 * s, -32 * s, 1.1 * s, 1.2 * s, '#c48aff');
    ell(g, 1.8 * s, -32 * s, 1.1 * s, 1.2 * s, '#c48aff');
    /* ожерелье */
    g.strokeStyle = 'rgba(201,169,92,.55)';
    g.lineWidth = 1.1 * s;
    g.beginPath();
    g.arc(0, -27 * s, 4 * s, 0.2, Math.PI - 0.2);
    g.stroke();
  } else if (e.type === 'zombie') {
    g.strokeStyle = '#4a5140';
    g.lineWidth = 3.4 * s;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-4 * s, -12 * s); g.lineTo(-5 * s, 0);
    g.moveTo(4 * s, -12 * s); g.lineTo(5 * s, 0);
    g.stroke();
    ell(g, 0, -22 * s, 10 * s, 11 * s, '#566049');
    ell(g, -1 * s, -25 * s, 7.4 * s, 7.4 * s, '#646e52');
    /* руки вперёд */
    g.strokeStyle = '#5b654b';
    g.lineWidth = 3 * s;
    g.beginPath();
    g.moveTo(-7 * s, -26 * s);
    g.lineTo(-14 * s, -24 * s + wind * -3);
    g.lineTo(-18 * s, -22 * s + wind * -3);
    g.moveTo(7 * s, -26 * s);
    g.lineTo(14 * s, -24 * s + wind * -3);
    g.lineTo(18 * s, -22 * s + wind * -3);
    g.stroke();
    ell(g, -18.6 * s, -22 * s + wind * -3, 2.2 * s, 2.2 * s, '#6b7559');
    ell(g, 18.6 * s, -22 * s + wind * -3, 2.2 * s, 2.2 * s, '#6b7559');
    /* голова */
    ell(g, 0, -34 * s, 6.4 * s, 6.8 * s, '#78825f');
    g.fillStyle = '#2a2e22';
    g.beginPath();
    g.ellipse(0, -30.6 * s, 3.6 * s, 2.6 * s, 0, 0, TAU);
    g.fill();
    ell(g, -2.2 * s, -35.5 * s, 1.3 * s, 1.4 * s, '#e8e06a');
    ell(g, 2.2 * s, -35.5 * s, 1.3 * s, 1.4 * s, '#e8e06a');
    /* раны */
    g.strokeStyle = 'rgba(110,24,16,.8)';
    g.lineWidth = 1.3 * s;
    g.beginPath();
    g.moveTo(-6 * s, -20 * s); g.lineTo(-2 * s, -24 * s);
    g.moveTo(3 * s, -18 * s); g.lineTo(7 * s, -21 * s);
    g.stroke();
  } else if (e.type === 'archer') {
    g.strokeStyle = '#b6ab8d';
    g.lineWidth = 2.2 * s;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-3.4 * s, -10 * s); g.lineTo(-4.4 * s, 0);
    g.moveTo(3.4 * s, -10 * s); g.lineTo(4.4 * s, 0);
    g.moveTo(-7 * s, -26 * s); g.lineTo(-11 * s, -16 * s);
    g.moveTo(7 * s, -26 * s); g.lineTo(11 * s, -16 * s);
    g.stroke();
    /* рёбра */
    g.lineWidth = 1.8 * s;
    g.beginPath();
    g.moveTo(0, -28 * s); g.lineTo(0, -16 * s);
    for (let i = 0; i < 4; i++) {
      const y = -26 * s + i * 2.6 * s;
      g.moveTo(-5.4 * s, y); g.lineTo(5.4 * s, y + 1.4 * s);
    }
    g.stroke();
    /* череп */
    ell(g, 0, -33 * s, 5.6 * s, 6 * s, '#cdc2a4');
    g.fillStyle = '#2a2318';
    g.beginPath();
    g.ellipse(-2 * s, -34 * s, 1.7 * s, 1.8 * s, 0, 0, TAU);
    g.ellipse(2 * s, -34 * s, 1.7 * s, 1.8 * s, 0, 0, TAU);
    g.fill();
    ell(g, -2 * s, -34 * s, 0.7 * s, 0.7 * s, '#8fe0ff');
    ell(g, 2 * s, -34 * s, 0.7 * s, 0.7 * s, '#8fe0ff');
    g.fillStyle = '#cdc2a4';
    g.fillRect(-2.6 * s, -29.4 * s, 5.2 * s, 1.4 * s);
    /* лук */
    g.strokeStyle = '#6b4b28';
    g.lineWidth = 1.8 * s;
    g.beginPath();
    g.arc(-13 * s, -25 * s, 9 * s, -1.15, 1.15);
    g.stroke();
    g.strokeStyle = 'rgba(230,220,190,.5)';
    g.lineWidth = 0.8 * s;
    const pull = wind * 3 * s;
    g.beginPath();
    g.moveTo(-13 * s + Math.cos(-1.15) * 9 * s, -25 * s + Math.sin(-1.15) * 9 * s);
    g.lineTo(-13 * s + 9 * s - pull, -25 * s);
    g.lineTo(-13 * s + Math.cos(1.15) * 9 * s, -25 * s + Math.sin(1.15) * 9 * s);
    g.stroke();
  } else if (e.type === 'boss') {
    /* аура */
    const pulse = 0.35 + Math.sin(t * 2.2) * 0.15;
    glowBall(g, 0, -32 * s, 52 * s, `rgba(180,34,20,${pulse * 0.35})`, 'rgba(180,34,20,0)');
    /* ноги */
    g.strokeStyle = '#471410';
    g.lineWidth = 6 * s;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-6 * s, -16 * s); g.lineTo(-9 * s, 0);
    g.moveTo(6 * s, -16 * s); g.lineTo(9 * s, 0);
    g.stroke();
    /* торс */
    ell(g, 0, -28 * s, 15 * s, 16.5 * s, '#5d1a13');
    ell(g, -2 * s, -31 * s, 11 * s, 11 * s, '#71221a');
    /* шипы на плечах */
    g.fillStyle = '#2a0d0a';
    poly(g, [[-12 * s, -40 * s], [-22 * s, -52 * s], [-6 * s, -44 * s]]); g.fill();
    poly(g, [[12 * s, -40 * s], [22 * s, -52 * s], [6 * s, -44 * s]]); g.fill();
    /* руки */
    g.strokeStyle = '#4d1510';
    g.lineWidth = 6.4 * s;
    g.beginPath();
    g.moveTo(-13 * s, -33 * s);
    g.lineTo(-22 * s, -24 * s + wind * -8);
    g.moveTo(13 * s, -33 * s);
    g.lineTo(22 * s, -24 * s + wind * -8);
    g.stroke();
    g.strokeStyle = '#d0b48e';
    g.lineWidth = 2.2 * s;
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(sgn * 22 * s, -24 * s + wind * -8);
        g.lineTo(sgn * (25 + i * 1.4) * s, (-19 + i * 2.4) * s + wind * -8);
        g.stroke();
      }
    }
    /* голова */
    ell(g, 0, -48 * s, 9.4 * s, 9 * s, '#7a2618');
    /* рога */
    g.strokeStyle = '#d9c8a4';
    g.lineWidth = 3.6 * s;
    g.beginPath();
    g.moveTo(-7 * s, -55 * s);
    g.quadraticCurveTo(-16 * s, -66 * s, -20 * s, -58 * s);
    g.moveTo(7 * s, -55 * s);
    g.quadraticCurveTo(16 * s, -66 * s, 20 * s, -58 * s);
    g.stroke();
    /* глаза */
    ell(g, -3.4 * s, -49 * s, 2.2 * s, 2.4 * s, '#ffd24a');
    ell(g, 3.4 * s, -49 * s, 2.2 * s, 2.4 * s, '#ffd24a');
    ell(g, -3.4 * s, -49 * s, 1 * s, 1.1 * s, '#fff6d0');
    ell(g, 3.4 * s, -49 * s, 1 * s, 1.1 * s, '#fff6d0');
    /* пасть */
    g.fillStyle = '#220806';
    poly(g, [[-5 * s, -43 * s], [5 * s, -43 * s], [0, -38.4 * s]]);
    g.fill();
    g.strokeStyle = '#d9c8a4';
    g.lineWidth = 1 * s;
    g.beginPath();
    g.moveTo(-4 * s, -43 * s); g.lineTo(-1.5 * s, -40.6 * s);
    g.moveTo(4 * s, -43 * s); g.lineTo(1.5 * s, -40.6 * s);
    g.stroke();
  }

  if (e.hitT > 0) {
    g.globalAlpha = Math.min(0.55, e.hitT * 3) * fade;
    ell(g, 0, -22 * s, 13 * s, 17 * s, '#fff1e0');
    g.globalAlpha = fade;
  }
  if (frozen) {
    g.globalAlpha = 0.3 * fade;
    ell(g, 0, -24 * s, 14 * s, 20 * s, '#9fd8ff');
    g.globalAlpha = fade;
  }
  g.restore();
  g.globalAlpha = 1;

  /* полоска здоровья */
  if (!e.dead && (e.aggro || e.hp < e.maxHp)) {
    const w = e.boss ? 76 : Math.max(24, 26 * s);
    const h = e.boss ? 5 : 3.4;
    const bx = sx - w / 2;
    const by = sy - 62 * s - (e.boss ? 8 : 0);
    g.fillStyle = 'rgba(0,0,0,.65)';
    g.fillRect(bx - 1, by - 1, w + 2, h + 2);
    g.fillStyle = 'rgba(120,26,18,.9)';
    g.fillRect(bx, by, w, h);
    g.fillStyle = e.boss ? '#e0552e' : '#c4402a';
    g.fillRect(bx, by, w * clamp(e.hp / e.maxHp, 0, 1), h);
    g.fillStyle = 'rgba(255,220,180,.25)';
    g.fillRect(bx, by, w * clamp(e.hp / e.maxHp, 0, 1), 1);
  }
}

/* ───────────────────────── отрисовка: предметы окружения ───────────────────────── */
function drawWall(g, w) {
  const spr = WALL_SPRITES[w.sprite % WALL_SPRITES.length];
  if (!spr) return;
  const [sx, sy] = screenOf(w.topX, w.topY);
  if (!inView(sx, sy, 100)) return;
  g.drawImage(spr, Math.round(sx) - 36, Math.round(sy) - 8);
}

function drawProp(g, p) {
  const [mx, my] = toM(p.x, p.y);
  const [sx, sy] = screenOf(mx, my);
  if (!inView(sx, sy)) return;
  const t = state.clock + p.phase;
  const fl = 0.75 + Math.sin(t * 6.2) * 0.16 + Math.sin(t * 11.3) * 0.09;
  shadowAt(g, sx, sy + 2, p.type === 'campfire' ? 24 : 13);
  if (p.type === 'campfire') {
    /* камни */
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + p.phase;
      const rx = Math.cos(a) * 17, ry = Math.sin(a) * 8;
      ell(g, sx + rx, sy + ry, 4.6, 3, '#3a352c');
    }
    /* брёвна */
    g.strokeStyle = '#2a1c11';
    g.lineWidth = 3.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(sx - 8, sy + 1); g.lineTo(sx + 7, sy - 4);
    g.moveTo(sx - 6, sy - 3); g.lineTo(sx + 8, sy + 2);
    g.stroke();
    glowBall(g, sx, sy - 6, 42 * fl, 'rgba(255,150,60,.30)', 'rgba(255,110,30,0)');
    for (let i = 0; i < 3; i++) {
      const h = 16 + i * 5 + Math.sin(t * 5 + i) * 3;
      g.globalAlpha = 0.85 - i * 0.2;
      g.fillStyle = i === 0 ? '#ffd98a' : i === 1 ? '#ff9a3c' : '#e0531c';
      g.beginPath();
      g.moveTo(sx - 6 + i * 2, sy - 2);
      g.quadraticCurveTo(sx - 2 + i * 3 + Math.sin(t * 6 + i) * 3, sy - h * 0.6, sx + 1 + i * 2, sy - h);
      g.quadraticCurveTo(sx + 4 + i * 2, sy - h * 0.5, sx + 6 - i, sy - 2);
      g.fill();
      g.globalAlpha = 1;
    }
  } else {
    /* жаровня */
    g.strokeStyle = '#3c3427';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(sx - 7, sy + 1); g.lineTo(sx, sy - 14);
    g.moveTo(sx + 7, sy + 1); g.lineTo(sx, sy - 14);
    g.moveTo(sx, sy + 1); g.lineTo(sx, sy - 14);
    g.stroke();
    g.fillStyle = '#4a4130';
    g.beginPath();
    g.ellipse(sx, sy - 16, 10, 4.4, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#221c12';
    g.beginPath();
    g.ellipse(sx, sy - 16.6, 8, 3.2, 0, 0, TAU);
    g.fill();
    glowBall(g, sx, sy - 20, 30 * fl, 'rgba(255,160,70,.34)', 'rgba(255,120,40,0)');
    for (let i = 0; i < 2; i++) {
      const h = 11 + i * 5 + Math.sin(t * 7 + i * 2) * 2.4;
      g.globalAlpha = 0.8;
      g.fillStyle = i ? '#ffb35c' : '#ffd98a';
      g.beginPath();
      g.moveTo(sx - 4, sy - 17);
      g.quadraticCurveTo(sx - 1 + Math.sin(t * 5 + i) * 2, sy - 17 - h * 0.6, sx + 1, sy - 17 - h);
      g.quadraticCurveTo(sx + 3, sy - 17 - h * 0.5, sx + 4, sy - 17);
      g.fill();
      g.globalAlpha = 1;
    }
  }
  /* искорки */
  const sp = 0.5 + Math.sin(t * 3.5) * 0.5;
  g.globalAlpha = 0.5 * sp;
  g.fillStyle = '#ffcc7a';
  g.beginPath();
  g.arc(sx + Math.sin(t * 2.4) * 8, sy - 26 - sp * 12, 1.2, 0, TAU);
  g.fill();
  g.globalAlpha = 1;
}

function drawChest(g, c) {
  const [mx, my] = toM(c.x, c.y);
  const [sx, sy] = screenOf(mx, my + HH);
  if (!inView(sx, sy)) return;
  const openK = c.opened ? 1 : 0;
  shadowAt(g, sx, sy, 20);
  /* основание */
  poly(g, [[-14, -14], [0, -21], [14, -14], [14, -3], [0, 4], [-14, -3]]);
  g.fillStyle = '#4a3520';
  g.fill();
  g.strokeStyle = '#241708';
  g.lineWidth = 1.2;
  g.stroke();
  /* полосы */
  g.strokeStyle = 'rgba(190,152,84,.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-9, -16.4); g.lineTo(-9, -0.6);
  g.moveTo(9, -16.4); g.lineTo(9, -0.6);
  g.stroke();
  /* крышка */
  g.save();
  g.translate(0, -14 - openK * 8);
  g.rotate(-openK * 1.05);
  poly(g, [[-14, 0], [0, -7], [14, 0], [0, 7]]);
  g.fillStyle = '#5a4227';
  g.fill();
  g.strokeStyle = '#2b1c0c';
  g.lineWidth = 1.2;
  g.stroke();
  g.strokeStyle = 'rgba(206,168,96,.5)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-14, 0); g.lineTo(0, 7); g.lineTo(14, 0);
  g.stroke();
  g.restore();
  /* замок */
  if (!c.opened) {
    g.fillStyle = '#c9a24e';
    g.fillRect(-2.6, -11, 5.2, 5.2);
    g.fillStyle = '#2a1c0b';
    g.fillRect(-1, -9.4, 2, 2.4);
  } else {
    glowBall(g, sx, sy - 18, 26, 'rgba(255,200,110,.28)', 'rgba(255,200,110,0)');
  }
}

function drawLoot(g, l) {
  const [mx, my] = toM(l.x, l.y);
  const [sx, sy] = screenOf(mx, my + HH * 0.5);
  if (!inView(sx, sy)) return;
  const bob = Math.sin(state.clock * 2.2 + l.t) * 1.6;
  const hovered = state.hover.loot === l;
  shadowAt(g, sx, sy, 10, 0.3);

  if (l.kind === 'gold') {
    glowBall(g, sx, sy - 4, 16, 'rgba(255,196,90,.22)', 'rgba(255,196,90,0)');
    for (let i = 0; i < 5; i++) {
      const a = i * 1.6 + l.t;
      ell(g, sx + Math.cos(a) * 5, sy - 3 + Math.sin(a) * 2.2, 3.2, 1.6, i % 2 ? '#d9ab52' : '#b98a36');
    }
    ell(g, sx, sy - 5.4, 2.4, 1.4, '#ffe9a8');
    if (hovered) {
      g.strokeStyle = 'rgba(255,220,140,.55)';
      g.lineWidth = 1;
      g.beginPath(); g.ellipse(sx, sy, 13, 6, 0, 0, TAU); g.stroke();
    }
  } else if (l.kind === 'potion') {
    const col = l.potion === 'hp' ? '#c8382a' : '#2f6ec0';
    const glow = l.potion === 'hp' ? '184,56,42' : '47,110,192';
    glowBall(g, sx, sy - 6, 15, `rgba(${glow},.28)`, `rgba(${glow},0)`);
    /* колба */
    g.fillStyle = 'rgba(200,215,220,.35)';
    g.beginPath();
    g.moveTo(sx - 2.4, sy - 12 - bob);
    g.lineTo(sx + 2.4, sy - 12 - bob);
    g.lineTo(sx + 4.4, sy - 4 - bob);
    g.quadraticCurveTo(sx, sy + 0.4 - bob, sx - 4.4, sy - 4 - bob);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(sx - 3.4, sy - 7 - bob);
    g.quadraticCurveTo(sx, sy + 0.2 - bob, sx + 3.4, sy - 7 - bob);
    g.lineTo(sx + 4.2, sy - 4 - bob);
    g.quadraticCurveTo(sx, sy + 0.6 - bob, sx - 4.2, sy - 4 - bob);
    g.closePath();
    g.fill();
    g.fillStyle = '#7a5a32';
    g.fillRect(sx - 2, sy - 14 - bob, 4, 2.2);
  } else {
    const it = l.item;
    const col = RARITY[it.rarity].color;
    const rgb = it.rarity === 'magic' ? '120,160,255' : it.rarity === 'rare' ? '235,205,110' : it.rarity === 'unique' ? '220,150,80' : '210,196,165';
    const beamH = it.rarity === 'common' ? 14 : 32;
    const grd = g.createLinearGradient(sx, sy - beamH, sx, sy + 2);
    grd.addColorStop(0, `rgba(${rgb},0)`);
    grd.addColorStop(0.7, `rgba(${rgb},.22)`);
    grd.addColorStop(1, `rgba(${rgb},.05)`);
    g.fillStyle = grd;
    g.fillRect(sx - 7, sy - beamH, 14, beamH + 2);
    glowBall(g, sx, sy - 6, 18, `rgba(${rgb},.3)`, `rgba(${rgb},0)`);
    g.save();
    g.translate(sx, sy - 9 - bob);
    g.scale(0.42, 0.42);
    g.strokeStyle = col;
    g.fillStyle = 'rgba(0,0,0,0)';
    g.lineWidth = 4;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    const icon = it.type;
    if (icon === 'weapon') {
      g.beginPath();
      g.moveTo(-14, 14); g.lineTo(12, -14);
      g.moveTo(-16, 8); g.lineTo(-6, 18);
      g.stroke();
      g.beginPath();
      g.arc(15, -17, 6, 0, TAU);
      g.fillStyle = col;
      g.fill();
    } else if (icon === 'armor') {
      g.beginPath();
      g.moveTo(-14, -12); g.lineTo(0, -18); g.lineTo(14, -12);
      g.lineTo(11, 16); g.lineTo(0, 20); g.lineTo(-11, 16);
      g.closePath();
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(0, -18); g.lineTo(13, 0); g.lineTo(0, 18); g.lineTo(-13, 0);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.arc(0, -22, 5, 0, TAU);
      g.stroke();
    }
    g.restore();
    if (hovered) {
      g.fillStyle = col;
      g.font = '600 11px Cinzel, serif';
      g.textAlign = 'center';
      g.shadowColor = 'rgba(0,0,0,.9)';
      g.shadowBlur = 6;
      g.fillText(it.name, sx, sy - 30);
      g.shadowBlur = 0;
    }
  }
}

/* ───────────────────────── отрисовка: снаряды / эффекты / частицы ───────────────────────── */
function drawProjectiles(g) {
  for (const pr of state.projectiles) {
    const [mx, my] = toM(pr.x, pr.y);
    const [sx, sy] = screenOf(mx, my - 16);
    if (!inView(sx, sy, 80)) continue;
    const ang = Math.atan2(pr.vy * HH, pr.vx * HW);
    if (pr.kind === 'ice') {
      glowBall(g, sx, sy, 20, 'rgba(150,215,255,.5)', 'rgba(120,190,255,0)');
      g.save();
      g.translate(sx, sy);
      g.rotate(ang);
      poly(g, [[11, 0], [-5, 4], [-2, 0], [-5, -4]]);
      g.fillStyle = '#d8f2ff';
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.85)';
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    } else if (pr.kind === 'fire') {
      const f = 0.85 + Math.sin(state.clock * 22) * 0.15;
      glowBall(g, sx, sy, 30 * f, 'rgba(255,170,70,.55)', 'rgba(255,90,20,0)');
      ell(g, sx, sy, 6.4 * f, 6, '#ff9a3c');
      ell(g, sx - 1, sy - 1, 3.6 * f, 3.2, '#ffe7a8');
    } else if (pr.kind === 'shadow') {
      glowBall(g, sx, sy, 22, 'rgba(160,95,255,.55)', 'rgba(120,50,220,0)');
      ell(g, sx, sy, 5, 5, '#b47cff');
      ell(g, sx - 1, sy - 1, 2.4, 2.4, '#efe2ff');
    } else if (pr.kind === 'arrow') {
      g.save();
      g.translate(sx, sy);
      g.rotate(ang);
      g.strokeStyle = '#c9b893';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-9, 0); g.lineTo(9, 0);
      g.stroke();
      g.fillStyle = '#d8cbb0';
      poly(g, [[9, 0], [3, 3], [3, -3]]);
      g.fill();
      g.strokeStyle = 'rgba(230,220,190,.6)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-9, 0); g.lineTo(-12, 2);
      g.moveTo(-9, 0); g.lineTo(-12, -2);
      g.stroke();
      g.restore();
    }
  }
}

function drawEffects(g) {
  for (const e of state.effects) {
    const k = clamp(e.t / e.dur, 0, 1);
    if (e.kind === 'explosion') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const r = (e.r || 1.3) * 52 * (0.35 + k * 0.85);
      glowBall(g, sx, sy - 10, r, `rgba(${e.color},${(1 - k) * 0.55})`, `rgba(${e.color},0)`);
      g.strokeStyle = `rgba(255,235,190,${(1 - k) * 0.8})`;
      g.lineWidth = 2.4 * (1 - k);
      g.beginPath();
      g.ellipse(sx, sy - 6, r * 0.9, r * 0.45, 0, 0, TAU);
      g.stroke();
    } else if (e.kind === 'nova') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const r = 3.05 * 45.25 * (0.15 + k * 0.9);
      const a = (1 - k) * 0.8;
      g.strokeStyle = `rgba(170,235,255,${a})`;
      g.lineWidth = 3 * (1 - k) + 1;
      g.beginPath();
      g.ellipse(sx, sy, r, r * 0.5, 0, 0, TAU);
      g.stroke();
      g.strokeStyle = `rgba(230,250,255,${a * 0.6})`;
      g.beginPath();
      g.ellipse(sx, sy, r * 0.7, r * 0.35, 0, 0, TAU);
      g.stroke();
      g.fillStyle = `rgba(150,215,250,${(1 - k) * 0.1})`;
      g.beginPath();
      g.ellipse(sx, sy, r, r * 0.5, 0, 0, TAU);
      g.fill();
    } else if (e.kind === 'ring') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const r = 12 + k * 46;
      g.strokeStyle = `rgba(${e.color || '201,169,92'},${(1 - k) * 0.6})`;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(sx, sy, r, r * 0.5, 0, 0, TAU);
      g.stroke();
    } else if (e.kind === 'levelup') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const h = 150 * Math.min(1, k * 2.2);
      const grd = g.createLinearGradient(sx, sy - h, sx, sy);
      grd.addColorStop(0, `rgba(255,226,160,0)`);
      grd.addColorStop(1, `rgba(255,226,160,${(1 - k) * 0.35})`);
      g.fillStyle = grd;
      g.fillRect(sx - 16, sy - h, 32, h);
      g.strokeStyle = `rgba(255,236,180,${(1 - k) * 0.8})`;
      g.lineWidth = 2;
      const r = 10 + k * 52;
      g.beginPath();
      g.ellipse(sx, sy, r, r * 0.5, 0, 0, TAU);
      g.stroke();
    } else if (e.kind === 'lightning') {
      const a = (1 - k);
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const seg of e.segs) {
        const [x1, y1] = seg[0], [x2, y2] = seg[1];
        const [ax, ay] = screenOf(...toM(x1, y1));
        const [bx, by] = screenOf(...toM(x2, y2));
        const jitter = 5;
        g.strokeStyle = `rgba(120,175,255,${a * 0.55})`;
        g.lineWidth = 7;
        g.shadowColor = 'rgba(140,190,255,.9)';
        g.shadowBlur = 16;
        g.beginPath();
        g.moveTo(ax, ay);
        const steps = 6;
        for (let i = 1; i < steps; i++) {
          const tt = i / steps;
          g.lineTo(ax + (bx - ax) * tt + rand(-jitter, jitter), ay + (by - ay) * tt + rand(-jitter, jitter));
        }
        g.lineTo(bx, by);
        g.stroke();
        g.strokeStyle = `rgba(240,250,255,${a})`;
        g.lineWidth = 2;
        g.shadowBlur = 8;
        g.stroke();
      }
      g.shadowBlur = 0;
      g.restore();
    }
  }
}

function drawParticles(g) {
  for (const p of state.particles) {
    const [mx, my] = toM(p.x, p.y);
    const [sx, sy] = screenOf(mx, my);
    if (!inView(sx, sy, 60)) continue;
    const k = p.t / p.life;
    const a = 1 - k;
    g.globalAlpha = clamp(a, 0, 1);
    if (p.add) g.globalCompositeOperation = 'lighter';
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(sx, sy - p.rise, p.size * (0.35 + a * 0.8), 0, TAU);
    g.fill();
    if (p.add) g.globalCompositeOperation = 'source-over';
  }
  g.globalAlpha = 1;
}

function drawTexts(g) {
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const t of state.texts) {
    const [mx, my] = toM(t.x, t.y);
    const [sx, sy] = screenOf(mx, my);
    if (!inView(sx, sy, 60)) continue;
    const k = t.t / t.life;
    g.globalAlpha = clamp(1 - k * k, 0, 1);
    g.font = `600 ${t.size}px Cinzel, "Palatino Linotype", serif`;
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(0,0,0,.75)';
    g.strokeText(t.text, sx, sy - 46 - k * 30);
    g.fillStyle = t.color;
    g.fillText(t.text, sx, sy - 46 - k * 30);
  }
  g.globalAlpha = 1;
  g.textBaseline = 'alphabetic';
}

/* ───────────────────────── отрисовка: свет ───────────────────────── */
function lightHole(x, y, r, strength = 1) {
  const grd = lctx.createRadialGradient(x * DPR, y * DPR, 0, x * DPR, y * DPR, r * DPR);
  grd.addColorStop(0, `rgba(0,0,0,${0.98 * strength})`);
  grd.addColorStop(0.42, `rgba(0,0,0,${0.88 * strength})`);
  grd.addColorStop(0.72, `rgba(0,0,0,${0.5 * strength})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = grd;
  lctx.beginPath();
  lctx.arc(x * DPR, y * DPR, r * DPR, 0, TAU);
  lctx.fill();
}

function drawLighting(g) {
  if (!world) return;
  const p = state.player;
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
  lctx.fillStyle = 'rgba(3,4,7,0.88)';
  lctx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
  lctx.globalCompositeOperation = 'destination-out';

  const flick = 1 + Math.sin(state.clock * 7.3) * 0.03 + Math.sin(state.clock * 13.1) * 0.02;
  if (p) {
    const [pmx, pmy] = toM(p.x, p.y);
    const [psx, psy] = screenOf(pmx, pmy - 20);
    /* дальний ореол — силуэты стен в темноте */
    lightHole(psx, psy, 620 * flick, 0.3);
    lightHole(psx, psy, 330 * flick, 1);
    /* мягкий тёплый круг у ног */
    lightHole(psx, psy + 40, 185, 0.55);
  }
  for (const t of world.torches) {
    const [sx, sy] = screenOf(t.mx, t.my);
    if (!inView(sx, sy, 240)) continue;
    lightHole(sx, sy + 20, (150 + Math.sin(state.clock * 6 + t.phase) * 10), 0.95);
  }
  for (const pr of world.props) {
    const [mx, my] = toM(pr.x, pr.y);
    const [sx, sy] = screenOf(mx, my);
    if (!inView(sx, sy, 260)) continue;
    lightHole(sx, sy - 8, pr.type === 'campfire' ? 205 : 138, 0.92);
  }
  for (const pr of state.projectiles) {
    const [mx, my] = toM(pr.x, pr.y);
    const [sx, sy] = screenOf(mx, my - 16);
    if (!inView(sx, sy, 140)) continue;
    lightHole(sx, sy, pr.kind === 'fire' ? 96 : 58, 0.7);
  }
  for (const e of state.effects) {
    if (e.kind === 'explosion' || e.kind === 'nova' || e.kind === 'levelup') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const k = e.t / e.dur;
      lightHole(sx, sy, (e.kind === 'nova' ? 120 : 210) * (1 - k * 0.35), 1 - k * 0.6);
    }
  }
  for (const l of state.loot) {
    if (l.kind !== 'item') continue;
    const [mx, my] = toM(l.x, l.y);
    const [sx, sy] = screenOf(mx, my);
    if (!inView(sx, sy, 90)) continue;
    if (l.item.rarity !== 'common') lightHole(sx, sy - 8, 46, 0.55);
  }
  const b = state.boss;
  if (b && !b.dead) {
    const [mx, my] = toM(b.x, b.y);
    const [sx, sy] = screenOf(mx, my);
    lightHole(sx, sy - 30, 150, 0.85);
  }

  lctx.globalCompositeOperation = 'source-over';
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(lightCanvas, 0, 0);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);

  /* тёплые аддитивные источники */
  g.save();
  g.globalCompositeOperation = 'lighter';
  const warm = (x, y, r, rgb, alpha) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${rgb},${alpha})`);
    grd.addColorStop(0.45, `rgba(${rgb},${alpha * 0.35})`);
    grd.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  };
  for (const t of world.torches) {
    const [sx, sy] = screenOf(t.mx, t.my);
    if (!inView(sx, sy, 200)) continue;
    warm(sx, sy + 16, 108 + Math.sin(state.clock * 6 + t.phase) * 8, '255,146,64', 0.20);
  }
  for (const pr of world.props) {
    const [mx, my] = toM(pr.x, pr.y);
    const [sx, sy] = screenOf(mx, my);
    if (!inView(sx, sy, 220)) continue;
    warm(sx, sy - 8, pr.type === 'campfire' ? 150 : 96, pr.type === 'campfire' ? '255,150,70' : '255,150,80', 0.22);
  }
  if (p) {
    const [pmx, pmy] = toM(p.x, p.y);
    const [psx, psy] = screenOf(pmx, pmy - 20);
    warm(psx, psy, 190, '120,160,255', 0.06);
  }
  for (const e of state.effects) {
    if (e.kind === 'explosion') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const k = e.t / e.dur;
      warm(sx, sy, (e.r || 1.3) * 90, '255,140,50', (1 - k) * 0.5);
    } else if (e.kind === 'nova') {
      const [mx, my] = toM(e.x, e.y);
      const [sx, sy] = screenOf(mx, my);
      const k = e.t / e.dur;
      warm(sx, sy, 150, '150,220,255', (1 - k) * 0.35);
    }
  }
  g.restore();
}

/* ───────────────────────── отрисовка: экранные слои ───────────────────────── */
function drawHoverLabel(g) {
  const m = state.mouse;
  if (!m.over || state.scene !== 'play') return;
  const e = state.hover.enemy;
  const chest = state.hover.chest;
  const loot = state.hover.loot;
  let label = null, sub = null, color = '#e6d7b5';
  if (e && !e.dead) {
    label = e.boss ? 'Кровавый Рог' : e.def.name;
    sub = e.boss ? 'Вожак стаи' : `Уровень твари · здоровье ${Math.max(1, Math.ceil(e.hp))}`;
    color = e.boss ? '#e8825f' : '#e2b48a';
  } else if (chest) {
    label = 'Сундук'; sub = 'ЛКМ — открыть'; color = '#e0c583';
  } else if (loot && loot.kind === 'item') {
    label = loot.item.name;
    sub = RARITY[loot.item.rarity].label;
    color = RARITY[loot.item.rarity].color;
  } else if (loot && loot.kind === 'gold') {
    label = `Золото ×${loot.amount}`; color = '#e0c583';
  } else if (loot) {
    label = loot.potion === 'hp' ? 'Зелье здоровья' : 'Зелье маны';
    color = loot.potion === 'hp' ? '#e08474' : '#8fb8e8';
  }
  if (!label) return;
  const x = m.x, y = m.y + 26;
  g.font = '600 12px Cinzel, serif';
  g.textAlign = 'center';
  const w = Math.max(72, g.measureText(label).width + 22);
  g.fillStyle = 'rgba(8,7,5,.82)';
  g.fillRect(x - w / 2, y, w, sub ? 32 : 20);
  g.strokeStyle = 'rgba(201,169,92,.35)';
  g.lineWidth = 1;
  g.strokeRect(x - w / 2 + 0.5, y + 0.5, w - 1, (sub ? 32 : 20) - 1);
  g.fillStyle = color;
  g.fillText(label, x, y + 14);
  if (sub) {
    g.font = '10px "EB Garamond", serif';
    g.fillStyle = 'rgba(190,175,145,.8)';
    g.fillText(sub, x, y + 26);
  }
}

function drawCursor(g) {
  const m = state.mouse;
  if (!m.over) return;
  const t = state.hover.enemy ? '#ff9a7c' : (state.hover.loot || state.hover.chest) ? '#e8ca7d' : '#e6d7b5';
  g.save();
  g.translate(m.x, m.y);
  g.strokeStyle = t;
  g.lineWidth = 1.3;
  g.globalAlpha = 0.9;
  g.beginPath();
  g.arc(0, 0, 9, 0, TAU);
  g.stroke();
  g.globalAlpha = 0.35;
  g.beginPath();
  g.arc(0, 0, 13.5, 0.3, 1.1);
  g.arc(0, 0, 13.5, Math.PI + 0.3, Math.PI + 1.1);
  g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = t;
  poly(g, [[0, -2.6], [3.4, 5.4], [0, 3.4], [-3.4, 5.4]]);
  g.fill();
  g.restore();
}

function drawPortal(g, portal) {
  if (!portal) return;
  const t = (state.clock || 0) + (portal.t || 0);
  const [mx, my] = toM(portal.x, portal.y);
  const [sx, sy] = screenOf(mx, my);
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const p = t * (0.8 + i * 0.3);
    const r = 26 + i * 6 + Math.sin(p) * 2;
    const grad = g.createRadialGradient(sx, sy - 10, 0, sx, sy - 10, r);
    grad.addColorStop(0, i === 0 ? 'rgba(160,200,255,0.25)' : 'rgba(120,170,255,0.18)');
    grad.addColorStop(0.5, 'rgba(90,150,255,0.12)');
    grad.addColorStop(1, 'rgba(60,120,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(sx, sy - 10, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.save();
  g.translate(sx, sy - 14);
  g.rotate(t * 1.2);
  g.strokeStyle = 'rgba(180,220,255,0.5)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 14, 0, Math.PI * 1.4);
  g.stroke();
  g.rotate(t * -1.8 + Math.PI);
  g.strokeStyle = 'rgba(140,190,255,0.4)';
  g.beginPath();
  g.arc(0, 0, 10, 0, Math.PI);
  g.stroke();
  g.restore();
  g.fillStyle = 'rgba(200,230,255,0.9)';
  g.beginPath();
  g.ellipse(sx, sy - 14, 6, 3, t * 0.6, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawVignette(g) {
  if (!vignetteCanvas) return;
  g.drawImage(vignetteCanvas, 0, 0, CW, CH);
  if (state.hurtFlash > 0) {
    g.fillStyle = `rgba(140,18,10,${state.hurtFlash * 0.26})`;
    g.fillRect(0, 0, CW, CH);
  }
  if (state.flash > 0) {
    g.fillStyle = `rgba(${state.flashColor},${Math.min(0.5, state.flash)})`;
    g.fillRect(0, 0, CW, CH);
  }
}

/* ───────────────────────── главный рендер ───────────────────────── */
function render() {
  if (!world) return;
  const c = state.camera;
  const camX = c.x - CW / 2 - c.shakeX;
  const camY = c.y - CH * 0.47 - c.shakeY;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#050403';
  ctx.fillRect(0, 0, CW, CH);

  /* пол */
  const sx0 = Math.max(0, Math.floor(camX)), sy0 = Math.max(0, Math.floor(camY));
  const sw = Math.min(FW - sx0, CW + 2), sh = Math.min(FH - sy0, CH + 2);
  if (sw > 0 && sh > 0) {
    ctx.drawImage(world.floorCanvas, sx0, sy0, sw, sh, sx0 - camX, sy0 - camY, sw, sh);
  }

  /* список отрисовки */
  const drawList = [];
  for (const w of world.wallsRender) {
    if (w.topX < camX - 100 || w.topX > camX + CW + 100 || w.topY < camY - 120 || w.topY > camY + CH + 120) continue;
    drawList.push({ y: w.sortY, f: () => drawWall(ctx, w) });
  }
  for (const prop of world.props) {
    const [mx, my] = toM(prop.x, prop.y);
    drawList.push({ y: my + HH, f: () => drawProp(ctx, prop) });
  }
  for (const ch of state.chests) {
    const [mx, my] = toM(ch.x, ch.y);
    drawList.push({ y: my + HH, f: () => drawChest(ctx, ch) });
  }
  for (const l of state.loot) {
    const [mx, my] = toM(l.x, l.y);
    drawList.push({ y: my + HH * 0.6, f: () => drawLoot(ctx, l) });
  }
  for (const e of state.enemies) {
    if (e.dead && e.fade <= 0) continue;
    const [mx, my] = toM(e.x, e.y);
    drawList.push({ y: my + HH + 1, f: () => drawEnemy(ctx, e, ...screenOf(mx, my + HH)) });
  }
  const p = state.player;
  if (p) {
    const [mx, my] = toM(p.x, p.y);
    drawList.push({ y: my + HH + 0.5, f: () => drawPlayer(ctx, ...screenOf(mx, my + HH)) });
  }
  drawList.sort((a, b) => a.y - b.y);
  for (const d of drawList) d.f();

  drawProjectiles(ctx);
  drawEffects(ctx);
  drawParticles(ctx);
  drawTexts(ctx);

  drawLighting(ctx);
  if (state.portal && state.portal.active) {
    drawPortal(ctx, state.portal);
  }
  drawHoverLabel(ctx);
  drawCursor(ctx);
  drawVignette(ctx);
}

/* ───────────────────────── цикл ───────────────────────── */
let vignetteCanvas = null;
function buildVignette() {
  vignetteCanvas = document.createElement('canvas');
  vignetteCanvas.width = Math.max(1, Math.round(CW * DPR));
  vignetteCanvas.height = Math.max(1, Math.round(CH * DPR));
  const g = vignetteCanvas.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const grd = g.createRadialGradient(CW / 2, CH * 0.48, Math.min(CW, CH) * 0.32, CW / 2, CH * 0.48, Math.max(CW, CH) * 0.78);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(0.62, 'rgba(3,2,2,.22)');
  grd.addColorStop(1, 'rgba(2,1,1,.78)');
  g.fillStyle = grd;
  g.fillRect(0, 0, CW, CH);
}

function resize() {
  CW = window.innerWidth;
  CH = window.innerHeight;
  canvas.width = Math.max(1, Math.round(CW * DPR));
  canvas.height = Math.max(1, Math.round(CH * DPR));
  canvas.style.width = CW + 'px';
  canvas.style.height = CH + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  lightCanvas.width = canvas.width;
  lightCanvas.height = canvas.height;
  buildVignette();
  clampCamera();
}

let hudAccum = 0;
function update(dt) {
  const scene = state.scene;
  if (scene === 'paused') return;

  if (scene === 'play') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateLoot(dt);
    updateEffects(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateAmbientFX(dt);
    updateCamera(dt);
    updateMinimap(dt);
    hudAccum += dt;
    if (hudAccum >= 0.06) { hudAccum = 0; updateHUD(); }
  } else if (scene === 'menu') {
    updateEffects(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateAmbientFX(dt);
    updateCamera(dt);
    hudAccum += dt;
    if (hudAccum >= 0.12) { hudAccum = 0; updateHUD(); }
  } else if (scene === 'dead') {
    state.deathTimer += dt;
    updateEnemies(dt);
    updateProjectiles(dt);
    updateEffects(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateAmbientFX(dt);
    updateCamera(dt);
    if (state.deathTimer > 1.0 && dom.overlayDeath.classList.contains('hidden')) {
      showDeathOverlay();
    }
  } else if (scene === 'won') {
    updateEffects(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateAmbientFX(dt);
    updateCamera(dt);
  }

  if (scene === 'play' && state.winTimer > 0) {
    state.winTimer -= dt;
    if (state.winTimer <= 0) {
      state.winTimer = 0;
      state.scene = 'won';
      showWinOverlay();
    }
  }
}

let lastFrame = 0;
function loop(ts) {
  if (!lastFrame) lastFrame = ts;
  let dt = (ts - lastFrame) / 1000;
  lastFrame = ts;
  if (!isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(dt, 0.05);
  if (state.scene !== 'paused') state.clock += dt;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ───────────────────────── запуск ───────────────────────── */
resize();
buildWallSprites();
buildSkillUI();
newRun();
state.scene = 'menu';
dom.overlayStart.classList.remove('hidden');
dom.overlayDeath.classList.add('hidden');
dom.overlayWin.classList.add('hidden');
dom.overlayPause.classList.add('hidden');
dom.inventory.classList.add('hidden');
dom.bossbar.classList.add('hidden');
dom.toasts.innerHTML = '';
dom.areaBanner.classList.remove('show');
bindUI();
requestAnimationFrame(loop);

window.__game = {
  state, SKILLS, world: () => world,
  newRun: (seed) => newRun(seed),
  cast: (i, x, y) => castSkill(i, x, y, true),
  hurt: (e, d) => damageEnemy(e, d),
  makeItem, addItem, equipItem,
  toM, screenOf,
  get worldRef() { return world; },
};

})();
