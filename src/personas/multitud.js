// Sistema de partículas de peatones: nacen en los extremos del bulevar, lo recorren y salen.
// La población se mantiene estable; lo que cambia entre diapositivas son las fuerzas.

import { ANCHO, CARRILES, COLUMNAS, PUERTA, PUNTOS_ENCUENTRO, pintarColumna } from '../escenas/bulevar.js';
import { Peaton } from './peaton.js';
import { Grupo } from './grupo.js';
import { Red } from '../red/vinculo.js';

// Puentes entre grupos vecinos: vínculos largos y débiles (amistad entre grupos).
// Casi no tiran (rigidez baja) pero transmiten el salto, más despacio que dentro del grupo.
const PUENTE = { tipo: 'puente', rigidez: 0.0015, confianza: 0.35 };

// cuántas personas sostiene cada carril (el cercano lleva menos: ocupan más pantalla)
const CUPO = [9, 7, 5];

function generacionAlAzar() {
  const r = Math.random();
  return r < 0.45 ? 'joven' : r < 0.8 ? 'adulto' : 'mayor';
}

export class Multitud {
  constructor() {
    this.personas = [];
    this.grupos = [];
    this.red = new Red();
    this.puentes = new Map();
    this.primeraOla = 0;
    this.llamadoActivo = false;
  }

  crear(i, alInicio, generacion = generacionAlAzar()) {
    const sentido = Math.random() < 0.5 ? 1 : -1;
    const carril = sentido > 0 ? CARRILES[i] : [...CARRILES[i]].reverse();
    let x;
    let y;
    if (alInicio) {
      [x, y] = carril[0];
      x -= sentido * (20 + Math.random() * 120);
    } else {
      // repartidos a lo largo del carril al abrir la presentación
      const seg = Math.floor(Math.random() * (carril.length - 1));
      const t = Math.random();
      x = carril[seg][0] + (carril[seg + 1][0] - carril[seg][0]) * t;
      y = carril[seg][1] + (carril[seg + 1][1] - carril[seg][1]) * t;
    }
    const pe = new Peaton(carril, sentido, generacion, x, y);
    pe.iCarril = i;
    if (!alInicio) pe.alfa = 1;
    this.personas.push(pe);
    return pe;
  }

  poblar() {
    this.personas = [];
    this.grupos = [];
    this.red = new Red();
    this.puentes = new Map(); // 'i-j' → vínculo entre los grupos i y j (ordenados de izq. a der.)
    const cercaDeLaPuerta = [...PUNTOS_ENCUENTRO].sort(
      (a, b) => Math.hypot(a[0] - PUERTA[0], a[1] - PUERTA[1]) - Math.hypot(b[0] - PUERTA[0], b[1] - PUERTA[1]),
    );
    this.grupos.push(...cercaDeLaPuerta.map(([x, y]) => new Grupo(x, y, this.red)));
    this.primeraOla = 0;
    this.llamadoActivo = false;
    CUPO.forEach((n, i) => {
      for (let k = 0; k < n; k++) this.crear(i, false);
    });
  }

  get celebrando() {
    return this.personas.filter((pe) => pe.modo === 'celebra').length;
  }

  // Un joven que pasa recibe el llamado solo si hay un puesto libre esperándolo.
  // Los grupos se abren de uno en uno desde la puerta: nadie queda celebrando solo
  // mientras haya un grupo empezado con espacio.
  convocar(pe, ahora) {
    if (pe.modo !== 'pasa' || pe.generacion !== 'joven') return false;
    const abiertos = this.grupos.filter((g) => g.libre && g.miembros.length > 0);
    let mejor = null;
    let dMin = Infinity;
    for (const g of abiertos) {
      const d = Math.hypot(g.x - pe.pos.x, g.y - pe.pos.y);
      if (d < dMin) {
        dMin = d;
        mejor = g;
      }
    }
    mejor ??= this.grupos.find((g) => g.miembros.length === 0); // ya vienen ordenados desde la puerta
    if (!mejor) return false;
    mejor.reservar(pe);
    pe.convocar(ahora, mejor);
    return true;
  }

