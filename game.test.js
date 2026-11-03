"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("./game.js");
const T = G._forTest;

function blankGrid() {
  return Array.from({ length: T.ROWS }, () => Array(T.COLS).fill(-1));
}

test("genBoard has no initial matches and at least one valid move", () => {
  for (let i = 0; i < 50; i++) {
    const g = T.genBoard();
    assert.equal(T.findMarked(g).length, 0, "board must start with no matches");
    assert.equal(T.hasValidMove(g), true, "board must have a valid move");
  }
});

test("findMarked finds horizontal runs", () => {
  const g = blankGrid();
  g[0][0] = 1; g[0][1] = 1; g[0][2] = 1; // row run in row 0
  g[3][4] = 2; g[3][5] = 2; g[3][6] = 2; g[3][7] = 2; // row run of 4
  const marked = T.findMarked(g);
  assert.equal(marked.length, 7);
});

test("findMarked finds vertical runs", () => {
  const g = blankGrid();
  g[0][2] = 3; g[1][2] = 3; g[2][2] = 3; // col run in col 2
  const marked = T.findMarked(g);
  assert.equal(marked.length, 3);
});

test("matchRuns reports run lengths including 4+", () => {
  const g = blankGrid();
  g[0][0] = 1; g[0][1] = 1; g[0][2] = 1;
  g[2][0] = 5; g[2][1] = 5; g[2][2] = 5; g[2][3] = 5;
  const runs = T.matchRuns(g);
  assert.deepEqual(runs.sort(), [3, 4]);
});

test("hasValidMove detects a one-swap match", () => {
  const g = blankGrid();
  g[0][0] = 1; g[0][1] = 2; g[0][2] = 1;
  g[0][3] = 3; g[0][4] = 4;
  // swapping (0,1) with (1,1) -> (0,1)=2, (1,1)=1 won't match.
  // place a column pair so a swap makes a run:
  g[1][1] = 1; g[2][1] = 1;
  // (0,0)=1, (1,1)=1, (2,1)=1 -> after swapping (0,0) and (0,1): (0,0)=2,(0,1)=1 vertical? no.
  // Simplest known-true: a board with a clear valid move.
  assert.equal(T.hasValidMove(g), true);
});

test("hasValidMove false on a no-move board", () => {
  // Build a checkerboard-ish board with no equal neighbors => no move.
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) {
    for (let c = 0; c < T.COLS; c++) {
      g[r][c] = (r + c) % T.TYPES;
    }
  }
  assert.equal(T.hasValidMove(g), false);
});

test("collapse removes all holes and preserves column order from bottom", () => {
  const g = blankGrid();
  // column 0: full, no holes (fill all 10 rows)
  for (let r = 0; r < T.ROWS; r++) g[r][0] = r % 6;
  // column 1: one hole at row 2
  for (let r = 0; r < T.ROWS; r++) g[r][1] = ((r + 1) % 6) + 1;
  g[2][1] = -1;

  const origCol1BottomUp = [];
  for (let r = T.ROWS - 1; r >= 0; r--) if (g[r][1] >= 0) origCol1BottomUp.push(g[r][1]);

  T.collapse(g);

  for (let r = 0; r < T.ROWS; r++) {
    for (let c = 0; c < T.COLS; c++) {
      assert.ok(g[r][c] >= 0, `cell (${r},${c}) must be filled`);
    }
  }
  // one hole -> one spawn at top, so bottom N-1 tiles keep original order
  const afterCol1BottomUp = [];
  for (let r = T.ROWS - 1; r >= 1; r--) afterCol1BottomUp.push(g[r][1]);
  assert.deepEqual(afterCol1BottomUp, origCol1BottomUp, "original tiles preserve bottom-up order");
});

