"use strict";
(function () {
  var canvas = document.getElementById("board");
  var el = {
    score: document.getElementById("score"),
    moves: document.getElementById("moves"),
    best: document.getElementById("best"),
    hint: document.getElementById("hint"),
    flash: document.getElementById("flash"),
    overlay: document.getElementById("overlay"),
    ovTitle: document.getElementById("ovTitle"),
    ovText: document.getElementById("ovText"),
    ovBtn: document.getElementById("ovBtn"),
    abilities: document.getElementById("abilities")
  };

  var flashTimer = null;
  function showFlash(msg) {
    el.flash.textContent = msg;
    el.flash.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { el.flash.classList.remove("show"); }, 900);
  }

  function showAbilities(list) {
    if (!list) return;
    var pal = (window.Draw && window.Draw.palette) || [];
    var html = "", i, a, pct;
    for (i = 0; i < list.length; i++) {
      a = list[i];
      pct = Math.min(100, Math.round(a.have / a.need * 100));
      html += '<div class="ability' + (a.done ? " done" : "") + '">' +
        '<span class="dot" style="background:' + (pal[a.color] || "#9aa8c0") + '"></span>' +
        '<span class="txt">' +
        '<span class="nm">' + TEXT.abilityLabel(TEXT.colors[a.color], TEXT.symbols[a.symbol]) + '</span>' +
        '<span class="bar"><i style="width:' + pct + '%"></i></span>' +
        '</span>' +
        '<span class="cnt">' + TEXT.abilityProgress(a.have, a.need) + '</span>' +
        '</div>';
    }
    el.abilities.innerHTML = html;
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
      el.best.textContent = val.best;
      el.score.textContent = val.score;
      el.moves.textContent = val.moves;
      el.overlay.classList.remove("show");
    } else if (type === "score") {
      el.score.textContent = val;
    } else if (type === "moves") {
      el.moves.textContent = val;
    } else if (type === "flash") {
      showFlash(val);
    } else if (type === "hint") {
      el.hint.textContent = val;
    } else if (type === "clears") {
      var g = window.Game.geom;
      var n = val.length;
      for (var i = 0; i < n; i++) {
        var c = val[i];
        var cx = g.left + c.col * g.cell + g.cell / 2;
        var cy = g.top + c.row * g.cell + g.cell / 2;
        if (window.PixelFX) window.PixelFX[n >= 5 ? "specialClear" : "clearBurst"](cx, cy, c.type % 7);
      }
    } else if (type === "cascade") {
      var gc = window.Game.geom;
      var grid = window.Game.grid;
      if (window.PixelFX && grid) {
        window.PixelFX.cascadeFlash(
          gc.left + gc.cell * grid[0].length / 2,
          gc.top + gc.cell * grid.length / 2
        );
      }
    } else if (type === "power") {
      var pg = window.Game.geom;
      var px = pg.left + val.col * pg.cell + pg.cell / 2;
      var py = pg.top + val.row * pg.cell + pg.cell / 2;
      if (window.PixelFX) window.PixelFX.powerBlast(px, py, 0);
    } else if (type === "end") {
      var isNewBest = val.score >= val.best;
      el.ovTitle.textContent = isNewBest ? TEXT.newBestTitle : TEXT.endTitle;
      el.ovText.textContent = TEXT.endText(val.score, val.best);
      el.ovBtn.textContent = TEXT.again;
      el.overlay.classList.add("show");
    } else if (type === "abilities") {
      showAbilities(val);
    }
  };

  el.ovBtn.addEventListener("click", function () {
    window.Game.newGame();
  });

  window.Game.newGame();
})();
