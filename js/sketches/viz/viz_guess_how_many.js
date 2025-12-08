// guess_how_many.js
(function () {
    let selectedAnswer = null;
    let showResult = false;
    const correctAnswer = 2;
    let options = [1, 2, 5, 8];


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
              p.text("__ in 10 children", p.width / 2, baseY);
              p.text("face food insecurity", p.width / 2, baseY + 30);
            } else {
              p.text("2 in 10 children", p.width / 2, baseY);
              p.text("face food insecurity", p.width / 2, baseY + 30);
            }

            // Draw 10 children icons above the buttons
            drawChildrenIcons(p, showResult);

            // Draw buttons
            let buttonWidth = 80;
            let buttonHeight = 60;
            let spacing = 20;
            let totalWidth = (buttonWidth * options.length) + (spacing * (options.length - 1));
            let startX = (p.width - totalWidth) / 2;
            let buttonY = p.height / 3 + 100;

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
                    p.text("Correct :(", p.width / 2, p.height / 2 + 100);
                } else {
                    p.fill(231, 76, 60);
                    p.text("Incorrect. The answer is 2 in 10.", p.width / 2, p.height / 2 + 100);
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
            let buttonY = p.height / 3 + 100;

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

    function drawChildrenIcons(p, showResult) {
        const childSize = 35;
        const spacing = 40;
        const totalWidth = 10 * spacing;
        const startX = (p.width - totalWidth) / 2 +20;
        const startY = p.height / 3 + 20;

        for (let i = 0; i < 10; i++) {
            let x = startX + i * spacing;
            let y = startY;

            // Determine color based on result
            let headColor, bodyColor, isSad;
            if (showResult && i < 2) {
                headColor = [100, 150, 200]; // Blue for affected children
                bodyColor = [80, 130, 180]; // Darker blue for body
                isSad = true;
            } else {
                headColor = [220, 200, 120]; // Muted yellow for unaffected children
                bodyColor = [200, 175, 100]; // Slightly darker yellow for body
                isSad = false;
            }

            // Draw body (rectangle below head)
            p.strokeWeight(2);
            p.stroke(100);
            p.fill(bodyColor[0], bodyColor[1], bodyColor[2]);
            p.rect(x - 8, y + 12, 16, 20, 3);

            // Draw arms (simple lines)
            p.strokeWeight(2);
            p.stroke(100);
            p.line(x - 10, y + 15, x - 15, y + 10);
            p.line(x + 10, y + 15, x + 15, y + 10);

            // Draw circle for head
            p.strokeWeight(2);
            p.stroke(100);
            p.fill(headColor[0], headColor[1], headColor[2]);
            p.circle(x, y, childSize);

            // Draw face
            p.fill(0);
            p.noStroke();
            p.circle(x - 4, y - 3, 2.5); // Left eye
            p.circle(x + 4, y - 3, 2.5); // Right eye

            if (isSad) {
                // Sad face - curved mouth downward
                p.strokeWeight(1.5);
                p.stroke(0);
                p.noFill();
                p.arc(x, y + 3, 8, 6, p.PI, p.TWO_PI);
            } else {
                // Happy face - curved mouth upward
                p.strokeWeight(1.5);
                p.stroke(0);
                p.noFill();
                p.arc(x, y + 4, 8, 6, 0, p.PI);
            }
        }
    }
})();
