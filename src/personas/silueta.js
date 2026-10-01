// Silueta plana de una persona, armada por partes para que el vestuario pueda cambiar
// sin que la persona deje de ser la misma (el estudiante que se vuelve graduado).
// Coordenadas locales: origen en los pies, mira hacia +x, altura total = 100 unidades.

const PIELES = ['#f1c7a5', '#e0a883', '#c88a62', '#a86a45', '#7d4b2e'];
const PELOS_JOVEN = ['#2b1d16', '#3d2a1e', '#1a1a1a', '#6b4a2f', '#8a5a2b'];

const ROPA = {
  joven: {
    torso: ['#3f8f8a', '#d9a441', '#d86a5a', '#8c7bb8', '#5d86b8', '#e0e0d8'],
    pierna: ['#3b4f6e', '#2f3a4a', '#566a86', '#6d6255'],
  },
  adulto: {
    torso: ['#2f3a52', '#3a3f45', '#5a5e3e', '#6b3f3f'],
    pierna: ['#25292e', '#3a3f45', '#4a4238'],
  },
  mayor: {
    torso: ['#a58a6a', '#7f6a55', '#8f8a7a', '#6e7a70'],
    pierna: ['#5a5550', '#4a4540', '#6a645c'],
  },
};

const TOGA = '#1b1b22';
const ESTOLA = '#b3262e';
const BORLA = '#c9302c'; // borla roja, como en las fotos de grados UPB

const elegir = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function nuevoAspecto(generacion) {
  const r = ROPA[generacion];
  return {
    generacion,
    piel: elegir(PIELES),
    pelo: generacion === 'mayor' ? elegir(['#d9d6cf', '#bdb8ae', '#9c978d']) : elegir(PELOS_JOVEN),
    peloLargo: Math.random() < 0.45,
    torso: elegir(r.torso),
    pierna: elegir(r.pierna),
    corpulencia: 0.9 + Math.random() * 0.25,
  };
}

