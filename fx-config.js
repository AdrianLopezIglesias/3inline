"use strict";
/*  Effect tuning, in one place so you can tweak by hand.
    Loaded before fx.js and draw.js; see index.html script order. */
(function () {
  window.FXConfig = {
    /* new tuning knobs */
    gravitySpeed: 1,        // multiplier on particle gravity (bursts/embers)

    /* wave() — the soft wave a gem lands with (draw.js) */
    fall: {
      land: 0.82,          // fraction of the drop spent falling; the rest is the landing
      amp: 0.06,           // peak sideways shift of a band, in tile widths
      waves: 0.7,          // ripples that fit over the tile height
      travel: 0.6,         // wave cycles that roll up through the landing
      decay: 1.4,          // how fast the wave dies out (higher = quicker)
      squashAmp: 0.24,     // how flat the gem is squeezed on impact, in tile heights
      squashBounce: 1.0,   // squash/stretch cycles before it settles (1 = one wobble)
      squashDecay: 4.2,    // how fast the wobble damps (higher = quicker)
      bulge: 0.16,         // extra width at the floor while squashed (volume feel)
      heightTaper: 0.7,    // how much the top resists squashing (0..1)
      strips: 10,          // horizontal bands the gem is drawn in
    },
    /* library hit widths, in tiles (used by fx.js LIB_LOOK) */
    libLook: { hitSpark: 2.6, cartoonPow: 3.4, smallExplosion: 6.2 },
    /* library hit brightness (passed to the pixelfx effect) */
    libLight: { hitSpark: 1.8, cartoonPow: 2.2, smallExplosion: 2.4 },
    /* library explosion playback length (1.3 = 30% longer than authored) */
    libDuration: 1.3,

    /* particle color ramps per gem type (matched to tile colors in draw.js) */
    typeRamps: [
      [[255, 236, 205], [255, 150, 60], [212, 54, 31], [130, 24, 8], [46, 8, 2]],
      [[214, 255, 228], [70, 220, 130], [20, 143, 63], [8, 74, 32], [2, 26, 10]],
      [[255, 250, 205], [255, 214, 80], [224, 164, 18], [130, 88, 6], [40, 26, 2]],
      [[255, 214, 232], [255, 90, 150], [200, 30, 90], [112, 8, 44], [38, 2, 14]],
      [[228, 214, 255], [150, 100, 250], [106, 47, 201], [54, 18, 116], [16, 4, 40]],
      [[222, 232, 246], [130, 145, 170], [63, 71, 86], [32, 37, 47], [10, 12, 16]],
      [[205, 232, 255], [80, 160, 250], [26, 111, 212], [8, 56, 130], [2, 18, 44]],
    ],

    /* kick() — hand-rolled debris layer under a library hit (fx.js)
       power is 1 for an ordinary match, ~3 for a power move; the values
       below are for power 1 and scale with power. */
    kick: {
      burst: {
        count: 280,
        speedMin: 50, speedMax: 340,
        lifeMin: 0.45, lifeMax: 0.65, lifeGrow: 0.1,
        sizeMin: 3, sizeMax: 6,
        gravity: 10, drag: 0.7, alphaMul: 2.9,
      },
      embers: {
        count: 150,
        speedMin: 35, speedMax: 100, spread: 30,
        lifeMin: 0.43, lifeMax: 0.56, lifeGrow: 0.09,
        sizeMin: 4.5, sizeMax: 9,
        rise: 60, drag: 0.5, alphaMul: 1.35,
      },
      rings: [
        { rMax: 120, life: 0.3, lifeGrow: 0.06, col: "type" },
        { rMax: 100, life: 0.36, lifeGrow: 0.06, col: [255, 255, 255] },
      ],
      power: { clear: 1.65, special: 1.9, blast: 2.8 },
      /* Per-type burst overrides, one per gem type (0-6, same order as
         typeRamps). Any field left out falls back to the shared burst,
         embers and rings above, so retuning the base still moves all of
         them. Each color gets its own shape of burst here. */
      types: [
        /* 0 ember (orange): fire — fast sparks, light gravity, swaying rise */
        { burst: { speedMin: 70, speedMax: 380, gravity: 4, drag: 0.9, sizeMin: 2.5, sizeMax: 5, lifeMin: 0.4, lifeMax: 0.8 },
          embers: { count: 220, speedMin: 20, speedMax: 90, rise: 120, sizeMin: 3, sizeMax: 7 },
          rings: [{ rMax: 140, life: 0.34, lifeGrow: 0.06, col: "type" },
                  { rMax: 60, life: 0.5, lifeGrow: 0.04, col: [255, 220, 160] }] },
        /* 1 leaf (green): slow, heavy drag, settles down leaves would */
        { burst: { count: 200, speedMin: 30, speedMax: 180, gravity: 26, drag: 1.6, sizeMin: 4, sizeMax: 9, lifeMin: 0.5, lifeMax: 0.9 },
          embers: { count: 90, speedMin: 15, speedMax: 60, spread: 40, rise: 10, drag: 1.1, sizeMin: 5, sizeMax: 10 },
          rings: [{ rMax: 110, life: 0.5, lifeGrow: 0.08, col: "type" }] },
        /* 2 spark (yellow): many tiny fast sparks, short and tight */
        { burst: { count: 320, speedMin: 110, speedMax: 520, gravity: 14, drag: 0.3, sizeMin: 2, sizeMax: 4, lifeMin: 0.28, lifeMax: 0.45 },
          embers: { count: 80, speedMin: 60, speedMax: 160, sizeMin: 2.5, sizeMax: 5, rise: 30, drag: 0.2 },
          rings: [{ rMax: 150, life: 0.22, lifeGrow: 0.03, col: "type" },
                  { rMax: 90, life: 0.3, lifeGrow: 0.03, col: [255, 255, 210] }] },
        /* 3 petal (pink): few large slow petals that float up and fade */
        { burst: { count: 150, speedMin: 25, speedMax: 150, gravity: 2, drag: 1.4, sizeMin: 5, sizeMax: 11, lifeMin: 0.7, lifeMax: 1.2 },
          embers: { count: 120, speedMin: 15, speedMax: 70, spread: 50, rise: 45, drag: 1.2, sizeMin: 4, sizeMax: 9 },
          rings: [{ rMax: 130, life: 0.6, lifeGrow: 0.1, col: "type" },
                  { rMax: 70, life: 0.8, lifeGrow: 0.1, col: [255, 235, 245] }] },
        /* 4 arcane (purple): swirls — fast, light, heavy drag, wide ring */
        { burst: { count: 240, speedMin: 60, speedMax: 300, gravity: 6, drag: 1.9, sizeMin: 3, sizeMax: 7, lifeMin: 0.6, lifeMax: 0.95 },
          embers: { count: 160, speedMin: 40, speedMax: 130, spread: 60, rise: 70, drag: 1.5 },
          rings: [{ rMax: 170, life: 0.55, lifeGrow: 0.08, col: "type" },
                  { rMax: 120, life: 0.75, lifeGrow: 0.08, col: [230, 215, 255] }] },
        /* 5 stone (grey): few heavy chunks that drop hard and die quickly */
        { burst: { count: 140, speedMin: 40, speedMax: 240, gravity: 60, drag: 0.2, sizeMin: 5, sizeMax: 12, lifeMin: 0.25, lifeMax: 0.45 },
          embers: { count: 60, speedMin: 20, speedMax: 70, spread: 26, sizeMin: 4, sizeMax: 8, rise: 0, drag: 0.3 },
          rings: [{ rMax: 90, life: 0.28, lifeGrow: 0.05, col: "type" },
                  { rMax: 60, life: 0.4, lifeGrow: 0.05, col: [235, 240, 248] }] },
        /* 6 water (blue): a splash — dense fast droplets that rain down */
        { burst: { count: 340, speedMin: 90, speedMax: 420, gravity: 40, drag: 1.1, sizeMin: 2.5, sizeMax: 6, lifeMin: 0.35, lifeMax: 0.6 },
          embers: { count: 140, speedMin: 30, speedMax: 110, spread: 70, rise: -20, drag: 1.0 },
          rings: [{ rMax: 140, life: 0.32, lifeGrow: 0.06, col: "type" },
                  { rMax: 100, life: 0.44, lifeGrow: 0.06, col: [200, 230, 255] }] },
      ],
    },

    /* cascadeFlash() — big refill burst */
    cascade: {
      burst: {
        count: 300, speedMin: 130, speedMax: 560,
        lifeMin: 0.5, lifeMax: 1.3, sizeMin: 5, sizeMax: 15,
        ramp: [[255, 255, 220], [255, 240, 120], [255, 200, 80], [255, 160, 40], [200, 100, 20]],
        gravity: 24, drag: 0.4, alphaMul: 2.0,
      },
      embers: {
        count: 150, speedMin: 35, speedMax: 120, spread: 46,
        lifeMin: 0.7, lifeMax: 1.6, sizeMin: 3, sizeMax: 9,
        ramp: [[255, 255, 220], [255, 230, 120], [255, 190, 80], [220, 130, 40], [120, 60, 20]],
        rise: 60, drag: 0.4, alphaMul: 1.4,
      },
      rings: [
        { rMax: 190, life: 0.5, col: [255, 230, 100] },
        { rMax: 130, life: 0.7, col: [255, 255, 255] },
        { rMax: 70, life: 0.85, col: [255, 200, 120] },
      ],
    },
  };
})();
