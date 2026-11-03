"use strict";
(function () {
  var CROP = ["\uD83E\uDD55", "\uD83C\uDF3D", "\uD83C\uDF3E", "\uD83C\uDF4E", "\uD83C\uDF47", "\uD83C\uDF83", "\uD83C\uDF45"];
  var BG = ["#dd6b5c", "#74b257", "#f7dc78", "#ffffff", "#9a7ad8", "#2f2f38", "#5b93d6"];
  var EDGE = "rgba(120,85,40,.18)";

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTile(ctx, value, x, y, cell, scale, alpha) {
    var G = window.Game;
    if (G.isRock(value)) { drawRock(ctx, x, y, cell, scale, alpha); return; }
    var special = G.isSpecial(value);
    var type = G.typeOf(value);
    var pad = cell * 0.06;
    var s = cell * (scale == null ? 1 : scale);
    var cx = x + cell / 2, cy = y + cell / 2;
    ctx.globalAlpha = (alpha == null ? 1 : alpha);
    if (special) {
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.47, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,226,120,.55)";
      ctx.fill();
    }
    rr(ctx, cx - s / 2 + pad, cy - s / 2 + pad, s - pad * 2, s - pad * 2, cell * 0.16);
    ctx.fillStyle = BG[type];
    ctx.fill();
    ctx.lineWidth = Math.max(1, cell * 0.02);
    ctx.strokeStyle = EDGE;
    ctx.stroke();
    ctx.font = (s * 0.58) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(CROP[type], cx, cy + cell * 0.03);
    if (special) {
      var power = G.powerOf(value);
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.40, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, cell * 0.045);
      ctx.strokeStyle = "rgba(255,255,255,.92)";
      ctx.stroke();
      ctx.font = (s * 0.30) + "px system-ui, sans-serif";
      ctx.fillStyle = "#3b2a12";
      ctx.fillText(power === 1 ? "\u2194" : power === 2 ? "\u2195" : "\u2736", cx, cy - s * 0.30);
    }
    ctx.globalAlpha = 1;
  }

  function drawRock(ctx, x, y, cell, scale, alpha) {
    var s = cell * (scale == null ? 1 : scale);
    var pad = cell * 0.07;
    var cx = x + cell / 2, cy = y + cell / 2;
    ctx.globalAlpha = (alpha == null ? 1 : alpha);
    rr(ctx, cx - s / 2 + pad, cy - s / 2 + pad, s - pad * 2, s - pad * 2, cell * 0.14);
    ctx.fillStyle = "#8d887c";
    ctx.fill();
    ctx.lineWidth = Math.max(1, cell * 0.025);
    ctx.strokeStyle = "rgba(55,50,42,.55)";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.20, cy + s * 0.16);
    ctx.lineTo(cx - s * 0.02, cy - s * 0.04);
    ctx.lineTo(cx + s * 0.18, cy + s * 0.20);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.18)";
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
    rr(ctx, L - 2, T - 2, cell * G.cols + 4, cell * G.rows + 4, 13);
    ctx.fillStyle = "#fbf6e9";
    ctx.fill();
    ctx.strokeStyle = "#e3d9bd";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(160,140,95,.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i <= G.cols; i++) { ctx.moveTo(L + i * cell, T); ctx.lineTo(L + i * cell, T + cell * G.rows); }
    for (i = 0; i <= G.rows; i++) { ctx.moveTo(L, T + i * cell); ctx.lineTo(L + cell * G.cols, T + i * cell); }
    ctx.stroke();

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
        ctx.globalAlpha = (1 - pp) * 0.85;
        ctx.beginPath();
        ctx.arc(ex, ey, cell * (0.20 + ppe * 0.80), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1.5, cell * 0.11 * (1 - pp));
        ctx.strokeStyle = "#ff9a3c";
        ctx.stroke();
        ctx.globalAlpha = (1 - ppe) * 0.5;
        ctx.beginPath();
        ctx.arc(ex, ey, cell * (0.15 + pp * 0.35), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, cell * 0.045 * (1 - ppe));
        ctx.strokeStyle = "#ffd97a";
        ctx.stroke();
        ctx.globalAlpha = (1 - pp) * 0.9;
        ctx.beginPath();
        for (var ray = 0; ray < 8; ray++) {
          var ang = ray / 8 * Math.PI * 2 + pp * 0.4;
          ctx.moveTo(ex + Math.cos(ang) * cell * 0.22, ey + Math.sin(ang) * cell * 0.22);
          ctx.lineTo(ex + Math.cos(ang) * cell * (0.35 + pp * 0.60), ey + Math.sin(ang) * cell * (0.35 + pp * 0.60));
        }
        ctx.lineWidth = Math.max(1, cell * 0.06 * (1 - pp));
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    if (G.flight) {
      for (i = 0; i < G.flight.length; i++) {
        var fl = G.flight[i];
        var q = Math.min(1, (G.now() - fl.t0) / fl.dur);
        var qq = easeOutBounce(q);
        var yy = fl.y0 + (fl.y1 - fl.y0) * qq;
        var dropScale = 1 + 0.08 * Math.sin(qq * Math.PI);
        drawTile(ctx, fl.type, pxX(fl.col), yy, cell, dropScale, 1);
        delete rest[fl.row + ":" + fl.col];
      }
    }

    for (key in rest) {
      var parts = key.split(":");
      r = +parts[0]; c = +parts[1];
      drawTile(ctx, rest[key], pxX(c), pxY(r), cell, 1, 1);
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
  function easeOutBounce(t) {
    var n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    else return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
  function pxX(c) { return window.Game.geom.left + c * window.Game.geom.cell; }
  function pxY(r) { return window.Game.geom.top + r * window.Game.geom.cell; }

  window.Draw = { render: render };
})();