test("newGame initialises a fresh, valid board", () => {
  const events = [];
  G.onEvent = (type, val) => events.push([type, val]);
  G.newGame();
  assert.equal(G.grid.length, T.ROWS);
  assert.deepEqual(G.sel, null);
  assert.equal(G.state, "idle");
  assert.equal(G.score, 0);
  assert.ok(G.moves > 0);
  assert.equal(T.findMarked(G.grid).length, 0);
  assert.equal(T.hasValidMove(G.grid), true);
  assert.ok(events.some(e => e[0] === "init"));
});
test("tap validates swap: invalid swap leaves board unchanged", () => {
  G.newGame();
  // Find an adjacent pair that does NOT form a match (guaranteed since initial board has no matches,
  // a swap that is invalid is the negative case).
  const g = G.grid;
  let a = [0, 0], b = [0, 1];
  const before = [[g[0][0], g[0][1]]];
  G.tap(a[1], a[0]);
  G.tap(b[1], b[0]);
  // If invalid, state is idle and grid unchanged.
  if (G.state === "idle") {
    assert.equal(g[0][0], before[0][0]);
    assert.equal(g[0][1], before[0][1]);
  }
});

test("rocks break runs and are not marked", () => {
  const g = blankGrid();
  g[0][0] = 1; g[0][1] = 1; g[0][2] = T.ROCK; g[0][3] = 1; g[0][4] = 1; g[0][5] = 1;
  const rows = T.lineRuns(g);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].cells, [[0, 3], [0, 4], [0, 5]]);
  assert.equal(T.findMarked(g).some(([r, c]) => r === 0 && c === 2), false);
});

test("genBoard places the requested rocks and stays playable", () => {
  for (let i = 0; i < 20; i++) {
    const g = T.genBoard(4);
    let rocks = 0;
    for (const row of g) for (const v of row) if (v === T.ROCK) rocks++;
    assert.equal(rocks, 4);
    assert.equal(T.findMarked(g).length, 0);
    assert.equal(T.hasValidMove(g), true);
  }
});

test("collapse keeps rocks fixed and refills around them", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) g[r][2] = (r % 3) + 1;
  g[3][2] = T.ROCK;
  g[2][2] = -1;
  g[5][2] = -1;
  T.collapse(g);
  assert.equal(g[3][2], T.ROCK, "rock must not move");
  for (let r = 0; r < T.ROWS; r++) assert.ok(g[r][2] >= 0, "no holes left");
});

test("expandClears detonates a row special and stops at rocks", () => {
  const g = blankGrid();
  for (let c = 0; c < T.COLS; c++) g[4][c] = 2;
  g[4][1] = T.makeSpecial(1, 2);
  g[4][5] = T.ROCK;
  G.grid = g;
  const cleared = T.expandClears([[4, 1], [4, 2]]);
  assert.ok(cleared.some(([r, c]) => r === 4 && c === 3), "blast clears along the row");
  assert.equal(cleared.some(([r, c]) => r === 4 && c === 5), false, "rock survives the blast");
});

test("resolveChain turns a 4-run into a special gem", () => {
  const g = blankGrid();
  g[0][0] = 2; g[0][1] = 2; g[0][2] = 2; g[0][3] = 2;
  G.grid = g;
  G.score = 0;
  G.cascade = 0;
  G.swapCells = null;
  G.pendingBlast = null;
  G.clears = null;
  T.resolveChain();
  const specials = [];
  for (let c = 0; c < T.COLS; c++) if (T.isSpecial(G.grid[0][c])) specials.push(c);
  assert.equal(specials.length, 1, "exactly one special is left in the run");
  assert.equal(T.typeOf(G.grid[0][specials[0]]), 2, "special keeps the crop type");
  assert.equal(G.clears.length, 4, "all four run cells animate clear before special spawns");
});

test("specialFor gives a super at five and a wide blast at six", () => {
  assert.equal(T.specialFor(4, true), T.SPECIAL_ROW);
  assert.equal(T.specialFor(4, false), T.SPECIAL_COL);
  assert.equal(T.specialFor(5, true), T.SPECIAL_SUPER);
  assert.equal(T.specialFor(6, false), T.SPECIAL_BLAST);
});

