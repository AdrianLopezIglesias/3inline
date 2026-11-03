"use strict";
(function () {
  /* Pixel-art FX: simple particle bursts, sparkles, and trail effects.
     Inspired by library-pixelfx patterns (ramped colors, additive blending,
     closed-form particle motion).  Works on the game's existing canvas. */

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /* ------------------------------------------------------------------ */
  /*  Color helpers                                                      */
  /* ------------------------------------------------------------------ */
  function hex(c) {
    c = c.replace("#", "");
    if (c.length === 3) c = c.split("").map(function (x) { return x + x; }).join("");
    return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ramp(colorList, t) {
    var i = Math.max(0, Math.min(colorList.length - 1, Math.floor(t * (colorList.length - 1))));
    var next = Math.min(i + 1, colorList.length - 1);
    var local = t * (colorList.length - 1) - i;
    var a = colorList[i], b = colorList[next];
    return [Math.round(lerp(a[0], b[0], local)), Math.round(lerp(a[1], b[1], local)), Math.round(lerp(a[2], b[2], local))];
  }

  /* ------------------------------------------------------------------ */
  /*  Particle burst (one-shot, fires fast pixels out, fades)            */
  /* ------------------------------------------------------------------ */
  function Burst(spec) {
    this.particles = [];
    var i, angle, speed;
    for (i = 0; i < spec.count; i++) {
      angle = Math.random() * Math.PI * 2;
      speed = spec.speedMin + Math.random() * (spec.speedMax - spec.speedMin);
      this.particles.push({
        x: spec.x, y: spec.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: spec.lifeMin + Math.random() * (spec.lifeMax - spec.lifeMin),
        age: 0,
        size: spec.sizeMin + Math.random() * (spec.sizeMax - spec.sizeMin),
        ramp: spec.ramp,
      });
    }
    this.t = 0;
    this.done = false;
  }
  Burst.prototype.update = function (dt) {
    if (this.done) return;
    this.t += dt;
    var alive = false, p, i, progress;
    for (i = 0; i < this.particles.length; i++) {
      p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      alive = true;
      progress = p.age / p.life;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= (1 - (p.drag || 0) * dt);
      p.vy *= (1 - (p.drag || 0) * dt);
      p.x += (p.wind || 0) * dt;
      p.currentSize = p.size * (1 - easeOutCubic(progress) * 0.6);
      p.color = ramp(p.ramp, progress);
    }
    if (!alive) this.done = true;
  };
  Burst.prototype.draw = function (ctx) {
    var i, p, progress, rgb, a, s;
    for (i = 0; i < this.particles.length; i++) {
      p = this.particles[i];
      if (p.age >= p.life) continue;
      progress = p.age / p.life;
      rgb = p.color || ramp(p.ramp, progress);
      a = 1 - easeOutCubic(progress);
      s = p.currentSize || p.size * (1 - easeOutCubic(progress) * 0.6);
      if (s < 0.5) continue;
      ctx.globalAlpha = a * (this.alphaMul || 1);
      ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  };

  /* ------------------------------------------------------------------ */
  /*  Sparkle: a star-shaped particle that winks and drifts              */
  /* ------------------------------------------------------------------ */
  function Sparkle(spec) {
    this.x = spec.x; this.y = spec.y;
    this.vx = spec.vx || 0; this.vy = spec.vy || 0;
    this.life = spec.life;
    this.age = 0;
    this.size = spec.size || 3;
    this.col = spec.col || [255, 255, 200];
    this.t = 0;
    this.done = false;
  }
  Sparkle.prototype.update = function (dt) {
    this.t += dt; this.age += dt;
    if (this.age >= this.life) { this.done = true; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  };
  Sparkle.prototype.draw = function (ctx) {
    if (this.done) return;
    var progress = this.age / this.life;
    var a = (1 - easeOutCubic(progress)) * Math.abs(Math.sin(this.t * 8 + this.x));
    var s = this.size * (1 - progress * 0.5);
    if (a < 0.05 || s < 0.5) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgb(" + this.col[0] + "," + this.col[1] + "," + this.col[2] + ")";
    // small cross
    ctx.fillRect(this.x - s / 2, this.y - s * 1.5, s, s * 3);
    ctx.fillRect(this.x - s * 1.5, this.y - s / 2, s * 3, s);
    ctx.globalAlpha = 1;
  };

  /* ------------------------------------------------------------------ */
  /*  Ring snap: a ring that expands, widens, then fades                 */
  /* ------------------------------------------------------------------ */
  function RingSnap(spec) {
    this.x = spec.x; this.y = spec.y;
    this.rMax = spec.rMax || 80;
    this.life = spec.life || 0.45;
    this.age = 0;
    this.col = spec.col || [255, 200, 100];
    this.done = false;
  }
  RingSnap.prototype.update = function (dt) {
    this.age += dt;
    if (this.age >= this.life) this.done = true;
  };
  RingSnap.prototype.draw = function (ctx) {
    if (this.done) return;
    var p = this.age / this.life;
    var r = this.rMax * easeOutBack(p);
    var w = Math.max(1, 3 * (1 - p));
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.strokeStyle = "rgb(" + this.col[0] + "," + this.col[1] + "," + this.col[2] + ")";
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  /* ------------------------------------------------------------------ */
  /*  Ember haze: fine glowing motes that rise, swell, and fade in       */
  /*  additive blend.  Adapted from library-pixelfx's Lights/EMBER.      */
  /* ------------------------------------------------------------------ */
  function Embers(spec) {
    this.particles = [];
    var i, angle, speed;
    for (i = 0; i < spec.count; i++) {
      angle = Math.random() * Math.PI * 2;
      speed = spec.speedMin + Math.random() * (spec.speedMax - spec.speedMin);
      this.particles.push({
        x: spec.x + (Math.random() - 0.5) * (spec.spread || 0),
        y: spec.y + (Math.random() - 0.5) * (spec.spread || 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (spec.rise || 0),
        life: spec.lifeMin + Math.random() * (spec.lifeMax - spec.lifeMin),
        age: 0,
        peak: 0.3 + Math.random() * 0.4,
        size: spec.sizeMin + Math.random() * (spec.sizeMax - spec.sizeMin),
        ramp: spec.ramp,
      });
    }
    this.t = 0;
    this.alphaMul = spec.alphaMul || 1;
    this.done = false;
  }
  Embers.prototype.update = function (dt) {
    if (this.done) return;
    this.t += dt;
    var alive = false, p, i, progress;
    for (i = 0; i < this.particles.length; i++) {
      p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      alive = true;
      progress = p.age / p.life;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - (p.drag || 0) * dt);
      p.vy *= (1 - (p.drag || 0) * dt);
      p.currentSize = p.size * (0.4 + 0.6 * Math.sin(progress * Math.PI));
      p.color = ramp(p.ramp, progress);
    }
    if (!alive) this.done = true;
  };
  Embers.prototype.draw = function (ctx) {
    var i, p, progress, rgb, a, s;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < this.particles.length; i++) {
      p = this.particles[i];
      if (p.age >= p.life) continue;
      progress = p.age / p.life;
      rgb = p.color || ramp(p.ramp, progress);
      a = Math.sin(progress * Math.PI) * this.alphaMul;
      s = p.currentSize || p.size * (0.4 + 0.6 * Math.sin(progress * Math.PI));
      if (s < 0.5) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /*  Effects catalog                                                    */
  /* ------------------------------------------------------------------ */
  /* particle ramps per gem type (matched to the tile colors in draw.js) */
  var TYPE_RAMPS = [
    [[255, 236, 205], [255, 150, 60], [212, 54, 31], [130, 24, 8], [46, 8, 2]],
    [[214, 255, 228], [70, 220, 130], [20, 143, 63], [8, 74, 32], [2, 26, 10]],
    [[255, 250, 205], [255, 214, 80], [224, 164, 18], [130, 88, 6], [40, 26, 2]],
    [[255, 214, 232], [255, 90, 150], [200, 30, 90], [112, 8, 44], [38, 2, 14]],
    [[228, 214, 255], [150, 100, 250], [106, 47, 201], [54, 18, 116], [16, 4, 40]],
    [[222, 232, 246], [130, 145, 170], [63, 71, 86], [32, 37, 47], [10, 12, 16]],
    [[205, 232, 255], [80, 160, 250], [26, 111, 212], [8, 56, 130], [2, 18, 44]],
  ];
  var FX = {
    active: [],

    /* event-driven factories  */
    clearBurst: function (x, y, type) {
      type = type || 0;
      var rampColors = TYPE_RAMPS;
      // main burst
      FX.active.push(new Burst({
        x: x, y: y, count: 130, speedMin: 70, speedMax: 320,
        lifeMin: 0.35, lifeMax: 0.9, sizeMin: 3, sizeMax: 10,
        ramp: rampColors[type % 7], gravity: 35, drag: 0.9, alphaMul: 1.6,
      }));
      FX.active.push(new Embers({
        x: x, y: y, count: 65, speedMin: 25, speedMax: 80, spread: 24,
        lifeMin: 0.5, lifeMax: 1.1, sizeMin: 2.5, sizeMax: 6.5,
        ramp: rampColors[type % 7].slice().reverse(),
        rise: 40, drag: 0.6, alphaMul: 1.1,
      }));
      // sparkle twins
      FX.active.push(new Sparkle({ x: x, y: y, vx: 90, vy: -70, life: 0.6, size: 5.5, col: [255, 255, 240] }));
      FX.active.push(new Sparkle({ x: x, y: y, vx: -85, vy: -62, life: 0.55, size: 5, col: [255, 255, 240] }));
      // ring
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 90, life: 0.6, col: rampColors[type % 7][2] }));
    },

    specialClear: function (x, y, type) {
      var rampColors = TYPE_RAMPS;
      // bigger burst for specials
      FX.active.push(new Burst({
        x: x, y: y, count: 200, speedMin: 100, speedMax: 420,
        lifeMin: 0.45, lifeMax: 1.1, sizeMin: 4, sizeMax: 12,
        ramp: rampColors[type % 7], gravity: 25, drag: 0.5, alphaMul: 1.6,
      }));
      FX.active.push(new Embers({
        x: x, y: y, count: 110, speedMin: 35, speedMax: 110, spread: 38,
        lifeMin: 0.65, lifeMax: 1.4, sizeMin: 3, sizeMax: 7.5,
        ramp: rampColors[type % 7].slice().reverse(),
        rise: 55, drag: 0.4, alphaMul: 1.1,
      }));
      // radial sparkles
      var i, a;
      for (i = 0; i < 18; i++) {
        a = (i / 18) * Math.PI * 2;
        FX.active.push(new Sparkle({
          x: x, y: y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160,
          life: 0.55 + Math.random() * 0.4, size: 5 + Math.random() * 4,
          col: [255, 255, 240]
        }));
      }
      // double ring
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 120, life: 0.45, col: rampColors[type % 7][1] }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 80, life: 0.65, col: [255, 255, 255] }));
    },

    cascadeFlash: function (x, y) {
      FX.active.push(new Burst({
        x: x, y: y, count: 180, speedMin: 110, speedMax: 400,
        lifeMin: 0.4, lifeMax: 1.0, sizeMin: 4, sizeMax: 11,
        ramp: [[255, 255, 220], [255, 240, 120], [255, 200, 80], [255, 160, 40], [200, 100, 20]],
        gravity: 20, drag: 0.5, alphaMul: 1.6,
      }));
      FX.active.push(new Embers({
        x: x, y: y, count: 85, speedMin: 30, speedMax: 90, spread: 30,
        lifeMin: 0.55, lifeMax: 1.2, sizeMin: 2.5, sizeMax: 6.5,
        ramp: [[255, 255, 220], [255, 230, 120], [255, 190, 80], [220, 130, 40], [120, 60, 20]],
        rise: 45, drag: 0.5, alphaMul: 1.1,
      }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 115, life: 0.45, col: [255, 230, 100] }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 75, life: 0.6, col: [255, 255, 255] }));
    },

    powerBlast: function (x, y, type) {
      var rampColors = TYPE_RAMPS;
      FX.active.push(new Burst({
        x: x, y: y, count: 220, speedMin: 120, speedMax: 520,
        lifeMin: 0.4, lifeMax: 1.0, sizeMin: 4, sizeMax: 13,
        ramp: rampColors[type % 7], gravity: 20, drag: 0.45, alphaMul: 1.7,
      }));
      FX.active.push(new Embers({
        x: x, y: y, count: 120, speedMin: 40, speedMax: 130, spread: 44,
        lifeMin: 0.6, lifeMax: 1.3, sizeMin: 3, sizeMax: 8,
        ramp: rampColors[type % 7].slice().reverse(),
        rise: 60, drag: 0.35, alphaMul: 1.2,
      }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 230, life: 0.5, col: [255, 255, 255] }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 170, life: 0.7, col: rampColors[type % 7][1] }));
    },

    /* frame hooks */
    update: function (dt) {
      var i, fx;
      for (i = this.active.length - 1; i >= 0; i--) {
        fx = this.active[i];
        fx.update(dt);
        if (fx.done) this.active.splice(i, 1);
      }
    },
    draw: function (ctx) {
      var i;
      for (i = 0; i < this.active.length; i++) this.active[i].draw(ctx);
    },
  };

  window.PixelFX = FX;
})();
