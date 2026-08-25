(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const SAVE_KEY = "aventurasJesus.nivel10.v2";
  const MAIN_PROGRESS_KEY = "aventurasJesus.progress.v1";
  const INTERNAL_ORIGIN = window.location.origin;
  const urlParams = new URLSearchParams(window.location.search);
  const continueSavedGame = urlParams.get("continue") === "1";
  const DAMAGE_PERCENT = 5;
  const WORD_LANES = [235, 325, 415];
  const SHIELD_DURATION = 5;

  const PHASES = [
    {
      name: "La oscuridad de la mentira",
      objective: "Recorre el Abismo y encuentra 15 luces de la Verdad.",
      total: 15,
      width: 3900,
      height: 620,
      kind: "truth",
      success: "La Verdad disipó la oscuridad.",
      verse: "«La luz en las tinieblas resplandece». Juan 1:5"
    },
    {
      name: "El camino quebrantado",
      objective: "Cruza el camino largo y reúne 20 estrellas de perseverancia.",
      total: 20,
      width: 4700,
      height: 660,
      kind: "stars",
      success: "La perseverancia abrió un camino.",
      verse: "«Corramos con paciencia la carrera». Hebreos 12:1"
    },
    {
      name: "La lluvia de fuego",
      objective: "Encuentra 20 Biblias-refugio mientras esquivas las bolas de fuego.",
      total: 20,
      width: 4700,
      height: 650,
      kind: "bibles",
      success: "La Palabra fue refugio en medio del fuego.",
      verse: "«Tu palabra es lámpara a mis pies». Salmo 119:105"
    },
    {
      name: "Las voces del Abismo",
      objective: "Avanza por el trayecto, recoge 20 palabras buenas que caen del cielo y evita las malas.",
      total: 20,
      width: 5200,
      height: 640,
      kind: "words",
      success: "Las palabras de vida vencieron a las voces del Abismo.",
      verse: "«La verdad os hará libres». Juan 8:32"
    },
    {
      name: "Las cadenas de la desesperanza",
      objective: "Destruye 20 cadenas y libera las almas y las Biblias retenidas.",
      total: 20,
      width: 5800,
      height: 660,
      kind: "chains",
      success: "Las cadenas cayeron y la esperanza fue liberada.",
      verse: "«Si el Hijo os libertare, seréis verdaderamente libres». Juan 8:36"
    },
    {
      name: "La victoria de la Luz",
      objective: "Recoge 20 espadas de virtud, enciende 5 pilares y llega hasta Satanás.",
      total: 20,
      width: 1280,
      height: 5000,
      kind: "ascent",
      success: "La Luz ha vencido.",
      verse: "«Yo soy la resurrección y la vida». Juan 11:25"
    }
  ];

  const GOOD_WORDS = ["AMOR", "VERDAD", "FE", "PAZ", "PERDÓN", "ESPERANZA", "GRACIA"];
  const BAD_WORDS = ["MIEDO", "ODIO", "MENTIRA", "BURLA", "RENCOR", "ORGULLO"];
  const VIRTUES = ["VERDAD", "FE", "AMOR", "ESPERANZA", "PAZ", "GRACIA", "PERDÓN"];
  const DIALOGUE = [
    {
      speaker: "Jesús",
      title: "La Palabra permanece",
      text: "Vete, Satanás, porque escrito está: al Señor tu Dios adorarás, y a él solo servirás.",
      reference: "Mateo 4:10"
    },
    {
      speaker: "Jesús",
      title: "La vida ha vencido",
      text: "Yo soy la resurrección y la vida; el que cree en mí, aunque esté muerto, vivirá.",
      reference: "Juan 11:25"
    },
    {
      speaker: "Satanás",
      title: "Una última pregunta",
      text: "En la Escritura se menciona que los demonios también creen y tiemblan, pero los seres humanos no lo hacen. Entonces, ¿en qué posición quedamos nosotros?",
      reference: "Santiago 2:19"
    },
    {
      speaker: "Jesús",
      title: "Todavía hay esperanza",
      text: "Aún hay esperanza en el ser humano y aún hay gracia en sus corazones.",
      reference: "Romanos 5:20 · Juan 1:16"
    }
  ];

  const ui = {
    phaseTitle: document.querySelector("#phase-title"),
    phaseObjective: document.querySelector("#phase-objective"),
    counter: document.querySelector("#objective-counter"),
    checkpoint: document.querySelector("#checkpoint-label"),
    resistanceValue: document.querySelector("#resistance-value"),
    resistanceFill: document.querySelector("#resistance-fill"),
    resistanceTrack: document.querySelector(".resistance-track"),
    intro: document.querySelector("#intro-overlay"),
    start: document.querySelector("#start-level"),
    phaseOverlay: document.querySelector("#phase-overlay"),
    phaseKicker: document.querySelector("#phase-card-kicker"),
    phaseCardTitle: document.querySelector("#phase-card-title"),
    phaseCardMessage: document.querySelector("#phase-card-message"),
    continuePhase: document.querySelector("#continue-phase"),
    defeat: document.querySelector("#defeat-overlay"),
    retry: document.querySelector("#retry-phase"),
    dialogue: document.querySelector("#dialogue-overlay"),
    dialogueSpeaker: document.querySelector("#dialogue-speaker"),
    dialogueTitle: document.querySelector("#dialogue-title"),
    dialogueText: document.querySelector("#dialogue-text"),
    dialogueReference: document.querySelector("#dialogue-reference"),
    dialogueNext: document.querySelector("#dialogue-next"),
    victory: document.querySelector("#victory-overlay"),
    finish: document.querySelector("#finish-level"),
    toast: document.querySelector("#message-toast"),
    sound: document.querySelector("#sound-toggle"),
    pause: document.querySelector("#pause-toggle"),
    pauseOverlay: document.querySelector("#pause-overlay"),
    resume: document.querySelector("#resume-level"),
    music: document.querySelector("#level-music"),
    finalMusic: document.querySelector("#final-floor-music"),
    creditsMusic: document.querySelector("#credits-music")
  };

  const keys = new Set();
  const touch = {
    left: false,
    right: false,
    jump: false,
    crouch: false,
    run: false,
    light: false
  };

  const state = {
    phase: 1,
    running: false,
    paused: false,
    resumeLevelMusic: false,
    resumeFinalMusic: false,
    resumeCreditsMusic: false,
    resistance: 100,
    progress: 0,
    secondary: 0,
    completed: new Set(),
    worldWidth: PHASES[0].width,
    worldHeight: PHASES[0].height,
    cameraX: 0,
    cameraY: 0,
    vertical: false,
    elapsed: 0,
    hazardTimer: 1.5,
    wordTimer: 0.8,
    lastWordLane: -1,
    lightningTimer: 2.5,
    boulderTimer: 1.4,
    damageCooldown: 0,
    lightCooldown: 0,
    shieldTimer: 0,
    dropThroughTimer: 0,
    dropPlatform: null,
    lastDownTapAt: 0,
    finalReturnHintShown: false,
    flash: 0,
    shake: 0,
    toastTimer: 0,
    finalApproach: false,
    satanGone: false,
    finalFloorMusicActive: false,
    doorActive: false,
    doorEntered: false,
    musicFade: 0,
    dialogueStep: 0,
    dialogueTypingTimer: null,
    dialogueTypingText: "",
    audioEnabled: true,
    soundUnlocked: false,
    platforms: [],
    collectibles: [],
    hazards: [],
    words: [],
    obstacles: [],
    chains: [],
    lightning: [],
    boulders: [],
    pillars: [],
    releases: [],
    particles: [],
    souls: [],
    finalSatan: { x: 1080, y: 315 },
    finalDoor: { x: 1200, y: 430, w: 66, h: 126 }
  };
  let externalSettings = {
    masterVolume: 100,
    musicVolume: 100,
    muted: false
  };

  const player = {
    x: 72,
    y: 390,
    w: 44,
    h: 68,
    normalH: 68,
    crouchH: 45,
    vx: 0,
    vy: 0,
    grounded: false,
    crouched: false,
    facing: 1,
    anim: 0,
    frame: 0,
    respawnX: 72,
    respawnY: 390,
    supportPlatform: null,
    respawnPlatform: null
  };

  const jesusFrames = Array.from({ length: 5 }, (_, index) => {
    const image = new Image();
    image.src = `assets/jesus-walk-${index + 1}.webp`;
    return image;
  });

  let lastTime = performance.now();

  bindEvents();
  const initialCheckpoint = continueSavedGame ? loadCheckpoint() : null;
  state.phase = initialCheckpoint?.phase || 1;
  state.resistance = initialCheckpoint?.resistance || 100;
  setupPhase(state.phase);
  state.running = false;
  updateUI();
  requestAnimationFrame(loop);

  function bindEvents() {
    window.addEventListener("keydown", (event) => {
      const rawKey = event.key.toLowerCase();
      if ((rawKey === "p" || rawKey === "escape") && !event.repeat) {
        event.preventDefault();
        togglePause();
        return;
      }
      if (state.paused) return;
      const key = normalizeKey(event.key);
      if (["left", "right", "jump", "crouch", "run", "light"].includes(key)) {
        event.preventDefault();
        keys.add(key);
        if (key === "crouch" && !event.repeat) registerDownTap();
        if (key === "jump") touch.jump = true;
        if (key === "light") touch.light = true;
      }
    });

    window.addEventListener("keyup", (event) => {
      const key = normalizeKey(event.key);
      keys.delete(key);
      if (key === "jump") touch.jump = false;
      if (key === "light") touch.light = false;
    });

    document.querySelectorAll("[data-control]").forEach((button) => {
      const control = button.dataset.control;
      const press = (event) => {
        event.preventDefault();
        if (!state.running || state.paused) return;
        touch[control] = true;
        if (control === "crouch") registerDownTap();
        button.classList.add("pressed");
        canvas.focus();
      };
      const release = (event) => {
        event.preventDefault();
        touch[control] = false;
        button.classList.remove("pressed");
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    ui.start.addEventListener("click", begin);
    ui.continuePhase.addEventListener("click", continueToNextPhase);
    ui.retry.addEventListener("click", retryPhase);
    ui.dialogueNext.addEventListener("click", advanceDialogue);
    ui.finish.addEventListener("click", () => {
      window.parent.location.href = "index.html";
    });
    ui.sound.addEventListener("click", toggleSound);
    ui.pause.addEventListener("click", togglePause);
    ui.resume.addEventListener("click", resumeGame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.running && !state.paused) pauseGame();
    });
    window.addEventListener("message", (event) => {
      if (event.origin !== INTERNAL_ORIGIN || event.source !== window.parent || !isMessageObject(event.data)) return;
      if (event.data?.type === "aventuras-settings") {
        if (!hasOnlyMessageKeys(event.data, ["type", "settings"]) || !isValidExternalSettings(event.data.settings)) return;
        applyExternalSettings(event.data.settings);
        return;
      }
      if (event.data.type !== "unified-game-pause" ||
          !hasOnlyMessageKeys(event.data, ["type", "paused"]) || typeof event.data.paused !== "boolean") return;
      if (event.data.paused) pauseGame();
      else resumeGame();
    });
    document.addEventListener("pointerdown", unlockAudio, { once: true });
  }

  function isMessageObject(data) {
    return data !== null && typeof data === "object" && !Array.isArray(data);
  }

  function hasOnlyMessageKeys(data, allowedKeys) {
    return Object.keys(data).every((key) => allowedKeys.includes(key));
  }

  function isValidExternalSettings(settings) {
    if (!isMessageObject(settings)) return false;
    const validators = {
      language: (value) => value === "es" || value === "en",
      masterVolume: validPercentage,
      musicVolume: validPercentage,
      sfxVolume: validPercentage,
      muted: (value) => typeof value === "boolean",
      textSize: (value) => ["normal", "large", "xlarge"].includes(value),
      highContrast: (value) => typeof value === "boolean",
      reduceEffects: (value) => typeof value === "boolean",
      graphics: (value) => ["high", "medium", "low"].includes(value),
      touchMode: (value) => ["auto", "visible", "hidden"].includes(value),
      touchSize: (value) => ["small", "medium", "large"].includes(value),
      touchOpacity: validPercentage,
      vibration: (value) => typeof value === "boolean"
    };
    return Object.keys(settings).every((key) => validators[key]?.(settings[key]) === true);
  }

  function validPercentage(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
  }

  function normalizeKey(key) {
    const value = key.toLowerCase();
    if (value === "arrowleft" || value === "a") return "left";
    if (value === "arrowright" || value === "d") return "right";
    if (value === "arrowup" || value === "w" || value === " ") return "jump";
    if (value === "arrowdown" || value === "s") return "crouch";
    if (value === "shift") return "run";
    if (value === "e" || value === "enter") return "light";
    return value;
  }

  function canDropThrough(platform = player.supportPlatform) {
    return state.phase === 6 &&
      player.grounded &&
      platform &&
      (!platform.base || platform.final);
  }

  function registerDownTap() {
    if (!state.running || state.paused || state.phase !== 6) return;
    const now = performance.now();
    const isDoubleTap = now - state.lastDownTapAt <= 440;
    state.lastDownTapAt = now;
    if (!isDoubleTap || !canDropThrough()) return;
    state.lastDownTapAt = 0;
    const platform = player.supportPlatform;
    state.dropPlatform = platform;
    state.dropThroughTimer = platform.final ? 0.62 : 0.42;
    player.grounded = false;
    player.supportPlatform = null;
    player.y += 18;
    player.vy = platform.final ? 290 : 190;
    showToast("Descenso activado: Jesús baja a la plataforma inferior.");
  }

  function begin() {
    ui.intro.classList.remove("visible");
    if (!continueSavedGame) {
      state.phase = 1;
      state.resistance = 100;
      localStorage.removeItem(SAVE_KEY);
      setupPhase(1);
    }
    state.paused = false;
    state.running = true;
    unlockAudio();
    canvas.focus();
    if (continueSavedGame && state.phase > 1) {
      showToast(`Continuamos desde la prueba ${state.phase}.`);
    }
  }

  async function unlockAudio() {
    if (!canPlayAudio() || state.soundUnlocked || state.paused) return;
    try {
      ui.music.volume = levelMusicVolume();
      ui.finalMusic.volume = finalMusicVolume();
      ui.creditsMusic.volume = creditsMusicVolume();
      const activeMusic = ui.victory.classList.contains("visible")
        ? ui.creditsMusic
        : state.finalFloorMusicActive
          ? ui.finalMusic
          : ui.music;
      await activeMusic.play();
      state.soundUnlocked = true;
      ui.sound.textContent = "🔊";
    } catch {
      state.soundUnlocked = false;
    }
  }

  function toggleSound() {
    state.audioEnabled = !state.audioEnabled;
    if (state.audioEnabled) {
      state.soundUnlocked = false;
      unlockAudio();
    } else {
      ui.music.pause();
      ui.finalMusic.pause();
      ui.creditsMusic.pause();
      ui.sound.textContent = "🔇";
    }
  }

  function applyExternalSettings(settings) {
    if (!settings || typeof settings !== "object") return;
    externalSettings = { ...externalSettings, ...settings };
    ui.music.volume = levelMusicVolume();
    ui.finalMusic.volume = finalMusicVolume();
    ui.creditsMusic.volume = creditsMusicVolume();
    if (!canPlayAudio()) {
      ui.music.pause();
      ui.finalMusic.pause();
      ui.creditsMusic.pause();
    } else if (state.running && !state.paused) {
      state.soundUnlocked = false;
      unlockAudio();
    }
  }

  function canPlayAudio() {
    return state.audioEnabled && !externalSettings.muted && Number(externalSettings.masterVolume) > 0 && Number(externalSettings.musicVolume) > 0;
  }

  function musicScale() {
    const master = Math.max(0, Math.min(100, Number(externalSettings.masterVolume) || 0)) / 100;
    const music = Math.max(0, Math.min(100, Number(externalSettings.musicVolume) || 0)) / 100;
    return master * music;
  }

  function levelMusicVolume() {
    return 0.52 * musicScale();
  }

  function finalMusicVolume() {
    return 0.46 * musicScale();
  }

  function creditsMusicVolume() {
    return 0.43 * musicScale();
  }

  function togglePause() {
    if (state.paused) {
      resumeGame();
    } else if (state.running) {
      pauseGame();
    }
  }

  function pauseGame() {
    if (!state.running || state.paused) return;
    state.paused = true;
    state.resumeLevelMusic = !ui.music.paused;
    state.resumeFinalMusic = !ui.finalMusic.paused;
    state.resumeCreditsMusic = !ui.creditsMusic.paused;
    ui.music.pause();
    ui.finalMusic.pause();
    ui.creditsMusic.pause();
    releaseControls();
    ui.pauseOverlay.classList.add("visible");
    ui.pause.textContent = "▶";
    ui.pause.setAttribute("aria-label", "Continuar juego");
    ui.pause.title = "Continuar juego (P o Escape)";
  }

  function resumeGame() {
    if (!state.paused) return;
    state.paused = false;
    ui.pauseOverlay.classList.remove("visible");
    ui.pause.textContent = "⏸";
    ui.pause.setAttribute("aria-label", "Pausar juego");
    ui.pause.title = "Pausar o continuar (P o Escape)";
    lastTime = performance.now();
    if (canPlayAudio() && state.resumeLevelMusic) {
      ui.music.play().catch(() => {});
    }
    if (canPlayAudio() && state.resumeFinalMusic) {
      ui.finalMusic.play().catch(() => {});
    }
    if (canPlayAudio() && state.resumeCreditsMusic) {
      ui.creditsMusic.play().catch(() => {});
    }
    canvas.focus();
  }

  function releaseControls() {
    keys.clear();
    Object.keys(touch).forEach((control) => {
      touch[control] = false;
    });
    document.querySelectorAll("[data-control].pressed").forEach((button) => {
      button.classList.remove("pressed");
    });
  }

  function setupPhase(phaseNumber) {
    const config = PHASES[phaseNumber - 1];
    state.phase = phaseNumber;
    state.progress = 0;
    state.secondary = 0;
    state.worldWidth = config.width;
    state.worldHeight = config.height;
    state.vertical = phaseNumber === 6;
    state.paused = false;
    state.cameraX = 0;
    state.cameraY = state.vertical ? state.worldHeight - H : 0;
    state.elapsed = 0;
    state.hazardTimer = 1.4;
    state.wordTimer = 1.05;
    state.lastWordLane = -1;
    state.lightningTimer = 2.6;
    state.boulderTimer = 1.5;
    state.damageCooldown = 0;
    state.lightCooldown = 0;
    state.shieldTimer = 0;
    state.dropThroughTimer = 0;
    state.dropPlatform = null;
    state.lastDownTapAt = 0;
    state.finalReturnHintShown = false;
    state.finalApproach = false;
    state.satanGone = false;
    state.finalFloorMusicActive = false;
    state.doorActive = false;
    state.doorEntered = false;
    state.musicFade = 0;
    ui.finalMusic.pause();
    ui.finalMusic.currentTime = 0;
    ui.finalMusic.volume = finalMusicVolume();
    ui.music.volume = levelMusicVolume();
    if (state.soundUnlocked && canPlayAudio() && ui.music.paused) {
      ui.music.play().catch(() => {});
    }
    stopDialogueTyping(false);
    state.platforms = [];
    state.collectibles = [];
    state.hazards = [];
    state.words = [];
    state.obstacles = [];
    state.chains = [];
    state.lightning = [];
    state.boulders = [];
    state.pillars = [];
    state.releases = [];
    state.particles = [];
    ui.pauseOverlay.classList.remove("visible");
    ui.pause.textContent = "⏸";
    ui.pause.setAttribute("aria-label", "Pausar juego");
    buildSouls();

    if (phaseNumber === 6) {
      buildAscent();
    } else {
      buildHorizontalPhase(phaseNumber);
    }

    updateUI();
  }

  function buildSouls() {
    const count = state.vertical ? 260 : Math.max(240, Math.floor(state.worldWidth / 10));
    let seed = state.phase * 9367 + 41;
    state.souls = Array.from({ length: count }, (_, index) => {
      seed = (seed * 16807) % 2147483647;
      const rx = seed / 2147483647;
      seed = (seed * 16807) % 2147483647;
      const ry = seed / 2147483647;
      return {
        x: rx * state.worldWidth,
        y: 70 + ry * Math.max(300, state.worldHeight - 170),
        size: 17 + (index % 10) + (index % 9 === 0 ? 5 : 0),
        drift: (index % 11) * 0.37,
        alpha: 0.14 + (index % 5) * 0.025
      };
    });
  }

  function buildHorizontalPhase(phaseNumber) {
    const config = PHASES[phaseNumber - 1];
    const groundY = 486;

    if (phaseNumber === 2) {
      const heights = [454, 390, 430, 350, 408, 374, 442];
      state.platforms.push({
        x: 0,
        y: 470,
        w: 245,
        h: 24,
        floatingTrial: true,
        safeStart: true
      });
      for (let index = 0; index < 22; index += 1) {
        const collapses = index === 2 || index === 9 || index === 17;
        state.platforms.push({
          x: 285 + index * 198,
          y: heights[index % heights.length],
          w: 126 + (index % 3) * 18,
          h: 17,
          floatingTrial: true,
          starPlatform: index < 20,
          collapses,
          fallTriggered: false,
          fallDelay: 0,
          fallVelocity: 0,
          inactive: false,
          originalY: heights[index % heights.length]
        });
      }
      state.platforms.push({
        x: config.width - 235,
        y: 438,
        w: 235,
        h: 24,
        floatingTrial: true,
        safeEnd: true
      });
    } else {
      state.platforms.push({ x: 0, y: groundY, w: config.width, h: 100, base: true });
    }

    if (phaseNumber === 1) {
      const truthPlatformHeights = [0, 405, 330, 255, 0, 380, 300, 225, 340, 0, 400, 325, 250, 350, 0];
      const truthMargin = 250;
      const truthUsable = config.width - truthMargin * 2;
      truthPlatformHeights.forEach((y, collectibleSlot) => {
        if (!y) return;
        const collectibleX = truthMargin + (truthUsable * collectibleSlot) / (truthPlatformHeights.length - 1);
        state.platforms.push({
          x: collectibleX - 88,
          y,
          w: 176,
          h: 16,
          truthPlatform: true,
          collectibleSlot
        });
      });
    } else if (phaseNumber !== 2) {
      const elevatedCount = Math.floor(config.width / 330);
      for (let index = 0; index < elevatedCount; index += 1) {
        const x = 280 + index * 330;
        const y = 405 - (index % 4) * 30;
        state.platforms.push({
          x,
          y,
          w: 145 + (index % 2) * 28,
          h: 16,
          deceptive: phaseNumber === 3,
          deceptionOffset: index * 0.83
        });
      }
    }

    if (phaseNumber === 4) {
      for (let x = 520, index = 0; x < config.width - 300; x += 390, index += 1) {
        state.obstacles.push({
          x,
          y: groundY - (index % 3 === 0 ? 46 : 34),
          w: index % 3 === 0 ? 42 : 48,
          h: index % 3 === 0 ? 46 : 34,
          type: index % 3 === 0 ? "spikes" : "rock",
          hit: false
        });
      }
      buildWordRain(config.total, config.width, groundY);
    } else if (phaseNumber === 5) {
      buildChains(config.total, config.width, groundY);
    } else {
      buildCollectibles(config.total, config.width, groundY, config.kind);
    }

    if (phaseNumber >= 2 && phaseNumber <= 5) {
      buildMidpointShieldChest(phaseNumber, config.width, groundY);
    }

    const startY = phaseNumber === 2
      ? state.platforms[0].y - player.normalH
      : groundY - player.normalH;
    resetPlayer(62, startY);
    if (phaseNumber === 2) {
      player.respawnPlatform = state.platforms[0];
    }
  }

  function buildMidpointShieldChest(phaseNumber, worldWidth, groundY) {
    const midpoint = worldWidth / 2;
    let x = midpoint;
    let y = groundY - 34;

    if (phaseNumber === 2) {
      const platform = state.platforms
        .filter((item) => item.floatingTrial && !item.safeStart && !item.safeEnd)
        .sort((a, b) =>
          Math.abs(a.x + a.w / 2 - midpoint) - Math.abs(b.x + b.w / 2 - midpoint)
        )[0];
      if (platform) {
        x = platform.x + platform.w / 2;
        y = platform.y - 34;
      }
    }

    state.collectibles.push({
      x,
      y,
      r: 25,
      kind: "shield_chest",
      collected: false,
      bob: 1.7,
      duration: SHIELD_DURATION
    });
  }

  function buildWordRain(total, worldWidth, groundY) {
    const margin = 380;
    const usable = worldWidth - margin * 2;

    for (let sector = 0; sector < total; sector += 1) {
      const sectorX = margin + (usable * sector) / Math.max(1, total - 1);
      const goodOffset = [-105, 70, -35, 120, 15][sector % 5];
      const goodX = clamp(sectorX + goodOffset, 105, worldWidth - 105);

      state.words.push({
        x: goodX,
        spawnX: goodX,
        triggerX: sectorX,
        y: -70,
        good: true,
        text: GOOD_WORDS[sector % GOOD_WORDS.length],
        dead: false,
        active: false,
        triggered: false,
        activationDelay: 0.28 + (sector % 4) * 0.42,
        pulse: sector * 0.83,
        rainWord: true,
        groundY,
        driftRange: 12 + (sector % 3) * 4,
        driftSpeed: 1.15 + sector * 0.02,
        fallSpeed: 190 + sector * 2.8,
        sector
      });

      const badCount = 1 + Math.floor(sector / 7);
      const occupiedX = [goodX];
      for (let badIndex = 0; badIndex < badCount; badIndex += 1) {
        const direction = (sector + badIndex) % 2 === 0 ? -1 : 1;
        const separation = 175 + badIndex * 110;
        const preferredOffsets = [
          direction * separation,
          -direction * separation,
          direction * (separation + 150),
          -direction * (separation + 150)
        ];
        let badX = null;
        for (const offset of preferredOffsets) {
          const candidate = clamp(goodX + offset, 90, worldWidth - 90);
          if (occupiedX.every((usedX) => Math.abs(candidate - usedX) >= 140)) {
            badX = candidate;
            break;
          }
        }
        if (badX === null) {
          const localStart = Math.max(90, goodX - 520);
          const localEnd = Math.min(worldWidth - 90, goodX + 520);
          for (let candidate = localStart; candidate <= localEnd; candidate += 145) {
            if (occupiedX.every((usedX) => Math.abs(candidate - usedX) >= 140)) {
              badX = candidate;
              break;
            }
          }
        }
        badX = badX ?? clamp(goodX + direction * separation, 90, worldWidth - 90);
        occupiedX.push(badX);
        state.words.push({
          x: badX,
          spawnX: badX,
          triggerX: sectorX,
          y: -80 - badIndex * 85,
          good: false,
          text: BAD_WORDS[(sector + badIndex) % BAD_WORDS.length],
          dead: false,
          active: false,
          triggered: false,
          activationDelay: 0.42 + (sector % 3) * 0.34 + badIndex * 0.46,
          pulse: sector * 1.11 + badIndex * 0.7,
          rainWord: true,
          groundY,
          driftRange: 15 + badIndex * 5,
          driftSpeed: 1.3 + sector * 0.025 + badIndex * 0.08,
          fallSpeed: 218 + sector * 3.4 + badIndex * 10,
          sector
        });
      }
    }
  }

  function buildCollectibles(total, worldWidth, groundY, kind) {
    if (kind === "stars") {
      const targets = state.platforms.filter((platform) => platform.starPlatform);
      targets.slice(0, total).forEach((platform, index) => {
        state.collectibles.push({
          x: platform.x + platform.w / 2,
          y: platform.y - 34,
          r: 17,
          kind,
          collected: false,
          bob: index * 0.57
        });
      });
      return;
    }

    const margin = 250;
    const usable = worldWidth - margin * 2;
    if (kind === "truth") {
      for (let index = 0; index < total; index += 1) {
        const platform = state.platforms.find((item) =>
          item.truthPlatform && item.collectibleSlot === index
        );
        state.collectibles.push({
          x: platform ? platform.x + platform.w / 2 : margin + (usable * index) / Math.max(1, total - 1),
          y: platform ? platform.y - 34 : groundY - 34,
          r: 17,
          kind,
          collected: false,
          bob: index * 0.57
        });
      }
      return;
    }

    for (let index = 0; index < total; index += 1) {
      const x = margin + (usable * index) / Math.max(1, total - 1);
      let y = groundY - 34;
      const platform = state.platforms.find((item) =>
        !item.base && x > item.x + 14 && x < item.x + item.w - 14
      );
      if (platform && index % 3 !== 0) y = platform.y - 34;
      state.collectibles.push({
        x,
        y,
        r: kind === "bibles" ? 22 : 17,
        kind,
        collected: false,
        bob: index * 0.57
      });
    }
  }

  function buildChains(total, worldWidth, groundY) {
    const margin = 320;
    const usable = worldWidth - margin * 2;
    const spacing = usable / Math.max(1, total - 1);
    const offsets = [-26, 24, -8, 34, -18, 12];
    let lastX = -Infinity;
    for (let index = 0; index < total; index += 1) {
      let x = margin + spacing * index + offsets[index % offsets.length];
      x = Math.max(x, lastX + 238);
      x = Math.min(x, worldWidth - margin);
      lastX = x;
      const platform = state.platforms
        .filter((item) => !item.base)
        .sort((a, b) =>
          Math.abs(a.x + a.w / 2 - x) - Math.abs(b.x + b.w / 2 - x)
        )[0];
      const usePlatform = platform &&
        index % 3 !== 0 &&
        Math.abs(platform.x + platform.w / 2 - x) < 190;
      const chainX = usePlatform
        ? clamp(x, platform.x + 22, platform.x + platform.w - 22)
        : x;
      state.chains.push({
        x: chainX,
        y: usePlatform ? platform.y - 34 : groundY - 36,
        broken: false,
        pulse: index * 0.31
      });
    }
  }

  function buildAscent() {
    const baseY = 4890;
    state.platforms.push({ x: 0, y: baseY, w: state.worldWidth, h: 110, base: true });

    const climbPlatforms = [];
    for (let index = 0; index < 25; index += 1) {
      const lane = index % 4;
      const x = lane === 0 ? 105 : lane === 1 ? 515 : lane === 2 ? 770 : 340;
      const y = 4735 - index * 94;
      const platform = {
        x,
        y,
        w: index % 5 === 0 ? 390 : 330,
        h: 17,
        climbPlatform: true
      };
      climbPlatforms.push(platform);
      state.platforms.push(platform);
    }

    const slopes = [
      { x: 115, y: 2400, w: 850, h: 22, slope: -145, slopeRun: true },
      { x: 315, y: 2110, w: 850, h: 22, slope: 145, slopeRun: true },
      { x: 115, y: 1980, w: 850, h: 22, slope: -145, slopeRun: true },
      { x: 315, y: 1690, w: 850, h: 22, slope: 145, slopeRun: true },
      { x: 115, y: 1560, w: 850, h: 22, slope: -145, slopeRun: true },
      { x: 315, y: 1270, w: 850, h: 22, slope: 145, slopeRun: true },
      { x: 115, y: 1140, w: 850, h: 22, slope: -145, slopeRun: true },
      { x: 315, y: 850, w: 850, h: 22, slope: 145, slopeRun: true },
      { x: 115, y: 720, w: 850, h: 22, slope: -145, slopeRun: true }
    ];
    const pillarSlopeIndexes = new Set([0, 2, 4, 6, 8]);
    slopes.forEach((platform, index) => {
      state.platforms.push(platform);
      if (!pillarSlopeIndexes.has(index)) return;
      const pillarNumber = state.pillars.length;
      const pillarX = index % 2 === 0
        ? platform.x + platform.w * 0.72
        : platform.x + platform.w * 0.28;
      state.pillars.push({
        x: pillarX,
        y: surfaceY(platform, pillarX) - 62,
        lit: false,
        color: ["#7cf7ff", "#ffe879", "#9cf58b", "#f2a0ff", "#ffffff"][pillarNumber],
        platform
      });
    });

    // Peldaños de enlace para que ningún cambio de piso supere el salto seguro.
    state.platforms.push({ x: 215, y: 2445, w: 300, h: 17, transition: true });
    state.platforms.push({ x: 115, y: 2045, w: 400, h: 17, transition: true });
    state.platforms.push({ x: 115, y: 1625, w: 400, h: 17, transition: true });
    state.platforms.push({ x: 115, y: 1205, w: 400, h: 17, transition: true });
    state.platforms.push({ x: 115, y: 785, w: 400, h: 17, transition: true });
    state.platforms.push({ x: 700, y: 565, w: 300, h: 17 });
    state.platforms.push({ x: 390, y: 500, w: 300, h: 17 });
    state.platforms.push({ x: 760, y: 505, w: 440, h: 17, transition: true, returnStep: true });
    state.platforms.push({ x: 0, y: 430, w: state.worldWidth, h: 24, base: true, final: true });

    const available = [...climbPlatforms, ...slopes];
    for (let index = 0; index < 20; index += 1) {
      const platform = available[Math.min(available.length - 1, Math.floor(index * available.length / 20))];
      const x = platform.x + 58 + ((index * 83) % Math.max(76, platform.w - 116));
      state.collectibles.push({
        x,
        y: surfaceY(platform, x) - 42,
        r: 25,
        kind: "virtue_sword",
        label: VIRTUES[index % VIRTUES.length],
        collected: false,
        bob: index * 0.53,
        platform
      });
    }

    resetPlayer(80, baseY - player.normalH);
    player.respawnPlatform = state.platforms[0];
    state.cameraY = state.worldHeight - H;
  }

  function resetPlayer(x, y) {
    player.x = x;
    player.y = y;
    player.w = 44;
    player.h = player.normalH;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.crouched = false;
    player.supportPlatform = null;
    player.respawnPlatform = null;
    player.respawnX = x;
    player.respawnY = y;
  }

  function loop(now) {
    const dt = Math.min(0.034, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (state.paused) return;
    state.elapsed += dt;
    state.damageCooldown = Math.max(0, state.damageCooldown - dt);
    state.lightCooldown = Math.max(0, state.lightCooldown - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.shake = Math.max(0, state.shake - dt);
    updateToast(dt);
    updateParticles(dt);
    updateReleases(dt);
    updateMusicFade(dt);

    if (!state.running) return;

    if (state.shieldTimer > 0) {
      const previousShieldTime = state.shieldTimer;
      state.shieldTimer = Math.max(0, state.shieldTimer - dt);
      if (previousShieldTime > 0 && state.shieldTimer === 0) {
        showToast("El escudo de luz se ha agotado.");
      }
    }
    if (state.dropThroughTimer > 0) {
      state.dropThroughTimer = Math.max(0, state.dropThroughTimer - dt);
      if (state.dropThroughTimer === 0) state.dropPlatform = null;
    }

    updatePlayer(dt);
    if (state.phase === 2) updateFallingPlatforms(dt);
    updateCamera(dt);
    collectNearby();
    handleLight();

    if (state.phase === 4) {
      updateWords(dt);
      updateObstacles();
    }

    if (state.phase <= 5) {
      updateShadowAttacks(dt);
    }
    if (state.phase === 3) {
      updateFireRain(dt);
    }
    if (state.phase === 5) {
      updateLightning(dt);
    }
    if (state.phase === 6) {
      updateAscentHazards(dt);
      checkFinalApproach();
      checkFinalDoor();
    }

    updateHazards(dt);
    checkFall();
  }

  function updatePlayer(dt) {
    const left = keys.has("left") || touch.left;
    const right = keys.has("right") || touch.right;
    const run = keys.has("run") || touch.run;
    const crouch = keys.has("crouch") || touch.crouch;
    const jump = keys.has("jump") || touch.jump;
    const direction = (right ? 1 : 0) - (left ? 1 : 0);
    const speed = run && !crouch ? 455 : 320;

    player.vx = approach(player.vx, direction * speed, (player.grounded ? 5200 : 2600) * dt);
    if (!direction) player.vx = approach(player.vx, 0, 4800 * dt);
    if (direction) player.facing = direction;

    if (crouch && !player.crouched && player.grounded) {
      player.crouched = true;
      const delta = player.normalH - player.crouchH;
      player.h = player.crouchH;
      player.y += delta;
    } else if (!crouch && player.crouched) {
      const delta = player.normalH - player.crouchH;
      player.crouched = false;
      player.h = player.normalH;
      player.y -= delta;
    }

    if (jump && player.grounded && !player.crouched) {
      player.vy = -820;
      player.grounded = false;
      touch.jump = false;
      keys.delete("jump");
      burst(player.x + player.w / 2, player.y + player.h, "#9fefff", 7);
    }

    const oldBottom = player.y + player.h;
    player.x += player.vx * dt;
    const gravity = player.vy < 0 ? 1850 : 2900;
    player.vy = Math.min(player.vy + gravity * dt, 1650);
    player.y += player.vy * dt;
    player.x = clamp(player.x, 0, state.worldWidth - player.w);
    player.grounded = false;
    player.supportPlatform = null;

    if (player.vy >= 0) {
      let bestSurface = Infinity;
      let bestPlatform = null;
      state.platforms.forEach((platform) => {
        if (!platformIsSolid(platform)) return;
        if (state.dropThroughTimer > 0 && platform === state.dropPlatform) return;
        const centerX = player.x + player.w / 2;
        if (player.x + player.w < platform.x + 4 || player.x > platform.x + platform.w - 4) return;
        const top = surfaceY(platform, centerX);
        const newBottom = player.y + player.h;
        if (oldBottom <= top + 12 && newBottom >= top && top < bestSurface) {
          bestSurface = top;
          bestPlatform = platform;
        }
      });
      if (bestSurface < Infinity) {
        player.y = bestSurface - player.h;
        player.vy = 0;
        player.grounded = true;
        player.supportPlatform = bestPlatform;
        if (bestPlatform?.collapses && !bestPlatform.fallTriggered) {
          bestPlatform.fallTriggered = true;
          bestPlatform.fallDelay = 0.52;
          state.shake = Math.max(state.shake, 0.16);
          showToast("¡La plataforma se está quebrando! Salta.");
        }
        if (
          (state.phase === 2 || state.phase === 6) &&
          !bestPlatform?.collapses &&
          player.respawnPlatform !== bestPlatform
        ) {
          const safeCenterX = bestPlatform.x + bestPlatform.w / 2;
          player.respawnPlatform = bestPlatform;
          player.respawnX = clamp(
            safeCenterX - player.w / 2,
            bestPlatform.x + 7,
            bestPlatform.x + bestPlatform.w - player.w - 7
          );
          player.respawnY = surfaceY(bestPlatform, safeCenterX) - player.normalH;
        }
        if (
          state.phase === 6 &&
          bestPlatform?.final &&
          (state.progress < 20 || state.secondary < 5) &&
          !state.finalReturnHintShown
        ) {
          state.finalReturnHintShown = true;
          showToast("Aún faltan espadas de virtud o pilares por activar.");
        }
      }
    }

    if (player.grounded && Math.abs(player.vx) > 15) {
      player.anim += dt * (run ? 17 : 14);
      player.frame = Math.floor(player.anim) % jesusFrames.length;
    } else {
      player.frame = 0;
    }

    if (
      state.phase !== 2 &&
      state.phase !== 6 &&
      player.grounded &&
      !player.supportPlatform?.collapses &&
      player.x > player.respawnX + 240
    ) {
      player.respawnX = player.x - 45;
      player.respawnY = player.y;
    }
  }

  function updateFallingPlatforms(dt) {
    state.platforms.forEach((platform) => {
      if (!platform.collapses || !platform.fallTriggered || platform.inactive) return;
      if (platform.fallDelay > 0) {
        platform.fallDelay = Math.max(0, platform.fallDelay - dt);
        return;
      }
      platform.fallVelocity = Math.min(980, platform.fallVelocity + 1500 * dt);
      platform.y += platform.fallVelocity * dt;
      if (platform.y > state.worldHeight + 120) platform.inactive = true;
    });
  }

  function updateCamera(dt) {
    const targetX = state.vertical
      ? clamp(player.x - W * 0.48, 0, Math.max(0, state.worldWidth - W))
      : clamp(player.x - W * 0.31, 0, Math.max(0, state.worldWidth - W));
    const targetY = state.vertical
      ? clamp(player.y - H * 0.68, 0, Math.max(0, state.worldHeight - H))
      : 0;
    state.cameraX += (targetX - state.cameraX) * Math.min(1, dt * 5.5);
    state.cameraY += (targetY - state.cameraY) * Math.min(1, dt * 5.5);
  }

  function collectNearby() {
    state.collectibles.forEach((item) => {
      if (item.collected) return;
      if (distance(player.x + player.w / 2, player.y + player.h / 2, item.x, item.y) < item.r + 38) {
        item.collected = true;
        if (item.kind === "shield_chest") {
          state.shieldTimer = item.duration || SHIELD_DURATION;
          burst(item.x, item.y, "#78eaff", 34);
          showToast(`Cofre abierto: escudo activo durante ${SHIELD_DURATION} segundos.`);
          return;
        }
        state.progress += 1;
        const isVirtue = item.kind === "virtue" || item.kind === "virtue_sword";
        burst(item.x, item.y, isVirtue ? "#b6ff8c" : "#ffe476", 18);
        showToast(isVirtue ? `${item.label}: espada de virtud recuperada.` : "¡La luz crece!");
        updateUI();
        if (state.phase < 4 && state.progress >= PHASES[state.phase - 1].total) {
          queuePhaseComplete();
        }
      }
    });
  }

  function isPlayerBesidePillar(pillar, promptRange = false) {
    if (!pillar) return false;
    const playerCenterX = player.x + player.w / 2;
    const playerFeetY = player.y + player.h;
    const pillarSurfaceY = pillar.platform
      ? surfaceY(pillar.platform, pillar.x)
      : pillar.y + 62;
    const horizontalLimit = promptRange ? 118 : 96;
    const verticalLimit = promptRange ? 52 : 38;
    return Math.abs(playerCenterX - pillar.x) <= horizontalLimit &&
      Math.abs(playerFeetY - pillarSurfaceY) <= verticalLimit;
  }

  function handleLight() {
    const active = keys.has("light") || touch.light;
    if (!active || state.lightCooldown > 0) return;
    state.lightCooldown = 0.38;
    touch.light = false;
    keys.delete("light");
    burst(player.x + player.w / 2, player.y + player.h / 2, "#fff4aa", 12);

    if (state.phase === 4) {
      showToast("En esta prueba, toca las palabras buenas que caen y esquiva las malas.");
    } else if (state.phase === 5) {
      const chain = state.chains
        .filter((item) => !item.broken)
        .sort((a, b) => distance(player.x, player.y, a.x, a.y) - distance(player.x, player.y, b.x, b.y))[0];
      if (chain && distance(player.x + player.w / 2, player.y + 25, chain.x, chain.y) < 132) {
        breakChain(chain);
      } else {
        showToast("Acércate a una cadena y vuelve a usar la luz.");
      }
    } else if (state.phase === 6) {
      const pillar = state.pillars
        .filter((item) => !item.lit && isPlayerBesidePillar(item, false))
        .sort((a, b) =>
          Math.abs(player.x + player.w / 2 - a.x) -
          Math.abs(player.x + player.w / 2 - b.x)
        )[0];
      if (pillar) {
        pillar.lit = true;
        state.secondary += 1;
        burst(pillar.x, pillar.y, pillar.color, 34);
        showToast(`Pilar ${state.secondary} de 5 encendido.`);
        updateUI();
      } else {
        showToast("La luz no alcanza ningún pilar cercano.");
      }
    }
  }

  function breakChain(chain) {
    chain.broken = true;
    state.progress += 1;
    burst(chain.x, chain.y, "#9eefff", 30);
    for (let index = 0; index < 10; index += 1) {
      state.releases.push(makeRelease(chain.x, chain.y, "soul", index));
      state.releases.push(makeRelease(chain.x, chain.y, "bible", index + 10));
    }
    showToast(`Cadena destruida: 10 almas y 10 Biblias liberadas.`);
    updateUI();
    if (state.progress >= 20) queuePhaseComplete();
  }

  function resolveWord(word) {
    if (!word || word.dead) return;
    word.dead = true;
    if (word.good) {
      state.progress += 1;
      burst(word.x, word.y, "#8dffab", 28);
      showToast(`${word.text}: palabra de vida recogida.`);
      updateUI();
      if (state.progress >= 20) queuePhaseComplete();
    } else {
      burst(word.x, word.y, "#ff668d", 20);
      damage(`${word.text}: una voz engañosa.`);
    }
  }

  function makeRelease(x, y, kind, index) {
    const angle = (Math.PI * 2 * index) / 20 + (kind === "bible" ? 0.18 : 0);
    const speed = 55 + (index % 5) * 13;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 65,
      life: 2.6,
      maxLife: 2.6,
      kind
    };
  }

  function updateWords(dt) {
    let activeGoodWords = state.words.filter((word) =>
      word.good && word.active && !word.dead
    ).length;

    state.words.forEach((word) => {
      if (word.dead) return;

      if (!word.triggered && player.x >= word.triggerX - 430) {
        word.triggered = true;
      }
      if (!word.triggered) return;

      if (!word.active) {
        word.activationDelay -= dt;
        if (word.activationDelay > 0) return;
        if (word.good && activeGoodWords >= 2) {
          word.activationDelay = 0.24;
          return;
        }
        word.active = true;
        if (word.good) activeGoodWords += 1;
        word.x = word.spawnX;
        word.y = -55 - (word.good ? 0 : (word.sector % 3) * 42);
      }

      word.pulse += dt * word.driftSpeed;
      word.x = word.spawnX + Math.sin(word.pulse) * word.driftRange;
      word.y += word.fallSpeed * dt;
      const touchingPlayer =
        word.x + 58 > player.x &&
        word.x - 58 < player.x + player.w &&
        word.y + 26 > player.y &&
        word.y - 26 < player.y + player.h;
      if (touchingPlayer) {
        resolveWord(word);
        return;
      }

      if (word.y > word.groundY + 55) {
        if (word.good) {
          activeGoodWords = Math.max(0, activeGoodWords - 1);
          word.active = false;
          word.triggered = false;
          word.activationDelay = 0.75;
          word.triggerX = Math.min(
            state.worldWidth - 180,
            Math.max(word.triggerX + 430, player.x + 620)
          );
          word.spawnX = clamp(
            word.triggerX + [-145, 95, -55, 135][word.sector % 4],
            95,
            state.worldWidth - 95
          );
          word.x = word.spawnX;
          word.y = -70;
        } else {
          word.dead = true;
        }
      }
    });
    state.words = state.words.filter((word) => !word.dead);
  }

  function updateObstacles() {
    state.obstacles.forEach((obstacle) => {
      if (rectsOverlap(player, obstacle) && !obstacle.hit) {
        obstacle.hit = true;
        damage("El obstáculo frenó el avance.");
        player.vx = -110 * player.facing;
        window.setTimeout(() => { obstacle.hit = false; }, 900);
      }
    });
  }

  function updateShadowAttacks(dt) {
    const config = PHASES[state.phase - 1];
    const progressRatio = state.phase === 4 || state.phase === 5
      ? state.progress / config.total
      : clamp(player.x / Math.max(1, state.worldWidth - W), 0, 1);
    state.hazardTimer -= dt;
    if (state.hazardTimer <= 0) {
      if (state.phase !== 3 || Math.random() < 0.48) {
        spawnShadowBolt(progressRatio);
      }
      const minInterval = state.phase === 1 ? 0.52 : 0.46;
      state.hazardTimer = lerp(2.15, minInterval, progressRatio) * (0.86 + Math.random() * 0.34);
    }
  }

  function spawnShadowBolt(progressRatio) {
    let x = Math.min(state.worldWidth - 30, state.cameraX + W - 70);
    let y = 135 + Math.random() * 270;
    const predictedX = player.x + player.w / 2 + player.vx * 0.34;
    const predictedY = player.y + player.h / 2 + Math.max(0, player.vy) * 0.08;
    if (state.phase === 4) {
      // Satanás acecha desde el lado derecho de la pantalla. En esta prueba
      // todos los poderes deben nacer de él y viajar hacia la posición de Jesús.
      x = Math.min(
        state.worldWidth - 30,
        state.cameraX + W - 104 + Math.sin(state.elapsed * 0.72) * 25
      );
      y = 232 + Math.sin(state.elapsed * 1.05) * 20 + Math.cos(state.elapsed * 0.43) * 7;
    }
    const targetX = clamp(predictedX, state.cameraX + 20, state.cameraX + W - 20);
    const targetY = clamp(predictedY, 80, 500);
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = 220 + progressRatio * 145;
    state.hazards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 11,
      kind: "shadow",
      life: 5
    });
  }

  function updateFireRain(dt) {
    const ratio = state.progress / 20;
    state.lightningTimer -= dt;
    if (state.lightningTimer <= 0) {
      const amount = ratio > 0.68 ? 3 : ratio > 0.28 ? 2 : 1;
      for (let index = 0; index < amount; index += 1) {
        spawnFireballFromAbove(ratio, index, amount);
      }
      state.lightningTimer = lerp(1.25, 0.24, ratio);
    }
  }

  function spawnFireballFromAbove(ratio, index, amount) {
    const lanes = [-1, 0, 1];
    const batchOffset = amount === 1 ? Math.floor(Math.random() * 3) : Math.floor(state.elapsed * 2.3) % 3;
    const lane = lanes[(index + batchOffset) % lanes.length];
    const targetX = clamp(
      player.x + player.w / 2 + lane * 235 + (Math.random() - 0.5) * 95,
      state.cameraX + 35,
      state.cameraX + W - 35
    );
    const x = clamp(
      targetX + (Math.random() - 0.5) * 210,
      state.cameraX + 25,
      state.cameraX + W - 25
    );
    const y = state.cameraY - 45 - index * 22;
    const targetY = player.y + player.h + 90 + Math.random() * 115;
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = 315 + ratio * 270 + Math.random() * 65;
    state.hazards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 17 + Math.random() * 5,
      kind: "fire",
      life: 5
    });
  }

  function updateLightning(dt) {
    const ratio = state.progress / 20;
    state.lightningTimer -= dt;
    if (state.lightningTimer <= 0) {
      state.lightning.push({
        x: clamp(player.x + (Math.random() - 0.5) * 430, state.cameraX + 30, state.cameraX + W - 30),
        timer: 0.82,
        struck: false
      });
      state.lightningTimer = lerp(3.1, 0.78, ratio);
    }
    state.lightning.forEach((bolt) => {
      bolt.timer -= dt;
      if (bolt.timer <= 0 && !bolt.struck) {
        bolt.struck = true;
        if (Math.abs(player.x + player.w / 2 - bolt.x) < 48) damage("Un rayo del Abismo alcanzó a Jesús.");
        burst(bolt.x, 300, "#f5ecff", 26);
      }
    });
    state.lightning = state.lightning.filter((bolt) => bolt.timer > -0.24);
  }

  function updateAscentHazards(dt) {
    if (state.finalApproach || player.y < 520) {
      state.hazards = [];
      state.boulders = [];
      return;
    }

    const climbRatio = 1 - player.y / state.worldHeight;
    state.hazardTimer -= dt;
    if (state.hazardTimer <= 0) {
      const x = clamp(player.x + (Math.random() - 0.5) * 520, 20, state.worldWidth - 20);
      const y = Math.max(30, state.cameraY + 40);
      const targetAngle = Math.atan2(player.y - y, player.x - x);
      state.hazards.push({
        x,
        y,
        vx: Math.cos(targetAngle) * (235 + climbRatio * 120),
        vy: Math.sin(targetAngle) * (235 + climbRatio * 120),
        r: 12,
        kind: "shadow",
        life: 5
      });
      state.hazardTimer = lerp(2.1, 0.64, climbRatio);
    }

    if (player.y < 2460 && player.y > 520) {
      state.boulderTimer -= dt;
      if (state.boulderTimer <= 0) {
        const visibleSlopes = state.platforms
          .filter((platform) =>
            platform.slopeRun &&
            platform.y + Math.abs(platform.slope) >= state.cameraY - 90 &&
            platform.y <= state.cameraY + H + 90
          )
          .sort((a, b) =>
            Math.abs(surfaceY(a, player.x + player.w / 2) - player.y) -
            Math.abs(surfaceY(b, player.x + player.w / 2) - player.y)
          );
        const platform = visibleSlopes[Math.floor(Math.random() * Math.min(2, visibleSlopes.length))];
        if (platform) {
          const direction = platform.slope > 0 ? 1 : -1;
          const x = direction > 0 ? platform.x + 25 : platform.x + platform.w - 25;
          const radius = 20 + Math.random() * 9;
          state.boulders.push({
            x,
            y: surfaceY(platform, x) - radius,
            vx: direction * (175 + climbRatio * 95 + Math.random() * 35),
            vy: 0,
            r: radius,
            life: 7,
            platform,
            slopeRolling: true,
            rotation: 0
          });
        }
        state.boulderTimer = 1.45 - climbRatio * 0.5;
      }
    }

    state.boulders.forEach((rock) => {
      if (rock.slopeRolling && rock.platform) {
        rock.x += rock.vx * dt;
        rock.y = surfaceY(rock.platform, rock.x) - rock.r;
        rock.rotation += rock.vx * dt / Math.max(1, rock.r);
        if (
          rock.x < rock.platform.x - rock.r ||
          rock.x > rock.platform.x + rock.platform.w + rock.r
        ) {
          rock.life = 0;
        }
      } else {
        rock.vy += 620 * dt;
        rock.x += rock.vx * dt;
        rock.y += rock.vy * dt;
      }
      rock.life -= dt;
      if (circleRectOverlap(rock, player)) {
        rock.life = 0;
        damage("Una roca del Abismo golpeó a Jesús.");
      }
    });
    state.boulders = state.boulders.filter((rock) => rock.life > 0 && rock.y < state.worldHeight + 100);
  }

  function updateHazards(dt) {
    state.hazards.forEach((hazard) => {
      hazard.x += hazard.vx * dt;
      hazard.y += hazard.vy * dt;
      hazard.life -= dt;
      if (circleRectOverlap(hazard, player)) {
        hazard.life = 0;
        damage(hazard.kind === "fire"
          ? "Una bola de fuego alcanzó a Jesús."
          : "Un poder maligno alcanzó a Jesús.");
      }
    });
    state.hazards = state.hazards.filter((hazard) =>
      hazard.life > 0 &&
      hazard.x > state.cameraX - 200 &&
      hazard.x < state.cameraX + W + 260 &&
      hazard.y > state.cameraY - 180 &&
      hazard.y < state.cameraY + H + 220
    );
  }

  function checkFall() {
    if (player.y < state.worldHeight + 100) return;
    damage("Jesús cayó, pero vuelve a levantarse.");
    const stablePlatform = player.respawnPlatform && platformIsSolid(player.respawnPlatform)
      ? player.respawnPlatform
      : null;
    const respawnX = stablePlatform
      ? clamp(
          stablePlatform.x + stablePlatform.w / 2 - player.w / 2,
          stablePlatform.x + 7,
          stablePlatform.x + stablePlatform.w - player.w - 7
        )
      : clamp(player.respawnX, 20, state.worldWidth - 80);
    const respawnY = stablePlatform
      ? surfaceY(stablePlatform, respawnX + player.w / 2) - player.normalH
      : clamp(player.respawnY, 20, state.worldHeight - 120);
    resetPlayer(
      respawnX,
      respawnY
    );
    player.respawnPlatform = stablePlatform;
    if (state.vertical) state.cameraY = clamp(player.y - H * 0.68, 0, state.worldHeight - H);
  }

  function checkFinalApproach() {
    if (state.finalApproach || state.progress < 20 || state.secondary < 5) return;
    if (player.y < 430 && player.x > 910) {
      state.finalApproach = true;
      state.running = false;
      state.hazards = [];
      state.boulders = [];
      state.lightning = [];
      state.musicFade = 4;
      state.finalFloorMusicActive = true;
      ui.finalMusic.currentTime = 0;
      ui.finalMusic.volume = 0;
      if (state.soundUnlocked && canPlayAudio()) {
        ui.finalMusic.play().catch(() => {});
      }
      showToast("El Abismo guarda silencio. Jesús se acerca a Satanás.");
      window.setTimeout(startDialogue, 4200);
    }
  }

  function stopDialogueTyping(revealText = true) {
    if (state.dialogueTypingTimer) {
      window.clearInterval(state.dialogueTypingTimer);
      state.dialogueTypingTimer = null;
    }
    if (revealText && state.dialogueTypingText) {
      ui.dialogueText.textContent = state.dialogueTypingText;
    }
    ui.dialogueText?.classList.remove("typing");
    if (ui.dialogueNext) ui.dialogueNext.disabled = false;
  }

  function startDialogue() {
    state.dialogueStep = 0;
    showDialogueStep();
    ui.dialogue.classList.add("visible");
  }

  function showDialogueStep() {
    const line = DIALOGUE[state.dialogueStep];
    stopDialogueTyping(false);
    ui.dialogueSpeaker.textContent = line.speaker;
    ui.dialogueTitle.textContent = line.title;
    ui.dialogueText.textContent = "";
    ui.dialogueReference.textContent = line.reference;
    ui.dialogueNext.textContent = state.dialogueStep === DIALOGUE.length - 1
      ? "Abrir el camino"
      : "Continuar";
    ui.dialogueNext.disabled = true;
    ui.dialogueText.classList.add("typing");
    state.dialogueTypingText = line.text;
    let characterIndex = 0;
    state.dialogueTypingTimer = window.setInterval(() => {
      characterIndex += 1;
      ui.dialogueText.textContent = line.text.slice(0, characterIndex);
      if (characterIndex >= line.text.length) stopDialogueTyping(true);
    }, 31);
  }

  function advanceDialogue() {
    if (state.dialogueTypingTimer) {
      stopDialogueTyping(true);
      return;
    }
    if (state.dialogueStep < DIALOGUE.length - 1) {
      state.dialogueStep += 1;
      showDialogueStep();
      return;
    }
    ui.dialogue.classList.remove("visible");
    state.satanGone = true;
    state.doorActive = true;
    state.running = true;
    burst(state.finalSatan.x, state.finalSatan.y, "#b778ff", 90);
    showToast("La oscuridad se retira. Cruza la puerta de luz.");
    canvas.focus();
  }

  function checkFinalDoor() {
    if (!state.doorActive || state.doorEntered) return;
    const door = state.finalDoor;
    const playerCenterX = player.x + player.w / 2;
    const playerFeet = player.y + player.h;
    if (Math.abs(playerCenterX - door.x) > 48 || Math.abs(playerFeet - door.y) > 76) return;
    state.doorEntered = true;
    state.running = false;
    burst(door.x, door.y - door.h * 0.45, "#fff3a0", 90);
    showToast("Jesús atraviesa la puerta. La Luz ha vencido.");
    window.setTimeout(completeAdventure, 950);
  }

  function queuePhaseComplete() {
    if (!state.running || state.phase === 6) return;
    state.running = false;
    const finished = state.phase;
    const config = PHASES[finished - 1];
    const grantsRecovery = finished >= 2 && finished <= 5;
    if (grantsRecovery) {
      state.resistance = Math.min(100, state.resistance + 10);
      updateResistance();
    }
    state.shieldTimer = 0;
    state.completed.add(finished);
    saveCheckpoint(finished + 1);
    burst(player.x, player.y, "#ffe979", 45);
    ui.phaseKicker.textContent = `Prueba ${finished} superada · Punto de guardado`;
    ui.phaseCardTitle.textContent = config.success;
    ui.phaseCardMessage.textContent = grantsRecovery
      ? `${config.verse} Recuperación: +10% de resistencia (máximo 100%). Prepárate para la prueba ${finished + 1} de 6.`
      : `${config.verse} Prepárate para la prueba ${finished + 1} de 6.`;
    window.setTimeout(() => ui.phaseOverlay.classList.add("visible"), 700);
  }

  function continueToNextPhase() {
    ui.phaseOverlay.classList.remove("visible");
    setupPhase(state.phase + 1);
    state.running = true;
    canvas.focus();
  }

  function retryPhase() {
    ui.defeat.classList.remove("visible");
    state.resistance = 50;
    setupPhase(state.phase);
    state.running = true;
    saveCheckpoint(state.phase);
    showToast("La esperanza te ayuda a levantarte con 50% de resistencia.");
    canvas.focus();
  }

  function completeAdventure() {
    state.running = false;
    window.parent.postMessage({ type: "nivel10-completado" }, window.location.origin);
    localStorage.removeItem(SAVE_KEY);
    try {
      const progress = JSON.parse(localStorage.getItem(MAIN_PROGRESS_KEY) || "{}");
      progress.level10Completed = true;
      progress.highestLevel = Math.max(10, Number(progress.highestLevel) || 0);
      progress.currentLevel = 10;
      progress.label = "Aventura completada · La esperanza está viva";
      progress.updatedAt = new Date().toISOString();
      localStorage.setItem(MAIN_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      localStorage.setItem(MAIN_PROGRESS_KEY, JSON.stringify({
        level10Completed: true,
        highestLevel: 10,
        currentLevel: 10
      }));
    }
    ui.music.pause();
    ui.finalMusic.pause();
    if (canPlayAudio()) {
      ui.creditsMusic.volume = creditsMusicVolume();
      ui.creditsMusic.currentTime = 0;
      ui.creditsMusic.play().catch(() => {});
    }
    ui.victory.classList.add("visible");
  }

  function damage(message) {
    if (state.damageCooldown > 0 || !state.running) return;
    if (state.shieldTimer > 0) {
      state.damageCooldown = 0.34;
      state.flash = 0.08;
      burst(player.x + player.w / 2, player.y + player.h / 2, "#82efff", 18);
      showToast(`El escudo bloqueó el ataque · ${state.shieldTimer.toFixed(1)} s`);
      return;
    }
    state.damageCooldown = 0.95;
    state.resistance = Math.max(0, state.resistance - DAMAGE_PERCENT);
    state.flash = 0.32;
    state.shake = 0.36;
    showToast(`−${DAMAGE_PERCENT}% · ${message}`);
    updateResistance();
    if (state.resistance <= 0) {
      state.running = false;
      saveCheckpoint(state.phase);
      window.setTimeout(() => ui.defeat.classList.add("visible"), 400);
    }
  }

  function updateUI() {
    const config = PHASES[state.phase - 1];
    ui.phaseTitle.textContent = `Prueba ${state.phase} de 6 · ${config.name}`;
    ui.phaseObjective.textContent = config.objective;
    ui.counter.textContent = state.phase === 6
      ? `✦ ${state.progress}/20 · ◉ ${state.secondary}/5`
      : `✦ ${state.progress} / ${config.total}`;
    ui.checkpoint.textContent = state.phase > 1 ? "✓ Guardado" : "Guardado automático";
    updateResistance();
  }

  function updateResistance() {
    const value = clamp(state.resistance, 0, 100);
    ui.resistanceValue.textContent = `${Math.round(value)}%`;
    ui.resistanceFill.style.width = `${value}%`;
    ui.resistanceFill.style.background = value < 30
      ? "linear-gradient(90deg, #ff5f63, #ffb84f)"
      : value < 60
        ? "linear-gradient(90deg, #f5b83c, #f5e96d)"
        : "linear-gradient(90deg, #55d982, #c6f967)";
    ui.resistanceTrack.setAttribute("aria-valuenow", String(Math.round(value)));
  }

  function saveCheckpoint(phase) {
    const payload = {
      phase: clamp(phase, 1, 6),
      resistance: Math.max(1, state.resistance),
      updatedAt: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  function loadCheckpoint() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!saved) return null;
      return {
        phase: clamp(Number(saved.phase) || 1, 1, 6),
        resistance: clamp(Number(saved.resistance) || 100, 1, 100)
      };
    } catch {
      return null;
    }
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("visible");
    state.toastTimer = 2.5;
  }

  function updateToast(dt) {
    if (state.toastTimer <= 0) return;
    state.toastTimer -= dt;
    if (state.toastTimer <= 0) ui.toast.classList.remove("visible");
  }

  function updateMusicFade(dt) {
    if (state.musicFade <= 0) return;
    state.musicFade = Math.max(0, state.musicFade - dt);
    const transition = 1 - state.musicFade / 4;
    ui.music.volume = levelMusicVolume() * (1 - transition);
    ui.finalMusic.volume = finalMusicVolume() * transition;
    if (state.musicFade <= 0) {
      ui.music.pause();
      ui.music.volume = levelMusicVolume();
      ui.finalMusic.volume = finalMusicVolume();
    }
  }

  function updateParticles(dt) {
    state.particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 80 * dt;
      particle.life -= dt;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function updateReleases(dt) {
    state.releases.forEach((item) => {
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy -= 8 * dt;
      item.life -= dt;
    });
    state.releases = state.releases.filter((item) => item.life > 0);
  }

  function burst(x, y, color, amount) {
    for (let index = 0; index < amount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 140;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.75,
        maxLife: 1.2,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawWatchingSouls();

    const quake = state.phase === 3 && state.running
      ? 3.2 + Math.sin(state.elapsed * 0.8) * 1.2
      : 0;
    const shakeX =
      (state.shake > 0 ? (Math.random() - 0.5) * 9 : 0) +
      (quake ? Math.sin(state.elapsed * 21) * quake : 0);
    const shakeY =
      (state.shake > 0 ? (Math.random() - 0.5) * 7 : 0) +
      (quake ? Math.cos(state.elapsed * 17) * quake * 0.65 : 0);
    ctx.save();
    ctx.translate(-state.cameraX + shakeX, -state.cameraY + shakeY);
    drawPlatforms();
    drawObstacles();
    drawCollectibles();
    drawChains();
    drawPillars();
    drawWords();
    drawLightning();
    drawHazards();
    drawBoulders();
    drawReleases();
    drawFinalSatan();
    drawExitDoor();
    drawPlayer();
    drawParticles();
    ctx.restore();

    drawPhaseAtmosphere();
    drawStalkingSatan();
    drawActionPrompt();
    drawDropHint();

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 73, 88, ${state.flash * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }
    drawProgressDistance();
    drawShieldStatus();
  }

  function drawActionPrompt() {
    let target = null;
    if (state.phase === 5) {
      target = state.chains
        .filter((item) => !item.broken)
        .sort((a, b) =>
          distance(player.x, player.y, a.x, a.y) -
          distance(player.x, player.y, b.x, b.y)
        )[0];
    } else if (state.phase === 6) {
      target = state.pillars
        .filter((item) => !item.lit && isPlayerBesidePillar(item, true))
        .sort((a, b) =>
          Math.abs(player.x + player.w / 2 - a.x) -
          Math.abs(player.x + player.w / 2 - b.x)
        )[0];
    }
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const targetIsNear = state.phase === 5
      ? target && distance(playerCenterX, playerCenterY, target.x, target.y) <= 165
      : Boolean(target);
    if (!targetIsNear) return;

    const label = "E / ACCIÓN";
    const promptX = target.x;
    const promptY = target.y - 78;
    const x = clamp(promptX - state.cameraX, 70, W - 70);
    const y = clamp(promptY - state.cameraY, 42, H - 82);
    const promptWidth = 116;
    const pulse = 1 + Math.sin(state.elapsed * 5.5) * 0.04;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(20, 27, 61, .95)";
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ffe36e";
    ctx.shadowBlur = 14;
    roundRect(ctx, -promptWidth / 2, -20, promptWidth, 40, 13);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff8cf";
    ctx.font = "900 15px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  function drawDropHint() {
    if (state.phase !== 6 || state.finalApproach) return;
    const width = 214;
    const x = 14;
    const y = H - 42;
    ctx.save();
    ctx.fillStyle = "rgba(11, 19, 48, .83)";
    ctx.strokeStyle = "rgba(123, 229, 255, .8)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, width, 28, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8fbff";
    ctx.font = "800 12px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↓↓ dos veces: bajar de plataforma", x + width / 2, y + 14);
    ctx.restore();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    if (state.phase === 3) {
      gradient.addColorStop(0, "#351027");
      gradient.addColorStop(0.55, "#170d27");
      gradient.addColorStop(1, "#06081b");
    } else if (state.phase === 6) {
      const climb = 1 - state.cameraY / Math.max(1, state.worldHeight - H);
      gradient.addColorStop(0, mixColor("#130925", "#314d75", climb));
      gradient.addColorStop(0.6, mixColor("#0b0921", "#1a2b4a", climb));
      gradient.addColorStop(1, "#060819");
    } else {
      gradient.addColorStop(0, "#180925");
      gradient.addColorStop(0.58, "#100b28");
      gradient.addColorStop(1, "#07091c");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(176, 150, 255, 0.28)";
    for (let index = 0; index < 55; index += 1) {
      const x = (index * 173 + state.phase * 43) % W;
      const y = (index * 79 + state.phase * 19) % Math.floor(H * 0.72);
      const alpha = 0.13 + (index % 4) * 0.05;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, 0.7 + (index % 3) * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const abyss = ctx.createLinearGradient(0, H * 0.62, 0, H);
    abyss.addColorStop(0, "rgba(65, 18, 77, 0.18)");
    abyss.addColorStop(1, "rgba(0, 0, 12, 0.82)");
    ctx.fillStyle = abyss;
    ctx.fillRect(0, H * 0.58, W, H * 0.42);
  }

  function drawWatchingSouls() {
    ctx.save();
    state.souls.forEach((soul) => {
      const screenX = soul.x - state.cameraX;
      const screenY = soul.y - state.cameraY + Math.sin(state.elapsed * 0.7 + soul.drift) * 7;
      if (screenX < -20 || screenX > W + 20 || screenY < 30 || screenY > H - 30) return;
      ctx.globalAlpha = soul.alpha;
      ctx.fillStyle = "#d7dbff";
      ctx.beginPath();
      ctx.arc(screenX, screenY - soul.size * 0.55, soul.size * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - soul.size * 0.2);
      ctx.quadraticCurveTo(screenX - soul.size, screenY + soul.size * 1.2, screenX, screenY + soul.size);
      ctx.quadraticCurveTo(screenX + soul.size, screenY + soul.size * 1.2, screenX, screenY - soul.size * 0.2);
      ctx.fill();
      const eyeY = screenY - soul.size * 0.61;
      const eyeOffset = soul.size * 0.13;
      const eyeRadius = Math.max(1.45, soul.size * 0.075);
      ctx.globalAlpha = Math.min(0.72, soul.alpha + 0.32);
      ctx.fillStyle = "#21132f";
      ctx.beginPath();
      ctx.arc(screenX - eyeOffset, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + eyeOffset, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.min(0.9, soul.alpha + 0.52);
      ctx.fillStyle = "#ffffff";
      const shine = Math.max(0.48, eyeRadius * 0.32);
      ctx.beginPath();
      ctx.arc(screenX - eyeOffset - eyeRadius * 0.28, eyeY - eyeRadius * 0.3, shine, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + eyeOffset - eyeRadius * 0.28, eyeY - eyeRadius * 0.3, shine, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPhaseAtmosphere() {
    if (state.phase === 1) {
      const playerX = player.x - state.cameraX + player.w / 2;
      const playerY = player.y - state.cameraY + player.h / 2;
      const recovery = clamp(state.progress / 15, 0, 1);
      const radius = lerp(105, 175, recovery);
      const darkness = lerp(0.93, 0.72, recovery);
      const veil = ctx.createRadialGradient(playerX, playerY, 16, playerX, playerY, radius);
      veil.addColorStop(0, "rgba(0,0,8,0.02)");
      veil.addColorStop(0.26, "rgba(0,0,10,0.10)");
      veil.addColorStop(0.58, `rgba(0,0,12,${darkness * 0.72})`);
      veil.addColorStop(1, `rgba(0,0,12,${darkness})`);
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
    } else if (state.phase === 3) {
      const pulse = 0.18 + (Math.sin(state.elapsed * 5.2) + 1) * 0.035;
      const heat = ctx.createLinearGradient(0, 0, 0, H);
      heat.addColorStop(0, `rgba(150,18,10,${pulse})`);
      heat.addColorStop(0.55, "rgba(105,5,14,0.14)");
      heat.addColorStop(1, "rgba(255,53,14,0.20)");
      ctx.fillStyle = heat;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawStalkingSatan() {
    // En la parte superior de la prueba 6 se dibuja exclusivamente el Satanás
    // del encuentro final; ocultar aquí al perseguidor evita la imagen duplicada.
    if (state.satanGone || (state.phase === 6 && player.y < 1100)) return;
    const ratio = state.phase === 6
      ? 1 - player.y / state.worldHeight
      : clamp(player.x / Math.max(1, state.worldWidth), 0, 1);
    const x = W - 104 + Math.sin(state.elapsed * 0.72) * 25;
    const y = 232 + Math.sin(state.elapsed * 1.05) * 20 + Math.cos(state.elapsed * 0.43) * 7;
    const breathe = 1 + Math.sin(state.elapsed * 2.1) * 0.035;
    const sway = Math.sin(state.elapsed * 0.86) * 0.055;
    const armWave = Math.sin(state.elapsed * 1.65) * 13;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    ctx.scale(1 / breathe, breathe);
    ctx.globalAlpha = 0.78 + ratio * 0.16;
    const auraRadius = 128 + Math.sin(state.elapsed * 2.35) * 10;
    const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, auraRadius);
    aura.addColorStop(0, "rgba(244, 126, 255, .92)");
    aura.addColorStop(0.34, "rgba(178, 66, 238, .58)");
    aura.addColorStop(0.72, "rgba(91, 25, 155, .26)");
    aura.addColorStop(1, "rgba(25, 2, 44, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(-145, -155, 290, 320);
    ctx.strokeStyle = "rgba(205, 104, 250, .66)";
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.shadowColor = "#d961ff";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(-34, -2);
    ctx.quadraticCurveTo(-77, 22 + armWave * 0.35, -61, 77 + armWave);
    ctx.moveTo(34, -2);
    ctx.quadraticCurveTo(77, 22 - armWave * 0.35, 61, 77 - armWave);
    ctx.stroke();
    ctx.shadowColor = "#d961ff";
    ctx.shadowBlur = 34;
    ctx.fillStyle = "#26103a";
    ctx.strokeStyle = "rgba(229, 132, 255, .88)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 30, 51, 111, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -45, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "#ff9aff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-18, -50);
    ctx.lineTo(-7, -44);
    ctx.moveTo(18, -50);
    ctx.lineTo(7, -44);
    ctx.stroke();
    ctx.fillStyle = "#fff2ff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 11;
    ctx.beginPath();
    ctx.arc(-11, -47, 2.2, 0, Math.PI * 2);
    ctx.arc(11, -47, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlatforms() {
    state.platforms.forEach((platform) => {
      if (platform.inactive) return;
      if (!isWorldVisible(platform.x, platform.y, platform.w, Math.abs(platform.slope || 0) + platform.h + 10)) return;
      ctx.save();
      const visibility = platformVisibility(platform);
      ctx.globalAlpha = visibility;
      const topColor = platform.final ? "#d8b86c" : platform.base ? "#6d87a3" : "#72e3f4";
      const bodyColor = platform.final ? "#4d2f2b" : platform.base ? "#24344e" : "#25324f";
      if (platform.slope) {
        ctx.beginPath();
        ctx.moveTo(platform.x, platform.y);
        ctx.lineTo(platform.x + platform.w, platform.y + platform.slope);
        ctx.lineTo(platform.x + platform.w, platform.y + platform.slope + platform.h);
        ctx.lineTo(platform.x, platform.y + platform.h);
        ctx.closePath();
        ctx.fillStyle = bodyColor;
        ctx.fill();
        ctx.strokeStyle = topColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(platform.x, platform.y);
        ctx.lineTo(platform.x + platform.w, platform.y + platform.slope);
        ctx.stroke();
      } else {
        ctx.fillStyle = bodyColor;
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.fillStyle = topColor;
        ctx.fillRect(platform.x, platform.y, platform.w, platform.base ? 6 : 5);
        if (!platform.base) {
          ctx.shadowColor = topColor;
          ctx.shadowBlur = 10;
          ctx.fillRect(platform.x + 6, platform.y + 1, platform.w - 12, 2);
        }
      }
      if (platform.deceptive) {
        const glitch = 1 - visibility;
        ctx.globalAlpha = Math.max(0.22, visibility);
        ctx.strokeStyle = `rgba(255,94,128,${0.34 + glitch * 0.58})`;
        ctx.lineWidth = 2;
        for (let index = 0; index < 4; index += 1) {
          const offset = Math.sin(state.elapsed * 28 + index * 2.1 + platform.deceptionOffset) * (3 + glitch * 12);
          const y = platform.y + 3 + index * 3.4;
          ctx.beginPath();
          ctx.moveTo(platform.x + 8 + offset, y);
          ctx.lineTo(platform.x + platform.w - 8 + offset, y);
          ctx.stroke();
        }
      }
      if (platform.collapses) {
        const warning = platform.fallTriggered
          ? 0.68 + Math.sin(state.elapsed * 23) * 0.28
          : 0.46;
        ctx.globalAlpha = warning;
        ctx.strokeStyle = platform.fallTriggered ? "#ff8f77" : "#c8efff";
        ctx.lineWidth = 2;
        const center = platform.x + platform.w / 2;
        ctx.beginPath();
        ctx.moveTo(center - 34, platform.y + 2);
        ctx.lineTo(center - 17, platform.y + 9);
        ctx.lineTo(center - 4, platform.y + 4);
        ctx.lineTo(center + 10, platform.y + 13);
        ctx.moveTo(center + 2, platform.y + 3);
        ctx.lineTo(center + 23, platform.y + 10);
        ctx.lineTo(center + 37, platform.y + 4);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawObstacles() {
    state.obstacles.forEach((obstacle) => {
      if (!isWorldVisible(obstacle.x, obstacle.y, obstacle.w, obstacle.h)) return;
      if (obstacle.type === "spikes") {
        ctx.fillStyle = "#ad6670";
        const count = 4;
        for (let index = 0; index < count; index += 1) {
          const x = obstacle.x + index * obstacle.w / count;
          ctx.beginPath();
          ctx.moveTo(x, obstacle.y + obstacle.h);
          ctx.lineTo(x + obstacle.w / count / 2, obstacle.y);
          ctx.lineTo(x + obstacle.w / count, obstacle.y + obstacle.h);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#87552f";
        ctx.strokeStyle = "#c98a4b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.h);
        ctx.lineTo(obstacle.x + 8, obstacle.y + 7);
        ctx.lineTo(obstacle.x + obstacle.w * 0.65, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.w, obstacle.y + obstacle.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(245, 193, 116, .46)";
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.w * 0.6, obstacle.y + obstacle.h * 0.42, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawCollectibles() {
    state.collectibles.forEach((item) => {
      if (item.collected || !isWorldVisible(item.x - 35, item.y - 35, 70, 70)) return;
      const y = item.y + Math.sin(state.elapsed * 2.7 + item.bob) * 6;
      if (item.kind === "shield_chest") {
        drawShieldChest(item.x, y);
      } else if (item.kind === "bibles") {
        drawBible(item.x, y, 0.9);
      } else if (item.kind === "virtue") {
        drawVirtue(item.x, y, item.label);
      } else if (item.kind === "virtue_sword") {
        drawVirtueSword(item.x, item.y, item.label);
      } else {
        drawLightStar(item.x, y, item.kind === "truth" ? "#fff6a3" : "#ffe169", item.kind === "truth");
      }
    });
  }

  function drawShieldChest(x, y) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
    glow.addColorStop(0, "rgba(220, 253, 255, .95)");
    glow.addColorStop(0.42, "rgba(74, 222, 255, .38)");
    glow.addColorStop(1, "rgba(74, 222, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-50, -50, 100, 100);

    ctx.shadowColor = "#75edff";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#75411f";
    ctx.strokeStyle = "#ffe477";
    ctx.lineWidth = 3;
    roundRect(ctx, -28, -8, 56, 31, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#9a5928";
    ctx.beginPath();
    ctx.moveTo(-27, -7);
    ctx.quadraticCurveTo(-22, -27, 0, -28);
    ctx.quadraticCurveTo(22, -27, 27, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe477";
    ctx.fillRect(-4, -26, 8, 49);
    ctx.fillStyle = "#35bce7";
    ctx.strokeStyle = "#eaffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#dffcff";
    ctx.font = "900 10px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("ESCUDO", 0, 39);
    ctx.restore();
  }

  function drawLightStar(x, y, color, halo) {
    ctx.save();
    if (halo) {
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 34);
      glow.addColorStop(0, "rgba(255,255,220,.9)");
      glow.addColorStop(1, "rgba(255,224,90,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 36, y - 36, 72, 72);
    }
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    starPath(x, y, 5, 18, 8);
    ctx.fill();
    ctx.restore();
  }

  function drawBible(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor = "#ffd96a";
    ctx.shadowBlur = 13;
    ctx.fillStyle = "#7e3d63";
    roundRect(ctx, -19, -24, 38, 48, 6);
    ctx.fill();
    ctx.fillStyle = "#e8c977";
    ctx.fillRect(-14, -20, 3, 40);
    ctx.fillRect(-3, -11, 6, 22);
    ctx.fillRect(-9, -5, 18, 5);
    ctx.strokeStyle = "#fff0a6";
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -23, 36, 46);
    ctx.restore();
  }

  function drawVirtue(x, y, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#9df88c";
    ctx.shadowColor = "#aaff9b";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b5334";
    ctx.font = "900 11px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.slice(0, 2), 0, 1);
    ctx.restore();
  }

  function drawVirtueSword(x, y, label) {
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, -17, 2, 0, -17, 48);
    glow.addColorStop(0, "rgba(187,255,151,.9)");
    glow.addColorStop(1, "rgba(141,255,126,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-52, -68, 104, 100);

    ctx.shadowColor = "#aaff91";
    ctx.shadowBlur = 13;
    ctx.fillStyle = "#e9fff0";
    ctx.strokeStyle = "#6fdc82";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(-7, -25);
    ctx.lineTo(0, -39);
    ctx.lineTo(7, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#f7d46e";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-14, 17);
    ctx.lineTo(14, 17);
    ctx.stroke();
    ctx.fillStyle = "#8d5a30";
    ctx.fillRect(-4, 17, 8, 24);

    ctx.font = "900 11px Trebuchet MS";
    const labelWidth = Math.max(58, Math.ceil(ctx.measureText(label).width + 16));
    ctx.fillStyle = "rgba(35, 91, 51, .96)";
    ctx.strokeStyle = "#caff9f";
    ctx.lineWidth = 2;
    roundRect(ctx, -labelWidth / 2, -62, labelWidth, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, -51);
    ctx.restore();
  }

  function drawChains() {
    state.chains.forEach((chain) => {
      if (chain.broken || !isWorldVisible(chain.x - 30, chain.y - 35, 60, 70)) return;
      ctx.save();
      ctx.translate(chain.x, chain.y + Math.sin(state.elapsed * 2 + chain.pulse) * 3);
      ctx.strokeStyle = "#a2b6c6";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#a178ff";
      ctx.shadowBlur = 10;
      for (let index = -2; index <= 2; index += 1) {
        ctx.beginPath();
        ctx.ellipse(0, index * 12, 9, 6, index % 2 ? Math.PI / 2 : 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawPillars() {
    state.pillars.forEach((pillar) => {
      if (!isWorldVisible(pillar.x - 35, pillar.y - 70, 70, 100)) return;
      ctx.save();
      ctx.translate(pillar.x, pillar.y);
      ctx.fillStyle = pillar.lit ? "#fff5c2" : "#413b62";
      ctx.fillRect(-17, 5, 34, 57);
      ctx.fillStyle = pillar.lit ? pillar.color : "#6f668d";
      ctx.fillRect(-25, 57, 50, 9);
      ctx.beginPath();
      ctx.arc(0, 0, pillar.lit ? 20 : 14, 0, Math.PI * 2);
      ctx.fill();
      if (pillar.lit) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = pillar.color;
        ctx.beginPath();
        ctx.moveTo(-30, 60);
        ctx.lineTo(-8, -165);
        ctx.lineTo(8, -165);
        ctx.lineTo(30, 60);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawWords() {
    state.words.forEach((word) => {
      if (word.dead || !word.active || !isWorldVisible(word.x - 70, word.y - 30, 140, 60)) return;
      ctx.save();
      ctx.translate(word.x, word.y + Math.sin(word.pulse) * 4);
      ctx.font = "900 14px Trebuchet MS";
      const boxWidth = Math.max(58, Math.ceil(ctx.measureText(word.text).width + 18));
      const boxHeight = 30;
      ctx.fillStyle = word.good ? "rgba(48,124,82,.9)" : "rgba(116,38,78,.92)";
      ctx.strokeStyle = word.good ? "#8cffae" : "#ff8cb3";
      ctx.lineWidth = 2;
      roundRect(ctx, -boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(word.text, 0, 1);
      ctx.restore();
    });
  }

  function drawLightning() {
    state.lightning.forEach((bolt) => {
      const screenVisible = bolt.x >= state.cameraX - 50 && bolt.x <= state.cameraX + W + 50;
      if (!screenVisible) return;
      const ground = 486;
      if (bolt.timer > 0) {
        ctx.fillStyle = `rgba(255, 234, 113, ${0.25 + Math.abs(Math.sin(bolt.timer * 18)) * 0.45})`;
        ctx.fillRect(bolt.x - 24, ground - 7, 48, 7);
      } else {
        ctx.strokeStyle = "#efffff";
        ctx.lineWidth = 7;
        ctx.shadowColor = "#b177ff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(bolt.x, 0);
        ctx.lineTo(bolt.x - 18, 145);
        ctx.lineTo(bolt.x + 12, 245);
        ctx.lineTo(bolt.x - 5, ground);
        ctx.stroke();
      }
    });
  }

  function drawHazards() {
    state.hazards.forEach((hazard) => {
      ctx.save();
      ctx.translate(hazard.x, hazard.y);
      if (hazard.kind === "fire") {
        const fire = ctx.createRadialGradient(-5, -5, 1, 0, 0, hazard.r * 1.6);
        fire.addColorStop(0, "#fff5a4");
        fire.addColorStop(0.35, "#ff7a32");
        fire.addColorStop(1, "rgba(135,22,47,0)");
        ctx.fillStyle = fire;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.r * 1.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#8e2c9e";
        ctx.shadowColor = "#e969ff";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d678ec";
        ctx.lineWidth = 2;
        for (let index = 0; index < 6; index += 1) {
          const angle = index * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * hazard.r, Math.sin(angle) * hazard.r);
          ctx.lineTo(Math.cos(angle) * hazard.r * 1.6, Math.sin(angle) * hazard.r * 1.6);
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  function drawBoulders() {
    state.boulders.forEach((rock) => {
      ctx.save();
      ctx.translate(rock.x, rock.y);
      ctx.rotate(Number.isFinite(rock.rotation) ? rock.rotation : state.elapsed * 2.5);
      ctx.fillStyle = "#633e3d";
      ctx.strokeStyle = "#e87343";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let index = 0; index < 9; index += 1) {
        const angle = index * Math.PI * 2 / 9;
        const radius = rock.r * (index % 2 ? 0.86 : 1);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (!index) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawReleases() {
    state.releases.forEach((item) => {
      ctx.save();
      ctx.globalAlpha = clamp(item.life / item.maxLife, 0, 1);
      if (item.kind === "bible") {
        drawBible(item.x, item.y, 0.36);
      } else {
        ctx.fillStyle = "#e7edff";
        ctx.beginPath();
        ctx.arc(item.x, item.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.quadraticCurveTo(item.x - 8, item.y + 14, item.x, item.y + 12);
        ctx.quadraticCurveTo(item.x + 8, item.y + 14, item.x, item.y);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawFinalSatan() {
    if (state.phase !== 6 || state.satanGone || !isWorldVisible(state.finalSatan.x - 70, state.finalSatan.y - 160, 140, 190)) return;
    const { x, y } = state.finalSatan;
    const hoverX = Math.sin(state.elapsed * 0.72) * 11;
    const hoverY = Math.sin(state.elapsed * 1.18) * 9;
    const breathe = 1 + Math.sin(state.elapsed * 2.15) * 0.04;
    const sway = Math.sin(state.elapsed * 0.82) * 0.05;
    const armWave = Math.sin(state.elapsed * 1.7) * 12;
    ctx.save();
    ctx.translate(x + hoverX, y + hoverY);
    ctx.rotate(sway);
    ctx.scale(1 / breathe, breathe);
    ctx.globalAlpha = state.finalApproach ? 0.9 : 1;
    const auraRadius = 125 + Math.sin(state.elapsed * 2.4) * 10;
    const aura = ctx.createRadialGradient(0, -5, 8, 0, -5, auraRadius);
    aura.addColorStop(0, "rgba(238, 116, 255, .86)");
    aura.addColorStop(0.4, "rgba(156, 56, 215, .48)");
    aura.addColorStop(1, "rgba(55, 8, 84, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(-135, -150, 270, 285);
    ctx.strokeStyle = "rgba(205, 104, 250, .68)";
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.shadowColor = "#d75cff";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(-32, -2);
    ctx.quadraticCurveTo(-72, 20 + armWave * 0.35, -58, 70 + armWave);
    ctx.moveTo(32, -2);
    ctx.quadraticCurveTo(72, 20 - armWave * 0.35, 58, 70 - armWave);
    ctx.stroke();
    ctx.fillStyle = "#281039";
    ctx.strokeStyle = "rgba(232, 141, 255, .9)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#d75cff";
    ctx.shadowBlur = 36;
    ctx.beginPath();
    ctx.ellipse(0, 15, 48, 93, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -52, 39, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "#ff9dff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-17, -58);
    ctx.lineTo(-6, -52);
    ctx.moveTo(17, -58);
    ctx.lineTo(6, -52);
    ctx.stroke();
    ctx.fillStyle = "#fff3ff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(-11, -55, 2.2, 0, Math.PI * 2);
    ctx.arc(11, -55, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawExitDoor() {
    if (state.phase !== 6 || !state.doorActive || state.doorEntered) return;
    const { x, y, w, h } = state.finalDoor;
    if (!isWorldVisible(x - w, y - h - 30, w * 2, h + 70)) return;
    const pulse = 1 + Math.sin(state.elapsed * 3.2) * 0.045;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    const glow = ctx.createRadialGradient(0, -h * 0.48, 8, 0, -h * 0.48, h * 0.9);
    glow.addColorStop(0, "rgba(255, 255, 224, .98)");
    glow.addColorStop(0.42, "rgba(255, 231, 111, .56)");
    glow.addColorStop(1, "rgba(255, 213, 75, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-h, -h * 1.45, h * 2, h * 1.8);

    ctx.shadowColor = "#fff07a";
    ctx.shadowBlur = 28;
    ctx.fillStyle = "#fffbd4";
    ctx.strokeStyle = "#ffd75e";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h + w / 2);
    ctx.arc(0, -h + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#3a2866";
    ctx.font = "700 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PUERTA DE LUZ", 0, 25);
    ctx.restore();
  }

  function drawPlayer() {
    const image = jesusFrames[player.frame];
    ctx.save();
    const centerX = player.x + player.w / 2;
    const glow = ctx.createRadialGradient(centerX, player.y + player.h / 2, 4, centerX, player.y + player.h / 2, 58);
    glow.addColorStop(0, "rgba(255,240,158,.40)");
    glow.addColorStop(1, "rgba(255,220,100,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - 62, player.y - 25, 124, player.h + 50);

    if (state.shieldTimer > 0) {
      const pulse = 1 + Math.sin(state.elapsed * 12) * 0.05;
      ctx.save();
      ctx.translate(centerX, player.y + player.h / 2);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "rgba(68, 210, 255, .13)";
      ctx.strokeStyle = "#8cf4ff";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#73ebff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (image.complete && image.naturalWidth) {
      const drawH = player.crouched ? 51 : 78;
      const drawW = drawH * (image.naturalWidth / image.naturalHeight);
      ctx.translate(centerX, player.y + player.h);
      ctx.scale(player.facing, 1);
      ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    } else {
      ctx.translate(centerX, player.y + player.h);
      ctx.scale(player.facing, 1);
      ctx.fillStyle = "#f0e1c0";
      ctx.fillRect(-14, -50, 28, 39);
      ctx.fillStyle = "#805037";
      ctx.beginPath();
      ctx.arc(0, -57, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#36a5bf";
      ctx.fillRect(-14, -34, 28, 7);
    }
    ctx.restore();
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawProgressDistance() {
    if (state.phase === 6) return;
    const ratio = clamp((player.x + player.w) / state.worldWidth, 0, 1);
    ctx.fillStyle = "rgba(8,10,30,.72)";
    roundRect(ctx, 18, 17, 180, 13, 7);
    ctx.fill();
    const fill = ctx.createLinearGradient(20, 0, 195, 0);
    fill.addColorStop(0, "#6de7ff");
    fill.addColorStop(1, "#ffe36c");
    ctx.fillStyle = fill;
    roundRect(ctx, 20, 19, Math.max(5, 176 * ratio), 9, 5);
    ctx.fill();
  }

  function drawShieldStatus() {
    if (state.shieldTimer <= 0) return;
    const width = 174;
    const x = W - width - 18;
    const y = 16;
    ctx.save();
    ctx.fillStyle = "rgba(9, 48, 78, .92)";
    ctx.strokeStyle = "#83efff";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, width, 34, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eaffff";
    ctx.font = "900 15px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ESCUDO ${state.shieldTimer.toFixed(1)} s`, x + width / 2, y + 17);
    ctx.restore();
  }

  function surfaceY(platform, x) {
    if (!platform.slope) return platform.y;
    return platform.y + clamp((x - platform.x) / platform.w, 0, 1) * platform.slope;
  }

  function platformVisibility(platform) {
    if (!platform.deceptive) return 1;
    const cycle = (state.elapsed + platform.deceptionOffset) % 5.4;
    if (cycle < 3.55) return 1;
    if (cycle < 4.1) return lerp(1, 0.12, (cycle - 3.55) / 0.55);
    if (cycle < 4.78) return 0.08;
    return lerp(0.12, 1, (cycle - 4.78) / 0.62);
  }

  function platformIsSolid(platform) {
    return !platform.inactive && platformVisibility(platform) > 0.42;
  }

  function isWorldVisible(x, y, w, h) {
    return x + w >= state.cameraX - 80 &&
      x <= state.cameraX + W + 80 &&
      y + h >= state.cameraY - 80 &&
      y <= state.cameraY + H + 80;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectOverlap(circle, rect) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function approach(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    if (value > target) return Math.max(target, value - amount);
    return target;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * clamp(amount, 0, 1);
  }

  function sample(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function mixColor(a, b, amount) {
    const parse = (hex) => [
      Number.parseInt(hex.slice(1, 3), 16),
      Number.parseInt(hex.slice(3, 5), 16),
      Number.parseInt(hex.slice(5, 7), 16)
    ];
    const ca = parse(a);
    const cb = parse(b);
    return `rgb(${ca.map((value, index) => Math.round(lerp(value, cb[index], amount))).join(",")})`;
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function starPath(x, y, points, outer, inner) {
    ctx.beginPath();
    for (let index = 0; index < points * 2; index += 1) {
      const radius = index % 2 ? inner : outer;
      const angle = -Math.PI / 2 + index * Math.PI / points;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (!index) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
})();
