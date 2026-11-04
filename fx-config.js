"use strict";
/*  Effect tuning, in one place so you can tweak by hand.
    Loaded before fx.js and draw.js; see index.html script order. */
(function () {
  window.FXConfig = {
    /* new tuning knobs */
    gravitySpeed: 1,        // multiplier on particle gravity (bursts/embers)

    /* wave() — the soft wave a gem lands with (draw.js) */
    fall: {
      land: 0.82,          // fraction of the drop spent falling; the rest is the wave
      amp: 0.09,           // peak sideways shift of a band, in tile widths
      waves: 0.7,          // ripples that fit over the tile height
      travel: 0.6,         // wave cycles that roll up through the landing
      decay: 1.1,          // how fast the wave dies out (higher = quicker)
      squashAmp: 0.16,     // peak vertical squash, as a fraction of tile height
      squashBounce: 1.7,   // half-cycles of spring-back before it settles
      squashDecay: 1.8,    // how fast the spring-back damps (higher = quicker)
      bulge: 0.22,         // extra width while squashed (volume feel)
      strips: 6,           // horizontal bands the gem is drawn in
    },
    /* library hit widths, in tiles (used by fx.js LIB_LOOK) */
    libLook: { hitSpark: 2.6, cartoonPow: 3.4, smallExplosion: 6.2 },
    /* library hit brightness (passed to the pixelfx effect) */
    libLight: { hitSpark: 1.8, cartoonPow: 2.2, smallExplosion: 2.4 },

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
        count: 170,
        speedMin: 90, speedMax: 380,
        lifeMin: 0.24, lifeMax: 0.3, lifeGrow: 0.1,
        sizeMin: 4.4, sizeMax: 11,
        gravity: 30, drag: 1.2, alphaMul: 1.9,
      },
      embers: {
        count: 90,
        speedMin: 30, speedMax: 100, spread: 30,
        lifeMin: 0.22, lifeMax: 0.3, lifeGrow: 0.09,
        sizeMin: 4, sizeMax: 8,
        rise: 60, drag: 0.9, alphaMul: 1.35,
      },
      rings: [
        { rMax: 190, life: 0.3, lifeGrow: 0.06, col: "type" },
        { rMax: 155, life: 0.36, lifeGrow: 0.06, col: [255, 255, 255] },
      ],
      power: { clear: 1.65, special: 1.9, blast: 2.8 },
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
