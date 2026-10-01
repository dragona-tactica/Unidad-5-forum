# Relevo generacional · Fórum UPB

Presentación generativa para la charla **"Relevo generacional: la ventaja que nadie está aprovechando"** del Centro de Eventos Fórum UPB.
Unidad 5 (sistemas de partículas) de *Simulación 2026-20*.

## Concepto

El escenario es el Fórum, ilustrado en estilo plano a partir de las fotos del cliente. Lo habitan siluetas de tres generaciones, y cada persona es una partícula.

> **La ilustración muestra quiénes están; la red muestra cómo se relacionan.**

Igual que en *Forms* (Memo Akten), el interés está en revelar las relaciones que no se ven. Debajo de la ilustración hay una red de vínculos (resortes) que se forma, se tensa, se rompe y se reconstruye a lo largo del discurso.

## Gramática visual

| Elemento | Qué es en el sistema | Qué significa |
|---|---|---|
| Persona | Partícula con fuerzas de dirección (Reynolds) | Alguien que habita el Fórum |
| Seguir carril | Path following | Pasar de largo, sin vínculo con el Fórum |
| Separación | Repulsión entre vecinos | Cada quien ocupa su espacio |
| Vínculo de grupo | Resorte de Hooke (reposo, rigidez, confianza alta) | Pertenecer a un grupo |
| Puente | Resorte largo y débil (confianza baja) | Relación entre grupos |
| Ancla | Fuerza hacia el punto de encuentro | El lugar que reúne |
| Salto | Altura `z` con gravedad | Celebrar |
| Propagación | Tirón acumulado por el vínculo (∝ confianza) | La celebración se contagia por la red, no por un temporizador |
| Banderines | Cadenas de Verlet colgadas entre anclas | El Fórum se viste de grados; equilibrio por tensión |

## Diapositivas construidas

1. **El bulevar.** La gente de todas las edades pasa de largo, en paralelo a la fachada. No hay vínculos.
2. **¿Un gran auditorio solo para hacer grados?**
   - El Fórum se viste de grados: los banderines se cuelgan desde la puerta hacia afuera, y aparecen el portal y la corona.
   - Solo los jóvenes reciben el llamado: se ponen toga y birrete y se enganchan en cadenas frente al Fórum.
   - Cuando un grupo se completa, la onda de saltos y birretes recorre la cadena y cruza los puentes.
   - Adultos y mayores siguen de largo.

## Controles

- `→`, `Espacio`, `PageDown`: siguiente.
- `←`, `PageUp`: anterior.
- `F`: pantalla completa.
- `E`: radiografía. Revela la red bajo la ilustración, con su leyenda.

## Correr local

```bash
npm install
npm run dev
```

Se publica en GitHub Pages con cada push a `main` (`.github/workflows/deploy.yml`).

## Bitácora

### 2026-09-30 — Del concepto al bulevar
- **Referente:** se tomó riscanvi.bikolabs.io como referente **visual** (ilustración plana, escena persistente) y no como referente de sistema.
- **Fondo:** el Fórum ilustrado y calcado sobre `referencias/bulevar-dia_DSC0751.jpg`. Las coordenadas se escriben en píxeles de la foto (`P()`).
- **Siluetas:** dibujadas por partes en código, para que el vestuario pueda cambiar sin que la persona deje de ser la misma (estudiante → graduado).
- **Diapositiva 2:**
  - *Primera versión:* los graduados entraban por la puerta.
  - *Corrección:* se quedan afuera celebrando, con banderines, portal y corona (referencias del cliente).

### 2026-10-01 — Las partículas se relacionan
- **Diagnóstico:**
  - las personas eran agentes casi independientes;
  - el grupo era un conjunto de puestos fijos;
  - el contagio de birretes era un temporizador;
  - al sistema le faltaba lo central del encargo, los elementos vinculados.
- **Decisión:** introducir la red de resortes (`src/red/vinculo.js`).
  - El grupo pasa a ser una cadena anclada.
  - El salto se transmite por los vínculos con un tirón acumulado.
  - La confianza controla la velocidad de propagación: rápida dentro del grupo, lenta por los puentes.
- **Visibilidad:** líneas tenues en el piso durante la charla y "radiografía" (tecla `E`) para la demostración.
- **Pendiente:** decidir si los vínculos deben ser más evidentes durante la charla.
