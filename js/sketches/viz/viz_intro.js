(function () {
    let plateImage = null;

    window.VizIntro = {
        draw: function (p, manager, ai, progress) {

            p.push();

            p.background(255);
            p.textAlign(p.CENTER, p.TOP);

            if (!plateImage) {
                plateImage = p.createImage(1, 1);
                p.loadImage('images/empty_plate.png', function(img) {
                    plateImage = img;
                });
            }
            // Display the plate image
            if (plateImage && plateImage.width > 1) {
                let imgWidth = 500;
                let imgHeight = (plateImage.height / plateImage.width) * imgWidth;
                p.image(plateImage, (p.width - imgWidth) / 2, 0, imgWidth, imgHeight);
            }

            p.pop();
        }
    };
})();