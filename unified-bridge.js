(() => {
  "use strict";

  const config = window.__UNIFIED_CONFIG__ || { id: "unknown", index: 0, total: 1 };
  const MAIN_KEY = "aventurasJesus.progress.v1";
  const INTERNAL_ORIGIN = window.location.origin;
  const settingsApi = window.AventurasSettings;
  const teachings = {
    1: { es: ["Jesús transforma lo cotidiano", "En las bodas de Caná se terminó el vino. María confió en Jesús y los servidores obedecieron; entonces Jesús transformó el agua en vino. La historia nos enseña a confiar en Él y hacer lo que nos pide.", "Juan 2:1-11"], en: ["Jesus transforms everyday life", "At the wedding in Cana the wine ran out. Mary trusted Jesus and the servants obeyed; then Jesus turned water into wine. The story teaches us to trust him and do what he asks.", "John 2:1-11"] },
    2: { es: ["Jesús calma nuestras tormentas", "Mientras Jesús y sus discípulos cruzaban el lago, una gran tormenta llenó la barca de miedo. Jesús reprendió al viento y al mar, y todo quedó en calma. Podemos confiar en Él aun cuando sentimos temor.", "Marcos 4:35-41"], en: ["Jesus calms our storms", "While Jesus and his disciples crossed the lake, a great storm filled the boat with fear. Jesus rebuked the wind and sea, and everything became calm. We can trust him even when we feel afraid.", "Mark 4:35-41"] },
    3: { es: ["Jesús multiplica lo que compartimos", "Un niño entregó cinco panes y dos peces. Jesús dio gracias y los multiplicó para alimentar a una gran multitud. Cuando compartimos con fe, Dios puede usar aun lo pequeño para bendecir a muchos.", "Juan 6:1-13"], en: ["Jesus multiplies what we share", "A boy offered five loaves and two fish. Jesus gave thanks and multiplied them to feed a great crowd. When we share in faith, God can use even something small to bless many.", "John 6:1-13"] },
    4: { es: ["Jesús libera y restaura", "En la región de los gerasenos, un hombre vivía atormentado y apartado entre los sepulcros. Jesús lo liberó y le devolvió la paz y la dignidad. Ninguna oscuridad es más fuerte que su autoridad y su amor.", "Marcos 5:1-20"], en: ["Jesus sets free and restores", "In the region of the Gerasenes, a tormented man lived apart among the tombs. Jesus set him free and restored his peace and dignity. No darkness is stronger than his authority and love.", "Mark 5:1-20"] },
    5: { es: ["Jesús abre nuestros ojos", "Jesús hizo lodo, lo puso en los ojos de un hombre ciego y le pidió lavarse en el estanque de Siloé. El hombre obedeció y volvió viendo. Esta historia nos enseña a caminar con fe incluso antes de ver el resultado.", "Juan 9:1-7"], en: ["Jesus opens our eyes", "Jesus made mud, put it on a blind man's eyes and told him to wash in the Pool of Siloam. The man obeyed and came back seeing. This story teaches us to walk by faith before we can see the result.", "John 9:1-7"] },
    6: { es: ["Jesús es la resurrección y la vida", "Lázaro llevaba cuatro días en el sepulcro cuando Jesús llamó su nombre. Lázaro salió con vida y la tristeza se convirtió en esperanza. Para Jesús, ni siquiera lo imposible tiene la última palabra.", "Juan 11:25-44"], en: ["Jesus is the resurrection and the life", "Lazarus had been in the tomb for four days when Jesus called his name. Lazarus came out alive and grief turned into hope. With Jesus, even the impossible does not have the final word.", "John 11:25-44"] },
    7: { es: ["La Palabra vence la tentación", "En el desierto, el tentador quiso apartar a Jesús de la voluntad del Padre. Jesús respondió con la Palabra de Dios y permaneció fiel. Conocer la verdad nos ayuda a reconocer el engaño y escoger el bien.", "Mateo 4:1-11"], en: ["The Word overcomes temptation", "In the wilderness, the tempter tried to turn Jesus away from the Father's will. Jesus answered with God's Word and remained faithful. Knowing the truth helps us recognize deception and choose what is good.", "Matthew 4:1-11"] },
    8: { es: ["Jesús eligió obedecer", "En Getsemaní, Jesús oró en medio de una profunda angustia. Aunque la prueba era difícil, decidió cumplir la voluntad del Padre. Su ejemplo nos enseña a orar, permanecer fieles y obedecer con valentía.", "Lucas 22:39-46"], en: ["Jesus chose obedience", "In Gethsemane, Jesus prayed in deep anguish. Although the trial was difficult, he chose to fulfill the Father's will. His example teaches us to pray, remain faithful and obey with courage.", "Luke 22:39-46"] },
    9: { es: ["El amor perseveró hasta el final", "Camino al Gólgota, Jesús soportó el cansancio, la burla y el dolor por amor. Su entrega muestra cuánto nos ama Dios y nos anima a perseverar, perdonar y ayudar a quien necesita apoyo.", "Filipenses 2:8 · Juan 3:16"], en: ["Love persevered to the end", "On the road to Golgotha, Jesus endured exhaustion, mockery and pain out of love. His sacrifice shows how much God loves us and encourages us to persevere, forgive and help those who need support.", "Philippians 2:8 · John 3:16"] },
    10: { es: ["La luz de Cristo vence", "La batalla del Abismo representa que la verdad, la fe, el amor y la esperanza vencen la oscuridad cuando permanecemos con Cristo. Jesús prometió volver; por eso seguimos firmes, haciendo el bien y compartiendo su luz.", "Juan 8:12 · Apocalipsis 22:12"], en: ["Christ's light wins", "The battle of the Abyss represents how truth, faith, love and hope overcome darkness when we remain with Christ. Jesus promised to return, so we stand firm, do good and share his light.", "John 8:12 · Revelation 22:12"] }
  };

  let paused = false;
  let teachingLevel = 0;
  let cRunActive = false;
  let temporaryTouchHidden = false;
  let soundtrackLevel = 0;
  let audioUnlocked = false;
  let audioUnlockInFlight = false;
  let bossVictorySequence = false;
  let level7BossMusicReduced = false;
  let level7BossFadeTimer = 0;
  let gameOverVisible = false;
  let lastKnownLevel = 0;
  const teachingShown = new Set();
  const pressedKeys = new Map();

  document.documentElement.classList.add("unified-platform");
  document.body.classList.add("unified-game-page");

  const topControls = document.createElement("div");
  topControls.className = "unified-top-controls";
  topControls.setAttribute("aria-label", "Controles generales");
  topControls.innerHTML = `
    <button class="unified-top-button" id="unified-audio-button" type="button" aria-label="Silenciar música" title="Activar o desactivar audio">🔊</button>
    <button class="unified-top-button" id="unified-pause-button" type="button" aria-label="Pausar" title="Pausar (P o Escape)">Ⅱ</button>
    <button class="unified-top-button" id="unified-menu-button" type="button" aria-label="Volver al menú" title="Volver al menú">⌂</button>`;

  const pauseOverlay = createOverlay("unified-pause-overlay", `
    <section class="unified-card unified-pause-card" role="dialog" aria-modal="true" aria-labelledby="unified-pause-title">
      <p class="unified-card-eyebrow" id="unified-pause-eyebrow">Partida en pausa</p>
      <h2 id="unified-pause-title">El camino te espera</h2>
      <p id="unified-pause-message">Tu avance está guardado.</p>
      <div class="unified-card-actions">
        <button class="unified-card-button primary" id="unified-resume-button" type="button">Continuar</button>
        <button class="unified-card-button" id="unified-touch-toggle" type="button">Mostrar u ocultar mando</button>
        <button class="unified-card-button" id="unified-settings-button" type="button">Configuración</button>
        <button class="unified-card-button" id="unified-fullscreen-button" type="button">Pantalla completa</button>
        <button class="unified-card-button warning" id="unified-restart-button" type="button">Reiniciar nivel</button>
        <button class="unified-card-button home" id="unified-pause-menu-button" type="button">Menú principal</button>
      </div>
    </section>`);

  const homeOverlay = createOverlay("unified-home-overlay", `
    <section class="unified-card unified-confirm-card" role="dialog" aria-modal="true" aria-labelledby="unified-home-title">
      <p class="unified-card-eyebrow">Guardado automático</p>
      <h2 id="unified-home-title">¿Volver al menú?</h2>
      <p id="unified-home-message">Tu avance está guardado. Podrás continuar después.</p>
      <div class="unified-card-actions two-columns">
        <button class="unified-card-button" id="unified-home-cancel" type="button">Seguir jugando</button>
        <button class="unified-card-button home" id="unified-home-confirm" type="button">Volver al menú</button>
      </div>
    </section>`);

  const teachingOverlay = createOverlay("unified-teaching-overlay", `
    <section class="unified-card" role="dialog" aria-modal="true" aria-labelledby="unified-teaching-title">
      <p class="unified-card-eyebrow" id="unified-teaching-eyebrow">Enseñanza del nivel</p>
      <h2 id="unified-teaching-title"></h2>
      <p class="unified-teaching-text" id="unified-teaching-text"></p>
      <p class="unified-verse" id="unified-teaching-verse"></p>
      <button class="unified-card-button primary" id="unified-next-button" type="button">Siguiente nivel</button>
    </section>`);

  const gameOverOverlay = createOverlay("unified-game-over-overlay", `
    <section class="unified-card unified-game-over-card" role="dialog" aria-modal="true" aria-labelledby="unified-game-over-title">
      <p class="unified-card-eyebrow">La misión puede continuar</p>
      <h2 id="unified-game-over-title">GAME OVER</h2>
      <p>Vuelve a intentarlo desde el inicio de esta misión.</p>
      <div class="unified-card-actions two-columns">
        <button class="unified-card-button primary" id="unified-game-over-restart" type="button">Reiniciar misión</button>
        <button class="unified-card-button home" id="unified-game-over-menu" type="button">Volver al menú</button>
      </div>
    </section>`);

  const touchControls = document.createElement("div");
  touchControls.className = "unified-touch-controls";
  touchControls.setAttribute("aria-label", "Mando táctil");
  touchControls.innerHTML = `
    <div class="unified-dpad" aria-label="Cruceta de movimiento">
      <button class="unified-pad-button up" data-game-key="ArrowUp" type="button" aria-label="Arriba">▲</button>
      <button class="unified-pad-button left" data-game-key="ArrowLeft" type="button" aria-label="Izquierda">◀</button>
      <button class="unified-pad-center" type="button" tabindex="-1" aria-hidden="true"></button>
      <button class="unified-pad-button right" data-game-key="ArrowRight" type="button" aria-label="Derecha">▶</button>
      <button class="unified-pad-button down" data-game-key="ArrowDown" type="button" aria-label="Abajo">▼</button>
    </div>
    <div class="unified-action-pad" aria-label="Botones de acción">
      <button class="unified-action-button action-a" data-game-action="jump" type="button" aria-label="A: saltar"><b>A</b><small>Saltar</small></button>
      <button class="unified-action-button action-b" data-game-action="action" type="button" aria-label="B: acción"><b>B</b><small>Acción</small></button>
      <button class="unified-action-button action-c" data-game-action="run" type="button" aria-label="C: activar carrera" aria-pressed="false"><b>C</b><small>Correr</small></button>
    </div>`;

  const actionHint = document.createElement("div");
  actionHint.className = "unified-action-hint";
  actionHint.textContent = "B · Acción";

  const soundtrack = document.createElement("audio");
  soundtrack.id = "unified-level-soundtrack";
  soundtrack.loop = true;
  soundtrack.preload = "metadata";
  soundtrack.setAttribute("aria-hidden", "true");

  const explosionSound = document.createElement("audio");
  explosionSound.id = "unified-explosion-sound";
  explosionSound.preload = "auto";
  explosionSound.src = "assets/audio/efectos/audio-explosion.mp3";
  explosionSound.setAttribute("aria-hidden", "true");

  const stage = document.querySelector(".bible-platform-game") || document.body;
  if (stage !== document.body) stage.classList.add("unified-stage-host");
  stage.append(topControls, touchControls, actionHint);
  document.body.append(pauseOverlay, homeOverlay, teachingOverlay, gameOverOverlay, soundtrack, explosionSound);

  const audioButton = document.querySelector("#unified-audio-button");
  const pauseButton = document.querySelector("#unified-pause-button");
  const menuButton = document.querySelector("#unified-menu-button");
  const resumeButton = document.querySelector("#unified-resume-button");
  const nextButton = document.querySelector("#unified-next-button");

  audioButton.addEventListener("click", toggleQuickAudio);
  pauseButton.addEventListener("click", () => setPaused(!paused, true));
  menuButton.addEventListener("click", showHomeConfirmation);
  resumeButton.addEventListener("click", () => setPaused(false, true));
  document.querySelector("#unified-pause-menu-button").addEventListener("click", showHomeConfirmation);
  document.querySelector("#unified-home-cancel").addEventListener("click", cancelHomeConfirmation);
  document.querySelector("#unified-home-confirm").addEventListener("click", returnToMenu);
  document.querySelector("#unified-settings-button").addEventListener("click", () => settingsApi?.open({ context: "game", level: currentLevel() }));
  document.querySelector("#unified-touch-toggle").addEventListener("click", toggleTemporaryTouch);
  document.querySelector("#unified-fullscreen-button").addEventListener("click", toggleFullscreen);
  document.querySelector("#unified-restart-button").addEventListener("click", restartCurrentGame);
  nextButton.addEventListener("click", advanceAfterTeaching);
  document.querySelector("#unified-game-over-restart").addEventListener("click", restartAfterGameOver);
  document.querySelector("#unified-game-over-menu").addEventListener("click", returnToMenu);

  bindTouchControls();
  updateInterfaceLanguage();
  updateTouchVisibility();
  updateSoundtrack(true);

  document.addEventListener("pointerdown", requestAudioUnlock, { capture: true, passive: true });
  document.addEventListener("keydown", requestAudioUnlock, { capture: true });
  window.setTimeout(requestAudioUnlock, 1500);
  observeLegacyRespawns();
  observeEmbeddedGames();
  window.addEventListener("resize", updateTouchVisibility);
  window.matchMedia?.("(pointer: coarse)")?.addEventListener?.("change", updateTouchVisibility);

  if (settingsApi) {
    settingsApi.subscribe((nextSettings) => {
      updateInterfaceLanguage();
      updateTouchVisibility();
      applySoundtrackVolume();
      updateAudioButton();
      broadcastSettings(nextSettings);
    });
  }

  window.addEventListener("aventuras-settings-open", () => setPaused(true, false));
  window.addEventListener("aventuras-settings-close", () => {
    requestAudioUnlock();
    if (paused && !homeOverlay.classList.contains("is-visible") && !teachingOverlay.classList.contains("is-visible")) {
      pauseOverlay.classList.add("is-visible");
    }
  });
  window.addEventListener("aventuras-progress-reset", () => {
    saveProgress(1, "Nivel 1 · Milagro en Caná");
    window.location.href = "index.html";
  });

  window.addEventListener("keydown", handleGlobalKeyDown, true);
  window.addEventListener("keyup", handleGlobalKeyUp, true);

  window.addEventListener("message", (event) => {
    if (event.origin !== INTERNAL_ORIGIN || !isMessageObject(event.data)) return;
    const data = event.data;

    if (data.type === "unified-level7-boss-start") {
      if (event.source !== window || !hasOnlyMessageKeys(data, ["type"])) return;
      lowerLevel7BossMusic();
      return;
    }
    if (data.type === "unified-level7-boss-defeated") {
      if (event.source !== window || !hasOnlyMessageKeys(data, ["type"])) return;
      runLevel7VictorySequence();
      return;
    }
    if (data.type === "nivel9-completado") {
      if (!isFrameMessageSource(event, "iframe.level9-frame") ||
          !hasOnlyMessageKeys(data, ["type", "resistance"]) ||
          typeof data.resistance !== "number" || !Number.isFinite(data.resistance) ||
          data.resistance < 0 || data.resistance > 100) return;
      showTeaching(9);
      return;
    }
    if (data.type === "nivel10-completado") {
      if (!isFrameMessageSource(event, 'iframe[src^="nivel10/index.html"]') ||
          !hasOnlyMessageKeys(data, ["type"])) return;
      showTeaching(10);
      return;
    }
    if (data.type === "unified-progress") {
      if (event.source !== window ||
          !hasOnlyMessageKeys(data, ["type", "level", "label"]) ||
          !Number.isInteger(data.level) || data.level < 1 || data.level > 10 ||
          (data.label !== undefined && (typeof data.label !== "string" || data.label.length > 160))) return;
      saveProgress(data.level, data.label || "Progreso guardado");
      return;
    }
    if (data.type === "unified-action-available") {
      if (event.source !== window ||
          !hasOnlyMessageKeys(data, ["type", "available", "label"]) ||
          typeof data.available !== "boolean" ||
          (data.label !== undefined && (typeof data.label !== "string" || data.label.length > 120))) return;
      setActionHint(data.available, data.label);
      return;
    }
    if (data.type === "unified-respawn" || data.type === "unified-cutscene") {
      if (event.source !== window || !hasOnlyMessageKeys(data, ["type"])) return;
      resetRunToggle();
    }
  });

  function isMessageObject(data) {
    return data !== null && typeof data === "object" && !Array.isArray(data);
  }

  function hasOnlyMessageKeys(data, allowedKeys) {
    return Object.keys(data).every((key) => allowedKeys.includes(key));
  }

  function isFrameMessageSource(event, selector) {
    const frame = document.querySelector(selector);
    return Boolean(frame?.contentWindow && event.source === frame.contentWindow);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !teachingLevel) setPaused(true, true);
    syncSoundtrackPlayback();
  });
  window.addEventListener("beforeunload", saveCurrentProgress);
  window.setTimeout(() => broadcastSettings(settingsApi?.get?.() || {}), 0);

  function createOverlay(id, html) {
    const overlay = document.createElement("div");
    overlay.className = "unified-overlay";
    overlay.id = id;
    overlay.innerHTML = html;
    return overlay;
  }

  function handleGlobalKeyDown(event) {
    const pauseKey = event.key === "Escape" || event.key.toLowerCase() === "p";
    if (pauseKey && !teachingLevel && !settingsVisible()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setPaused(!paused, true);
      return;
    }
    if (event.key === "ArrowDown" && !event.repeat) resetRunToggle();
    if (paused || teachingLevel || settingsVisible()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function handleGlobalKeyUp(event) {
    if (paused || teachingLevel || settingsVisible()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function settingsVisible() {
    return document.querySelector("#aventuras-settings-overlay")?.classList.contains("is-visible");
  }

  function bindTouchControls() {
    touchControls.querySelectorAll("[data-game-key]").forEach((button) => {
      const key = button.dataset.gameKey;
      bindMomentary(button, () => {
        if (key === "ArrowDown") resetRunToggle();
        pressKey(key);
      }, () => releaseKey(key));
    });
    const jump = touchControls.querySelector('[data-game-action="jump"]');
    bindMomentary(jump, () => pressKey(" ", "Space"), () => releaseKey(" ", "Space"));
    const action = touchControls.querySelector('[data-game-action="action"]');
    bindMomentary(action, () => pressContextAction(), () => releaseContextAction());
    touchControls.querySelector('[data-game-action="run"]').addEventListener("pointerdown", (event) => {
      event.preventDefault();
      vibrate(18);
      cRunActive = !cRunActive;
      setUnifiedRunFlag(cRunActive);
      if (cRunActive) pressKey("ShiftLeft", "ShiftLeft", "Shift");
      else releaseKey("ShiftLeft", "ShiftLeft", "Shift");
      updateRunButton();
    });
  }

  function bindMomentary(button, start, end) {
    const finish = (event) => {
      event?.preventDefault();
      button.classList.remove("is-pressed");
      end();
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("is-pressed");
      vibrate(12);
      start();
    });
    button.addEventListener("pointerup", finish);
    button.addEventListener("pointercancel", finish);
    button.addEventListener("lostpointercapture", finish);
  }

  function pressContextAction() {
    const level = currentLevel();
    if (level <= 8) pressKey("f", "KeyF");
    pressKey("e", "KeyE");
  }

  function releaseContextAction() {
    const level = currentLevel();
    if (level <= 8) releaseKey("f", "KeyF");
    releaseKey("e", "KeyE");
  }

  function pressKey(id, code = "", keyOverride = "") {
    if (pressedKeys.has(id) || paused || teachingLevel) return;
    const key = keyOverride || (id === "ShiftLeft" ? "Shift" : id);
    pressedKeys.set(id, { key, code });
    dispatchToGame("keydown", key, code);
  }

  function releaseKey(id, code = "", keyOverride = "") {
    const stored = pressedKeys.get(id);
    const key = stored?.key || keyOverride || (id === "ShiftLeft" ? "Shift" : id);
    dispatchToGame("keyup", key, stored?.code || code);
    pressedKeys.delete(id);
  }

  function dispatchToGame(type, key, code = "") {
    dispatchRecursive(window, type, key, code, new Set());
  }

  function dispatchRecursive(target, type, key, code, seen) {
    if (!target || seen.has(target)) return;
    seen.add(target);
    try {
      const options = { key, code, bubbles: true, cancelable: true };
      target.dispatchEvent(new KeyboardEvent(type, options));
      target.document?.activeElement?.dispatchEvent?.(new KeyboardEvent(type, options));
      for (const frame of target.document?.querySelectorAll?.("iframe") || []) {
        if (frame.contentWindow) dispatchRecursive(frame.contentWindow, type, key, code, seen);
      }
    } catch { /* Un marco bloqueado no impide los demás controles. */ }
  }

  function releaseAllKeys() {
    [...pressedKeys.entries()].forEach(([id, item]) => releaseKey(id, item.code, item.key));
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Shift", "e", "f"]) {
      dispatchToGame("keyup", key, key === " " ? "Space" : "");
    }
  }

  function resetRunToggle() {
    if (cRunActive) releaseKey("ShiftLeft", "ShiftLeft", "Shift");
    cRunActive = false;
    setUnifiedRunFlag(false);
    updateRunButton();
  }

  function setUnifiedRunFlag(value) {
    forEachSameOriginWindow(window, (target) => { target.__unifiedRun = Boolean(value); });
  }

  function updateRunButton() {
    const button = touchControls.querySelector('[data-game-action="run"]');
    button.classList.toggle("is-active", cRunActive);
    button.setAttribute("aria-pressed", String(cRunActive));
    button.setAttribute("aria-label", cRunActive ? tr("C: desactivar carrera", "C: turn run off") : tr("C: activar carrera", "C: turn run on"));
  }

  function vibrate(duration) {
    if (settingsApi?.get().vibration && navigator.vibrate) navigator.vibrate(duration);
  }

  function updateTouchVisibility() {
    const preferences = settingsApi?.get() || { touchMode: "auto" };
    const autoVisible = window.matchMedia?.("(pointer: coarse)")?.matches || window.innerWidth <= 960;
    const shouldShow = !temporaryTouchHidden && preferences.touchMode !== "hidden" && (preferences.touchMode === "visible" || autoVisible);
    const puzzle = currentLevel() === 7;
    document.documentElement.classList.toggle("unified-touch-active", shouldShow && !puzzle);
    touchControls.classList.toggle("is-visible", shouldShow && !puzzle);
    document.querySelector("#unified-touch-toggle").textContent = shouldShow ? tr("Ocultar mando", "Hide controls") : tr("Mostrar mando", "Show controls");
  }

  function toggleTemporaryTouch() {
    temporaryTouchHidden = !temporaryTouchHidden;
    updateTouchVisibility();
  }

  function setActionHint(available, label = "") {
    actionHint.textContent = label || tr("B · Acción", "B · Action");
    actionHint.classList.toggle("is-visible", Boolean(available));
    touchControls.querySelector('[data-game-action="action"]').classList.toggle("has-action", Boolean(available));
  }

  function showHomeConfirmation() {
    saveCurrentProgress();
    setPaused(true, false);
    pauseOverlay.classList.remove("is-visible");
    homeOverlay.classList.add("is-visible");
    document.querySelector("#unified-home-cancel").focus();
  }

  function cancelHomeConfirmation() {
    homeOverlay.classList.remove("is-visible");
    pauseOverlay.classList.add("is-visible");
  }

  function returnToMenu() {
    saveCurrentProgress();
    soundtrack.pause();
    window.location.href = "index.html";
  }

  function toggleQuickAudio() {
    if (!settingsApi) return;
    const preferences = settingsApi.get();
    settingsApi.save({ muted: !preferences.muted });
    updateAudioButton();
    if (!settingsApi.get().muted) requestAudioUnlock();
  }

  function updateAudioButton() {
    const muted = Boolean(settingsApi?.get().muted);
    audioButton.textContent = muted ? "🔇" : "🔊";
    audioButton.setAttribute("aria-label", muted ? tr("Activar audio", "Turn audio on") : tr("Silenciar audio", "Mute audio"));
    audioButton.setAttribute("title", muted ? tr("Activar audio", "Turn audio on") : tr("Silenciar audio", "Mute audio"));
    audioButton.classList.toggle("is-muted", muted);
  }

  function setPaused(value, showOverlay) {
    const next = Boolean(value);
    if (next) {
      releaseAllKeys();
      resetRunToggle();
    }
    paused = next;
    window.__unifiedPaused = next;
    pauseButton.textContent = next ? "▶" : "Ⅱ";
    pauseButton.setAttribute("aria-label", next ? tr("Continuar", "Resume") : tr("Pausar", "Pause"));
    if (showOverlay) pauseOverlay.classList.toggle("is-visible", next);
    else pauseOverlay.classList.remove("is-visible");
    if (!next) homeOverlay.classList.remove("is-visible");
    cascadePause(window, next);
    syncSoundtrackPlayback();
    if (!next) window.focus();
  }

  function broadcastSettings(nextSettings) {
    const payload = { type: "aventuras-settings", settings: nextSettings || {} };
    cascadeMessage(window, payload);
  }

  function cascadeMessage(target, payload) {
    try {
      target.postMessage(payload, INTERNAL_ORIGIN);
      for (const frame of target.document.querySelectorAll("iframe")) {
        if (frame.contentWindow) cascadeMessage(frame.contentWindow, payload);
      }
    } catch { /* Un marco externo no debe detener la configuracion comun. */ }
  }

  function cascadePause(target, value) {
    try {
      target.__unifiedPaused = value;
      target.postMessage({ type: "unified-game-pause", paused: value }, INTERNAL_ORIGIN);
      if (target.Module && typeof target.Module.pauseMainLoop === "function") {
        if (value) target.Module.pauseMainLoop();
        else target.Module.resumeMainLoop();
      }
      for (const frame of target.document.querySelectorAll("iframe")) {
        if (frame.contentWindow) cascadePause(frame.contentWindow, value);
      }
    } catch { /* Los marcos externos no interrumpen el control común. */ }
  }

  function toggleFullscreen() {
    const element = document.querySelector(".bible-platform-game") || document.documentElement;
    if (!document.fullscreenElement) element.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function restartCurrentGame() {
    resetRunToggle();
    releaseAllKeys();
    let restarted = false;
    forEachSameOriginWindow(window, (target) => {
      if (restarted) return;
      for (const name of ["restartCurrentLevel", "restartLevel", "restartPuzzle", "reiniciarMomento"]) {
        if (typeof target[name] === "function") {
          try { target[name](); restarted = true; return; } catch { /* Intenta el siguiente método. */ }
        }
      }
      const button = target.document?.querySelector?.('.restart-btn,[aria-label*="Reiniciar"],#restartButton');
      if (button) { button.click(); restarted = true; }
    });
    if (!restarted) window.location.reload();
    else setPaused(false, true);
  }

  function restartAfterGameOver() {
    gameOverVisible = false;
    gameOverOverlay.classList.remove("is-visible");
    document.documentElement.classList.remove("unified-game-over-active");
    restartCurrentGame();
  }

  function showGameOver() {
    if (gameOverVisible || teachingLevel) return;
    gameOverVisible = true;
    releaseAllKeys();
    resetRunToggle();
    setPaused(true, false);
    document.documentElement.classList.add("unified-game-over-active");
    gameOverOverlay.classList.add("is-visible");
    document.querySelector("#unified-game-over-restart").focus();
  }

  function forEachSameOriginWindow(target, callback, seen = new Set()) {
    if (!target || seen.has(target)) return;
    seen.add(target);
    try {
      callback(target);
      for (const frame of target.document.querySelectorAll("iframe")) forEachSameOriginWindow(frame.contentWindow, callback, seen);
    } catch { /* Marco no accesible. */ }
  }

  function currentLevel() {
    if (config.id === "levels1to6") {
      let value = Number(window.currentLevel);
      try {
        const legacyValue = (0, eval)("typeof currentLevel !== 'undefined' ? Number(currentLevel) : NaN");
        if (Number.isFinite(legacyValue)) value = legacyValue;
      } catch { /* La variable antigua puede no estar expuesta. */ }
      if (value >= 1 && value <= 6) return value;
      const requested = Number(new URLSearchParams(window.location.search).get("level"));
      return requested >= 1 && requested <= 6 ? requested : 1;
    }
    const match = String(config.id).match(/level(\d+)/);
    return match ? Number(match[1]) : 1;
  }

  function saveProgress(level, label, completed = false) {
    let progress = {};
    try { progress = JSON.parse(localStorage.getItem(MAIN_KEY) || "{}") || {}; } catch { progress = {}; }
    progress.version = 3;
    progress.currentLevel = level;
    progress.currentModule = config.index;
    progress.highestLevel = Math.max(Number(progress.highestLevel) || 1, level);
    progress.label = label || `Nivel ${level}`;
    progress.launchUrl = `game.html?module=${config.index}${config.id === "levels1to6" ? `&level=${level}` : ""}`;
    progress.completed = Boolean(completed || progress.completed);
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(MAIN_KEY, JSON.stringify(progress));
  }

  function saveCurrentProgress() {
    const level = currentLevel();
    const title = settingsApi?.titleForLevel(level) || `Nivel ${level}`;
    saveProgress(level, `Nivel ${level} · ${title}`);
  }

  function showTeaching(level) {
    if (!teachings[level] || teachingShown.has(level)) return;
    teachingShown.add(level);
    teachingLevel = level;
    resetRunToggle();
    saveProgress(level, `Nivel ${level} completado`);
    setPaused(true, false);
    const language = settingsApi?.get().language === "en" ? "en" : "es";
    const teaching = teachings[level][language];
    document.querySelector("#unified-teaching-eyebrow").textContent = language === "en" ? `Level ${level} completed · Lesson` : `Nivel ${level} completado · Enseñanza`;
    document.querySelector("#unified-teaching-title").textContent = teaching[0];
    document.querySelector("#unified-teaching-text").textContent = teaching[1];
    document.querySelector("#unified-teaching-verse").textContent = teaching[2];
    nextButton.textContent = level >= 10
      ? (language === "en" ? "View credits" : "Ver créditos")
      : (language === "en" ? `Next level: Level ${level + 1}` : `Siguiente nivel: Nivel ${level + 1}`);
    teachingOverlay.classList.add("is-visible");
    nextButton.focus();
  }

  function advanceAfterTeaching() {
    const finishedLevel = teachingLevel;
    if (!finishedLevel) return;
    teachingLevel = 0;
    teachingOverlay.classList.remove("is-visible");
    setPaused(false, false);
    if (finishedLevel >= 10) {
      saveProgress(10, "Aventura completada");
      return;
    }
    if (finishedLevel < 6 && typeof window.goToNextLevel === "function") {
      window.goToNextLevel();
      window.setTimeout(() => { resetRunToggle(); updateSoundtrack(true); saveCurrentProgress(); }, 160);
      return;
    }
    const nextModule = finishedLevel === 6 ? 1 : finishedLevel === 7 ? 2 : finishedLevel === 8 ? 3 : 4;
    const nextLevel = finishedLevel + 1;
    saveProgress(nextLevel, `Nivel ${nextLevel} · Listo para continuar`);
    window.location.href = `game.html?module=${nextModule}`;
  }

  function pollGameState() {
    const level = currentLevel();
    if (level !== lastKnownLevel) {
      lastKnownLevel = level;
      resetRunToggle();
      updateTouchVisibility();
      updateSoundtrack(true);
      updateInterfaceLanguage();
    }
    saveCurrentProgress();
    updateRequirementWarnings(level);
    relocateLegacyPanels(level);
    try {
      let won = window.gameWon === true;
      if (typeof gameWon !== "undefined") won = gameWon === true;
      if (["levels1to6", "level7", "level8"].includes(config.id) && won) {
        if (level === 7) runLevel7VictorySequence();
        else showTeaching(level);
      }
    } catch { /* Se comprueba otra vez en el siguiente ciclo. */ }
    if (!gameOverVisible && detectLegacyGameOver()) showGameOver();
  }

  function detectLegacyGameOver() {
    let detected = false;
    forEachSameOriginWindow(window, (target) => {
      if (detected) return;
      try {
        if (target.gameOverText === true || target.gameOver === true) detected = true;
        const canvas = target.document?.querySelector?.("#gameCanvas");
        const message = target.document?.querySelector?.("#gameMessage")?.textContent || "";
        if (canvas && /presiona reiniciar|game over/i.test(message)) detected = true;
      } catch { /* La siguiente comprobación volverá a intentarlo. */ }
    });
    try {
      const legacy = (0, eval)("typeof gameOverText !== 'undefined' ? gameOverText : false");
      if (legacy === true) detected = true;
    } catch { /* Variable antigua no disponible. */ }
    return detected;
  }

  function updateRequirementWarnings(level) {
    const message = document.querySelector("#gameMessage");
    if (!message) return;
    const text = message.textContent || "";
    let missing = false;
    let label = "";
    if (level === 6) {
      const lights = text.match(/Luces:\s*(\d+)\s*\/\s*(\d+)/i);
      const seals = text.match(/Sellos:\s*(\d+)\s*\/\s*(\d+)/i);
      let nearExit = false;
      let positionChecked = false;
      try {
        nearExit = Boolean((0, eval)("typeof level6 !== 'undefined' && typeof player !== 'undefined' && level6.tomb && Math.hypot(player.x-level6.tomb.x,player.y-level6.tomb.y)<330"));
        positionChecked = true;
      } catch { /* El aviso textual sigue funcionando. */ }
      if (!positionChecked) nearExit = /encuentra el sepulcro|sepulcro/i.test(text);
      missing = nearExit && Boolean((lights && +lights[1] < +lights[2]) || (seals && +seals[1] < +seals[2]));
      label = tr("Aún faltan luces o sellos. Revisa el laberinto.", "Lights or seals are still missing. Search the maze.");
    } else if (level === 7) {
      const doors = text.match(/(?:Cadenas|Puertas|Llaves)[^0-9]*(\d+)\s*\/\s*(\d+)/i);
      let nearLockedLadder = false;
      let positionChecked = false;
      try {
        nearLockedLadder = Boolean((0, eval)("typeof level7 !== 'undefined' && typeof player !== 'undefined' && Array.isArray(level7.ladders) && level7.ladders.some(function(l){return !level7.floorComplete[l.lockedFloor-1] && player.x+player.width>l.x-90 && player.x<l.x+l.width+90 && player.y+player.height>l.y-90 && player.y<l.y+l.height+90})"));
        positionChecked = true;
      } catch { /* El contador visible sigue siendo la referencia. */ }
      if (!positionChecked) nearLockedLadder = /escalera bloqueada|abre todas las puertas/i.test(text);
      missing = Boolean(doors && +doors[1] < +doors[2] && nearLockedLadder);
      label = tr("Aún faltan puertas por abrir.", "Some doors still need to be opened.");
    }
    message.classList.toggle("unified-requirement-warning", missing);
    if (missing) message.setAttribute("data-unified-warning", label);
    else message.removeAttribute("data-unified-warning");
  }

  function relocateLegacyPanels(level) {
    document.documentElement.classList.toggle("unified-level-7", level === 7);
    document.documentElement.classList.toggle("unified-level-8", level === 8);
    document.documentElement.classList.toggle("unified-level-9", level === 9);
    if (level !== 7) return;
    const stageHost = document.querySelector(".bible-platform-game");
    if (!stageHost) return;
    const candidates = [...document.querySelectorAll("#bossPanel, .quiz-container, .question-container, #questionContainer, .boss-question")];
    for (const panel of candidates) {
      if (panel.closest("#bossPanel") && panel.id !== "bossPanel") continue;
      if (!stageHost.contains(panel)) stageHost.append(panel);
      panel.classList.add("unified-in-stage-panel");
    }
  }

  function runLevel7VictorySequence() {
    if (bossVictorySequence || teachingShown.has(7)) return;
    bossVictorySequence = true;
    playExplosion();
    if (level7BossFadeTimer) {
      window.clearInterval(level7BossFadeTimer);
      level7BossFadeTimer = 0;
    }
    const startVolume = soundtrack.volume;
    const startedAt = performance.now();
    const fade = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / 900);
      soundtrack.volume = startVolume * (1 - progress);
      if (progress >= 1) {
        window.clearInterval(fade);
        soundtrack.pause();
      }
    }, 50);
    window.setTimeout(() => showTeaching(7), 650);
  }

  function lowerLevel7BossMusic() {
    if (currentLevel() !== 7 || level7BossMusicReduced || bossVictorySequence) return;
    level7BossMusicReduced = true;
    if (level7BossFadeTimer) window.clearInterval(level7BossFadeTimer);
    const startedAt = performance.now();
    const startVolume = soundtrack.volume;
    const targetVolume = Math.max(0, startVolume * 0.28);
    level7BossFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / 1000);
      soundtrack.volume = startVolume + (targetVolume - startVolume) * progress;
      if (progress >= 1) {
        window.clearInterval(level7BossFadeTimer);
        level7BossFadeTimer = 0;
      }
    }, 50);
  }

  function playExplosion() {
    const preferences = settingsApi?.get() || {};
    explosionSound.muted = Boolean(preferences.muted);
    explosionSound.volume = Math.max(0, Math.min(1, ((preferences.masterVolume || 82) / 100) * ((preferences.effectsVolume || 82) / 100)));
    explosionSound.currentTime = 0;
    explosionSound.play().catch(() => {});
  }

  function updateSoundtrack(force = false) {
    const level = currentLevel();
    if (level < 1 || level > 9) {
      soundtrack.pause();
      soundtrack.removeAttribute("src");
      soundtrackLevel = 0;
      return;
    }
    if (!force && soundtrackLevel === level) return;
    const levelChanged = soundtrackLevel !== level;
    if (levelChanged) {
      level7BossMusicReduced = false;
      bossVictorySequence = false;
      if (level7BossFadeTimer) {
        window.clearInterval(level7BossFadeTimer);
        level7BossFadeTimer = 0;
      }
    }
    const wasPlaying = !soundtrack.paused || audioUnlocked;
    soundtrackLevel = level;
    soundtrack.src = `assets/audio/niveles/nivel-${String(level).padStart(2, "0")}.mp3`;
    soundtrack.currentTime = 0;
    applySoundtrackVolume();
    if (wasPlaying && !paused) soundtrack.play().catch(() => { audioUnlocked = false; });
  }

  function applySoundtrackVolume() {
    const preferences = settingsApi?.get() || { masterVolume: 82, musicVolume: 68, muted: false };
    soundtrack.muted = Boolean(preferences.muted);
    const bossFactor = currentLevel() === 7 && level7BossMusicReduced ? 0.28 : 1;
    soundtrack.volume = Math.max(0, Math.min(1, (preferences.masterVolume / 100) * (preferences.musicVolume / 100) * .72 * bossFactor));
    syncSoundtrackPlayback();
  }

  function requestAudioUnlock() {
    if (audioUnlocked || audioUnlockInFlight || currentLevel() > 9) return;
    unlockAudio();
  }

  async function unlockAudio() {
    if (audioUnlocked || audioUnlockInFlight || currentLevel() > 9) return;
    audioUnlockInFlight = true;
    updateSoundtrack();
    try {
      if (settingsApi?.get().muted || settingsApi?.get().musicVolume === 0) return;
      await soundtrack.play();
      audioUnlocked = true;
    } catch {
      audioUnlocked = false;
    } finally {
      audioUnlockInFlight = false;
    }
  }

  function syncSoundtrackPlayback() {
    if (!soundtrack.src) return;
    const preferences = settingsApi?.get();
    const shouldPause = paused || document.hidden || preferences?.muted || preferences?.musicVolume === 0;
    if (shouldPause) soundtrack.pause();
    else if (audioUnlocked) soundtrack.play().catch(() => { audioUnlocked = false; });
  }

  function observeLegacyRespawns() {
    let previous = "";
    window.setInterval(() => {
      const message = document.querySelector("#gameMessage");
      if (!message) return;
      const next = message.textContent || "";
      if (previous && /vidas|resistencia/i.test(next) && next !== previous) resetRunToggle();
      previous = next;
    }, 350);
  }

  function observeEmbeddedGames() {
    const bind = (frame) => {
      if (!frame || frame.dataset.unifiedSettingsBound === "1") return;
      frame.dataset.unifiedSettingsBound = "1";
      const bindAudioUnlock = () => {
        try {
          frame.contentDocument?.addEventListener("pointerdown", requestAudioUnlock, { capture: true, passive: true });
          frame.contentDocument?.addEventListener("keydown", requestAudioUnlock, { capture: true });
        } catch { /* Un marco externo puede impedir el acceso a sus eventos. */ }
      };
      frame.addEventListener("load", () => {
        bindAudioUnlock();
        broadcastSettings(settingsApi?.get?.() || {});
        setUnifiedRunFlag(cRunActive);
        if (paused) cascadePause(frame.contentWindow, true);
      });
      bindAudioUnlock();
    };
    const bindAvailableFrames = () => document.querySelectorAll("iframe").forEach(bind);
    bindAvailableFrames();
    window.setInterval(bindAvailableFrames, 900);
  }

  function updateInterfaceLanguage() {
    const english = settingsApi?.get().language === "en";
    document.querySelector("#unified-pause-eyebrow").textContent = english ? "Game paused" : "Partida en pausa";
    document.querySelector("#unified-pause-title").textContent = english ? "The journey awaits" : "El camino te espera";
    document.querySelector("#unified-pause-message").textContent = english ? "Your progress has been saved." : "Tu avance está guardado.";
    resumeButton.textContent = english ? "Resume" : "Continuar";
    document.querySelector("#unified-touch-toggle").textContent = english ? "Show or hide controls" : "Mostrar u ocultar mando";
    document.querySelector("#unified-settings-button").textContent = english ? "Settings" : "Configuración";
    document.querySelector("#unified-fullscreen-button").textContent = english ? "Fullscreen" : "Pantalla completa";
    document.querySelector("#unified-restart-button").textContent = english ? "Restart level" : "Reiniciar nivel";
    document.querySelector("#unified-pause-menu-button").textContent = english ? "Main menu" : "Menú principal";
    document.querySelector("#unified-home-title").textContent = english ? "Return to menu?" : "¿Volver al menú?";
    document.querySelector("#unified-home-message").textContent = english ? "Your progress is saved. You can continue later." : "Tu avance está guardado. Podrás continuar después.";
    document.querySelector("#unified-home-cancel").textContent = english ? "Keep playing" : "Seguir jugando";
    document.querySelector("#unified-home-confirm").textContent = english ? "Return to menu" : "Volver al menú";
    touchControls.querySelector(".action-a small").textContent = english ? "Jump" : "Saltar";
    touchControls.querySelector(".action-b small").textContent = english ? "Action" : "Acción";
    touchControls.querySelector(".action-c small").textContent = english ? "Run" : "Correr";
    actionHint.textContent = english ? "B · Action" : "B · Acción";
    updateAudioButton();
    updateRunButton();
    updateTouchVisibility();
  }

  function tr(es, en) { return settingsApi?.get().language === "en" ? en : es; }

  window.__unifiedPaused = false;
  lastKnownLevel = currentLevel();
  saveCurrentProgress();
  window.setInterval(pollGameState, 900);
  window.setInterval(() => { if (paused || teachingLevel) cascadePause(window, true); }, 1300);
})();
