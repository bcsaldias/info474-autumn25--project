// guess_how_many.js
(function () {
    let showResult = false;
    const options = [3, 5, 8, 10];


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

            // Draw buttons
            let buttonWidth = 80;
            let buttonHeight = 60;
            let spacing = 20;
            let totalWidth = (buttonWidth * options.length) + (spacing * (options.length - 1));
            let startX = (p.width - totalWidth) / 2;
            let buttonY = p.height / 3 + 50;

            for (let i = 0; i < options.length; i++) {
                let x = startX + i * (buttonWidth + spacing);
                option = options[i];
                p.fill(70, 130, 180)

                p.stroke(0);
                p.strokeWeight(2);
                p.rect(x, buttonY, buttonWidth, buttonHeight, 10);

                // Button text
                p.fill(255);
                p.noStroke();
                p.textSize(28);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(option, x + buttonWidth / 2, buttonY + buttonHeight / 2);
            }

            p.pop();
        }
    };
})();
