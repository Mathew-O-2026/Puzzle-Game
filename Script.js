// Page Navigation
function startGame(game) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.add('hidden'));
  document.getElementById(game).classList.remove('hidden');
  
  if (game === '15puzzle') {
    initPuzzle();
  } else if (game === 'memory') {
    initMemory();
  }
}

function goMenu() {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.add('hidden'));
  document.getElementById('menu').classList.remove('hidden');
  stopTimer();
  stopMemoryTimer();
}

// Shared Utilities
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// =========================
// 15 PUZZLE GAME
// =========================
const BOARD_SIZE = 4;
const TOTAL_TILES = BOARD_SIZE * BOARD_SIZE;

let puzzleState = [];
let puzzleMoves = 0;
let puzzleTimerId = null;
let puzzleStartAt = null;

function createSolvedState() {
  return Array.from({ length: TOTAL_TILES }, (_, i) => (i === TOTAL_TILES - 1 ? null : i + 1));
}

function getEmptyIndex(arr) {
  return arr.indexOf(null);
}

function isSolved(arr) {
  return arr.every((value, idx) => (idx === TOTAL_TILES - 1 ? value === null : value === idx + 1));
}

function swap(arr, a, b) {
  [arr[a], arr[b]] = [arr[b], arr[a]];
}

function canMove(index) {
  const emptyIndex = getEmptyIndex(puzzleState);
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const emptyRow = Math.floor(emptyIndex / BOARD_SIZE);
  const emptyCol = emptyIndex % BOARD_SIZE;
  const rowDiff = Math.abs(row - emptyRow);
  const colDiff = Math.abs(col - emptyCol);

  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function moveTile(index) {
  if (!canMove(index)) return;

  if (!puzzleStartAt) startTimer();

  const emptyIndex = getEmptyIndex(puzzleState);
  swap(puzzleState, index, emptyIndex);
  puzzleMoves += 1;
  updatePuzzleStatus();
  renderPuzzle();

  if (isSolved(puzzleState)) {
    stopTimer();
    alert(`You solved it in ${puzzleMoves} moves and ${formatDuration(Date.now() - puzzleStartAt)}!`);
  }
}

function shuffleState() {
  puzzleState = createSolvedState();

  for (let i = 0; i < 200; i += 1) {
    const emptyIndex = getEmptyIndex(puzzleState);
    const neighbors = getNeighbors(emptyIndex);
    const nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
    swap(puzzleState, emptyIndex, nextIndex);
  }
}

function getNeighbors(index) {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const neighbors = [];

  if (row > 0) neighbors.push(index - BOARD_SIZE);
  if (row < BOARD_SIZE - 1) neighbors.push(index + BOARD_SIZE);
  if (col > 0) neighbors.push(index - 1);
  if (col < BOARD_SIZE - 1) neighbors.push(index + 1);

  return neighbors;
}

function startTimer() {
  if (puzzleTimerId) return;

  puzzleStartAt = Date.now();
  puzzleTimerId = window.setInterval(() => {
    document.getElementById("timer").textContent = formatDuration(Date.now() - puzzleStartAt);
  }, 500);
}

function stopTimer() {
  if (!puzzleTimerId) return;
  clearInterval(puzzleTimerId);
  puzzleTimerId = null;
}

function resetPuzzle() {
  stopTimer();
  puzzleState = createSolvedState();
  puzzleMoves = 0;
  updatePuzzleStatus();
  renderPuzzle();
  document.getElementById("timer").textContent = "00:00";
  puzzleStartAt = null;
}

function updatePuzzleStatus() {
  document.getElementById("moves").textContent = String(puzzleMoves);
}

function renderPuzzle() {
  const puzzleEl = document.getElementById("puzzle");
  puzzleEl.innerHTML = "";

  puzzleState.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    if (value === null) {
      tile.classList.add("empty");
    } else {
      tile.textContent = String(value);
      tile.addEventListener("click", () => moveTile(index));
    }

    puzzleEl.appendChild(tile);
  });
}

