"use strict";
(function () {
  var BG = ["#b8472c", "#2d6a4f", "#c08a1e", "#8e1a24", "#7a34b4", "#7d93b3", "#123a70"];
  var INK = "#fff6e6";
  var EDGE = "rgba(8,10,16,.55)";

  /* one reused buffer: a landing gem is drawn into it once, then blitted back
     in bands so the soft wave can shift them (see G.flight in render) */
  var warp = null;
  function warpBuf(size) {
    var dpr = window.devicePixelRatio || 1;
    var px = Math.ceil(size * dpr);
    if (!warp) warp = document.createElement("canvas");
    if (warp.width !== px) {
      warp.width = px;
      warp.height = px;
    }
    var wc = warp.getContext("2d");
    wc.setTransform(dpr, 0, 0, dpr, 0, 0);
    wc.clearRect(0, 0, size, size);
    return wc;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(color, amt) {
    var v = parseInt(color.slice(1), 16);
    var ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    var out = [];
    for (var i = 0; i < 3; i++) {
      out.push(Math.round(amt > 0 ? ch[i] + (255 - ch[i]) * amt : ch[i] * (1 + amt)));
    }
    return "rgb(" + out[0] + "," + out[1] + "," + out[2] + ")";
  }

  function polygon(ctx, cx, cy, r, sides, rot) {
    for (var i = 0; i < sides; i++) {
      var a = rot + i * Math.PI * 2 / sides;
      if (i) ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function symbolPath(ctx, type, cx, cy, r) {
    var w = r * 0.36, i, a, rad;
    ctx.beginPath();
    if (type === 0) {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2, true);
    } else if (type === 1) {
      polygon(ctx, cx, cy + r * 0.10, r * 1.05, 3, -Math.PI / 2);
    } else if (type === 2) {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.76, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.76, cy);
      ctx.closePath();
    } else if (type === 3) {
      for (i = 0; i < 10; i++) {
        a = -Math.PI / 2 + i * Math.PI / 5;
        rad = i % 2 ? r * 0.45 : r;
        if (i) ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        else ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      }
      ctx.closePath();
    } else if (type === 4) {
      polygon(ctx, cx, cy, r, 6, -Math.PI / 2);
    } else if (type === 5) {
      ctx.moveTo(cx - w, cy - r); ctx.lineTo(cx + w, cy - r);
      ctx.lineTo(cx + w, cy - w); ctx.lineTo(cx + r, cy - w);
      ctx.lineTo(cx + r, cy + w); ctx.lineTo(cx + w, cy + w);
      ctx.lineTo(cx + w, cy + r); ctx.lineTo(cx - w, cy + r);
      ctx.lineTo(cx - w, cy + w); ctx.lineTo(cx - r, cy + w);
      ctx.lineTo(cx - r, cy - w); ctx.lineTo(cx - w, cy - w);
      ctx.closePath();
    } else {
      ctx.moveTo(cx, cy - r * 1.05);
      ctx.bezierCurveTo(cx + r * 0.95, cy - r * 0.05, cx + r * 0.85, cy + r * 0.85, cx, cy + r * 0.90);
      ctx.bezierCurveTo(cx - r * 0.85, cy + r * 0.85, cx - r * 0.95, cy - r * 0.05, cx, cy - r * 1.05);
      ctx.closePath();
    }
    return ctx;
  }

  function powerGlyph(power) {
    return power === 1 ? "\u2194" : power === 2 ? "\u2195" :
      power === 3 ? "\u2736" : power === 4 ? "\u271A" :
      power === 5 ? "\u2739" : power === 6 ? "\u2605" :
      power === 7 ? "\u25CE" : "\u21E7";
  }

  function drawTile(ctx, value, x, y, cell, scale, alpha) {
    var G = window.Game;
    if (G.isRock(value)) { drawRock(ctx, x, y, cell, scale, alpha); return; }
    var special = G.isSpecial(value);
    var type = G.typeOf(value);
    var symbol = G.symbolOf(value);
    var pad = cell * 0.055;
    var s = cell * (scale == null ? 1 : scale);
    var cx = x + cell / 2, cy = y + cell / 2;
    var half = s / 2 - pad;
    ctx.globalAlpha = (alpha == null ? 1 : alpha);
    if (special) {
      var glow = ctx.createRadialGradient(cx, cy, s * 0.08, cx, cy, s * 0.55);
      glow.addColorStop(0, "rgba(255,242,180,.80)");
      glow.addColorStop(1, "rgba(255,190,80,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, half, 0, Math.PI * 2);
    var body = BG[type];
    var orb = ctx.createRadialGradient(
      cx - half * 0.14, cy - half * 0.48, half * 0.12,
      cx, cy + half * 0.12, half * 1.30);
    orb.addColorStop(0, shade(body, 0.15));
    orb.addColorStop(0.45, shade(body, 0.04));
    orb.addColorStop(0.82, shade(body, -0.07));
    orb.addColorStop(1, shade(body, -0.26));
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.50)";
    ctx.shadowBlur = cell * 0.14;
    ctx.shadowOffsetY = cell * 0.05;
    ctx.fillStyle = orb;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, half, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, cell * 0.028);
    ctx.strokeStyle = EDGE;
    ctx.stroke();
    var sheen = ctx.createLinearGradient(0, cy - half, 0, cy + half * 0.15);
    sheen.addColorStop(0, "rgba(255,255,255,.18)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy - half * 0.02, half * 0.93, Math.PI * 1.14, Math.PI * 1.86);
    ctx.lineWidth = Math.max(1, cell * 0.045);
    ctx.lineCap = "round";
    ctx.strokeStyle = sheen;
    ctx.stroke();
    ctx.restore();
    symbolPath(ctx, symbol < 0 ? type : symbol, cx, cy + cell * 0.01, s * 0.27);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = cell * 0.07;
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = Math.max(1, cell * 0.015);
    ctx.strokeStyle = "rgba(10,8,18,.40)";
    ctx.stroke();
    if (special) {
      var power = G.powerOf(value);
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, cell * 0.05);
      ctx.strokeStyle = "rgba(255,250,225,.95)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.30, s * 0.17, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,250,225,.95)";
      ctx.fill();
      ctx.font = "700 " + (s * 0.22) + "px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#161021";
      ctx.fillText(powerGlyph(power), cx, cy - s * 0.29);
    }
    ctx.globalAlpha = 1;
  }

  function drawRock(ctx, x, y, cell, scale, alpha) {
    var s = cell * (scale == null ? 1 : scale);
    var pad = cell * 0.07;
    var cx = x + cell / 2, cy = y + cell / 2;
    ctx.globalAlpha = (alpha == null ? 1 : alpha);
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2 - pad, 0, Math.PI * 2);
    var stone = ctx.createLinearGradient(0, cy - s / 2, 0, cy + s / 2);
    stone.addColorStop(0, "#4b5365");
    stone.addColorStop(0.55, "#333a49");
    stone.addColorStop(1, "#1c202b");
    ctx.fillStyle = stone;
    ctx.fill();
    ctx.lineWidth = Math.max(1, cell * 0.025);
    ctx.strokeStyle = "rgba(8,10,16,.75)";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.20, cy + s * 0.16);
    ctx.lineTo(cx - s * 0.02, cy - s * 0.04);
    ctx.lineTo(cx + s * 0.18, cy + s * 0.20);
    ctx.strokeStyle = "rgba(170,185,215,.35)";
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.beginPath();
    ctx.arc(cx - s * 0.12, cy - s * 0.14, s * 0.10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function render(ctx, W, H) {
    var G = window.Game;
    if (!G || !G.grid || !G.geom || !G.geom.cell) return;
    var cell = G.geom.cell, L = G.geom.left, T = G.geom.top;
    var i, r, c, key;

    ctx.clearRect(0, 0, W, H);
    rr(ctx, L - 2, T - 2, cell * G.cols + 4, cell * G.rows + 4, 16);
    var boardG = ctx.createLinearGradient(0, T, 0, T + cell * G.rows);
    boardG.addColorStop(0, "#161d2b");
    boardG.addColorStop(0.55, "#101623");
    boardG.addColorStop(1, "#0a0e17");
    ctx.fillStyle = boardG;
    ctx.fill();
    ctx.strokeStyle = "rgba(120,160,230,.28)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(130,165,230,.09)";

    var rest = {};
    for (r = 0; r < G.rows; r++) for (c = 0; c < G.cols; c++) {
      if (G.grid[r][c] >= 0) rest[r + ":" + c] = G.grid[r][c];
    }

    if (G.swap) {
      var sa = G.swap.a, sb = G.swap.b;
      delete rest[sa.cell[0] + ":" + sa.cell[1]];
      delete rest[sb.cell[0] + ":" + sb.cell[1]];
      var p = Math.min(1, (G.now() - G.swap.t0) / G.swap.dur);
      var snap = easeOutBack(p);
      var ax = pxX(sa.cell[1]), ay = pxY(sa.cell[0]);
      var bx = pxX(sb.cell[1]), by = pxY(sb.cell[0]);
      var gx = bx + (ax - bx) * snap;
      var gy = by + (ay - by) * snap;
      var hx = ax + (bx - ax) * snap;
      var hy = ay + (by - ay) * snap;
      var overlap = (bx - ax) * snap;
      var oy = (by - ay) * snap;
      var scaleA = 1 - 0.08 * Math.sin(Math.PI * p);
      var scaleB = 1 - 0.08 * Math.sin(Math.PI * p);
      drawTile(ctx, sa.type, gx, gy, cell, scaleA, 1);
      drawTile(ctx, sb.type, hx, hy, cell, scaleB, 1);
    }
    if (G.clears) {
      for (i = 0; i < G.clears.length; i++) {
        var cl = G.clears[i];
        var pp = Math.min(1, (G.now() - cl.t0) / cl.dur);
        var ppe = easeOutCubic(pp);
        var ex = pxX(cl.col) + cell / 2, ey = pxY(cl.row) + cell / 2;
        var pop = 1 + 0.30 * Math.sin(Math.PI * pp);
        drawTile(ctx, cl.type, pxX(cl.col), pxY(cl.row), cell, pop, 1 - pp);
        var tcol = BG[G.typeOf(cl.type)] || "#ffb347";
        var fr = cell * (0.32 + ppe * 0.60);
        var flash = ctx.createRadialGradient(ex, ey, 0, ex, ey, fr);
        flash.addColorStop(0, "rgba(255,255,255," + (0.9 * (1 - pp)).toFixed(3) + ")");
        flash.addColorStop(0.40, "rgba(255,245,205," + (0.5 * (1 - pp)).toFixed(3) + ")");
        flash.addColorStop(1, "rgba(255,200,120,0)");
        ctx.beginPath();
        ctx.arc(ex, ey, fr, 0, Math.PI * 2);
        ctx.fillStyle = flash;
        ctx.fill();
        ctx.globalAlpha = (1 - pp) * 0.95;
        ctx.beginPath();
        ctx.arc(ex, ey, cell * (0.20 + ppe * 0.85), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1.5, cell * 0.14 * (1 - pp));
        ctx.strokeStyle = tcol;
        ctx.stroke();
        ctx.globalAlpha = (1 - ppe) * 0.65;
        ctx.beginPath();
        ctx.arc(ex, ey, cell * (0.15 + pp * 0.38), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, cell * 0.05 * (1 - ppe));
        ctx.strokeStyle = "#fff6d8";
        ctx.stroke();
        ctx.globalAlpha = (1 - pp) * 0.9;
        ctx.beginPath();
        for (var ray = 0; ray < 12; ray++) {
          var ang = ray / 12 * Math.PI * 2 + pp * 0.4;
          ctx.moveTo(ex + Math.cos(ang) * cell * 0.22, ey + Math.sin(ang) * cell * 0.22);
          ctx.lineTo(ex + Math.cos(ang) * cell * (0.35 + pp * 0.65), ey + Math.sin(ang) * cell * (0.35 + pp * 0.65));
        }
        ctx.lineWidth = Math.max(1, cell * 0.07 * (1 - pp));
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    if (G.flight) {
      var FS = (window.FXConfig && window.FXConfig.fall) || {};
      var landAt = FS.land != null ? FS.land : 0.82;
      var waveAmp = FS.amp != null ? FS.amp : 0.06;
      var waveWaves = FS.waves != null ? FS.waves : 0.7;
      var waveTravel = FS.travel != null ? FS.travel : 0.6;
      var waveDecay = FS.decay != null ? FS.decay : 1.4;
      var squashAmp = FS.squashAmp != null ? FS.squashAmp : 0.24;
      var squashBounce = FS.squashBounce != null ? FS.squashBounce : 1.0;
      var squashDecay = FS.squashDecay != null ? FS.squashDecay : 4.2;
      var bulge = FS.bulge != null ? FS.bulge : 0.16;
      var heightTaper = FS.heightTaper != null ? FS.heightTaper : 0.7;
      var strips = FS.strips != null ? FS.strips : 10;
      for (i = 0; i < G.flight.length; i++) {
        var fl = G.flight[i];
        var q = Math.min(1, (G.now() - fl.t0) / fl.dur);
        /* gravity: from rest to the floor in the first part of the drop */
        var fall = Math.min(1, q / landAt);
        var yy = fl.y0 + (fl.y1 - fl.y0) * fall * fall;
        var tx = pxX(fl.col);
        /* soft-body landing: the gem arrives as a jelly mass. On impact it is
           squeezed flat — the bands nearest the floor most — and spreads
           wider, then wobbles back through a stretch, damped, while a lateral
           ripple runs up it. Bands are laid down from the floor up so the
           footprint stays put. */
        var u = 0, comp = 0, ampl = 0;
        if (q > landAt) {
          u = (q - landAt) / (1 - landAt);
          /* compression is greatest at the moment of impact and dies away
             through alternating squash and stretch */
          comp = squashAmp * cell * Math.cos(squashBounce * Math.PI * 2 * u) *
            Math.exp(-squashDecay * u);
          ampl = waveAmp * cell * Math.exp(-waveDecay * u) * (1 - u);
        }
        if (!ampl && !comp) {
          drawTile(ctx, fl.type, tx, yy, cell, 1, 1);
        } else {
          var size = cell * 1.8, org = cell * 0.4;
          var wc = warpBuf(size);
          drawTile(wc, fl.type, org, org, cell, 1, 1);
          var k = warp.width / size;
          var sh = cell / strips;
          var floorY = yy + cell;
          var cn = comp / cell;                       // compression, in tiles
          var by = floorY;
          for (var s = strips - 1; s >= 0; s--) {
            var v = (strips - s - 0.5) / strips;      // 0 at the floor, up to 1
            var f = 1 - cn * (1 - v * heightTaper);   // the base squashes most
            f = Math.max(0.15, Math.min(1.8, f));
            var h = sh * f;
            var spread = 1 - v * v;                   // bulge widest at the floor
            var w = size * (1 + bulge * cn * spread);
            var dx = ampl * Math.sin(Math.PI * v) *
              Math.sin((v * waveWaves + u * waveTravel) * Math.PI * 2);
            ctx.drawImage(warp, 0, (org + s * sh) * k, warp.width, sh * k,
              tx - org + dx - (w - size) / 2, by - h, w, h);
            by -= h;
          }
        }
        delete rest[fl.row + ":" + fl.col];
      }
    }

    for (key in rest) {
      var parts = key.split(":");
      r = +parts[0]; c = +parts[1];
      var disp = (G.dragDisp && G.hover && r === G.hover[0] && c === G.hover[1]) ? G.dragDisp : null;
      drawTile(ctx, rest[key], pxX(c) + (disp ? disp.x : 0), pxY(r) + (disp ? disp.y : 0), cell, 1, 1);
    }

    if (G.sel) {
      var selPulse = Math.sin(performance.now() / 180);
      ctx.strokeStyle = "#e0702a";
      ctx.lineWidth = Math.max(2, cell * 0.05);
      rr(ctx, L + G.sel[1] * cell + 1, T + G.sel[0] * cell + 1, cell - 2, cell - 2, cell * 0.18);
      ctx.stroke();
      ctx.globalAlpha = 0.35 + 0.25 * selPulse;
      ctx.lineWidth = Math.max(1.5, cell * 0.04);
      var pulseOff = cell * 0.04 * (1 + selPulse);
      rr(ctx, L + G.sel[1] * cell + 1 - pulseOff, T + G.sel[0] * cell + 1 - pulseOff, cell - 2 + pulseOff * 2, cell - 2 + pulseOff * 2, cell * 0.18 + pulseOff);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (G.hover) {
      var hovPulse = Math.sin(performance.now() / 120);
      ctx.strokeStyle = "#ffe9a8";
      ctx.lineWidth = Math.max(2.5, cell * 0.06);
      ctx.globalAlpha = 0.5 + 0.4 * hovPulse;
      rr(ctx, L + G.hover[1] * cell + 1, T + G.hover[0] * cell + 1, cell - 2, cell - 2, cell * 0.18);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (window.PixelFX && PixelFX.active && window.Game && window.Game.state !== "ended") {
      window.PixelFX.draw(ctx);
    }
  }
  function easeOutBack(t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function pxX(c) { return window.Game.geom.left + c * window.Game.geom.cell; }
  function pxY(r) { return window.Game.geom.top + r * window.Game.geom.cell; }

  window.Draw = { render: render, palette: BG };
})();
