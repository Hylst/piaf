import { useRef, useEffect, useCallback, useState } from "react";

/* ================================================================
   PIAF - Version enrichie
   - 3 modes de difficulté (Facile / Normal / Expert)
   - 6 thèmes visuels débloqués par progression
   - Pièces à collectionner (bonus points)
   - Power-ups (aimant, ralenti, invincibilité)
   - Effets météo (pluie, neige)
   - Traînée de l'oiseau, particules avancées
   - Transitions fluides entre thèmes
   - Difficulté très progressive par paliers
================================================================= */

// ─── Constantes physiques ───────────────────────────────
const GRAVITY = 0.23;
const MAX_FALL = 8.5;
const BIRD_SIZE = 27;
const BIRD_X_RATIO = 0.32;
const GROUND_H = 88;
const PIPE_WIDTH = 70;

// ─── Thèmes visuels ─────────────────────────────────────
interface Theme {
  name: string;
  skyTop: string;
  skyMid: string;
  skyBot: string;
  ground1: string;
  ground2: string;
  ground3: string;
  pipeBody1: string;
  pipeBody2: string;
  pipeCap1: string;
  pipeCap2: string;
  mountainColor: string;
  hillColor: string;
  treeColor: string;
  cloudColor: string;
  sunColor: string;
  weather: "none" | "rain" | "snow" | "leaves";
}

const THEMES: Theme[] = [
  {
    name: "Aube",
    skyTop: "#1a2a5e", skyMid: "#4a6fa5", skyBot: "#7eb8da",
    ground1: "#6b8e3a", ground2: "#557a28", ground3: "#3d5c1f",
    pipeBody1: "#3d7a3d", pipeBody2: "#5ca85c", pipeCap1: "#2d5a2d", pipeCap2: "#7dd96a",
    mountainColor: "rgba(40,70,120,0.5)", hillColor: "rgba(60,120,80,0.6)",
    treeColor: "rgba(40,100,50,0.85)", cloudColor: "rgba(255,255,255,0.5)", sunColor: "#ffe082",
    weather: "none",
  },
  {
    name: "Jour",
    skyTop: "#3498db", skyMid: "#6cc0e5", skyBot: "#a8e0f5",
    ground1: "#5a8f2b", ground2: "#4a7c23", ground3: "#34511b",
    pipeBody1: "#2ecc71", pipeBody2: "#58d68d", pipeCap1: "#27ae60", pipeCap2: "#82e0aa",
    mountainColor: "rgba(50,90,140,0.45)", hillColor: "rgba(70,130,90,0.55)",
    treeColor: "rgba(45,110,55,0.85)", cloudColor: "rgba(255,255,255,0.75)", sunColor: "#fff176",
    weather: "none",
  },
  {
    name: "Crépuscule",
    skyTop: "#2c1654", skyMid: "#7b2d8b", skyBot: "#e8734a",
    ground1: "#5c3d2e", ground2: "#4a3024", ground3: "#382219",
    pipeBody1: "#6b3fa0", pipeBody2: "#9b59b6", pipeCap1: "#4a2d6b", pipeCap2: "#c39bd3",
    mountainColor: "rgba(50,30,60,0.6)", hillColor: "rgba(80,40,60,0.65)",
    treeColor: "rgba(35,20,30,0.9)", cloudColor: "rgba(255,200,150,0.4)", sunColor: "#ff6f00",
    weather: "none",
  },
  {
    name: "Nuit",
    skyTop: "#0a0a2e", skyMid: "#161640", skyBot: "#1a1a4e",
    ground1: "#1a2a1a", ground2: "#0f1f0f", ground3: "#0a150a",
    pipeBody1: "#1a3a5c", pipeBody2: "#2a5a8c", pipeCap1: "#0f2440", pipeCap2: "#4a8abf",
    mountainColor: "rgba(15,20,40,0.55)", hillColor: "rgba(20,30,30,0.6)",
    treeColor: "rgba(10,25,15,0.9)", cloudColor: "rgba(200,200,255,0.2)", sunColor: "#fffde7",
    weather: "snow",
  },
  {
    name: "Automne",
    skyTop: "#5a4a3a", skyMid: "#8b7355", skyBot: "#c4a882",
    ground1: "#8b6914", ground2: "#6b4f10", ground3: "#4a3510",
    pipeBody1: "#c0392b", pipeBody2: "#e74c3c", pipeCap1: "#922b21", pipeCap2: "#f1948a",
    mountainColor: "rgba(80,60,40,0.55)", hillColor: "rgba(140,90,30,0.6)",
    treeColor: "rgba(180,80,20,0.85)", cloudColor: "rgba(255,220,180,0.5)", sunColor: "#ffab40",
    weather: "leaves",
  },
  {
    name: "Arc-en-ciel",
    skyTop: "#1a237e", skyMid: "#4a148c", skyBot: "#e91e63",
    ground1: "#00bcd4", ground2: "#0097a7", ground3: "#006064",
    pipeBody1: "#ff6f00", pipeBody2: "#ffb300", pipeCap1: "#e65100", pipeCap2: "#ffecb3",
    mountainColor: "rgba(100,40,120,0.5)", hillColor: "rgba(0,150,136,0.6)",
    treeColor: "rgba(233,30,99,0.8)", cloudColor: "rgba(255,255,255,0.4)", sunColor: "#ffeb3b",
    weather: "rain",
  },
];

// ─── Types ──────────────────────────────────────────────
type GameMode = "easy" | "normal" | "hard";
type GameState = "menu" | "idle" | "playing" | "gameover";

interface Pipe {
  x: number;
  topH: number;
  gap: number;
  scored: boolean;
  hasCoin: boolean;
  coinY: number;
  coinCollected: boolean;
  hasPowerUp: boolean;
  powerUpType: "magnet" | "slow" | "shield";
  powerUpY: number;
  powerUpCollected: boolean;
  themeIdx: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
  gravity: boolean;
}

interface TrailPoint {
  x: number; y: number; life: number;
}

interface StarBurst {
  x: number; y: number; life: number; text: string;
}

