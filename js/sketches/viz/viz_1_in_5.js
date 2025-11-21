// viz_1_in_5.js
(function () {
    window.Viz1In5 = {
        draw: function (p, manager, ai, progress) {
            p.push();

            p.background(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(24);
            p.textStyle(p.BOLD);

            p.fill(0);
            p.text("~13 million kids in the US",
                   p.width / 2, 100);


            let iconSize = 60;
            let spacingX = 100;
            let spacingY = 125;
            let startX = p.width / 2 - spacingX / 2 + 50;
            let startY = p.height / 2 - spacingY / 2;

            // Coordinates for 5
            let positions = [
                {x: startX - spacingX/2, y: startY},
                {x: startX + spacingX/2, y: startY},
                {x: startX - spacingX, y: startY + spacingY},
                {x: startX, y: startY + spacingY},
                {x: startX + spacingX, y: startY + spacingY}
            ];


            for (let i = 0; i < positions.length; i++) {
                let pos = positions[i];

                // Highlight one kid in blue
                if (i === 0) {
                    p.fill(70, 130, 180);
                } else {
                    p.fill(180);
                }

                p.noStroke();

                // Head
                p.ellipse(pos.x, pos.y - iconSize/2, iconSize/2, iconSize/2);

                // Body (rounded rectangle)
                p.rect(pos.x - iconSize/4, pos.y - iconSize/4,
                       iconSize/2, iconSize, 15);
            }

            p.pop();
        }
    };
})();
