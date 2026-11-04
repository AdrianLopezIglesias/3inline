# Farm 3 (3inline)

A self-contained, mobile-friendly match-3 puzzle web app in the spirit of Bejeweled,
Gems of War and Hero Farm Saga: swap adjacent crops to line up three or more, clear
them with cascading refills, and hit a per-level score goal within a move budget.

## run

Start the dev server, then open the printed URL (it binds a random free local
port, so nothing currently in use is taken):

```bash
node server.js
# Farm 3 serving at http://localhost:<port>
```

Play on a phone: tap a crop to select it, then tap an adjacent crop to swap.
Only swaps that form at least one match are allowed.

## test

The board logic is kept independent of the DOM for testability.

```bash
node --test game.test.js
```

`game.js` exports its internals (`G._forTest`) under Node and its API
(`window.Game`) in the browser. Tests cover board generation (no initial matches,
always a valid move), match detection (rows/cols), run scoring, move validity, and
collapse/refill ordering.

## stack

- Plain HTML/CSS/JS. No frameworks, no bundler, no install step; pixelfx (MIT) is vendored
  into `pixelfx-vendor.js` as a classic script rather than added as a dependency.
- One canvas (2D) renders the board; DOM elements show level/score/moves, goal,
  cascade flash, and the win/lose overlay.
- Classic scripts loaded in order (text.js, stage.js, game.js, fx-config.js, pixelfx-vendor.js, fx.js,
  draw.js, main.js) so the page also works from `file://`. `fx-config.js` must load before `fx.js`
  and `draw.js`, which read it.

## layout

- `index.html` — shell, header stats, canvas, footer goal, overlay.
- `style.css` — mobile-first layout, farm palette.
- `text.js` — every user-facing string, in one place.
- `stage.js` — canvas + device-pixel buffer, resize, the frame loop (clamped dt).
- `game.js` — board model, pure rules, and the game state machine.
- `draw.js` — canvas rendering (tiles, swap/clear/drop animation, selection ring).
- `fx.js` — board effects: hand-rolled cascade/ring bursts plus the vendored pixelfx hits, blitted from pixel frames.
- `fx-config.js` — effect tuning in one place (kick/cascade specs, library widths, `gravitySpeed`, `gemsBounce`); loaded before `fx.js` and `draw.js`, which read it.
- `pixelfx-vendor.js` — the pixelfx engine and three of its effects generated into one classic script (`window.PixelFXLIB`); regenerate, do not hand-edit.
- `main.js` — pointer/tap input and DOM wiring.

## conventions

- Update then draw; draw never mutates state. Motion is per-second times dt.
- String text lives only in `text.js`; components read by key.
- Vector symbols are drawn per type in `draw.js`; a saturated, gradient-shaded tile backs each one.
