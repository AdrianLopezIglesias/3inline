"use strict";
(function () {
  var canvas = document.getElementById("board");
  var el = {
    score: document.getElementById("score"),
    moves: document.getElementById("moves"),
    goal: document.getElementById("goal"),
    level: document.getElementById("level"),
    hint: document.getElementById("hint"),
    flash: document.getElementById("flash"),
    overlay: document.getElementById("overlay"),
    ovTitle: document.getElementById("ovTitle"),
    ovText: document.getElementById("ovText"),
    ovBtn: document.getElementById("ovBtn")
  };

  var flashTimer = null;
  function showFlash(msg) {
    el.flash.textContent = msg;
    el.flash.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { el.flash.classList.remove("show"); }, 900);
  }

  function ptrToCell(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left, y = e.clientY - rect.top;
    var g = window.Game.geom;
    var c = Math.floor((x - g.left) / g.cell);
    var r = Math.floor((y - g.top) / g.cell);
    if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) return null;
    return [c, r];
  }

  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    var cell = ptrToCell(e);
    if (!cell) return;
    window.Game.tap(cell[0], cell[1]);
  });

  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  window.Game.onEvent = function (type, val) {
    if (type === "init") {
      el.level.textContent = val.level;
      el.score.textContent = val.score;
      el.moves.textContent = val.moves;
      el.goal.textContent = val.target;
      el.overlay.classList.remove("show");
    } else if (type === "score") {
      el.score.textContent = val;
    } else if (type === "moves") {
      el.moves.textContent = val;
    } else if (type === "flash") {
      showFlash(val);
    } else if (type === "hint") {
      el.hint.textContent = val;
    } else if (type === "end") {
      if (val.won) {
        el.ovTitle.textContent = TEXT.winTitle;
        el.ovText.textContent = TEXT.winText(window.Game.level + 1);
        el.ovBtn.textContent = TEXT.next;
      } else {
        el.ovTitle.textContent = TEXT.loseTitle;
        el.ovText.textContent = TEXT.loseText;
        el.ovBtn.textContent = TEXT.again;
      }
      el.overlay.classList.add("show");
    }
  };

  el.ovBtn.addEventListener("click", function () {
    if (el.ovBtn.textContent === TEXT.next) window.Game.level++;
    window.Game.newLevel();
  });

  window.Game.level = 1;
  window.Game.newLevel();
})();
