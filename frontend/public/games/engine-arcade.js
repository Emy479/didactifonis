/**
 * Didactifonis Arcade Engine v1.4
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de juegos arcade para Didactifonis, powered by Phaser 3 (MIT License).
 *
 * Uso:
 *   1. Cargar Phaser 3 antes de este script en el index.html
 *   2. Agregar <div id="dg-arcade"></div> en el body
 *   3. Llamar DidactiArcade.init('./data.json')
 *
 * Novedades v1.4:
 *   - Soporte portrait / landscape: canvas 400×640 en vertical, 640×400 en horizontal
 *   - PLATAFORMAS_DEFAULT_LANDSCAPE: layout adaptado para pantalla apaisada
 *   - Gravedad y velocidad de salto ajustados según orientación
 *   - orientationchange → recarga automática para redibujar con el canvas correcto
 *
 * Arquitectura v1.4:
 *   isLandscape / platDefaults() → seleccionan valores por orientación
 *   arcadeShared = mixin con métodos comunes
 *   ScenaJuego   + Object.assign(ScenaJuego.prototype,    arcadeShared)
 *   ScenaPlataformero + Object.assign(ScenaPlataformero.prototype, arcadeShared)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DidactiArcade = (() => {
  'use strict';

  let cfg = null;

  // ── Orientación ──────────────────────────────────────────────────────────────
  let isLandscape = false; // se establece en init() antes de crear el juego

  // Disposición de plataformas por defecto — portrait (400×640)
  const PLATAFORMAS_DEFAULT = [
    { x: 0.50, y: 0.83, w: 0.88 }, // suelo
    { x: 0.22, y: 0.66, w: 0.36 },
    { x: 0.76, y: 0.56, w: 0.34 },
    { x: 0.50, y: 0.45, w: 0.40 },
    { x: 0.18, y: 0.33, w: 0.28 },
    { x: 0.80, y: 0.22, w: 0.28 },
  ];

  // Disposición de plataformas por defecto — landscape (640×400)
  // Más ancho, menos alto: plataformas distribuidas horizontalmente en 3 niveles
  const PLATAFORMAS_DEFAULT_LANDSCAPE = [
    { x: 0.50, y: 0.88, w: 0.96 }, // suelo
    { x: 0.16, y: 0.64, w: 0.24 }, // nivel medio — izquierda
    { x: 0.50, y: 0.58, w: 0.26 }, // nivel medio — centro
    { x: 0.84, y: 0.64, w: 0.24 }, // nivel medio — derecha
    { x: 0.28, y: 0.34, w: 0.22 }, // nivel alto — izquierda
    { x: 0.72, y: 0.34, w: 0.22 }, // nivel alto — derecha
  ];

  // Devuelve el layout por defecto según la orientación activa
  const platDefaults = () => isLandscape ? PLATAFORMAS_DEFAULT_LANDSCAPE : PLATAFORMAS_DEFAULT;

  // ── Temas visuales ────────────────────────────────────────────────────────────
  const TEMAS_ARCADE = {
    espacial: {
      fondoTop: 0x030712, fondoBot: 0x0f0720,
      plats: [0x3730a3, 0x4c1d95, 0x1e3a5f, 0x065f46, 0x7c2d12, 0x831843],
      suelo: 0x1e3a8a, particula: 0xffffff, particulaAlpha: [0.2, 0.85],
    },
    bosque: {
      fondoTop: 0x052e16, fondoBot: 0x14532d,
      plats: [0x15803d, 0x166534, 0x4d7c0f, 0x3f6212, 0x365314, 0x166534],
      suelo: 0x4d7c0f, particula: 0xbbf7d0, particulaAlpha: [0.1, 0.55],
    },
    ciudad: {
      fondoTop: 0x0f172a, fondoBot: 0x1e293b,
      plats: [0x334155, 0x475569, 0x374151, 0x4b5563, 0x2d3d4f, 0x334155],
      suelo: 0x475569, particula: 0xfbbf24, particulaAlpha: [0.15, 0.6],
    },
    oceano: {
      fondoTop: 0x0c4a6e, fondoBot: 0x075985,
      plats: [0x0369a1, 0x0284c7, 0x0ea5e9, 0x0891b2, 0x0369a1, 0x0284c7],
      suelo: 0x075985, particula: 0x7dd3fc, particulaAlpha: [0.2, 0.6],
    },
    fiesta: {
      fondoTop: 0x1a1a2e, fondoBot: 0x16213e,
      plats: [0x7c3aed, 0xdb2777, 0xd97706, 0x059669, 0x2563eb, 0x9333ea],
      suelo: 0x4c1d95, particula: 0xfcd34d, particulaAlpha: [0.2, 0.7],
    },
  };

  const _getTema = () => TEMAS_ARCADE[cfg?.tema] ?? TEMAS_ARCADE.espacial;

  // ── Música de fondo (HTML5 Audio) ────────────────────────────────────────────
  let _musicaFondo = null;

  const _iniciarMusica = (url) => {
    if (!url) return;
    try {
      _musicaFondo = new Audio(url);
      _musicaFondo.loop   = true;
      _musicaFondo.volume = 0.3;
      _musicaFondo.play().catch(() => {});
    } catch {}
  };

  const _detenerMusica = () => {
    if (_musicaFondo) {
      _musicaFondo.pause();
      _musicaFondo.currentTime = 0;
      _musicaFondo = null;
    }
  };

  // ── Utilidades ──────────────────────────────────────────────────────────────
  const rand  = (a, b) => Phaser.Math.Between(a, b);
  const randF = (a, b) => Phaser.Math.FloatBetween(a, b);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const postMsg = (tipo, datos = {}) => {
    try { window.parent.postMessage({ tipo, origen: 'didacti-arcade', ...datos }, '*'); } catch {}
  };

  const sintetizar = (texto) => {
    if (!texto) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = cfg?.accesibilidad?.idiomaVoz || 'es-CL';
      u.rate  = 0.9;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  let _audioCtx = null;
  const tono = (hz, dur = 0.15, tipo = 'sine') => {
    try {
      _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc  = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain); gain.connect(_audioCtx.destination);
      osc.type = tipo; osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.22, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
      osc.start(); osc.stop(_audioCtx.currentTime + dur);
    } catch {}
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ESCENA: Carga
  // ════════════════════════════════════════════════════════════════════════════
  class ScenaCarga extends Phaser.Scene {
    constructor() { super({ key: 'Carga' }); }

    preload() {
      const { width: W, height: H } = this.scale;
      this.add.rectangle(0, 0, W, H, 0x030712).setOrigin(0);
      this.add.text(W / 2, H / 2 - 24, '🚀', { fontSize: '52px' }).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 40, 'Cargando...', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#a78bfa',
      }).setOrigin(0.5);
      this.load.json('cfg', this.game.registry.get('dataPath') || './data.json');
    }

    create() {
      cfg = this.cache.json.get('cfg');
      if (!cfg) { console.error('[DidactiArcade] No se pudo cargar data.json'); return; }
      this.scene.start('Intro');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ESCENA: Intro / Menú
  // ════════════════════════════════════════════════════════════════════════════
  class ScenaIntro extends Phaser.Scene {
    constructor() { super({ key: 'Intro' }); }

    create() {
      const { width: W, height: H } = this.scale;
      this.add.rectangle(0, 0, W, H, 0x030712).setOrigin(0);
      this._estrellasFijas(70);

      const esPlat  = cfg.submecanica === 'plataformero';
      const iconoEm = esPlat ? '🏃' : '🚀';

      this.add.text(W / 2, H * 0.14, cfg.titulo || 'Juego Arcade', {
        fontSize: '26px',
        fontFamily: '"Arial Black", Impact, sans-serif',
        color: '#ffffff',
        stroke: '#7e22ce', strokeThickness: 4,
        align: 'center', wordWrap: { width: W - 48 },
      }).setOrigin(0.5);

      if (cfg.area) {
        this.add.text(W / 2, H * 0.22, cfg.area.toUpperCase(), {
          fontSize: '11px', fontFamily: 'Arial', color: '#a78bfa',
          backgroundColor: '#1e1b4b', padding: { x: 10, y: 4 },
        }).setOrigin(0.5);
      }

      const em = this.add.text(W / 2, H * 0.36, iconoEm, { fontSize: '80px' }).setOrigin(0.5);
      this.tweens.add({ targets: em, y: H * 0.36 - 12, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      this.add.text(W / 2, H * 0.53, cfg.instruccion || '¡Recoge las palabras correctas!', {
        fontSize: '15px', fontFamily: 'Arial, sans-serif',
        color: '#e2e8f0', align: 'center', wordWrap: { width: W - 56 },
      }).setOrigin(0.5);

      const hintTxt = esPlat
        ? '← → correr  ·  ↑ saltar  ·  P pausar  ·  botones en móvil'
        : '← → ↑ ↓ mover  ·  toca la pantalla en móvil  ·  P pausar';
      this.add.text(W / 2, H * 0.64, hintTxt, {
        fontSize: '10px', fontFamily: 'Arial', color: '#64748b',
        align: 'center', wordWrap: { width: W - 40 },
      }).setOrigin(0.5);

      const btnBg  = this.add.rectangle(W / 2, H * 0.77, 190, 54, 0x7c3aed).setInteractive({ useHandCursor: true });
      const btnTxt = this.add.text(W / 2, H * 0.77, '¡JUGAR!', {
        fontSize: '22px', fontFamily: '"Arial Black", sans-serif', color: '#fff',
      }).setOrigin(0.5);

      const _irAJuego = () => {
        const destino = esPlat ? 'Plataformero' : 'Juego';
        this.scene.start(destino);
      };

      btnBg.on('pointerover',  () => btnBg.setFillStyle(0xa855f7));
      btnBg.on('pointerout',   () => btnBg.setFillStyle(0x7c3aed));
      btnBg.on('pointerdown',  () => {
        this.tweens.add({
          targets: [btnBg, btnTxt], scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true,
          onComplete: _irAJuego,
        });
      });
      this.input.keyboard.once('keydown', _irAJuego);

      const meta = [cfg.dificultad, cfg.edadMinima && `${cfg.edadMinima}-${cfg.edadMaxima} años`].filter(Boolean).join(' · ');
      if (meta) {
        this.add.text(W / 2, H * 0.9, meta, { fontSize: '11px', fontFamily: 'Arial', color: '#475569' }).setOrigin(0.5);
      }
    }

    _estrellasFijas(n) {
      const { width: W, height: H } = this.scale;
      for (let i = 0; i < n; i++) {
        this.add.circle(rand(0, W), rand(0, H), randF(0.4, 2.2), 0xffffff, randF(0.15, 0.85));
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MIXIN: arcadeShared
  // Métodos compartidos entre ScenaJuego (nave) y ScenaPlataformero.
  // Se aplica con Object.assign(Escena.prototype, arcadeShared).
  // ════════════════════════════════════════════════════════════════════════════
  const arcadeShared = {

    // ── Estado inicial ────────────────────────────────────────────────────────
    _initEstado() {
      this.puntaje       = 0;
      this.vidas         = cfg.vidas ?? 3;
      this.aciertos      = 0;
      this.errores       = 0;
      this.terminado     = false;
      this.tiempoInicio  = 0;
      this.duracionMs    = (cfg.duracion ?? 60) * 1000;
      this.palabras      = [];
      this.racha         = 0;
      this.mejorRacha    = 0;
      this.multiplicador = 1;
      this.pausado       = false;
      this._speedFactor  = 1;
      this._escudo       = 0;
      this._velBoost     = 1;
      this._velBoostTimer = 0;
      this._powerUps     = [];
      // W y H se asignan en create() desde this.scale (dependen de la orientación)
    },

    // ── HUD ───────────────────────────────────────────────────────────────────
    _crearHUD() {
      const { W } = this;
      const dep = 20;

      this.add.rectangle(0, 0, W, 50, 0x000000, 0.6).setOrigin(0).setDepth(dep);

      this.txtPuntaje = this.add.text(12, 9, 'Puntos: 0', {
        fontSize: '15px', fontFamily: '"Arial Black", sans-serif', color: '#e2e8f0',
      }).setDepth(dep + 1);

      this.txtTimer = this.add.text(W / 2, 9, '1:00', {
        fontSize: '17px', fontFamily: '"Arial Black", sans-serif',
        color: '#fbbf24', stroke: '#78350f', strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(dep + 1);

      this.iconosVida = [];
      const vidasTotal = cfg.vidas ?? 3;
      for (let i = 0; i < vidasTotal; i++) {
        const h = this.add.text(W - 14 - i * 27, 9, '❤️', { fontSize: '17px' })
          .setOrigin(1, 0).setDepth(dep + 1);
        this.iconosVida.unshift(h);
      }

      this.txtRacha = this.add.text(W / 2, 52, '', {
        fontSize: '11px', fontFamily: '"Arial Black"', color: '#fbbf24',
        stroke: '#78350f', strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(dep + 1);

      const instrCorta = (cfg.instruccion || '').slice(0, 60);
      this.add.text(W / 2, 66, instrCorta, {
        fontSize: '10px', fontFamily: 'Arial', color: '#94a3b8',
        align: 'center', wordWrap: { width: W - 16 },
      }).setOrigin(0.5, 0).setDepth(dep);

      // Botón pausa touch (esquina superior derecha del HUD)
      const btnPausa = this.add.text(W - 10, 10, '⏸', {
        fontSize: '18px', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 },
      }).setOrigin(1, 0).setDepth(dep + 2).setInteractive({ useHandCursor: true });
      btnPausa.on('pointerdown', () => this._togglePausa());
    },

    _actualizarPuntaje() {
      this.txtPuntaje?.setText(`Puntos: ${this.puntaje}`);
    },

    _actualizarTimer(ms) {
      const seg = Math.ceil(ms / 1000);
      const m   = Math.floor(seg / 60), s = seg % 60;
      this.txtTimer?.setText(`${m}:${String(s).padStart(2, '0')}`);
      this.txtTimer?.setColor(seg <= 10 ? '#ef4444' : '#fbbf24');
    },

    _actualizarVidas() {
      this.iconosVida?.forEach((h, i) => h.setText(i < this.vidas ? '❤️' : '🖤'));
    },

    _actualizarRacha() {
      if (!this.txtRacha) return;
      if (this.racha < 2) { this.txtRacha.setText(''); return; }
      const mult  = this.multiplicador;
      const label = mult > 1 ? `🔥 Racha x${this.racha}  ×${mult}` : `🔥 Racha x${this.racha}`;
      this.txtRacha.setText(label);
      this.tweens.add({ targets: this.txtRacha, scaleX: 1.25, scaleY: 1.25, duration: 80, yoyo: true });
    },

    // ── Feedback ──────────────────────────────────────────────────────────────
    _feedbackPositivo(x, y, gana, mult) {
      tono(880, 0.1); this.time.delayedCall(110, () => tono(1100, 0.1));

      const label = mult > 1 ? `+${gana}  x${mult}` : `+${gana}`;
      const t = this.add.text(x, y, label, {
        fontSize: '24px', fontFamily: '"Arial Black"', color: '#4ade80',
        stroke: '#14532d', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(10);
      this.tweens.add({ targets: t, y: y - 65, alpha: 0, duration: 750, ease: 'Power2', onComplete: () => t.destroy() });

      this.cameras.main.flash(90, 0, 160, 0, false);

      for (let i = 0; i < 8; i++) {
        const dot = this.add.circle(x, y, rand(3, 6), 0x4ade80).setDepth(9);
        const ang = randF(0, Math.PI * 2), spd = randF(55, 130);
        this.tweens.add({ targets: dot, x: x + Math.cos(ang) * spd, y: y + Math.sin(ang) * spd,
          alpha: 0, duration: 480, ease: 'Power2', onComplete: () => dot.destroy() });
      }

      if (this.racha >= 5) {
        for (let i = 0; i < 6; i++) {
          const star = this.add.text(x, y, '⭐', { fontSize: rand(12, 20) + 'px' }).setOrigin(0.5).setDepth(11);
          const ang  = randF(0, Math.PI * 2);
          this.tweens.add({ targets: star, x: x + Math.cos(ang) * 90, y: y + Math.sin(ang) * 90,
            alpha: 0, duration: 650, onComplete: () => star.destroy() });
        }
      }
    },

    _feedbackNegativo(x, y) {
      tono(200, 0.2, 'sawtooth');

      const t = this.add.text(x, y, `-${cfg.puntajePorError ?? 5}`, {
        fontSize: '24px', fontFamily: '"Arial Black"', color: '#f87171',
        stroke: '#7f1d1d', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(10);
      this.tweens.add({ targets: t, y: y - 65, alpha: 0, duration: 750, ease: 'Power2', onComplete: () => t.destroy() });

      this.cameras.main.shake(160, 0.012);

      for (let i = 0; i < 6; i++) {
        const dot = this.add.circle(x, y, rand(3, 5), 0xef4444).setDepth(9);
        const ang = randF(0, Math.PI * 2);
        this.tweens.add({ targets: dot, x: x + Math.cos(ang) * 75, y: y + Math.sin(ang) * 75,
          alpha: 0, duration: 430, onComplete: () => dot.destroy() });
      }
    },

    // ── Pausa ─────────────────────────────────────────────────────────────────
    _crearPausaOverlay() {
      const { W, H } = this;
      const dep = 60;

      const bg     = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(dep);
      const titulo = this.add.text(W / 2, H * 0.38, '⏸  PAUSA', {
        fontSize: '34px', fontFamily: '"Arial Black", sans-serif',
        color: '#ffffff', stroke: '#7c3aed', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(dep + 1);
      const hint = this.add.text(W / 2, H * 0.48, 'Presioná P o ESC para continuar', {
        fontSize: '13px', fontFamily: 'Arial', color: '#94a3b8',
      }).setOrigin(0.5).setDepth(dep + 1);
      const btnBg = this.add.rectangle(W / 2, H * 0.58, 175, 52, 0x7c3aed)
        .setDepth(dep + 1).setInteractive({ useHandCursor: true });
      const btnTxt = this.add.text(W / 2, H * 0.58, '▶  Continuar', {
        fontSize: '18px', fontFamily: '"Arial Black"', color: '#fff',
      }).setOrigin(0.5).setDepth(dep + 2);

      btnBg.on('pointerover',  () => btnBg.setFillStyle(0xa855f7));
      btnBg.on('pointerout',   () => btnBg.setFillStyle(0x7c3aed));
      btnBg.on('pointerdown',  () => this._togglePausa());

      this.pausaGrupo = this.add.group([bg, titulo, hint, btnBg, btnTxt]);
      this.pausaGrupo.setVisible(false);
    },

    _togglePausa() {
      if (this.terminado) return;
      this.pausado = !this.pausado;
      this.pausaGrupo.setVisible(this.pausado);

      if (this.pausado) {
        if (this.spawnTimer)   this.spawnTimer.paused   = true;
        if (this.powerUpTimer) this.powerUpTimer.paused = true;
        const sprite = this.nave || this.jugador;
        sprite?.setVelocity(0, 0);
        if (_musicaFondo) _musicaFondo.pause();
      } else {
        if (this.spawnTimer)   this.spawnTimer.paused   = false;
        if (this.powerUpTimer) this.powerUpTimer.paused = false;
        if (_musicaFondo && cfg.musica) _musicaFondo.play().catch(() => {});
      }
    },

    // ── Terminar ──────────────────────────────────────────────────────────────
    _terminar() {
      if (this.terminado) return;
      this.terminado = true;
      this.spawnTimer?.remove();
      this.powerUpTimer?.remove();
      const sprite = this.nave || this.jugador;
      sprite?.setVelocity(0, 0);
      _detenerMusica();

      this.palabras.forEach(p => { try { p.bg.destroy(); p.txt.destroy(); } catch {} });
      this.palabras = [];
      this._powerUps.forEach(pu => { try { pu.bg?.destroy(); pu.icono?.destroy(); } catch {} });
      this._powerUps = [];
      this._objetosL2?.forEach(o => { try { o.bg.destroy(); o.borde.destroy(); o.visual.destroy(); } catch {} });
      this._objetosL2 = [];

      const total      = this.aciertos + this.errores;
      const porcentaje = total > 0 ? Math.round((this.aciertos / total) * 100) : 0;
      const aprobado   = porcentaje >= (cfg.puntajeMinimo ?? 60);

      postMsg('JUEGO_TERMINADO', {
        puntaje: this.puntaje, aciertos: this.aciertos,
        errores: this.errores, porcentaje, aprobado,
        duracion: Math.round((this.time.now - this.tiempoInicio) / 1000),
        mejorRacha: this.mejorRacha,
      });

      this.time.delayedCall(600, () => {
        this.scene.start('Resultado', {
          puntaje: this.puntaje, aciertos: this.aciertos,
          errores: this.errores, porcentaje, aprobado,
          titulo: cfg.titulo, mejorRacha: this.mejorRacha,
          submecanica: cfg.submecanica,
        });
      });
    },

    // ── Colisión con palabra ──────────────────────────────────────────────────
    _procesarColision(p) {
      const x = p.bg.x, y = p.bg.y;

      if (p.isCorrecta) {
        this.racha++;
        if (this.racha > this.mejorRacha) this.mejorRacha = this.racha;
        const mult = this.racha >= 8 ? 3 : this.racha >= 5 ? 2 : this.racha >= 3 ? 1.5 : 1;
        const gana = Math.round((cfg.puntajePorAcierto ?? 10) * mult);
        this.puntaje += gana;
        this.aciertos++;
        this.multiplicador = mult;
        this._feedbackPositivo(x, y, gana, mult);
      } else {
        this.puntaje = Math.max(0, this.puntaje - (cfg.puntajePorError ?? 5));
        this.errores++;
        this.racha         = 0;
        this.multiplicador = 1;
        this._feedbackNegativo(x, y);
        this._perderVida();
      }

      this._actualizarPuntaje();
      this._actualizarRacha();
    },

    // ── Vidas ─────────────────────────────────────────────────────────────────
    _perderVida() {
      if (this._escudo > 0) {
        this._escudo--;
        this._actualizarHUDPowerUps();
        const t = this.add.text(this.W / 2, this.H / 2, '🛡️ ¡Escudo!', {
          fontSize: '26px', fontFamily: '"Arial Black"', color: '#fbbf24',
          stroke: '#78350f', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: t, y: this.H / 2 - 60, alpha: 0, duration: 700, onComplete: () => t.destroy() });
        tono(660, 0.15); this.time.delayedCall(100, () => tono(880, 0.12));
        return;
      }

      this.vidas = Math.max(0, this.vidas - 1);
      this._actualizarVidas();
      const sprite = this.nave || this.jugador;
      if (sprite) {
        this.tweens.add({ targets: sprite, alpha: { from: 0.15, to: 1 }, duration: 70, repeat: 5, yoyo: true });
      }
      if (this.vidas <= 0) this._terminar();
    },

    // ── Power-ups ─────────────────────────────────────────────────────────────
    _initPowerUps() {
      this._powerUps      = [];
      this._escudo        = 0;
      this._velBoost      = 1;
      this._velBoostTimer = 0;
      const delay = (cfg.powerUpInterval ?? 14) * 1000;
      this.powerUpTimer = this.time.addEvent({
        delay, callback: this._spawnPowerUp, callbackScope: this, loop: true,
      });
      this._crearHUDPowerUps();
    },

    _spawnPowerUp() {
      if (this.terminado || this.pausado) return;
      const tipo     = rand(0, 1) === 0 ? 'escudo' : 'velocidad';
      const x        = rand(50, this.W - 50);
      const y        = rand(90, this.H - 120);
      const iconoStr = tipo === 'escudo' ? '🛡️' : '⚡';
      const bgCol    = tipo === 'escudo' ? 0x1d4ed8 : 0xb45309;
      const brdCol   = tipo === 'escudo' ? 0x60a5fa : 0xfbbf24;

      const bg    = this.add.rectangle(x, y, 46, 46, bgCol, 0.88).setDepth(4).setStrokeStyle(2, brdCol);
      const icono = this.add.text(x, y, iconoStr, { fontSize: '24px' }).setOrigin(0.5).setDepth(5);

      const baseY = y;
      this.tweens.add({ targets: [bg, icono], y: baseY - 9, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      // Auto-destruir a los 12 s
      this.time.delayedCall(12000, () => {
        if (!bg.active) return;
        bg.destroy(); icono.destroy();
        this._powerUps = this._powerUps.filter(pu => pu.bg !== bg);
      });

      this._powerUps.push({ tipo, bg, icono, recolectado: false });
    },

    _actualizarPowerUps(spriteX, spriteY, dt) {
      // Contar down del turbo
      if (this._velBoost > 1) {
        this._velBoostTimer -= dt * 1000;
        if (this._velBoostTimer <= 0) {
          this._velBoost = 1;
          this._actualizarHUDPowerUps();
        }
      }

      // AABB de recolección
      this._powerUps = this._powerUps.filter(pu => {
        if (pu.recolectado || !pu.bg.active) return false;
        const dx = Math.abs(spriteX - pu.bg.x);
        const dy = Math.abs(spriteY - pu.bg.y);
        if (dx < 42 && dy < 42) {
          pu.recolectado = true;
          pu.bg.destroy(); pu.icono.destroy();
          this._aplicarPowerUp(pu.tipo);
          return false;
        }
        return true;
      });
    },

    _aplicarPowerUp(tipo) {
      if (tipo === 'escudo') {
        this._escudo = Math.min(this._escudo + 1, 3);
        tono(880, 0.15); this.time.delayedCall(100, () => tono(1100, 0.12));
        const t = this.add.text(this.W / 2, this.H * 0.4, '🛡️ ¡Escudo obtenido!', {
          fontSize: '20px', fontFamily: '"Arial Black"', color: '#60a5fa',
          stroke: '#1e3a8a', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: t, y: this.H * 0.4 - 55, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      } else {
        this._velBoost      = 1.6;
        this._velBoostTimer = 5000;
        tono(660, 0.12); this.time.delayedCall(80, () => tono(880, 0.12));
        const t = this.add.text(this.W / 2, this.H * 0.4, '⚡ ¡Turbo 5s!', {
          fontSize: '20px', fontFamily: '"Arial Black"', color: '#fbbf24',
          stroke: '#78350f', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: t, y: this.H * 0.4 - 55, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      }
      this._actualizarHUDPowerUps();
    },

    _crearHUDPowerUps() {
      this.txtPowerUps = this.add.text(this.W / 2, this.H - 12, '', {
        fontSize: '20px', fontFamily: 'Arial',
      }).setOrigin(0.5, 1).setDepth(21);
    },

    _actualizarHUDPowerUps() {
      if (!this.txtPowerUps) return;
      let s = '';
      for (let i = 0; i < this._escudo; i++) s += '🛡️';
      if (this._velBoost > 1) s += (s ? ' ' : '') + '⚡';
      this.txtPowerUps.setText(s);
    },

    // ── Spritesheet: configurar animaciones ───────────────────────────────────
    _setupAnimaciones(sprite) {
      const p = cfg.personaje;
      if (!p?.spritesheet) return;
      const defs = {
        idle: p.animaciones?.idle || { start: 0, end: 3, frameRate: 8 },
        walk: p.animaciones?.walk || { start: 4, end: 7, frameRate: 12 },
        jump: p.animaciones?.jump || { start: 8, end: 9, frameRate: 8 },
      };
      Object.entries(defs).forEach(([key, def]) => {
        const k = `personaje_${key}`;
        if (!this.anims.exists(k)) {
          this.anims.create({
            key: k,
            frames: this.anims.generateFrameNumbers(sprite.texture.key, { start: def.start, end: def.end }),
            frameRate: def.frameRate,
            repeat: -1,
          });
        }
      });
    },

    _playAnimacion(sprite, vx, vy, enSuelo) {
      if (!cfg.personaje?.spritesheet) return;
      if (!enSuelo) {
        sprite.play('personaje_jump', true);
      } else if (vx !== 0 || vy !== 0) {
        sprite.play('personaje_walk', true);
        if (vx !== 0) sprite.setFlipX(vx < 0);
      } else {
        sprite.play('personaje_idle', true);
      }
    },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ESCENA: Juego — Nave Cazadora
  // ════════════════════════════════════════════════════════════════════════════
  class ScenaJuego extends Phaser.Scene {
    constructor() { super({ key: 'Juego' }); }

    preload() {
      const p = cfg?.personaje;
      if (p?.spritesheet && !this.textures.exists('rocket')) {
        this.load.spritesheet('rocket', p.spritesheet, {
          frameWidth:  p.frameWidth  || 48,
          frameHeight: p.frameHeight || 48,
        });
      }
    }

    init() { this._initEstado(); }

    create() {
      const { width: W, height: H } = this.scale;
      this.W = W; this.H = H;
      const tema = _getTema();

      this.add.rectangle(0, 0, W, H, tema.fondoTop).setOrigin(0);
      this.add.rectangle(0, H * 0.45, W, H * 0.55, tema.fondoBot, 0.6).setOrigin(0);
      this._crearFondoEstelar();
      this._generarTexturaRocket();

      this.nave = this.physics.add.sprite(W / 2, H - 100, 'rocket');
      this.nave.setCollideWorldBounds(true);
      this.nave.body.setSize(28, 44).setOffset(12, 10);
      this._setupAnimaciones(this.nave);

      this._crearHUD();
      this._crearPausaOverlay();

      this.cursores = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
      this.teclaP   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      this.input.on('pointermove', ptr => {
        if (ptr.isDown && !this.terminado && !this.pausado) {
          this.nave.x = clamp(ptr.x, 26, W - 26);
          this.nave.y = clamp(ptr.y, 70, H - 40);
          this.nave.body.reset(this.nave.x, this.nave.y);
        }
      });
      this.input.on('pointerdown', ptr => {
        if (!this.terminado && !this.pausado) {
          this.nave.x = clamp(ptr.x, 26, W - 26);
          this.nave.y = clamp(ptr.y, 70, H - 40);
          this.nave.body.reset(this.nave.x, this.nave.y);
        }
      });

      const spawnRate = cfg.palabras?.spawnRate ?? 1800;
      this.spawnTimer = this.time.addEvent({
        delay: spawnRate, callback: this._spawnPalabra, callbackScope: this, loop: true,
      });
      this.time.delayedCall(350, this._spawnPalabra, [], this);

      this._initPowerUps();
      this.time.delayedCall(300, () => sintetizar(cfg.instruccion || ''));
      this.tiempoInicio = this.time.now;
      _iniciarMusica(cfg.musica);
    }

    update(time, delta) {
      if (this.terminado) return;

      if (Phaser.Input.Keyboard.JustDown(this.teclaP) ||
          Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
        this._togglePausa();
      }
      if (this.pausado) return;

      const elapsed = clamp((time - this.tiempoInicio) / this.duracionMs, 0, 1);
      this._speedFactor = 1 + elapsed * 0.8;

      const dt  = delta / 1000;
      const vel = (cfg.personaje?.velocidad ?? 290) * this._velBoost;

      let vx = 0, vy = 0;
      if (this.cursores.left.isDown  || this.wasd.left.isDown)  vx = -vel;
      if (this.cursores.right.isDown || this.wasd.right.isDown) vx =  vel;
      if (this.cursores.up.isDown    || this.wasd.up.isDown)    vy = -vel;
      if (this.cursores.down.isDown  || this.wasd.down.isDown)  vy =  vel;
      this.nave.setVelocity(vx, vy);
      this._playAnimacion(this.nave, vx, vy, true);

      const anguloObj = vx !== 0 ? (vx > 0 ? 14 : -14) : 0;
      if (!cfg.personaje?.spritesheet) {
        this.nave.angle = Phaser.Math.Linear(this.nave.angle, anguloObj, 0.14);
      }

      const navX = this.nave.x, navY = this.nave.y;
      const nHW = 18, nHH = 28;

      this.palabras = this.palabras.filter(p => {
        if (p.recolectada) return false;

        p.bg.x  += p.vx * dt;
        p.bg.y  += p.vy * dt;
        p.txt.x  = p.bg.x;
        p.txt.y  = p.bg.y;

        const pHW = p.bg.displayWidth  / 2 + 4;
        const pHH = p.bg.displayHeight / 2 + 4;
        const dx  = Math.abs(navX - p.bg.x);
        const dy  = Math.abs(navY - p.bg.y);

        if (dx < nHW + pHW && dy < nHH + pHH) {
          p.recolectada = true;
          this._procesarColision(p);
          p.bg.destroy(); p.txt.destroy();
          return false;
        }

        if (p.bg.y > this.H + 80 || p.bg.x < -160 ||
            p.bg.x > this.W + 160 || p.bg.y < -80) {
          p.bg.destroy(); p.txt.destroy();
          return false;
        }
        return true;
      });

      this._actualizarPowerUps(navX, navY, dt);

      this.estrellas1.forEach(s => { s.y += 1.2 * dt * 60; if (s.y > this.H + 4) s.y = -4; });
      this.estrellas2.forEach(s => { s.y += 2.8 * dt * 60; if (s.y > this.H + 4) s.y = -4; });

      const restante = Math.max(0, this.duracionMs - (time - this.tiempoInicio));
      this._actualizarTimer(restante);
      if (restante <= 0) this._terminar();
    }

    _spawnPalabra() {
      if (this.terminado || this.pausado) return;

      const palCfg      = cfg.palabras ?? {};
      const correctas   = palCfg.correctas   ?? [];
      const incorrectas = palCfg.incorrectas ?? [];
      if (!correctas.length && !incorrectas.length) return;

      const esCorrecta = rand(0, 9) < 6 || !incorrectas.length;
      const pool       = esCorrecta ? correctas : incorrectas;
      const dato       = pool[rand(0, pool.length - 1)];
      if (!dato) return;

      const sf     = this._speedFactor ?? 1;
      const velMin = Math.round((palCfg.velocidadMin ?? 75)  * sf);
      const velMax = Math.round((palCfg.velocidadMax ?? 145) * sf);

      const lado = rand(0, 2);
      let x, y, vx, vy;
      if (lado === 0)      { x = rand(55, this.W - 55); y = -40;          vx = randF(-55, 55);        vy = rand(velMin, velMax); }
      else if (lado === 1) { x = -110;                   y = rand(80, this.H - 80); vx = rand(velMin, velMax);  vy = randF(-45, 45); }
      else                 { x = this.W + 110;           y = rand(80, this.H - 80); vx = -rand(velMin, velMax); vy = randF(-45, 45); }

      const colorFondo = esCorrecta ? 0x14532d : 0x7f1d1d;
      const colorBorde = esCorrecta ? 0x4ade80  : 0xf87171;

      const txt = this.add.text(x, y, dato.texto, {
        fontSize: '18px', fontFamily: '"Arial Black", Impact, sans-serif', color: '#ffffff',
      }).setOrigin(0.5).setDepth(3);

      const padX = 14, padY = 9;
      const bg = this.add.rectangle(x, y, txt.width + padX * 2, txt.height + padY * 2, colorFondo)
        .setOrigin(0.5).setDepth(2).setStrokeStyle(2, colorBorde);

      this.palabras.push({ bg, txt, vx, vy, isCorrecta: esCorrecta, recolectada: false });
    }

    _crearFondoEstelar() {
      const tema = _getTema();
      const [aMin, aMax] = tema.particulaAlpha;
      this.estrellas1 = [];
      this.estrellas2 = [];
      for (let i = 0; i < 90; i++) {
        this.estrellas1.push(this.add.circle(rand(0, this.W), rand(0, this.H), randF(0.4, 1.4), tema.particula, randF(aMin, aMax)));
      }
      for (let i = 0; i < 35; i++) {
        this.estrellas2.push(this.add.circle(rand(0, this.W), rand(0, this.H), randF(1.5, 2.8), tema.particula, randF(aMin + 0.2, Math.min(aMax + 0.15, 1))));
      }
    }

    _generarTexturaRocket() {
      if (this.textures.exists('rocket')) return;
      const g  = this.make.graphics({ x: 0, y: 0, add: false });
      const cx = 26;
      g.fillStyle(0xff4500, 1); g.fillTriangle(cx - 9, 54, cx + 9, 54, cx, 72);
      g.fillStyle(0xfbbf24, 1); g.fillTriangle(cx - 5, 54, cx + 5, 54, cx, 65);
      g.fillStyle(0x6d28d9, 1);
      g.fillTriangle(cx - 13, 32, cx - 26, 54, cx - 13, 54);
      g.fillTriangle(cx + 13, 32, cx + 26, 54, cx + 13, 54);
      g.fillStyle(0x9333ea, 1); g.fillRoundedRect(cx - 13, 14, 26, 42, 5);
      g.fillStyle(0xc084fc, 1); g.fillTriangle(cx - 13, 18, cx + 13, 18, cx, 0);
      g.fillStyle(0x7dd3fc, 0.95); g.fillCircle(cx, 30, 8);
      g.fillStyle(0xe0f2fe, 0.5);  g.fillCircle(cx - 2, 28, 4);
      g.generateTexture('rocket', 52, 72);
      g.destroy();
    }
  }
  Object.assign(ScenaJuego.prototype, arcadeShared);

  // ════════════════════════════════════════════════════════════════════════════
  // ESCENA: Plataformero
  // ════════════════════════════════════════════════════════════════════════════
  class ScenaPlataformero extends Phaser.Scene {
    constructor() { super({ key: 'Plataformero' }); }

    preload() {
      const p = cfg?.personaje;
      if (p?.spritesheet && !this.textures.exists('jugador_plat')) {
        this.load.spritesheet('jugador_plat', p.spritesheet, {
          frameWidth:  p.frameWidth  || 48,
          frameHeight: p.frameHeight || 48,
        });
      }
      // Precargar imágenes de objetos Layer 2
      (cfg?.objetos ?? []).forEach((def, i) => {
        if (def.imagen) {
          const key = `obj_l2_${i}`;
          if (!this.textures.exists(key)) this.load.image(key, def.imagen);
        }
      });
    }

    init() { this._initEstado(); }

    create() {
      const { width: W, height: H } = this.scale;
      this.W = W; this.H = H;
      const tema = _getTema();

      this.add.rectangle(0, 0, W, H, tema.fondoTop).setOrigin(0);
      this.add.rectangle(0, H * 0.45, W, H * 0.55, tema.fondoBot, 0.6).setOrigin(0);
      this._crearFondoNoche();

      // Gravedad solo en el cuerpo del jugador (mundo sin gravedad global)
      this.physics.world.gravity.y = 0;
      this.physics.world.setBounds(0, 0, W, H);

      this._generarPlataformas();
      this._crearObjetosLayer2();
      this._generarTexturaJugador();

      // Spawnear jugador sobre el suelo (primera plataforma)
      const platDefs = cfg.plataformas ?? platDefaults();
      const suelo    = platDefs[0];
      this.jugador   = this.physics.add.sprite(W / 2, suelo.y * H - 50, 'jugador_plat');
      this.jugador.setCollideWorldBounds(true);
      this.jugador.body.setGravityY(isLandscape ? 360 : 480);
      this.jugador.body.setSize(28, 36).setOffset(6, 4);
      this._setupAnimaciones(this.jugador);

      this.physics.add.collider(this.jugador, this.grupoPlataformas);
      if (this.grupoMovil) this.physics.add.collider(this.jugador, this.grupoMovil);

      this._crearHUD();
      this._crearPausaOverlay();

      this.cursores = this.input.keyboard.createCursorKeys();
      this.wasd     = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' });
      this.teclaP   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      this._btnIzq     = false;
      this._btnDer     = false;
      this._btnSaltoJP = false;
      this._crearBotonesTactiles();

      const spawnRate = cfg.palabras?.spawnRate ?? 3000;
      this.spawnTimer = this.time.addEvent({
        delay: spawnRate, callback: this._spawnPalabra, callbackScope: this, loop: true,
      });
      this.time.delayedCall(1200, this._spawnPalabra, [], this);

      this._initPowerUps();
      this.time.delayedCall(300, () => sintetizar(cfg.instruccion || ''));
      this.tiempoInicio = this.time.now;
      _iniciarMusica(cfg.musica);
    }

    update(time, delta) {
      if (this.terminado) return;

      if (Phaser.Input.Keyboard.JustDown(this.teclaP) ||
          Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
        this._togglePausa();
      }
      if (this.pausado) return;

      const elapsed = clamp((time - this.tiempoInicio) / this.duracionMs, 0, 1);
      this._speedFactor = 1 + elapsed * 0.5;

      const dt   = delta / 1000;
      const velH = (cfg.personaje?.velocidad ?? 200) * this._velBoost;

      let vx = 0;
      if (this.cursores.left.isDown  || this.wasd.left.isDown  || this._btnIzq) vx = -velH;
      if (this.cursores.right.isDown || this.wasd.right.isDown || this._btnDer) vx =  velH;
      this.jugador.setVelocityX(vx);

      const enSuelo = this.jugador.body.blocked.down;
      if (enSuelo && (
        Phaser.Input.Keyboard.JustDown(this.cursores.up) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
        this._btnSaltoJP
      )) {
        this.jugador.setVelocityY(isLandscape ? -310 : -420);
      }
      this._btnSaltoJP = false;

      if (!cfg.personaje?.spritesheet) {
        if (vx < 0) this.jugador.setFlipX(true);
        else if (vx > 0) this.jugador.setFlipX(false);
      }
      this._playAnimacion(this.jugador, vx, 0, enSuelo);

      const jx  = this.jugador.x, jy = this.jugador.y;
      const jHW = 16, jHH = 20;

      this.palabras = this.palabras.filter(p => {
        if (p.recolectada || !p.bg.active) return false;
        const pHW = p.bg.displayWidth  / 2 + 4;
        const pHH = p.bg.displayHeight / 2 + 4;
        const dx  = Math.abs(jx - p.bg.x);
        const dy  = Math.abs(jy - p.bg.y);
        if (dx < jHW + pHW && dy < jHH + pHH) {
          p.recolectada = true;
          this._procesarColision(p);
          p.bg.destroy(); p.txt.destroy();
          return false;
        }
        return true;
      });

      this._actualizarPowerUps(jx, jy, dt);

      // ── Plataformas móviles ────────────────────────────────────────────────
      const t = time / 1000;
      this._movPlats?.forEach(mp => {
        const m    = mp.def.movimiento;
        const vel  = m.velocidad ?? 1;
        const rng  = m.rango ?? 0.2;
        const dist = rng * (m.eje === 'x' ? this.W : this.H);
        const off  = Math.sin(t * vel) * dist;
        const nx   = m.eje === 'x' ? mp.baseX + off : mp.baseX;
        const ny   = m.eje === 'y' ? mp.baseY + off : mp.baseY;
        mp.sprite.setPosition(nx, ny);
        mp.sprite.body.reset(nx, ny);
        mp.vis.setPosition(nx, ny);
        mp.edge.setPosition(nx, ny - 5);
        mp.arrow.setPosition(nx, ny - 12);
      });

      // ── Layer 2: objetos fijos ────────────────────────────────────────────
      this._objetosL2?.forEach(obj => {
        if (obj.recogido) return;
        const dx = Math.abs(jx - obj.bg.x);
        const dy = Math.abs(jy - obj.bg.y);
        if (dx < 28 && dy < 28) {
          obj.recogido = true;
          const esPos = obj.def.tipo !== 'negativo';
          if (esPos) {
            const bonus = (obj.def.valor ?? 5) * (cfg.puntajePorAcierto ?? 10);
            this.puntaje += bonus;
            this.aciertos++;
            this._feedbackPositivo(obj.bg.x, obj.bg.y, bonus, 1);
          } else {
            this.errores++;
            this._feedbackNegativo(obj.bg.x, obj.bg.y);
            this._perderVida();
          }
          this._actualizarPuntaje();
          this.tweens.killTweensOf([obj.bg, obj.borde, obj.visual]);
          this.tweens.add({
            targets: [obj.bg, obj.borde, obj.visual], scale: 1.8, alpha: 0, duration: 240,
            onComplete: () => { try { obj.bg.destroy(); obj.borde.destroy(); obj.visual.destroy(); } catch {} },
          });
        }
      });

      const restante = Math.max(0, this.duracionMs - (time - this.tiempoInicio));
      this._actualizarTimer(restante);
      if (restante <= 0) this._terminar();
    }

    // ── Plataformas ───────────────────────────────────────────────────────────
    _generarPlataformas() {
      const { W, H } = this;
      const tema = _getTema();
      const ph = 14;

      if (!this.textures.exists('plat-px')) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4);
        g.generateTexture('plat-px', 4, 4); g.destroy();
      }

      this.grupoPlataformas = this.physics.add.staticGroup();
      this.grupoMovil       = this.physics.add.group();
      this._movPlats        = [];

      const platDefs = cfg.plataformas ?? platDefaults();

      platDefs.forEach((def, idx) => {
        const px  = def.x * W;
        const py  = def.y * H;
        const pw  = def.w * W;
        // Suelo (índice 0) con color diferenciado; el resto usa paleta del tema
        const col = idx === 0 ? tema.suelo : (tema.plats[idx % tema.plats.length]);

        if (def.movimiento) {
          // ── Plataforma móvil: cuerpo dinámico inmóvil sin gravedad ──
          const sp = this.grupoMovil.create(px, py, 'plat-px');
          sp.setDisplaySize(pw, ph);
          sp.setImmovable(true);
          sp.body.allowGravity = false;
          sp.setAlpha(0);

          const vis  = this.add.rectangle(px, py, pw, ph, col).setDepth(2);
          const edge = this.add.rectangle(px, py - ph / 2 + 2, pw - 6, 3, 0xffffff, 0.25).setDepth(3);
          // Indicador visual de movimiento
          const arrow = this.add.text(px, py - ph - 4,
            def.movimiento.eje === 'x' ? '↔' : '↕', {
              fontSize: '10px', fontFamily: 'Arial', color: '#818cf8',
            }).setOrigin(0.5, 1).setDepth(3);

          this._movPlats.push({ sprite: sp, vis, edge, arrow, baseX: px, baseY: py, def });
        } else {
          // ── Plataforma estática ──
          const plat = this.grupoPlataformas.create(px, py, 'plat-px');
          plat.setDisplaySize(pw, ph).refreshBody();
          plat.setAlpha(0);

          this.add.rectangle(px, py, pw, ph, col).setDepth(2);
          this.add.rectangle(px, py - ph / 2 + 2, pw - 6, 3, 0xffffff, 0.18).setDepth(3);
        }
      });
    }

    // ── Spawn de palabras en plataformas ──────────────────────────────────────
    _spawnPalabra() {
      if (this.terminado || this.pausado) return;

      const palCfg      = cfg.palabras ?? {};
      const correctas   = palCfg.correctas   ?? [];
      const incorrectas = palCfg.incorrectas ?? [];
      if (!correctas.length && !incorrectas.length) return;

      const esCorrecta = rand(0, 9) < 6 || !incorrectas.length;
      const pool       = esCorrecta ? correctas : incorrectas;
      const dato       = pool[rand(0, pool.length - 1)];
      if (!dato) return;

      // Elegir plataforma (cualquiera excepto el suelo si hay más de una)
      const platDefs = cfg.plataformas ?? platDefaults();
      const maxIdx   = platDefs.length > 1 ? platDefs.length - 2 : 0;
      const def      = platDefs[rand(0, maxIdx)];
      const halfW    = def.w * this.W * 0.35;
      const px       = clamp(def.x * this.W + randF(-halfW, halfW), 50, this.W - 50);
      const py       = def.y * this.H - 26;

      const colorFondo = esCorrecta ? 0x14532d : 0x7f1d1d;
      const colorBorde = esCorrecta ? 0x4ade80  : 0xf87171;

      const txt = this.add.text(px, py, dato.texto, {
        fontSize: '15px', fontFamily: '"Arial Black", Impact, sans-serif', color: '#ffffff',
      }).setOrigin(0.5).setDepth(5);

      const padX = 10, padY = 7;
      const bg   = this.add.rectangle(px, py, txt.width + padX * 2, txt.height + padY * 2, colorFondo)
        .setOrigin(0.5).setDepth(4).setStrokeStyle(2, colorBorde);

      // Animación de bobbing
      const baseY = py;
      this.tweens.add({ targets: [bg, txt], y: baseY - 8, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      // Auto-desaparecer en 9 s
      this.time.delayedCall(9000, () => {
        if (!bg.active) return;
        this.tweens.killTweensOf([bg, txt]);
        this.tweens.add({
          targets: [bg, txt], alpha: 0, duration: 350,
          onComplete: () => { try { bg.destroy(); txt.destroy(); } catch {} },
        });
        this.palabras = this.palabras.filter(p => p.bg !== bg);
      });

      this.palabras.push({ bg, txt, vx: 0, vy: 0, isCorrecta: esCorrecta, recolectada: false });
    }

    // ── Layer 2: objetos fijos (positivos / negativos) ────────────────────────
    _crearObjetosLayer2() {
      const { W, H } = this;
      this._objetosL2 = [];
      const objs = cfg.objetos ?? [];
      if (!objs.length) return;

      objs.forEach((def, i) => {
        const px    = def.x * W;
        const py    = def.y * H;
        const esPos = def.tipo !== 'negativo';
        const colF  = esPos ? 0x166534 : 0x7f1d1d;
        const colB  = esPos ? 0x4ade80  : 0xf87171;

        const bg    = this.add.circle(px, py, 20, colF, 0.88).setDepth(4);
        const borde = this.add.circle(px, py, 20).setStrokeStyle(2, colB).setDepth(4);

        // Imagen propia o emoji fallback
        const imgKey = `obj_l2_${i}`;
        let visual;
        if (def.imagen && this.textures.exists(imgKey)) {
          visual = this.add.image(px, py, imgKey).setDisplaySize(30, 30).setDepth(5);
        } else {
          visual = this.add.text(px, py, def.emoji || (esPos ? '⭐' : '💀'), {
            fontSize: '20px',
          }).setOrigin(0.5).setDepth(5);
        }

        // Bobbing
        this.tweens.add({
          targets: [bg, borde, visual], y: '+=8',
          duration: rand(750, 1050), yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut', delay: rand(0, 500),
        });
        // Glow para positivos
        if (esPos) {
          this.tweens.add({
            targets: borde, scaleX: 1.35, scaleY: 1.35, alpha: 0.45,
            duration: 700, yoyo: true, repeat: -1,
          });
        }

        this._objetosL2.push({ def, bg, borde, visual, recogido: false });
      });
    }

    // ── Fondo nocturno animado ────────────────────────────────────────────────
    _crearFondoNoche() {
      const { W, H } = this;
      const tema = _getTema();
      const [aMin, aMax] = tema.particulaAlpha;
      for (let i = 0; i < 80; i++) {
        const s = this.add.circle(rand(0, W), rand(0, H), randF(0.4, 2.0), tema.particula, randF(aMin, aMax)).setDepth(0);
        this.tweens.add({
          targets: s, alpha: randF(0.05, 0.3), duration: rand(800, 2400),
          yoyo: true, repeat: -1, delay: rand(0, 1200),
        });
      }
    }

    // ── Textura del jugador (procedural) ──────────────────────────────────────
    _generarTexturaJugador() {
      if (this.textures.exists('jugador_plat')) return;
      // add:true ensures WebGL flush before generateTexture (add:false can produce blank textures)
      const g = this.add.graphics();
      g.fillStyle(0x7c3aed, 1); g.fillRoundedRect(6, 14, 28, 26, 5);
      g.fillStyle(0xfde68a, 1); g.fillCircle(20, 12, 11);
      g.fillStyle(0x1e1b4b, 1); g.fillCircle(15, 11, 2.2); g.fillCircle(24, 11, 2.2);
      g.fillStyle(0x4c1d95, 1); g.fillRoundedRect(10, 2, 20, 7, 2);
      g.generateTexture('jugador_plat', 40, 42);
      g.destroy();
    }

    // ── Botones táctiles ──────────────────────────────────────────────────────
    _crearBotonesTactiles() {
      const { W, H } = this;
      const btnY = H - 36;
      // En landscape el juego es más ancho; separamos más los botones
      const izqX  = isLandscape ? 60  : 44;
      const derX  = isLandscape ? 120 : 106;
      const saltX = isLandscape ? W - 60 : W - 44;

      const makeBtn = (x, label, onDown, onUp) => {
        const bg = this.add.circle(x, btnY, 28, 0xffffff, 0.18)
          .setDepth(30).setInteractive({ useHandCursor: true });
        this.add.text(x, btnY, label, {
          fontSize: '22px', color: '#ffffff', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(31);
        bg.on('pointerdown', onDown);
        bg.on('pointerup',   onUp);
        bg.on('pointerout',  onUp);
      };

      makeBtn(izqX,  '←', () => { this._btnIzq     = true; },  () => { this._btnIzq = false; });
      makeBtn(derX,  '→', () => { this._btnDer     = true; },  () => { this._btnDer = false; });
      makeBtn(saltX, '↑', () => { this._btnSaltoJP = true; },  () => {});
    }
  }
  Object.assign(ScenaPlataformero.prototype, arcadeShared);

  // ════════════════════════════════════════════════════════════════════════════
  // ESCENA: Resultado
  // ════════════════════════════════════════════════════════════════════════════
  class ScenaResultado extends Phaser.Scene {
    constructor() { super({ key: 'Resultado' }); }
    init(data) { this.d = data || {}; }

    create() {
      const { width: W, height: H } = this.scale;
      const d = this.d;

      this.add.rectangle(0, 0, W, H, 0x030712).setOrigin(0);
      for (let i = 0; i < 55; i++) {
        this.add.circle(rand(0, W), rand(0, H), randF(0.4, 2), 0xffffff, randF(0.1, 0.7));
      }

      const trofeo = d.aprobado ? '🏆' : (d.porcentaje >= 40 ? '⭐' : '💪');
      const em     = this.add.text(W / 2, H * 0.10, trofeo, { fontSize: '68px' }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: em, alpha: 1, scaleX: { from: 0.3, to: 1 }, scaleY: { from: 0.3, to: 1 },
        duration: 480, ease: 'Back.easeOut' });

      this.add.text(W / 2, H * 0.24, d.aprobado ? '¡Excelente!' : '¡Buen intento!', {
        fontSize: '28px', fontFamily: '"Arial Black"',
        color: d.aprobado ? '#4ade80' : '#fbbf24',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(W / 2, H * 0.31, d.titulo || '', {
        fontSize: '13px', fontFamily: 'Arial', color: '#64748b',
      }).setOrigin(0.5);

      const panY = H * 0.38;
      this.add.rectangle(W / 2, panY + 95, W - 40, 208, 0x0f172a, 0.85).setOrigin(0.5);

      const filas = [
        ['🎯  Puntos',      d.puntaje    ?? 0],
        ['✅  Aciertos',    d.aciertos   ?? 0],
        ['❌  Errores',     d.errores    ?? 0],
        ['📊  Porcentaje',  `${d.porcentaje ?? 0}%`],
        ['🔥  Mejor racha', d.mejorRacha ?? 0],
      ];
      filas.forEach(([label, val], i) => {
        const y = panY + i * 38 + 6;
        this.add.text(34,     y, label,      { fontSize: '13px', fontFamily: 'Arial',         color: '#94a3b8' }).setOrigin(0, 0);
        this.add.text(W - 34, y, String(val), { fontSize: '15px', fontFamily: '"Arial Black"', color: '#f1f5f9' }).setOrigin(1, 0);
      });

      const barY  = panY + 200;
      const barW  = W - 80;
      const progW = Math.round(barW * clamp((d.porcentaje ?? 0) / 100, 0, 1));
      const barCol = d.aprobado ? 0x4ade80 : 0xfbbf24;
      this.add.rectangle(40, barY, barW, 10, 0x1e293b).setOrigin(0, 0.5);
      if (progW > 0) {
        const barra = this.add.rectangle(40, barY, 0, 10, barCol).setOrigin(0, 0.5);
        this.tweens.add({ targets: barra, width: progW, duration: 900, ease: 'Power2' });
      }

      // Rutar "Jugar de nuevo" a la mecánica correcta
      const escenaJuego = d.submecanica === 'plataformero' ? 'Plataformero' : 'Juego';
      const b1 = this.add.rectangle(W / 2, H * 0.84, 195, 50, 0x7c3aed).setInteractive({ useHandCursor: true });
      this.add.text(W / 2, H * 0.84, '🔄  Jugar de nuevo', {
        fontSize: '16px', fontFamily: '"Arial Black"', color: '#fff',
      }).setOrigin(0.5);
      b1.on('pointerover', () => b1.setFillStyle(0xa855f7));
      b1.on('pointerout',  () => b1.setFillStyle(0x7c3aed));
      b1.on('pointerdown', () => this.scene.start(escenaJuego));

      const b2 = this.add.rectangle(W / 2, H * 0.92, 130, 38, 0x1e293b).setInteractive({ useHandCursor: true });
      this.add.text(W / 2, H * 0.92, 'Salir', {
        fontSize: '14px', fontFamily: 'Arial', color: '#94a3b8',
      }).setOrigin(0.5);
      b2.on('pointerover', () => b2.setFillStyle(0x334155));
      b2.on('pointerout',  () => b2.setFillStyle(0x1e293b));
      b2.on('pointerdown', () => postMsg('JUEGO_CERRADO'));

      this.time.delayedCall(600, () =>
        sintetizar(d.aprobado ? '¡Excelente! ¡Lo lograste!' : '¡Buen intento! Seguí practicando.')
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ════════════════════════════════════════════════════════════════════════════
  return {
    init(dataPath = './data.json') {
      if (typeof Phaser === 'undefined') {
        console.error('[DidactiArcade] Phaser no está cargado. Incluí Phaser antes de engine-arcade.js');
        return null;
      }

      // Detectar orientación al momento de iniciar el juego
      isLandscape = window.innerWidth > window.innerHeight;
      const GW = isLandscape ? 640 : 400;
      const GH = isLandscape ? 400 : 640;

      // Al rotar el dispositivo, recargar para recalcular canvas y layout
      let _reloadPending = false;
      window.addEventListener('orientationchange', () => {
        if (_reloadPending) return;
        _reloadPending = true;
        setTimeout(() => window.location.reload(), 400);
      });

      const game = new Phaser.Game({
        type:            Phaser.AUTO,
        backgroundColor: '#030712',
        physics: {
          default: 'arcade',
          arcade:  { gravity: { y: 0 }, debug: false },
        },
        scene:  [ScenaCarga, ScenaIntro, ScenaJuego, ScenaPlataformero, ScenaResultado],
        parent: 'dg-arcade',
        scale: {
          mode:       Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width:  GW,
          height: GH,
          min: { width: isLandscape ? 400 : 270, height: isLandscape ? 250 : 432 },
          max: { width: isLandscape ? 960 : 520,  height: isLandscape ? 600 : 832 },
        },
        input: { activePointers: 2 },
      });

      game.registry.set('dataPath', dataPath);
      return game;
    },
  };

})();
