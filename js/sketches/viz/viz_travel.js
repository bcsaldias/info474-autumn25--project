// viz_travel.js

(function () {
    window.VizTravel = {
        draw: function (p, manager, ai, progress) {
            p.push();
            
            var left = 200;
            var top = 80;
            var barWidth = (manager.width || 600) - 160;
            var barHeight = 6;
            var circleSize = 14;
            
            var eras = [
                { label: '1800s', time: '4-6 months', iconPos: 0.15, icon: '🚢', color: [180, 180, 180], speed: 0.000005 },  // 轮船更慢了（减半）
                { label: '1900s', time: '3-4 days', iconPos: 0.4, icon: '🚂', color: [160, 120, 100], speed: 0.0002 },
                { label: 'Today', time: '5-6 hours', iconPos: 0.75, icon: '✈️', color: [100, 180, 230], speed: 0.003 }
            ];
            
            var time = p.millis();
            
            eras.forEach(function(era, i) {
                var y = top + i * 130;
                
                p.fill(240);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(24);
                p.textStyle(p.BOLD);
                p.text(era.label, left - 20, y + barHeight / 2);
                
                p.noStroke();
                p.fill(80);
                p.rect(left, y, barWidth, barHeight);
                
                p.fill(200);
                p.rect(left - circleSize / 2, y - (circleSize - barHeight) / 2, circleSize, circleSize);
                
                p.fill(200);
                p.ellipse(left + barWidth, y + barHeight / 2, circleSize + 2, circleSize + 2);
                
                p.textAlign(p.CENTER, p.TOP);
                p.textSize(12);
                p.fill(180);
                p.text('NYC', left, y + barHeight + 8);
                p.text('SEA', left + barWidth, y + barHeight + 8);
                
                var animProgress = (time * era.speed) % 1.0;  
                var circleX = left + barWidth * animProgress;
                
                p.fill(era.color[0], era.color[1], era.color[2]);
                p.noStroke();
                p.ellipse(circleX, y + barHeight / 2, circleSize, circleSize);
                
                var iconX = left + era.iconPos * barWidth;
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(28);
                p.text(era.icon, iconX, y - 30);
                
                p.textSize(14);
                p.fill(200);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.text(era.time, iconX, y - 45);
            });
            
            p.pop();
        }
    };
})();