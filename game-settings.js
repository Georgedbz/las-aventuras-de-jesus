(() => {
  "use strict";

  const KEY = "aventurasJesus.settings.v1";
  const PROGRESS_KEY = "aventurasJesus.progress.v1";
  const defaults = Object.freeze({
    language: "es",
    masterVolume: 82,
    musicVolume: 68,
    sfxVolume: 82,
    muted: false,
    textSize: "normal",
    highContrast: false,
    reduceEffects: false,
    graphics: "high",
    touchMode: "auto",
    touchSize: "medium",
    touchOpacity: 68,
    vibration: true
  });

  const levelTitles = {
    es: ["", "Milagro en Caná", "Jesús calma la tempestad", "Panes y peces", "Jesús libera al endemoniado", "Sanidad del ciego", "La resurrección de Lázaro", "La torre de las tentaciones", "Getsemaní y el arresto", "Camino al Calvario", "Luz sobre el Abismo"],
    en: ["", "The miracle at Cana", "Jesus calms the storm", "Loaves and fish", "Jesus frees the possessed man", "Healing of the blind man", "The resurrection of Lazarus", "The tower of temptations", "Gethsemane and the arrest", "The road to Calvary", "Light over the Abyss"]
  };

  const controls = {
    es: {
      common: ["←/→: mover", "↓: agacharse", "Espacio o ↑: saltar", "Shift: correr", "E: abrir, activar o usar poder", "P o Escape: pausa", "Táctil: cruceta para mover; A saltar; B acción; C activa/desactiva correr"],
      6: ["Flechas: recorrer el laberinto", "↓: agacharse", "Espacio o ↑: saltar", "Shift: correr", "E: abrir o activar", "P o Escape: pausa", "Táctil: cruceta, A saltar, B acción y C correr"],
      7: ["←/→: mover", "↓: agacharse", "Espacio o ↑: saltar", "Shift: correr", "E: abrir puertas o responder", "P o Escape: pausa", "Táctil: cruceta, A saltar, B acción y C correr"],
      8: ["←/→: mover", "↓: agacharse", "Espacio o ↑: saltar", "Shift: correr", "E: orar, despertar o activar", "P o Escape: pausa", "Táctil: cruceta, A saltar, B acción y C correr"],
      9: ["Flechas: mover", "Espacio: saltar", "Shift: frenar la esfera", "Q/E: girar cámara", "Tocar o arrastrar según el tramo", "P o Escape: pausa"],
      10: ["←/→: mover", "↓: agacharse", "Espacio o ↑: saltar", "Shift: correr", "E: acción o luz", "↓ dos veces: bajar plataforma", "P o Escape: pausa", "Táctil: cruceta, A saltar, B acción y C correr"]
    },
    en: {
      common: ["←/→: move", "↓: crouch", "Space or ↑: jump", "Shift: run", "E: open, activate or use power", "P or Escape: pause", "Touch: D-pad to move; A jump; B action; C toggles running"],
      6: ["Arrows: explore the maze", "↓: crouch", "Space or ↑: jump", "Shift: run", "E: open or activate", "P or Escape: pause", "Touch: D-pad, A jump, B action and C run"],
      7: ["←/→: move", "↓: crouch", "Space or ↑: jump", "Shift: run", "E: open doors or answer", "P or Escape: pause", "Touch: D-pad, A jump, B action and C run"],
      8: ["←/→: move", "↓: crouch", "Space or ↑: jump", "Shift: run", "E: pray, wake or activate", "P or Escape: pause", "Touch: D-pad, A jump, B action and C run"],
      9: ["Arrows: move", "Space: jump", "Shift: brake the sphere", "Q/E: rotate camera", "Tap or drag depending on the section", "P or Escape: pause"],
      10: ["←/→: move", "↓: crouch", "Space or ↑: jump", "Shift: run", "E: action or light", "Double ↓: drop through", "P or Escape: pause", "Touch: D-pad, A jump, B action and C run"]
    }
  };

  let settings = load();
  const listeners = new Set();
  let resetArmed = false;
  let contextLevel = 1;
  let context = "menu";

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
      return { ...defaults, ...(parsed && typeof parsed === "object" ? parsed : {}) };
    } catch {
      return { ...defaults };
    }
  }

  function save(patch = {}) {
    settings = { ...settings, ...patch };
    localStorage.setItem(KEY, JSON.stringify(settings));
    applyDocument();
    listeners.forEach((listener) => {
      try { listener({ ...settings }); } catch { /* Un ajuste no debe detener el juego. */ }
    });
    window.dispatchEvent(new CustomEvent("aventuras-settings-change", { detail: { ...settings } }));
    return { ...settings };
  }

  function applyDocument() {
    const root = document.documentElement;
    root.lang = settings.language;
    root.dataset.textSize = settings.textSize;
    root.dataset.graphics = settings.graphics;
    root.dataset.touchMode = settings.touchMode;
    root.dataset.touchSize = settings.touchSize;
    root.classList.toggle("aventuras-high-contrast", settings.highContrast);
    root.classList.toggle("aventuras-reduce-effects", settings.reduceEffects);
    root.style.setProperty("--aventuras-touch-opacity", String(Math.max(30, Math.min(100, settings.touchOpacity))) + "%");
  }

  function text(es, en) {
    return settings.language === "en" ? en : es;
  }

  function getControls(level = contextLevel) {
    const language = settings.language === "en" ? "en" : "es";
    return controls[language][level] || controls[language].common;
  }

  function ensureDialog() {
    let overlay = document.querySelector("#aventuras-settings-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "aventuras-settings-overlay";
    overlay.className = "aventuras-settings-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section class="aventuras-settings-panel" role="dialog" aria-modal="true" aria-labelledby="aventuras-settings-title">
        <header class="aventuras-settings-header">
          <div><p class="aventuras-settings-kicker">⚙</p><h2 id="aventuras-settings-title">Configuración</h2></div>
          <button class="aventuras-settings-close" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="aventuras-settings-scroll">
          <section class="aventuras-setting-section">
            <h3 data-setting-title="controls">Controles</h3>
            <p id="aventuras-controls-level" class="aventuras-setting-note"></p>
            <ul id="aventuras-control-guide" class="aventuras-control-guide"></ul>
          </section>
          <section class="aventuras-setting-section aventuras-setting-grid">
            <label><span data-setting-label="language">Idioma del interfaz</span><select data-setting="language"><option value="es">Español</option><option value="en">English</option></select></label>
            <label><span data-setting-label="graphics">Calidad gráfica</span><select data-setting="graphics"><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></label>
          </section>
          <section class="aventuras-setting-section">
            <h3 data-setting-title="audio">Audio</h3>
            <label class="aventuras-range"><span data-setting-label="master">Volumen general</span><input data-setting="masterVolume" type="range" min="0" max="100" step="1"><output></output></label>
            <label class="aventuras-range"><span data-setting-label="music">Música</span><input data-setting="musicVolume" type="range" min="0" max="100" step="1"><output></output></label>
            <label class="aventuras-range"><span data-setting-label="effects">Efectos</span><input data-setting="sfxVolume" type="range" min="0" max="100" step="1"><output></output></label>
            <label class="aventuras-check"><input data-setting="muted" type="checkbox"><span data-setting-label="mute">Silenciar todo</span></label>
          </section>
          <section class="aventuras-setting-section aventuras-setting-grid">
            <label><span data-setting-label="touchMode">Mandos táctiles</span><select data-setting="touchMode"><option value="auto">Automático</option><option value="visible">Siempre visibles</option><option value="hidden">Ocultos</option></select></label>
            <label><span data-setting-label="touchSize">Tamaño del mando</span><select data-setting="touchSize"><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option></select></label>
            <label class="aventuras-range"><span data-setting-label="touchOpacity">Transparencia</span><input data-setting="touchOpacity" type="range" min="30" max="100" step="2"><output></output></label>
            <label class="aventuras-check"><input data-setting="vibration" type="checkbox"><span data-setting-label="vibration">Vibración táctil</span></label>
          </section>
          <section class="aventuras-setting-section aventuras-setting-grid">
            <label><span data-setting-label="textSize">Tamaño del texto</span><select data-setting="textSize"><option value="normal">Normal</option><option value="large">Grande</option><option value="xlarge">Muy grande</option></select></label>
            <label class="aventuras-check"><input data-setting="highContrast" type="checkbox"><span data-setting-label="contrast">Alto contraste</span></label>
            <label class="aventuras-check"><input data-setting="reduceEffects" type="checkbox"><span data-setting-label="reduce">Reducir animaciones</span></label>
          </section>
        </div>
        <footer class="aventuras-settings-footer">
          <button class="aventuras-reset-progress" type="button">Reiniciar todo el progreso</button>
        </footer>
      </section>`;
    document.body.append(overlay);

    overlay.querySelector(".aventuras-settings-close").addEventListener("click", close);
    overlay.querySelectorAll("[data-setting]").forEach((control) => {
      const eventName = control.type === "range" ? "input" : "change";
      control.addEventListener(eventName, () => {
        const key = control.dataset.setting;
        const value = control.type === "checkbox" ? control.checked : control.type === "range" ? Number(control.value) : control.value;
        save({ [key]: value });
        syncDialog();
      });
    });
    overlay.querySelector(".aventuras-reset-progress").addEventListener("click", resetProgress);
    return overlay;
  }

  function syncDialog() {
    const overlay = ensureDialog();
    overlay.querySelectorAll("[data-setting]").forEach((control) => {
      const value = settings[control.dataset.setting];
      if (control.type === "checkbox") control.checked = Boolean(value);
      else control.value = String(value);
      const output = control.parentElement?.querySelector("output");
      if (output) output.value = `${value}%`;
    });
    const language = settings.language;
    const strings = language === "en" ? {
      title: "Settings", controls: "Controls", audio: "Audio", language: "Interface language", graphics: "Graphics quality", master: "Master volume", music: "Music", effects: "Effects", mute: "Mute all", touchMode: "Touch controls", touchSize: "Control size", touchOpacity: "Opacity", vibration: "Touch vibration", textSize: "Text size", contrast: "High contrast", reduce: "Reduce motion", reset: "Reset all progress", level: `Level ${contextLevel}: ${levelTitles.en[contextLevel] || "Adventure"}`
    } : {
      title: "Configuración", controls: "Controles", audio: "Audio", language: "Idioma del interfaz", graphics: "Calidad gráfica", master: "Volumen general", music: "Música", effects: "Efectos", mute: "Silenciar todo", touchMode: "Mandos táctiles", touchSize: "Tamaño del mando", touchOpacity: "Transparencia", vibration: "Vibración táctil", textSize: "Tamaño del texto", contrast: "Alto contraste", reduce: "Reducir animaciones", reset: "Reiniciar todo el progreso", level: `Nivel ${contextLevel}: ${levelTitles.es[contextLevel] || "Aventura"}`
    };
    overlay.querySelector("#aventuras-settings-title").textContent = strings.title;
    overlay.querySelectorAll("[data-setting-title]").forEach((el) => { el.textContent = strings[el.dataset.settingTitle]; });
    overlay.querySelectorAll("[data-setting-label]").forEach((el) => { el.textContent = strings[el.dataset.settingLabel]; });
    overlay.querySelector("#aventuras-controls-level").textContent = context === "menu" ? text("Guía general de la aventura", "General adventure guide") : strings.level;
    overlay.querySelector("#aventuras-control-guide").innerHTML = getControls().map((item) => `<li>${item}</li>`).join("");
    overlay.querySelector(".aventuras-reset-progress").textContent = resetArmed ? text("Pulsa otra vez para confirmar", "Press again to confirm") : strings.reset;
    translateOptions(overlay);
  }

  function translateOptions(overlay) {
    const english = settings.language === "en";
    const labels = {
      graphics: english ? { high: "High", medium: "Medium", low: "Low" } : { high: "Alta", medium: "Media", low: "Baja" },
      touchMode: english ? { auto: "Auto", visible: "Always visible", hidden: "Hidden" } : { auto: "Automático", visible: "Siempre visibles", hidden: "Ocultos" },
      touchSize: english ? { small: "Small", medium: "Medium", large: "Large" } : { small: "Pequeño", medium: "Mediano", large: "Grande" },
      textSize: english ? { normal: "Normal", large: "Large", xlarge: "Extra large" } : { normal: "Normal", large: "Grande", xlarge: "Muy grande" }
    };
    Object.entries(labels).forEach(([key, values]) => {
      const select = overlay.querySelector(`[data-setting="${key}"]`);
      if (!select) return;
      [...select.options].forEach((option) => { option.textContent = values[option.value] || option.textContent; });
    });
  }

  function open(options = {}) {
    context = options.context || "game";
    contextLevel = Math.max(1, Math.min(10, Number(options.level) || 1));
    resetArmed = false;
    const overlay = ensureDialog();
    syncDialog();
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    overlay.querySelector(".aventuras-settings-close").focus();
    window.dispatchEvent(new CustomEvent("aventuras-settings-open"));
  }

  function close() {
    const overlay = ensureDialog();
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    resetArmed = false;
    window.dispatchEvent(new CustomEvent("aventuras-settings-close"));
  }

  function resetProgress() {
    if (!resetArmed) {
      resetArmed = true;
      syncDialog();
      window.setTimeout(() => { resetArmed = false; if (document.querySelector("#aventuras-settings-overlay.is-visible")) syncDialog(); }, 4500);
      return;
    }
    const preserved = JSON.stringify(settings);
    const remove = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith("aventurasJesus.") && key !== KEY) remove.push(key);
    }
    remove.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("senderosDeLuzTramo3V1");
    localStorage.setItem(KEY, preserved);
    localStorage.removeItem(PROGRESS_KEY);
    window.dispatchEvent(new CustomEvent("aventuras-progress-reset"));
  }

  applyDocument();
  window.AventurasSettings = {
    KEY,
    defaults,
    get: () => ({ ...settings }),
    save,
    open,
    close,
    applyDocument,
    text,
    getControls,
    titleForLevel(level) { return levelTitles[settings.language === "en" ? "en" : "es"][level] || `Nivel ${level}`; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
})();
