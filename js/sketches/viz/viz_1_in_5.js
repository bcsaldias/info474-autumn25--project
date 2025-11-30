// viz_1_in_5.js
(function () {
    window.Viz1In5 = {
        draw: function (p, manager, ai, progress) {
            p.push();

            p.background(255);
            p.textAlign(p.CENTER, p.TOP);

            // Title
            p.fill(0);
            p.textSize(24);
            p.textStyle(p.BOLD);
            p.text("About 130 Sold Out NFL Stadiums", p.width / 2, 50);

            // Subtitle
            p.textSize(18);
            p.textStyle(p.BOLD);
            p.text("(~13 million kids)", p.width / 2, 85);

            // Draw 130 simple NFL stadiums in a grid
            const stadiumSize = 15;
            const gridSpacingX = 35;
            const gridSpacingY = 35;
            const stadiumsPerRow = 13;
            const startX = (p.width - (stadiumsPerRow - 1) * gridSpacingX) / 2;
            const startY = 150;

            for (let i = 0; i < 130; i++) {
                let row = Math.floor(i / stadiumsPerRow);
                let col = i % stadiumsPerRow;
                let x = startX + col * gridSpacingX;
                let y = startY + row * gridSpacingY;

                drawSimpleStadium(p, x, y, stadiumSize);
            }

            p.pop();
        }
    };

    function drawSimpleStadium(p, x, y, size) {
        p.fill(100, 150, 200); // Blue color
        p.stroke(0);
        p.strokeWeight(1);

        // Main stadium oval (simplified U-shape)
        p.arc(x - size / 2, y, size, size * 0.8, p.PI * 0.5, p.PI * 1.5, p.OPEN);
        p.arc(x + size / 2, y, size, size * 0.8, p.PI * 1.5, p.PI * 0.5, p.OPEN);

        // Connect the sides
        p.line(x - size / 2, y - size * 0.4, x + size / 2, y - size * 0.4);
        p.line(x - size / 2, y + size * 0.4, x + size / 2, y + size * 0.4);

        // Field (simple rectangle in center)
        p.fill(76, 175, 80); // Green
        p.noStroke();
        p.rect(x - size * 0.3, y - size * 0.2, size * 0.6, size * 0.4);
    }
})();
