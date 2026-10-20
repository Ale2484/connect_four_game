let board = document.getElementById("board");
let startModal = document.getElementById("start-modal");

// 0 = vacio, 1 = rojo, 2 = amarillo
let cells = Array.from({ length: 6 }, () => Array(7).fill(0));
let currentPlayer = 1;
let roundOver = false;
let winnerTimeout;
let winningOutlineState = null;

const winnerModal = document.getElementById("winner-modal");
const scores = [0, 0, 0];
const turnCard = document.getElementById("turn-card");
const turnPlayer = document.getElementById("turn-player");

function updateTurnCard() {
  turnCard.querySelector("span").textContent = "Your turn";
  turnCard.style.setProperty("--turn-color", currentPlayer === 1 ? "#FF6388" : "#FFD166");
  turnCard.style.color = currentPlayer === 1 ? "#fff" : "#000";
  turnPlayer.textContent = currentPlayer === 1 ? "Player 1" : "Player 2";
}

updateTurnCard();
let canPlay = false;
startGame();
createBoard();

const columnIndicator = document.createElement("div");
columnIndicator.className = "column-indicator";
columnIndicator.hidden = true;
columnIndicator.setAttribute("aria-hidden", "true");
columnIndicator.innerHTML = `
  <svg viewBox="0 0 40 40" width="40" height="40">
    <path d="M 9 5 H 31 Q 35 5 35 9 V 20 Q 35 23 32 25 L 23 32 Q 20 35 17 32 L 8 25 Q 5 23 5 20 V 9 Q 5 5 9 5 Z"
      fill="currentColor" stroke="black" stroke-width="4" stroke-linejoin="round" />
  </svg>`;
document.body.appendChild(columnIndicator);
let hoveredCol = null;

function updateColumnIndicator() {
  if (!canPlay || hoveredCol === null || cells[0][hoveredCol] !== 0) {
    columnIndicator.hidden = true;
    return;
  }

  // Usar coordenadas de la pantalla porque el indicador tiene posicion fija
  const topCell = board.querySelector(`[data-row="0"] [data-col="${hoveredCol}"]`);
  const rect = topCell.getBoundingClientRect();
  const frameRect = board.parentElement.getBoundingClientRect();

  columnIndicator.style.left = `${rect.left + rect.width / 2}px`;
  columnIndicator.style.top = `${frameRect.top - 6}px`;
  columnIndicator.style.color = currentPlayer === 1 ? "#FF6388" : "#FFD166";
  columnIndicator.hidden = false;
}

board.addEventListener("pointermove", (event) => {
  const cell = event.target.closest("[data-col]");
  hoveredCol = cell ? Number(cell.dataset.col) : null;
  updateColumnIndicator();
});

board.addEventListener("pointerleave", () => {
  hoveredCol = null;
  updateColumnIndicator();
});

window.addEventListener("resize", updateColumnIndicator);
window.addEventListener("resize", () => {
  if (winningOutlineState) showWinningOutline(...winningOutlineState);
});
window.addEventListener("scroll", updateColumnIndicator, true);

function restartRound(resetScores = true) {
  // Esperar a que termine la cuenta inicial o la ficha en movimiento
  if (!canPlay && !roundOver) return;

  // Cancelar el modal pendiente si se reinicia durante la celebracion
  clearTimeout(winnerTimeout);
  winnerModal.classList.add("hidden");

  cells = Array.from({ length: 6 }, () => Array(7).fill(0));
  currentPlayer = 1;
  roundOver = false;
  winningOutlineState = null;

  // Otra ronda conserva los puntos mientras Restart reinicia toda la partida
  if (resetScores) {
    for (const player of [1, 2]) {
      scores[player] = 0;
      document.getElementById(`score-${player}`).textContent = "0";
    }
  }

  board.innerHTML = "";
  createBoard();

  canPlay = false;
  updateTurnCard();
  updateColumnIndicator();
  startGame();
}

document.getElementById("restart-game").addEventListener("click", () => restartRound());
document.getElementById("next-round").addEventListener("click", () => {
  restartRound(false);
  document.getElementById("restart-game").focus();
});

function closeWinnerModal() {
  winnerModal.classList.add("hidden");
  document.getElementById("restart-game").focus();
}