  // Diapositiva 2: el Fórum se viste de grados y llama solo a los jóvenes.
  llamarAGrados(ahora) {
    this.llamadoActivo = true;
    const visibles = this.personas.filter((pe) => pe.pos.x > 0 && pe.pos.x < ANCHO);
    for (const pe of visibles) if (this.convocar(pe, ahora)) this.primeraOla++;
  }

  actualizar(ahora, dt) {
    // primero la red acumula sus fuerzas; luego cada persona integra las suyas
    this.red.aplicarFuerzas();
    for (const g of this.grupos) g.aplicarAncla();
    for (const pe of this.personas) pe.actualizar(this.personas, ahora, dt);
    this.red.transmitir(ahora, dt);
    this.tenderPuentes();
    // mientras dure el llamado, todo joven que entra a cuadro también lo escucha
    if (this.llamadoActivo) {
      for (const pe of this.personas) if (pe.pos.x > 0 && pe.pos.x < ANCHO) this.convocar(pe, ahora);
    }
    this.personas = this.personas.filter((pe) => !pe.fuera);

    // reponer el flujo del bulevar
    CUPO.forEach((n, i) => {
      const enCarril = this.personas.filter((pe) => pe.iCarril === i && pe.modo === 'pasa').length;
      if (enCarril < n && Math.random() < 0.02 * dt) {
        this.crear(i, true);
      }
    });
  }

  // Un puente une los extremos enfrentados de dos grupos vecinos. Cuando una fila crece,
  // su extremo cambia y el puente se vuelve a tender hacia el nuevo extremo.
  tenderPuentes() {
    const orden = [...this.grupos].sort((a, b) => a.x - b.x);
    for (let i = 0; i < orden.length - 1; i++) {
      const g1 = orden[i];
      const g2 = orden[i + 1];
      if (!g1.cadena.length || !g2.cadena.length) continue;
      const a = g1.cadena.at(-1);
      const b = g2.cadena[0];
      const clave = `${i}-${i + 1}`;
      const actual = this.puentes.get(clave);
      if (actual && actual.a === a && actual.b === b) continue;
      if (actual) this.red.soltar(actual);
      const reposo = Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y);
      this.puentes.set(clave, this.red.unir(a, b, { ...PUENTE, reposo }));
    }
  }

  // Radiografía: las personas como partículas y los puntos de encuentro como anclas.
  dibujarRadiografia(p) {
    const COLOR = { joven: '#1f9e96', adulto: '#3a4f9a', mayor: '#9a6a3a' };
    p.noFill();
    p.stroke('#b3262e');
    p.strokeWeight(2);
    for (const g of this.grupos) {
      p.line(g.x - 10, g.y - 10, g.x + 10, g.y + 10);
      p.line(g.x - 10, g.y + 10, g.x + 10, g.y - 10);
    }
    this.red.dibujarRadiografia(p);
    p.noStroke();
    for (const pe of this.personas) {
      const y = pe.pos.y - pe.z - pe.h * 0.6;
      p.fill(pe.toga > 0.5 ? '#1b1b22' : COLOR[pe.generacion]);
      p.circle(pe.pos.x, y, pe.modo === 'celebra' ? 14 : 9);
      if (pe.modo === 'pasa') {
        // dirección de marcha: la única relación de quien pasa es con su carril
        p.stroke(COLOR[pe.generacion]);
        p.strokeWeight(1.5);
        p.line(pe.pos.x, y, pe.pos.x + pe.vel.x * 14, y + pe.vel.y * 14);
        p.noStroke();
      }
    }
  }

  // Personas, columnas y utilería comparten el mismo orden de profundidad (por la y de sus bases).
  dibujar(p, utileria = []) {
    const capas = [
      ...this.personas.map((pe) => ({ y: pe.pos.y, pintar: () => pe.dibujar(p) })),
      ...COLUMNAS.map((c) => ({ y: c.base, pintar: () => pintarColumna(p, c) })),
      ...utileria,
    ];
    capas.sort((a, b) => a.y - b.y);
    for (const c of capas) c.pintar();
    // los birretes en el aire van por encima de todo
    for (const pe of this.personas) pe.dibujarBirreteEnElAire(p);
  }
}