test("cross special clears its row and its column", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) g[r][c] = 1;
  g[4][4] = T.makeSpecial(T.SPECIAL_CROSS, 1);
  G.grid = g;
  const cleared = T.expandClears([[4, 4]]);
  assert.ok(cleared.some(([r, c]) => r === 4 && c === 9), "row is cleared");
  assert.ok(cleared.some(([r, c]) => r === 9 && c === 4), "column is cleared");
  assert.equal(cleared.some(([r, c]) => r === 2 && c === 2), false, "far corner survives");
});

test("blast special clears a five by five square", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) g[r][c] = 1;
  g[4][4] = T.makeSpecial(T.SPECIAL_BLAST, 1);
  G.grid = g;
  const cleared = T.expandClears([[4, 4]]);
  assert.ok(cleared.some(([r, c]) => r === 2 && c === 2), "corner of the square is cleared");
  assert.ok(cleared.some(([r, c]) => r === 6 && c === 6), "opposite corner is cleared");
  assert.equal(cleared.some(([r, c]) => r === 4 && c === 8), false, "outside the square survives");
});

test("super special clears every crop of its colour", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) {
    for (let c = 0; c < T.COLS; c++) g[r][c] = (r + c) % T.TYPES;
  }
  g[0][1] = T.makeSpecial(T.SPECIAL_SUPER, 3);
  let threes = 0;
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) if (T.typeOf(g[r][c]) === 3) threes++;
  G.grid = g;
  const cleared = T.expandClears([[0, 1]]);
  assert.equal(cleared.length, threes, "every crop of that colour is collected");
  assert.ok(cleared.every(([r, c]) => T.typeOf(G.grid[r][c]) === 3));
});

test("picked upgrade gem turns a plain crop into a bomb and is used up", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) g[r][c] = (r + c) % T.TYPES;
  g[0][0] = T.makeSpecial(T.POWER_UPGRADE, 2);
  G.grid = g;
  G.score = 0;
  G.cascade = 0;
  G.swapCells = null;
  G.pendingBlast = null;
  G.clears = null;
  T.firePower([0, 0], [5, 5], T.POWER_UPGRADE);
  assert.equal(G.grid[0][0], -1, "the picked gem is cleared");
  assert.equal(T.isSpecial(G.grid[5][5]), true, "the target became special");
  assert.equal(T.powerOf(G.grid[5][5]), T.SPECIAL_BOMB);
  assert.equal(T.typeOf(G.grid[5][5]), (5 + 5) % T.TYPES, "it keeps its crop colour");
});

test("picked blast gem clears the target and its neighbours", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) g[r][c] = (r + c) % T.TYPES;
  g[0][0] = T.makeSpecial(T.POWER_BLAST, 2);
  G.grid = g;
  G.score = 0;
  G.cascade = 0;
  G.swapCells = null;
  G.pendingBlast = null;
  G.clears = null;
  T.firePower([0, 0], [5, 5], T.POWER_BLAST);
  assert.equal(G.grid[0][0], -1, "the picked gem is cleared");
  assert.equal(G.grid[5][5], -1, "the target is cleared");
  assert.equal(G.grid[4][4], -1, "a neighbour is cleared");
  assert.ok(G.grid[8][8] >= 0, "a distant crop survives");
});

test("an L-shaped run spawns a cross gem at the corner", () => {
  const g = blankGrid();
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) g[r][c] = (r * 3 + c * 5) % T.TYPES;
  g[0][0] = 1; g[0][1] = 1; g[0][2] = 1;
  g[1][0] = 1; g[2][0] = 1;
  g[0][3] = 2; g[1][1] = 2;
  G.grid = g;
  G.score = 0;
  G.cascade = 0;
  G.swapCells = null;
  G.pendingBlast = null;
  G.clears = null;
  T.resolveChain();
  assert.equal(T.isSpecial(G.grid[0][0]), true, "the corner holds a special");
  assert.equal(T.powerOf(G.grid[0][0]), T.SPECIAL_CROSS, "and it is a cross");
});
