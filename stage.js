"use strict";
(function () {
  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1;

  function resize() {
    var w = canvas.parentElement.clientWidth;
    var h = canvas.parentElement.clientHeight;
    if (!w || !h) return;
    dpr = window.devicePixelRatio || 1;
    W = w; H = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (window.Game && Game.onResize) Game.onResize(W, H);
  }

  var ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  window.addEventListener("resize", resize);

  var last = performance.now();
  function loop(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (window.Game && Game.update) Game.update(dt);
    if (window.PixelFX && PixelFX.update) PixelFX.update(dt);
    if (window.Draw) Draw.render(ctx, W, H);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
