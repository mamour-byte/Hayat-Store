
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  AIResponse,
  AIMessage,
} from "../../features/ai-assistant/types/ai-assistant.types";
import "../../styles/aiOrbAssistant.css";

export type { AIProduct, AIResponse } from "../../features/ai-assistant/types/ai-assistant.types";

/* ───────────────────────────── textes ───────────────────────────── */
const COPY = {
  open: "Ouvrir l'assistant",
  placeholder: "Posez votre question…",
  labels: ["Réflexion", "Recherche", "Analyse", "Rédaction"],
  done: "Terminé",
  answerTitle: "Réponse",
  ready: "Réponse prête : ",
  send: "Envoyer",
  mic: "Enregistrer un message vocal",
  cancelRec: "Annuler l'enregistrement",
  recording: "Enregistrement en cours",
  micError: "Micro inaccessible. Autorisez-le dans votre navigateur.",
  micDenied: "Accès au micro refusé. Autorisez-le dans votre navigateur.",
  micNotFound: "Aucun micro détecté sur cet appareil.",
  micUnsupported: "L'enregistrement vocal n'est pas disponible sur ce navigateur.",
  voiceLabel: "Message vocal",
  voiceTooShort: "Message vocal trop court. Parlez un peu plus longtemps.",
  voiceTooLarge: "Fichier audio trop volumineux (10 Mo maximum).",
  emptyAnswer: "Je n'ai pas pu obtenir de réponse. Pouvez-vous reformuler ?",
  assistantTitle: "Assistant Hayat",
  conversationActive: "Conversation en cours",
  retry: "Réessayer",
  newConversation: "Nouvelle conversation",
  offline: "Vous êtes hors ligne. L'assistant reviendra dès que la connexion sera rétablie.",
  welcome: "Bonjour ! Je suis l'assistant Hayat. Posez-moi une question sur nos produits, les stocks ou votre commande.",
};

type Phase =
  | "dock" | "opening" | "idle" | "launch" | "assemble" | "think"
  | "resolve" | "condense" | "unfold" | "answered" | "thinking"
  | "reset" | "closing";

export interface MorphOrbProps {
  /**
   * `text` = message écrit (vide si note vocale), `audio` = note vocale,
   * `conversationId` = conversation en cours (absent au premier message).
   */
  onSubmit: (
    text: string,
    audio?: Blob,
    conversationId?: string
  ) => Promise<AIResponse>;
  minThinkMs?: number;
  speed?: number;
  /** Coin où flotte le bouton (défaut : bas droite) */
  corner?: "bottom-right" | "bottom-left";
  /** Durée max d'une note vocale, en secondes (bornée entre 5 et 120). */
  maxRecordSeconds?: number;
  /** Premier message affiché dans le transcript. */
  welcomeMessage?: string;
  /** Suggestions proposées avant le premier échange. */
  initialSuggestions?: string[];
}

/* ─────────────────────────── géométrie ─────────────────────────── */
const PILL_H = 60, BALL_SMALL = 60, ORB_D = 132, ORB_R = 66, CANVAS = 220;
const FAB = 64;                       // taille du bouton flottant (rond)
const DOCK_M = 24;                    // marge du bouton par rapport au bord de l'écran
const DOCK_DY = 96 - (DOCK_M + FAB / 2); // écart vertical entre le bouton et le champ ouvert
const CARD_MIN = 220;
const FLY_D = 138;
const pillW = () => Math.min(560, window.innerWidth - 32);
/** Le transcript doit être lisible sur mobile et assez large pour 2 fiches produits sur desktop. */
const cardW = () => Math.min(720, window.innerWidth - 24);
const cardMaxH = () => Math.min(window.innerHeight * 0.72, 660);
const homeDy = () => window.innerHeight * 0.54 - 96; // centre du champ : 96px au-dessus du bas ; centre de scène : top 46%

const estimateCardHeight = (
  messages: AIMessage[],
  hasError: boolean,
  isOnline: boolean
) => {
  const width = cardW();
  const charsPerLine = Math.max(24, Math.floor((width - 48) / 7.4));
  const linesOf = (text: string) =>
    Math.max(1, Math.ceil(text.length / charsPerLine));
  const columns = width >= 520 ? 2 : 1;

  let height = 48 + 66 + 24; // en-tête, composeur, paddings
  if (!isOnline) height += 44;
  if (hasError) height += 52;

  for (const message of messages) {
    if (message.pending) {
      height += 56;
      continue;
    }
    height += 28 + Math.min(linesOf(message.text), 8) * 21;
    if (message.products?.length) {
      height += Math.ceil(message.products.length / columns) * 126 + 10;
    }
    if (message.suggestions?.length) height += 46;
  }

  return Math.round(
    Math.min(cardMaxH(), Math.max(CARD_MIN, height))
  );
};

/* ───────────────────────── maths + easing ───────────────────────── */
type Ease = (t: number) => number;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (v: number) => String(Math.round(v * 1e4) / 1e4);
const TAU = Math.PI * 2;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const e = sx(t);
      if (Math.abs(e - x) < 1e-6) break;
      if (x > e) lo = t; else hi = t;
      t = (hi - lo) / 2 + lo;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
}

const E = {
  out: cubicBezier(0.22, 1, 0.36, 1),
  io: cubicBezier(0.65, 0, 0.35, 1),
  in: cubicBezier(0.4, 0, 1, 1),
  fly: cubicBezier(0.5, 0, 0.1, 1),
  grow: cubicBezier(0.3, 0, 0.2, 1),
  vortex: cubicBezier(0.6, 0, 0.2, 1),
  spring: cubicBezier(0.34, 1.4, 0.64, 1),
  card: cubicBezier(0.65, 0, 0.2, 1),
  lin: (t: number) => t,
};

const bez = (t: number, p0: number, c: number, p2: number) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * c + t * t * p2;

/* ───────────────────────── timeline ───────────────────────── */
interface Track { ch: string; from: number; to: number; t0: number; t1: number; ease?: Ease }
const T = (ch: string, from: number, to: number, t0: number, t1: number, ease: Ease = E.io): Track => ({ ch, from, to, t0, t1, ease });

interface Geo { pw: number; cw: number; H: number; dir: number; hx: number; ch: number }

/* bouton flottant → champ (le bouton glisse vers le bas-centre en s'élargissant) */
const openTracks = (g: Geo): Track[] => [
  T("dk", 1, 0, 0, 620, E.io),
  T("w", FAB, g.pw, 0, 620, E.grow),
  T("oFab", 1, 0, 0, 180, E.out),
  T("oScrim", 0, 1, 0, 500, E.out),
  T("oInput", 0, 1, 260, 520, E.out),
  T("inScale", 0.92, 1, 260, 520, E.out),
];
/* champ → bouton flottant */
const closeTracks = (g: Geo): Track[] => [
  T("oInput", 1, 0, 0, 160, E.in),
  T("inScale", 1, 0.92, 0, 160, E.in),
  T("oScrim", 1, 0, 0, 500, E.out),
  T("dk", 0, 1, 120, 640, E.io),
  T("w", g.pw, FAB, 120, 640, E.io),
  T("oFab", 0, 1, 420, 640, E.out),
];
const rOpenTracks = (g: Geo): Track[] => [
  T("dk", 1, 0, 0, 1, E.lin),
  T("w", FAB, g.pw, 0, 1, E.lin),
  T("oFab", 1, 0, 0, 150, E.out),
  T("oScrim", 0, 1, 0, 200, E.out),
  T("oInput", 0, 1, 0, 200, E.out),
];
const rCloseTracks = (g: Geo): Track[] => [
  T("oInput", 1, 0, 0, 150, E.out),
  T("oScrim", 1, 0, 0, 200, E.out),
  T("dk", 0, 1, 150, 151, E.lin),
  T("w", g.pw, FAB, 150, 151, E.lin),
  T("oFab", 0, 1, 150, 350, E.out),
];

/* carte de conversation → bouton flottant */
const closeCardTracks = (g: Geo): Track[] => [
  T("oCard", 1, 0, 0, 240, E.in),
  T("hOp", 1, 0, 0, 160, E.in),
  T("dotS", 1, 0, 0, 160, E.in),
  T("oScrim", 1, 0, 0, 500, E.out),
  T("w", g.cw, FAB, 80, 620, E.io),
  T("h", g.ch, FAB, 80, 620, E.io),
  T("r", 20, FAB / 2, 80, 620, E.io),
  T("dk", 0, 1, 320, 640, E.io),
  T("oFab", 0, 1, 400, 640, E.out),
];
const rCloseCardTracks = (g: Geo): Track[] => [
  T("oCard", 1, 0, 0, 150, E.out),
  T("hOp", 1, 0, 0, 150, E.out),
  T("oScrim", 1, 0, 0, 200, E.out),
  T("w", g.cw, FAB, 150, 151, E.lin),
  T("h", g.ch, FAB, 150, 151, E.lin),
  T("r", 20, FAB / 2, 150, 151, E.lin),
  T("dk", 0, 1, 150, 151, E.lin),
  T("oFab", 0, 1, 150, 350, E.out),
];

