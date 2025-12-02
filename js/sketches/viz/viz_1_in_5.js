// viz_1_in_5.js
(function () {
    let stadiumImage = null;

    window.Viz1In5 = {
        draw: function (p, manager, ai, progress) {
            p.push();

            p.background(255);
            p.textAlign(p.CENTER, p.TOP);

            // Title
            p.fill(0);
            p.textSize(24);
            p.textStyle(p.BOLD);
            p.text("About 130 Sold Out NFL Stadiums of Hungry Kids", p.width / 2, 50);

            // Subtitle
            p.textSize(18);
            p.textStyle(p.BOLD);
            p.text("(~13 million kids)", p.width / 2, 85);

            // Load image on first draw
            if (!stadiumImage) {
                stadiumImage = p.createImage(1, 1); // Placeholder
                p.loadImage('images/nfl_stadium.png', function(img) {
                    stadiumImage = img;
                });
            }

            // Display the stadium image
            if (stadiumImage && stadiumImage.width > 1) {
                let imgWidth = 500;
                let imgHeight = (stadiumImage.height / stadiumImage.width) * imgWidth;
                p.image(stadiumImage, (p.width - imgWidth) / 2, 130, imgWidth, imgHeight);
            } else {
                p.fill(150);
                p.textSize(14);
                p.text("Loading stadium image...", p.width / 2, p.height / 2);
            }

            p.pop();
        }
    };
})();