// ─── Audio synthétique ─────────────────────────────────
class AudioController {
  ctx: AudioContext | null = null;
  musicGain: GainNode | null = null;
  musicPlaying = false;
  musicTimer: number | null = null;
  muted = false;
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  beep(freq: number, dur: number, vol = 0.2, type: OscillatorType = "sine") {
    if (this.muted || !this.ctx) return;
    this.init();
    const o = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    o.connect(g); g.connect(this.ctx!.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx!.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + dur);
    o.start(this.ctx!.currentTime); o.stop(this.ctx!.currentTime + dur);
  }
  flap() { this.beep(420, 0.08, 0.18); this.beep(580, 0.07, 0.12); }
  score() { this.beep(523, 0.08, 0.16); setTimeout(() => this.beep(659, 0.08, 0.14), 80); setTimeout(() => this.beep(784, 0.12, 0.16), 160); }
  milestone() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.18, 0.16, "triangle"), i * 90));
  }
  crash() { this.beep(80, 0.35, 0.35, "sawtooth"); }
  coin() { this.beep(880, 0.06, 0.12); setTimeout(() => this.beep(1100, 0.08, 0.14), 60); }
  powerUp() { this.beep(660, 0.06, 0.12); setTimeout(() => this.beep(880, 0.06, 0.12), 70); setTimeout(() => this.beep(1100, 0.1, 0.16), 140); }
  startMusic() {
    if (this.musicPlaying) return;
    this.init(); if (!this.ctx) return;
    this.musicPlaying = true;
    this.musicGain = this.ctx!.createGain();
    this.musicGain.connect(this.ctx!.destination);
    this.musicGain.gain.value = 0.05;
    const mel = [261, 329, 392, 523, 440, 349, 293, 349];
    const bas = [130, 130, 164, 164, 146, 146, 130, 130];
    let i = 0;
    const play = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      if (!this.muted) {
        this.beepNote(mel[i % mel.length], 0.45, 0.45);
        this.beepNote(bas[i % bas.length], 0.42, 0.3, "triangle");
      }
      i++;
      this.musicTimer = window.setTimeout(play, 520);
    };
    play();
  }
  beepNote(f: number, d: number, v: number, t: OscillatorType = "sine") {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = t; o.frequency.value = f;
    o.connect(g); g.connect(this.musicGain);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.05);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + d);
    o.start(this.ctx.currentTime); o.stop(this.ctx.currentTime + d + 0.05);
  }
  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
    if (this.musicGain) { this.musicGain.disconnect(); this.musicGain = null; }
  }
}

const audio = new AudioController();

// ─── Génération décor ──────────────────────────────────
function genScenery(seed: number, n: number, minH: number, maxH: number) {
  const a: { x: number; h: number; w: number }[] = [];
  let s = seed;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) a.push({ x: i * 200 + r() * 140, h: minH + r() * (maxH - minH), w: 120 + r() * 180 });
  return a;
}
const MOUNTAINS = genScenery(42, 28, 80, 210);
const HILLS = genScenery(77, 36, 45, 120);
const TREES = genScenery(123, 55, 22, 60);

