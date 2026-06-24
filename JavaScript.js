// ---- Config ----
const EMOJIS = ['🐶','🐱','🦊','🐼','🐸','🦁','🐵','🐷'];
const STORAGE_KEY = 'emojiMemoryBest';

// ---- DOM references ----
const boardEl = document.getElementById('board');
const moveCountEl = document.getElementById('move-count');
const timerEl = document.getElementById('timer');
const bestStatsEl = document.getElementById('best-stats');
const newGameBtn = document.getElementById('new-game-btn');
const winMessageEl = document.getElementById('win-message');
const winSummaryEl = document.getElementById('win-summary');

// ---- Game state ----
let cards = [];
let flippedCards = [];   // currently face-up, unmatched cards (max 2)
let matchedCount = 0;
let moveCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let timerStarted = false;
let boardLocked = false; // prevents clicks during the mismatch delay

// ---- Utility: Fisher-Yates shuffle ----
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Build a fresh deck of paired emojis, shuffled ----
function createDeck() {
  const pairValues = [...EMOJIS, ...EMOJIS]; // 8 pairs = 16 cards
  return shuffle(pairValues).map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false
  }));
}

// ---- Render the board from current `cards` state ----
function renderBoard() {
  boardEl.innerHTML = '';
  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.id = card.id;
    if (card.isFlipped) cardEl.classList.add('flipped');
    if (card.isMatched) cardEl.classList.add('matched');

    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${card.emoji}</div>
      </div>
    `;

    cardEl.addEventListener('click', () => handleCardClick(card.id));
    boardEl.appendChild(cardEl);
  });
}

// ---- Timer controls ----
function startTimerIfNeeded() {
  if (timerStarted) return;
  timerStarted = true;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timerEl.textContent = `${secondsElapsed}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ---- Click handler ----
function handleCardClick(id) {
  if (boardLocked) return;                 // ignore clicks during compare delay

  const card = cards.find(c => c.id === id);
  if (!card || card.isFlipped || card.isMatched) return; // ignore invalid/duplicate clicks

  startTimerIfNeeded();

  card.isFlipped = true;
  flippedCards.push(card);
  renderBoard();

  if (flippedCards.length === 2) {
    moveCount++;
    moveCountEl.textContent = moveCount;
    boardLocked = true; // lock input while we evaluate the pair

    const [first, second] = flippedCards;

    if (first.emoji === second.emoji) {
      // Match found
      first.isMatched = true;
      second.isMatched = true;
      matchedCount += 2;
      flippedCards = [];
      boardLocked = false;
      renderBoard();

      if (matchedCount === cards.length) {
        handleWin();
      }
    } else {
      // No match — flip back after a short delay
      setTimeout(() => {
        first.isFlipped = false;
        second.isFlipped = false;
        flippedCards = [];
        boardLocked = false;
        renderBoard();
      }, 800);
    }
  }
}

// ---- Win handling ----
function handleWin() {
  stopTimer();
  winSummaryEl.textContent = `${moveCount} moves in ${secondsElapsed}s`;
  winMessageEl.style.display = 'block';
  saveBestIfNeeded();
}

// ---- Best score persistence (localStorage) ----
function getBest() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveBestIfNeeded() {
  const current = getBest();
  const candidate = { moves: moveCount, time: secondsElapsed };

  const isBetter =
    !current ||
    candidate.moves < current.moves ||
    (candidate.moves === current.moves && candidate.time < current.time);

  if (isBetter) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
  }
  renderBestStats();
}

function renderBestStats() {
  const best = getBest();
  bestStatsEl.textContent = best
    ? `Best: ${best.moves} moves, ${best.time}s`
    : 'Best: -- moves, --s';
}

// ---- New game / reset ----
function startNewGame() {
  stopTimer();
  cards = createDeck();
  flippedCards = [];
  matchedCount = 0;
  moveCount = 0;
  secondsElapsed = 0;
  timerStarted = false;
  boardLocked = false;

  moveCountEl.textContent = '0';
  timerEl.textContent = '0s';
  winMessageEl.style.display = 'none';

  renderBoard();
  renderBestStats();
}

// ---- Init ----
newGameBtn.addEventListener('click', startNewGame);
startNewGame();