function handlePuzzleKeydown(event) {
  if (!puzzleState.length) return;
  const emptyIndex = getEmptyIndex(puzzleState);
  let targetIndex = null;

  switch (event.key) {
    case "ArrowUp":
      targetIndex = emptyIndex + BOARD_SIZE;
      break;
    case "ArrowDown":
      targetIndex = emptyIndex - BOARD_SIZE;
      break;
    case "ArrowLeft":
      targetIndex = emptyIndex + 1;
      break;
    case "ArrowRight":
      targetIndex = emptyIndex - 1;
      break;
    default:
      return;
  }

  if (targetIndex >= 0 && targetIndex < TOTAL_TILES && canMove(targetIndex)) {
    if (!puzzleStartAt) startTimer();
    moveTile(targetIndex);
    event.preventDefault();
  }
}

function bindPuzzleEvents() {
  document.getElementById("shuffleBtn").addEventListener("click", () => {
    stopTimer();
    shuffleState();
    puzzleMoves = 0;
    updatePuzzleStatus();
    renderPuzzle();
    document.getElementById("timer").textContent = "00:00";
    puzzleStartAt = null;
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    resetPuzzle();
  });

  window.addEventListener("keydown", handlePuzzleKeydown);
}

function initPuzzle() {
  puzzleState = createSolvedState();
  renderPuzzle();
  bindPuzzleEvents();
}

// =========================
// MEMORY GAME
// =========================
let memoryCards = [];
let memoryMatches = 0;
let memoryMoves = 0;
let memoryFlipped = [];
let memoryTimerId = null;
let memoryStartAt = null;
let memoryLocked = false;

function createMemoryDeck() {
  const numbers = [];
  for (let i = 1; i <= 8; i++) {
    numbers.push(i, i);
  }
  return numbers.sort(() => Math.random() - 0.5);
}

function flipCard(index) {
  if (memoryLocked || memoryFlipped.includes(index) || memoryCards[index].matched) return;

  if (!memoryStartAt) startMemoryTimer();

  memoryFlipped.push(index);
  memoryCards[index].flipped = true;
  renderMemory();

  if (memoryFlipped.length === 2) {
    memoryMoves += 1;
    updateMemoryStatus();
    checkMemoryMatch();
  }
}

function checkMemoryMatch() {
  memoryLocked = true;
  const [first, second] = memoryFlipped;

  if (memoryCards[first].value === memoryCards[second].value) {
    memoryCards[first].matched = true;
    memoryCards[second].matched = true;
    memoryMatches += 1;
    memoryFlipped = [];
    memoryLocked = false;

    if (memoryMatches === 8) {
      stopMemoryTimer();
      alert(`You won in ${memoryMoves} moves and ${formatDuration(Date.now() - memoryStartAt)}!`);
    }
  } else {
    setTimeout(() => {
      memoryCards[first].flipped = false;
      memoryCards[second].flipped = false;
      memoryFlipped = [];
      memoryLocked = false;
      renderMemory();
    }, 600);
  }
}

function startMemoryTimer() {
  if (memoryTimerId) return;

  memoryStartAt = Date.now();
  memoryTimerId = window.setInterval(() => {
    document.getElementById("mem-timer").textContent = formatDuration(Date.now() - memoryStartAt);
  }, 500);
}

function stopMemoryTimer() {
  if (!memoryTimerId) return;
  clearInterval(memoryTimerId);
  memoryTimerId = null;
}

function resetMemory() {
  stopMemoryTimer();
  memoryCards = createMemoryDeck().map(val => ({ value: val, flipped: false, matched: false }));
  memoryMatches = 0;
  memoryMoves = 0;
  memoryFlipped = [];
  memoryLocked = false;
  memoryStartAt = null;
  updateMemoryStatus();
  renderMemory();
  document.getElementById("mem-timer").textContent = "00:00";
}

function updateMemoryStatus() {
  document.getElementById("mem-moves").textContent = String(memoryMoves);
}

function renderMemory() {
  const gridEl = document.getElementById("memory-grid");
  gridEl.innerHTML = "";

  memoryCards.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "memory-card";
    if (card.matched) {
      cardEl.classList.add("matched");
    }
    if (card.flipped) {
      cardEl.classList.add("flipped");
    }

    cardEl.textContent = card.flipped || card.matched ? card.value : "?";
    cardEl.addEventListener("click", () => flipCard(index));

    gridEl.appendChild(cardEl);
  });
}

function initMemory() {
  resetMemory();
  
  const memResetBtn = document.getElementById("memResetBtn");
  if (memResetBtn) {
    memResetBtn.addEventListener("click", () => resetMemory());
  }
}
