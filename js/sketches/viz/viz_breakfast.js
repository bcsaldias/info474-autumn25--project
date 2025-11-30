(function () {
    window.VizBreakfast = {
        draw: function(p, manager, ai, progress) {
        p.push();
        p.background(255);


                let w = manager.width || 600;
                let h = manager.height || 200;
                let totalKids = 10;
                let kidsEating = 5; // half get breakfast
                let spacing = w / (totalKids + 1);
                let y = h / 2;
                let size = 50;
                
                // --- Title / Narrative ---
                p.fill(30);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.text("Too many kids arrive at school hungry", w / 2, 28);
                p.textSize(13);
                p.fill(60);
                let eligible = 21000000;
                let participating = Math.round(eligible * (kidsEating / totalKids));
                p.text(
                    `21,000,000 eligible — ${participating.toLocaleString()} participate`,
                    w / 2,
                    52
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

                    // eyes
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

                    // smile
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

                // Draw children as icons
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
                    drawChild(x, y - 6, size, color, mood);
                }
                
                // --- Legend ---
                p.textSize(13);
                p.fill(0);
                p.textAlign(p.CENTER);
                p.text("Green = gets breakfast    •    Red = misses breakfast", w / 2, h - 20);
                
                p.pop();
            }
        };


})();
