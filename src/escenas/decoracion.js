// El Fórum se viste de grados (diapositiva 2).
//
// Los banderines son cadenas de partículas unidas por restricciones de distancia
// (integración de Verlet): cuelgan de dos anclas, la gravedad los tensa y se quedan
// en equilibrio. Se cuelgan en orden desde la puerta hacia afuera: la fiesta sale del Fórum.
//
// Referencias: portal "Bienvenidos a construir legado" y corona de flores del Fórum.

import { P, PUERTA, COLUMNAS } from './bulevar.js';

const NODOS = 13;
const HOLGURA = 1.07; // cuerda un 7 % más larga que la distancia entre anclas
const GRAVEDAD = 0.22;
const AMORTIGUA = 0.975;
const ITERACIONES = 8;
const RETRASO_POR_PX = 1.4; // ms: el colgado avanza desde la puerta

const COLORES_BANDERIN = ['#1b1b22', '#b3262e', '#e7c43a', '#f4f1ea'];
const AZUL_PORTAL = '#24337a';
const FLORES = ['#f28b30', '#e7c43a', '#d8433a', '#ef7fa8', '#f4f1ea', '#f5a623'];

class Guirnalda {
  constructor(a, b, largoBanderin, desfase) {
    this.a = a;
    this.b = b;
    this.largoBanderin = largoBanderin;
    this.desfase = desfase;
    this.colgadaEn = null;
    this.reposo = (Math.hypot(b[0] - a[0], b[1] - a[1]) * HOLGURA) / (NODOS - 1);
    // arranca tensa y recta entre las anclas; al soltarla la gravedad la curva
    this.nodos = Array.from({ length: NODOS }, (_, i) => {
      const t = i / (NODOS - 1);
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      return { x, y, px: x, py: y };
    });
  }

  actualizar(ahora, dt) {
    if (this.colgadaEn === null || ahora < this.colgadaEn) return;
    const n = this.nodos;
    for (let i = 1; i < NODOS - 1; i++) {
      const q = n[i];
      const vx = (q.x - q.px) * AMORTIGUA;
      const vy = (q.y - q.py) * AMORTIGUA;
      q.px = q.x;
      q.py = q.y;
      q.x += vx;
      q.y += vy + GRAVEDAD * dt * dt;
    }
    for (let k = 0; k < ITERACIONES; k++) {
      for (let i = 0; i < NODOS - 1; i++) {
        const u = n[i];
        const v = n[i + 1];
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const d = Math.hypot(dx, dy) || 1;
        const corr = (d - this.reposo) / d / 2;
        // las anclas (primer y último nodo) no se mueven
        if (i > 0) {
          u.x += dx * corr;
          u.y += dy * corr;
        }
        if (i + 1 < NODOS - 1) {
          v.x -= dx * corr;
          v.y -= dy * corr;
        }
      }
    }
  }

  dibujar(p) {
    if (this.colgadaEn === null) return;
    const n = this.nodos;
    p.noFill();
    p.stroke('#3b3b3f');
    p.strokeWeight(1.2);
    p.beginShape();
    for (const q of n) p.vertex(q.x, q.y);
    p.endShape();
    p.noStroke();
    for (let i = 0; i < NODOS - 1; i++) {
      const u = n[i];
      const v = n[i + 1];
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const d = Math.hypot(dx, dy) || 1;
      // normal hacia abajo del segmento: el banderín cuelga perpendicular a la cuerda
      let nx = -dy / d;
      let ny = dx / d;
      if (ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      const m = 0.12;
      p.fill(COLORES_BANDERIN[i % COLORES_BANDERIN.length]);
      p.triangle(
        u.x + dx * m, u.y + dy * m,
        v.x - dx * m, v.y - dy * m,
        (u.x + v.x) / 2 + nx * this.largoBanderin, (u.y + v.y) / 2 + ny * this.largoBanderin,
      );
    }
  }
}

function anclasEntreColumnas() {
  const cols = [...COLUMNAS].sort((a, b) => a.x - b.x);
  const pares = [];
  let prev = null;
  for (const c of cols) {
    if (prev && c.x - prev.x > 50) pares.push([prev, c]);
    if (!prev || c.x - prev.x > 50) prev = c;
  }
  return pares.map(([c1, c2]) => [
    [c1.x, c1.top + (c1.base - c1.top) * 0.32],
    [c2.x, c2.top + (c2.base - c2.top) * 0.32],
  ]);
}

function anclasFachada() {
  // a lo largo del borde superior del vidrio, de la esquina hacia el fondo
  const xs = [940, 1090, 1240, 1390, 1540];
  return xs.slice(0, -1).map((x, i) => [
    P(x, 596 + (x - 935) * 0.3015),
    P(xs[i + 1], 596 + (xs[i + 1] - 935) * 0.3015),
  ]);
}

export class Decoracion {
  constructor() {
    this.reiniciar();
  }

