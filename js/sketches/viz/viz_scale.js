// viz_justice.js
// Lady Justice scale comparing 2024 vs 2025 totals.
// Improved visual: realistic beam, fulcrum, chains, bowl-shaped pans, and shadows.

(function () {
    window.VizJustice = {
        draw: function (p, manager, ai, progress) {
            p.push();
            p.noStroke();

            // Canvas/manager values
            let w = manager.width || 600;
            let h = manager.height || 520;
            let ox = manager.offsetX || 0;
            let oy = manager.offsetY || 0;

            // --- DATA (Totals only for iteration 1) ---
            let total2024 = 10418069;
            let total2025 = 11260832;

            // Normalize to scale pan displacement
            let maxVal = Math.max(total2024, total2025);
            let leftWeight = total2024 / maxVal;
            let rightWeight = total2025 / maxVal;

            // Tilt based on imbalance. convert to a small angle (radians)
            let imbalance = (rightWeight - leftWeight);
            let tiltAngle = imbalance * (Math.PI / 16); // max ~11 degrees

            // Lady Justice Scale Base Position
            let cx = ox + w / 2;
            let cy = oy + h * 0.28;

            // Draw floor / ground shadow
            p.fill(230);
            p.rectMode(p.CENTER);
            p.rect(cx, cy + 220, w * 0.9, 60, 10);

            // --- Pedestal / Central column ---
            p.push();
            p.translate(cx, cy + 70);
            // base
            p.fill(60);
            p.rect(0, 120, 160, 24, 8);
            p.rect(0, 50, 36, 200, 6);
            // ornate top
            p.fill(100);
            p.ellipse(0, -10, 48, 22);
            p.pop();

            // --- Beam and fulcrum ---
            let beamLen = w * 0.55;
            let beamThickness = 12;

            p.push();
            p.translate(cx, cy);
            p.rotate(tiltAngle);

            // Fulcrum / pivot - a triangular support attached to column
            p.push();
            p.fill(120);
            p.noStroke();
            p.triangle(-18, 30, 18, 30, 0, 6);
            p.fill(80);
            p.ellipse(0, 0, 22, 22); // pivot knob
            p.pop();

            // Beam (rounded rectangle)
            p.fill(120);
            p.rectMode(p.CENTER);
            p.rect(0, 0, beamLen, beamThickness, 8);

            // Slight bevel highlight
            p.fill(150, 150, 160, 80);
            p.rect(0, -2, beamLen - 6, 4, 6);

            // Anchor points for chains (a little inset from beam ends)
            let leftX = -beamLen / 2 + 48;
            let rightX = beamLen / 2 - 48;

            // compute world coords for anchor points (beam rotated by tiltAngle)
            let cosT = Math.cos(tiltAngle);
            let sinT = Math.sin(tiltAngle);
            // the small vertical offset where the hook is drawn in beam-local coords
            let hookY = 6;
            // transform beam-local (x,y) to world coords: x' = cx + x*cos - y*sin; y' = cy + x*sin + y*cos
            let leftWorld = {
                x: cx + leftX * cosT - hookY * sinT,
                y: cy + leftX * sinT + hookY * cosT
            };
            let rightWorld = {
                x: cx + rightX * cosT - hookY * sinT,
                y: cy + rightX * sinT + hookY * cosT
            };

            // Chain length (vary slightly with weight to suggest compression)
            let baseChainLen = Math.min(160, h * 0.4);
            let leftChainLen = baseChainLen - (imbalance * 12); // heavier side shorter
            let rightChainLen = baseChainLen + (imbalance * 12);

            // function to draw a segmented chain (vertical hanging)
            function drawChain(topX, topY, length, wobble) {
                p.push();
                p.stroke(90);
                p.strokeWeight(2);
                let seg = 8;
                let segLen = length / seg;
                for (let i = 0; i < seg; i++) {
                    let y1 = topY + i * segLen;
                    let y2 = topY + i * segLen + segLen * 0.7;
                    // slight horizontal alternation to mimic links
                    let dx = (i % 2 === 0) ? -wobble : wobble;
                    p.line(topX + dx, y1, topX - dx, y2);
                }
                p.noStroke();
                p.pop();
            }

            // Draw small hooks where chains attach (on beam)
            p.fill(90);
            p.ellipse(leftX, 6, 8, 6);
            p.ellipse(rightX, 6, 8, 6);

            p.pop(); // end beam block

            // --- Pans (bowl-shaped) ---
            function drawPan(topX, topY, chainLen, bowlW, bowlH, fillCol) {
                // pan center (hangs straight down from anchor)
                let cxPan = topX;
                let cyPan = topY + chainLen + bowlH * 0.2;

                // Shadow under pan on the floor
                p.push();
                p.fill(0, 0, 0, 30);
                p.noStroke();
                p.ellipse(cxPan, cyPan + bowlH * 0.9 + 28, bowlW * 1.2, bowlH * 0.6);
                p.pop();

                // bowl rim (shallow ellipse)
                p.push();
                // simulate a metallic gradient by drawing a few slightly different ellipses
                for (let i = 0; i < 5; i++) {
                    let alpha = 200 - i * 30;
                    let scale = 1 - i * 0.04;
                    p.fill(fillCol[0], fillCol[1], fillCol[2], alpha);
                    p.ellipse(cxPan, cyPan - i * 0.6, bowlW * scale, bowlH * 0.9 * scale);
                }
                // rim outline
                p.noFill();
                p.stroke(60);
                p.strokeWeight(2);
                p.ellipse(cxPan, cyPan, bowlW, bowlH);
                p.noStroke();
                p.pop();

                // draw small label under pan placeholder (we won't clutter with numbers here)
            }

            // Draw chains in world coords (chains hang vertically) starting at the hook position
            drawChain(leftWorld.x, leftWorld.y, leftChainLen, 3);
            drawChain(rightWorld.x, rightWorld.y, rightChainLen, 3);

            // Draw left and right pans using the previously computed world anchors
            drawPan(leftWorld.x, leftWorld.y, leftChainLen, 140, 36, [190, 190, 200]);
            drawPan(rightWorld.x, rightWorld.y, rightChainLen, 140, 36, [200, 190, 190]);

            // --- Decorative touches / text labels ---
            p.fill(40);
            p.textAlign(p.CENTER);
            p.textSize(20);
            p.text("National School Lunch Program Participation", cx, oy + 32);

            p.textSize(14);
            p.textAlign(p.LEFT);
            p.text("2024: " + total2024.toLocaleString(), cx - w * 0.28, oy + h - 40);
            p.textAlign(p.RIGHT);
            p.text("2025: " + total2025.toLocaleString(), cx + w * 0.28, oy + h - 40);

            p.pop();
        }
    };
})();