"use strict";
(function () {
  var COLS = 8, ROWS = 8, TYPES = 7;
  var SWAP_MS = 180, CLEAR_MS = 230, DROP_MS = 340;
  var TEXT = (typeof window !== "undefined" && window.TEXT) ? window.TEXT : {};

  var ROCK = TYPES * 10;
  var SPECIAL_ROW = 1, SPECIAL_COL = 2, SPECIAL_BOMB = 3;

  function isRock(t) { return t === ROCK; }
  function isSpecial(t) { return t >= TYPES * 2 && t < ROCK; }
  function typeOf(t) { return (t < 0 || t === ROCK) ? -1 : t % TYPES; }
  function powerOf(t) {
    if (t >= TYPES * 4) return SPECIAL_BOMB;
    if (t >= TYPES * 3) return SPECIAL_COL;
    return SPECIAL_ROW;
  }
  function makeSpecial(power, type) { return TYPES * (power + 1) + type; }
  function specialFor(len, horizontal) {
    return len >= 5 ? SPECIAL_BOMB : (horizontal ? SPECIAL_ROW : SPECIAL_COL);
  }

  function randType() { return (Math.random() * TYPES) | 0; }

  function findMarked(g) {
    var mark = [], seen = new Set();
    var runs = lineRuns(g), i, j, key, cells;
    for (i = 0; i < runs.length; i++) {
      cells = runs[i].cells;
      for (j = 0; j < cells.length; j++) {
        key = cells[j][0] * COLS + cells[j][1];
        if (!seen.has(key)) { seen.add(key); mark.push(cells[j]); }
      }
    }
    return mark;
  }

  function lineRuns(g) {
    var runs = [], r, c, e, t, base, cells;
    for (r = 0; r < ROWS; r++) {
      c = 0;
      while (c < COLS) {
        t = g[r][c];
        if (t < 0 || t === ROCK) { c++; continue; }
        base = t % TYPES;
        e = c + 1;
        while (e < COLS && g[r][e] >= 0 && g[r][e] !== ROCK && g[r][e] % TYPES === base) e++;
        if (e - c >= 3) {
          cells = [];
          for (var k = c; k < e; k++) cells.push([r, k]);
          runs.push({ cells: cells, type: base, horizontal: true });
        }
        c = e;
      }
    }
    for (c = 0; c < COLS; c++) {
      r = 0;
      while (r < ROWS) {
        t = g[r][c];
        if (t < 0 || t === ROCK) { r++; continue; }
        base = t % TYPES;
        e = r + 1;
        while (e < ROWS && g[e][c] >= 0 && g[e][c] !== ROCK && g[e][c] % TYPES === base) e++;
        if (e - r >= 3) {
          cells = [];
          for (var j = r; j < e; j++) cells.push([j, c]);
          runs.push({ cells: cells, type: base, horizontal: false });
        }
        r = e;
      }
    }
    return runs;
  }

  function matchRuns(g) {
    var runs = lineRuns(g), out = [], i;
    for (i = 0; i < runs.length; i++) out.push(runs[i].cells.length);
    return out;
  }

  function swapCells(g, a, b) {
    var t = g[a[0]][a[1]];
    g[a[0]][a[1]] = g[b[0]][b[1]];
    g[b[0]][b[1]] = t;
  }

  function hasValidMove(g) {
    var r, c, t, u;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        t = g[r][c];
        if (t < 0 || t === ROCK) continue;
        if (c + 1 < COLS) {
          u = g[r][c + 1];
          if (u >= 0 && u !== ROCK) {
            if (isSpecial(t) && isSpecial(u)) return true;
            swapCells(g, [r, c], [r, c + 1]);
            if (findMarked(g).length) { swapCells(g, [r, c], [r, c + 1]); return true; }
            swapCells(g, [r, c], [r, c + 1]);
          }
        }
        if (r + 1 < ROWS) {
          u = g[r + 1][c];
          if (u >= 0 && u !== ROCK) {
            if (isSpecial(t) && isSpecial(u)) return true;
            swapCells(g, [r, c], [r + 1, c]);
            if (findMarked(g).length) { swapCells(g, [r, c], [r + 1, c]); return true; }
            swapCells(g, [r, c], [r + 1, c]);
          }
        }
      }
    }
    return false;
  }

  function genBoard(rockCount) {
    var g, spots, r, c, k, idx, s;
    for (;;) {
      g = [];
      for (r = 0; r < ROWS; r++) {
        g[r] = [];
        for (c = 0; c < COLS; c++) g[r][c] = randType();
      }
      spots = [];
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) spots.push([r, c]);
      for (k = 0; k < (rockCount || 0) && spots.length; k++) {
        idx = (Math.random() * spots.length) | 0;
        s = spots.splice(idx, 1)[0];
        g[s[0]][s[1]] = ROCK;
      }
      if (findMarked(g).length === 0 && hasValidMove(g)) return g;
    }
  }

  function reshuffle(g) {
    var rocks = [], r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (g[r][c] === ROCK) rocks.push([r, c]);
    for (;;) {
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (g[r][c] !== ROCK) g[r][c] = randType();
      if (findMarked(g).length === 0 && hasValidMove(g)) return;
    }
  }

  function collapse(g) {
    var flight = [];
    var c, r, k, t, write;
    function spawn(col, row) {
      var nt = randType();
      flight.push({ type: nt, col: col, fromR: -1, toR: row });
      return nt;
    }
    for (c = 0; c < COLS; c++) {
      write = ROWS - 1;
      for (r = ROWS - 1; r >= 0; r--) {
        t = g[r][c];
        if (t === ROCK) {
          for (k = write; k > r; k--) g[k][c] = spawn(c, k);
          write = r - 1;
        } else if (t >= 0) {
          if (r !== write) {
            g[write][c] = t;
            g[r][c] = -1;
            flight.push({ type: t, col: c, fromR: r, toR: write });
          }
          write--;
        }
      }
      for (k = write; k >= 0; k--) g[k][c] = spawn(c, k);
    }
    return flight;
  }

  var G = {
    cols: COLS, rows: ROWS,
    grid: null, state: "idle", sel: null,
    score: 0, target: 0, moves: 0, level: 1,
    cascade: 0,
    geom: { left: 0, top: 0, cell: 0 },
    onEvent: null
  };

  var now = 0;

  function emit(type, val) { if (G.onEvent) G.onEvent(type, val); }
  function pxX(c) { return G.geom.left + c * G.geom.cell; }
  function pxY(r) { return G.geom.top + r * G.geom.cell; }

  G.now = function () { return now; };

  G.onResize = function (W, H) {
    var side = Math.min(W, H);
    var cell = Math.floor(side / COLS);
    G.geom.left = Math.floor((W - cell * COLS) / 2);
    G.geom.top = Math.floor((H - cell * ROWS) / 2);
    G.geom.cell = cell;
  };

  function startSwap(a, b) {
    swapCells(G.grid, a, b);
    G.swapCells = [a.slice(), b.slice()];
    return {
      a: { cell: a, type: G.grid[a[0]][a[1]] },
      b: { cell: b, type: G.grid[b[0]][b[1]] },
      t0: now, dur: SWAP_MS
    };
  }

  function blastArea(r, c, power) {
    var out = [], i, dr, dc;
    if (power === SPECIAL_ROW) {
      for (i = 0; i < COLS; i++) out.push([r, i]);
    } else if (power === SPECIAL_COL) {
      for (i = 0; i < ROWS; i++) out.push([i, c]);
    } else {
      for (dr = -1; dr <= 1; dr++) {
        for (dc = -1; dc <= 1; dc++) out.push([r + dr, c + dc]);
      }
    }
    return out;
  }

  function expandClears(start) {
    var out = [], seen = new Set(), queue = start.slice(), i, cell, r, c, key, v, area;
    while (queue.length) {
      cell = queue.pop();
      r = cell[0]; c = cell[1];
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      key = r * COLS + c;
      if (seen.has(key)) continue;
      v = G.grid[r][c];
      if (v < 0 || v === ROCK) continue;
      seen.add(key);
      out.push([r, c]);
      if (isSpecial(v)) {
        area = blastArea(r, c, powerOf(v));
        for (i = 0; i < area.length; i++) queue.push(area[i]);
      }
    }
    return out;
  }

  function resolveChain() {
    var pending = G.pendingBlast;
    G.pendingBlast = null;
    var seed = pending ? pending : findMarked(G.grid);
    if (seed.length === 0) { endTurn(); return; }
    G.cascade++;
    var runs = lineRuns(G.grid);
    var spawns = [], i, j, L, rc, sc, same;
    for (i = 0; i < runs.length; i++) {
      L = runs[i].cells.length;
      if (L < 4) continue;
      rc = runs[i].cells[L >> 1];
      if (G.swapCells) {
        for (j = 0; j < G.swapCells.length; j++) {
          sc = G.swapCells[j];
          same = runs[i].cells.some(function (cell) {
            return cell[0] === sc[0] && cell[1] === sc[1];
          });
          if (same) { rc = sc; break; }
        }
      }
      spawns.push({ cell: rc, value: makeSpecial(specialFor(L, runs[i].horizontal), runs[i].type) });
    }
    var marked = expandClears(seed);
    var gained = 0;
    for (i = 0; i < runs.length; i++) {
      L = runs[i].cells.length;
      gained += L * 10 * G.cascade + (L >= 4 ? (L - 3) * 30 * G.cascade : 0);
    }
    if (pending) gained += 60 * G.cascade;
    G.score += gained;
    emit("score", G.score);
    if (G.cascade > 1) emit("flash", TEXT.cascade(G.cascade));
    var spawnKeys = {};
    var clearList = [];
    G.clears = [];
    for (i = 0; i < marked.length; i++) {
      rc = marked[i];
      if (spawnKeys[rc[0] + ":" + rc[1]]) continue;
      var t = G.grid[rc[0]][rc[1]];
      if (t < 0) continue;
      G.clears.push({ type: t, row: rc[0], col: rc[1], t0: now, dur: CLEAR_MS });
      clearList.push({ type: t, row: rc[0], col: rc[1] });
      G.grid[rc[0]][rc[1]] = -1;
    }
    if (clearList.length) emit("clears", clearList);
    if (G.cascade > 1) emit("cascade", G.cascade);
    for (i = 0; i < spawns.length; i++) G.grid[spawns[i].cell[0]][spawns[i].cell[1]] = spawns[i].value;
    G.swapCells = null;
    G.clearDoneAt = now + CLEAR_MS;
    G.state = "clear";
  }

  function doDrop() {
    var flight = collapse(G.grid);
    G.flight = [];
    for (var i = 0; i < flight.length; i++) {
      var f = flight[i];
      var y0 = f.fromR < 0 ? pxY(-1) : pxY(f.fromR);
      var y1 = pxY(f.toR);
      var dur = DROP_MS + Math.random() * 80;
      G.flight.push({ type: f.type, col: f.col, row: f.toR, y0: y0, y1: y1, t0: now, dur: dur });
    }
    G.state = "drop";
  }

  function endTurn() {
    G.cascade = 0;
    if (G.score >= G.target) {
      G.state = "ended";
      emit("end", { won: true });
      return;
    }
    G.moves--;
    emit("moves", G.moves);
    if (G.moves <= 0) {
      G.state = "ended";
      emit("end", { won: false });
      return;
    }
    G.pendingBlast = null;
    G.swapCells = null;
    if (!hasValidMove(G.grid)) {
      reshuffle(G.grid);
      emit("hint", TEXT.shuffleHint);
    }
    G.state = "idle";
    emit("idle", null);
  }

  G.update = function (dt) {
    now += dt * 1000;
    if (G.state === "swap") {
      if (now >= G.swap.t0 + G.swap.dur) {
        G.swap = null;
        resolveChain();
      }
    } else if (G.state === "clear") {
      if (now >= G.clearDoneAt) {
        G.clears = null;
        doDrop();
      }
    } else if (G.state === "drop") {
      var done = true;
      for (var i = 0; i < G.flight.length; i++) {
        if (now < G.flight[i].t0 + G.flight[i].dur) { done = false; break; }
      }
      if (done) { G.flight = null; resolveChain(); }
    }
  };

  G.tap = function (col, row) {
    if (G.state !== "idle" && G.state !== "selected") return;
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    var cur = [row, col];
    if (isRock(G.grid[row][col])) { emit("hint", TEXT.blocked); return; }
    if (!G.sel) {
      G.sel = cur;
      G.state = "selected";
      emit("select", cur);
      return;
    }
    var a = G.sel;
    if (a[0] === cur[0] && a[1] === cur[1]) {
      G.sel = null;
      G.state = "idle";
      emit("select", null);
      return;
    }
    var d = Math.abs(a[0] - cur[0]) + Math.abs(a[1] - cur[1]);
    G.sel = null;
    G.state = "idle";
    if (d !== 1) return;
    var ta = G.grid[a[0]][a[1]], tb = G.grid[cur[0]][cur[1]];
    if (isRock(tb)) { emit("hint", TEXT.blocked); return; }
    var both = isSpecial(ta) && isSpecial(tb);
    swapCells(G.grid, a, cur);
    var ok = both || findMarked(G.grid).length > 0;
    swapCells(G.grid, a, cur);
    if (ok) {
      G.pendingBlast = both ? [a, cur] : null;
      G.swap = startSwap(a, cur);
      G.state = "swap";
    }
  };

  G.newLevel = function () {
    G.level = G.level || 1;
    G.target = 300 + (G.level - 1) * 260;
    G.moves = 18 + Math.min(G.level, 8);
    G.score = 0;
    G.cascade = 0;
    G.grid = genBoard(Math.min(10, 2 + Math.floor((G.level - 1) / 2)));
    G.sel = null;
    G.clears = null;
    G.flight = null;
    G.swap = null;
    G.swapCells = null;
    G.pendingBlast = null;
    G.state = "idle";
    emit("init", { level: G.level, target: G.target, moves: G.moves, score: 0 });
    emit("hint", TEXT.hint);
    emit("hidden", true);
  };

  G.isRock = isRock;
  G.isSpecial = isSpecial;
  G.typeOf = typeOf;
  G.powerOf = powerOf;
  if (typeof window !== "undefined") window.Game = G;
  if (typeof module !== "undefined" && module.exports) module.exports = G;

  G._forTest = {
    findMarked: findMarked,
    matchRuns: matchRuns,
    lineRuns: lineRuns,
    hasValidMove: hasValidMove,
    genBoard: genBoard,
    collapse: collapse,
    expandClears: expandClears,
    resolveChain: resolveChain,
    makeSpecial: makeSpecial,
    isRock: isRock,
    isSpecial: isSpecial,
    typeOf: typeOf,
    powerOf: powerOf,
    ROCK: ROCK,
    COLS: COLS,
    ROWS: ROWS,
    TYPES: TYPES
  };
})();

