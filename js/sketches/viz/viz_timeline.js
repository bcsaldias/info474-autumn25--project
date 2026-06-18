// viz_timeline.js
(function () {

    const events = [
        { year: '2008', label: 'Created the Law', type: 'policy' },
        { year: '2008–2020', label: 'Not Funded', type: 'policy' },
        { year: '2020', label: 'COVID-19 Outbreak', type: 'economic' },
        { year: 'March 2021', label: 'Highest Inflation Growth Rate', type: 'economic' },
        { year: '2021', label: 'Funded and Activated', type: 'policy' },
        { year: '2023', label: 'First Payments Go Out', type: 'policy' },
    ];

    window.VizTimeline = {
        draw: function (p, manager, ai, progress) {
            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;

            const lineX = ox + W / 2;
            const lineTop = oy + 40;
            const lineBottom = oy + H - 40;
            const step = (lineBottom - lineTop) / (events.length - 1);

            // static background line
            p.stroke(80);
            p.strokeWeight(2);
            p.line(lineX, lineTop, lineX, lineBottom);

            // progress line
            const delayedProgress = Math.max(0, Math.min(progress / 0.5, 1));
            const progressY = lineTop + (lineBottom - lineTop) * delayedProgress;
            p.stroke(p.color('#2DA3EE'));
            p.strokeWeight(2);
            p.line(lineX, lineTop, lineX, progressY);

            // economic events 
            events.forEach((ev, i) => {
                if (ev.type !== 'economic') return;
                const y = lineTop + i * step;
                const reached = progressY >= y;
                const col = p.color('red');
                const dimCol = p.color(40, 80, 110);

                // horizontal tick left
                p.stroke(reached ? col : dimCol);
                p.strokeWeight(1);
                p.line(lineX - 12, y, lineX - 40, y);

                // year
                p.noStroke();
                p.fill(reached ? col : p.color(100));
                p.textSize(16);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(ev.year, lineX - 44, y - 8);

                // label
                p.fill(reached ? 220 : 100);
                p.textSize(16);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(ev.label, lineX - 44, y + 10);

                // dot on top
                p.fill(reached ? col : dimCol);
                p.noStroke();
                p.circle(lineX, y, reached ? 14 : 10);
            });

            // policy events 
            events.forEach((ev, i) => {
                if (ev.type !== 'policy') return;
                const y = lineTop + i * step;
                const reached = progressY >= y;
                const col = p.color('#2DA3EE');
                const dimCol = p.color(40, 80, 110);

                // dot
                p.fill(reached ? col : dimCol);
                p.noStroke();
                p.circle(lineX, y, reached ? 14 : 10);

                // year
                p.fill(reached ? col : p.color(100));
                p.noStroke();
                p.textSize(16);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(ev.year, lineX + 20, y - 8);

                // label
                p.fill(reached ? 220 : 100);
                p.textSize(16);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(ev.label, lineX + 20, y + 10);
            });
        }
    };

})();