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
  /*  Effects catalog                                                    */
  /* ------------------------------------------------------------------ */
  var FX = {
    active: [],

    /* event-driven factories  */
    clearBurst: function (x, y, type) {
      type = type || 0;
      var rampColors = [
        [[255, 240, 200], [255, 200, 60], [255, 120, 30], [200, 50, 20], [80, 20, 10]],
        [[200, 255, 180], [100, 220, 80], [40, 160, 40], [20, 80, 30], [10, 40, 15]],
        [[255, 255, 200], [250, 230, 80], [230, 180, 40], [180, 120, 30], [100, 60, 20]],
        [[255, 180, 180], [255, 100, 100], [220, 40, 40], [120, 20, 20], [60, 10, 10]],
        [[220, 190, 255], [180, 140, 255], [130, 80, 220], [70, 40, 140], [30, 15, 70]],
        [[200, 200, 220], [150, 150, 180], [100, 100, 130], [60, 60, 80], [30, 30, 40]],
        [[180, 210, 255], [100, 170, 255], [40, 120, 220], [20, 60, 140], [10, 30, 70]],
      ];
      // main burst
      FX.active.push(new Burst({
        x: x, y: y, count: 16, speedMin: 30, speedMax: 110,
        lifeMin: 0.25, lifeMax: 0.55, sizeMin: 1.5, sizeMax: 4,
        ramp: rampColors[type % 7], gravity: 40, drag: 1.2,
      }));
      // sparkle twins
      FX.active.push(new Sparkle({ x: x, y: y, vx: 40, vy: -30, life: 0.4, size: 3, col: [255, 255, 240] }));
      FX.active.push(new Sparkle({ x: x, y: y, vx: -35, vy: -25, life: 0.35, size: 2.5, col: [255, 255, 240] }));
      // ring
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 35, life: 0.4, col: rampColors[type % 7][2] }));
    },

    specialClear: function (x, y, type) {
      var rampColors = [
        [[255, 240, 200], [255, 200, 60], [255, 120, 30], [200, 50, 20], [80, 20, 10]],
        [[200, 255, 180], [100, 220, 80], [40, 160, 40], [20, 80, 30], [10, 40, 15]],
        [[255, 255, 200], [250, 230, 80], [230, 180, 40], [180, 120, 30], [100, 60, 20]],
        [[255, 180, 180], [255, 100, 100], [220, 40, 40], [120, 20, 20], [60, 10, 10]],
        [[220, 190, 255], [180, 140, 255], [130, 80, 220], [70, 40, 140], [30, 15, 70]],
        [[200, 200, 220], [150, 150, 180], [100, 100, 130], [60, 60, 80], [30, 30, 40]],
        [[180, 210, 255], [100, 170, 255], [40, 120, 220], [20, 60, 140], [10, 30, 70]],
      ];
      // bigger burst for specials
      FX.active.push(new Burst({
        x: x, y: y, count: 28, speedMin: 50, speedMax: 180,
        lifeMin: 0.3, lifeMax: 0.7, sizeMin: 2, sizeMax: 5.5,
        ramp: rampColors[type % 7], gravity: 30, drag: 0.8,
      }));
      // radial sparkles
      var i, a;
      for (i = 0; i < 6; i++) {
        a = (i / 6) * Math.PI * 2;
        FX.active.push(new Sparkle({
          x: x, y: y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70,
          life: 0.4 + Math.random() * 0.2, size: 3 + Math.random() * 2,
          col: [255, 255, 240]
        }));
      }
      // double ring
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 50, life: 0.35, col: rampColors[type % 7][1] }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 30, life: 0.5, col: [255, 255, 255] }));
    },

    cascadeFlash: function (x, y) {
      FX.active.push(new Burst({
        x: x, y: y, count: 22, speedMin: 60, speedMax: 160,
        lifeMin: 0.25, lifeMax: 0.6, sizeMin: 2, sizeMax: 5,
        ramp: [[255, 255, 220], [255, 240, 120], [255, 200, 80], [255, 160, 40], [200, 100, 20]],
        gravity: 20, drag: 0.7,
      }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 45, life: 0.35, col: [255, 230, 100] }));
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
