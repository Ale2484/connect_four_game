let board = document.getElementById("board");
let startModal = document.getElementById("start-modal");
startGame();
createBoard();

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
    console.log("a")
    startTime.textContent = Number(startTime.textContent) - 1;

    if (startTime.textContent == "0") {
      clearInterval(timeOutInterval);
      startModal.classList.add("opacity-0", "transition-opacity", "duration-1000", "ease-out", "pointer-events-none");
    }
  }, 1000);
}