(() => {
  "use strict";

  const DIRECTIONS = [
    { dr: -1, dc: 0, name: "n" },
    { dr: 0, dc: 1, name: "e" },
    { dr: 1, dc: 0, name: "s" },
    { dr: 0, dc: -1, name: "w" }
  ];
  const STORAGE_KEY = "senderosDeLuzTramo3V1";

  const LEVELS = [
    {
      name: "Una luz en el camino",
      size: 3,
      source: [1, 1],
      paths: [
        [[1, 1], [1, 0], [0, 0]],
        [[1, 1], [1, 2], [2, 2]]
      ]
    },
    {
      name: "Cuatro lámparas",
      size: 5,
      source: [2, 2],
      paths: [
        [[2, 2], [2, 1], [1, 1], [1, 0]],
        [[2, 2], [2, 3], [1, 3], [0, 3]],
        [[2, 2], [1, 2], [0, 2]],
        [[2, 2], [3, 2], [4, 2]]
      ]
    },
    {
      name: "La luz se comparte",
      size: 5,
      source: [2, 2],
      paths: [
        [[2, 2], [2, 1], [2, 0], [1, 0], [0, 0]],
        [[2, 2], [2, 3], [2, 4], [1, 4], [0, 4]],
        [[2, 2], [1, 2], [0, 2]],
        [[2, 1], [3, 1], [4, 1], [4, 0]]
      ]
    },
    {
      name: "Ramas de esperanza",
      size: 5,
      source: [2, 2],
      paths: [
        [[2, 2], [1, 2], [1, 1], [0, 1]],
        [[1, 2], [1, 3], [0, 3]],
        [[2, 2], [2, 1], [3, 1], [4, 1]],
        [[3, 1], [3, 0], [4, 0]],
        [[2, 2], [2, 3], [3, 3], [4, 3]],
        [[3, 3], [3, 4], [4, 4]],
        [[2, 2], [3, 2], [4, 2]]
      ]
    },
    {
      name: "Sendero de fe",
      size: 7,
      source: [3, 3],
      paths: [
        [[3, 3], [2, 3], [1, 3], [1, 2], [1, 1], [0, 1]],
        [[1, 3], [1, 4], [1, 5], [0, 5]],
        [[3, 3], [3, 2], [3, 1], [2, 1], [2, 0]],
        [[3, 1], [4, 1], [5, 1], [6, 1]],
        [[3, 3], [3, 4], [3, 5], [2, 5], [2, 6]],
        [[3, 5], [4, 5], [5, 5], [6, 5]],
        [[3, 2], [4, 2], [5, 2], [6, 2]],
        [[5, 2], [5, 3], [5, 4], [6, 4]]
      ]
    },
    {
      name: "Tres caminos de servicio",
      size: 7,
      source: [3, 3],
      sourceLocked: true,
      paths: [
        [[3, 3], [2, 3], [1, 3], [1, 2], [0, 2]],
        [[1, 3], [1, 4], [0, 4]],
        [[3, 3], [3, 2], [3, 1], [2, 1], [2, 0]],
        [[3, 1], [4, 1], [5, 1], [6, 1]],
        [[3, 2], [4, 2], [5, 2], [6, 2]],
        [[3, 3], [3, 4], [3, 5], [2, 5], [2, 6]],
        [[3, 5], [4, 5], [5, 5], [6, 5]],
        [[3, 4], [4, 4], [5, 4], [6, 4]]
      ]
    },
    {
      name: "Dos sendas, una esperanza",
      size: 7,
      source: [3, 3],
      sourceLocked: true,
      paths: [
        [[3, 3], [2, 3], [1, 3], [0, 3]],
        [[2, 3], [2, 2], [1, 2], [0, 2]],
        [[1, 3], [1, 4], [0, 4]],
        [[2, 3], [2, 4], [2, 5], [1, 5], [0, 5]],
        [[3, 3], [4, 3], [5, 3], [6, 3]],
        [[4, 3], [4, 2], [5, 2], [6, 2]],
        [[5, 3], [5, 4], [6, 4]],
        [[4, 3], [4, 4], [4, 5], [5, 5], [6, 5]]
      ]
    }
  ];

  const boardElement = document.getElementById("board");
  const levelSelect = document.getElementById("levelSelect");
  const moveCountElement = document.getElementById("moveCount");
  const bestMovesElement = document.getElementById("bestMoves");
  const restartButton = document.getElementById("restartButton");
  const soundButton = document.getElementById("soundButton");
  const statusMessage = document.getElementById("statusMessage");
  const completionPanel = document.getElementById("completionPanel");
  const completionText = document.getElementById("completionText");
  const nextButton = document.getElementById("nextButton");

  let state = loadProgress();
  // Cada nueva entrada al tramo comienza en el nivel 1. El progreso desbloqueado
  // y los mejores movimientos sí permanecen guardados para futuras partidas.
  let levelIndex = 0;
  let tiles = [];
  let moves = 0;
  let initialRotations = [];
  let completionLocked = false;
  let audioContext = null;

  function key(row, col) { return `${row},${col}`; }

  function loadProgress() {
    const fallback = { highestUnlocked: 0, currentLevel: 0, bestMoves: {}, soundOn: true };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...fallback, ...saved, highestUnlocked: Math.min(6, Math.max(0, saved?.highestUnlocked || 0)) };
    } catch (_) {
      return fallback;
    }
  }

  function saveProgress() {
    state.currentLevel = levelIndex;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function addEdge(edgeMap, a, b) {
    const [ar, ac] = a;
    const [br, bc] = b;
    const direction = DIRECTIONS.findIndex(dir => ar + dir.dr === br && ac + dir.dc === bc);
    if (direction < 0) throw new Error("Los senderos del nivel deben usar casillas contiguas.");
    if (!edgeMap.has(key(ar, ac))) edgeMap.set(key(ar, ac), new Set());
    if (!edgeMap.has(key(br, bc))) edgeMap.set(key(br, bc), new Set());
    edgeMap.get(key(ar, ac)).add(direction);
    edgeMap.get(key(br, bc)).add((direction + 2) % 4);
  }

  function buildSolvedTiles(level) {
    const edgeMap = new Map();
    level.paths.forEach(path => {
      path.forEach(([row, col]) => {
        if (!edgeMap.has(key(row, col))) edgeMap.set(key(row, col), new Set());
      });
      for (let index = 0; index < path.length - 1; index += 1) addEdge(edgeMap, path[index], path[index + 1]);
    });

    const sourceKey = key(...level.source);
    const result = [];
    for (let row = 0; row < level.size; row += 1) {
      for (let col = 0; col < level.size; col += 1) {
        const connectors = [...(edgeMap.get(key(row, col)) || [])].sort();
        const type = key(row, col) === sourceKey ? "source" : connectors.length === 1 ? "light" : connectors.length ? "wire" : "empty";
        result.push({ row, col, connectors, type, rotation: 0, element: null });
      }
    }
    return result;
  }

  function scrambleLevel() {
    let seed = (levelIndex + 1) * 7919 + 37;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    tiles.forEach(tile => {
      const fixedSource = tile.type === "source" && LEVELS[levelIndex].sourceLocked;
      tile.rotation = tile.type === "empty" || fixedSource ? 0 : Math.floor(random() * 4);
    });
    if (isSolved().complete) {
      const turnable = tiles.find(tile => tile.type === "wire" || tile.type === "light");
      if (turnable) turnable.rotation = (turnable.rotation + 1) % 4;
    }
    initialRotations = tiles.map(tile => tile.rotation);
  }

  function actualConnectors(tile) {
    return tile.connectors.map(direction => (direction + tile.rotation) % 4);
  }

  function tileAt(row, col) {
    const size = LEVELS[levelIndex].size;
    if (row < 0 || col < 0 || row >= size || col >= size) return null;
    return tiles[row * size + col];
  }

  function reciprocalNeighbor(tile, direction) {
    const dir = DIRECTIONS[direction];
    const neighbor = tileAt(tile.row + dir.dr, tile.col + dir.dc);
    if (!neighbor || neighbor.type === "empty") return null;
    return actualConnectors(neighbor).includes((direction + 2) % 4) ? neighbor : null;
  }

  function traceEnergy() {
    const source = tiles.find(tile => tile.type === "source");
    const energized = new Map([[key(source.row, source.col), 0]]);
    const queue = [source];
    while (queue.length) {
      const current = queue.shift();
      const depth = energized.get(key(current.row, current.col));
      actualConnectors(current).forEach(direction => {
        const neighbor = reciprocalNeighbor(current, direction);
        if (neighbor && !energized.has(key(neighbor.row, neighbor.col))) {
          energized.set(key(neighbor.row, neighbor.col), depth + 1);
          queue.push(neighbor);
        }
      });
    }
    return energized;
  }

  function isSolved() {
    const energized = traceEnergy();
    const activeTiles = tiles.filter(tile => tile.type !== "empty");
    const lights = activeTiles.filter(tile => tile.type === "light");
    const allConnected = activeTiles.every(tile => energized.has(key(tile.row, tile.col)));
    const allLightsOn = lights.every(tile => energized.has(key(tile.row, tile.col)));
    const noIncorrectConnections = activeTiles.every(tile =>
      actualConnectors(tile).every(direction => Boolean(reciprocalNeighbor(tile, direction)))
    );
    return { complete: allConnected && allLightsOn && noIncorrectConnections, energized, lights };
  }

  function renderBoard() {
    const level = LEVELS[levelIndex];
    boardElement.innerHTML = "";
    boardElement.style.setProperty("--size", level.size);
    boardElement.setAttribute("aria-label", `Nivel ${levelIndex + 1}: ${level.name}`);

    tiles.forEach(tile => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tile ${tile.type === "wire" ? "path-tile" : tile.type}`;
      button.setAttribute("role", "gridcell");
      const fixedSource = tile.type === "source" && level.sourceLocked;
      if (tile.type === "empty") {
        button.disabled = true;
        button.setAttribute("aria-hidden", "true");
      } else if (fixedSource) {
        button.classList.add("locked");
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("aria-label", "Fuente de luz fija; esta pieza no puede girarse");
      } else {
        button.setAttribute("aria-label", tile.type === "source" ? "Fuente de luz, tocar para girar" : tile.type === "light" ? "Lámpara, tocar para girar" : "Sendero, tocar para girar");
        button.addEventListener("click", () => rotateTile(tile));
      }

      const wireLayer = document.createElement("span");
      wireLayer.className = "wire-layer";
      tile.connectors.forEach(direction => {
        const wire = document.createElement("span");
        wire.className = `wire ${DIRECTIONS[direction].name}`;
        wire.dataset.baseDirection = direction;
        wireLayer.appendChild(wire);
      });
      if (tile.type !== "empty") {
        const hub = document.createElement("span");
        hub.className = "hub";
        wireLayer.appendChild(hub);
      }
      button.appendChild(wireLayer);

      if (tile.type === "light") {
        const icon = document.createElement("span");
        icon.className = "piece-icon lamp-icon";
        icon.setAttribute("aria-hidden", "true");
        button.appendChild(icon);
      }
      tile.element = button;
      boardElement.appendChild(button);
    });
    updateEnergyDisplay(false);
  }

  function rotateTile(tile) {
    if (completionLocked) return;
    tile.rotation = (tile.rotation + 1) % 4;
    moves += 1;
    moveCountElement.textContent = moves;
    playTone("turn");
    updateEnergyDisplay(true);
  }

  function updateEnergyDisplay(checkCompletion) {
    const result = isSolved();
    tiles.forEach(tile => {
      if (!tile.element || tile.type === "empty") return;
      const tileKey = key(tile.row, tile.col);
      const isEnergized = result.energized.has(tileKey);
      const delay = Math.min(520, (result.energized.get(tileKey) || 0) * 85);
      tile.element.style.setProperty("--rotation", tile.rotation);
      tile.element.style.setProperty("--energy-delay", `${delay}ms`);
      tile.element.classList.toggle("energized", isEnergized);
      tile.element.classList.toggle("lit", tile.type === "light" && isEnergized);

      tile.element.querySelectorAll(".wire").forEach(wire => {
        const baseDirection = Number(wire.dataset.baseDirection);
        const direction = (baseDirection + tile.rotation) % 4;
        wire.classList.toggle("energized", isEnergized && Boolean(reciprocalNeighbor(tile, direction)));
      });
    });

    const litCount = result.lights.filter(light => result.energized.has(key(light.row, light.col))).length;
    statusMessage.textContent = result.complete
      ? "¡Nivel completado!"
      : `${litCount} de ${result.lights.length} lámparas encendidas`;
    if (checkCompletion && result.complete) completeLevel();
  }

  function completeLevel() {
    completionLocked = true;
    const previousBest = state.bestMoves[levelIndex];
    if (!previousBest || moves < previousBest) state.bestMoves[levelIndex] = moves;
    if (levelIndex < LEVELS.length - 1) state.highestUnlocked = Math.max(state.highestUnlocked, levelIndex + 1);
    saveProgress();
    refreshLevelSelector();
    updateStats();
    playTone("complete");

    const finalLevel = levelIndex === LEVELS.length - 1;
    completionText.textContent = finalLevel
      ? `Completaste los siete desafíos en ${moves} movimientos. La luz llegó a todas las lámparas.`
      : `Encendiste todas las lámparas en ${moves} movimientos. El nivel ${levelIndex + 2} ya está disponible.`;
    nextButton.textContent = finalLevel ? "Continuar el camino →" : "Siguiente nivel →";
    window.setTimeout(() => { completionPanel.hidden = false; }, 520);
  }

  function startLevel(index, reuseInitial = false) {
    levelIndex = Math.min(index, state.highestUnlocked);
    state.currentLevel = levelIndex;
    completionLocked = false;
    completionPanel.hidden = true;
    moves = 0;
    tiles = buildSolvedTiles(LEVELS[levelIndex]);
    if (reuseInitial && initialRotations.length === tiles.length) {
      tiles.forEach((tile, tileIndex) => { tile.rotation = initialRotations[tileIndex]; });
    } else {
      scrambleLevel();
    }
    saveProgress();
    refreshLevelSelector();
    updateStats();
    renderBoard();
  }

  function restartLevel() {
    playTone("turn");
    const savedRotations = [...initialRotations];
    tiles = buildSolvedTiles(LEVELS[levelIndex]);
    tiles.forEach((tile, index) => { tile.rotation = savedRotations[index] || 0; });
    initialRotations = savedRotations;
    moves = 0;
    completionLocked = false;
    completionPanel.hidden = true;
    updateStats();
    renderBoard();
  }

  function refreshLevelSelector() {
    levelSelect.innerHTML = "";
    LEVELS.forEach((level, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.disabled = index > state.highestUnlocked;
      option.selected = index === levelIndex;
      option.textContent = `${index + 1}. ${level.name}${option.disabled ? " 🔒" : ""}`;
      levelSelect.appendChild(option);
    });
  }

  function updateStats() {
    moveCountElement.textContent = moves;
    bestMovesElement.textContent = state.bestMoves[levelIndex] || "—";
    soundButton.textContent = state.soundOn ? "🔊" : "🔇";
    soundButton.setAttribute("aria-pressed", String(state.soundOn));
    soundButton.setAttribute("aria-label", state.soundOn ? "Desactivar sonido" : "Activar sonido");
  }

  function playTone(kind) {
    if (!state.soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const notes = kind === "complete" ? [523.25, 659.25, 783.99] : [kind === "turn" ? 285 : 440];
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = kind === "complete" ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, now + index * .12);
        gain.gain.exponentialRampToValueAtTime(kind === "complete" ? .12 : .035, now + index * .12 + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, now + index * .12 + (kind === "complete" ? .35 : .08));
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now + index * .12);
        oscillator.stop(now + index * .12 + .38);
      });
    } catch (_) {
      state.soundOn = false;
      saveProgress();
      updateStats();
    }
  }

  levelSelect.addEventListener("change", event => startLevel(Number(event.target.value)));
  restartButton.addEventListener("click", restartLevel);
  soundButton.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    saveProgress();
    updateStats();
    if (state.soundOn) playTone("toggle");
  });
  nextButton.addEventListener("click", () => {
    if (levelIndex < LEVELS.length - 1) {
      startLevel(levelIndex + 1);
      return;
    }
    window.parent.postMessage({ type: "tramo_3_completado", levels: LEVELS.length }, window.location.origin);
    completionPanel.hidden = true;
    statusMessage.textContent = "¡Tramo 3 completado! Continúa tu camino.";
  });

  startLevel(levelIndex);
})();