  reiniciar() {
    this.activaDesde = null;
    this.guirnaldas = [
      ...anclasEntreColumnas().map(([a, b]) => this.nuevaGuirnalda(a, b, 17)),
      ...anclasFachada().map(([a, b]) => this.nuevaGuirnalda(a, b, 13)),
    ];
  }

  nuevaGuirnalda(a, b, largo) {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    return new Guirnalda(a, b, largo, Math.hypot(mx - PUERTA[0], my - PUERTA[1]) * RETRASO_POR_PX);
  }

  activar(ahora) {
    this.activaDesde = ahora;
    for (const g of this.guirnaldas) g.colgadaEn = ahora + 500 + g.desfase;
  }

  actualizar(ahora, dt) {
    for (const g of this.guirnaldas) g.actualizar(ahora, dt);
  }

  // radiografía de los banderines: nodos de la cadena y sus anclas fijas
  dibujarRadiografia(p) {
    for (const g of this.guirnaldas) {
      if (g.colgadaEn === null) continue;
      p.stroke('#6b6b70');
      p.strokeWeight(1.5);
      p.noFill();
      p.beginShape();
      for (const q of g.nodos) p.vertex(q.x, q.y);
      p.endShape();
      p.noStroke();
      g.nodos.forEach((q, i) => {
        const ancla = i === 0 || i === g.nodos.length - 1;
        p.fill(ancla ? '#b3262e' : '#6b6b70');
        p.circle(q.x, q.y, ancla ? 8 : 4.5);
      });
    }
  }

  // banderines: detrás de la gente, delante de la fachada
  dibujarFondo(p) {
    for (const g of this.guirnaldas) g.dibujar(p);
  }

  // portal y corona entran al orden de profundidad junto con las personas
  utileria(p, ahora) {
    if (this.activaDesde === null) return [];
    const t = (ahora - this.activaDesde) / 700;
    const [, basePortal] = P(748, 902);
    const [, baseCorona] = P(652, 906);
    return [
      { y: basePortal, pintar: () => portal(p, facilidad(t)) },
      { y: baseCorona, pintar: () => corona(p, facilidad(t - 0.6)) },
    ];
  }
}

function facilidad(t) {
  const u = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - u, 3);
}

// Portal de bienvenida sobre la puerta: sube desde el piso.
function portal(p, t) {
  if (t <= 0) return;
  const [x0, yPiso] = P(690, 902);
  const [x1] = P(806, 902);
  const [, yViga] = P(0, 735);
  const alto = (yPiso - yViga) * t;
  const poste = 9;
  const viga = 26;
  p.noStroke();
  p.fill(AZUL_PORTAL);
  p.rect(x0, yPiso - alto, poste, alto);
  p.rect(x1 - poste, yPiso - alto, poste, alto);
  p.rect(x0 - 4, yPiso - alto, x1 - x0 + 8, viga);
  // flor de acento en los postes, como en la referencia
  p.fill('#f28b30');
  p.circle(x0 + poste / 2, yPiso - alto + viga + 12, 6);
  p.circle(x1 - poste / 2, yPiso - alto + viga + 12, 6);
  if (t > 0.9) {
    p.fill('#ffffff');
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Archivo');
    p.textStyle(p.BOLD);
    p.textSize(13);
    p.text('FELICITACIONES', (x0 + x1) / 2, yPiso - alto + 10);
    p.textStyle(p.NORMAL);
    p.textSize(8);
    p.text('GRADUADOS 2026', (x0 + x1) / 2, yPiso - alto + 20);
  }
}

// Corona de flores sobre su atril, al lado del portal.
function corona(p, t) {
  if (t <= 0) return;
  const [cx, yPiso] = P(652, 906);
  const r = 17 * t;
  const cy = yPiso - 34;
  p.stroke('#d9d4c8');
  p.strokeWeight(2);
  p.line(cx - 8, yPiso, cx - 2, cy);
  p.line(cx + 8, yPiso, cx + 2, cy);
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    p.fill(FLORES[i % FLORES.length]);
    p.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 7.5 * t);
  }
  p.fill(AZUL_PORTAL);
  p.circle(cx, cy, r * 1.35);
}
