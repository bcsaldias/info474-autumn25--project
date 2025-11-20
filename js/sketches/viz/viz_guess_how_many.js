// guess_how_many.js
(function () {
  let showResult = false;

  window.GuessHowMany = {
    draw: function (p, manager, ai, progress) {
      p.push();

      p.background(255);
      p.textAlign(p.CENTER);

      // Main question text

      p.fill(0);
      p.textSize(24);
      p.textStyle(p.BOLD);

      let baseY = p.height / 2 - 150; // move the whole block higher

      if (!showResult) {
        p.text("1 in ___ children", p.width / 2, baseY);
        p.text("face food insecurity", p.width / 2, baseY + 30);
      } else {
        p.text("1 in 5 children", p.width / 2, baseY);
        p.text("face food insecurity", p.width / 2, baseY + 30);
      }

      p.pop();
    }
  };
})();
