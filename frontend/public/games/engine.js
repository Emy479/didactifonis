/**
 * Didactifonis Game Engine v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 * SDK base para todos los juegos HTML5 de la plataforma Didactifonis.
 *
 * Uso:
 *   1. Cargar este script en el index.html del juego
 *   2. Llamar DidactiEngine.init('data.json') al cargar la página
 *
 * El engine lee el data.json y renderiza el juego completo automáticamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DidactiEngine = (() => {

  // ── Estado global ───────────────────────────────────────────────────────────
  let config       = null;   // data.json completo
  let rondas       = [];     // rondas mezcladas/seleccionadas
  let rondaActual  = 0;
  let puntaje      = 0;
  let intentos     = 0;
  let tiempoInicio = null;
  let tiempoRondaInicio = null;
  let detalleRondas = [];
  let audioActual  = null;
  let _musicaFondo = null;   // audio en loop de fondo
  let _lsKey       = '';     // clave de localStorage para guardar progreso

  // ── Progreso persistente (localStorage) ─────────────────────────────────────
  const guardarProgreso = () => {
    if (!_lsKey || rondaActual <= 0) return;
    try {
      localStorage.setItem(_lsKey, JSON.stringify({
        rondaActual, puntaje, detalleRondas, timestamp: Date.now(),
      }));
    } catch {}
  };

  const cargarProgreso = () => {
    try {
      if (!_lsKey) return null;
      const raw = localStorage.getItem(_lsKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > 86400000) { localStorage.removeItem(_lsKey); return null; }
      return data;
    } catch { return null; }
  };

  const limpiarProgreso = () => {
    try { if (_lsKey) localStorage.removeItem(_lsKey); } catch {}
  };

  // ── Música de fondo ──────────────────────────────────────────────────────────
  const _iniciarMusica = () => {
    const url = config?.accesibilidad?.musicaFondo || config?.visual?.musicaFondo;
    if (!url || _musicaFondo) return;
    try {
      _musicaFondo = new Audio(url);
      _musicaFondo.loop   = true;
      _musicaFondo.volume = 0.25;
      _musicaFondo.play().catch(() => {});
    } catch {}
  };

  const _detenerMusica = () => {
    if (_musicaFondo) { _musicaFondo.pause(); _musicaFondo.currentTime = 0; _musicaFondo = null; }
  };

  const _toggleMusica = () => {
    if (!_musicaFondo) return;
    const btn = document.getElementById('dg-btn-musica');
    if (_musicaFondo.paused) {
      _musicaFondo.play().catch(() => {});
      if (btn) btn.textContent = '🔊';
    } else {
      _musicaFondo.pause();
      if (btn) btn.textContent = '🔇';
    }
  };

  // ── Timer por ronda ──────────────────────────────────────────────────────────
  let _timerRondaId    = null;
  let _timerRondaSeg   = 0;
  let _timerRondaTotal = 0;

  const _timerRonda = {
    iniciar(segundos, onTimeout) {
      this.detener();
      if (!segundos) return;
      _timerRondaTotal = segundos;
      _timerRondaSeg   = segundos;
      this._actualizar();
      _timerRondaId = setInterval(() => {
        _timerRondaSeg--;
        this._actualizar();
        if (_timerRondaSeg <= 0) { this.detener(); onTimeout(); }
      }, 1000);
    },
    detener() {
      if (_timerRondaId) { clearInterval(_timerRondaId); _timerRondaId = null; }
      const el = document.getElementById('dg-timer-ronda');
      if (el) el.style.display = 'none';
    },
    _actualizar() {
      const el = document.getElementById('dg-timer-ronda');
      if (!el) return;
      el.style.display = 'flex';
      const pct   = Math.max(0, (_timerRondaSeg / _timerRondaTotal) * 100);
      const color = _timerRondaSeg <= 5 ? '#ef4444' : _timerRondaSeg <= 10 ? '#f59e0b' : 'var(--acento)';
      el.innerHTML = `
        <span style="font-size:13px;font-weight:700;color:${color};min-width:36px;">⏱ ${_timerRondaSeg}s</span>
        <div style="flex:1;height:5px;background:#e5e7eb;border-radius:99px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width 0.9s linear;"></div>
        </div>`;
    },
  };

  // ── Confetti de celebración ──────────────────────────────────────────────────
  const _lanzarConfetti = () => {
    const COLORES = ['#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#ef4444','#14b8a6'];
    for (let i = 0; i < 80; i++) {
      const p    = document.createElement('div');
      p.className = 'dg-confetti-piece';
      const size = 4 + Math.random() * 8;
      p.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -24px;
        width: ${size}px;
        height: ${size * (Math.random() < 0.5 ? 1 : 2.5)}px;
        background: ${COLORES[Math.floor(Math.random() * COLORES.length)]};
        animation-duration: ${1.8 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.8}s;
      `;
      document.body.appendChild(p);
      const dur = parseFloat(p.style.animationDuration) * 1000
                + parseFloat(p.style.animationDelay) * 1000 + 400;
      setTimeout(() => p.remove(), dur);
    }
  };

  // ── Síntesis de voz ─────────────────────────────────────────────────────────
  const voz = {
    hablar(texto) {
      if (!texto) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang  = config?.accesibilidad?.idiomaVoz || 'es-CL';
      u.rate  = 0.9;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    },
    cancelar() { window.speechSynthesis.cancel(); }
  };

  // ── Sistema de audio ────────────────────────────────────────────────────────
  const audio = {
    reproducir(url, texto) {
      if (audioActual) { audioActual.pause(); audioActual = null; }

      // Sin URL → fallback síntesis de voz
      if (!url) {
        const fallback = config?.accesibilidad?.fallbackAudio || 'sintetizar';
        if (fallback === 'sintetizar' && texto) voz.hablar(texto);
        return;
      }

      const a = new Audio(url);
      audioActual = a;
      a.play().catch(() => {
        // Si falla el archivo, usar síntesis
        const fallback = config?.accesibilidad?.fallbackAudio || 'sintetizar';
        if (fallback === 'sintetizar' && texto) voz.hablar(texto);
      });
    },
    reproducirAleatorio(lista) {
      if (!lista?.length) return;
      const item = lista[Math.floor(Math.random() * lista.length)];
      this.reproducir(item.audio, item.texto);
    },
    detener() {
      if (audioActual) { audioActual.pause(); audioActual = null; }
      voz.cancelar();
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const mezclar = arr => [...arr].sort(() => Math.random() - 0.5);

  const calcularTrofeo = (pct) => {
    if (pct >= 90) return { emoji: '🥇', label: 'Oro',    msg: '¡Eres increíble!' };
    if (pct >= 70) return { emoji: '🥈', label: 'Plata',  msg: '¡Muy bien hecho!' };
    if (pct >= 50) return { emoji: '🥉', label: 'Bronce', msg: '¡Buen esfuerzo!' };
    return           { emoji: '⭐', label: 'Estrella', msg: '¡Sigue practicando!' };
  };

  // ── Estilos base del engine ─────────────────────────────────────────────────
  const inyectarEstilos = () => {
    const visual = config?.visual || {};
    const fondo  = visual.fondo   || {};

    // Calcular CSS del fondo
    let fondoCSS = 'background: linear-gradient(135deg, #dbeafe, #ede9fe);';
    if (fondo.tipo === 'color') {
      fondoCSS = `background: ${fondo.valor};`;
    } else if (fondo.tipo === 'gradiente') {
      const dir   = fondo.direccion || '135deg';
      fondoCSS = `background: linear-gradient(${dir}, ${fondo.desde || '#dbeafe'}, ${fondo.hasta || '#ede9fe'});`;
    } else if (fondo.tipo === 'imagen') {
      const ajuste = fondo.ajuste || 'cover';
      const op     = fondo.opacidad !== undefined ? fondo.opacidad : 1;
      fondoCSS = `
        background-image: url('${fondo.url}');
        background-size: ${ajuste};
        background-position: center;
        background-repeat: ${ajuste === 'repeat' ? 'repeat' : 'no-repeat'};
        opacity: ${op};
      `;
    }

    // Temas de color
    const temas = {
      default:    { acento: '#3b82f6', tarjeta: '#ffffff', texto: '#1f2937' },
      naturaleza: { acento: '#10b981', tarjeta: '#f0fdf4', texto: '#14532d' },
      oceano:     { acento: '#0891b2', tarjeta: '#ecfeff', texto: '#164e63' },
      noche:      { acento: '#818cf8', tarjeta: '#1e1b4b', texto: '#e0e7ff' },
      fiesta:     { acento: '#f59e0b', tarjeta: '#fffbeb', texto: '#78350f' },
      espacial:   { acento: '#a855f7', tarjeta: '#2e1065', texto: '#f3e8ff' },
    };
    const tema = temas[visual.tema] || temas.default;

    const css = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      html, body {
        width: 100%; height: 100%;
        font-family: 'Segoe UI', system-ui, sans-serif;
        overflow-x: hidden;
      }

      #dg-root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        ${fondoCSS}
      }

      /* ── Variables de tema ── */
      :root {
        --acento:  ${tema.acento};
        --tarjeta: ${tema.tarjeta};
        --texto:   ${tema.texto};
        --radius:  ${visual.borderRadius || '14px'};
        --sombra:  0 4px 16px rgba(0,0,0,0.10);
      }

      /* ── Header del juego ── */
      #dg-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(0,0,0,0.06);
        position: sticky; top: 0; z-index: 10;
        flex-wrap: wrap; gap: 8px;
      }
      #dg-titulo    { font-size: clamp(14px, 3vw, 18px); font-weight: 700; color: var(--texto); }
      #dg-puntaje   { font-size: clamp(13px, 2.5vw, 16px); font-weight: 600; color: var(--acento); }
      #dg-progreso  { font-size: 12px; color: #6b7280; }

      /* ── Barra de progreso ── */
      #dg-barra-wrap { width: 100%; height: 6px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
      #dg-barra      { height: 100%; background: var(--acento); border-radius: 99px; transition: width 0.4s ease; }

      /* ── Área principal ── */
      #dg-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: clamp(12px, 3vw, 32px);
        gap: clamp(12px, 2.5vw, 24px);
      }

      /* ── Instrucción ── */
      #dg-instruccion-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255,255,255,0.9);
        border-radius: var(--radius);
        padding: 12px 18px;
        max-width: 640px;
        width: 100%;
        box-shadow: var(--sombra);
      }
      #dg-instruccion-texto {
        font-size: clamp(15px, 3vw, 20px);
        font-weight: 600;
        color: var(--texto);
        flex: 1;
      }
      .dg-btn-audio {
        background: var(--acento);
        color: white;
        border: none;
        border-radius: 50%;
        width: 38px; height: 38px;
        font-size: 16px;
        cursor: pointer;
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s, opacity 0.15s;
      }
      .dg-btn-audio:hover  { transform: scale(1.1); }
      .dg-btn-audio:active { transform: scale(0.95); opacity: 0.8; }

      /* ── Grid de tarjetas ── */
      #dg-grid {
        display: grid;
        gap: clamp(8px, 2vw, 16px);
        width: 100%;
        max-width: 700px;
        grid-template-columns: repeat(auto-fit, minmax(clamp(100px, 20vw, 150px), 1fr));
      }

      /* ── Tarjeta individual ── */
      .dg-tarjeta {
        background: var(--tarjeta);
        border: 3px solid transparent;
        border-radius: var(--radius);
        box-shadow: var(--sombra);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: clamp(10px, 2vw, 18px);
        gap: 8px;
        transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        aspect-ratio: 1;
        position: relative;
        overflow: hidden;
      }
      .dg-tarjeta:hover  { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
      .dg-tarjeta:active { transform: scale(0.97); }
      .dg-tarjeta img    { width: 60%; height: 60%; object-fit: contain; pointer-events: none; }
      .dg-tarjeta .dg-emoji { font-size: clamp(32px, 8vw, 56px); line-height: 1; }
      .dg-tarjeta .dg-label {
        font-size: clamp(11px, 2.5vw, 15px);
        font-weight: 600;
        color: var(--texto);
        text-align: center;
        word-break: break-word;
      }

      /* ── Estados de tarjeta ── */
      .dg-tarjeta.correcta  { border-color: #22c55e; background: #f0fdf4; animation: dg-pulso-verde 0.4s ease; }
      .dg-tarjeta.incorrecta { border-color: #ef4444; background: #fef2f2; animation: dg-sacudir 0.4s ease; }
      .dg-tarjeta.revelada  { border-color: #22c55e; background: #f0fdf4; opacity: 0.7; }
      .dg-tarjeta.deshabilitada { pointer-events: none; opacity: 0.5; }

      /* ── Botón de audio en tarjeta ── */
      .dg-tarjeta-audio {
        position: absolute;
        top: 6px; right: 6px;
        background: rgba(255,255,255,0.85);
        border: none;
        border-radius: 50%;
        width: 26px; height: 26px;
        font-size: 12px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .dg-tarjeta:hover .dg-tarjeta-audio { opacity: 1; }
      /* En touch siempre visible */
      @media (hover: none) { .dg-tarjeta-audio { opacity: 1; } }

      /* ── Feedback overlay ── */
      #dg-feedback {
        position: fixed;
        bottom: 24px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 12px 28px;
        border-radius: 99px;
        font-size: clamp(14px, 3vw, 18px);
        font-weight: 600;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.25s;
        pointer-events: none;
        max-width: 90vw;
        text-align: center;
      }
      #dg-feedback.visible { opacity: 1; }

      /* ── Pantalla de inicio ── */
      #dg-pantalla-inicio {
        position: fixed; inset: 0; z-index: 200;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 20px;
        padding: 24px;
        text-align: center;
      }
      #dg-pantalla-inicio .dg-inicio-emoji { font-size: 64px; }
      #dg-pantalla-inicio h1 {
        font-size: clamp(22px, 5vw, 36px);
        font-weight: 800;
        color: var(--texto);
        max-width: 500px;
      }
      #dg-pantalla-inicio p {
        font-size: clamp(14px, 3vw, 18px);
        color: #4b5563;
        max-width: 400px;
        line-height: 1.5;
      }
      .dg-btn-primario {
        background: var(--acento);
        color: white;
        border: none;
        border-radius: 99px;
        padding: 14px 40px;
        font-size: clamp(16px, 3vw, 20px);
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .dg-btn-primario:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
      .dg-btn-primario:active { transform: scale(0.97); }

      /* ── Pantalla de resultados ── */
      #dg-pantalla-resultados {
        position: fixed; inset: 0; z-index: 200;
        display: none;
        flex-direction: column;
        align-items: center; justify-content: center;
        gap: 16px;
        padding: 24px;
        text-align: center;
        background: rgba(255,255,255,0.97);
        backdrop-filter: blur(10px);
      }
      #dg-pantalla-resultados.visible { display: flex; }
      #dg-resultado-trofeo { font-size: 72px; animation: dg-aparecer 0.5s ease; }
      #dg-resultado-titulo {
        font-size: clamp(20px, 5vw, 32px);
        font-weight: 800;
        color: var(--texto);
      }
      #dg-resultado-msg { font-size: clamp(15px, 3vw, 20px); color: #4b5563; }
      .dg-resultado-stats {
        display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;
        background: #f9fafb; border-radius: var(--radius);
        padding: 16px 24px;
      }
      .dg-stat { text-align: center; }
      .dg-stat span { display: block; }
      .dg-stat .dg-stat-valor { font-size: 28px; font-weight: 800; color: var(--acento); }
      .dg-stat .dg-stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; }
      .dg-btns-resultado { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
      .dg-btn-secundario {
        background: #f3f4f6;
        color: var(--texto);
        border: none;
        border-radius: 99px;
        padding: 12px 28px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .dg-btn-secundario:hover { background: #e5e7eb; }

      /* ── Confetti ── */
      @keyframes dg-confetti-fall {
        0%   { transform: translateY(-24px) rotate(0deg);   opacity: 1; }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
      }
      .dg-confetti-piece {
        position: fixed;
        border-radius: 2px;
        pointer-events: none;
        z-index: 9999;
        animation: dg-confetti-fall linear forwards;
      }

      /* ── Timer por ronda ── */
      #dg-timer-ronda {
        display: none;
        align-items: center;
        gap: 10px;
        width: 100%;
        max-width: 640px;
        padding: 0 4px;
      }

      /* ── Botón mute música ── */
      #dg-btn-musica {
        background: none; border: none;
        font-size: 18px; cursor: pointer;
        color: var(--texto); opacity: 0.55;
        padding: 4px 6px; border-radius: 8px;
        transition: opacity 0.2s, transform 0.15s;
        flex-shrink: 0;
      }
      #dg-btn-musica:hover { opacity: 1; transform: scale(1.15); }

      /* ── Animaciones ── */
      @keyframes dg-pulso-verde {
        0%   { transform: scale(1); }
        50%  { transform: scale(1.08); }
        100% { transform: scale(1); }
      }
      @keyframes dg-sacudir {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-6px); }
        40%     { transform: translateX(6px); }
        60%     { transform: translateX(-4px); }
        80%     { transform: translateX(4px); }
      }
      @keyframes dg-aparecer {
        from { transform: scale(0.5); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }
      @keyframes dg-entrada {
        from { transform: translateY(16px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      .dg-tarjeta { animation: dg-entrada 0.25s ease both; }

      /* ── Responsive ajustes finos ── */
      @media (max-width: 480px) {
        #dg-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (min-width: 481px) and (max-width: 768px) {
        #dg-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 769px) {
        #dg-grid { grid-template-columns: repeat(4, 1fr); }
      }

      /* ── Zona de ordenar (mecánica ordenar_elementos) ── */
      #dg-zona-orden {
        width: 100%; max-width: 640px;
        display: flex; flex-direction: column; gap: 16px;
      }
      #dg-riel {
        min-height: 70px;
        border: 3px dashed var(--acento);
        border-radius: var(--radius);
        display: flex; align-items: center;
        gap: 8px; padding: 8px 12px;
        background: rgba(255,255,255,0.7);
        flex-wrap: wrap;
        transition: background 0.2s;
      }
      #dg-riel.drag-over { background: rgba(59,130,246,0.1); }
      #dg-fichas {
        display: flex; flex-wrap: wrap;
        gap: 8px; justify-content: center;
      }
      .dg-ficha {
        background: var(--tarjeta);
        border: 2px solid var(--acento);
        border-radius: 10px;
        padding: 10px 18px;
        font-size: clamp(16px, 4vw, 22px);
        font-weight: 700;
        color: var(--acento);
        cursor: grab;
        user-select: none;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: var(--sombra);
      }
      .dg-ficha:active { cursor: grabbing; transform: scale(1.05); }
      .dg-ficha.en-riel { background: var(--acento); color: white; cursor: pointer; }
      .dg-ficha.seleccionada { background: #fbbf24; border-color: #f59e0b; color: white; }

      /* Imagen de apoyo (mecánica ordenar) */
      #dg-imagen-apoyo {
        max-height: 140px;
        object-fit: contain;
        border-radius: var(--radius);
        box-shadow: var(--sombra);
      }

      /* ── Mecánica: constructor_historias ── */
      #dg-historia-wrap {
        width: 100%; max-width: 680px;
        display: flex; flex-direction: column; gap: 16px;
      }
      .dg-historia-fase-label {
        text-align: center; font-size: 12px; font-weight: 700;
        letter-spacing: 0.07em; text-transform: uppercase;
        color: var(--acento);
      }
      #dg-historia-disponibles {
        display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
      }
      .dg-historia-img {
        width: clamp(85px, 18vw, 130px); height: clamp(85px, 18vw, 130px);
        object-fit: cover; border-radius: var(--radius);
        border: 3px solid var(--acento); cursor: grab;
        box-shadow: var(--sombra); user-select: none;
        transition: transform 0.15s, box-shadow 0.15s;
        background: #e5e7eb;
      }
      .dg-historia-img:active { transform: scale(1.06); cursor: grabbing; }
      .dg-historia-img.en-riel { cursor: pointer; }
      #dg-historia-riel {
        min-height: 110px; border: 3px dashed var(--acento);
        border-radius: var(--radius); display: flex; align-items: center;
        gap: 10px; padding: 10px; background: rgba(255,255,255,0.7);
        flex-wrap: wrap; transition: background 0.2s;
      }
      #dg-historia-riel.drag-over { background: rgba(59,130,246,0.1); }
      #dg-historia-imagen-actual {
        max-height: 190px; border-radius: var(--radius);
        object-fit: contain; box-shadow: var(--sombra);
        display: block; margin: 0 auto;
      }
      .dg-historia-oraciones { display: flex; flex-direction: column; gap: 10px; }
      .dg-historia-oracion {
        background: var(--tarjeta); border: 2px solid #e5e7eb;
        border-radius: var(--radius); padding: 14px 18px;
        font-size: clamp(14px, 3vw, 17px); font-weight: 500;
        color: var(--texto); cursor: pointer; text-align: left;
        transition: border-color 0.2s, background 0.2s, transform 0.15s;
        box-shadow: var(--sombra);
      }
      .dg-historia-oracion:hover:not(:disabled) { border-color: var(--acento); transform: translateX(4px); }
      .dg-historia-oracion.correcta  { background: #f0fdf4; border-color: #22c55e; color: #15803d; pointer-events: none; }
      .dg-historia-oracion.incorrecta { background: #fef2f2; border-color: #ef4444; animation: dg-sacudir 0.4s ease; }
      .dg-historia-oracion:disabled { opacity: 0.65; cursor: default; }

      /* ── Mecánica: tipeo ── */
      #dg-tipeo-wrap {
        width: 100%; max-width: 480px;
        display: flex; flex-direction: column;
        align-items: center; gap: 20px;
      }
      #dg-tipeo-prompt {
        display: flex; flex-direction: column;
        align-items: center; gap: 10px;
      }
      #dg-tipeo-prompt .dg-emoji { font-size: clamp(64px, 15vw, 96px); }
      #dg-tipeo-prompt img { max-height: 160px; object-fit: contain; border-radius: var(--radius); box-shadow: var(--sombra); }
      #dg-tipeo-blancos {
        display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
      }
      .dg-blanco {
        min-width: 34px; height: 46px;
        border-bottom: 3px solid var(--acento);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; font-weight: 700; color: var(--texto);
        transition: border-color 0.2s, color 0.2s;
        padding: 0 4px;
      }
      .dg-blanco.correcto { border-color: #22c55e; color: #22c55e; }
      #dg-tipeo-input-wrap { display: flex; gap: 8px; width: 100%; }
      #dg-tipeo-input {
        flex: 1; border: 2px solid #e5e7eb;
        border-radius: var(--radius);
        padding: 12px 16px; font-size: 18px; font-weight: 600;
        color: var(--texto); outline: none; text-align: center;
        transition: border-color 0.2s; font-family: inherit;
      }
      #dg-tipeo-input:focus   { border-color: var(--acento); }
      #dg-tipeo-input.correcto   { border-color: #22c55e; background: #f0fdf4; }
      #dg-tipeo-input.incorrecto { border-color: #ef4444; background: #fef2f2; animation: dg-sacudir 0.4s ease; }
      #dg-tipeo-pista { font-size: 13px; color: #6b7280; cursor: pointer; text-decoration: underline; }
      #dg-tipeo-pista:hover { color: var(--acento); }

      /* ── Mecánica: memoria ── */
      #dg-memoria-wrap { width: 100%; max-width: 620px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
      #dg-memoria-grid {
        display: grid; gap: clamp(6px, 1.5vw, 12px);
        width: 100%; grid-template-columns: repeat(4, 1fr);
      }
      @media (max-width: 380px) { #dg-memoria-grid { grid-template-columns: repeat(3, 1fr); } }
      #dg-memoria-info { font-size: 13px; color: #6b7280; text-align: center; }
      .dg-carta {
        aspect-ratio: 1; border-radius: var(--radius);
        box-shadow: var(--sombra); cursor: pointer;
        position: relative; transform-style: preserve-3d;
        transition: transform 0.4s ease;
        user-select: none; -webkit-tap-highlight-color: transparent;
      }
      .dg-carta.volteada   { transform: rotateY(180deg); }
      .dg-carta.emparejada { transform: rotateY(180deg); pointer-events: none; }
      .dg-carta-dorso, .dg-carta-frente {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        border-radius: var(--radius);
        backface-visibility: hidden; -webkit-backface-visibility: hidden;
      }
      .dg-carta-dorso {
        background: var(--acento); color: white;
        font-size: clamp(20px, 5vw, 32px);
      }
      .dg-carta-frente {
        background: var(--tarjeta); border: 2px solid var(--acento);
        transform: rotateY(180deg);
        flex-direction: column; gap: 4px; padding: 6px;
      }
      .dg-carta-frente img { width: 60%; height: 60%; object-fit: contain; }
      .dg-carta-frente .dg-emoji { font-size: clamp(22px, 6vw, 40px); }
      .dg-carta-frente .dg-label { font-size: clamp(9px, 2vw, 13px); font-weight: 600; color: var(--texto); text-align: center; word-break: break-word; }
      .dg-carta.emparejada .dg-carta-frente { background: #f0fdf4; border-color: #22c55e; }

      /* ── Mecánica: emparejar ── */
      #dg-emparejar-wrap {
        width: 100%; max-width: 640px;
        display: grid; grid-template-columns: 1fr 1fr;
        gap: clamp(8px, 2vw, 16px); align-items: start;
      }
      .dg-emp-col { display: flex; flex-direction: column; gap: 8px; }
      .dg-emp-item {
        background: var(--tarjeta); border: 2px solid #e5e7eb;
        border-radius: var(--radius); padding: 10px 14px; cursor: pointer;
        display: flex; align-items: center; gap: 8px;
        font-size: clamp(13px, 3vw, 16px); font-weight: 600; color: var(--texto);
        transition: border-color 0.2s, background 0.2s, transform 0.15s;
        box-shadow: var(--sombra); user-select: none; min-height: 56px;
      }
      .dg-emp-item:hover       { transform: translateX(3px); border-color: var(--acento); }
      .dg-emp-item.seleccionado { border-color: var(--acento); background: rgba(59,130,246,0.08); transform: translateX(3px); }
      .dg-emp-item.correcto    { border-color: #22c55e; background: #f0fdf4; pointer-events: none; }
      .dg-emp-item.incorrecto  { border-color: #ef4444; background: #fef2f2; animation: dg-sacudir 0.4s ease; }
      .dg-emp-item .dg-emoji   { font-size: clamp(20px, 5vw, 30px); flex-shrink: 0; }
      .dg-emp-item img         { width: 40px; height: 40px; object-fit: contain; flex-shrink: 0; }
    `;

    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  };

  // ── Construir DOM base ───────────────────────────────────────────────────────
  const construirDOM = () => {
    document.body.innerHTML = `
      <div id="dg-root">

        <!-- Pantalla de inicio -->
        <div id="dg-pantalla-inicio">
          <div class="dg-inicio-emoji">🎮</div>
          <h1>${config.titulo}</h1>
          <p id="dg-inicio-descripcion"></p>
          <button class="dg-btn-primario" id="dg-btn-comenzar">¡Comenzar!</button>
        </div>

        <!-- Header -->
        <div id="dg-header">
          <div>
            <div id="dg-titulo">${config.titulo}</div>
            <div id="dg-progreso">Ronda <span id="dg-ronda-actual">1</span> de ${config.rondasTotal}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div id="dg-puntaje">⭐ <span id="dg-pts">0</span> pts</div>
            <button id="dg-btn-musica" title="Música" style="display:none;">🔊</button>
          </div>
        </div>

        <!-- Barra de progreso -->
        <div id="dg-barra-wrap">
          <div id="dg-barra" style="width:0%"></div>
        </div>

        <!-- Área principal -->
        <main id="dg-main">
          <!-- Instrucción -->
          <div id="dg-instruccion-wrap">
            <div id="dg-instruccion-texto"></div>
            <button class="dg-btn-audio" id="dg-btn-repetir" title="Repetir instrucción">🔊</button>
          </div>
          <!-- Timer por ronda (oculto si no está configurado) -->
          <div id="dg-timer-ronda"></div>
          <!-- Contenido dinámico por mecánica -->
          <div id="dg-contenido"></div>
        </main>

        <!-- Feedback toast -->
        <div id="dg-feedback"></div>

        <!-- Pantalla de resultados -->
        <div id="dg-pantalla-resultados" id="dg-pantalla-resultados">
          <div id="dg-resultado-trofeo"></div>
          <div id="dg-resultado-titulo"></div>
          <div id="dg-resultado-msg"></div>
          <div class="dg-resultado-stats">
            <div class="dg-stat">
              <span class="dg-stat-valor" id="dg-stat-puntaje">0</span>
              <span class="dg-stat-label">Puntos</span>
            </div>
            <div class="dg-stat">
              <span class="dg-stat-valor" id="dg-stat-correctas">0</span>
              <span class="dg-stat-label">Correctas</span>
            </div>
            <div class="dg-stat">
              <span class="dg-stat-valor" id="dg-stat-tiempo">0</span>
              <span class="dg-stat-label">Minutos</span>
            </div>
          </div>
          <div class="dg-btns-resultado">
            <button class="dg-btn-secundario" id="dg-btn-reiniciar">🔄 Jugar de nuevo</button>
            <button class="dg-btn-primario"   id="dg-btn-terminar">✓ Terminar</button>
          </div>
        </div>

      </div>
    `;
  };

  // ── Mostrar feedback toast ───────────────────────────────────────────────────
  let feedbackTimer = null;
  const mostrarFeedback = (texto, duracion = 1800) => {
    const el = document.getElementById('dg-feedback');
    if (!el) return;
    el.textContent = texto;
    el.classList.add('visible');
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => el.classList.remove('visible'), duracion);
  };

  // ── Feedback configurado: texto + audio desde config.feedback ───────────────
  // Cada método elige un ítem aleatorio de la lista configurada (o usa el
  // fallback si la lista está vacía) y reproduce el audio si está definido.
  const fb = {
    _reproducir(lista, textoFallback) {
      const item = lista?.length
        ? lista[Math.floor(Math.random() * lista.length)]
        : { texto: textoFallback, audio: null };
      mostrarFeedback(item.texto || textoFallback);
      if (item.audio) audio.reproducir(item.audio, null);
    },
    correcto(textoFallback = '¡Muy bien!') {
      this._reproducir(config?.feedback?.correcto, textoFallback);
    },
    error(textoFallback = '¡Inténtalo de nuevo!') {
      this._reproducir(config?.feedback?.error, textoFallback);
    },
  };

  // ── Actualizar UI de puntaje/progreso ────────────────────────────────────────
  const actualizarUI = () => {
    const elPts      = document.getElementById('dg-pts');
    const elRonda    = document.getElementById('dg-ronda-actual');
    const elBarra    = document.getElementById('dg-barra');
    if (elPts)   elPts.textContent   = puntaje;
    if (elRonda) elRonda.textContent = Math.min(rondaActual + 1, config.rondasTotal);
    if (elBarra) {
      const pct = (rondaActual / config.rondasTotal) * 100;
      elBarra.style.width = pct + '%';
    }
  };

  // ── Crear tarjeta ────────────────────────────────────────────────────────────
  const crearTarjeta = (item, onClick) => {
    const div = document.createElement('div');
    div.className = 'dg-tarjeta';
    div.dataset.id = item.id;

    // Animación de entrada escalonada
    div.style.animationDelay = `${Math.random() * 0.15}s`;

    // Contenido: imagen o emoji o texto
    if (item.imagen) {
      const img = document.createElement('img');
      img.src = item.imagen;
      img.alt = item.texto || item.id;
      div.appendChild(img);
    } else if (item.emoji) {
      const span = document.createElement('span');
      span.className = 'dg-emoji';
      span.textContent = item.emoji;
      div.appendChild(span);
    }

    // Etiqueta de texto
    const mostrarTexto = config?.accesibilidad?.textoVisible !== false;
    if (item.texto && mostrarTexto) {
      const label = document.createElement('div');
      label.className = 'dg-label';
      label.textContent = item.texto;
      div.appendChild(label);
    }

    // Botón de audio individual
    const audioAlTocar = config?.accesibilidad?.audioAlTocarItem !== false;
    if ((item.audioNombre || item.texto) && audioAlTocar) {
      const btnAudio = document.createElement('button');
      btnAudio.className = 'dg-tarjeta-audio';
      btnAudio.textContent = '🔊';
      btnAudio.title = 'Escuchar';
      btnAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.reproducir(item.audioNombre, item.texto);
      });
      div.appendChild(btnAudio);
    }

    div.addEventListener('click', () => onClick(item, div));
    return div;
  };

  // ── Renderizar instrucción ───────────────────────────────────────────────────
  const renderizarInstruccion = (ronda) => {
    const texto = ronda.textoInstruccion || ronda.pregunta || '';
    const audioUrl = ronda.audioInstruccion || ronda.audioPregunta || null;

    const elTexto = document.getElementById('dg-instruccion-texto');
    if (elTexto) elTexto.textContent = texto;

    const btnRepetir = document.getElementById('dg-btn-repetir');
    if (btnRepetir) {
      btnRepetir.onclick = () => audio.reproducir(audioUrl, texto);
    }

    // Reproducir automáticamente
    if (texto || audioUrl) {
      setTimeout(() => audio.reproducir(audioUrl, texto), 300);
    }
  };

  // ── Anunciar items al mostrar (accesibilidad) ───────────────────────────────
  const anunciarItems = async (items) => {
    if (!config?.accesibilidad?.audioAlMostrarItems) return;
    for (const item of items) {
      await new Promise(resolve => {
        const a = new Audio(item.audioNombre);
        if (item.audioNombre) {
          a.play().catch(() => voz.hablar(item.texto));
          a.onended = resolve;
          setTimeout(resolve, 2000); // timeout máximo
        } else if (item.texto) {
          const u = new SpeechSynthesisUtterance(item.texto);
          u.lang = config?.accesibilidad?.idiomaVoz || 'es-CL';
          u.onend = resolve;
          window.speechSynthesis.speak(u);
          setTimeout(resolve, 2000);
        } else {
          resolve();
        }
      });
      await new Promise(r => setTimeout(r, 200));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MECÁNICAS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Mecánica: seleccion_multiple y seleccion_intruso ────────────────────────
  const mecSeleccion = {
    rondaCorrecta: 0,

    renderizar(ronda) {
      this.rondaCorrecta = 0;
      intentos = 0;
      tiempoRondaInicio = Date.now();

      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';

      // Determinar items
      let items;
      if (config.mecanica === 'seleccion_intruso') {
        items = mezclar(ronda.items || []);
      } else {
        items = mezclar(ronda.opciones || []);
      }

      renderizarInstruccion(ronda);

      // Grid de tarjetas
      const grid = document.createElement('div');
      grid.id = 'dg-grid';
      contenido.appendChild(grid);

      // Anunciar items accesibilidad
      anunciarItems(items);

      items.forEach(item => {
        const tarjeta = crearTarjeta(item, (it, el) => this.evaluar(it, el, items));
        grid.appendChild(tarjeta);
      });

      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
        });
      }
    },

    evaluar(item, el, todosItems) {
      const esCorrecta = config.mecanica === 'seleccion_intruso'
        ? item.esIntruso === true
        : item.correcta === true;

      if (esCorrecta) {
        el.classList.add('correcta');
        // Deshabilitar todas
        document.querySelectorAll('.dg-tarjeta').forEach(t => t.classList.add('deshabilitada'));

        const pts = intentos === 0
          ? (config.puntajePorAcierto || 10)
          : (config.puntajePorAciertoSegundoIntento || 5);
        puntaje += pts;

        fb.correcto('¡Muy bien!');

        const tiempoRonda = Math.round((Date.now() - tiempoRondaInicio) / 1000);
        detalleRondas.push({ ronda: rondaActual + 1, correcta: true, intentos: intentos + 1, tiempoRonda });

        actualizarUI();
        setTimeout(() => this.siguienteRonda(), 1400);

      } else {
        intentos++;
        el.classList.add('incorrecta');
        setTimeout(() => el.classList.remove('incorrecta'), 500);

        fb.error('¡Inténtalo de nuevo!');

        if (intentos >= (config.intentosPorRonda || 2)) {
          // Revelar respuesta correcta
          document.querySelectorAll('.dg-tarjeta').forEach(t => {
            const id = t.dataset.id;
            const itemData = todosItems.find(i => i.id === id);
            const esCorrectaItem = config.mecanica === 'seleccion_intruso'
              ? itemData?.esIntruso === true
              : itemData?.correcta === true;
            if (esCorrectaItem) t.classList.add('revelada');
            t.classList.add('deshabilitada');
          });

          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => this.siguienteRonda(), 1800);
        }
      }
    },

    siguienteRonda() {
      rondaActual++;
      if (rondaActual >= config.rondasTotal) {
        mostrarResultados();
      } else {
        this.renderizar(rondas[rondaActual]);
      }
    }
  };

  // ── Mecánica: ordenar_elementos ─────────────────────────────────────────────
  const mecOrdenar = {
    enRiel: [],
    fichasDisponibles: [],
    fichaSeleccionada: null,

    renderizar(ronda) {
      this.enRiel = [];
      this.fichasDisponibles = mezclar([...ronda.elementos]);
      this.fichaSeleccionada = null;
      intentos = 0;
      tiempoRondaInicio = Date.now();

      renderizarInstruccion(ronda);

      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';

      const zona = document.createElement('div');
      zona.id = 'dg-zona-orden';

      // Imagen de apoyo
      if (ronda.imagenApoyo || ronda.audioObjetivo) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:center;';
        if (ronda.imagenApoyo) {
          const img = document.createElement('img');
          img.id = 'dg-imagen-apoyo';
          img.src = ronda.imagenApoyo;
          img.alt = ronda.textoObjetivo || '';
          wrap.appendChild(img);
        }
        if (ronda.audioObjetivo || ronda.textoObjetivo) {
          const btn = document.createElement('button');
          btn.className = 'dg-btn-audio';
          btn.textContent = '🔊';
          btn.onclick = () => audio.reproducir(ronda.audioObjetivo, ronda.textoObjetivo);
          wrap.appendChild(btn);
        }
        zona.appendChild(wrap);
      }

      // Riel destino
      const riel = document.createElement('div');
      riel.id = 'dg-riel';
      riel.innerHTML = '<span style="color:#9ca3af;font-size:13px;">Arrastra las fichas aquí en orden</span>';

      // Drag & Drop en desktop
      riel.addEventListener('dragover', e => { e.preventDefault(); riel.classList.add('drag-over'); });
      riel.addEventListener('dragleave', () => riel.classList.remove('drag-over'));
      riel.addEventListener('drop', e => {
        e.preventDefault();
        riel.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        this.moverARiel(id);
      });

      zona.appendChild(riel);

      // Fichas origen
      const fichasWrap = document.createElement('div');
      fichasWrap.id = 'dg-fichas';
      zona.appendChild(fichasWrap);

      contenido.appendChild(zona);
      this.renderizarFichas();

      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : mecOrdenar.renderizar(rondas[rondaActual]);
        });
      }
    },

    renderizarFichas() {
      const riel = document.getElementById('dg-riel');
      const fichasWrap = document.getElementById('dg-fichas');
      if (!riel || !fichasWrap) return;

      // Limpiar riel
      riel.innerHTML = '';
      if (this.enRiel.length === 0) {
        riel.innerHTML = '<span style="color:#9ca3af;font-size:13px;">Arrastra las fichas aquí en orden</span>';
      }

      // Renderizar fichas en riel
      this.enRiel.forEach((elem, i) => {
        const ficha = this.crearFicha(elem, true);
        ficha.onclick = () => this.quitarDelRiel(i);
        ficha.title = 'Toca para quitar';
        riel.appendChild(ficha);
      });

      // Renderizar fichas disponibles
      fichasWrap.innerHTML = '';
      this.fichasDisponibles.forEach(elem => {
        const ficha = this.crearFicha(elem, false);
        fichasWrap.appendChild(ficha);
      });

      // Botón validar si el riel tiene todas las fichas
      const totalFichas = rondas[rondaActual].elementos.length;
      if (this.enRiel.length === totalFichas) {
        const btnValidar = document.createElement('button');
        btnValidar.className = 'dg-btn-primario';
        btnValidar.textContent = '✓ Verificar';
        btnValidar.style.marginTop = '8px';
        btnValidar.onclick = () => this.validar();
        fichasWrap.appendChild(btnValidar);
      }
    },

    crearFicha(elem, enRiel) {
      const ficha = document.createElement('div');
      ficha.className = 'dg-ficha' + (enRiel ? ' en-riel' : '');
      ficha.dataset.id = elem.id;
      ficha.textContent = elem.texto;

      // Drag desktop
      ficha.draggable = true;
      ficha.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', elem.id);
      });

      // Touch / click para móvil
      if (!enRiel) {
        ficha.addEventListener('click', () => this.moverARiel(elem.id));
      }

      // Audio al tocar
      if (elem.audio || elem.texto) {
        ficha.addEventListener('contextmenu', e => {
          e.preventDefault();
          audio.reproducir(elem.audio, elem.texto);
        });
      }

      return ficha;
    },

    moverARiel(id) {
      const idx = this.fichasDisponibles.findIndex(e => e.id === id);
      if (idx === -1) return;
      const elem = this.fichasDisponibles.splice(idx, 1)[0];
      this.enRiel.push(elem);
      this.renderizarFichas();
    },

    quitarDelRiel(idx) {
      const elem = this.enRiel.splice(idx, 1)[0];
      this.fichasDisponibles.push(elem);
      this.renderizarFichas();
    },

    validar() {
      const ronda = rondas[rondaActual];
      const esCorrecta = this.enRiel.every((elem, i) => elem.posicionCorrecta === i + 1);

      if (esCorrecta) {
        document.querySelectorAll('#dg-riel .dg-ficha').forEach(f => {
          f.style.background = '#22c55e'; f.style.color = 'white';
        });
        const pts = intentos === 0 ? (config.puntajePorAcierto || 10) : (config.puntajePorAciertoSegundoIntento || 5);
        puntaje += pts;
        fb.correcto('¡Orden correcto!');
        audio.reproducir(ronda.audioObjetivo, ronda.textoObjetivo);
        detalleRondas.push({ ronda: rondaActual + 1, correcta: true, intentos: intentos + 1, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
        actualizarUI();
        setTimeout(() => {
          rondaActual++;
          rondaActual >= config.rondasTotal ? mostrarResultados() : mecOrdenar.renderizar(rondas[rondaActual]);
        }, 1600);
      } else {
        intentos++;
        document.querySelectorAll('#dg-riel .dg-ficha').forEach(f => {
          f.style.animation = 'dg-sacudir 0.4s ease';
        });
        fb.error('¡El orden no es correcto!');
        if (intentos >= (config.intentosPorRonda || 2)) {
          // Mostrar orden correcto
          const ordenCorrecto = [...ronda.elementos].sort((a, b) => a.posicionCorrecta - b.posicionCorrecta);
          this.enRiel = ordenCorrecto;
          this.fichasDisponibles = [];
          this.renderizarFichas();
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : mecOrdenar.renderizar(rondas[rondaActual]);
          }, 2000);
        }
      }
    }
  };

  // ── Mecánica: constructor_historias ─────────────────────────────────────────
  const mecHistorias = {
    enRiel: [], disponibles: [],
    intentosFase1: 0,
    imagenActualIdx: 0,
    imagenesOrdenadas: [],
    intentosFase2: 0,
    puntajeRonda: 0,

    renderizar(ronda) {
      this.enRiel = [];
      this.disponibles = mezclar([...ronda.imagenes]);
      this.intentosFase1 = 0; this.imagenActualIdx = 0;
      this.imagenesOrdenadas = []; this.intentosFase2 = 0;
      this.puntajeRonda = 0;
      intentos = 0;
      tiempoRondaInicio = Date.now();
      renderizarInstruccion(ronda);
      this.renderizarFase1(ronda);
      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : mecHistorias.renderizar(rondas[rondaActual]);
        });
      }
    },

    renderizarFase1(ronda) {
      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.id = 'dg-historia-wrap';

      const label = document.createElement('p');
      label.className = 'dg-historia-fase-label';
      label.textContent = '① Arrastra las imágenes en el orden correcto de la historia';
      wrap.appendChild(label);

      const riel = document.createElement('div');
      riel.id = 'dg-historia-riel';
      riel.innerHTML = '<span style="color:#9ca3af;font-size:13px;">Arrastra las imágenes aquí en orden →</span>';
      riel.addEventListener('dragover', e => { e.preventDefault(); riel.classList.add('drag-over'); });
      riel.addEventListener('dragleave', () => riel.classList.remove('drag-over'));
      riel.addEventListener('drop', e => {
        e.preventDefault(); riel.classList.remove('drag-over');
        this.moverARiel(e.dataTransfer.getData('text/plain'), ronda);
      });
      wrap.appendChild(riel);

      const dispWrap = document.createElement('div');
      dispWrap.id = 'dg-historia-disponibles';
      wrap.appendChild(dispWrap);
      contenido.appendChild(wrap);
      this.renderizarImagenes(ronda);
    },

    renderizarImagenes(ronda) {
      const riel = document.getElementById('dg-historia-riel');
      const dispWrap = document.getElementById('dg-historia-disponibles');
      if (!riel || !dispWrap) return;

      riel.innerHTML = '';
      if (this.enRiel.length === 0) {
        riel.innerHTML = '<span style="color:#9ca3af;font-size:13px;">Arrastra las imágenes aquí en orden →</span>';
      }
      this.enRiel.forEach((img, i) => {
        const el = this.crearImgEl(img, true);
        el.onclick = () => this.quitarDelRiel(i, ronda);
        el.title = 'Toca para quitar';
        riel.appendChild(el);
      });

      dispWrap.innerHTML = '';
      this.disponibles.forEach(img => {
        const el = this.crearImgEl(img, false);
        el.onclick = () => this.moverARiel(img.id, ronda);
        dispWrap.appendChild(el);
      });

      if (this.enRiel.length === ronda.imagenes.length) {
        const btn = document.createElement('button');
        btn.className = 'dg-btn-primario';
        btn.textContent = '✓ Verificar orden';
        btn.style.marginTop = '8px';
        btn.onclick = () => this.validarOrden(ronda);
        dispWrap.appendChild(btn);
      }
    },

    crearImgEl(img, enRiel) {
      const el = document.createElement('img');
      el.className = 'dg-historia-img' + (enRiel ? ' en-riel' : '');
      el.dataset.id = img.id;
      el.src = img.imagen || '';
      el.alt = '';
      el.draggable = true;
      el.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', img.id));
      return el;
    },

    moverARiel(id, ronda) {
      const idx = this.disponibles.findIndex(i => i.id === id);
      if (idx === -1) return;
      this.enRiel.push(this.disponibles.splice(idx, 1)[0]);
      this.renderizarImagenes(ronda);
    },

    quitarDelRiel(idx, ronda) {
      this.disponibles.push(this.enRiel.splice(idx, 1)[0]);
      this.renderizarImagenes(ronda);
    },

    validarOrden(ronda) {
      const correcto = this.enRiel.every((img, i) => img.posicionCorrecta === i + 1);

      if (correcto) {
        document.querySelectorAll('#dg-historia-riel .dg-historia-img').forEach(el => {
          el.style.borderColor = '#22c55e'; el.style.boxShadow = '0 0 0 3px #22c55e';
        });
        fb.correcto('¡Orden correcto! Ahora construí las oraciones 📝');
        this.imagenesOrdenadas = [...this.enRiel].sort((a, b) => a.posicionCorrecta - b.posicionCorrecta);
        setTimeout(() => { this.imagenActualIdx = 0; this.intentosFase2 = 0; this.renderizarFase2(ronda); }, 1400);
      } else {
        this.intentosFase1++; intentos++;
        document.querySelectorAll('#dg-historia-riel .dg-historia-img').forEach(el => {
          el.style.animation = 'dg-sacudir 0.4s ease';
        });
        if (this.intentosFase1 >= (config.intentosPorRonda || 2)) {
          mostrarFeedback('Te muestro el orden correcto. ¡Prestá atención!');
          this.imagenesOrdenadas = [...ronda.imagenes].sort((a, b) => a.posicionCorrecta - b.posicionCorrecta);
          this.enRiel = this.imagenesOrdenadas;
          this.disponibles = [];
          this.renderizarImagenes(ronda);
          setTimeout(() => { this.imagenActualIdx = 0; this.intentosFase2 = 0; this.renderizarFase2(ronda); }, 2200);
        } else {
          fb.error('¡El orden no es correcto!');
        }
      }
    },

    renderizarFase2(ronda) {
      const img = this.imagenesOrdenadas[this.imagenActualIdx];
      if (!img) { this.finalizarRonda(ronda); return; }

      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.id = 'dg-historia-wrap';

      const label = document.createElement('p');
      label.className = 'dg-historia-fase-label';
      label.textContent = `② Elegí la oración — imagen ${this.imagenActualIdx + 1} de ${this.imagenesOrdenadas.length}`;
      wrap.appendChild(label);

      const imgEl = document.createElement('img');
      imgEl.id = 'dg-historia-imagen-actual';
      imgEl.src = img.imagen || '';
      imgEl.alt = '';
      wrap.appendChild(imgEl);

      const oracionesDiv = document.createElement('div');
      oracionesDiv.className = 'dg-historia-oraciones';
      mezclar([...img.oraciones]).forEach(op => {
        const btn = document.createElement('button');
        btn.className = 'dg-historia-oracion';
        btn.textContent = op.texto;
        btn.onclick = () => this.elegirOracion(btn, op, img, ronda);
        oracionesDiv.appendChild(btn);
      });
      wrap.appendChild(oracionesDiv);
      contenido.appendChild(wrap);
    },

    elegirOracion(btn, opcion, img, ronda) {
      const todos = [...document.querySelectorAll('.dg-historia-oracion')];
      todos.forEach(b => { b.disabled = true; });
      const textoCorrecta = img.oraciones.find(o => o.correcta)?.texto;

      if (opcion.correcta) {
        btn.classList.add('correcta');
        this.puntajeRonda++;
        setTimeout(() => {
          this.imagenActualIdx++;
          this.intentosFase2 = 0;
          this.renderizarFase2(ronda);
        }, 900);
      } else {
        btn.classList.add('incorrecta');
        this.intentosFase2++;
        setTimeout(() => {
          btn.classList.remove('incorrecta');
          if (this.intentosFase2 >= (config.intentosPorRonda || 2)) {
            todos.forEach(b => {
              b.disabled = true;
              if (b.textContent === textoCorrecta) b.classList.add('correcta');
            });
            setTimeout(() => { this.imagenActualIdx++; this.intentosFase2 = 0; this.renderizarFase2(ronda); }, 1400);
          } else {
            todos.forEach(b => { b.disabled = false; });
          }
        }, 800);
      }
    },

    finalizarRonda(ronda) {
      const total = this.imagenesOrdenadas.length;
      const pts = total > 0
        ? Math.round((config.puntajePorAcierto || 10) * this.puntajeRonda / total)
        : 0;
      puntaje += pts;
      const esCorrecta = total > 0 && this.puntajeRonda / total >= 0.5;
      detalleRondas.push({
        ronda: rondaActual + 1, correcta: esCorrecta,
        intentos: this.intentosFase1 + this.intentosFase2,
        tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000),
      });
      actualizarUI();

      const delay = ronda.audioHistoria ? 3500 : 1600;
      if (ronda.audioHistoria) {
        audio.reproducir(ronda.audioHistoria, null);
        mostrarFeedback(esCorrecta ? '¡Construiste una historia increíble! 📖' : '¡Buen intento! Seguí practicando 💪');
      } else if (esCorrecta) {
        fb.correcto('¡Construiste una historia increíble! 📖');
      } else {
        fb.error('¡Buen intento! Seguí practicando 💪');
      }
      setTimeout(() => {
        rondaActual++;
        rondaActual >= config.rondasTotal ? mostrarResultados() : mecHistorias.renderizar(rondas[rondaActual]);
      }, delay);
    },
  };

  // ── Mecánica: seleccion_secuencial ──────────────────────────────────────────
  const mecSecuencial = {
    pasoActual: 0,

    renderizar(ronda) {
      this.pasoActual = 0;
      intentos = 0;
      tiempoRondaInicio = Date.now();
      this.renderizarPaso(ronda, 0);

      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
        });
      }
    },

    renderizarPaso(ronda, paso) {
      const pasoData = ronda.pasos[paso];
      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';

      // Imagen principal de la ronda
      if (ronda.imagen && paso === 0) {
        const img = document.createElement('img');
        img.src = ronda.imagen;
        img.style.cssText = 'max-height:160px;object-fit:contain;border-radius:12px;box-shadow:var(--sombra);';
        contenido.appendChild(img);
      }

      // Indicador de paso
      const indicador = document.createElement('div');
      indicador.style.cssText = 'font-size:12px;color:#6b7280;text-align:center;';
      indicador.textContent = `Paso ${paso + 1} de ${ronda.pasos.length}`;
      contenido.appendChild(indicador);

      // Instrucción del paso
      const instrWrap = document.getElementById('dg-instruccion-texto');
      if (instrWrap) instrWrap.textContent = pasoData.pregunta || '';
      const btnRep = document.getElementById('dg-btn-repetir');
      if (btnRep) btnRep.onclick = () => audio.reproducir(pasoData.audioPregunta, pasoData.pregunta);
      setTimeout(() => audio.reproducir(pasoData.audioPregunta, pasoData.pregunta), 300);

      // Opciones
      const opciones = mezclar(pasoData.opciones || []);
      const grid = document.createElement('div');
      grid.id = 'dg-grid';
      contenido.appendChild(grid);

      opciones.forEach(op => {
        const tarjeta = crearTarjeta(op, (it, el) => this.evaluar(it, el, opciones, ronda, paso));
        grid.appendChild(tarjeta);
      });
    },

    evaluar(item, el, opciones, ronda, paso) {
      if (item.correcta) {
        el.classList.add('correcta');
        document.querySelectorAll('.dg-tarjeta').forEach(t => t.classList.add('deshabilitada'));
        puntaje += Math.floor((config.puntajePorAcierto || 10) / ronda.pasos.length);
        fb.correcto(paso < ronda.pasos.length - 1 ? '¡Correcto! Siguiente paso...' : '¡Muy bien!');
        actualizarUI();

        if (paso < ronda.pasos.length - 1) {
          setTimeout(() => this.renderizarPaso(ronda, paso + 1), 1200);
        } else {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: true, intentos: intentos + 1, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
          }, 1400);
        }
      } else {
        intentos++;
        el.classList.add('incorrecta');
        setTimeout(() => el.classList.remove('incorrecta'), 500);
        fb.error('¡Inténtalo de nuevo!');
        if (intentos >= (config.intentosPorRonda || 2)) {
          opciones.forEach(op => {
            if (op.correcta) {
              const t = document.querySelector(`.dg-tarjeta[data-id="${op.id}"]`);
              if (t) t.classList.add('revelada');
            }
          });
          document.querySelectorAll('.dg-tarjeta').forEach(t => t.classList.add('deshabilitada'));
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
          }, 1800);
        }
      }
    }
  };

  // ── Mecánica: tipeo ────────────────────────────────────────────────────────
  const mecTipeo = {
    pistaActual: -1,
    pistas: [],
    respuestaNorm: '',

    renderizar(ronda) {
      this.pistaActual = -1;
      this.pistas = ronda.pistas || [];
      this.respuestaNorm = this.normalizar(ronda.textoRespuesta || '');
      intentos = 0;
      tiempoRondaInicio = Date.now();

      renderizarInstruccion(ronda);

      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.id = 'dg-tipeo-wrap';

      // Prompt visual
      const prompt = document.createElement('div');
      prompt.id = 'dg-tipeo-prompt';
      if (ronda.imagen) {
        const img = document.createElement('img');
        img.src = ronda.imagen; img.alt = '';
        prompt.appendChild(img);
      } else if (ronda.emoji) {
        const span = document.createElement('span');
        span.className = 'dg-emoji';
        span.textContent = ronda.emoji;
        prompt.appendChild(span);
      }
      if (ronda.audioPrompt || ronda.audioInstruccion) {
        const btn = document.createElement('button');
        btn.className = 'dg-btn-audio';
        btn.textContent = '🔊';
        btn.onclick = () => audio.reproducir(ronda.audioPrompt || ronda.audioInstruccion, ronda.textoRespuesta);
        prompt.appendChild(btn);
      }
      wrap.appendChild(prompt);

      // Blancos (uno por carácter no espacio)
      const respuesta = (ronda.textoRespuesta || '').toLowerCase();
      const blancosWrap = document.createElement('div');
      blancosWrap.id = 'dg-tipeo-blancos';
      for (const c of respuesta) {
        if (c === ' ') {
          const sep = document.createElement('div');
          sep.style.width = '16px';
          blancosWrap.appendChild(sep);
        } else {
          const b = document.createElement('div');
          b.className = 'dg-blanco';
          blancosWrap.appendChild(b);
        }
      }
      wrap.appendChild(blancosWrap);

      // Input + botón verificar
      const inputWrap = document.createElement('div');
      inputWrap.id = 'dg-tipeo-input-wrap';

      const input = document.createElement('input');
      input.id = 'dg-tipeo-input';
      input.type = 'text';
      input.placeholder = 'Escribí la respuesta...';
      input.autocomplete = 'off';
      input.autocorrect = 'off';
      input.autocapitalize = 'off';
      input.spellcheck = false;

      const respSinEsp = respuesta.replace(/\s/g, '');
      input.addEventListener('input', () => {
        const valSinEsp = input.value.toLowerCase().replace(/\s/g, '');
        const blancos = Array.from(blancosWrap.querySelectorAll('.dg-blanco'));
        blancos.forEach((b, i) => {
          const ch = valSinEsp[i] || '';
          b.textContent = ch;
          b.classList.toggle('correcto', !!ch && ch === respSinEsp[i]);
        });
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') btnOk.click(); });

      const btnOk = document.createElement('button');
      btnOk.className = 'dg-btn-primario';
      btnOk.textContent = '✓';
      btnOk.style.cssText = 'padding:12px 20px;border-radius:var(--radius);font-size:20px;';
      btnOk.onclick = () => this.verificar(ronda, input, blancosWrap);

      inputWrap.appendChild(input);
      inputWrap.appendChild(btnOk);
      wrap.appendChild(inputWrap);

      // Pista
      if (this.pistas.length > 0) {
        const pistaEl = document.createElement('div');
        pistaEl.id = 'dg-tipeo-pista';
        pistaEl.textContent = '¿Necesitas una pista?';
        pistaEl.onclick = () => this.mostrarPista(input);
        wrap.appendChild(pistaEl);
      }

      contenido.appendChild(wrap);
      setTimeout(() => input.focus(), 400);

      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
        });
      }
    },

    normalizar(str) {
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').trim();
    },

    verificar(ronda, input, blancosWrap) {
      const escrito = this.normalizar(input.value);
      if (escrito === this.respuestaNorm) {
        input.classList.add('correcto');
        input.disabled = true;
        blancosWrap.querySelectorAll('.dg-blanco').forEach(b => b.classList.add('correcto'));

        const pts = intentos === 0
          ? (config.puntajePorAcierto || 10)
          : (config.puntajePorAciertoSegundoIntento || 5);
        puntaje += pts;
        fb.correcto('¡Muy bien!');
        detalleRondas.push({ ronda: rondaActual + 1, correcta: true, intentos: intentos + 1, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
        actualizarUI();
        setTimeout(() => {
          rondaActual++;
          rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
        }, 1400);
      } else {
        intentos++;
        input.classList.add('incorrecto');
        setTimeout(() => input.classList.remove('incorrecto'), 500);
        fb.error('¡Inténtalo de nuevo!');

        if (intentos >= (config.intentosPorRonda || 3)) {
          input.value = ronda.textoRespuesta;
          input.classList.add('correcto');
          input.disabled = true;
          const respSinEsp = (ronda.textoRespuesta || '').toLowerCase().replace(/\s/g, '');
          blancosWrap.querySelectorAll('.dg-blanco').forEach((b, i) => {
            b.textContent = respSinEsp[i] || '';
            b.classList.add('correcto');
          });
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
          }, 2000);
        }
      }
    },

    mostrarPista(input) {
      this.pistaActual = Math.min(this.pistaActual + 1, this.pistas.length - 1);
      const pista = this.pistas[this.pistaActual];
      if (pista) mostrarFeedback(`Pista: ${pista}`, 2500);
      const pistaEl = document.getElementById('dg-tipeo-pista');
      if (pistaEl && this.pistaActual >= this.pistas.length - 1) {
        pistaEl.textContent = 'Sin más pistas';
        pistaEl.style.cursor = 'default';
        pistaEl.onclick = null;
      }
      input.focus();
    }
  };

  // ── Mecánica: memoria ───────────────────────────────────────────────────────
  const mecMemoria = {
    cartasVolteadas: [],
    paresEncontrados: 0,
    totalPares: 0,
    bloqueado: false,
    movimientos: 0,

    renderizar(ronda) {
      this.cartasVolteadas = [];
      this.paresEncontrados = 0;
      this.totalPares = ronda.pares.length;
      this.bloqueado = false;
      this.movimientos = 0;
      intentos = 0;
      tiempoRondaInicio = Date.now();

      renderizarInstruccion(ronda);

      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.id = 'dg-memoria-wrap';

      const info = document.createElement('div');
      info.id = 'dg-memoria-info';
      info.textContent = `0 movimientos · 0/${ronda.pares.length} pares`;
      wrap.appendChild(info);

      const grid = document.createElement('div');
      grid.id = 'dg-memoria-grid';

      // Duplicar pares y mezclar
      const cartas = mezclar([
        ...ronda.pares.map(p => ({ ...p, inst: 'a' })),
        ...ronda.pares.map(p => ({ ...p, inst: 'b' }))
      ]);

      // Ajustar columnas
      const total = cartas.length;
      if (total <= 8)       grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      else if (total <= 12) grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      else                  grid.style.gridTemplateColumns = 'repeat(5, 1fr)';

      cartas.forEach((carta, i) => {
        const el = this.crearCarta(carta, i);
        grid.appendChild(el);
      });

      wrap.appendChild(grid);
      contenido.appendChild(wrap);

      // Preview breve al inicio
      const durPreview = Math.min(1200 + total * 80, 2500);
      grid.querySelectorAll('.dg-carta').forEach(c => c.classList.add('volteada'));
      setTimeout(() => {
        grid.querySelectorAll('.dg-carta:not(.emparejada)').forEach(c => c.classList.remove('volteada'));
      }, durPreview);

      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
        });
      }
    },

    crearCarta(carta, idx) {
      const el = document.createElement('div');
      el.className = 'dg-carta';
      el.dataset.id = carta.id;
      el.dataset.inst = carta.inst;
      el.style.animationDelay = `${idx * 0.04}s`;

      const dorso = document.createElement('div');
      dorso.className = 'dg-carta-dorso';
      dorso.textContent = config?.memoria?.simboloDorso || '❓';
      el.appendChild(dorso);

      const frente = document.createElement('div');
      frente.className = 'dg-carta-frente';
      if (carta.imagen) {
        const img = document.createElement('img');
        img.src = carta.imagen; img.alt = carta.texto || '';
        frente.appendChild(img);
      } else if (carta.emoji) {
        const span = document.createElement('span');
        span.className = 'dg-emoji';
        span.textContent = carta.emoji;
        frente.appendChild(span);
      }
      if (carta.texto && config?.accesibilidad?.textoVisible !== false) {
        const lbl = document.createElement('div');
        lbl.className = 'dg-label';
        lbl.textContent = carta.texto;
        frente.appendChild(lbl);
      }
      el.appendChild(frente);

      el.addEventListener('click', () => this.voltear(el, carta));
      return el;
    },

    voltear(el, carta) {
      if (this.bloqueado) return;
      if (el.classList.contains('volteada') || el.classList.contains('emparejada')) return;

      el.classList.add('volteada');
      if (carta.audioNombre || carta.texto) {
        audio.reproducir(carta.audioNombre, carta.texto);
      }
      this.cartasVolteadas.push({ el, carta });

      if (this.cartasVolteadas.length === 2) {
        this.movimientos++;
        this.actualizarInfo();
        this.bloqueado = true;
        setTimeout(() => this.verificarPar(), 750);
      }
    },

    verificarPar() {
      const [a, b] = this.cartasVolteadas;
      const coinciden = a.carta.id === b.carta.id && a.carta.inst !== b.carta.inst;

      if (coinciden) {
        a.el.classList.replace('volteada', 'emparejada');
        b.el.classList.replace('volteada', 'emparejada');
        this.paresEncontrados++;
        puntaje += Math.floor((config.puntajePorAcierto || 10) / this.totalPares) || 1;
        fb.correcto('¡Par encontrado!');
        actualizarUI();
        this.actualizarInfo();

        if (this.paresEncontrados === this.totalPares) {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: true, intentos: this.movimientos, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          fb.correcto('¡Ronda completa! 🏆');
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
          }, 2000);
        }
      } else {
        a.el.classList.remove('volteada');
        b.el.classList.remove('volteada');
        intentos++;
      }

      this.cartasVolteadas = [];
      this.bloqueado = false;
    },

    actualizarInfo() {
      const el = document.getElementById('dg-memoria-info');
      if (el) el.textContent = `${this.movimientos} movimientos · ${this.paresEncontrados}/${this.totalPares} pares`;
    }
  };

  // ── Mecánica: emparejar ─────────────────────────────────────────────────────
  const mecEmparejar = {
    seleccionadoIzq: null,
    paresCompletados: 0,
    totalPares: 0,
    mapaPares: {},

    renderizar(ronda) {
      this.seleccionadoIzq = null;
      this.paresCompletados = 0;
      this.totalPares = ronda.pares.length;
      this.mapaPares = {};
      intentos = 0;
      tiempoRondaInicio = Date.now();

      ronda.pares.forEach(p => { this.mapaPares[p.izquierda.id] = p.derecha.id; });

      renderizarInstruccion(ronda);

      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.id = 'dg-emparejar-wrap';

      const colIzq = document.createElement('div');
      colIzq.className = 'dg-emp-col';
      const colDer = document.createElement('div');
      colDer.className = 'dg-emp-col';

      const izqItems = mezclar(ronda.pares.map(p => p.izquierda));
      const derItems = mezclar(ronda.pares.map(p => p.derecha));

      izqItems.forEach(item => {
        const el = this.crearItem(item, 'izq');
        el.addEventListener('click', () => this.seleccionarIzq(item, el));
        colIzq.appendChild(el);
      });

      derItems.forEach(item => {
        const el = this.crearItem(item, 'der');
        el.addEventListener('click', () => this.intentarPar(item, el, ronda));
        colDer.appendChild(el);
      });

      wrap.appendChild(colIzq);
      wrap.appendChild(colDer);
      contenido.appendChild(wrap);

      guardarProgreso();
      if (config.temporizadorRonda) {
        _timerRonda.iniciar(config.temporizadorRonda, () => {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: config.temporizadorRonda });
          rondaActual++; actualizarUI();
          rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
        });
      }
    },

    crearItem(item, lado) {
      const el = document.createElement('div');
      el.className = 'dg-emp-item';
      el.dataset.id = item.id;

      if (item.imagen) {
        const img = document.createElement('img');
        img.src = item.imagen; img.alt = item.texto || '';
        el.appendChild(img);
      } else if (item.emoji) {
        const span = document.createElement('span');
        span.className = 'dg-emoji';
        span.textContent = item.emoji;
        el.appendChild(span);
      }

      if (item.texto) {
        const lbl = document.createElement('span');
        lbl.textContent = item.texto;
        el.appendChild(lbl);
      }

      // Audio al hacer clic derecho / long press
      if (item.audio || item.texto) {
        el.addEventListener('contextmenu', e => {
          e.preventDefault();
          audio.reproducir(item.audio, item.texto);
        });
      }

      return el;
    },

    seleccionarIzq(item, el) {
      if (el.classList.contains('correcto')) return;
      document.querySelectorAll('.dg-emp-item.seleccionado').forEach(e => e.classList.remove('seleccionado'));
      this.seleccionadoIzq = { item, el };
      el.classList.add('seleccionado');
      audio.reproducir(item.audio, item.texto);
    },

    intentarPar(itemDer, elDer, ronda) {
      if (!this.seleccionadoIzq) {
        mostrarFeedback('Primero elige un elemento de la izquierda');
        return;
      }
      if (elDer.classList.contains('correcto')) return;

      const { item: itemIzq, el: elIzq } = this.seleccionadoIzq;
      const esCorrecta = this.mapaPares[itemIzq.id] === itemDer.id;

      if (esCorrecta) {
        elIzq.classList.remove('seleccionado');
        elIzq.classList.add('correcto');
        elDer.classList.add('correcto');
        this.paresCompletados++;
        puntaje += Math.floor((config.puntajePorAcierto || 10) / this.totalPares) || 1;
        fb.correcto('¡Par correcto!');
        audio.reproducir(itemDer.audio, itemDer.texto);
        actualizarUI();

        if (this.paresCompletados === this.totalPares) {
          detalleRondas.push({ ronda: rondaActual + 1, correcta: true, intentos: intentos + 1, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
          }, 1600);
        }
      } else {
        intentos++;
        elDer.classList.add('incorrecto');
        setTimeout(() => elDer.classList.remove('incorrecto'), 500);
        fb.error('¡Inténtalo de nuevo!');

        const maxIntentos = (config.intentosPorRonda || 3) * this.totalPares;
        if (intentos >= maxIntentos) {
          ronda.pares.forEach(par => {
            const elI = document.querySelector(`.dg-emp-item[data-id="${par.izquierda.id}"]`);
            const elD = document.querySelector(`.dg-emp-item[data-id="${par.derecha.id}"]`);
            if (elI && !elI.classList.contains('correcto')) elI.classList.add('correcto');
            if (elD && !elD.classList.contains('correcto')) elD.classList.add('correcto');
          });
          detalleRondas.push({ ronda: rondaActual + 1, correcta: false, intentos, tiempoRonda: Math.round((Date.now() - tiempoRondaInicio) / 1000) });
          setTimeout(() => {
            rondaActual++;
            rondaActual >= config.rondasTotal ? mostrarResultados() : this.renderizar(rondas[rondaActual]);
          }, 2000);
        }
      }
      this.seleccionadoIzq = null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTADOS Y COMUNICACIÓN CON DIDACTIFONIS
  // ═══════════════════════════════════════════════════════════════════════════

  const mostrarResultados = () => {
    _timerRonda.detener();
    limpiarProgreso();
    const tiempoTotal = Math.round((Date.now() - tiempoInicio) / 1000);
    const puntajeMax  = config.rondasTotal * (config.puntajePorAcierto || 10);
    const pct         = Math.round((puntaje / puntajeMax) * 100);
    const trofeo      = calcularTrofeo(pct);
    const correctas   = detalleRondas.filter(r => r.correcta).length;
    const aprobado    = pct >= (config.puntajeMinimo || 60);

    // Actualizar pantalla de resultados
    document.getElementById('dg-resultado-trofeo').textContent = trofeo.emoji;
    document.getElementById('dg-resultado-titulo').textContent = trofeo.label;
    document.getElementById('dg-resultado-msg').textContent    = trofeo.msg;
    document.getElementById('dg-stat-puntaje').textContent     = puntaje;
    document.getElementById('dg-stat-correctas').textContent   = `${correctas}/${config.rondasTotal}`;
    document.getElementById('dg-stat-tiempo').textContent      = Math.round(tiempoTotal / 60) + ' min';

    document.getElementById('dg-pantalla-resultados').classList.add('visible');

    // Detener música y lanzar confetti si aprobado
    _detenerMusica();
    if (aprobado) setTimeout(_lanzarConfetti, 300);

    // Leer resultado en voz alta
    setTimeout(() => {
      voz.hablar(`${trofeo.msg} Obtuviste ${puntaje} puntos.`);
    }, 500);

    // Enviar resultado a Didactifonis
    const mensaje = {
      tipo: 'JUEGO_TERMINADO',
      datos: {
        puntaje,
        puntajeMaximo: puntajeMax,
        porcentaje: pct,
        rondasCorrectas: correctas,
        rondasTotales: config.rondasTotal,
        tiempoJugado: tiempoTotal,
        completado: true,
        aprobado,
        trofeo: trofeo.label,
        detalleRondas
      }
    };
    window.parent.postMessage(mensaje, '*');

    // Botones
    document.getElementById('dg-btn-reiniciar').onclick = () => reiniciar();
    document.getElementById('dg-btn-terminar').onclick  = () => window.parent.postMessage({ tipo: 'CERRAR_JUEGO' }, '*');
  };

  // ── Reiniciar juego ─────────────────────────────────────────────────────────
  const reiniciar = () => {
    limpiarProgreso();
    rondaActual   = 0;
    puntaje       = 0;
    intentos      = 0;
    detalleRondas = [];
    tiempoInicio  = Date.now();

    rondas = prepararRondas();

    document.getElementById('dg-pantalla-resultados').classList.remove('visible');
    actualizarUI();
    renderizarRonda(rondas[0]);
    _iniciarMusica();
  };

  // ── Preparar rondas ─────────────────────────────────────────────────────────
  const prepararRondas = () => {
    let banco = config.rondas || [];
    if (config.modoRondas === 'aleatorio') banco = mezclar(banco);
    return banco.slice(0, config.rondasTotal || 10);
  };

  // ── Renderizar ronda según mecánica ────────────────────────────────────────
  const renderizarRonda = (ronda) => {
    const mec = config.mecanica;
    if (mec === 'seleccion_multiple' || mec === 'seleccion_intruso') {
      mecSeleccion.renderizar(ronda);
    } else if (mec === 'ordenar_elementos') {
      mecOrdenar.renderizar(ronda);
    } else if (mec === 'seleccion_secuencial') {
      mecSecuencial.renderizar(ronda);
    } else if (mec === 'tipeo') {
      mecTipeo.renderizar(ronda);
    } else if (mec === 'memoria') {
      mecMemoria.renderizar(ronda);
    } else if (mec === 'emparejar') {
      mecEmparejar.renderizar(ronda);
    } else if (mec === 'constructor_historias') {
      mecHistorias.renderizar(ronda);
    } else {
      const contenido = document.getElementById('dg-contenido');
      contenido.innerHTML = `<p style="color:#6b7280;text-align:center;">Mecánica "${mec}" no reconocida</p>`;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  const init = async (jsonPath) => {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`No se pudo cargar ${jsonPath}`);
      config = await res.json();
    } catch (e) {
      document.body.innerHTML = `<div style="padding:40px;text-align:center;font-family:sans-serif;color:#ef4444;">
        <h2>Error al cargar el juego</h2>
        <p style="color:#6b7280;margin-top:8px;">${e.message}</p>
      </div>`;
      return;
    }

    // Valores por defecto
    config.rondasTotal         = config.rondasTotal || 10;
    config.intentosPorRonda    = config.intentosPorRonda || 2;
    config.puntajePorAcierto   = config.puntajePorAcierto || 10;
    config.modoRondas          = config.modoRondas || 'aleatorio';

    inyectarEstilos();
    construirDOM();

    // Clave de localStorage para este juego
    _lsKey = `didacti_${(config.id || config.titulo || 'juego').replace(/\s+/g, '_')}`;

    // Pantalla de inicio
    const descripcion = document.getElementById('dg-inicio-descripcion');
    if (descripcion) {
      descripcion.textContent = `${config.rondasTotal} rondas · Edad recomendada: ${config.edadMinima || 3}+ años`;
    }

    // Botón "Continuar" si hay progreso guardado
    const progGuardado = cargarProgreso();
    if (progGuardado && progGuardado.rondaActual > 0 && progGuardado.rondaActual < config.rondasTotal) {
      const btnComenzar = document.getElementById('dg-btn-comenzar');
      const btnCont = document.createElement('button');
      btnCont.className   = 'dg-btn-secundario';
      btnCont.style.cssText = 'margin-top:6px;';
      btnCont.textContent = `▶ Continuar (ronda ${progGuardado.rondaActual + 1} / ${config.rondasTotal})`;
      btnCont.onclick = () => {
        document.getElementById('dg-pantalla-inicio').style.display = 'none';
        rondaActual   = progGuardado.rondaActual;
        puntaje       = progGuardado.puntaje       || 0;
        detalleRondas = progGuardado.detalleRondas || [];
        tiempoInicio  = Date.now();
        rondas        = prepararRondas();
        actualizarUI();
        renderizarRonda(rondas[rondaActual]);
        _iniciarMusica();
        const btnM = document.getElementById('dg-btn-musica');
        const urlM = config?.accesibilidad?.musicaFondo || config?.visual?.musicaFondo;
        if (urlM && btnM) { btnM.style.display = 'block'; btnM.onclick = _toggleMusica; }
      };
      btnComenzar.insertAdjacentElement('afterend', btnCont);
    }

    document.getElementById('dg-btn-comenzar').onclick = () => {
      document.getElementById('dg-pantalla-inicio').style.display = 'none';
      rondas       = prepararRondas();
      tiempoInicio = Date.now();
      actualizarUI();
      renderizarRonda(rondas[0]);

      // Música de fondo (requiere gesto del usuario — se inicia aquí)
      _iniciarMusica();
      const btnMusica = document.getElementById('dg-btn-musica');
      const urlMusica = config?.accesibilidad?.musicaFondo || config?.visual?.musicaFondo;
      if (urlMusica && btnMusica) {
        btnMusica.style.display = 'block';
        btnMusica.onclick = _toggleMusica;
      }
    };
  };

  // API pública
  return { init };

})();
