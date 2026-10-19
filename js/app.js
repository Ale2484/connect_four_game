let board = document.getElementById("board");
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