const launchTracks = (g: Geo): Track[] => [
  T("w", g.pw, g.pw - 12, 0, 100, E.out),
  T("oInput", 1, 0, 0, 160, E.in),
  T("inScale", 1, 0.6, 0, 160, E.in),
  T("oGlow", 1, 0, 0, 300, E.out),
  T("oAur", 1, 0, 0, 300, E.out),
  T("w", g.pw - 12, BALL_SMALL, 100, 560, E.io),
  T("h", PILL_H, PILL_H + 6, 380, 500, E.out),
  T("h", PILL_H + 6, BALL_SMALL, 500, 620, E.out),
  T("oPill", 1, 0, 300, 560, E.out),
  T("oBall", 0, 1, 300, 560, E.out),
  T("u", 0, 1, 620, 1500, E.fly),
  T("w", BALL_SMALL, FLY_D, 620, 1300, E.grow),
  T("h", BALL_SMALL, FLY_D, 620, 1300, E.grow),
  T("w", FLY_D, ORB_D, 1300, 1500, E.out),
  T("h", FLY_D, ORB_D, 1300, 1500, E.out),
  T("cHalo", 0, 0.6, 620, 1500, E.out),
  T("trail", 0, 1, 700, 800, E.out),
  T("trail", 1, 0, 1300, 1500, E.in),
];

const ASSEMBLE: Track[] = [
  T("oRing", 1, 0, 0, 300, E.out),
  T("oBall", 1, 0, 0, 260, E.out),
  T("orb.k", 0, 1, 0, 800, E.out),
  T("orb.alpha", 0, 1, 0, 800, E.out),
  T("orb.spin", 0, 0.9, 0, 800, E.out),
  T("orb.pop", 1, 1.05, 0, 420, E.out),
  T("orb.pop", 1.05, 1, 420, 800, E.io),
  T("sOp", 0, 1, 300, 620, E.out),
  T("sTy", 6, 0, 300, 620, E.out),
];

const RESOLVE: Track[] = [
  T("orb.sweep", 0, 1, 0, 700, E.io),
  T("orb.spin", 0.9, 0.3, 0, 700, E.out),
  T("orb.gain", 1, 0, 0, 700, E.out),
  T("orb.floor", 0, 0.95, 400, 900, E.out),
  T("orb.rad", 0, 0.15, 400, 900, E.out),
  T("orb.pop", 1, 1.04, 600, 800, E.out),
  T("orb.pop", 1.04, 1, 800, 900, E.out),
];

const CONDENSE: Track[] = [
  T("orb.pop", 1, 1.06, 0, 120, E.out),
  T("sOp", 1, 0, 0, 160, E.in),
  T("sTy", 0, -6, 0, 160, E.in),
  T("orb.k", 1, 0, 120, 640, E.vortex),
  T("orb.vortex", 0, 1.6, 120, 640, E.vortex),
  T("oGreen", 0, 1, 260, 700, E.spring),
  T("gs", 0.55, 1, 260, 700, E.spring),
  T("pulse", 0, 1, 320, 760, E.out),
  T("oHalo", 0, 0.35, 380, 700, E.out),
  T("orb.alpha", 1, 0, 500, 800, E.out),
];

const unfoldTracks = (g: Geo, tw: number): Track[] => [
  T("w", ORB_D, 124, 0, 90, E.in),
  T("h", ORB_D, 124, 0, 90, E.in),
  T("w", 124, g.cw, 90, 700, E.card),
  T("h", 124, g.ch, 90, 700, E.out),
  T("r", ORB_D / 2, 20, 90, 700, E.io),
  T("oGreen", 1, 0, 200, 560, E.out),
  T("oCard", 0, 1, 200, 560, E.out),
  T("oHalo", 0.35, 0, 300, 700, E.out),
  T("cHalo", 0.6, 0.22, 300, 700, E.out),
  T("hOp", 0, 1, 520, 840, E.out),
  T("dotS", 0, 1, 520, 840, E.spring),
  T("wp", 0, 1, 600, 600 + tw, E.lin),
  T("bloom", 1, 0.625, 700, 1200, E.io),
];

/* mouvement réduit : simples fondus */
const R_OUT: Track[] = [
  T("oInput", 1, 0, 0, 140, E.out),
  T("oPill", 1, 0, 0, 200, E.out),
  T("oGlow", 1, 0, 0, 200, E.out),
  T("oAur", 1, 0, 0, 200, E.out),
  T("oRing", 1, 0, 0, 200, E.out),
];
const R_IN: Track[] = [
  T("orb.alpha", 0, 1, 0, 200, E.out),
  T("sOp", 0, 1, 0, 200, E.out),
  T("cHalo", 0, 0.6, 0, 200, E.out),
];
const R_RESOLVE: Track[] = [T("orb.sweep", 0, 1, 0, 250, E.io), T("orb.floor", 0, 0.95, 0, 250, E.out)];
const R_CONDENSE: Track[] = [
  T("oGreen", 0, 1, 0, 250, E.out),
  T("orb.alpha", 1, 0, 0, 250, E.out),
  T("sOp", 1, 0, 0, 250, E.out),
];
const R_GREEN_OUT: Track[] = [T("oGreen", 1, 0, 0, 120, E.out)];
const rCardIn = (tw: number): Track[] => [
  T("oCard", 0, 1, 0, 250, E.out),
  T("hOp", 0, 1, 0, 250, E.out),
  T("wp", 0, 1, 0, tw, E.lin),
  T("bloom", 1, 0.625, 0, 250, E.out),
];

const FADE = ["oGlow", "oAur", "oPill", "oBall", "oGreen", "oCard", "oRing", "oInput", "oHalo", "sOp", "orb.alpha", "trail"];

/* état « champ ouvert, au repos » */
const INIT: Record<string, number> = {
  h: PILL_H, r: 999, oGlow: 1, oHalo: 0, oPill: 1, oBall: 0, oGreen: 0, oCard: 0, oRing: 1, oInput: 1, inScale: 1, oAur: 1,
  gs: 0.55, cs: 1, hOp: 0, dotS: 0, bloom: 1, u: 0, yOff: 0, trail: 0, pulse: -1, sOp: 0, sTy: 6, cHalo: 0, wp: 0,
  dk: 0, oFab: 0, oScrim: 1,
  "orb.k": 0, "orb.alpha": 0, "orb.spin": 0, "orb.pop": 1, "orb.sweep": 0, "orb.vortex": 0, "orb.gain": 1, "orb.floor": 0, "orb.rad": 0,
};
/* différences pour l'état « bouton flottant replié » */
const DOCKED: Record<string, number> = { oInput: 0, dk: 1, oFab: 1, oScrim: 0 };

/* ─────────────────────────── utilitaires async ─────────────────────────── */
const ABORT = Symbol("abort");

function sleep(ms: number, sig: AbortSignal) {
  return new Promise<void>((res) => {
    if (sig.aborted) return res();
    let id = 0;
    const onAbort = () => { window.clearTimeout(id); res(); };
    id = window.setTimeout(() => { sig.removeEventListener("abort", onAbort); res(); }, Math.max(0, ms));
    sig.addEventListener("abort", onAbort, { once: true });
  });
}

/** Abort => `undefined`, erreur API => rejet : le composant peut afficher un vrai état d'erreur. */
function abortable<V>(p: Promise<V>, sig: AbortSignal) {
  return new Promise<V | undefined>((res, rej) => {
    if (sig.aborted) return res(undefined);
    const onAbort = () => res(undefined);
    const cleanup = () => sig.removeEventListener("abort", onAbort);
    sig.addEventListener("abort", onAbort, { once: true });
    p.then(
      (v) => { cleanup(); res(v); },
      (e) => { cleanup(); rej(e); }
    );
  });
}

/* ───────────────────────────── orbe en points ───────────────────────────── */
const RINGS = 16;
const DOT_LIST = (() => {
  const rand = mulberry32(7);
  const out: { x: number; y: number; z: number; u: number; seed: number }[] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(30 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * TAU + k * 0.35;
      out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, u: (1 - y) / 2, seed: rand() * 6.283 });
    }
  }
  return out;
})();
const N = DOT_LIST.length;
const DX = Float32Array.from(DOT_LIST, (d) => d.x);
const DY = Float32Array.from(DOT_LIST, (d) => d.y);
const DZ = Float32Array.from(DOT_LIST, (d) => d.z);
const DU = Float32Array.from(DOT_LIST, (d) => d.u);
const DS = Float32Array.from(DOT_LIST, (d) => d.seed);

const G_STEPS = 24, A_STEPS = 48;
/* Dégradé des points de l'orbe : mint clair → vert Hayat (#008060). */
const COLORS: string[] = (() => {
  const out: string[] = [];
  for (let gi = 0; gi <= G_STEPS; gi++) {
    const g = gi / G_STEPS;
    const r = Math.round(lerp(214, 0, g)), gg = Math.round(lerp(239, 128, g)), b = Math.round(lerp(230, 96, g));
    for (let ai = 0; ai <= A_STEPS; ai++) out.push(`rgba(${r},${gg},${b},${(ai / A_STEPS).toFixed(3)})`);
  }
  return out;
})();