document.getElementById("close-winner").addEventListener("click", closeWinnerModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !winnerModal.classList.contains("hidden")) {
    closeWinnerModal();
  }
});

board.addEventListener("click", async (event) => {
  if (!canPlay) return;

  const clickedCell = event.target.closest("[data-col]");
  if (!clickedCell) return;

  const col = Number(clickedCell.dataset.col);

  // Buscar la primera casilla libre desde abajo
  for (let row = 5; row >= 0; row--) {
    if (cells[row][col] !== 0) continue;

    cells[row][col] = currentPlayer;
    const cell = board.querySelector(
      `[data-row="${row}"] [data-col="${col}"]`
    );

    // Bloquear nuevas jugadas hasta que la ficha termine de caer
    canPlay = false;
    updateColumnIndicator();

    const color = currentPlayer === 1 ? "bg-[#FF6388]" : "bg-[#FFD166]";
    await animateDrop(cell, color);

    // Comprobar la victoria cuando la ficha termina de caer
    const winningCells = findWinningCells(row, col);

    if (winningCells.length > 0) {
      roundOver = true;
      scores[currentPlayer]++;
      document.getElementById(`score-${currentPlayer}`).textContent = scores[currentPlayer];

      turnCard.querySelector("span").textContent = "Winner!";
      showWinningOutline(winningCells, row, col);

      // Dejar visible la linea ganadora un segundo antes de mostrar el modal
      const winner = currentPlayer;
      winnerTimeout = setTimeout(() => {
        const name = document.getElementById("winner-name");
        name.textContent = `Player ${winner} wins!`;
        winnerModal.style.setProperty("--winner-color", winner === 1 ? "#FF6388" : "#FFD166");
        winnerModal.querySelector(".winner-mascot").style.transform = winner === 1 ? "rotate(10deg)" : "rotate(-10deg)";
        winnerModal.classList.remove("hidden");
        winnerModal.querySelector(".winner-card").focus({ preventScroll: true });
      }, 1000);

      return;
    }

    // Un tablero lleno sin victoria termina en empate
    if (cells.every((line) => line.every((value) => value !== 0))) {
      roundOver = true;
      turnCard.querySelector("span").textContent = "Round over";
      turnPlayer.textContent = "Draw";
      return;
    }

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnCard();
    canPlay = true;
    updateColumnIndicator();
    break;
  }
});

function showWinningOutline(winningCells, row, col) {
  winningOutlineState = [winningCells, row, col];
  board.querySelectorAll(".winning-outline").forEach((outline) => outline.remove());

  const boardRect = board.getBoundingClientRect();

  // Un contorno continuo por linea, incluso si la jugada completa dos lineas
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    // Seleccionar las fichas alineadas con la ultima jugada en esta direccion
    const line = winningCells.filter(([r, c]) => (r - row) * dc === (c - col) * dr);
    if (line.length < 4) continue;

    line.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const rects = [line[0], line[line.length - 1]].map(([r, c]) =>
      board.querySelector(`[data-row="${r}"] [data-col="${c}"]`).getBoundingClientRect()
    );

    // Los extremos determinan la longitud y el angulo del contorno
    const [first, last] = rects;
    const dx = last.left - first.left;
    const dy = last.top - first.top;
    const diameter = first.width * 0.84;

    const outline = document.createElement("div");
    outline.className = "winning-outline";
    outline.style.color = currentPlayer === 1 ? "#FF6388" : "#FFD166";
    Object.assign(outline.style, {
      left: `${first.left - boardRect.left + first.width / 2}px`,
      top: `${first.top - boardRect.top + first.height / 2}px`,
      width: `${Math.hypot(dx, dy) + diameter}px`,
      height: `${diameter}px`,
      transform: `rotate(${Math.atan2(dy, dx)}rad) translate(${-diameter / 2}px, -50%)`,
    });
    board.appendChild(outline);
  }
}

