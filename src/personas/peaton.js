// Peatón: un agente con fuerzas de dirección (Nature of Code, cap. 5).
// Cada fuerza que actúa sobre él tiene un significado en el discurso:
//   · seguir carril   → pasar de largo por el bulevar (sin vínculo con el Fórum)
//   · separación      → cada quien ocupa su propio espacio en la acera
//   · llegar al grupo  → el graduado se engancha a la cadena de su grupo
// Ya en el grupo deja de dirigirse a sí mismo: lo mueven los vínculos de la red (red/vinculo.js).

import { alturaEn, PUERTA } from '../escenas/bulevar.js';
import { nuevoAspecto, dibujarSilueta, dibujarFrontal, dibujarBirrete } from './silueta.js';

const VELOCIDAD = { joven: 1.15, adulto: 1.0, mayor: 0.72 };
const ENFRIAMIENTO_SALTO = 6000; // ms: una misma onda no puede volver a levantar a la misma persona
const FRICCION_GRUPO = 0.82; // amortiguamiento por cuadro de quien está en el grupo

export class Peaton {
  constructor(carril, sentido, generacion, x, y) {
    this.carril = carril; // polilínea (ya en orden según el sentido)
    this.sentido = sentido; // +1 hacia la derecha/fondo, -1 hacia la izquierda/frente
    this.generacion = generacion;
    this.aspecto = nuevoAspecto(generacion);
    this.pos = { x, y };
    this.vel = { x: sentido, y: 0 };
    this.acc = { x: 0, y: 0 };
    this.ritmo = VELOCIDAD[generacion] * (0.9 + Math.random() * 0.2);
    this.fase = Math.random() * Math.PI * 2;
    this.alfa = 0;

    // estado del relevo
    this.modo = 'pasa'; // 'pasa' | 'convocado' | 'reunirse' | 'celebra'
    this.toga = 0;
    this.esperaToga = 0;
    this.fuera = false;

    // celebración
    this.grupo = null;
    this.z = 0; // altura del salto sobre el piso
    this.vz = 0;
    this.libreDesde = 0; // desde cuándo puede volver a saltar
    this.brazos = 0; // 0 abajo … 1 arriba
    this.birrete = null; // birrete en el aire { x, y, vx, vy, giro, vgiro }
  }

  get h() {
    return alturaEn(this.pos.y);
  }
  // velocidad máxima proporcional a la altura aparente: misma velocidad real a toda profundidad
  get vmax() {
    const prisa = this.modo === 'reunirse' ? 1.25 : 1;
    return this.h * 0.0125 * this.ritmo * prisa;
  }
  get fmax() {
    return this.vmax * 0.06;
  }

  aplicar(f, peso = 1) {
    this.acc.x += f.x * peso;
    this.acc.y += f.y * peso;
  }

  // Reynolds: fuerza = deseada − velocidad, limitada
  buscar(t, llegar = false) {
    let dx = t.x - this.pos.x;
    let dy = t.y - this.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    let v = this.vmax;
    if (llegar && d < 80) v *= Math.max(0.05, d / 80);
    dx = (dx / d) * v - this.vel.x;
    dy = (dy / d) * v - this.vel.y;
    return limitar({ x: dx, y: dy }, this.fmax * (llegar ? 2 : 1));
  }

  seguirCarril() {
    const vm = Math.hypot(this.vel.x, this.vel.y) || 1;
    const futuro = { x: this.pos.x + (this.vel.x / vm) * 30, y: this.pos.y + (this.vel.y / vm) * 30 };
    let mejor = null;
    let dMin = Infinity;
    for (let i = 0; i < this.carril.length - 1; i++) {
      const a = this.carril[i];
      const b = this.carril[i + 1];
      const n = puntoNormal(futuro, a, b);
      const d = Math.hypot(futuro.x - n.x, futuro.y - n.y);
      if (d < dMin) {
        dMin = d;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        mejor = { x: n.x + ((b[0] - a[0]) / L) * 40, y: n.y + ((b[1] - a[1]) / L) * 40 };
      }
    }
    if (dMin > this.h * 0.08) return this.buscar(mejor);
    // en el carril: solo mantener el paso
    const vmx = Math.hypot(this.vel.x, this.vel.y) || 1;
    return limitar({ x: (this.vel.x / vmx) * this.vmax - this.vel.x, y: (this.vel.y / vmx) * this.vmax - this.vel.y }, this.fmax);
  }

