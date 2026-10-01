// Escena 1 — El bulevar frente al Fórum, trazado sobre referencias/bulevar-dia_DSC0751.jpg.
// Las coordenadas se escriben en píxeles de la foto (1600×1067) y P() las lleva al
// escenario lógico 1920×1080. Así cualquier ajuste se puede verificar contra la foto.

export const ANCHO = 1920;
export const ALTO = 1080;

export const P = (x, y) => [x * 1.2, (y - 30) * 1.04];

const C = {
  cieloArriba: '#b7bcc1',
  cieloAbajo: '#e4e2dc',
  nube: 'rgba(255,255,255,0.35)',
  ladrillo: '#8a6c5a',
  ladrilloSombra: '#735646',
  losa: '#efece5',
  losaCanto: '#d9d5cc',
  cielorraso: '#cbc5b8',
  luz: '#fff1c9',
  vidrio: '#7f8a88',
  vidrioInterior: '#d8c696',
  montante: '#4a5250',
  revestimiento: '#b8b2a6',
  revestimientoLinea: '#9f998d',
  edificioLejano: '#a9adae',
  ventanaLejana: '#dcd9cf',
  plaza: '#cbc4b6',
  plazaLinea: '#b9b2a4',
  asfalto: '#50535a',
  anden: '#9e958a',
  bordillo: '#e2ddd3',
  seto: '#4f6a3e',
  setoClaro: '#5f7c4a',
  arbol: '#5b7a45',
  arbolOscuro: '#46633a',
  columna: '#1c1c1f',
  letras: '#f4f1ea',
  senalUPB: '#e7c43a',
};

// ---------- Geometría compartida con la multitud ----------

// Carriles por los que camina la gente del bulevar, de lejos (0) a cerca (2).
// Van en paralelo a la fachada: pasar de largo es la relación inicial con el Fórum.
export const CARRILES = [
  [[-200, 956], [520, 951], [1000, 916], [1780, 858]],
  [[-200, 1004], [600, 994], [1080, 948], [1780, 885]],
  [[-200, 1062], [680, 1054], [1130, 1022], [1780, 925]],
].map((c) => c.map(([x, y]) => P(x, y)));

// Puerta principal bajo la marquesina, entre las columnas junto al letrero FÓRUM.
export const PUERTA = P(748, 900);

// Puntos de encuentro de los graduados: bajo la marquesina y en el andén frente a la entrada.
export const PUNTOS_ENCUENTRO = [
  [255, 934], [450, 936], [640, 928], [880, 922], [1070, 926],
].map(([x, y]) => P(x, y));

// Columnas de la marquesina: [x, yArriba, yBase, ancho] en coordenadas de foto.
// Se dibujan intercaladas con las personas (orden por yBase) para que la profundidad sea correcta.
export const COLUMNAS = [
  [157, 652, 897, 13],
  [215, 615, 905, 15],
  [385, 685, 900, 11],
  [403, 620, 902, 15],
  [305, 560, 918, 19],
  [598, 624, 902, 15],
  [820, 558, 910, 19],
  [545, 563, 918, 19],
  [484, 447, 945, 24],
].map(([x, y0, y1, w]) => {
  const [cx, top] = P(x, y0);
  const [, base] = P(x, y1);
  return { x: cx, top, base, w: w * 1.2 };
});

// Altura en px de una persona según su profundidad (y de los pies).
export function alturaEn(y) {
  const t = (y - 880) / (1085 - 880);
  return 62 + Math.max(0, Math.min(1.15, t)) * 118;
}

// ---------- Dibujo ----------

function poly(g, pts, color) {
  g.fill(color);
  g.noStroke();
  g.beginShape();
  for (const [x, y] of pts) g.vertex(...P(x, y));
  g.endShape(g.CLOSE);
}