interface OrbParams {
  k: number; alpha: number; spin: number; rot: number; sweep: number; pop: number;
  vortex: number; gain: number; floor: number; rad: number; prog: number;
}
const ORB_KEYS = ["k", "alpha", "spin", "sweep", "pop", "vortex", "gain", "floor", "rad"] as const;

function createOrb(canvas: HTMLCanvasElement, getSpeed: () => number, isReduced: () => boolean) {
  const P: OrbParams = { k: 0, alpha: 0, spin: 0, rot: 0, sweep: 0, pop: 1, vortex: 0, gain: 1, floor: 0, rad: 0, prog: 0 };
  const ctx = canvas.getContext("2d");
  const lit = new Float32Array(N);
  const SX = new Float32Array(N), SY = new Float32Array(N), SR = new Float32Array(N), SD = new Float32Array(N);
  const SC = new Int16Array(N);
  const pw = [1, 0, 0, 0];
  let time = 0, raf = 0, last = 0, dead = false;

  const reset = () => {
    P.k = 0; P.alpha = 0; P.spin = 0; P.rot = 0; P.sweep = 0; P.pop = 1; P.vortex = 0; P.gain = 1; P.floor = 0; P.rad = 0; P.prog = 0;
    lit.fill(0);
    pw[0] = 1; pw[1] = 0; pw[2] = 0; pw[3] = 0;
    time = isReduced() ? 1.2 : 0;
  };
  reset();

  if (!ctx) return { P, ensure() {}, reset, destroy() {} };

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(CANVAS * dpr);
  canvas.height = Math.round(CANVAS * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const S = 0.6, CP = Math.cos(0.35), SP = Math.sin(0.35), C0 = CANVAS / 2;

  const draw = (dt: number) => {
    ctx.clearRect(0, 0, CANVAS, CANVAS);
    time += dt;
    P.rot += P.spin * dt;
    const yaw = P.rot + P.vortex, cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const stepW = dt / 0.35;
    for (let q = 0; q < 4; q++) {
      const d = (q === P.prog ? 1 : 0) - pw[q];
      pw[q] += Math.abs(d) <= stepW ? d : d > 0 ? stepW : -stepW;
    }
    const decay = Math.exp(-dt / 0.5);
    const h0 = (time * 300) % N, h3 = (time * 480) % N;
    const a1 = time * 0.8, b1 = Math.sin(time * 0.5) * 0.9;
    const f1x = Math.cos(b1) * Math.cos(a1), f1y = Math.sin(b1), f1z = Math.cos(b1) * Math.sin(a1);
    const a2 = time * 0.55 + 2.1, b2 = Math.cos(time * 0.42) * 0.9;
    const f2x = Math.cos(b2) * Math.cos(a2), f2y = Math.sin(b2), f2z = Math.cos(b2) * Math.sin(a2);
    const lat = Math.sin(time * 2.2);
    const swirlK = P.vortex * 1.5;

    for (let n = 0; n < N; n++) {
      const dx = DX[n], dy = DY[n], dz = DZ[n], u = DU[n];

      let pulse = 0;
      if (pw[0] > 0.001) {
        let dd = Math.abs(n - h0); if (dd > N - dd) dd = N - dd;
        const v = Math.max(0, 1 - dd / 16);
        pulse = Math.max(pulse, v * v * pw[0]);
      }
      if (pw[1] > 0.001) {
        const v1 = Math.max(0, (dx * f1x + dy * f1y + dz * f1z - 0.72) / 0.28);
        const v2 = Math.max(0, (dx * f2x + dy * f2y + dz * f2z - 0.72) / 0.28);
        const v = Math.max(v1, v2);
        pulse = Math.max(pulse, v * v * pw[1]);
      }
      if (pw[2] > 0.001) {
        const e = dy - lat;
        const v = Math.max(0, 1 - (e * e) / 0.02);
        pulse = Math.max(pulse, v * v * pw[2]);
      }
      if (pw[3] > 0.001) {
        let dd = Math.abs(n - h3); if (dd > N - dd) dd = N - dd;
        const v = Math.max(0, 1 - dd / 22);
        pulse = Math.max(pulse, v * v * pw[3]);
      }
      const l = Math.max(lit[n] * decay, pulse * P.gain);
      lit[n] = l;

      const ki = clamp01(P.k * (1 + S) - S * u);
      if (ki <= 0.001) { SC[n] = -1; continue; }
      const eo = E.out(ki), kk = eo * P.pop;

      const x1 = dx * cyw + dz * syw, z1 = -dx * syw + dz * cyw;
      const y2 = dy * CP - z1 * SP, z2 = dy * SP + z1 * CP;
      const f = 2.8 / (2.8 - z2), depth = (z2 + 1) / 2;
      let ox = x1 * ORB_R * kk * f, oy = -y2 * ORB_R * kk * f;
      if (swirlK > 0.001) {
        const sw = (1 - ki) * swirlK, cc = Math.cos(sw), ss = Math.sin(sw);
        const tx = ox * cc - oy * ss;
        oy = ox * ss + oy * cc;
        ox = tx;
      }

      const g = clamp01((P.sweep * 1.4 - u) / 0.4);
      let a = 0.1 + 0.035 * Math.sin(DS[n] + time * 1.6) * (1 - g) + 0.32 * depth * depth + 0.75 * l * (1 - g) + g * (0.55 + 0.4 * depth) + 2 * g * (1 - g);
      a = Math.max(a, P.floor * (0.7 + 0.3 * depth));
      if (a > 1) a = 1;
      a *= eo * P.alpha;

      SX[n] = C0 + ox;
      SY[n] = C0 + oy;
      SD[n] = depth;
      SR[n] = (1.15 * (0.45 + 0.75 * depth) * f + 0.9 * l + g * 0.25) * (1 + P.rad) * (0.4 + 0.6 * eo);
      const ai = Math.round(a * A_STEPS), gi = Math.round(g * G_STEPS);
      SC[n] = ai <= 0 ? -1 : gi * (A_STEPS + 1) + ai;
    }

    for (let pass = 0; pass < 2; pass++) {
      for (let n = 0; n < N; n++) {
        const c = SC[n];
        if (c < 0) continue;
        if ((SD[n] >= 0.5) !== (pass === 1)) continue;
        ctx.fillStyle = COLORS[c];
        ctx.beginPath();
        ctx.arc(SX[n], SY[n], SR[n], 0, TAU);
        ctx.fill();
      }
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (dead) return;
    const dt = isReduced() ? 0 : Math.max(0, Math.min(0.05, (now - last) / 1000)) * getSpeed();
    last = now;
    draw(dt);
    if (P.alpha > 0.002) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, CANVAS, CANVAS);
  };

  const ensure = () => {
    if (raf || dead || P.alpha <= 0.002) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const destroy = () => {
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  return { P, ensure, reset, destroy };
}

/* ───────────────────────────── runtime ───────────────────────────── */
interface UI {
  setPhase(p: Phase): void;
  swapLabel(name: string): void;
  resetLabel(): void;
  setAnswer(s: string): void;
  clearInput(): void;
  live(s: string): void;
  lock(on: boolean): void;
  idleReady(): void;
  dockReady(): void;
  focusAnswer(): void;
}
interface Env {
  root: HTMLElement; mover: HTMLElement; actor: HTMLElement; form: HTMLElement; ghosts: HTMLElement[];
  canvas: HTMLCanvasElement; pulse: HTMLElement; status: HTMLElement;
  getBody: () => HTMLElement | null;
  getCardHeight: () => number;
  ui: UI; getSpeed: () => number; isReduced: () => boolean; getSide: () => 1 | -1;
}
interface RunCfg {
  onSubmit: (text: string, audio?: Blob) => Promise<AIResponse>;
  minThink: number;
  audio?: Blob;
}
interface Runtime {
  start(text: string, cfg: RunCfg): boolean;
  /** Tour suivant : met à jour le transcript sans rejouer la transformation complète de l'orbe. */
  followUp(text: string, cfg: RunCfg): boolean;
  /** Ajuste la hauteur de la carte quand le transcript grandit. */
  resize(height: number): void;
  /** `card` = rouvrir directement la conversation en cours au lieu du champ initial. */
  open(card?: boolean): void;
  close(): void;
  escape(): void;
  reset(): void;
  hard(): void;
  home(): void;
  busy(): boolean;
  destroy(): void;
}
interface Sample { t: number; x: number; y: number; d: number }

function sampleAt(h: Sample[], t: number, out: Sample) {
  const n = h.length;
  const copy = (s: Sample) => { out.x = s.x; out.y = s.y; out.d = s.d; };
  if (n === 0) { out.x = 0; out.y = 0; out.d = 0; return; }
  if (t <= h[0].t) return copy(h[0]);
  for (let i = n - 1; i > 0; i--) {
    const a = h[i - 1], b = h[i];
    if (t >= a.t) {
      if (t >= b.t) return copy(b);
      const k = (t - a.t) / (b.t - a.t || 1);
      out.x = lerp(a.x, b.x, k); out.y = lerp(a.y, b.y, k); out.d = lerp(a.d, b.d, k);
      return;
    }
  }
  copy(h[n - 1]);
}

function createRuntime(env: Env): Runtime {
  const { actor, mover, root, status, pulse, ghosts, form } = env;
  const life = new AbortController();
  const geo: Geo = { pw: 0, cw: 0, H: 0, dir: -1, hx: 0, ch: CARD_MIN };
  const snap = () => {
    geo.pw = pillW(); geo.cw = cardW(); geo.H = homeDy();
    geo.hx = env.getSide() * (window.innerWidth / 2 - DOCK_M - FAB / 2);
  };
  snap();
  const orb = createOrb(env.canvas, env.getSpeed, env.isReduced);
  const vals: Record<string, number> = {};
  const dirty = new Set<string>();
  const CH: Record<string, (v: number) => void> = {};

  let current: AbortController | null = null;
  let idleCtl: AbortController | null = null;
  let busy = false, idling = false, docked = true, epoch = 0;
  let curX = 0, curY = 0, curD = BALL_SMALL, trailVis = 0, ghostsShown = false;
  let wStagger = 45, wDur = 320;
  const hist: Sample[] = [];
  const tmp: Sample = { t: 0, x: 0, y: 0, d: 0 };

  const child = () => {
    const ac = new AbortController();
    if (life.signal.aborted) ac.abort();
    else life.signal.addEventListener("abort", () => ac.abort(), { once: true });
    return ac;
  };

  /* ── trajectoire + traînée de comète ── */
  const renderTrail = () => {
    if (trailVis <= 0.001) {
      if (ghostsShown) { ghosts.forEach((g) => (g.style.opacity = "0")); ghostsShown = false; }
      return;
    }
    ghostsShown = true;
    const now = performance.now();
    for (let i = 0; i < ghosts.length; i++) {
      sampleAt(hist, now - (i + 1) * 45, tmp);
      const k = (tmp.d * (1 - 0.08 * (i + 1))) / 100;
      const g = ghosts[i];
      g.style.transform = `translate3d(${(tmp.x - curX).toFixed(2)}px,${(tmp.y - curY).toFixed(2)}px,0) translate(-50%,-50%) scale(${k.toFixed(3)})`;
      g.style.opacity = (0.28 * Math.pow(1 - i / 6, 1.5) * trailVis).toFixed(3);
    }
  };

  /* dk = 1 : le bouton est dans son coin ; dk = 0 : au centre-bas (champ) puis trajectoire vers l'orbe */
  const applyPath = () => {
    const u = vals.u ?? 0, H = geo.H, dk = vals.dk ?? 0;
    curX = bez(u, geo.hx * dk, geo.dir * 0.3 * H, 0);
    curY = bez(u, H + DOCK_DY * dk, 0.6 * H, 0) + (vals.yOff ?? 0);
    mover.style.transform = `translate3d(${curX.toFixed(2)}px,${curY.toFixed(2)}px,0)`;
    const now = performance.now();
    hist.push({ t: now, x: curX, y: curY, d: curD });
    while (hist.length > 2 && hist[0].t < now - 500) hist.shift();
    renderTrail();
  };

  /* ── mots de la réponse ── */
  const applyWords = (v: number) => {
    const body = env.getBody();
    if (!body) return;
    const nodes = body.querySelectorAll<HTMLElement>(".mo-w");
    const total = (nodes.length - 1) * wStagger + wDur;
    const time = v * total;
    const reduced = env.isReduced();
    nodes.forEach((el, i) => {
      const p = E.out(clamp01((time - i * wStagger) / wDur));
      el.style.opacity = fmt(p);
      el.style.transform = p >= 0.999 || reduced ? "none" : `translateY(${fmt((1 - p) * 4)}px)`;
      el.style.filter = p >= 0.999 || reduced ? "none" : `blur(${fmt((1 - p) * 4)}px)`;
    });
  };

  /* ── canaux ── */
  ["oGlow", "oHalo", "oPill", "oBall", "oGreen", "oCard", "oRing", "oInput", "oAur", "oFab", "gs", "cs", "hOp", "dotS", "bloom"].forEach((n) => {
    CH[n] = (v) => actor.style.setProperty("--" + n, fmt(v));
  });
  ["w", "h", "r"].forEach((n) => {
    CH[n] = (v) => {
      actor.style.setProperty("--" + n, fmt(v) + "px");
      if (n === "w") curD = v;
    };
  });
  CH.inScale = (v) => {
    actor.style.setProperty("--inScale", fmt(v));
    form.style.filter = v >= 0.999 ? "none" : `blur(${fmt((1 - v) * 15)}px)`;
  };
  CH.oScrim = (v) => root.style.setProperty("--oScrim", fmt(v));
  CH.sOp = (v) => status.style.setProperty("--sOp", fmt(v));
  CH.sTy = (v) => status.style.setProperty("--sTy", fmt(v));
  CH.cHalo = (v) => root.style.setProperty("--oCenter", fmt(v));
  CH.u = () => applyPath();
  CH.dk = () => applyPath();
  CH.yOff = () => applyPath();
  CH.trail = (v) => { trailVis = v; renderTrail(); };
  CH.pulse = (v) => {
    if (v < 0) { pulse.style.opacity = "0"; return; }
    pulse.style.opacity = fmt(0.5 * (1 - v));
    pulse.style.transform = `scale(${fmt(1 + v)})`;
  };
  CH.wp = applyWords;
  ORB_KEYS.forEach((name) => {
    CH["orb." + name] = (v) => {
      orb.P[name] = v;
      if (name === "alpha") orb.ensure();
    };
  });

  const set = (ch: string, v: number) => { vals[ch] = v; dirty.add(ch); };
  const flush = () => { dirty.forEach((ch) => CH[ch]?.(vals[ch])); dirty.clear(); };
  const setNow = (ch: string, v: number) => { vals[ch] = v; CH[ch]?.(v); };
  const resetChannels = (asDocked = false) => {
    setNow("w", asDocked ? FAB : geo.pw);
    for (const ch of Object.keys(INIT)) setNow(ch, INIT[ch]);
    if (asDocked) for (const ch of Object.keys(DOCKED)) setNow(ch, DOCKED[ch]);
  };

  /* ── moteur de timeline ── */
  const play = (tracks: Track[], sig: AbortSignal) =>
    new Promise<void>((res) => {
      if (sig.aborted) return res();
      const end = tracks.reduce((m, k) => Math.max(m, k.t1), 0);
      const done = new Set<Track>();
      let raf = 0, t = 0, last = performance.now();
      const onAbort = () => { cancelAnimationFrame(raf); res(); };
      const finish = () => { sig.removeEventListener("abort", onAbort); res(); };
      const step = (now: number) => {
        const dt = Math.max(0, Math.min(100, now - last));
        last = now;
        t += dt * env.getSpeed();
        for (const k of tracks) {
          if (done.has(k) || t < k.t0) continue;
          const p = Math.min(1, (t - k.t0) / Math.max(1, k.t1 - k.t0));
          set(k.ch, k.from + (k.to - k.from) * (k.ease ?? E.io)(p));
          if (p === 1) done.add(k);
        }
        flush();
        if (t >= end) finish(); else raf = requestAnimationFrame(step);
      };
      sig.addEventListener("abort", onAbort, { once: true });
      raf = requestAnimationFrame(step);
    });

  /* ── libellés de réflexion ── */
  const labelLoop = async (sig: AbortSignal, ctl: { stop: boolean }) => {
    let i = 0;
    for (;;) {
      await sleep(1150 / env.getSpeed(), sig);
      if (sig.aborted || ctl.stop) return;
      i = (i + 1) % COPY.labels.length;
      orb.P.prog = i % 4;
      env.ui.swapLabel(COPY.labels[i]);
    }
  };

  /* ── chef d'orchestre ── */
  const run = async (text: string, sig: AbortSignal, cfg: RunCfg) => {
    const reduced = env.isReduced();
    const go = async (tracks: Track[]) => {
      await play(tracks, sig);
      if (sig.aborted) throw ABORT;
    };
    try {
      env.ui.setPhase("launch");
      hist.length = 0;
      if (!reduced) {
        await go(launchTracks(geo));
        setNow("r", ORB_D / 2);
        env.ui.setPhase("assemble");
        await go(ASSEMBLE);
      } else {
        await go(R_OUT);
        setNow("u", 1); setNow("w", ORB_D); setNow("h", ORB_D); setNow("r", ORB_D / 2);
        setNow("sTy", 0); setNow("orb.k", 1); setNow("orb.spin", 0);
        env.ui.setPhase("assemble");
        await go(R_IN);
      }

      /* réflexion : jusqu'à la réponse ET la durée minimale */
      env.ui.setPhase("think");
      env.ui.live(COPY.labels[0]);
      const ctl = { stop: false };
      void labelLoop(sig, ctl);
      const t0 = performance.now();
      const got = await abortable(
        Promise.resolve().then(() => cfg.onSubmit(text, cfg.audio)),
        sig
      );
      if (sig.aborted) throw ABORT;
      const body = got?.message?.trim() || COPY.emptyAnswer;
      await sleep(cfg.minThink / env.getSpeed() - (performance.now() - t0), sig);
      ctl.stop = true;
      if (sig.aborted) throw ABORT;

      const words = body.split(/\s+/).filter(Boolean);
      const n = Math.max(1, words.length);
      geo.ch = env.getCardHeight(); // hauteur calculée depuis le transcript réel
      root.style.setProperty("--ch", geo.ch + "px");

      if (!reduced) {
        env.ui.setPhase("resolve");
        env.ui.swapLabel(COPY.done);
        await go(RESOLVE);

        env.ui.setPhase("condense");
        await go(CONDENSE);

        env.ui.setPhase("unfold");
        wDur = 320;
        wStagger = n > 1 ? Math.min(45, 280 / (n - 1)) : 0;
        env.ui.setAnswer(body);
        await go(unfoldTracks(geo, (n - 1) * wStagger + wDur));
      } else {
        env.ui.setPhase("resolve");
        env.ui.swapLabel(COPY.done);
        await go(R_RESOLVE);
        await sleep(350 / env.getSpeed(), sig);
        if (sig.aborted) throw ABORT;

        env.ui.setPhase("condense");
        setNow("gs", 1);
        await go(R_CONDENSE);

        env.ui.setPhase("unfold");
        wDur = 250;
        wStagger = 0;
        env.ui.setAnswer(body);
        await go(R_GREEN_OUT);
        setNow("w", geo.cw); setNow("h", geo.ch); setNow("r", 20); setNow("dotS", 1);
        await go(rCardIn(wDur));
      }

      env.ui.setPhase("answered");
      env.ui.live(COPY.ready + body);
      // La première transformation est terminée : la carte doit redevenir
      // interactive. Sans ce reset, `busy` reste vrai et le composeur reste
      // `inert`, ce qui empêche de poursuivre la conversation.
      current = null;
      busy = false;
      env.ui.lock(false);
      env.ui.focusAnswer();
    } catch (e) {
      if (e === ABORT) return;
      // Erreur API : on garde la carte ouverte pour afficher le message et « Réessayer ».
      revealCard();
    }
  };

  /**
   * État stable de la carte : transcript visible, composeur actif.
   * `fromPill` anime le passage champ → carte (réouverture d'une conversation).
   */
  function revealCard(fromPill = false) {
    epoch++;
    current = null;
    idleCtl?.abort();
    idleCtl = null;
    orb.reset();
    hist.length = 0;
    snap();
    docked = false;
    resetChannels();
    env.ui.resetLabel();
    const height = env.getCardHeight();

    const finish = () => {
      env.ui.setPhase("answered");
      setNow("u", 1);
      setNow("dk", 0);
      setNow("w", geo.cw);
      setNow("h", height);
      setNow("r", 20);
      setNow("oCard", 1);
      setNow("hOp", 1);
      setNow("dotS", 1);
      setNow("oPill", 0);
      setNow("oFab", 0);
      setNow("oInput", 0);
      setNow("orb.alpha", 0);
      setNow("oGreen", 0);
      setNow("oHalo", 0);
      setNow("cHalo", 0);
      setNow("pulse", -1);
      setNow("oScrim", 1);
      setNow("cs", 1);
      busy = false;
      idling = false;
      env.ui.lock(false);
    };

    if (!fromPill || env.isReduced()) {
      finish();
      return;
    }

    busy = true;
    env.ui.lock(true);
    const ac = child();
    current = ac;
    const tracks: Track[] = [
      T("u", 0, 1, 0, 420, E.fly),
      T("w", geo.pw, geo.cw, 0, 420, E.card),
      T("h", PILL_H, height, 0, 420, E.out),
      T("r", 999, 20, 0, 420, E.io),
      T("oInput", 1, 0, 0, 140, E.in),
      T("oPill", 1, 0, 120, 300, E.out),
      T("oCard", 0, 1, 120, 320, E.out),
      T("hOp", 0, 1, 180, 320, E.out),
      T("dotS", 0, 1, 180, 320, E.spring),
    ];
    void play(tracks, ac.signal).then(() => {
      if (ac.signal.aborted) return;
      current = null;
      finish();
    });
  }

  /* ── retour au champ ouvert ── */
  const toIdle = async (kind: "reset" | "esc") => {
    if (idling) return;
    idling = true;
    const my = ++epoch;
    const ac = child();
    idleCtl = ac;
    const sig = ac.signal;
    const outMs = kind === "reset" ? 240 : 200;
    const inMs = kind === "reset" ? 420 : 200;
    env.ui.setPhase("reset");

    const out: Track[] = [T("cHalo", vals.cHalo ?? 0, 0, 0, outMs, E.out)];
    for (const ch of FADE) {
      const v = vals[ch] ?? 0;
      if (v > 0.001) out.push(T(ch, v, 0, 0, outMs, E.out));
    }
    if (kind === "reset") out.push(T("cs", 1, 0.98, 0, outMs, E.out));
    await play(out, sig);
    if (sig.aborted || my !== epoch) return;

    setNow("pulse", -1);
    env.ui.setAnswer("");
    env.ui.resetLabel();
    env.ui.clearInput();
    orb.reset();
    hist.length = 0;
    snap();
    resetChannels();
    const pillCh = ["oPill", "oInput", "oGlow", "oAur", "oRing"];
    pillCh.forEach((ch) => setNow(ch, 0));
    setNow("yOff", kind === "reset" ? 8 : 0);
    const inn: Track[] = pillCh.map((ch) => T(ch, 0, 1, 0, inMs, E.out));
    if (kind === "reset") inn.push(T("yOff", 8, 0, 0, inMs, E.out));
    await play(inn, sig);
    if (sig.aborted || my !== epoch) return;

    resetChannels();
    current = null; idleCtl = null; busy = false; idling = false;
    env.ui.lock(false);
    env.ui.setPhase("idle");
    env.ui.idleReady();
  };

  function hard() {
    epoch++;
    current?.abort(); current = null;
    idleCtl?.abort(); idleCtl = null;
    orb.reset();
    hist.length = 0;
    env.ui.setAnswer("");
    env.ui.resetLabel();
    snap();
    docked = false;
    resetChannels();
    setNow("pulse", -1);
    busy = false; idling = false;
    env.ui.lock(false);
    env.ui.setPhase("idle");
    env.ui.idleReady();
  }

  resetChannels(true); // démarre replié : simple bouton flottant

  return {
    start(text, cfg) {
      if (busy || docked) return false;
      busy = true;
      snap(); // mesure unique, jamais de lecture du layout pendant les frames
      geo.dir = -geo.dir;
      orb.reset();
      setNow("u", 0);
      const ac = child();
      current = ac;
      env.ui.lock(true);
      void run(text, ac.signal, cfg);
      return true;
    },
    followUp(text, cfg) {
      if (busy || docked) return false;
      busy = true;
      snap();
      const ac = child();
      current = ac;
      env.ui.lock(true);
      env.ui.setPhase("thinking");
      env.ui.live(COPY.labels[0]);
      const ctl = { stop: false };
      void labelLoop(ac.signal, ctl);
      void (async () => {
        try {
          const got = await abortable(
            Promise.resolve().then(() => cfg.onSubmit(text, cfg.audio)),
            ac.signal
          );
          if (ac.signal.aborted) throw ABORT;
          ctl.stop = true;
          // Léger temps de réaction : le transcript reste lisible, pas de nouvelle transformation d'orbe.
          await sleep(Math.min(500, cfg.minThink) / env.getSpeed(), ac.signal);
          if (ac.signal.aborted) throw ABORT;
          env.ui.setPhase("answered");
          env.ui.live(COPY.ready + (got?.message ?? ""));
          current = null; busy = false;
          env.ui.lock(false);
          env.ui.focusAnswer();
        } catch (e) {
          if (e === ABORT) return;
          ctl.stop = true;
          env.ui.setPhase("answered");
          env.ui.resetLabel();
          current = null; busy = false;
          env.ui.lock(false);
        }
      })();
      return true;
    },
    resize(height) {
      geo.ch = Math.max(CARD_MIN, Math.min(cardMaxH(), height));
      setNow("h", geo.ch);
      root.style.setProperty("--ch", geo.ch + "px");
    },
    open(card = false) {
      if (busy || !docked) return;
      busy = true;
      snap();
      const ac = child();
      current = ac;
      env.ui.setPhase("opening");
      void play(env.isReduced() ? rOpenTracks(geo) : openTracks(geo), ac.signal).then(() => {
        if (ac.signal.aborted) return;
        docked = false; current = null; busy = false;
        env.ui.lock(false);
        if (card) {
          revealCard(true);
        } else {
          env.ui.setPhase("idle");
          env.ui.idleReady();
        }
      });
    },
    close() {
      if (busy || docked) return;
      busy = true;
      snap();
      const fromCard =
        root.dataset.phase === "answered" || root.dataset.phase === "thinking";
      const ac = child();
      current = ac;
      env.ui.lock(true);
      env.ui.setPhase("closing");
      const tracks = fromCard
        ? env.isReduced()
          ? rCloseCardTracks(geo)
          : closeCardTracks(geo)
        : env.isReduced()
          ? rCloseTracks(geo)
          : closeTracks(geo);
      const u = vals.u ?? 0;
      if (u > 0.001) {
        tracks.push(
          T(
            "u",
            u,
            0,
            env.isReduced() ? 150 : fromCard ? 320 : 120,
            env.isReduced() ? 200 : 640,
            env.isReduced() ? E.out : E.io,
          ),
        );
      }
      void play(tracks, ac.signal).then(() => {
        if (ac.signal.aborted) return;
        docked = true; current = null; busy = false;
        env.ui.setPhase("dock");
        env.ui.dockReady();
      });
    },
    escape() {
      if (!busy || idling || docked) return;
      current?.abort();
      void toIdle("esc");
    },
    reset() {
      if (!busy || idling) return;
      void toIdle("reset");
    },
    hard,
    home() {
      if (busy) return;
      snap();
      setNow("w", docked ? FAB : geo.pw);
      setNow("u", 0);
    },
    busy: () => busy,
    destroy() {
      life.abort();
      orb.destroy();
    },
  };
}

/* ───────────────────────────── note vocale ───────────────────────────── */
interface RecState {
  mr?: MediaRecorder; stream?: MediaStream; ctx?: AudioContext;
  chunks: Blob[]; raf: number; tick: number; t0: number; starting: boolean;
}
const BAR_COUNT = 24;
/** Formats acceptés par le contrôleur NestJS ; le codec est retiré avant envoi. */
const RECORDING_MIMES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function teardownRec(r: RecState) {
  window.clearInterval(r.tick);
  cancelAnimationFrame(r.raf);
  try {
    if (r.mr && r.mr.state !== "inactive") {
      r.mr.onstop = null;
      r.mr.onerror = null;
      r.mr.stop();
    }
  } catch { /* déjà arrêté */ }
  r.stream?.getTracks().forEach((t) => t.stop());
  if (r.ctx) void Promise.resolve(r.ctx.close()).catch(() => {});
  // On ne conserve aucun octet audio dans le state après la fin de l'enregistrement.
  r.mr = undefined; r.stream = undefined; r.ctx = undefined;
  r.chunks = []; r.tick = 0; r.raf = 0;
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
/** Horodatage des messages créés depuis un gestionnaire d'événement. */
const timestamp = () => Date.now();

/* ───────────────────────────── composant ───────────────────────────── */
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function MorphOrb(props: MorphOrbProps) {
  const [phase, setPhaseState] = useState<Phase>("dock");
  const [value, setValue] = useState("");
  const [lbl, setLbl] = useState<{ cur: string; prev: string | null; n: number }>({ cur: COPY.labels[0], prev: null, n: 0 });
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [dbgSpeed, setDbgSpeed] = useState(1);
  const [debug] = useState(() => typeof window !== "undefined" && /[?&]debug(?:[=&]|$)/.test(window.location.search));

  const initialSuggestions = props.initialSuggestions ?? [
    "Voir les nouveautés",
    "Me recommander un produit",
    "Zones de livraison",
  ];
  const [messages, setMessages] = useState<AIMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      text: props.welcomeMessage ?? COPY.welcome,
      suggestions: initialSuggestions,
      createdAt: Date.now(),
    },
  ]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const composerFormRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const ghostRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const propsRef = useRef(props);
  const speedRef = useRef(1);
  const phaseRef = useRef<Phase>("dock");
  const reducedRef = useRef(false);
  const rtRef = useRef<Runtime | null>(null);
  const recRef = useRef<RecState>({ chunks: [], raf: 0, tick: 0, t0: 0, starting: false });
  const sendingVoiceRef = useRef(false);
  const timers = useRef<{ typing?: number; shake?: number; flash?: number }>({});

  const messagesRef = useRef(messages);
  const conversationIdRef = useRef(conversationId);
  const cardHeightRef = useRef(
    typeof window === "undefined"
      ? CARD_MIN
      : estimateCardHeight(messages, false, online)
  );
  const mountedRef = useRef(true);
  const idRef = useRef(0);
  const nextId = () => `msg-${++idRef.current}`;
  const submitRef = useRef<(text: string, audio?: Blob) => Promise<void>>(async () => {});

  // Les refs lues par le runtime sont synchronisées après le rendu (jamais pendant).
  useIsoLayoutEffect(() => {
    propsRef.current = props;
    speedRef.current = Math.max(0.05, (props.speed ?? 1) * dbgSpeed);
    messagesRef.current = messages;
    conversationIdRef.current = conversationId;
  });

  useIsoLayoutEffect(() => {
    const root = rootRef.current, mover = moverRef.current, actor = actorRef.current, canvas = canvasRef.current;
    const pulse = pulseRef.current, status = statusRef.current, form = formRef.current;
    const ghosts = ghostRefs.current.filter((g): g is HTMLSpanElement => !!g);
    if (!root || !mover || !actor || !canvas || !pulse || !status || !form) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onMq = (e: MediaQueryListEvent) => { reducedRef.current = e.matches; };
    mq.addEventListener("change", onMq);

    const rt = createRuntime({
      root, mover, actor, form, ghosts, canvas, pulse, status,
      getBody: () => bodyRef.current,
      getCardHeight: () => cardHeightRef.current,
      getSpeed: () => speedRef.current,
      isReduced: () => reducedRef.current,
      getSide: () => (propsRef.current.corner === "bottom-left" ? -1 : 1),
      ui: {
        setPhase: (p) => { phaseRef.current = p; setPhaseState(p); },
        swapLabel: (name) => setLbl((l) => (l.cur === name ? l : { cur: name, prev: l.cur, n: l.n + 1 })),
        resetLabel: () => setLbl((l) => ({ cur: COPY.labels[0], prev: null, n: l.n + 1 })),
        // Le transcript est rendu par React : les mots à animer sont déjà dans le DOM.
        setAnswer: () => undefined,
        clearInput: () => setValue(""),
        live: (s) => { if (liveRef.current) liveRef.current.textContent = s; },
        lock: (on) => {
          form.toggleAttribute("inert", on);
          composerFormRef.current?.toggleAttribute("inert", on);
        },
        idleReady: () => { inputRef.current?.focus({ preventScroll: true }); },
        dockReady: () => { fabRef.current?.focus({ preventScroll: true }); },
        focusAnswer: () => { answerRef.current?.focus({ preventScroll: true }); },
      },
    });
    rtRef.current = rt;
    form.setAttribute("inert", ""); // champ inactif tant que le bouton est replié

    mountedRef.current = true;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const p = phaseRef.current;
      if (recRef.current.mr) {
        e.preventDefault();
        teardownRec(recRef.current);
        sendingVoiceRef.current = false;
        setRec(false); setSecs(0);
        return;
      }
      if (p === "idle") {
        e.preventDefault();
        rt.close();
      } else if (p === "answered") {
        e.preventDefault();
        rt.close();
      } else if (p !== "dock" && p !== "opening" && p !== "closing" && p !== "reset") {
        e.preventDefault();
        rt.escape();
      }
    };
    const onResize = () => {
      if ((phaseRef.current === "idle" || phaseRef.current === "dock") && !rt.busy()) rt.home();
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      mq.removeEventListener("change", onMq);
      window.clearTimeout(timers.current.typing);
      window.clearTimeout(timers.current.shake);
      window.clearTimeout(timers.current.flash);
      teardownRec(recRef.current);
      rt.destroy();
      rtRef.current = null;
    };
  }, []);

  /** Hauteur réelle du transcript dès que le React a commité, avec repli sur l'estimation. */
  useIsoLayoutEffect(() => {
    const estimate = estimateCardHeight(messages, error !== null, online);
    const measured = transcriptRef.current
      ? transcriptRef.current.scrollHeight + 48
      : estimate;
    const height = Math.round(
      Math.min(cardMaxH(), Math.max(CARD_MIN, Math.max(estimate, measured)))
    );
    cardHeightRef.current = height;
    // Pendant la transformation de l'orbe, `--h` pilote l'orbe : on ne le réécrit pas.
    if (phaseRef.current === "answered" || phaseRef.current === "thinking") {
      rtRef.current?.resize(height);
    }
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages, error, online]);

  const announce = (s: string) => { if (liveRef.current) liveRef.current.textContent = s; };

  const shake = () => {
    const a = actorRef.current;
    if (!a) return;
    a.removeAttribute("data-shake");
    void a.offsetWidth;
    a.setAttribute("data-shake", "");
    a.setAttribute("data-flash", "");
    window.clearTimeout(timers.current.shake);
    window.clearTimeout(timers.current.flash);
    timers.current.shake = window.setTimeout(() => a.removeAttribute("data-shake"), 260);
    timers.current.flash = window.setTimeout(() => a.removeAttribute("data-flash"), 200);
  };

  const getErrorMessage = (err: unknown): string => {
    if (!online) return COPY.offline;
    const maybeAxios = err as {
      isAxiosError?: boolean;
      message?: string;
      response?: { status?: number; data?: { message?: string | string[] } };
    };
    if (maybeAxios?.isAxiosError) {
      const status = maybeAxios.response?.status;
      const raw = maybeAxios.response?.data?.message;
      const serverMessage = Array.isArray(raw) ? raw.join(", ") : raw;
      if (status === 429) {
        return "Limite d'utilisation atteinte. Réessayez plus tard.";
      }
      if (status === 401) {
        return 'Connectez-vous pour consulter le suivi de votre commande.';
      }
      if (status === 413) return COPY.voiceTooLarge;
      if (status === 400) return serverMessage || "Message ou fichier audio invalide.";
      if (status && status >= 500) {
        return "Le service est momentanément indisponible. Réessayez dans un instant.";
      }
      if (!status) return "Impossible de contacter l'assistant. Vérifiez votre connexion.";
      return serverMessage || "Une erreur est survenue. Réessayez.";
    }
    return err instanceof Error && err.message.trim() ? err.message : COPY.emptyAnswer;
  };

  /* ── envoi conversationnel ── */
  const sendTurn = async (
    cleanText: string,
    audio: Blob | undefined,
    appendUser: boolean,
  ) => {
    const rt = rtRef.current;
    if (!rt || rt.busy() || !online) return;

    const phase = phaseRef.current;
    const isFollowUp = phase === "answered" || phase === "thinking";
    const userId = nextId();
    const pendingId = nextId();
    const userMessage: AIMessage = {
      id: userId,
      role: "user",
      text: cleanText || COPY.voiceLabel,
      audio: !!audio,
      createdAt: timestamp(),
    };
    const pendingMessage: AIMessage = {
      id: pendingId,
      role: "assistant",
      text: "",
      pending: true,
      createdAt: timestamp(),
    };
    // Un nouvel essai ne doit pas dupliquer la bulle utilisateur déjà affichée.
    const base = messagesRef.current;
    const withPending = appendUser
      ? [...base, userMessage, pendingMessage]
      : [...base, pendingMessage];
    messagesRef.current = withPending;
    setMessages(withPending);
    setError(null);
    setValue("");
    cardHeightRef.current = estimateCardHeight(withPending, false, online);

    const cfg: RunCfg = {
      minThink: propsRef.current.minThinkMs ?? 1400,
      audio,
      onSubmit: async (sentText, sentAudio) => {
        try {
          const response = await propsRef.current.onSubmit(
            sentText,
            sentAudio,
            conversationIdRef.current || undefined
          );
          if (!mountedRef.current) return response;

          conversationIdRef.current = response.conversationId;
          setConversationId(response.conversationId);

          const assistantMessage: AIMessage = {
            id: pendingId,
            role: "assistant",
            text: response.message || COPY.emptyAnswer,
            products: response.products,
            suggestions: response.suggestions,
            createdAt: timestamp(),
          };
          const next = withPending.map((m) =>
            m.id === pendingId ? assistantMessage : m
          );
          messagesRef.current = next;
          setMessages(next);
          cardHeightRef.current = estimateCardHeight(next, false, online);
          return response;
        } catch (err) {
          if (!mountedRef.current) throw err;
          const next = withPending.filter((m) => m.id !== pendingId);
          messagesRef.current = next;
          setMessages(next);
          const message = getErrorMessage(err);
          setError({
            message,
            retry: () => { void sendTurn(cleanText, audio, false); },
          });
          throw err;
        }
      },
    };

    if (isFollowUp) rt.followUp(cleanText, cfg);
    else rt.start(cleanText, cfg);
  };

  const submit = async (text: string, audio?: Blob) => {
    const cleanText = text.trim();
    if (!cleanText && !audio) { shake(); return; }
    await sendTurn(cleanText, audio, true);
  };

  useIsoLayoutEffect(() => {
    submitRef.current = submit;
  });

  /* ── enregistrement vocal ── */
  const stopRec = () =>
    new Promise<Blob | null>((res) => {
      const r = recRef.current, mr = r.mr;
      if (!mr || mr.state === "inactive") { teardownRec(r); setRec(false); setSecs(0); res(null); return; }
      mr.onstop = () => {
        // Les navigateurs ajoutent parfois `;codecs=opus` : le backend n'accepte que le type de base.
        const mime = (mr.mimeType || "audio/webm").split(";")[0].trim();
        const blob = new Blob(r.chunks, { type: mime });
        teardownRec(r); setRec(false); setSecs(0);
        res(blob);
      };
      mr.stop();
    });

  const cancelRec = () => {
    teardownRec(recRef.current);
    sendingVoiceRef.current = false;
    setRec(false); setSecs(0);
  };

  const submitVoice = async () => {
    const rt = rtRef.current;
    if (!rt || rt.busy() || !online || sendingVoiceRef.current) return;
    if (phaseRef.current !== "idle" && phaseRef.current !== "answered") return;
    sendingVoiceRef.current = true;
    const dur = Date.now() - recRef.current.t0;
    try {
      const blob = await stopRec();
      if (!blob || blob.size === 0 || dur < 600) {
        shake(); announce(COPY.voiceTooShort); return;
      }
      if (blob.size > 10 * 1024 * 1024) {
        shake(); announce(COPY.voiceTooLarge); return;
      }
      void submit("", blob);
    } finally {
      sendingVoiceRef.current = false;
    }
  };

  const startRec = async () => {
    const r = recRef.current;
    if (r.mr || r.starting || !online) return;
    sendingVoiceRef.current = false;
    if (phaseRef.current !== "idle" && phaseRef.current !== "answered") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      shake(); announce(COPY.micUnsupported); return;
    }
    r.starting = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (
        !mountedRef.current ||
        (phaseRef.current !== "idle" && phaseRef.current !== "answered")
      ) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mime = RECORDING_MIMES.find((t) => MediaRecorder.isTypeSupported(t));
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      r.chunks = []; r.mr = mr; r.stream = stream;
      mr.ondataavailable = (e) => { if (e.data.size) r.chunks.push(e.data); };
      mr.onerror = () => {
        teardownRec(r); setRec(false); setSecs(0);
        shake(); announce(COPY.micError);
      };
      mr.start(250);

      /* niveau sonore en direct */
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        r.ctx = ctx;
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const loop = () => {
          an.getByteFrequencyData(buf);
          const bars = barsRef.current?.children;
          if (bars) for (let i = 0; i < bars.length; i++) {
            (bars[i] as HTMLElement).style.transform = `scaleY(${(0.15 + (buf[i + 1] / 255) * 0.85).toFixed(3)})`;
          }
          r.raf = requestAnimationFrame(loop);
        };
        loop();
      }

      r.t0 = Date.now();
      setSecs(0);
      const max = Math.min(120, Math.max(5, propsRef.current.maxRecordSeconds ?? 120));
      r.tick = window.setInterval(() => {
        const s = Math.floor((Date.now() - r.t0) / 1000);
        setSecs(s);
        if (s >= max) void submitVoice(); // durée max atteinte : on envoie
      }, 250);
      setRec(true);
      announce(COPY.recording);
    } catch (err) {
      teardownRec(r);
      shake();
      const name = err instanceof DOMException ? err.name : "";
      announce(
        name === "NotAllowedError"
          ? COPY.micDenied
          : name === "NotFoundError"
            ? COPY.micNotFound
            : COPY.micError
      );
    } finally {
      r.starting = false;
    }
  };

  /* ── saisie texte ── */
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    const a = actorRef.current;
    if (!a) return;
    a.setAttribute("data-typing", "");
    window.clearTimeout(timers.current.typing);
    timers.current.typing = window.setTimeout(() => a.removeAttribute("data-typing"), 300);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.shiftKey || e.nativeEvent.isComposing)) e.preventDefault();
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit(value);
  };

  const onReset = () => {
    cancelRec();
    const welcome: AIMessage = {
      id: "welcome",
      role: "assistant",
      text: propsRef.current.welcomeMessage ?? COPY.welcome,
      suggestions: propsRef.current.initialSuggestions ?? initialSuggestions,
      createdAt: Date.now(),
    };
    messagesRef.current = [welcome];
    setMessages([welcome]);
    setConversationId(undefined);
    conversationIdRef.current = undefined;
    setError(null);
    setValue("");
    rtRef.current?.hard();
  };

  const closeWidget = () => { cancelRec(); rtRef.current?.close(); };

  const onScrim = () => {
    const p = phaseRef.current;
    // Pendant une requête, un clic à côté ne doit pas interrompre la conversation.
    if (p === "idle" || p === "answered") closeWidget();
  };

  const replay = () => {
    const rt = rtRef.current;
    if (!rt) return;
    const text = value.trim() || "Voir les nouveautés";
    rt.hard();
    setValue(text);
    window.requestAnimationFrame(() => { void submitRef.current(text); });
  };

  const ready = rec || value.trim().length > 0;
  const showComposer = phase === "answered" || phase === "thinking";
  const busy = phase === "think" || phase === "thinking" || phase === "launch" || phase === "assemble" || phase === "resolve" || phase === "condense" || phase === "unfold";
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  // Les mots ne sont animés que lors de la première transformation de l'orbe.
  // Les réponses suivantes s'affichent directement dans le transcript.
  const animateWords =
    phase === "resolve" || phase === "condense" || phase === "unfold";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);

  const sparkIcon = (
    <svg className="mo-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7L10 3.5z" />
      <path d="M18 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </svg>
  );
  const micIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
  const sendIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5.5 11.5L12 5l6.5 6.5" />
    </svg>
  );
  const cancelIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );

  const labelInner = (name: string) =>
    name === COPY.done ? (
      <span className="mo-lab-done">{name}</span>
    ) : (
      <>
        <span className="mo-lab-t">{name}</span>
        <span className="mo-dots" aria-hidden="true"><i /><i /><i /></span>
      </>
    );

  return (
    <div className="mo-root" data-phase={phase} ref={rootRef}>
      <div className="mo-bg" aria-hidden="true" onClick={onScrim} />
      <div className="mo-halo" aria-hidden="true" />

      <div className="mo-mover" ref={moverRef}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mo-trail" aria-hidden="true" ref={(el) => { ghostRefs.current[i] = el; }} />
        ))}

        <div className="mo-actor" ref={actorRef} data-rec={rec ? "" : undefined}>
          <div className="mo-underglow" aria-hidden="true" />
          <div className="mo-halo-green" aria-hidden="true" />
          <div className="mo-surface" aria-hidden="true">
            <div className="mo-aurora"><i /><i /><i /><i /></div>
          </div>
          <div className="mo-ball" aria-hidden="true" />
          <div className="mo-green" aria-hidden="true" />
          <div className="mo-card" aria-hidden="true" />
          <div className="mo-ring" aria-hidden="true" />

          {/* Champ utilisé pour le tout premier message : l'orbe se transforme ensuite en conversation. */}
          <form className="mo-input" ref={formRef} onSubmit={onFormSubmit} autoComplete="off">
            {sparkIcon}
            <input
              ref={inputRef}
              className="mo-field"
              type="text"
              value={value}
              maxLength={500}
              placeholder={COPY.placeholder}
              aria-label={COPY.placeholder}
              spellCheck={false}
              disabled={!online}
              onChange={onChange}
              onKeyDown={onKeyDown}
            />
            <button type="button" className="mo-btn mo-mic" aria-label={COPY.mic} disabled={!online} onClick={() => void startRec()}>
              {micIcon}
            </button>
            <button type="submit" className="mo-btn mo-send" aria-label={COPY.send} data-ready={ready ? "" : undefined} disabled={!online}>
              {sendIcon}
            </button>
          </form>

          {/* Barre d'enregistrement partagée par le champ initial et le composeur. */}
          <div className="mo-rec" role="group" aria-label={COPY.recording}>
            <i className="mo-rec-dot" aria-hidden="true" />
            <span className="mo-rec-time">{mmss(secs)}</span>
            <div className="mo-bars" ref={barsRef} aria-hidden="true">
              {Array.from({ length: BAR_COUNT }).map((_, i) => <i key={i} />)}
            </div>
            <button
              type="button"
              className="mo-btn mo-rec-send"
              aria-label={COPY.send}
              onClick={() => void submitVoice()}
            >
              {sendIcon}
            </button>
            <button type="button" className="mo-btn" aria-label={COPY.cancelRec} onClick={cancelRec}>
              {cancelIcon}
            </button>
          </div>

          <canvas className="mo-orb" ref={canvasRef} aria-hidden="true" />
          <div className="mo-pulse" ref={pulseRef} aria-hidden="true" />

          <div className="mo-answer" ref={answerRef} tabIndex={-1} role="group" aria-label={COPY.answerTitle}>
            <div className="mo-a-head">
              <i className="mo-a-dot" aria-hidden="true" />
              <span>{COPY.assistantTitle}</span>
              <span className="mo-a-conv">{conversationId ? COPY.conversationActive : ""}</span>
              <button type="button" className="mo-a-new" onClick={onReset} disabled={busy}>
                {COPY.newConversation}
              </button>
            </div>

            {!online && (
              <div className="mo-network" role="status">
                <i aria-hidden="true" /> {COPY.offline}
              </div>
            )}

            <div className="mo-transcript" ref={transcriptRef} aria-busy={busy}>
              {messages.map((message) => {
                const isLastAssistant = message.role === "assistant" && message.id === lastAssistantId;
                const words = message.text.split(/\s+/).filter(Boolean);
                return (
                  <div key={message.id} className={`mo-msg mo-msg-${message.role}`}>
                    <div className="mo-bubble">
                      {message.pending ? (
                        <span className="mo-typing" aria-label={COPY.labels[0]}>
                          <i /><i /><i />
                        </span>
                      ) : (
                        <>
                          <p
                            className="mo-msg-text"
                            ref={isLastAssistant ? bodyRef : undefined}
                          >
                            {words.map((word, i) => (
                              <React.Fragment key={i}>
                                <span className={animateWords && isLastAssistant ? "mo-w" : undefined}>{word}</span>{" "}
                              </React.Fragment>
                            ))}
                          </p>

                          {!!message.products?.length && (
                            <div className="mo-products">
                              {message.products.map((product) => (
                                <a
                                  key={product.id}
                                  className="mo-product"
                                  href={product.productUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  <span className="mo-product-img">
                                    {product.imageUrl ? (
                                      <img
                                        src={product.imageUrl}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                      />
                                    ) : null}
                                  </span>
                                  <span className="mo-product-info">
                                    <strong>{product.name}</strong>
                                    <span className="mo-product-price">{formatPrice(product.price)} FCFA</span>
                                    <small className={product.inStock ? "mo-in" : "mo-out"}>
                                      {product.inStock ? "En stock" : "Épuisé"}
                                    </small>
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}

                          {!!message.suggestions?.length && (
                            <div className="mo-suggestions">
                              {message.suggestions.map((suggestion, i) => (
                                <button
                                  key={`${message.id}-s${i}`}
                                  type="button"
                                  className="mo-suggestion"
                                  disabled={busy || !online}
                                  onClick={() => void submit(suggestion)}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mo-error" role="alert">
                <span>{error.message}</span>
                <button type="button" onClick={error.retry} disabled={!online}>
                  {COPY.retry}
                </button>
              </div>
            )}

            {showComposer && (
              <form
                className="mo-composer"
                ref={composerFormRef}
                onSubmit={onFormSubmit}
                autoComplete="off"
              >
                <input
                  ref={composerInputRef}
                  className="mo-field"
                  type="text"
                  value={value}
                  maxLength={500}
                  placeholder={COPY.placeholder}
                  aria-label={COPY.placeholder}
                  spellCheck={false}
                  disabled={!online || busy}
                  onChange={onChange}
                  onKeyDown={onKeyDown}
                />
                <button type="button" className="mo-btn mo-mic" aria-label={COPY.mic} disabled={!online || busy} onClick={() => void startRec()}>
                  {micIcon}
                </button>
                <button type="submit" className="mo-btn mo-send" aria-label={COPY.send} data-ready={ready ? "" : undefined} disabled={!online || busy}>
                  {sendIcon}
                </button>
              </form>
            )}
          </div>

          {/* bouton flottant : au-dessus de tout quand l'assistant est replié */}
          <button
            type="button"
            className="mo-fab"
            ref={fabRef}
            aria-label={COPY.open}
            aria-expanded={phase !== "dock"}
            tabIndex={phase === "dock" ? 0 : -1}
            onClick={() => {
              const hasConversation = messagesRef.current.length > 1;
              rtRef.current?.open(hasConversation);
              if (hasConversation) {
                window.requestAnimationFrame(() => {
                  const t = transcriptRef.current;
                  if (t) t.scrollTop = t.scrollHeight;
                });
              }
            }}
          >
            {sparkIcon}
          </button>
        </div>
      </div>

      <div className="mo-status" ref={statusRef} aria-hidden="true">
        {lbl.prev !== null && (
          <span key={"p" + lbl.n} className="mo-lab mo-out">{labelInner(lbl.prev)}</span>
        )}
        <span key={"c" + lbl.n} className="mo-lab mo-in">{labelInner(lbl.cur)}</span>
      </div>

      <div className="mo-live" ref={liveRef} role="status" aria-live="polite" />

      {debug && (
        <div className="mo-debug">
          <span className="mo-chip">{phase}</span>
          <label>
            <span>{dbgSpeed.toFixed(2)}×</span>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={dbgSpeed}
              aria-label="Vitesse"
              onChange={(e) => setDbgSpeed(parseFloat(e.target.value))}
            />
          </label>
          <button type="button" onClick={replay}>Rejouer</button>
        </div>
      )}
    </div>
  );
}