  separar(otros) {
    const deseada = this.h * 0.32;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const o of otros) {
      if (o === this) continue;
      // quien ya está en su grupo no esquiva: los demás rodean al grupo
      const dx = this.pos.x - o.pos.x;
      const dy = (this.pos.y - o.pos.y) * 2.5; // la profundidad separa más que lo lateral
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < deseada) {
        sx += dx / d / d;
        sy += dy / d / d;
        n++;
      }
    }
    if (!n) return { x: 0, y: 0 };
    const m = Math.hypot(sx, sy) || 1;
    return limitar({ x: (sx / m) * this.vmax - this.vel.x, y: (sy / m) * this.vmax * 0.4 - this.vel.y }, this.fmax * 1.5);
  }

  // El llamado sale de la puerta del Fórum: llega antes a quien está más cerca.
  convocar(ahora, grupo) {
    this.modo = 'convocado';
    this.grupo = grupo;
    const d = Math.hypot(this.pos.x - PUERTA[0], this.pos.y - PUERTA[1]);
    this.esperaToga = ahora + d * 1.6; // ms
  }

  // Saltar y lanzar el birrete. Lo dispara el grupo al completarse o el tirón de un vínculo.
  saltar(ahora) {
    if (this.modo !== 'celebra' || this.z > 0 || ahora < this.libreDesde) return;
    const h = this.h;
    this.vz = 0.04 * h; // sube ~0.3 de su altura y tarda ~½ s en volver al piso
    this.libreDesde = ahora + ENFRIAMIENTO_SALTO;
    this.birrete = {
      x: this.pos.x,
      y: this.pos.y - h * 1.04,
      vx: (Math.random() - 0.5) * h * 0.012,
      vy: -(0.085 + Math.random() * 0.02) * h,
      giro: 0,
      vgiro: (Math.random() - 0.5) * 0.25,
    };
  }

  actualizar(otros, ahora, dt) {
    if (this.modo === 'convocado' && ahora > this.esperaToga) {
      this.toga = Math.min(1, this.toga + 0.018 * dt);
      if (this.toga >= 1) this.modo = 'reunirse';
    }

    if (this.modo === 'celebra') {
      this.celebrar(ahora, dt);
    } else {
      let destino = null;
      if (this.modo === 'reunirse') {
        destino = this.grupo.destino(this);
        this.aplicar(this.buscar(destino, true), 1.5);
        this.aplicar(this.separar(otros), 0.4);
      } else {
        this.aplicar(this.seguirCarril(), 1);
        this.aplicar(this.separar(otros), 1.2);
      }
      this.mover(dt);

      if (destino) {
        const d = Math.hypot(this.pos.x - destino.x, this.pos.y - destino.y);
        const quieto = Math.hypot(this.vel.x, this.vel.y) < 0.1;
        const r = this.grupo.reposo;
        if (d < r * 0.3 || (d < r * 0.6 && quieto)) {
          this.modo = 'celebra';
          this.vel = { x: 0, y: 0 };
          // quien completa el grupo da el primer salto: de ahí parte la onda
          if (this.grupo.enganchar(this, destino)) this.saltar(ahora);
        }
      }
    }

    this.alfa = Math.min(1, this.alfa + 0.04 * dt);
    // los carriles nacen fuera de cuadro (≈ −380 y 2300): solo se sale más allá de eso.
    // Quien ya tiene grupo nunca se retira: se da la vuelta y regresa.
    if (this.modo === 'pasa' && (this.pos.x < -420 || this.pos.x > 2340)) this.fuera = true;
  }

  mover(dt) {
    this.vel.x += this.acc.x * dt;
    this.vel.y += this.acc.y * dt;
    const v = limitar(this.vel, this.vmax);
    this.vel.x = v.x;
    this.vel.y = v.y;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.acc.x = 0;
    this.acc.y = 0;
    const rapidez = Math.hypot(this.vel.x, this.vel.y);
    this.fase += (rapidez / (this.h * 0.26)) * dt;
  }

  // En el grupo: de frente, movido solo por la red (vínculos + ancla) y frenado por fricción.
  celebrar(ahora, dt) {
    const h = this.h;
    this.vel.x = (this.vel.x + this.acc.x * dt) * Math.pow(FRICCION_GRUPO, dt);
    this.vel.y = (this.vel.y + this.acc.y * dt) * Math.pow(FRICCION_GRUPO, dt);
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.acc.x = 0;
    this.acc.y = 0;

    // salto: gravedad a escala de la persona
    if (this.z > 0 || this.vz > 0) {
      this.vz -= 0.00267 * h * dt;
      this.z += this.vz * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
      }
    }

    const b = this.birrete;
    if (b) {
      b.vy += 0.0022 * h * dt; // gravedad a escala de la persona
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.giro += b.vgiro * dt;
      // lo atrapa al volver a la altura de su cabeza
      if (b.vy > 0 && b.y >= this.pos.y - this.z - h * 1.04) this.birrete = null;
    }
    const brazosMeta = this.z > 0 || this.birrete ? 1 : 0;
    this.brazos += (brazosMeta - this.brazos) * Math.min(1, 0.25 * dt);
  }

  dibujar(p) {
    const h = this.h;
    p.push();
    p.translate(this.pos.x, this.pos.y);
    // sombra en el piso
    p.noStroke();
    const sombra = 1 - Math.min(0.5, this.z / h);
    p.fill(0, 0, 0, 40 * this.alfa * sombra);
    p.ellipse(0, 0, h * 0.26 * sombra, h * 0.05 * sombra);
    if (this.modo === 'celebra') {
      p.translate(0, -this.z);
      p.scale(h / 100);
      dibujarFrontal(p, this.aspecto, this.brazos, !this.birrete);
    } else {
      const rapidez = Math.hypot(this.vel.x, this.vel.y);
      p.scale((h / 100) * (this.vel.x >= 0 ? 1 : -1), h / 100);
      dibujarSilueta(p, this.aspecto, this.fase, Math.min(1, rapidez / (this.vmax * 0.5)), this.toga, Math.max(0, this.alfa));
    }
    p.pop();
  }

  dibujarBirreteEnElAire(p) {
    const b = this.birrete;
    if (!b) return;
    p.push();
    p.translate(b.x, b.y);
    p.scale((this.h / 100) * 1.5); // exagerado para que se lea en la pantalla grande
    p.rotate(b.giro);
    dibujarBirrete(p);
    p.pop();
  }
}

function limitar(v, m) {
  const d = Math.hypot(v.x, v.y);
  return d > m ? { x: (v.x / d) * m, y: (v.y / d) * m } : v;
}

function puntoNormal(p, a, b) {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p.x - a[0]) * abx + (p.y - a[1]) * aby) / (abx * abx + aby * aby)));
  return { x: a[0] + abx * t, y: a[1] + aby * t };
}
