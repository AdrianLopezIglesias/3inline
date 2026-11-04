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
      FX.lib("hitSpark", x, y, { seed: 4 + (type || 0), light: 1.8 });
      kick(x, y, type, 1.15);
    },

    specialClear: function (x, y, type) {
      FX.lib("cartoonPow", x, y, { seed: 5 + (type || 0), light: 2.2 });
      kick(x, y, type, 1.9);
    },

    cascadeFlash: function (x, y) {
      FX.active.push(new Burst({
        x: x, y: y, count: 300, speedMin: 130, speedMax: 560,
        lifeMin: 0.5, lifeMax: 1.3, sizeMin: 5, sizeMax: 15,
        ramp: [[255, 255, 220], [255, 240, 120], [255, 200, 80], [255, 160, 40], [200, 100, 20]],
        gravity: 24, drag: 0.4, alphaMul: 2.0,
      }));
      FX.active.push(new Embers({
        x: x, y: y, count: 150, speedMin: 35, speedMax: 120, spread: 46,
        lifeMin: 0.7, lifeMax: 1.6, sizeMin: 3, sizeMax: 9,
        ramp: [[255, 255, 220], [255, 230, 120], [255, 190, 80], [220, 130, 40], [120, 60, 20]],
        rise: 60, drag: 0.4, alphaMul: 1.4,
      }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 190, life: 0.5, col: [255, 230, 100] }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 130, life: 0.7, col: [255, 255, 255] }));
      FX.active.push(new RingSnap({ x: x, y: y, rMax: 70, life: 0.85, col: [255, 200, 120] }));
    },

    powerBlast: function (x, y, type) {
      FX.lib("smallExplosion", x, y, { seed: 7 + (type || 0), light: 2.4 });
      kick(x, y, type, 2.8);
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

  /* ------------------------------------------------------------------ */
  /*  Vendored pixelfx effects (see pixelfx-vendor.js)                   */
  /* ------------------------------------------------------------------ */
  /*  The library paints each burst into its own pixel frame, so a hit
      gets a scratch canvas of the effect's size and is blitted onto the
      game canvas with smoothing off, its origin on the tile.  LIB_LOOK
      is how wide each effect should read, in tiles. */

  var LIB_LOOK = { hitSpark: 2.6, cartoonPow: 3.4, smallExplosion: 6.2 };
  var libScratch = {};

  function libScratchFor(w, h, ox, oy) {
    var key = w + "x" + h + "@" + ox + "," + oy;
    var s = libScratch[key];
    if (!s) {
      var c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      s = libScratch[key] = {
        canvas: c,
        ctx: c.getContext("2d"),
        img: new ImageData(w, h),
        frame: window.PixelFXLIB.createFrame(w, h, ox, oy),
      };
    }
    return s;
  }

  function LibHit(name, x, y, opts) {
    var mod = window.PixelFXLIB.effects[name];
    var g = window.Game && window.Game.geom;
    var cell = (g && g.cell) || 52;
    this.x = x;
    this.y = y;
    this.w = mod.meta.size[0];
    this.h = mod.meta.size[1];
    this.ox = mod.meta.origin[0];
    this.oy = mod.meta.origin[1];
    this.k = Math.max(0.25, (cell * (LIB_LOOK[name] || 2)) / this.w);
    this.fx = window.PixelFXLIB.createFx(mod, opts || {});
    this.done = false;
  }
  LibHit.prototype.update = function (dt) {
    this.fx.update(dt);
    if (this.fx.done()) this.done = true;
  };
  LibHit.prototype.draw = function (ctx) {
    var s = libScratchFor(this.w, this.h, this.ox, this.oy);
    window.PixelFXLIB.clearFrame(s.frame);
    this.fx.draw(s.frame);
    window.PixelFXLIB.composite(s.frame, s.img.data, null);
    s.ctx.putImageData(s.img, 0, 0);
    var k = this.k, smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.canvas, this.x - this.ox * k, this.y - this.oy * k, this.w * k, this.h * k);
    ctx.imageSmoothingEnabled = smooth;
  };

  FX.lib = function (name, x, y, opts) {
    if (!window.PixelFXLIB || !window.PixelFXLIB.effects[name]) return;
    FX.active.push(new LibHit(name, x, y, opts));
  };

  /*  The hand-rolled layer under a library hit: power 1 is an ordinary
      match, 3 a power move.  More, faster, bigger and longer the higher
      it goes, so every clear reads loud and keeps throwing debris. */
  function kick(x, y, type, power) {
    var rampColors = TYPE_RAMPS[(type || 0) % 7];
    FX.active.push(new Burst({
      x: x, y: y, count: Math.round(170 * power),
      speedMin: 90 * power, speedMax: 380 * Math.sqrt(power),
      lifeMin: 0.24, lifeMax: 0.3 + 0.1 * power,
      sizeMin: 2.2 * power, sizeMax: 5.5 * power,
      ramp: rampColors, gravity: 30, drag: 1.2, alphaMul: 1.9,
    }));
    FX.active.push(new Embers({
      x: x, y: y, count: Math.round(90 * power),
      speedMin: 30, speedMax: 100, spread: 30 * power,
      lifeMin: 0.22, lifeMax: 0.3 + 0.09 * power,
      sizeMin: 2, sizeMax: 4 * power,
      ramp: rampColors.slice().reverse(),
      rise: 60, drag: 0.9, alphaMul: 1.35,
    }));
    FX.active.push(new RingSnap({ x: x, y: y, rMax: 58 * power, life: 0.3 + 0.06 * power, col: rampColors[1] }));
    FX.active.push(new RingSnap({ x: x, y: y, rMax: 40 * power, life: 0.36 + 0.06 * power, col: [255, 255, 255] }));
  }

  window.PixelFX = FX;
})();
