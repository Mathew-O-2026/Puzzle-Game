const BOARD_SIZE = 4;
const TOTAL_TILES = BOARD_SIZE * BOARD_SIZE;

const puzzleEl = document.getElementById("puzzle");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const shuffleBtn = document.getElementById("shuffleBtn");
const resetBtn = document.getElementById("resetBtn");

let state = [];
let moves = 0;
let timerId = null;
let startAt = null;

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
  const emptyIndex = getEmptyIndex(state);
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

  const emptyIndex = getEmptyIndex(state);
  swap(state, index, emptyIndex);
  moves += 1;
  updateStatus();
  render();

  if (isSolved(state)) {
    stopTimer();
    setTimeout(() => {
      alert(`Nice! You solved it in ${moves} moves and ${formatDuration(Date.now() - startAt)}.`);
    }, 100);
  }
}

function shuffleState() {
  // Start from a solved board and make many random legal moves
  state = createSolvedState();

  const shuffleCount = 200;
  for (let i = 0; i < shuffleCount; i += 1) {
    const emptyIndex = getEmptyIndex(state);
    const neighbors = getNeighbors(emptyIndex);
    const nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
    swap(state, emptyIndex, nextIndex);
  }

  // Ensure we don't start already solved
  if (isSolved(state)) {
    shuffleState();
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

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
  if (timerId) return; // already running

  startAt = Date.now();
  timerId = window.setInterval(() => {
    timerEl.textContent = formatDuration(Date.now() - startAt);
  }, 500);
}

function stopTimer() {
  if (!timerId) return;
  clearInterval(timerId);
  timerId = null;
}

function resetGame() {
  stopTimer();
  state = createSolvedState();
  moves = 0;
  updateStatus();
  render();
  timerEl.textContent = "00:00";
  startAt = null;
}

function updateStatus() {
  movesEl.textContent = String(moves);
}

function render() {
  puzzleEl.innerHTML = "";

  state.forEach((value, index) => {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.type = "button";
    tile.disabled = value === null;

    if (value === null) {
      tile.classList.add("empty");
      tile.setAttribute("aria-label", "Empty space");
    } else {
      tile.textContent = String(value);
      tile.setAttribute("aria-label", `Tile ${value}`);
      tile.addEventListener("click", () => {
        if (!startAt) startTimer();
        moveTile(index);
      });
    }

    puzzleEl.appendChild(tile);
  });
}

function handleKeydown(event) {
  if (!state.length) return;
  const emptyIndex = getEmptyIndex(state);
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
    if (!startAt) startTimer();
    moveTile(targetIndex);
    event.preventDefault();
  }
}

function bindEvents() {
  shuffleBtn.addEventListener("click", () => {
    stopTimer();
    shuffleState();
    moves = 0;
    updateStatus();
    render();
    timerEl.textContent = "00:00";
    startAt = null;
  });

  resetBtn.addEventListener("click", () => {
    resetGame();
  });

  window.addEventListener("keydown", handleKeydown);
}

function init() {
  state = createSolvedState();
  render();
  bindEvents();
}

init();
