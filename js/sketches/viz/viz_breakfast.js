(function () {
    window.VizBreakfast = {
        draw: function(p, manager, ai, progress) {
            p.push();
            p.background(255);


                let w = manager.width || 600;
                // increase default height to make room for info under the illustration
                let h = manager.height || 380;
            let totalKids = 10;
            let kidsEating = 5; // half get breakfast
                let spacing = w / (totalKids + 1);
                // position students higher so there's room below for additional info
                let y = h * 0.28;
            let size = 50;
            
            // --- Title / Narrative ---
            p.fill(30);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(20);
            p.text("Half of Eligible Children Still Miss Out on School Breakfast", w / 2, 28);
            p.textSize(13);
            p.fill(60);
            let eligible = 50107578;
            p.text("Even though roughly 50 million students qualify for free or reduced-price breakfast, ", w / 2, 50);
            p.text("only 28.5 million actually participate in the program each school day.", w / 2, 65);
            p.textSize(12);
            p.fill(100);
            p.text(
                `50,107,578 eligible — 28,563,863 participate`,
                w / 2,
                80
            );
            
            // --- Draw children ---
            // helper to draw a simple child icon (head, body, arms, legs)
            function drawChild(cx, cy, s, clothColor, mood = 'happy') {
                // shadow
                p.noStroke();
                p.fill(0, 0, 0, 20);
                p.ellipse(cx, cy + s * 0.6, s * 0.9, s * 0.3);

                // body (shirt)
                // slightly desaturate shirt color for sad mood
                if (mood === 'sad') {
                    p.fill(clothColor[0] * 0.85, clothColor[1] * 0.85, clothColor[2] * 0.85);
                } else {
                    p.fill(clothColor[0], clothColor[1], clothColor[2]);
                }
                p.ellipse(cx, cy + s * 0.12, s * 0.7, s * 0.9);

                // head
                let headY = cy - s * 0.45;
                p.fill(246, 211, 179); // skin tone
                p.ellipse(cx, headY, s * 0.5, s * 0.5);

                // eyes - ensure no stroke so eyes are not outlined in shirt color
                p.noStroke();
                p.fill(30);
                if (mood === 'sad') {
                    // sad eyes - slightly downturned / smaller
                    p.ellipse(cx - s * 0.08, headY - s * 0.01, s * 0.05, s * 0.04);
                    p.ellipse(cx + s * 0.08, headY - s * 0.01, s * 0.05, s * 0.04);
                    // eyebrows slanted
                    p.noFill();
                    p.stroke(30);
                    p.strokeWeight(1.2);
                    p.line(cx - s * 0.14, headY - s * 0.12, cx - s * 0.04, headY - s * 0.08);
                    p.line(cx + s * 0.04, headY - s * 0.08, cx + s * 0.14, headY - s * 0.12);
                    p.noStroke();
                } else {
                    p.ellipse(cx - s * 0.08, headY - s * 0.03, s * 0.06, s * 0.06);
                    p.ellipse(cx + s * 0.08, headY - s * 0.03, s * 0.06, s * 0.06);
                }

                // smile / frown
                p.noFill();
                p.stroke(30);
                p.strokeWeight(1.2);
                if (mood === 'sad') {
                    // frown: lower and a bit narrower so it doesn't overlap eyes
                    p.arc(cx, headY + s * 0.14, s * 0.18, s * 0.10, Math.PI, Math.PI * 2);
                } else {
                    p.arc(cx, headY + s * 0.03, s * 0.2, s * 0.12, 0, Math.PI);
                }
                p.noStroke();

                // arms (position depends on mood)
                p.stroke(clothColor[0] * 0.8, clothColor[1] * 0.8, clothColor[2] * 0.8);
                p.strokeWeight(s * 0.09);
                if (mood === 'sad') {
                    // arms hanging down
                    p.line(cx - s * 0.18, cy + s * 0.05, cx - s * 0.18, cy + s * 0.45);
                    p.line(cx + s * 0.18, cy + s * 0.05, cx + s * 0.18, cy + s * 0.45);
                } else {
                    p.line(cx - s * 0.36, cy - s * 0.05, cx - s * 0.14, cy + s * 0.05);
                    p.line(cx + s * 0.36, cy - s * 0.05, cx + s * 0.14, cy + s * 0.05);
                }

                // legs
                p.stroke(60);
                p.strokeWeight(s * 0.1);
                if (mood === 'sad') {
                    // slightly closer legs to show slumped stance
                    p.line(cx - s * 0.08, cy + s * 0.45, cx - s * 0.08, cy + s * 0.85);
                    p.line(cx + s * 0.08, cy + s * 0.45, cx + s * 0.08, cy + s * 0.85);
                } else {
                    p.line(cx - s * 0.14, cy + s * 0.45, cx - s * 0.14, cy + s * 0.85);
                    p.line(cx + s * 0.14, cy + s * 0.45, cx + s * 0.14, cy + s * 0.85);
                }

                // shoes
                p.noStroke();
                p.fill(40);
                p.ellipse(cx - s * 0.14, cy + s * 0.92, s * 0.16, s * 0.08);
                p.ellipse(cx + s * 0.14, cy + s * 0.92, s * 0.16, s * 0.08);
            }

            // helper to draw a seated child at a desk
            function drawSeatedChild(cx, cy, s, clothColor, mood = 'happy') {
                p.push();
                // legs (draw first so they appear behind desk)
                p.stroke(60);
                p.strokeWeight(s * 0.1);
                if (mood === 'sad') {
                    p.line(cx - s * 0.08, cy + s * 0.45, cx - s * 0.08, cy + s * 0.85);
                    p.line(cx + s * 0.08, cy + s * 0.45, cx + s * 0.08, cy + s * 0.85);
                } else {
                    p.line(cx - s * 0.14, cy + s * 0.45, cx - s * 0.14, cy + s * 0.85);
                    p.line(cx + s * 0.14, cy + s * 0.45, cx + s * 0.14, cy + s * 0.85);
                }
                // shoes
                p.noStroke();
                p.fill(40);
                p.ellipse(cx - s * 0.14, cy + s * 0.92, s * 0.16, s * 0.08);
                p.ellipse(cx + s * 0.14, cy + s * 0.92, s * 0.16, s * 0.08);

                // torso and head (draw before desk so torso is partially covered by desk)
                // torso
                if (mood === 'sad') {
                    p.fill(clothColor[0] * 0.85, clothColor[1] * 0.85, clothColor[2] * 0.85);
                } else {
                    p.fill(clothColor[0], clothColor[1], clothColor[2]);
                }
                p.ellipse(cx, cy + s * 0.12, s * 0.7, s * 0.9);

                // head
                let headY = cy - s * 0.45;
                p.fill(246, 211, 179);
                p.ellipse(cx, headY, s * 0.5, s * 0.5);

                // draw desk in front of torso
                let deskW = s * 1.6;
                let deskH = s * 0.28;
                let deskY = cy + s * 0.5;
                // desk shadow/legs
                p.noStroke();
                p.fill(140, 90, 50);
                p.rectMode(p.CENTER);
                p.rect(cx, deskY, deskW, deskH, 6);
                // desk legs
                p.stroke(110);
                p.strokeWeight(3);
                let legH = s * 0.5;
                p.line(cx - deskW * 0.35, deskY + deskH / 2, cx - deskW * 0.35, deskY + deskH / 2 + legH);
                p.line(cx + deskW * 0.35, deskY + deskH / 2, cx + deskW * 0.35, deskY + deskH / 2 + legH);
                p.noStroke();

                // arms & activity (draw after desk so they appear on top)
                p.stroke(clothColor[0] * 0.9, clothColor[1] * 0.9, clothColor[2] * 0.9);
                p.strokeWeight(s * 0.09);
                if (mood === 'happy') {
                    // arms on desk reaching toward book
                    p.line(cx - s * 0.18, cy + s * 0.05, cx - s * 0.04, deskY - deskH * 0.18);
                    p.line(cx + s * 0.18, cy + s * 0.05, cx + s * 0.04, deskY - deskH * 0.18);
                    // book
                    p.noStroke();
                    p.fill(255);
                    let bookW = s * 0.5;
                    let bookH = s * 0.14;
                    p.rectMode(p.CENTER);
                    p.rect(cx, deskY - deskH * 0.18, bookW, bookH, 2);
                    // page fold line
                    p.stroke(200);
                    p.strokeWeight(1);
                    p.line(cx, deskY - deskH * 0.18 - bookH / 2, cx, deskY - deskH * 0.18 + bookH / 2);
                    p.noStroke();
                } else {
                    // sad: arms hanging or folded on lap (draw short lines)
                    p.line(cx - s * 0.08, cy + s * 0.2, cx - s * 0.08, cy + s * 0.45);
                    p.line(cx + s * 0.08, cy + s * 0.2, cx + s * 0.08, cy + s * 0.45);
                }

                // eyes and mouth - ensure eyes have no stroke so they aren't outlined by shirt color
                p.noStroke();
                p.fill(30);
                if (mood === 'sad') {
                    p.ellipse(cx - s * 0.08, headY - s * 0.01, s * 0.05, s * 0.04);
                    p.ellipse(cx + s * 0.08, headY - s * 0.01, s * 0.05, s * 0.04);
                    // eyebrows
                    p.noFill();
                    p.stroke(30);
                    p.strokeWeight(1.2);
                    p.line(cx - s * 0.14, headY - s * 0.12, cx - s * 0.04, headY - s * 0.08);
                    p.line(cx + s * 0.04, headY - s * 0.08, cx + s * 0.14, headY - s * 0.12);
                    p.noStroke();
                    // frown lower
                    p.noFill();
                    p.stroke(30);
                    p.strokeWeight(1.2);
                    p.arc(cx, headY + s * 0.14, s * 0.18, s * 0.10, Math.PI, Math.PI * 2);
                    p.noStroke();
                } else {
                    p.ellipse(cx - s * 0.08, headY - s * 0.03, s * 0.06, s * 0.06);
                    p.ellipse(cx + s * 0.08, headY - s * 0.03, s * 0.06, s * 0.06);
                    p.noFill();
                    p.stroke(30);
                    p.strokeWeight(1.2);
                    p.arc(cx, headY + s * 0.03, s * 0.2, s * 0.12, 0, Math.PI);
                    p.noStroke();
                }

                p.pop();
            }

            // Draw children seated at desks
            for (let i = 0; i < totalKids; i++) {
                let x = spacing * (i + 1);
                let color;
                let mood = 'happy';
                if (i < kidsEating) {
                    color = [46, 204, 113]; // green = gets breakfast
                    mood = 'happy';
                } else {
                    color = [231, 76, 60]; // red = misses breakfast
                    mood = 'sad';
                }
                drawSeatedChild(x, y , size, color, mood);
            }
            
                // --- Legend ---
                // place legend near the students (higher on the canvas)
                let legendY = y + size * 0.9;
                p.textSize(13);
                p.fill(0);
                p.textAlign(p.CENTER);
                p.text("Green = gets breakfast    •    Red = misses breakfast", w / 2, legendY + 30);

                // --- Benefits / supporting text with green check marks ---
                let infoBlockW = Math.min(w * 0.85, 560);
                let infoX = (w - infoBlockW) / 2;
                let checkX = infoX + 12;
                let textX = checkX + 28;
                let infoY = legendY + 86;
                let lineSpacing = 64;
                p.textSize(13);
                p.textAlign(p.LEFT, p.TOP);
                const benefits = [
                    "Kids who eat breakfast the morning before a standardized test have significantly higher scores in math, spelling and reading than those who don't.",
                    "Breakfast eaters have better brain function, memory and attention.",
                    "Eating breakfast improves kids' performance on vocabulary tests, math problems and challenging mental tasks. It also helps them deal better with frustration."
                ];

                for (let i = 0; i < benefits.length; i++) {
                    let iy = infoY + i * lineSpacing;
                    // check circle
                    p.noStroke();
                    p.fill(46, 204, 113);
                    p.ellipse(checkX, iy + 6, 16, 16);
                    // check mark (white)
                    p.stroke(255);
                    p.strokeWeight(2);
                    p.line(checkX - 4, iy + 6, checkX - 1, iy + 10);
                    p.line(checkX - 1, iy + 10, checkX + 6, iy - 2);
                    p.noStroke();

                    // benefit text (wrap within infoBlockW)
                    p.fill(30);
                    p.text(benefits[i], textX, iy - 6, infoBlockW - (textX - infoX) - 8);
                }
            
            p.pop();
        }
    };
})();
