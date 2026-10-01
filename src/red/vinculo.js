// La red: vínculos entre personas (resortes de Hooke, Nature of Code cap. 3/6).
//
// La ilustración muestra quiénes están; la red muestra cómo se relacionan.
// Cada vínculo tiene:
//   · reposo     → la distancia cómoda entre dos personas
//   · rigidez    → cuánto se resiste a estirarse o comprimirse (sostiene la forma del grupo)
//   · confianza  → qué tan rápido transmite un movimiento (0 … 1)
//
// La propagación no es un temporizador: mientras alguien está en el aire, su vínculo tira de
// quien está al otro lado. Ese tirón se acumula (más alto el salto, más tirón) y cuando llega
// a 1 la otra persona responde saltando. Con más confianza basta menos tiempo de tirón.

const AMORTIGUA_RESORTE = 0.08;

export class Vinculo {
  constructor(a, b, { tipo, reposo, rigidez, confianza }) {
    this.a = a;
    this.b = b;
    this.tipo = tipo; // 'grupo' | 'puente'
    this.reposo = reposo;
    this.rigidez = rigidez;
    this.confianza = confianza;
    this.tension = 0; // estiramiento relativo: >0 estirado, <0 comprimido
    this.tiron = new Map(); // tirón acumulado sobre cada extremo
  }

  otro(p) {
    return p === this.a ? this.b : this.a;
  }

  aplicar() {
    const { a, b } = this;
    const dx = b.pos.x - a.pos.x;
    const dy = b.pos.y - a.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    this.tension = (d - this.reposo) / this.reposo;
    // Hooke + amortiguamiento sobre la velocidad relativa a lo largo del vínculo
    const vRel = (b.vel.x - a.vel.x) * ux + (b.vel.y - a.vel.y) * uy;
    const f = this.rigidez * (d - this.reposo) + AMORTIGUA_RESORTE * vRel;
    if (a.modo === 'celebra') a.aplicar({ x: ux * f, y: uy * f });
    if (b.modo === 'celebra') b.aplicar({ x: -ux * f, y: -uy * f });
  }

  // El salto viaja por el vínculo: quien está en el piso acumula el tirón del que subió.
  transmitir(ahora, dt) {
    for (const [arriba, abajo] of [[this.a, this.b], [this.b, this.a]]) {
      if (arriba.z <= 0 || abajo.z > 0 || ahora < abajo.libreDesde) {
        this.tiron.set(abajo, 0);
        continue;
      }
      const t = (this.tiron.get(abajo) || 0) + 0.75 * this.confianza * (arriba.z / arriba.h) * dt;
      this.tiron.set(abajo, t);
      if (t >= 1) {
        this.tiron.set(abajo, 0);
        abajo.saltar(ahora);
      }
    }
  }
}

export class Red {
  constructor() {
    this.vinculos = [];
  }

  unir(a, b, opciones) {
    const v = new Vinculo(a, b, opciones);
    this.vinculos.push(v);
    return v;
  }

  soltar(v) {
    this.vinculos = this.vinculos.filter((x) => x !== v);
  }

  vecinos(p) {
    return this.vinculos.filter((v) => v.a === p || v.b === p);
  }

  aplicarFuerzas() {
    for (const v of this.vinculos) v.aplicar();
  }

  transmitir(ahora, dt) {
    for (const v of this.vinculos) v.transmitir(ahora, dt);
  }

  // Durante la charla: líneas tenues en el piso, entre los pies de quienes están vinculados.
  dibujarEnPiso(p) {
    p.strokeCap(p.ROUND);
    for (const v of this.vinculos) {
      const alfa = v.tipo === 'puente' ? 0.18 : 0.38;
      p.stroke(`rgba(28,28,34,${alfa})`);
      p.strokeWeight(v.tipo === 'puente' ? 1.2 : 2.2);
      if (v.tipo === 'puente') p.drawingContext.setLineDash([6, 6]);
      p.line(v.a.pos.x, v.a.pos.y, v.b.pos.x, v.b.pos.y);
      p.drawingContext.setLineDash([]);
    }
    p.noStroke();
  }

  // Radiografía: los vínculos a la altura del pecho, coloreados por tensión.
  dibujarRadiografia(p) {
    for (const v of this.vinculos) {
      const t = Math.max(-1, Math.min(1, v.tension * 3));
      // azul = comprimido · gris = en reposo · rojo = estirado
      const c = t > 0 ? [120 + 135 * t, 120 - 80 * t, 120 - 80 * t] : [120 + 40 * t, 120 + 30 * -t, 120 + 135 * -t];
      p.stroke(c[0], c[1], c[2]);
      p.strokeWeight(v.tipo === 'puente' ? 2 : 4);
      if (v.tipo === 'puente') p.drawingContext.setLineDash([10, 8]);
      const ya = v.a.pos.y - v.a.z - v.a.h * 0.6;
      const yb = v.b.pos.y - v.b.z - v.b.h * 0.6;
      p.line(v.a.pos.x, ya, v.b.pos.x, yb);
      p.drawingContext.setLineDash([]);
    }
    p.noStroke();
  }
}