function findWinningCells(row, col) {
  const player = cells[row][col];
  if (player === 0) return [];

  // Horizontal, vertical y las dos diagonales
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  // Evitar duplicados cuando una ficha pertenece a dos lineas ganadoras
  const winners = new Map();

  for (const [dr, dc] of directions) {
    const line = [[row, col]];

    // Recorrer ambos sentidos desde la ultima ficha colocada
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;

      while (r >= 0 && r < 6 && c >= 0 && c < 7 && cells[r][c] === player) {
        line.push([r, c]);
        r += dr * sign;
        c += dc * sign;
      }
    }

    if (line.length >= 4) {
      for (const position of line) winners.set(position.join(","), position);
    }
  }

  return [...winners.values()];
}

async function animateDrop(cell, color) {
  const boardRect = board.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const distance = cellRect.top - boardRect.top + cellRect.height;

  const dropLayer = document.createElement("div");
  dropLayer.className = "drop-layer";

  // Recortar la capa de caida para ver la ficha solo a traves de los agujeros
  const holes = Array.from(board.querySelectorAll("[data-col]"), (slot) => {
    const rect = slot.getBoundingClientRect();
    const x = rect.left - boardRect.left + rect.width / 2;
    const y = rect.top - boardRect.top + rect.height / 2;
    const border = parseFloat(getComputedStyle(slot).borderLeftWidth);
    const radius = Math.min(rect.width, rect.height) / 2 - border;

    // Cada par de arcos forma el circulo interior de una casilla
    return `M ${x - radius} ${y} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0 Z`;
  }).join(" ");

  dropLayer.style.clipPath = `path('${holes}')`;

  const piece = document.createElement("div");
  piece.className = `falling-piece rounded-full border-3 ${color}`;
  const face = createFace(currentPlayer);
  piece.appendChild(face);

  Object.assign(piece.style, {
    left: `${cellRect.left - boardRect.left}px`,
    top: `${cellRect.top - boardRect.top}px`,
    width: `${cellRect.width}px`,
    height: `${cellRect.height}px`,
  });
  dropLayer.appendChild(piece);
  board.appendChild(dropLayer);

  // Acelerar la caida y aumentar su duracion segun la distancia recorrida
  const animation = piece.animate(
    [
      { transform: `translateY(-${distance}px)` },
      { transform: "translateY(0)" },
    ],
    {
      duration: 200 + distance * 0.7,
      easing: "cubic-bezier(0.42, 0, 1, 1)",
      fill: "forwards",
    }
  );

  try {
    await animation.finished;
  } finally {
    // Sustituir la ficha temporal por la definitiva conservando su cara
    cell.classList.remove("bg-[#7A45FF]");
    cell.classList.add(color);
    cell.appendChild(face);
    dropLayer.remove();
  }
}

function createFace(player) {
  const face = document.createElement("div");
  face.className = "piece-face";

  // Roja hacia la derecha; amarilla hacia la izquierda
  face.style.transform = `translateX(${player === 1 ? 12 : -12}%)`;
  face.setAttribute("aria-hidden", "true");
  face.innerHTML = `
    <span class="piece-eye piece-eye-left"></span>
    <span class="piece-eye piece-eye-right"></span>
    <span class="piece-mouth"></span>
  `;

  return face;
}

// Funcion que crea el tablero
function createBoard() {
  let content = "";

  for (let i = 0; i < 6; i++) {
    content = `<div class="flex items-center justify-between my-3" data-row="${i}">`;

    for (let j = 0; j < 7; j++) {
      content += `<div class="w-16 h-16 rounded-full bg-[#7A45FF] border-3 shadow-[0_-5px_0_2px_#000] cursor-pointer" data-col='${j}'></div>`;
    }

    content += '</div>';
    board.innerHTML = board.innerHTML + content;
  }
}

// Funcion que inicia la cuenta atras
function startGame() {
  let startTime = startModal.querySelector("#start-time");
  startTime.textContent = "3";
  startModal.classList.remove("hidden", "start-modal-leaving");

  let timeOutInterval = setInterval(() => {
    startTime.textContent = Number(startTime.textContent) - 1;

    if (startTime.textContent == "0") {
      clearInterval(timeOutInterval);
      canPlay = true;
      updateColumnIndicator();

      // Ocultar el modal despues de que termine la transicion de opacidad
      startModal.classList.add("start-modal-leaving");
      setTimeout(() => startModal.classList.add("hidden"), 500);
    }
  }, 1000);
}