// ─── Composant principal ───────────────────────────────
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("piaf-high") || "0", 10));
  const [highCoins, setHighCoins] = useState(() => parseInt(localStorage.getItem("piaf-coins") || "0", 10));
  const [gameState, setGameState] = useState<GameState>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [unlockedThemes, setUnlockedThemes] = useState(() => {
    const s = localStorage.getItem("piaf-themes");
    return s ? JSON.parse(s) : [0, 1];
  });

  // Refs
  const birdY = useRef(0);
  const birdVel = useRef(0);
  const birdRot = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const lastTopH = useRef<number | null>(null);
  const scoreR = useRef(0);
  const coinsR = useRef(0);
  const gameSR = useRef<GameState>("menu");
  const gameMR = useRef<GameMode>("normal");
  const animFrame = useRef(0);
  const lastPipeT = useRef(0);
  const lastFrameT = useRef(0);
  const cw = useRef(420);
  const ch = useRef(650);
  const particles = useRef<Particle[]>([]);
  const trail = useRef<TrailPoint[]>([]);
  const starBursts = useRef<StarBurst[]>([]);
  const scrollFar = useRef(0);
  const scrollMid = useRef(0);
  const scrollNear = useRef(0);
  const scrollGround = useRef(0);
  const birdFrame = useRef(0);
  const flashAlpha = useRef(0);
  const shakeAmt = useRef(0);
  const graceUntil = useRef(0);
  const currentThemeIdx = useRef(0);
  const themeTransition = useRef(1); // 0→1
  const prevThemeIdx = useRef(0);
  const powerUpActive = useRef<"magnet" | "slow" | "shield" | null>(null);
  const powerUpEnd = useRef(0);
  const magnetRange = useRef(80);
  const weatherDrops = useRef<{ x: number; y: number; speed: number; size: number }[]>([]);

  // Générer gouttes/flocons/feuilles
  const initWeather = () => {
    const drops: { x: number; y: number; speed: number; size: number }[] = [];
    for (let i = 0; i < 60; i++) {
      drops.push({
        x: Math.random() * cw.current,
        y: Math.random() * (ch.current - GROUND_H),
        speed: 2 + Math.random() * 6,
        size: 1 + Math.random() * 3,
      });
    }
    weatherDrops.current = drops;
  };

  // ─── Difficulté par mode et score ────────────────────
  const getDifficulty = (s: number, mode: GameMode) => {
    const base = mode === "easy" ? 0.7 : mode === "hard" ? 1.4 : 1.0;
    return {
      pipeSpeed: (2.0 + Math.min(s * 0.04, 1.8)) * base,
      pipeGap: Math.max(mode === "easy" ? 155 : mode === "hard" ? 112 : 138, (mode === "easy" ? 210 : mode === "hard" ? 148 : 168) - s * (mode === "easy" ? 0.9 : mode === "hard" ? 2.0 : 1.4)),
      pipeInterval: Math.max(mode === "easy" ? 1400 : mode === "hard" ? 1000 : 1200, (mode === "easy" ? 1900 : mode === "hard" ? 1300 : 1600) - s * (mode === "easy" ? 8 : mode === "hard" ? 16 : 12)),
      maxStep: Math.min(mode === "easy" ? 180 : mode === "hard" ? 320 : 260, (mode === "easy" ? 80 : mode === "hard" ? 160 : 120) + s * (mode === "easy" ? 4 : mode === "hard" ? 8 : 6)),
    };
  };

  // ─── Reset ────────────────────────────────────────────
  const resetGame = useCallback(() => {
    birdY.current = ch.current / 2 - 40;
    birdVel.current = 0;
    birdRot.current = 0;
    pipes.current = [];
    lastTopH.current = null;
    scoreR.current = 0;
    coinsR.current = 0;
    particles.current = [];
    trail.current = [];
    starBursts.current = [];
    flashAlpha.current = 0;
    shakeAmt.current = 0;
    powerUpActive.current = null;
    powerUpEnd.current = 0;
    setScore(0);
    setCoins(0);
    initWeather();
  }, []);

  // ─── Particules ───────────────────────────────────────
  const spawnParticles = (x: number, y: number, color: string, n: number) => {
    for (let i = 0; i < n; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1, maxLife: 0.6 + Math.random() * 0.6,
        color, size: 2 + Math.random() * 5,
        gravity: true,
      });
    }
  };

  // ─── Fin de partie ────────────────────────────────────
  const endGame = useCallback(() => {
    gameSR.current = "gameover";
    setGameState("gameover");
    audio.crash();
    audio.stopMusic();
    flashAlpha.current = 0.55;
    shakeAmt.current = 16;
    spawnParticles(cw.current * BIRD_X_RATIO, birdY.current, "#ff5722", 28);
    spawnParticles(cw.current * BIRD_X_RATIO, birdY.current, "#ffd54f", 18);
    powerUpActive.current = null;

    const fs = scoreR.current;
    const fc = coinsR.current;
    const savedHigh = parseInt(localStorage.getItem("piaf-high") || "0", 10);
    const savedCoins = parseInt(localStorage.getItem("piaf-coins") || "0", 10);
    if (fs > savedHigh) { localStorage.setItem("piaf-high", String(fs)); setHighScore(fs); }
    if (fc > savedCoins) { localStorage.setItem("piaf-coins", String(fc)); setHighCoins(fc); }

    // Débloquer thèmes
    const totalPts = fs + fc;
    const unlocked = unlockedThemes.slice();
    if (totalPts >= 120 && !unlocked.includes(5)) { unlocked.push(5); starBursts.current.push({ x: cw.current / 2, y: ch.current / 2, life: 1, text: "🌈 Arc-en-ciel débloqué !" }); }
    else if (totalPts >= 80 && !unlocked.includes(4)) { unlocked.push(4); starBursts.current.push({ x: cw.current / 2, y: ch.current / 2, life: 1, text: "🍂 Automne débloqué !" }); }
    else if (totalPts >= 50 && !unlocked.includes(3)) { unlocked.push(3); starBursts.current.push({ x: cw.current / 2, y: ch.current / 2, life: 1, text: "🌙 Nuit débloquée !" }); }
    else if (totalPts >= 25 && !unlocked.includes(2)) { unlocked.push(2); starBursts.current.push({ x: cw.current / 2, y: ch.current / 2, life: 1, text: "🌅 Crépuscule débloqué !" }); }
    if (unlocked.length > unlockedThemes.length) {
      setUnlockedThemes(unlocked);
      localStorage.setItem("piaf-themes", JSON.stringify(unlocked));
    }
  }, [unlockedThemes]);

  // ─── Thème ────────────────────────────────────────────
  // Tire un thème au hasard parmi les débloqués. Appelé à l'entrée en "idle"
  // (l'écran "PRÊT À VOLER" doit annoncer le thème qui va vraiment servir, pas
  // un thème par défaut resté figé depuis la dernière partie) et à nouveau si
  // on relance direct depuis le game over, qui saute l'écran idle.
  const pickTheme = useCallback(() => {
    const available = unlockedThemes;
    const cur = available[Math.floor(Math.random() * available.length)];
    prevThemeIdx.current = currentThemeIdx.current;
    currentThemeIdx.current = cur;
    themeTransition.current = 0;
  }, [unlockedThemes]);

  // ─── Démarrage ────────────────────────────────────────
  const startGame = useCallback(() => {
    if (gameSR.current === "gameover") pickTheme();
    resetGame();
    gameSR.current = "playing";
    setGameState("playing");
    audio.startMusic();
    const now = performance.now();
    lastPipeT.current = now - getDifficulty(0, gameMR.current).pipeInterval + 1100;
    graceUntil.current = now + 500;
    birdVel.current = getDifficulty(0, gameMR.current).pipeSpeed * -0.9;
  }, [resetGame, pickTheme]);

  // ─── Boucle principale ────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = Math.min((lastFrameT.current ? timestamp - lastFrameT.current : 16.67) / 16.67, 2.5);
    lastFrameT.current = timestamp;

    const w = cw.current; const h = ch.current;
    const mode = gameMR.current;
    const diff = getDifficulty(scoreR.current, mode);
    const birdX = w * BIRD_X_RATIO;

    // Transition de thème
    if (themeTransition.current < 1) {
      themeTransition.current = Math.min(1, themeTransition.current + 0.015 * dt);
    }
    const theme = THEMES[currentThemeIdx.current];
    const prevTheme = THEMES[prevThemeIdx.current];
    const t = themeTransition.current;

    // ─── Update ──────────────────────────────────────────
    if (gameSR.current === "playing") {
      const spd = diff.pipeSpeed * (powerUpActive.current === "slow" ? 0.55 : 1);
      scrollFar.current += spd * 0.15 * dt;
      scrollMid.current += spd * 0.35 * dt;
      scrollNear.current += spd * 0.6 * dt;
      scrollGround.current += spd * dt;

      // Gravité
      birdVel.current = Math.min(birdVel.current + GRAVITY * dt, MAX_FALL);
      birdY.current += birdVel.current * dt;

      // Rotation fluide
      const tr = Math.min(Math.max(birdVel.current * 5, -28), 80);
      birdRot.current += (tr - birdRot.current) * 0.12 * dt;

      // Boucle d'animation de l'oiseau
      birdFrame.current += (0.22 * dt);

      // Apparition tuyaux
      if (timestamp - lastPipeT.current > diff.pipeInterval) {
        lastPipeT.current = timestamp;
        const minT = 55;
        const maxT = h - GROUND_H - diff.pipeGap - 55;
        let topH: number;
        if (lastTopH.current === null) {
          topH = (minT + maxT) / 2 + (Math.random() - 0.5) * 50;
        } else {
          const lo = Math.max(minT, lastTopH.current - diff.maxStep);
          const hi = Math.min(maxT, lastTopH.current + diff.maxStep);
          topH = lo + Math.random() * (hi - lo);
        }
        topH = Math.max(minT, Math.min(maxT, topH));
        lastTopH.current = topH;

        // Pièce (70% de chance)
        const hasCoin = Math.random() < 0.7;
        const coinY = hasCoin ? topH + diff.pipeGap / 2 : 0;

        // Power-up (8% de chance, max 1 actif)
        const hasPowerUp = Math.random() < 0.08 && !powerUpActive.current;
        const puType = (["magnet", "slow", "shield"] as const)[Math.floor(Math.random() * 3)];
        const puY = hasPowerUp ? topH + diff.pipeGap / 2 : 0;

        pipes.current.push({
          x: w,
          topH,
          gap: diff.pipeGap,
          scored: false,
          hasCoin,
          coinY,
          coinCollected: false,
          hasPowerUp,
          powerUpType: puType,
          powerUpY: puY,
          powerUpCollected: false,
          themeIdx: currentThemeIdx.current,
        });
      }

      // Déplacer tuyaux
      for (const p of pipes.current) p.x -= spd * dt;
      pipes.current = pipes.current.filter(p => p.x > -PIPE_WIDTH - 30);

      // Score + pièces + power-ups
      for (const p of pipes.current) {
        if (!p.scored && p.x + PIPE_WIDTH < birdX - BIRD_SIZE / 2) {
          p.scored = true;
          scoreR.current++;
          setScore(scoreR.current);
          if (scoreR.current % 10 === 0) {
            audio.milestone();
            starBursts.current.push({ x: birdX, y: birdY.current, life: 1, text: "⭐ +10" });
          } else {
            audio.score();
          }
          spawnParticles(birdX, birdY.current, "#FFD700", 6);
        }
        // Pièce
        if (p.hasCoin && !p.coinCollected) {
          const cx = p.x + PIPE_WIDTH / 2;
          const cy = p.coinY;
          const range = powerUpActive.current === "magnet" ? magnetRange.current : 28;
          const dx = birdX - cx; const dy = birdY.current - cy;
          if (Math.sqrt(dx * dx + dy * dy) < range) {
            p.coinCollected = true;
            if (powerUpActive.current === "magnet") {
              // animation : la pièce vole vers l'oiseau
              spawnParticles(cx, cy, "#FFD700", 10);
            }
            coinsR.current++;
            setCoins(coinsR.current);
            audio.coin();
            spawnParticles(cx, cy, "#ffeb3b", 8);
          }
        }
        // Power-up
        if (p.hasPowerUp && !p.powerUpCollected) {
          const px = p.x + PIPE_WIDTH / 2;
          const py = p.powerUpY;
          const dx = birdX - px; const dy = birdY.current - py;
          if (Math.sqrt(dx * dx + dy * dy) < 30) {
            p.powerUpCollected = true;
            powerUpActive.current = p.powerUpType;
            powerUpEnd.current = timestamp + 6000; // 6 secondes
            audio.powerUp();
            spawnParticles(px, py, "#00e5ff", 12);
            starBursts.current.push({
              x: birdX, y: birdY.current, life: 1,
              text: p.powerUpType === "magnet" ? "🧲 Aimant !" : p.powerUpType === "slow" ? "🐌 Ralenti !" : "🛡️ Bouclier !"
            });
          }
        }
      }

      // Expiration power-up
      if (powerUpActive.current && timestamp > powerUpEnd.current) {
        powerUpActive.current = null;
      }

      // Traînée
      if (gameSR.current === "playing") {
        trail.current.push({ x: birdX, y: birdY.current, life: 1 });
        if (trail.current.length > 18) trail.current.shift();
      }
      for (const tp of trail.current) tp.life -= 0.06 * dt;
      trail.current = trail.current.filter(tp => tp.life > 0);

      // Météo
      for (const d of weatherDrops.current) {
        d.y += d.speed * dt;
        if (theme.weather === "rain") d.x -= 0.5 * dt;
        if (d.y > h - GROUND_H) { d.y = -10; d.x = Math.random() * w; }
      }

      // Collisions (avec shield : on traverse les tuyaux !)
      const inGrace = timestamp < graceUntil.current;
      const bHalf = BIRD_SIZE / 2 - 4;
      const shielded = powerUpActive.current === "shield";

      if (birdY.current + bHalf > h - GROUND_H) {
        if (!shielded) { birdY.current = h - GROUND_H - bHalf; endGame(); }
        else { birdY.current = h - GROUND_H - bHalf; birdVel.current = FLAP_VELOCITY; }
      }
      if (birdY.current - bHalf < 0) {
        birdY.current = bHalf;
        birdVel.current = 0.4;
      }

      if (!inGrace && !shielded) {
        for (const p of pipes.current) {
          if (birdX + bHalf > p.x + 3 && birdX - bHalf < p.x + PIPE_WIDTH - 3) {
            if (birdY.current - bHalf < p.topH - 2 || birdY.current + bHalf > p.topH + p.gap + 2) {
              endGame(); break;
            }
          }
        }
      } else if (shielded && !inGrace) {
        // Effet visuel de bouclier
        spawnParticles(birdX, birdY.current, "rgba(0,200,255,0.8)", 0.5);
      }
    } else if (gameSR.current === "menu" || gameSR.current === "idle") {
      birdY.current = h / 2 - 40 + Math.sin(timestamp / 400) * 10;
      scrollFar.current += 0.1 * dt;
      scrollMid.current += 0.22 * dt;
      scrollNear.current += 0.38 * dt;
      scrollGround.current += 0.6 * dt;
      birdFrame.current += 0.08 * dt;
      // météo animée
      for (const d of weatherDrops.current) {
        d.y += d.speed * dt;
        if (d.y > h - GROUND_H) { d.y = -10; d.x = Math.random() * w; }
      }
    }

    // Particules
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.gravity) p.vy += 0.18 * dt;
      p.life -= 0.022 * dt;
      if (p.life <= 0) particles.current.splice(i, 1);
    }
    for (let i = starBursts.current.length - 1; i >= 0; i--) {
      starBursts.current[i].life -= 0.018 * dt;
      if (starBursts.current[i].life <= 0) starBursts.current.splice(i, 1);
    }
    if (flashAlpha.current > 0) flashAlpha.current -= 0.04 * dt;
    if (shakeAmt.current > 0) shakeAmt.current = Math.max(0, shakeAmt.current - 0.9 * dt);

    // ─── Draw ────────────────────────────────────────────
    ctx.save();
    if (shakeAmt.current > 0.3) {
      ctx.translate((Math.random() - 0.5) * shakeAmt.current, (Math.random() - 0.5) * shakeAmt.current);
    }
    ctx.clearRect(-20, -20, w + 40, h + 40);

    // Ciel
    const skyG = ctx.createLinearGradient(0, 0, 0, h - GROUND_H);
    skyG.addColorStop(0, t < 0.5 ? prevTheme.skyTop : theme.skyTop);
    skyG.addColorStop(0.4, t < 0.5 ? prevTheme.skyMid : theme.skyMid);
    skyG.addColorStop(1, t < 0.5 ? prevTheme.skyBot : theme.skyBot);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h - GROUND_H);

    // Soleil
    const sunX = w * 0.82;
    const sunG = ctx.createRadialGradient(sunX, 65, 0, sunX, 65, 55);
    const sc = t < 0.5 ? prevTheme.sunColor : theme.sunColor;
    sunG.addColorStop(0, sc);
    sunG.addColorStop(0.6, sc + "88");
    sunG.addColorStop(1, "transparent");
    ctx.fillStyle = sunG;
    ctx.beginPath(); ctx.arc(sunX, 65, 55, 0, Math.PI * 2); ctx.fill();

    // Arc-en-ciel (thème 6)
    if (currentThemeIdx.current === 5 && t > 0.3) {
      const alpha = Math.min(1, (t - 0.3) / 0.7) * 0.35;
      const rainbowColors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];
      for (let ri = 0; ri < rainbowColors.length; ri++) {
        ctx.strokeStyle = rainbowColors[ri];
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(w * 0.5, h - GROUND_H + 120, 300 + ri * 8, Math.PI, Math.PI * 1.6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Nuages
    ctx.fillStyle = t < 0.5 ? prevTheme.cloudColor : theme.cloudColor;
    const cloudCycle = w + 200;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 230 - scrollFar.current * 2) % cloudCycle + cloudCycle) % cloudCycle - 100;
      drawCloud(ctx, cx, 50 + (i % 3) * 55, 30 + (i % 2) * 14);
    }

    // Montagnes
    const mc = t < 0.5 ? prevTheme.mountainColor : theme.mountainColor;
    ctx.fillStyle = mc;
    const mCyc = MOUNTAINS.length * 200;
    for (const m of MOUNTAINS) {
      const mx = ((m.x - scrollFar.current) % mCyc + mCyc) % mCyc - 200;
      if (mx > w + 200) continue;
      ctx.beginPath();
      ctx.moveTo(mx - m.w / 2, h - GROUND_H);
      ctx.lineTo(mx, h - GROUND_H - m.h);
      ctx.lineTo(mx + m.w / 2, h - GROUND_H);
      ctx.closePath(); ctx.fill();
      if (currentThemeIdx.current !== 4) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(mx - m.w * 0.1, h - GROUND_H - m.h + m.h * 0.2);
        ctx.lineTo(mx, h - GROUND_H - m.h);
        ctx.lineTo(mx + m.w * 0.1, h - GROUND_H - m.h + m.h * 0.2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = mc;
      }
    }

    // Collines
    const hc = t < 0.5 ? prevTheme.hillColor : theme.hillColor;
    ctx.fillStyle = hc;
    const hCyc = HILLS.length * 200;
    for (const hill of HILLS) {
      const hx = ((hill.x - scrollMid.current) % hCyc + hCyc) % hCyc - 200;
      if (hx > w + 200) continue;
      ctx.beginPath();
      ctx.ellipse(hx, h - GROUND_H + hill.h * 0.35, hill.w * 0.7, hill.h, 0, Math.PI, 0);
      ctx.fill();
    }

    // Arbres
    const tc = t < 0.5 ? prevTheme.treeColor : theme.treeColor;
    const tCyc = TREES.length * 200;
    for (const tree of TREES) {
      const tx = ((tree.x - scrollNear.current) % tCyc + tCyc) % tCyc - 200;
      if (tx > w + 100) continue;
      ctx.fillStyle = "rgba(80,55,35,0.75)";
      ctx.fillRect(tx - 2.5, h - GROUND_H - tree.h * 0.4, 5, tree.h * 0.4);
      ctx.fillStyle = tc;
      ctx.beginPath();
      ctx.arc(tx, h - GROUND_H - tree.h * 0.5, tree.h * 0.42, 0, Math.PI * 2);
      ctx.arc(tx - tree.h * 0.28, h - GROUND_H - tree.h * 0.38, tree.h * 0.3, 0, Math.PI * 2);
      ctx.arc(tx + tree.h * 0.28, h - GROUND_H - tree.h * 0.38, tree.h * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brume
    const hzG = ctx.createLinearGradient(0, h - GROUND_H - 50, 0, h - GROUND_H);
    hzG.addColorStop(0, "rgba(168,224,245,0)");
    hzG.addColorStop(1, "rgba(168,224,245,0.3)");
    ctx.fillStyle = hzG;
    ctx.fillRect(0, h - GROUND_H - 50, w, 50);

    // Tuyaux
    for (const p of pipes.current) {
      const pt = THEMES[p.themeIdx] || theme;
      drawPipe(ctx, p.x, 0, p.topH, false, pt);
      drawPipe(ctx, p.x, p.topH + p.gap, h - GROUND_H - p.topH - p.gap, true, pt);

      // Pièce non ramassée
      if (p.hasCoin && !p.coinCollected) {
        const coinPhase = timestamp / 300;
        const coinScale = 0.8 + Math.sin(coinPhase * 2) * 0.2;
        ctx.save();
        ctx.translate(p.x + PIPE_WIDTH / 2, p.coinY);
        ctx.scale(coinScale, coinScale);
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#b8860b"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#fff176";
        ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 1);
        ctx.restore();
      }

      // Power-up non ramassé
      if (p.hasPowerUp && !p.powerUpCollected) {
        const puPhase = timestamp / 350;
        const puYOff = Math.sin(puPhase * 1.5) * 6;
        ctx.save();
        ctx.translate(p.x + PIPE_WIDTH / 2, p.powerUpY + puYOff);
        const puColors: Record<string, string> = { magnet: "#e040fb", slow: "#00bcd4", shield: "#4caf50" };
        const puIcons: Record<string, string> = { magnet: "🧲", slow: "🐌", shield: "🛡️" };
        ctx.fillStyle = puColors[p.powerUpType] || "#fff";
        ctx.beginPath();
        ctx.roundRect(-12, -12, 24, 24, 8);
        ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = "14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(puIcons[p.powerUpType] || "?", 0, 0);
        ctx.restore();
      }
    }

    // Sol
    const gg = ctx.createLinearGradient(0, h - GROUND_H, 0, h);
    gg.addColorStop(0, t < 0.5 ? prevTheme.ground1 : theme.ground1);
    gg.addColorStop(0.4, t < 0.5 ? prevTheme.ground2 : theme.ground2);
    gg.addColorStop(1, t < 0.5 ? prevTheme.ground3 : theme.ground3);
    ctx.fillStyle = gg;
    ctx.fillRect(-20, h - GROUND_H, w + 40, GROUND_H + 20);
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, h - GROUND_H); ctx.lineTo(w + 20, h - GROUND_H); ctx.stroke();

    const gOff = scrollGround.current % 14;
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
    for (let gx = -14; gx < w + 14; gx += 14) {
      const sw = Math.sin(timestamp / 250 + gx * 0.5) * 2.5;
      ctx.beginPath();
      ctx.moveTo(gx - gOff, h - GROUND_H);
      ctx.quadraticCurveTo(gx - gOff + sw, h - GROUND_H - 9, gx - gOff + sw * 1.6, h - GROUND_H - 13);
      ctx.stroke();
    }

    // Traînée
    for (const tp of trail.current) {
      ctx.fillStyle = `rgba(255,200,50,${tp.life * 0.5})`;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, BIRD_SIZE * 0.35 * tp.life, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particules
    for (const p of particles.current) {
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Star bursts
    for (const sb of starBursts.current) {
      ctx.save();
      ctx.globalAlpha = sb.life;
      ctx.fillStyle = "#FFD700";
      ctx.font = `bold ${16 + (1 - sb.life) * 12}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(sb.text, sb.x, sb.y - (1 - sb.life) * 35);
      ctx.restore();
    }

    // Météo
    if (theme.weather !== "none") {
      for (const d of weatherDrops.current) {
        ctx.fillStyle = theme.weather === "rain" ? "rgba(180,210,255,0.7)" :
          theme.weather === "snow" ? "rgba(255,255,255,0.8)" :
          "rgba(200,120,30,0.7)";
        if (theme.weather === "rain") {
          ctx.fillRect(d.x, d.y, 1.5, d.size * 4);
        } else if (theme.weather === "snow") {
          ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.size, d.size * 0.5, Math.sin(timestamp / 500 + d.x) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Oiseau
    const bx = birdX; const by = birdY.current;
    // Ombre
    const sY = h - GROUND_H + 8;
    const dist = Math.max(0, Math.min(1, (sY - by) / 400));
    ctx.fillStyle = `rgba(0,0,0,${0.2 * (1 - dist * 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(bx, sY, BIRD_SIZE * 0.55 * (1 - dist * 0.4), BIRD_SIZE * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bouclier
    if (powerUpActive.current === "shield") {
      ctx.save();
      ctx.fillStyle = "rgba(0,200,255,0.2)";
      ctx.strokeStyle = "rgba(0,200,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, BIRD_SIZE * 1.1, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // Aimant
    if (powerUpActive.current === "magnet") {
      ctx.save();
      ctx.fillStyle = "rgba(224,64,251,0.15)";
      ctx.beginPath();
      ctx.arc(bx, by, magnetRange.current, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((birdRot.current * Math.PI) / 180);
    drawBird(ctx, 0, 0, BIRD_SIZE, Math.sin(birdFrame.current) * 4);
    ctx.restore();

    // HUD en jeu
    if (gameSR.current === "playing") {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      ctx.fillStyle = "white"; ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 5;
      ctx.font = "bold 48px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const stxt = String(scoreR.current);
      ctx.strokeText(stxt, w / 2, 50);
      ctx.fillText(stxt, w / 2, 50);

      // Niveau
      const lv = Math.floor(scoreR.current / 10) + 1;
      ctx.font = "bold 13px sans-serif"; ctx.lineWidth = 3;
      ctx.strokeText(`Niveau ${lv}`, w / 2, 82);
      ctx.fillStyle = "#ffe082"; ctx.fillText(`Niveau ${lv}`, w / 2, 82);

      // Pièces
      ctx.font = "bold 18px sans-serif"; ctx.lineWidth = 3;
      ctx.strokeText(`💰 ${coinsR.current}`, w - 50, 36);
      ctx.fillStyle = "#ffd700"; ctx.fillText(`💰 ${coinsR.current}`, w - 50, 36);

      // Power-up actif
      if (powerUpActive.current) {
        const remaining = Math.max(0, Math.ceil((powerUpEnd.current - timestamp) / 1000));
        const puLabels: Record<string, string> = { magnet: "🧲", slow: "🐌", shield: "🛡️" };
        ctx.font = "bold 16px sans-serif"; ctx.lineWidth = 3;
        ctx.strokeText(`${puLabels[powerUpActive.current]} ${remaining}s`, 60, 36);
        ctx.fillStyle = "#00e5ff"; ctx.fillText(`${puLabels[powerUpActive.current]} ${remaining}s`, 60, 36);
      }

      ctx.restore();
    }

    // Flash
    if (flashAlpha.current > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha.current})`;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }

    ctx.restore();
    animFrame.current = requestAnimationFrame(gameLoop);
  }, [endGame]);

  // ─── Dessins ──────────────────────────────────────────
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
    ctx.beginPath();
    ctx.arc(x, y, w * 0.5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.35, y - w * 0.08, w * 0.38, 0, Math.PI * 2);
    ctx.arc(x + w * 0.7, y, w * 0.43, 0, Math.PI * 2);
    ctx.arc(x + w * 0.35, y + w * 0.1, w * 0.33, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, h: number, isBot: boolean, theme: Theme) => {
    if (h <= 0) return;
    const PW = PIPE_WIDTH; const CH = 26; const CE = 6;
    const bg = ctx.createLinearGradient(x, 0, x + PW, 0);
    bg.addColorStop(0, theme.pipeBody1); bg.addColorStop(0.3, theme.pipeBody2);
    bg.addColorStop(0.5, theme.pipeCap2); bg.addColorStop(0.7, theme.pipeBody2);
    bg.addColorStop(1, theme.pipeBody1);
    ctx.fillStyle = bg; ctx.fillRect(x, y, PW, h);
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(x + 8, y, 5, h);
    ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(x + PW - 10, y, 5, h);

    const cY = isBot ? y : y + h - CH;
    const cg = ctx.createLinearGradient(x - CE, cY, x + PW + CE, cY);
    cg.addColorStop(0, theme.pipeCap1); cg.addColorStop(0.4, theme.pipeCap2);
    cg.addColorStop(0.6, theme.pipeCap2); cg.addColorStop(1, theme.pipeCap1);
    ctx.fillStyle = cg; ctx.fillRect(x - CE, cY, PW + CE * 2, CH);
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
    ctx.strokeRect(x - CE, cY, PW + CE * 2, CH);
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(x - CE + 2, cY + 2, PW + CE * 2 - 4, 4);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, wo: number) => {
    const r = s / 2;
    // Queue
    ctx.fillStyle = "#e6a800"; ctx.beginPath();
    ctx.moveTo(x - r * 0.78, y); ctx.lineTo(x - r * 1.35, y - r * 0.3); ctx.lineTo(x - r * 1.35, y + r * 0.3);
    ctx.closePath(); ctx.fill();
    // Corps
    const bg = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
    bg.addColorStop(0, "#ffd54f"); bg.addColorStop(0.5, "#ffca28"); bg.addColorStop(1, "#ffa000");
    ctx.fillStyle = bg; ctx.beginPath();
    ctx.ellipse(x, y, r * 0.94, r * 0.83, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#e65100"; ctx.lineWidth = 1.4; ctx.stroke();
    // Ventre
    ctx.fillStyle = "#fff9c4"; ctx.beginPath();
    ctx.ellipse(x + r * 0.14, y + r * 0.22, r * 0.48, r * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    // Aile
    const wg = ctx.createLinearGradient(x, y - r * 0.4, x, y + r * 0.4);
    wg.addColorStop(0, "#ff9800"); wg.addColorStop(1, "#e65100");
    ctx.fillStyle = wg; ctx.beginPath();
    ctx.ellipse(x - r * 0.2, y + wo * 0.5, r * 0.48, r * 0.3, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#bf360c"; ctx.lineWidth = 1; ctx.stroke();
    // Œil
    ctx.fillStyle = "white"; ctx.beginPath();
    ctx.arc(x + r * 0.5, y - r * 0.26, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#333"; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = "#1a1a2e"; ctx.beginPath();
    ctx.arc(x + r * 0.56, y - r * 0.26, r * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath();
    ctx.arc(x + r * 0.6, y - r * 0.32, r * 0.045, 0, Math.PI * 2); ctx.fill();
    // Bec
    ctx.fillStyle = "#ff5722"; ctx.beginPath();
    ctx.moveTo(x + r * 0.73, y - r * 0.05);
    ctx.quadraticCurveTo(x + r * 1.22, y + r * 0.02, x + r * 0.73, y + r * 0.17);
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#bf360c"; ctx.lineWidth = 0.7; ctx.stroke();
    // Joue
    ctx.fillStyle = "rgba(255,100,100,0.3)"; ctx.beginPath();
    ctx.arc(x + r * 0.27, y + r * 0.12, r * 0.12, 0, Math.PI * 2); ctx.fill();
  };

  // ─── Contrôles ────────────────────────────────────────
  const FLAP_VELOCITY = -5.6;

  const doStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleFlap = useCallback(() => {
    audio.init();
    if (gameSR.current === "idle") {
      doStart();
    } else if (gameSR.current === "playing") {
      birdVel.current = FLAP_VELOCITY;
      audio.flap();
      spawnParticles(cw.current * BIRD_X_RATIO - 8, birdY.current + 8, "#fff9c4", 3);
    } else if (gameSR.current === "gameover") {
      doStart();
    }
  }, [doStart]);

  // Clavier
  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (!e.repeat) {
          if (gameSR.current === "menu") {
            // en menu : sélectionner normal et démarrer
            setGameMode("normal"); gameMR.current = "normal";
            setGameState("idle"); gameSR.current = "idle";
            resetGame();
            pickTheme();
          } else {
            handleFlap();
          }
        }
      }
      if (e.code === "KeyF") { e.preventDefault(); toggleFullscreen(); }
      if (e.code === "KeyM") { e.preventDefault(); setIsMuted(m => { audio.muted = !m; return !m; }); }
    };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [handleFlap, resetGame, pickTheme]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current; if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const f = () => { setIsFullscreen(!!document.fullscreenElement); setTimeout(() => window.dispatchEvent(new Event("resize")), 80); };
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  // Canvas + boucle
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => {
      let mw: number, mh: number;
      if (document.fullscreenElement) { mw = window.innerWidth; mh = window.innerHeight; }
      else { mw = Math.min(window.innerWidth - 16, 480); mh = Math.min(window.innerHeight - 180, 680); }
      cw.current = mw; ch.current = mh;
      canvas.width = mw; canvas.height = mh;
      canvas.style.width = mw + "px"; canvas.style.height = mh + "px";
      if (gameSR.current !== "playing") birdY.current = mh / 2 - 40;
      else birdY.current = Math.min(birdY.current, mh - GROUND_H - BIRD_SIZE);
      initWeather();
    };
    resize();
    window.addEventListener("resize", resize);
    lastFrameT.current = 0;
    initWeather();
    animFrame.current = requestAnimationFrame(gameLoop);
    return () => { cancelAnimationFrame(animFrame.current); window.removeEventListener("resize", resize); audio.stopMusic(); };
  }, [gameLoop]);

  const lv = Math.floor(score / 10) + 1;
  const theme = THEMES[currentThemeIdx.current] || THEMES[0];

  // ─── Rendu ────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900 p-2 select-none">
      {/* Menu principal */}
      {gameState === "menu" && (
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 drop-shadow-lg mb-2">
            🐦 Piaf
          </h1>
          <p className="text-emerald-300/80 text-sm font-medium tracking-wide mb-1">
            Créé par Hylst - Geoffroy avec l'aide d'une IA
          </p>
          <button
            onClick={() => setShowInfo(true)}
            className="text-white/40 text-xs underline decoration-dotted hover:text-white/70 transition-colors mb-8 cursor-pointer"
          >
            ℹ️ Comment ce jeu a été fait
          </button>

          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Choisissez votre difficulté</h2>

            {([
              { mode: "easy" as GameMode, label: "🐣 Facile", desc: "Tuyaux larges, vitesse réduite", color: "from-green-500 to-emerald-600" },
              { mode: "normal" as GameMode, label: "🐦 Normal", desc: "Difficulté équilibrée", color: "from-amber-500 to-orange-600" },
              { mode: "hard" as GameMode, label: "🦅 Expert", desc: "Tuyaux serrés, vitesse élevée", color: "from-red-500 to-rose-600" },
            ] as const).map(({ mode: m, label, desc, color }) => (
              <button
                key={m}
                onClick={() => {
                  setGameMode(m); gameMR.current = m;
                  setGameState("idle"); gameSR.current = "idle";
                  resetGame();
                  pickTheme();
                }}
                className={`w-64 py-4 rounded-2xl font-black text-white text-xl shadow-xl bg-gradient-to-r ${color} hover:scale-105 active:scale-95 transition-all border-2 border-white/20`}
              >
                {label}
                <div className="text-xs font-normal mt-1 opacity-80">{desc}</div>
              </button>
            ))}
          </div>

          {/* Thèmes débloqués */}
          <div className="mt-8">
            <div className="text-white/60 text-xs mb-2">Thèmes débloqués :</div>
            <div className="flex flex-wrap justify-center gap-2">
              {THEMES.map((th, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    unlockedThemes.includes(i)
                      ? "bg-white/15 text-white cursor-default"
                      : "bg-white/5 text-white/20 line-through"
                  }`}
                >
                  {["🌅", "☀️", "🌇", "🌙", "🍂", "🌈"][i]} {th.name}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-3 text-white/40 text-xs">
              <span>🏆 Record: {highScore}</span>
              <span>💰 Record pièces: {highCoins}</span>
            </div>
            <p className="text-white/30 text-[10px] mt-3">
              Débloquez des thèmes en cumulant score + pièces
            </p>
          </div>
        </div>
      )}

      {/* En-tête (jeu) */}
      {gameState !== "menu" && !isFullscreen && (
        <div className="mb-2 text-center">
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 drop-shadow-lg mb-0.5">
            🐦 Piaf
          </h1>
          <p className="text-emerald-300/80 text-[11px] font-medium tracking-wide">
            Créé par Hylst - Geoffroy • Mode {gameMode === "easy" ? "Facile" : gameMode === "hard" ? "Expert" : "Normal"}
          </p>
        </div>
      )}

      {/* Scores (hors plein écran) */}
      {gameState !== "menu" && !isFullscreen && (
        <div className="flex items-center gap-3 mb-2">
          <Stat label="Score" value={score} color="text-amber-300" />
          <Stat label="Pièces" value={coins} color="text-yellow-300" icon="💰" />
          <Stat label="Record" value={highScore} color="text-emerald-300" />
          <Stat label="Niv." value={lv} color="text-sky-300" />
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className={isFullscreen ? "relative bg-black w-full h-full" : "relative"}>
        <div
          className={
            "relative cursor-pointer overflow-hidden " +
            (isFullscreen ? "" : "rounded-3xl shadow-2xl shadow-black/50 border-4 border-emerald-600 hover:border-emerald-500 transition-colors")
          }
          onPointerDown={(e) => {
            e.preventDefault();
            if (gameSR.current === "menu") return;
            handleFlap();
          }}
        >
          <canvas ref={canvasRef} className="block touch-none" />

          {/* Boutons overlay */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <IconBtn
              icon={isMuted ? "🔇" : "🔊"}
              onClick={() => { setIsMuted(m => { audio.muted = !m; return !m; }); }}
              title={isMuted ? "Activer le son (M)" : "Couper le son (M)"}
            />
            <IconBtn
              icon={isFullscreen ? "🗗" : "⛶"}
              onClick={toggleFullscreen}
              title={isFullscreen ? "Quitter plein écran (F)" : "Plein écran (F)"}
            />
            {gameState === "gameover" && (
              <IconBtn
                icon="🔄"
                onClick={() => {
                  setGameState("menu"); gameSR.current = "menu";
                }}
                title="Retour au menu"
              />
            )}
          </div>

          {/* Score plein écran */}
          {isFullscreen && gameSR.current === "playing" && (
            <div className="absolute top-3 left-3 flex gap-3 z-10 pointer-events-none">
              <div className="bg-black/40 backdrop-blur rounded-xl px-4 py-1.5 border border-white/20 text-center">
                <span className="text-yellow-300 text-[10px] font-semibold uppercase">Pièces</span>
                <div className="text-xl font-black text-white leading-tight">💰 {coins}</div>
              </div>
            </div>
          )}

          {/* Overlay idle */}
          {gameState === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/45 backdrop-blur-sm rounded-3xl px-8 py-5 text-center mx-4">
                <div className="text-5xl mb-2 animate-bounce">🐦</div>
                <div className="text-white text-xl font-black mb-1">PRÊT À VOLER ?</div>
                <div className="text-white/70 text-xs mb-3">
                  Mode {gameMode === "easy" ? "🐣 Facile" : gameMode === "hard" ? "🦅 Expert" : "🐦 Normal"}
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-white/70 text-xs">
                  <kbd className="bg-white/15 px-2 py-0.5 rounded font-mono">Espace</kbd>
                  <kbd className="bg-white/15 px-2 py-0.5 rounded font-mono">↑</kbd>
                  <kbd className="bg-white/15 px-2 py-0.5 rounded font-mono">W</kbd>
                  <span>voler</span>
                </div>
                <div className="mt-2 text-amber-300/80 text-[11px]">
                  Thème : {theme.name} {["🌅","☀️","🌇","🌙","🍂","🌈"][currentThemeIdx.current]}
                </div>
              </div>
            </div>
          )}

          {/* Overlay gameover */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25 backdrop-blur-[1px]">
              <div className="bg-gradient-to-b from-amber-100 to-orange-100 rounded-3xl px-8 py-5 shadow-2xl text-center border-4 border-amber-400 mx-4">
                <div className="text-3xl mb-1">💥</div>
                <div className="text-xl font-black text-amber-800 mb-2">PERDU !</div>
                <div className="flex justify-center gap-5 mb-3">
                  <MiniStat label="Score" value={score} color="text-sky-700" />
                  <MiniStat label="Pièces" value={coins} color="text-yellow-600" />
                  <MiniStat label="Niveau" value={lv} color="text-emerald-700" />
                  <MiniStat label="Record" value={highScore} color="text-purple-700" />
                </div>
                {score === highScore && score > 0 && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-sm py-1 px-4 rounded-full mb-2 animate-pulse inline-block">
                    🏆 NOUVEAU RECORD !
                  </div>
                )}
                <div className="text-slate-500 text-sm">Tapez pour rejouer • 🔄 Menu</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aide touches */}
      {gameState !== "menu" && !isFullscreen && (
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-white/35 text-[11px]">
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono">Espace</kbd> Voler</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono">F</kbd> Plein écran</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono">M</kbd> Son</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono">🔄</kbd> Menu</span>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-3.5 text-sm leading-relaxed text-white/80">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">Comment ce jeu a été fait</h3>
              <p><strong className="text-white">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, compilé en un seul fichier HTML, aucune dépendance chargée depuis l'extérieur.</p>
              <p><strong className="text-white">Graphismes :</strong> tout est dessiné en Canvas 2D à chaque image (oiseau, tuyaux, décor de thème), aucun sprite ni image externe.</p>
              <p><strong className="text-white">Musique &amp; sons :</strong> synthétisés en direct avec l'API Web Audio, aucun fichier audio chargé.</p>
              <p><strong className="text-white">Interactions :</strong> clic, tactile ou espace pour battre des ailes une fois, la gravité fait redescendre l'oiseau entre deux battements.</p>
              <p><strong className="text-white">Architecture :</strong> une seule boucle de jeu Canvas qui met à jour la physique et redessine chaque image, l'état du jeu (position, tuyaux, pièces) vit dans des références pour éviter les re-rendus React inutiles.</p>
              <p><strong className="text-white">Algorithmes notables :</strong> l'écart entre les tuyaux se resserre progressivement avec le score plutôt que par palier fixe, jusqu'à un minimum propre à chaque difficulté. 6 thèmes visuels à débloquer en cumulant score et pièces.</p>
            </div>
            <div className="border-t border-white/10 p-4 text-center">
              <button onClick={() => setShowInfo(false)} className="px-6 py-2.5 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Petits composants helper ───────────────────────────
function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon?: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-1 border border-white/20 text-center min-w-[60px]">
      <span className={`${color} text-[10px] font-semibold uppercase tracking-wider`}>{label}</span>
      <div className="text-xl font-black text-white leading-tight">{icon}{value}</div>
    </div>
  );
}
function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-amber-600 text-[9px] font-bold uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}
function IconBtn({ icon, onClick, title }: { icon: string; onClick: (e: React.PointerEvent) => void; title: string }) {
  return (
    <button
      onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onClick(e); }}
      className="bg-black/40 hover:bg-black/60 backdrop-blur text-white rounded-xl w-10 h-10 flex items-center justify-center text-lg transition-colors border border-white/20"
      title={title}
    >
      {icon}
    </button>
  );
}