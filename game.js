"use strict";
(function () {
  var COLS = 10, ROWS = 10, TYPES = 7;
  var SWAP_MS = 180, CLEAR_MS = 230, DROP_MS = 340;
  var TEXT = (typeof window !== "undefined" && window.TEXT) ? window.TEXT : {};

  var SYMBOLS = 3, SYMBOL_BASE = TYPES * SYMBOLS;
  var ROCK = SYMBOL_BASE * 10;
  var ABILITY_SLOTS = 3, ABILITY_POINTS = 300;
  var SPECIAL_ROW = 1, SPECIAL_COL = 2, SPECIAL_BOMB = 3,
    SPECIAL_CROSS = 4, SPECIAL_BLAST = 5, SPECIAL_SUPER = 6,
    POWER_BLAST = 7, POWER_UPGRADE = 8;

  function isRock(t) { return t === ROCK; }
  function isSpecial(t) { return t >= SYMBOL_BASE && t < ROCK; }
  function typeOf(t) { return (t < 0 || t === ROCK) ? -1 : t % TYPES; }
  function symbolOf(t) {
    if (t < 0 || t >= SYMBOL_BASE) return -1;
    return Math.floor(t / TYPES);
  }
  function powerOf(t) {
    if (t < SYMBOL_BASE || t >= ROCK) return -1;
    return Math.floor((t - SYMBOL_BASE) / TYPES);
  }
  function makeSpecial(power, type) { return SYMBOL_BASE + TYPES * power + type; }
  function specialFor(len, horizontal) {
    if (len >= 6) return SPECIAL_BLAST;
    if (len >= 5) return SPECIAL_SUPER;
    return horizontal ? SPECIAL_ROW : SPECIAL_COL;
  }

  function randType() { return (Math.random() * TYPES) | 0; }
  function randTile() { return ((Math.random() * SYMBOLS) | 0) * TYPES + randType(); }

  function rollAbilities() {
    var used = {}, out = [], i, color, symbol, key;
    for (i = 0; i < ABILITY_SLOTS; i++) {
      do {
        color = randType();
        symbol = (Math.random() * SYMBOLS) | 0;
        key = color + ":" + symbol;
      } while (used[key]);
      used[key] = 1;
      out.push({ color: color, symbol: symbol, need: 4 + ((Math.random() * 5) | 0), have: 0, done: false });
    }
    return out;
  }

  function harvestAbilities(list, tiles) {
    var i, j, a, v, color, symbol, points = 0;
    for (j = 0; j < list.length; j++) {
      a = list[j];
      if (a.done) continue;
      for (i = 0; i < tiles.length; i++) {
        v = tiles[i].type;
        color = typeOf(v);
        symbol = symbolOf(v);
        if (symbol < 0 || color !== a.color || symbol !== a.symbol) continue;
        a.have++;
      }
      if (a.have >= a.need) {
        a.have = a.need;
        a.done = true;
        points += ABILITY_POINTS;
      }
    }
    return points;
  }

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
        for (c = 0; c < COLS; c++) g[r][c] = randTile();
      }
      spots = [];
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) spots.push([r, c]);
      for (k = 0; k < (rockCount || 0) && spots.length; k++) {
        idx = (Math.random() * spots.length) | 0;
        s = spots.splice(idx, 1)[0];
        g[s[0]][s[1]] = ROCK;
      }
      for (k = 0; k < 2 && spots.length; k++) {
        idx = (Math.random() * spots.length) | 0;
        s = spots.splice(idx, 1)[0];
        g[s[0]][s[1]] = makeSpecial(k === 0 ? POWER_BLAST : POWER_UPGRADE, randType());
      }
      if (findMarked(g).length === 0 && hasValidMove(g)) return g;
    }
  }

  function reshuffle(g) {
    var rocks = [], r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (g[r][c] === ROCK) rocks.push([r, c]);
    for (;;) {
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (g[r][c] !== ROCK) g[r][c] = randTile();
      if (findMarked(g).length === 0 && hasValidMove(g)) return;
    }
  }

  function collapse(g) {
    var flight = [];
    var c, r, k, t, write;
    function spawn(col, row) {
      var nt = randTile();
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
    score: 0, moves: 0, bestScore: 0,
    cascade: 0,
    geom: { left: 0, top: 0, cell: 0 },
    abilities: null,
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

  function blastArea(r, c, power, type) {
    var out = [], i, rr, cc;
    if (power === SPECIAL_ROW) {
      for (i = 0; i < COLS; i++) out.push([r, i]);
    } else if (power === SPECIAL_COL) {
      for (i = 0; i < ROWS; i++) out.push([i, c]);
    } else if (power === SPECIAL_CROSS) {
      for (i = 0; i < COLS; i++) out.push([r, i]);
      for (i = 0; i < ROWS; i++) out.push([i, c]);
    } else if (power === SPECIAL_BLAST) {
      for (rr = r - 2; rr <= r + 2; rr++) {
        for (cc = c - 2; cc <= c + 2; cc++) out.push([rr, cc]);
      }
    } else if (power === SPECIAL_SUPER) {
      for (rr = 0; rr < ROWS; rr++) {
        for (cc = 0; cc < COLS; cc++) {
          if (G.grid[rr][cc] >= 0 && G.grid[rr][cc] !== ROCK && typeOf(G.grid[rr][cc]) === type) out.push([rr, cc]);
        }
      }
    } else if (power === SPECIAL_BOMB) {
      for (rr = -1; rr <= 1; rr++) {
        for (cc = -1; cc <= 1; cc++) out.push([r + rr, c + cc]);
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
        area = blastArea(r, c, powerOf(v), typeOf(v));
        for (i = 0; i < area.length; i++) queue.push(area[i]);
      }
    }
    return out;
  }

  function firePower(from, target, power) {
    var list = [from.slice()], i, area, tv;
    if (power === POWER_BLAST) {
      area = blastArea(target[0], target[1], SPECIAL_BOMB);
      for (i = 0; i < area.length; i++) list.push(area[i]);
    } else {
      tv = G.grid[target[0]][target[1]];
      if (tv >= 0 && !isRock(tv)) G.grid[target[0]][target[1]] = makeSpecial(SPECIAL_BOMB, typeOf(tv));
    }
    emit("power", { power: power, row: from[0], col: from[1], target: target.slice() });
    G.cascade = 0;
    G.swapCells = null;
    G.clears = [];
    G.pendingBlast = list;
    resolveChain();
  }

  function resolveChain() {
    var pending = G.pendingBlast;
    G.pendingBlast = null;
    var seed = pending ? pending : findMarked(G.grid);
    if (seed.length === 0) { endTurn(); return; }
    G.cascade++;
    var runs = lineRuns(G.grid);
    var spawns = [], i, j, L, rc, sc, same, key, parts, hKeys = {}, vKeys = {};
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
    var hKeys = {}, vKeys = {};
    for (i = 0; i < runs.length; i++) {
      for (j = 0; j < runs[i].cells.length; j++) {
        key = runs[i].cells[j][0] + ":" + runs[i].cells[j][1];
        if (runs[i].horizontal) hKeys[key] = runs[i];
        else vKeys[key] = runs[i];
      }
    }
    for (key in hKeys) {
      if (!vKeys[key]) continue;
      parts = key.split(":");
      spawns.push({ cell: [+parts[0], +parts[1]], value: makeSpecial(SPECIAL_CROSS, hKeys[key].type) });
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
    if (G.abilities && clearList.length) {
      var bonus = harvestAbilities(G.abilities, clearList);
      if (bonus) {
        G.score += bonus;
        emit("score", G.score);
        emit("flash", TEXT.abilityDone);
      }
      emit("abilities", G.abilities);
    }
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
    G.moves--;
    emit("moves", G.moves);
    if (G.moves <= 0) {
      G.state = "ended";
      if (G.score > G.bestScore) {
        G.bestScore = G.score;
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("farm3_best", G.bestScore);
        }
      }
      emit("end", { score: G.score, best: G.bestScore });
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
      var sp = powerOf(G.grid[row][col]);
      if (sp === POWER_BLAST) emit("hint", TEXT.powerBlast);
      else if (sp === POWER_UPGRADE) emit("hint", TEXT.powerUpgrade);
      return;
    }
    var a = G.sel;
    if (a[0] === cur[0] && a[1] === cur[1]) {
      G.sel = null;
      G.state = "idle";
      emit("select", null);
      return;
    }
    var ta = G.grid[a[0]][a[1]], tb = G.grid[cur[0]][cur[1]];
    var tp = powerOf(ta);
    if (tp === POWER_BLAST || tp === POWER_UPGRADE) {
      if (isRock(tb)) { G.state = "selected"; emit("hint", TEXT.blocked); return; }
      if (tp === POWER_UPGRADE && isSpecial(tb)) { G.state = "selected"; emit("hint", TEXT.powerPlain); return; }
      G.sel = null;
      G.state = "idle";
      firePower(a, cur, tp);
      return;
    }
    var d = Math.abs(a[0] - cur[0]) + Math.abs(a[1] - cur[1]);
    G.sel = null;
    G.state = "idle";
    if (d !== 1) return;
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
  G.newGame = function () {
    var saved = 0;
    if (typeof window !== "undefined" && window.localStorage) {
      saved = parseInt(window.localStorage.getItem("farm3_best") || "0", 10) || 0;
    }
    G.bestScore = saved;
    G.moves = 20;
    G.score = 0;
    G.cascade = 0;
    G.grid = genBoard(0);
    G.sel = null;
    G.clears = null;
    G.flight = null;
    G.swap = null;
    G.swapCells = null;
    G.pendingBlast = null;
    G.abilities = rollAbilities();
    G.state = "idle";
    emit("init", { moves: G.moves, score: 0, best: G.bestScore });
    emit("abilities", G.abilities);
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
    blastArea: blastArea,
    firePower: firePower,
    specialFor: specialFor,
    resolveChain: resolveChain,
    makeSpecial: makeSpecial,
    isRock: isRock,
    isSpecial: isSpecial,
    typeOf: typeOf,
    powerOf: powerOf,
    SPECIAL_ROW: SPECIAL_ROW,
    SPECIAL_COL: SPECIAL_COL,
    SPECIAL_BOMB: SPECIAL_BOMB,
    SPECIAL_CROSS: SPECIAL_CROSS,
    SPECIAL_BLAST: SPECIAL_BLAST,
    SPECIAL_SUPER: SPECIAL_SUPER,
    POWER_BLAST: POWER_BLAST,
    POWER_UPGRADE: POWER_UPGRADE,
    ROCK: ROCK,
    COLS: COLS,
    ROWS: ROWS,
    TYPES: TYPES,
    SYMBOLS: SYMBOLS,
    SYMBOL_BASE: SYMBOL_BASE,
    symbolOf: symbolOf,
    randTile: randTile,
    rollAbilities: rollAbilities,
    harvestAbilities: harvestAbilities,
    ABILITY_SLOTS: ABILITY_SLOTS
  };
})();

