import p5 from 'p5';
import './style.css';
import { ANCHO, ALTO, pintarBulevar } from './escenas/bulevar.js';
import { Decoracion } from './escenas/decoracion.js';
import { Multitud } from './personas/multitud.js';

// ---------- Diapositivas ----------
// Cada diapositiva declara su texto y qué cambia en el sistema al entrar.
// La multitud nunca se reinicia al avanzar: es la misma gente la que vive toda la charla.

const DIAPOSITIVAS = [
  {
    id: 'bulevar',
    textos: [
      {
        html: `<p class="etiqueta">@centrodeeventosupb</p>
               <h1 class="titular">Relevo<br>generacional</h1>
               <p class="bajada">La ventaja que nadie está aprovechando</p>`,
        x: 96, y: 56,
      },
    ],
    entrar(mundo, desdeAtras) {
      if (desdeAtras) {
        mundo.multitud.poblar();
        mundo.decoracion.reiniciar();
      }
    },
  },
  {
    id: 'grados',
    textos: [
      {
        html: `<h2 class="pregunta">¿Un gran auditorio solo para hacer <em>grados</em>?</h2>`,
        x: 96, y: 96,
        // la pregunta aparece cuando la mayoría de los convocados ya está celebrando en su grupo
        cuando: (m) => m.primeraOla > 0 && m.celebrando >= m.primeraOla * 0.6,
      },
    ],
    entrar(mundo, _desdeAtras, ahora) {
      mundo.decoracion.activar(ahora);
      mundo.multitud.llamarAGrados(ahora);
    },
  },
];

const TOTAL_GUION = 13;

// ---------- Estado ----------

const mundo = { multitud: new Multitud(), decoracion: new Decoracion() };
if (import.meta.env.DEV) window.mundo = mundo; // inspección desde la consola
let actual = 0;
let escala = 1;
let offX = 0;
let offY = 0;
let fondo;
let radiografia = false; // tecla E: revela la red de relaciones bajo la ilustración

const ui = document.getElementById('ui');
const capaTextos = document.getElementById('textos');
const btnAtras = document.getElementById('atras');
const btnSiguiente = document.getElementById('siguiente');
const contador = document.getElementById('contador');

function montarTextos() {
  capaTextos.innerHTML = '';
  for (const t of DIAPOSITIVAS[actual].textos) {
    const el = document.createElement('div');
    el.className = 'texto';
    el.style.left = `${t.x}px`;
    el.style.top = `${t.y}px`;
    el.innerHTML = t.html;
    el._cuando = t.cuando;
    capaTextos.appendChild(el);
  }
}

function irA(i, ahora) {
  if (i < 0 || i >= DIAPOSITIVAS.length) return;
  const desdeAtras = i < actual;
  actual = i;
  DIAPOSITIVAS[i].entrar(mundo, desdeAtras, ahora);
  montarTextos();
  btnAtras.disabled = actual === 0;
  btnSiguiente.disabled = actual === DIAPOSITIVAS.length - 1;
  contador.textContent = `${actual + 1} / ${TOTAL_GUION}`;
}

function encuadrar(p) {
  if (p.width < 2 || p.height < 2) return; // ventana oculta o minimizada
  escala = Math.min(p.width / ANCHO, p.height / ALTO);
  offX = (p.width - ANCHO * escala) / 2;
  offY = (p.height - ALTO * escala) / 2;
  ui.style.transform = `translate(${offX}px, ${offY}px) scale(${escala})`;

  // el fondo estático se pinta a la resolución real de la pantalla
  const d = Math.min(2, window.devicePixelRatio || 1);
  fondo = p.createGraphics(Math.ceil(ANCHO * escala), Math.ceil(ALTO * escala));
  fondo.pixelDensity(d);
  fondo.scale(escala);
  pintarBulevar(fondo);
}

new p5((p) => {
  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight).parent('lienzo');
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    encuadrar(p);
    // el letrero FÓRUM del fondo usa Archivo: repintar cuando la fuente termine de cargar
    document.fonts.load('600 50px Archivo').then(() => encuadrar(p));
    mundo.multitud.poblar();
    irA(0, p.millis());
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    encuadrar(p);
  };

  p.draw = () => {
    const dt = Math.min(3, p.deltaTime / (1000 / 60));
    const ahora = p.millis();
    mundo.multitud.actualizar(ahora, dt);
    mundo.decoracion.actualizar(ahora, dt);

    p.background('#16181b');
    if (fondo) p.image(fondo, offX, offY, ANCHO * escala, ALTO * escala);
    p.push();
    p.translate(offX, offY);
    p.scale(escala);
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.rect(0, 0, ANCHO, ALTO);
    p.drawingContext.clip();
    mundo.decoracion.dibujarFondo(p);
    mundo.multitud.red.dibujarEnPiso(p);
    mundo.multitud.dibujar(p, mundo.decoracion.utileria(p, ahora));
    if (radiografia) {
      p.noStroke();
      p.fill(238, 236, 230, 215);
      p.rect(0, 0, ANCHO, ALTO);
      mundo.decoracion.dibujarRadiografia(p);
      mundo.multitud.dibujarRadiografia(p);
    }
    p.drawingContext.restore();
    p.pop();

    for (const el of capaTextos.children) {
      const visible = el._cuando ? el._cuando(mundo.multitud) : true;
      el.classList.toggle('visible', visible);
    }
  };

  p.keyPressed = () => {
    const k = p.key;
    if (['ArrowRight', 'PageDown', ' '].includes(k)) irA(actual + 1, p.millis());
    else if (['ArrowLeft', 'PageUp'].includes(k)) irA(actual - 1, p.millis());
    else if (k === 'f' || k === 'F') p.fullscreen(!p.fullscreen());
    else if (k === 'e' || k === 'E') {
      radiografia = !radiografia;
      document.getElementById('leyenda').classList.toggle('visible', radiografia);
    }
  };

  btnSiguiente.onclick = () => irA(actual + 1, p.millis());
  btnAtras.onclick = () => irA(actual - 1, p.millis());
});
