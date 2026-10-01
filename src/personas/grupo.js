// Grupo de celebración: una cadena de graduados unidos por vínculos, anclada a un punto de
// encuentro frente al Fórum (como una fila abrazada para la foto).
//
//   · ancla            → el punto de encuentro sostiene la fila en su lugar (y la mantiene centrada)
//   · cadena           → cada graduado está unido a sus vecinos; la forma del grupo es el equilibrio
//   · llegar           → el que llega se engancha al extremo más cercano y la fila se reacomoda
//   · grupo completo   → el último en llegar salta: la onda recorre la cadena y cruza los puentes

import { alturaEn } from '../escenas/bulevar.js';

const CUPO = 5;
const RIGIDEZ = 0.05;
const CONFIANZA_GRUPO = 0.9;
const K_ANCLA_Y = 0.02; // devuelve la fila a la línea del punto de encuentro
const K_CENTRO_X = 0.004; // centra la fila sobre el punto de encuentro

export class Grupo {
  constructor(x, y, red) {
    this.x = x;
    this.y = y;
    this.red = red;
    this.miembros = []; // convocados a este grupo (lleguen o no todavía)
    this.cadena = []; // en su lugar, ordenados de izquierda a derecha
  }

  get libre() {
    return this.miembros.length < CUPO;
  }

  get reposo() {
    return alturaEn(this.y) * 0.34;
  }

  get completo() {
    return this.cadena.length === this.miembros.length;
  }

  reservar(peaton) {
    this.miembros.push(peaton);
  }

  // A dónde camina un convocado: al ancla si es el primero, o junto al extremo más cercano.
  destino(peaton) {
    if (!this.cadena.length) return { x: this.x, y: this.y, extremo: null };
    const izq = this.cadena[0];
    const der = this.cadena.at(-1);
    const porIzq = Math.abs(peaton.pos.x - (izq.pos.x - this.reposo)) < Math.abs(peaton.pos.x - (der.pos.x + this.reposo));
    return porIzq
      ? { x: izq.pos.x - this.reposo, y: izq.pos.y, extremo: izq, lado: 'izq' }
      : { x: der.pos.x + this.reposo, y: der.pos.y, extremo: der, lado: 'der' };
  }

  // Engancharse: se crea el vínculo con el extremo. Devuelve true si el grupo quedó completo.
  enganchar(peaton, d) {
    if (d.extremo) {
      this.red.unir(peaton, d.extremo, { tipo: 'grupo', reposo: this.reposo, rigidez: RIGIDEZ, confianza: CONFIANZA_GRUPO });
    }
    if (d.lado === 'izq') this.cadena.unshift(peaton);
    else this.cadena.push(peaton);
    return this.completo && this.cadena.length >= 2;
  }

  // El ancla del punto de encuentro actúa sobre toda la fila.
  aplicarAncla() {
    if (!this.cadena.length) return;
    const cx = this.cadena.reduce((s, m) => s + m.pos.x, 0) / this.cadena.length;
    for (const m of this.cadena) {
      m.aplicar({ x: K_CENTRO_X * (this.x - cx), y: K_ANCLA_Y * (this.y - m.pos.y) });
    }
  }
}
