"use strict";
var TEXT = {
  app: "Farm 3",
  score: "Score",
  moves: "Moves",
  best: "Best",
  pts: "pts",
  hint: "Tap a symbol, then tap a neighbour to swap.",
  powerBlast: "Tap any symbol to blast it.",
  powerUpgrade: "Tap a plain symbol to turn it into a bomb.",
  powerPlain: "That one is already special. Pick a plain symbol.",
  shuffleHint: "No moves left. Board reshuffled.",
  blocked: "Rocks can't be moved.",
  cascade: function (n) { return "Cascade \u00d7" + n; },
  newBestTitle: "New best!",
  endTitle: "Out of moves",
  endText: function (s, b) { return "Score: " + s + ". Best: " + b + "."; },
  colors: ["Orange", "Green", "Gold", "Red", "Purple", "Slate", "Blue"],
  symbols: ["Ring", "Triangle", "Diamond", "Star", "Hexagon", "Cross"],
  abilityLabel: function (color, symbol) { return color + " " + symbol; },
  abilityProgress: function (have, need) { return have + "/" + need; },
  abilityDone: "Ability filled!",
  again: "Play again"
};
