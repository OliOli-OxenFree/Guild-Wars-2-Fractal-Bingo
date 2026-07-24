const STATES = ["", "done", "blocked"];

function cardIdFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("c");
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
}

function storageKey(id) {
  return `bingo-card-states-${id}`;
}

function loadStates(id) {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStates(id, states) {
  localStorage.setItem(storageKey(id), JSON.stringify(states));
}

function cellKey(row, col) {
  return `${row}-${col}`;
}

function nextState(current) {
  const i = STATES.indexOf(current);
  return STATES[(i + 1) % STATES.length];
}

const id = cardIdFromPath();
const boardEl = document.getElementById("board");
const subtitleEl = document.getElementById("subtitle");
const errorEl = document.getElementById("card-error");
const resetBtn = document.getElementById("reset-states");

if (!id) {
  errorEl.textContent = "Invalid card link.";
  errorEl.hidden = false;
  subtitleEl.textContent = "";
} else {
  fetch(`/api/cards/${encodeURIComponent(id)}`)
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.error || "Card not found.");
      subtitleEl.textContent = "Mark squares as you go—your marks are saved in this browser.";
      renderBoard(data.grid, id);
    })
    .catch((err) => {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      subtitleEl.textContent = "";
    });
}

let boardGrid = null;
let boardCardId = null;

function renderBoard(grid, cardId) {
  boardGrid = grid;
  boardCardId = cardId;
  let states = loadStates(cardId);
  boardEl.innerHTML = "";

  grid.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "cell";
      el.textContent = cell.label;

      const key = cellKey(ri, ci);
      const isFree = cell.type === "free";

      if (isFree) {
        el.classList.add("free");
        el.disabled = true;
        el.setAttribute("aria-label", "Free space");
      } else {
        const state = states[key] || "";
        if (state) el.classList.add(state);
        el.setAttribute("aria-label", cell.label);

        el.addEventListener("click", () => {
          const next = nextState(states[key] || "");
          if (next) {
            states[key] = next;
          } else {
            delete states[key];
          }
          el.classList.remove("done", "blocked");
          if (next) el.classList.add(next);
          saveStates(cardId, states);
        });
      }

      boardEl.appendChild(el);
    });
  });
}

resetBtn.addEventListener("click", () => {
  if (!boardGrid || !boardCardId) return;
  saveStates(boardCardId, {});
  renderBoard(boardGrid, boardCardId);
});
