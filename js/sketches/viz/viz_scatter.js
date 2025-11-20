(function () {
    var VizScatter = {
            selectedYear: 2018,
            showing: "imports",
            yearSelect: null,
            toggleButton: null,
    
            setup: function(p) {
                var self = this;
    
                // Year selector (only once!)
                this.yearSelect = p.createSelect();
                this.yearSelect.position(10, 10);
                for (var y = 2018; y <= 2024; y++) {
                    this.yearSelect.option(y);
                }
                this.yearSelect.changed(function() {
                    self.selectedYear = parseInt(self.yearSelect.value());
                });
    
                // Toggle button (only once!)
                this.toggleButton = p.createButton('Switch to Exports');
                this.toggleButton.position(150, 10);
                this.toggleButton.mousePressed(function() {
                    self.showing = self.showing === "imports" ? "exports" : "imports";
                });
            },

        draw: function(p, manager, ai, progress) {
            p.push();

            var w = (manager && manager.width) || 1200;
            var h = (manager && manager.height) || 600;

            p.background(255);
            
            var data = {
                showing: "imports",
                selectedYear: 2018,
                top10Data: [
                    { country: "USA", Agriculture: 20, Technology: 40, Energy: 15 },
                    { country: "CHN", Agriculture: 25, Technology: 30, Energy: 20 },
                    { country: "GER", Agriculture: 15, Technology: 35, Energy: 10 },
                    { country: "BRA", Agriculture: 30, Technology: 20, Energy: 25 },
                    { country: "IND", Agriculture: 10, Technology: 45, Energy: 15 },
                    { country: "CAN", Agriculture: 20, Technology: 25, Energy: 20 },
                    { country: "JPN", Agriculture: 5, Technology: 50, Energy: 10 },
                    { country: "RUS", Agriculture: 15, Technology: 20, Energy: 30 },
                    { country: "FRA", Agriculture: 10, Technology: 30, Energy: 20 },
                    { country: "GBR", Agriculture: 8, Technology: 28, Energy: 15 },
                ],
                sectors: ["Agriculture", "Technology", "Energy"]
            };

            var colors = [];
            for (var i = 0; i < data.sectors.length; i++) {
                var r = (255 / 2) + (90 * i);
                var g = (i * (255 / 3));
                var b = 255;
                colors.push([r, g, b]);
            }

            p.fill(0);
            p.textSize(18);
            p.textAlign(p.CENTER);
            p.text(`Top 10 Countries by ${data.showing} (${data.selectedYear})`, w / 2, 50);

            var margin = 120;
            var chartWidth = w - 2 * margin;
            var chartHeight = h - 2 * margin;
            var barWidth = chartWidth / data.top10Data.length;

            var maxVal = Math.max(...data.top10Data.map(d => 
                data.sectors.reduce((sum, s) => sum + (d[s] || 0), 0)
            ));

            p.textSize(12);
            
            for (var i = 0; i < data.top10Data.length; i++) {
                var d = data.top10Data[i];
                var x = margin + i * 1.5 * (chartWidth / data.top10Data.length) + (chartWidth / data.top10Data.length - barWidth) / 2;
                var yBottom = h - margin;

                for (var j = 0; j < data.sectors.length; j++) {
                    var val = d[data.sectors[j]] || 0;
                    var barHeight = p.map(val, 0, maxVal, 0, chartHeight);
                    var c = colors[j];
                    p.fill(c[0], c[1], c[2]);
                    p.rect(x, yBottom - barHeight, barWidth, barHeight);
                    yBottom -= barHeight;
                }

                p.fill(0);
                p.textAlign(p.CENTER);
                p.text(d.country, x + barWidth / 2, h - margin + 15);
            }
            var lx = 20;
            var ly = 60;
            p.textAlign(p.LEFT);
            for (var k = 0; k < data.sectors.length; k++) {
                var lc = colors[k];
                p.fill(lc[0], lc[1], lc[2]);
                p.rect(lx, ly, 15, 15);
                p.fill(0);
                p.text(data.sectors[k], lx + 20, ly + 12);
                ly += 20;
            }

            p.pop();
        }
    };

    window.VizScatter = VizScatter;
})();
