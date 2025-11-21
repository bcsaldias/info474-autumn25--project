// guess_how_many.js
(function () {
    let selectedAnswer = null;
    let showResult = false;
    const correctAnswer = 5;
    let options = [3, 5, 8, 10];


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
                let option = options[i];
                p.fill(70, 130, 180)

                // Button styling
                if (showResult) {
                    if (option === correctAnswer) {
                        p.fill(46, 204, 113); // Green for correct answer
                    } else if (option === selectedAnswer) {
                        p.fill(231, 76, 60); // Red for incorrect selection
                    } else {
                        p.fill(200);
                    }
                } else {
                    p.fill(70, 130, 180); // Default button color
                }

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

            // Result message
            if (showResult) {
                p.textSize(24);
                if (selectedAnswer === correctAnswer) {
                    p.fill(46, 204, 113);
                    p.text("Correct!", p.width / 2, p.height / 2 + 50);
                } else {
                    p.fill(231, 76, 60);
                    p.text("Incorrect. The answer is 1 in 5.", p.width / 2, p.height / 2 + 50);
                }
            }

            p.pop();
        },

        mousePressed: function (p, manager) {
            if (showResult) return; // Don't allow clicking after answer is shown

            let buttonWidth = 80;
            let buttonHeight = 60;
            let spacing = 20;
            let totalWidth = (buttonWidth * options.length) + (spacing * (options.length - 1));
            let startX = (p.width - totalWidth) / 2;
            let buttonY = p.height / 3 + 50;

            for (let i = 0; i < options.length; i++) {
                let x = startX + i * (buttonWidth + spacing);

                if (p.mouseX > x && p.mouseX < x + buttonWidth &&
                    p.mouseY > buttonY && p.mouseY < buttonY + buttonHeight) {
                    selectedAnswer = options[i];
                    showResult = true;
                    break;
                }
            }
        }

    };
})();
