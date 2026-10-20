let board = document.getElementById("board");
let startModal = document.getElementById("start-modal");
// 0 = vacio, 1 = rojo, 2 = amarillo
let cells = Array.from({ length: 6 }, () => Array(7).fill(0));
let currentPlayer = 1;
let canPlay = false;
startGame();
createBoard();

board.addEventListener("click", async (event) => {
  if (!canPlay) return;

  const clickedCell = event.target.closest("[data-col]");
  if (!clickedCell) return;

  const col = Number(clickedCell.dataset.col);


  for (let row = 5; row >= 0; row--) {
    if (cells[row][col] !== 0) continue;

    cells[row][col] = currentPlayer;
    const cell = board.querySelector(
      `[data-row="${row}"] [data-col="${col}"]`
    );
    canPlay = false;
    const color = currentPlayer === 1 ? "bg-[#FF6388]" : "bg-[#FFD166]";
    await animateDrop(cell, color);

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    canPlay = true;
    break;
  }
});

async function animateDrop(cell, color) {
  const boardRect = board.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const distance = cellRect.top - boardRect.top + cellRect.height;

  const dropLayer = document.createElement("div");
  dropLayer.className = "drop-layer";
  const holes = Array.from(board.querySelectorAll("[data-col]"), (slot) => {
    const rect = slot.getBoundingClientRect();
    const x = rect.left - boardRect.left + rect.width / 2;
    const y = rect.top - boardRect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2 - 3;
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
  face.style.transform = `translateX(${player === 1 ? 7 : -7}px)`;
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
function startGame(){
  let startTime = startModal.querySelector("#start-time");
  startModal.classList.remove("hidden");
  let timeOutInterval = setInterval(() => {
    startTime.textContent = Number(startTime.textContent) - 1;

    if (startTime.textContent == "0") {
      clearInterval(timeOutInterval);
      canPlay = true;
      startModal.classList.add("opacity-0", "transition-opacity", "duration-1000", "ease-out", "pointer-events-none");
    }
  }, 1000);
}
