"use strict";
var TEXT = {
  app: "Farm 3",
  score: "Score",
  moves: "Moves",
  goal: "Goal",
  pts: "pts",
  level: "Level",
  hint: "Tap a symbol, then tap a neighbour to swap.",
  shuffleHint: "No moves left. Board reshuffled.",
  blocked: "Rocks can't be moved.",
  cascade: function (n) { return "Cascade \u00d7" + n; },
  winTitle: "Field cleared",
  winText: function (n) { return "You reached the goal. Next level: " + n + "."; },
  loseTitle: "Out of moves",
  loseText: "You didn't reach the goal. Try again.",
  next: "Next level",
  again: "Play again"
};
