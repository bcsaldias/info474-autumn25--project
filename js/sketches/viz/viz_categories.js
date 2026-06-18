// viz_categories.js
(function () {

    let isInitialized = false;
    let sliderDate = 2000.0;
    let isDragging = false;
    let autoPlaying = false;
    let autoPlayStart = null;
    let lastPressed = false;
    let wasOnScene = false;
    let pausedAt = 0;

    const categories = [
        { key: 'housing', label: 'Housing', emoji: '🏠', file: 'data/housing.tsv', color: '#ffffff', data: [] },
        { key: 'apparel', label: 'Apparel', emoji: '👕', file: 'data/apparel.tsv', color: '#ffffff', data: [] },
        { key: 'food', label: 'Food', emoji: '🍽️', file: 'data/food.tsv', color: '#ffffff', data: [] },
        { key: 'medical', label: 'Medical', emoji: '🏥', file: 'data/medical_care.tsv', color: '#ffffff', data: [] },
        { key: 'gas', label: 'Gas', emoji: '⛽', file: 'data/seattle_gasoline_cpi.tsv', color: '#ffffff', data: [] },
        { key: 'transport', label: 'Transport', emoji: '🚌', file: 'data/transportation.tsv', color: '#ffffff', data: [] },
    ];

    window.VizCategories = {

        resetAnimation: function () {
            autoPlaying = false;
            autoPlayStart = null;
            sliderDate = 2000;
            wasOnScene = false;
            pausedAt = 2000;
        },

        preload: function (p) {
            categories[0].tableRef = p.loadTable(categories[0].file, 'tsv', 'header');
            categories[1].tableRef = p.loadTable(categories[1].file, 'tsv', 'header');
            categories[2].tableRef = p.loadTable(categories[2].file, 'tsv', 'header');
            categories[3].tableRef = p.loadTable(categories[3].file, 'tsv', 'header');
            categories[4].tableRef = p.loadTable(categories[4].file, 'tsv', 'header');
            categories[5].tableRef = p.loadTable(categories[5].file, 'tsv', 'header');
        },

        setup: function () {
            if (isInitialized) return;
            if (categories.some(c => !c.tableRef)) return;

            for (const cat of categories) {
                cat.data = [];
                for (let i = 0; i < cat.tableRef.getRowCount(); i++) {
                    const d = {
                        date: cat.tableRef.getString(i, 'date'),
                        pct_from_2000: parseFloat(cat.tableRef.getString(i, 'pct_from_2000')),
                        pct_yoy: parseFloat(cat.tableRef.getString(i, 'pct_yoy')),
                    };
                    if (d.date >= '2000-02') cat.data.push(d);
                }
            }

            isInitialized = true;
        },

        draw: function (p, manager, ai, progress) {
            if (!isInitialized) this.setup();
            if (!isInitialized) return;
            if (categories.some(c => c.data.length === 0)) return;

            // scene enter/exit
            if (progress > 0) {
                if (!wasOnScene) {
                    wasOnScene = true;
                    autoPlaying = true;
                    autoPlayStart = p.millis();
                    sliderDate = 2000;
                }
            } else {
                wasOnScene = false;
            }

            // auto-play tick
            if (autoPlaying && !isDragging) {
                if (!autoPlayStart) autoPlayStart = p.millis();
                const elapsed = (p.millis() - autoPlayStart) / 1000;
                const duration = 10;
                const t = Math.min(elapsed / duration, 1);
                sliderDate = 2000 + t * 26;
                if (t >= 1) {
                    autoPlaying = false;
                    pausedAt = sliderDate;
                }
            }

            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;
            const pad = { top: 140, right: 60, bottom: 80, left: 100 };
            const gW = W - pad.left - pad.right;
            const gH = H - pad.top - pad.bottom;
            const rowH = gH / categories.length;

            const pctMin = -10;
            const pctMax = 340;
            const pctRange = pctMax - pctMin;
            const zeroX = ox + pad.left + ((-pctMin) / pctRange) * gW;

            const displayYear = Math.floor(sliderDate);
            const displayMonth = Math.min(Math.floor((sliderDate % 1) * 12), 11);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // title
            p.noStroke();
            p.fill(255);
            p.textSize(18);
            p.textStyle(p.NORMAL);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Cumulative CPI Change by Category, 2000 - 2025', ox + pad.left + gW / 2, oy + 20);

            // date label
            p.noStroke();
            p.fill(255);
            p.textSize(16);
            p.textAlign(p.CENTER, p.TOP);
            p.text(monthNames[displayMonth] + ' ' + displayYear, ox + pad.left + gW / 2 - 80, oy + 60);

            // buttons
            const btnY = oy + 50;
            const btnW = 60;
            const btnH = 24;
            const pauseBtnX = ox + pad.left + gW / 2 + 60;
            const resetBtnX = ox + pad.left + gW / 2 + 130;

            p.fill(autoPlaying ? 80 : 40);
            p.stroke(160);
            p.strokeWeight(1);
            p.rect(pauseBtnX, btnY + 5, btnW, btnH, 4);
            p.noStroke();
            p.fill(220);
            p.textSize(11);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(autoPlaying ? 'Pause' : 'Play', pauseBtnX + btnW / 2, btnY + btnH / 2 + 5);

            p.fill(40);
            p.stroke(160);
            p.strokeWeight(1);
            p.rect(resetBtnX, btnY + 5, btnW, btnH, 4);
            p.noStroke();
            p.fill(220);
            p.text('Reset', resetBtnX + btnW / 2, btnY + btnH / 2 + 5);

            // button clicks
            const pressed = p.mouseIsPressed;
            if (pressed && !lastPressed) {
                const mx = p.mouseX;
                const my = p.mouseY;
                if (mx >= pauseBtnX && mx <= pauseBtnX + btnW && my >= btnY && my <= btnY + btnH) {
                    autoPlaying = !autoPlaying;
                    if (autoPlaying) {
                        const prog = (pausedAt - 2000) / 26;
                        autoPlayStart = p.millis() - prog * 10000;
                    } else {
                        pausedAt = sliderDate;
                    }
                }
                if (mx >= resetBtnX && mx <= resetBtnX + btnW && my >= btnY && my <= btnY + btnH) {
                    sliderDate = 2000;
                    autoPlaying = true;
                    autoPlayStart = p.millis();
                }
            }
            lastPressed = pressed;

            // zero line
            p.stroke(120);
            p.strokeWeight(2);
            p.line(zeroX, oy + pad.top, zeroX, oy + pad.top + gH);

            // x axis ticks and grid lines
            for (let v = pctMin; v <= pctMax; v += 20) {
                const x = ox + pad.left + ((v - pctMin) / pctRange) * gW;
                p.stroke(80);
                p.strokeWeight(1);
                p.line(x, oy + pad.top, x, oy + pad.top + gH);
                p.stroke(180);
                p.line(x, oy + pad.top + gH, x, oy + pad.top + gH + 5);
                p.noStroke();
                p.fill(220);
                p.textSize(10);
                p.textAlign(p.CENTER, p.TOP);
                p.text(v + '%', x, oy + pad.top + gH + 8);
            }

            // x axis label
            p.noStroke();
            p.fill(220);
            p.textSize(16);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Cumulative % change since 2000', ox + pad.left + gW / 2, oy + pad.top + gH + 28);

            // x axis bottom line
            p.stroke(180);
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);

            // category row labels and dividers
            categories.forEach((cat, i) => {
                const rowY = oy + pad.top + i * rowH;
                p.stroke(50);
                p.strokeWeight(1);
                p.line(ox + pad.left, rowY, ox + pad.left + gW, rowY);
                p.noStroke();
                p.fill(220);
                p.textSize(16);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(cat.label, ox + pad.left - 10, rowY + rowH / 2);
            });

            // bottom divider
            p.stroke(50);
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);

            // slider
            const trackX1 = ox + pad.left;
            const trackX2 = ox + pad.left + gW;
            const trackLen = trackX2 - trackX1;
            const trackY = oy + pad.top - 40;
            const yearMin = 2000;
            const yearMax = 2026;
            const handleX = trackX1 + ((sliderDate - yearMin) / (yearMax - yearMin)) * trackLen;

            if (p.mouseIsPressed) {
                if (!isDragging) {
                    if (Math.abs(p.mouseX - handleX) < 12 && Math.abs(p.mouseY - trackY) < 12) {
                        isDragging = true;
                        autoPlaying = false;
                        pausedAt = sliderDate;
                    }
                }
                if (isDragging) {
                    sliderDate = yearMin + ((p.mouseX - trackX1) / trackLen) * (yearMax - yearMin);
                    sliderDate = Math.min(Math.max(sliderDate, yearMin), yearMax);
                }
            } else {
                if (isDragging) pausedAt = sliderDate;
                isDragging = false;
            }

            p.stroke(80);
            p.strokeWeight(3);
            p.line(trackX1, trackY, trackX2, trackY);

            p.stroke(p.color('#2DA3EE'));
            p.strokeWeight(3);
            p.line(trackX1, trackY, handleX, trackY);

            p.fill(255);
            p.noStroke();
            p.circle(handleX, trackY, 14);

            p.fill(220);
            p.noStroke();
            p.textSize(11);
            p.textAlign(p.CENTER, p.TOP);
            p.text(monthNames[displayMonth] + ' ' + displayYear, handleX, trackY + 10);

            // bars
            categories.forEach((cat, i) => {
                const rowY = oy + pad.top + i * rowH;
                const rowPad = rowH * 0.25;
                const barY = rowY + rowPad;
                const barH = rowH - rowPad * 2 - 15;

                const toDecimal = (dateStr) => {
                    const [y, m] = dateStr.split('-').map(Number);
                    return y + (m - 1) / 12;
                };

                let before = cat.data[0];
                let after = cat.data[cat.data.length - 1];

                for (let j = 0; j < cat.data.length - 1; j++) {
                    if (toDecimal(cat.data[j].date) <= sliderDate && toDecimal(cat.data[j + 1].date) >= sliderDate) {
                        before = cat.data[j];
                        after = cat.data[j + 1];
                        break;
                    }
                }

                const t = before === after ? 0 :
                    (sliderDate - toDecimal(before.date)) / (toDecimal(after.date) - toDecimal(before.date));

                const interpolated = before.pct_from_2000 + (after.pct_from_2000 - before.pct_from_2000) * p.constrain(t, 0, 1);

                const valX = ox + pad.left + ((interpolated - pctMin) / pctRange) * gW;
                const barX = Math.min(zeroX, valX);
                const barW = Math.abs(valX - zeroX);

                p.noStroke();
                p.fill(cat.color);
                if (interpolated >= 0) {
                    p.rect(barX, barY, barW, barH + 10, 0, 2, 2, 0);
                } else {
                    p.rect(barX, barY, barW, barH + 10, 2, 0, 0, 2);
                }

                p.textSize(18);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(cat.emoji, valX + 8, barY + barH / 2 - 3);

                p.textSize(11);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(interpolated.toFixed(1) + '%', valX + 8, barY + barH / 2 + 14);

                // p.fill(220);
                // p.textSize(11);
                // p.textAlign(p.LEFT, p.CENTER);
                // p.text(interpolated.toFixed(1) + '%', valX + 5, barY + barH / 2);
            });
        },

    };

})();