(() => {
  "use strict";

  const STORAGE_KEYS = {
    progress: "aventurasJesus.progress.v1",
    sound: "aventurasJesus.menuSound.v1"
  };
  const BUILD_ID = "20260807-4";
  const LEGITIMATE_GAME_ROUTES = new Set([
    "game.html?module=0&level=1",
    "game.html?module=0&level=2",
    "game.html?module=0&level=3",
    "game.html?module=0&level=4",
    "game.html?module=0&level=5",
    "game.html?module=0&level=6",
    "game.html?module=1",
    "game.html?module=2",
    "game.html?module=3",
    "game.html?module=4"
  ]);

  const ROUTES = {
    start: "game.html?module=0&level=1",
    church: "https://iglesiaecu.com/"
  };

  const menuMusic = document.querySelector("#menu-music");
  const continueButton = document.querySelector('[data-action="continue"]');
  const continueDetail = document.querySelector("#continue-detail");
  const soundButton = document.querySelector('[data-action="sound"]');
  const soundIcon = document.querySelector("#sound-icon");
  const soundLabel = document.querySelector("#sound-label");
  const dialog = document.querySelector("#info-dialog");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogMessage = document.querySelector("#dialog-message");
  const dialogExtra = document.querySelector("#dialog-extra");
  const dialogConfirm = document.querySelector("#dialog-confirm");
  const creditsDialog = document.querySelector("#credits-dialog");
  const creditsClose = document.querySelector("#credits-close");
  const settingsApi = window.AventurasSettings;

  let preferences = settingsApi ? settingsApi.get() : null;
  let soundEnabled = preferences ? !preferences.muted && preferences.musicVolume > 0 : localStorage.getItem(STORAGE_KEYS.sound) !== "off";
  let audioUnlocked = false;
  let audioUnlockInFlight = false;
  let autoMusicTimer = 0;
  let volumeAnimationToken = 0;
  let confirmHandler = null;

  menuMusic.volume = menuTargetVolume();
  updateSoundButton();
  refreshContinueState();
  applyMenuLanguage();
  scheduleAutoMusic();

  if (settingsApi) {
    settingsApi.subscribe((next) => {
      preferences = next;
      soundEnabled = !next.muted && next.musicVolume > 0;
      updateSoundButton();
      applyMenuLanguage();
      if (soundEnabled) scheduleAutoMusic();
      else fadeOutMusic(true);
    });
  }

  // El primer intento se realiza automáticamente a los dos segundos. Si el navegador
  // exige una interacción, estos oyentes reintentan en silencio con el primer gesto.
  document.addEventListener("pointerdown", requestAudioUnlock, { capture: true });
  document.addEventListener("touchstart", requestAudioUnlock, { capture: true, passive: true });
  document.addEventListener("keydown", requestAudioUnlock, { capture: true });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      bounce(button);
      handleAction(button.dataset.action);
    });
  });

  dialog.addEventListener("close", () => {
    let keepDialogState = false;
    if (dialog.returnValue === "confirm" && confirmHandler) {
      keepDialogState = confirmHandler() === false;
    }
    if (!keepDialogState) {
      confirmHandler = null;
      dialogExtra.replaceChildren();
    }
  });

  creditsClose?.addEventListener("click", () => creditsDialog?.close());

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.progress) refreshContinueState();
  });

  window.addEventListener("pageshow", () => {
    refreshContinueState();
    scheduleAutoMusic();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && soundEnabled) scheduleAutoMusic();
  });

  window.addEventListener("aventuras-settings-close", () => {
    preferences = settingsApi?.get?.() || preferences;
    soundEnabled = !preferences.muted && preferences.musicVolume > 0;
    updateSoundButton();
    if (soundEnabled) {
      audioUnlocked = false;
      scheduleAutoMusic();
    }
  });

  function handleAction(action) {
    if (action === "start") return startNewAdventure();
    if (action === "continue") return continueAdventure();
    if (action === "android") return showStoreNotice("Android", "Google Play");
    if (action === "ios") return showStoreNotice("iPhone y iPad", "App Store");
    if (action === "church") return showChurchGate();
    if (action === "settings") return settingsApi?.open({ context: "menu", level: loadProgress()?.currentLevel || 1 });
    if (action === "credits") return creditsDialog?.showModal();
    if (action === "sound") toggleSound();
  }

  function startNewAdventure() {
    const current = loadProgress();
    const begin = () => {
      clearAdventureProgress();
      const progress = {
        version: 2,
        currentLevel: 1,
        currentModule: 0,
        highestLevel: 1,
        resistance: 100,
        label: "Nivel 1 · Milagro en Caná",
        launchUrl: ROUTES.start,
        updatedAt: new Date().toISOString()
      };
      saveProgress(progress);
      leaveMenu(ROUTES.start);
    };

    if (!current) return begin();
    showDialog({
      title: "¿Comenzar una nueva aventura?",
      message: "La partida guardada se reemplazará y volverás al Nivel 1.",
      confirmText: "Comenzar de nuevo",
      onConfirm: begin
    });
  }

  function continueAdventure() {
    const progress = loadProgress();
    if (!progress) {
      showDialog({
        title: "Aún no hay una partida guardada",
        message: "Elige «Comenzar aventura» para iniciar el recorrido.",
        confirmText: "Entendido"
      });
      return;
    }

    if (progress.level10Completed || progress.completed) {
      showDialog({
        title: "¡Aventura completada!",
        message: "La esperanza está viva. Puedes comenzar una nueva partida para recorrer otra vez los diez niveles.",
        confirmText: "Entendido"
      });
      return;
    }

    leaveMenu(validLaunchUrl(progress));
  }

  function validLaunchUrl(progress) {
    const candidate = typeof progress?.launchUrl === "string" ? progress.launchUrl.trim() : "";
    return LEGITIMATE_GAME_ROUTES.has(candidate) ? candidate : routeForProgress(progress);
  }

  function routeForProgress(progress) {
    const level = Math.max(1, Math.min(10, Number(progress.currentLevel) || 1));
    const moduleIndex = level <= 6 ? 0 : level - 6;
    return `game.html?module=${moduleIndex}${level <= 6 ? `&level=${level}` : ""}`;
  }

  function clearAdventureProgress() {
    const preservedSound = localStorage.getItem(STORAGE_KEYS.sound);
    const preservedSettings = localStorage.getItem("aventurasJesus.settings.v1");
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith("aventurasJesus.")) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("senderosDeLuzTramo3V1");
    if (preservedSound !== null) localStorage.setItem(STORAGE_KEYS.sound, preservedSound);
    if (preservedSettings !== null) localStorage.setItem("aventurasJesus.settings.v1", preservedSettings);
  }

  function showStoreNotice(deviceName, storeName) {
    showDialog({
      title: `Descargar para ${deviceName}`,
      message: `La versión para ${deviceName} estará disponible próximamente en ${storeName}. Este botón quedará listo para enlazar la publicación oficial.`,
      confirmText: "Entendido"
    });
  }

  function showChurchGate() {
    dialogTitle.textContent = "Conoce Iglesia de Cristo Ecuador";
    dialogMessage.textContent = "Descubre recursos bíblicos, estudios y contenido para toda la familia en nuestro sitio oficial.";
    dialogConfirm.textContent = "Visitar sitio oficial";

    const wrapper = document.createElement("div");
    wrapper.className = "parent-check";
    wrapper.innerHTML = `
      <label for="parent-answer">Para continuar, responde: ¿cuánto es 6 + 3?</label>
      <input id="parent-answer" type="number" inputmode="numeric" autocomplete="off" aria-describedby="parent-error">
      <p id="parent-error" class="dialog-error" role="status"></p>
    `;
    dialogExtra.replaceChildren(wrapper);

    confirmHandler = () => {
      const answer = wrapper.querySelector("#parent-answer").value.trim();
      if (answer !== "9") {
        wrapper.querySelector("#parent-error").textContent = "La respuesta no es correcta. Inténtalo nuevamente.";
        dialog.showModal();
        wrapper.querySelector("#parent-answer").focus();
        return false;
      }
      window.open(ROUTES.church, "_blank", "noopener,noreferrer");
      return true;
    };

    dialog.showModal();
    requestAnimationFrame(() => wrapper.querySelector("#parent-answer").focus());
  }

  function showDialog({ title, message, confirmText, onConfirm = null }) {
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    dialogExtra.replaceChildren();
    dialogConfirm.textContent = confirmText;
    confirmHandler = onConfirm;
    dialog.showModal();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(STORAGE_KEYS.sound, soundEnabled ? "on" : "off");
    if (settingsApi) preferences = settingsApi.save({ muted: !soundEnabled });
    updateSoundButton();
    if (soundEnabled) {
      unlockAudio();
    } else {
      fadeOutMusic(true);
    }
  }

  function updateSoundButton() {
    const english = settingsApi?.get().language === "en";
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    soundButton.setAttribute("aria-label", soundEnabled ? (english ? "Mute music" : "Silenciar música") : (english ? "Enable music" : "Activar música"));
    soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
    soundLabel.textContent = soundEnabled ? (english ? "Music on" : "Música activada") : (english ? "Music off" : "Música desactivada");
  }

  function requestAudioUnlock() {
    if (!soundEnabled || (!menuMusic.paused && !menuMusic.ended)) return;
    unlockAudio();
  }

  function scheduleAutoMusic() {
    window.clearTimeout(autoMusicTimer);
    if (!soundEnabled || document.hidden) return;
    autoMusicTimer = window.setTimeout(() => {
      unlockAudio();
    }, 2000);
  }

  async function unlockAudio() {
    if (!soundEnabled || audioUnlockInFlight) return false;
    if (!menuMusic.paused && !menuMusic.ended) {
      audioUnlocked = true;
      animateVolume(menuTargetVolume(), 350);
      return true;
    }
    audioUnlockInFlight = true;
    try {
      menuMusic.volume = 0;
      await menuMusic.play();
      audioUnlocked = true;
      animateVolume(menuTargetVolume(), 550);
      return true;
    } catch {
      audioUnlocked = false;
      return false;
    } finally {
      audioUnlockInFlight = false;
    }
  }

  function fadeInMusic() {
    unlockAudio();
  }

  function fadeOutMusic(pauseAtEnd = true) {
    animateVolume(0, 420, () => {
      if (pauseAtEnd) menuMusic.pause();
    });
  }

  function animateVolume(target, duration, done = null) {
    const token = ++volumeAnimationToken;
    const start = menuMusic.volume;
    const startedAt = performance.now();
    const step = (now) => {
      if (token !== volumeAnimationToken) return;
      const elapsed = Math.min(1, (now - startedAt) / duration);
      menuMusic.volume = Math.max(0, Math.min(1, start + (target - start) * elapsed));
      if (elapsed < 1) requestAnimationFrame(step);
      else if (done) done();
    };
    requestAnimationFrame(step);
  }

  function menuTargetVolume() {
    if (!preferences) return 0.42;
    if (preferences.muted) return 0;
    return Math.max(0, Math.min(1, (preferences.masterVolume / 100) * (preferences.musicVolume / 100) * 0.62));
  }

  function applyMenuLanguage() {
    if (!settingsApi) return;
    const english = settingsApi.get().language === "en";
    const setAction = (action, title, detail) => {
      const button = document.querySelector(`[data-action="${action}"]`);
      if (!button) return;
      const strong = button.querySelector("strong");
      const small = button.querySelector("small");
      if (strong) strong.textContent = title;
      if (small && action !== "continue") small.textContent = detail;
    };
    document.title = english ? "The adventures of Jesus" : "Las aventuras de Jesús";
    document.querySelector(".eyebrow").textContent = english ? "A Bible game for the whole family" : "Juego bíblico para toda la familia";
    document.querySelector("#game-title").textContent = english ? "The adventures of Jesus" : "Las aventuras de Jesús";
    document.querySelector(".subtitle").textContent = english ? "A journey of faith and hope" : "Un camino de fe y esperanza";
    setAction("start", english ? "Start adventure" : "Comenzar aventura", english ? "Begin the journey at Cana" : "Inicia el recorrido desde Caná");
    setAction("continue", english ? "Continue" : "Continuar", "");
    setAction("settings", english ? "Settings" : "Configuración", english ? "Language, audio, accessibility and controls" : "Idioma, audio, accesibilidad y controles");
    setAction("android", english ? "Download for Android" : "Descargar para Android", "Google Play");
    setAction("ios", english ? "Download for iPhone and iPad" : "Descargar para iPhone y iPad", "App Store");
    setAction("church", english ? "Discover Church of Christ Ecuador" : "Conoce Iglesia de Cristo Ecuador", english ? "Where the truth of Christ transforms lives" : "Donde la verdad de Cristo transforma vidas");
    document.querySelector(".menu-footer p").textContent = english ? "Progress is saved automatically." : "El progreso se guarda automáticamente.";
    refreshContinueState();
  }

  function leaveMenu(url) {
    fadeOutMusic(true);
    const separator = url.includes("?") ? "&" : "?";
    const destination = url.includes("build=") ? url : `${url}${separator}build=${BUILD_ID}`;
    window.setTimeout(() => { window.location.href = destination; }, 430);
  }

  function refreshContinueState() {
    const progress = loadProgress();
    const english = settingsApi?.get().language === "en";
    continueButton.disabled = !progress;
    continueDetail.textContent = progress
      ? (progress.level10Completed || progress.completed ? (english ? "Adventure completed" : "Aventura completada") : progress.label || `${english ? "Level" : "Nivel"} ${progress.currentLevel || 1}`)
      : (english ? "There is no saved game yet" : "Aún no hay una partida guardada");
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.progress);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
    refreshContinueState();
  }

  function bounce(element) {
    element.classList.remove("is-bouncing");
    void element.offsetWidth;
    element.classList.add("is-bouncing");
    window.setTimeout(() => element.classList.remove("is-bouncing"), 380);
  }
})();