function lerp2(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function cielo(g) {
  const ctx = g.drawingContext;
  const grad = ctx.createLinearGradient(0, 0, 0, ALTO * 0.8);
  grad.addColorStop(0, C.cieloArriba);
  grad.addColorStop(1, C.cieloAbajo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // nubes planas, fijas
  g.noStroke();
  g.fill(C.nube);
  const nubes = [
    [300, 180, 520, 70], [520, 140, 380, 50], [1250, 120, 620, 80],
    [1500, 250, 520, 60], [900, 300, 700, 50], [1700, 420, 400, 40],
  ];
  for (const [x, y, w, h] of nubes) g.ellipse(x, y, w, h);
}

function fondoLejano(g) {
  // edificio de oficinas a la izquierda (bloque de vidrio)
  poly(g, [[0, 492], [175, 492], [235, 528], [235, 880], [0, 880]], C.edificioLejano);
  g.stroke(C.ventanaLejana);
  g.strokeWeight(2);
  for (let y = 520; y < 870; y += 44) g.line(...P(0, y), ...P(160, y));
  for (let x = 10; x < 160; x += 26) g.line(...P(x, 505), ...P(x, 860));
  g.noStroke();

  // edificio al fondo derecho
  poly(g, [[1495, 510], [1600, 500], [1600, 620], [1495, 620]], '#7f8588');
}

function volumenes(g) {
  // caja de ladrillo que asoma sobre la marquesina
  poly(g, [[500, 345], [555, 288], [978, 432], [978, 580], [500, 580]], C.ladrillo);
  poly(g, [[940, 418], [978, 432], [978, 580], [940, 580]], C.ladrilloSombra);
  poly(g, [[704, 404], [747, 418], [747, 444], [704, 431]], '#cfcac0');

  // revestimiento metálico a rayas sobre la fachada larga
  poly(g, [[990, 545], [1470, 598], [1552, 700], [1556, 790], [990, 580]], C.revestimiento);
  g.stroke(C.revestimientoLinea);
  g.strokeWeight(2);
  for (let i = 0; i <= 1; i += 0.025) {
    const a = lerp2([990, 545], [1470, 598], i);
    const b = lerp2([990, 560], [1556, 790], i);
    g.line(...P(...a), ...P(...b));
  }
  g.noStroke();
}

function fachadaVidrio(g) {
  const izq = [[468, 700], [935, 592], [935, 905], [468, 892]];
  const der = [[935, 592], [1552, 778], [1552, 862], [935, 905]];
  poly(g, izq, C.vidrio);
  poly(g, der, C.vidrio);

  // interior cálido: el vestíbulo iluminado (bajo en la fachada)
  poly(g, [[468, 790], [935, 740], [935, 905], [468, 892]], C.vidrioInterior);
  poly(g, [[935, 740], [1552, 822], [1552, 862], [935, 905]], C.vidrioInterior);

  // montantes
  g.stroke(C.montante);
  g.strokeWeight(2);
  for (let i = 0; i <= 1.0001; i += 1 / 9) {
    const a = lerp2(izq[0], izq[1], i);
    const b = lerp2(izq[3], izq[2], i);
    g.line(...P(...a), ...P(...b));
  }
  for (let i = 0; i <= 1.0001; i += 1 / 22) {
    const a = lerp2(der[0], der[1], i);
    const b = lerp2(der[3], der[2], i);
    g.line(...P(...a), ...P(...b));
  }
  // travesaño horizontal
  g.line(...P(468, 790), ...P(935, 740));
  g.line(...P(935, 740), ...P(1552, 822));
  g.noStroke();

  // puerta principal: el vano más luminoso
  poly(g, [[712, 768], [786, 757], [786, 902], [712, 899]], '#f3e3b6');

  // letrero FÓRUM y señal UPB
  const [lx, ly] = P(688, 850);
  g.fill(C.letras);
  g.textFont('Archivo');
  g.textStyle(g.BOLD);
  g.textSize(40);
  g.textAlign(g.LEFT, g.BASELINE);
  g.text('FÓRUM', lx, ly);
  g.textStyle(g.NORMAL);
  g.textSize(12);
  g.text('Mons. Tulio Botero Salazar', lx, ly + 20);
  poly(g, [[903, 770], [925, 772], [925, 900], [903, 900]], C.senalUPB);
}

function marquesina(g) {
  // cielorraso visto desde abajo, con sus luces puntuales
  const A = [112, 657];
  const B = [502, 363];
  const D = [940, 590];
  poly(g, [A, B, [940, 572], D, [470, 700]], C.cielorraso);
  g.fill(C.luz);
  g.noStroke();
  for (let u = 0.08; u < 1; u += 0.085) {
    for (let v = 0.08; v < 1 - u; v += 0.1) {
      const x = A[0] + (B[0] - A[0]) * v + (D[0] - A[0]) * u;
      const y = A[1] + (B[1] - A[1]) * v + (D[1] - A[1]) * u;
      g.circle(...P(x, y), 6);
    }
  }

  // canto de la losa: la línea blanca que define el edificio
  poly(g, [[103, 633], [505, 340], [1558, 762], [1558, 786], [505, 363], [110, 657]], C.losa);
  g.stroke(C.losaCanto);
  g.strokeWeight(2);
  g.line(...P(110, 657), ...P(505, 363));
  g.line(...P(505, 363), ...P(1558, 786));
  g.noStroke();
}

function suelo(g) {
  // plaza bajo la marquesina y andén frente a la fachada
  poly(g, [[0, 878], [468, 892], [935, 905], [1552, 862], [1600, 860], [1600, 872], [1100, 906], [600, 960], [0, 966]], C.plaza);
  g.stroke(C.plazaLinea);
  g.strokeWeight(1.5);
  for (let i = 0; i < 1; i += 0.05) {
    const a = lerp2([0, 880], [1600, 862], i);
    const b = lerp2([0, 966], [1600, 872], i);
    g.line(...P(...a), ...P(...b));
  }
  g.noStroke();

  // vía del bulevar
  poly(g, [[0, 966], [600, 960], [1100, 906], [1600, 872], [1600, 895], [1080, 1070], [0, 1070]], C.asfalto);
  // bordillo
  g.stroke(C.bordillo);
  g.strokeWeight(5);
  g.noFill();
  g.beginShape();
  for (const p of [[0, 966], [600, 960], [1100, 906], [1600, 872]]) g.vertex(...P(...p));
  g.endShape();
  g.noStroke();
  // andén de adoquín a la derecha
  poly(g, [[1600, 895], [1080, 1070], [1600, 1070]], C.anden);
}

function seto(g) {
  // seto frente a la fachada larga
  poly(g, [[955, 905], [955, 822], [1590, 796], [1590, 864]], C.seto);
  g.fill(C.setoClaro);
  for (let i = 0; i < 1; i += 0.04) {
    const [x, y] = lerp2([965, 822], [1580, 798], i);
    g.ellipse(...P(x, y + 4), 34, 26);
  }
}

function arboles(g) {
  // jardín a la izquierda
  g.fill(C.arbolOscuro);
  g.ellipse(...P(60, 900), 260, 110);
  g.fill(C.arbol);
  g.ellipse(...P(150, 880), 200, 80);
  g.ellipse(...P(300, 800), 170, 140);
  // árbol a la derecha
  g.fill(C.arbolOscuro);
  g.ellipse(...P(1560, 620), 230, 300);
  g.fill(C.arbol);
  g.ellipse(...P(1530, 560), 170, 190);
  g.ellipse(...P(1600, 700), 150, 170);
}

// Fondo estático: se pinta una sola vez en un buffer.
export function pintarBulevar(g) {
  cielo(g);
  fondoLejano(g);
  volumenes(g);
  arboles(g);
  fachadaVidrio(g);
  seto(g);
  marquesina(g);
  suelo(g);
}

export function pintarColumna(p, col) {
  p.noStroke();
  p.fill(C.columna);
  p.rect(col.x - col.w / 2, col.top, col.w, col.base - col.top, col.w / 2);
}
