"use strict";
var TEXT = {
  app: "Farm 3",
  score: "Score",
  moves: "Moves",
  best: "Best",
  pts: "pts",
  hint: "Tap a symbol, then tap a neighbour to swap.",
  shuffleHint: "No moves left. Board reshuffled.",
  blocked: "Rocks can't be moved.",
  cascade: function (n) { return "Cascade \u00d7" + n; },
  newBestTitle: "New best!",
  endTitle: "Out of moves",
  endText: function (s, b) { return "Score: " + s + ". Best: " + b + "."; },
  again: "Play again"
};