function sombra(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function extremidad(p, x, y, largo, grosor, ang, color) {
  p.push();
  p.translate(x, y);
  p.rotate(ang);
  p.fill(color);
  p.rect(-grosor / 2, 0, grosor, largo, grosor / 2);
  p.pop();
}

// fase: ciclo de marcha · paso: 0 quieto … 1 caminando · toga: 0 … 1 vestido de grado
export function dibujarSilueta(p, a, fase, paso, toga, alfa) {
  const ctx = p.drawingContext;
  ctx.globalAlpha = alfa;
  p.noStroke();

  const mayor = a.generacion === 'mayor';
  const inclinacion = mayor ? 0.07 : 0.02;
  const vaiven = Math.sin(fase) * 0.42 * paso;
  const rebote = Math.abs(Math.cos(fase)) * 1.4 * paso;
  const ancho = 17 * a.corpulencia;

  p.push();
  p.translate(0, -rebote);

  // pierna y brazo del fondo (más oscuros)
  extremidad(p, 0, -47, 47, 7.5, vaiven, sombra(a.pierna, 0.75));
  extremidad(p, 1, -79, 33, 5.5, -vaiven * 0.9, sombra(a.torso, 0.72));

  p.push();
  p.rotate(inclinacion);

  // mochila / maletín según generación (se ocultan bajo la toga)
  if (a.generacion === 'joven' && toga < 0.6) {
    p.fill(sombra(a.torso, 0.55));
    p.rect(-ancho / 2 - 8, -80, 10, 26, 4);
  }

  // torso
  p.fill(a.torso);
  p.rect(-ancho / 2, -84, ancho, 40, 6);
  if (a.generacion === 'adulto') {
    p.fill(sombra(a.torso, 1.5));
    p.triangle(ancho / 2 - 1, -84, ancho / 2 - 1, -66, ancho / 2 - 7, -84); // solapa de camisa
  }

  // toga: crece desde los hombros hasta los tobillos
  if (toga > 0) {
    const largo = 38 + 40 * toga;
    p.fill(TOGA);
    p.beginShape();
    p.vertex(-ancho / 2 - 1, -84);
    p.vertex(ancho / 2 + 1, -84);
    p.vertex(ancho / 2 + 6 * toga, -84 + largo);
    p.vertex(-ancho / 2 - 6 * toga, -84 + largo);
    p.endShape(p.CLOSE);
    // estola roja
    p.fill(ESTOLA);
    p.rect(ancho / 2 - 5, -84, 5, 12 + 26 * toga, 2);
  }

  // cuello y cabeza
  p.fill(sombra(a.piel, 0.9));
  p.rect(-2.5, -88, 5, 6);
  p.fill(a.piel);
  p.ellipse(1, -93, 13, 14);

  // pelo
  p.fill(a.pelo);
  p.arc(0, -94, 14, 14, Math.PI * 0.95, Math.PI * 2.05);
  if (a.peloLargo) p.rect(-7, -95, 6, 14, 3);

  // birrete: cae sobre la cabeza a medida que avanza la toga
  if (toga > 0.35) {
    const t = Math.min(1, (toga - 0.35) / 0.65);
    p.push();
    p.translate(0, -(1 - t) * 30);
    ctx.globalAlpha = alfa * t;
    p.fill(TOGA);
    p.rect(-6, -103, 13, 5, 1);
    p.quad(-11, -103, 12, -103, 9, -106, -8, -106);
    p.stroke(BORLA);
    p.strokeWeight(1.3);
    p.line(8, -104, 11, -95);
    p.noStroke();
    ctx.globalAlpha = alfa;
    p.pop();
  }
  p.pop(); // inclinación

  // pierna y brazo del frente
  extremidad(p, 0, -47, 47, 7.5, -vaiven, toga > 0.7 ? sombra(TOGA, 1.6) : a.pierna);
  const brazo = toga > 0.5 ? TOGA : a.torso;
  extremidad(p, 1, -79, 33, 5.5, vaiven * 0.9, brazo);
  // mano / maletín
  const [hx, hy] = [1 - Math.sin(vaiven * 0.9) * 33, -79 + Math.cos(vaiven * 0.9) * 33];
  p.fill(a.piel);
  p.circle(hx, hy, 5.5);
  if (a.generacion === 'adulto') {
    p.fill('#3a2a22');
    p.rect(hx - 6, hy + 1, 12, 9, 1.5);
  }

  p.pop();
  ctx.globalAlpha = 1;
}

// Graduado de frente, posando con su grupo (ver captura de grupo con estola en V).
// brazos: 0 a los lados … 1 arriba lanzando · conBirrete: false cuando el birrete está en el aire
export function dibujarFrontal(p, a, brazos, conBirrete) {
  p.noStroke();
  const ancho = 24 * a.corpulencia;

  // zapatos bajo la toga
  p.fill('#15151a');
  p.rect(-7, -4, 6, 4, 1.5);
  p.rect(1, -4, 6, 4, 1.5);

  // brazos (mangas anchas de toga): giran desde los hombros
  const angBajo = 0.18;
  const angAlto = 2.75;
  const ang = angBajo + (angAlto - angBajo) * brazos;
  for (const lado of [-1, 1]) {
    p.push();
    p.translate(lado * (ancho / 2 - 2), -80);
    p.rotate(lado * -ang);
    p.fill(TOGA);
    p.rect(-4, 0, 8, 30, 3.5);
    p.fill(a.piel);
    p.circle(0, 32, 5.5);
    p.pop();
  }

  // toga: hombros → tobillos, ensanchándose
  p.fill(TOGA);
  p.beginShape();
  p.vertex(-ancho / 2, -84);
  p.vertex(ancho / 2, -84);
  p.vertex(ancho / 2 + 5, -5);
  p.vertex(-ancho / 2 - 5, -5);
  p.endShape(p.CLOSE);

  // cuello blanco y estola roja en V
  p.fill('#f2efe8');
  p.triangle(-3.5, -85, 3.5, -85, 0, -79);
  p.fill(ESTOLA);
  p.quad(-ancho / 2 + 1, -84, -ancho / 2 + 6, -84, 1.5, -50, -1.5, -53);
  p.quad(ancho / 2 - 1, -84, ancho / 2 - 6, -84, -1.5, -50, 1.5, -53);

  // cabeza y pelo
  p.fill(sombra(a.piel, 0.9));
  p.rect(-2.5, -89, 5, 6);
  p.fill(a.piel);
  p.ellipse(0, -93, 13, 14.5);
  p.fill(a.pelo);
  p.arc(0, -95, 14, 12, Math.PI, Math.PI * 2);
  if (a.peloLargo) {
    p.rect(-7.5, -96, 3.5, 17, 2);
    p.rect(4, -96, 3.5, 17, 2);
  }

  if (conBirrete) {
    p.push();
    p.translate(0, -99);
    dibujarBirrete(p);
    p.pop();
  }
}

// Birrete visto de frente: tablero + casquete + borla. Origen en la base del casquete.
export function dibujarBirrete(p) {
  p.noStroke();
  p.fill(TOGA);
  p.rect(-6.5, -2, 13, 5, 1.5);
  p.quad(-12, -2.5, 12, -2.5, 8, -5.5, -8, -5.5);
  p.stroke(BORLA);
  p.strokeWeight(1.4);
  p.line(0, -4, 10, -1);
  p.line(10, -1, 10.5, 7);
  p.noStroke();
}
