// viz_weather_week.js
// Sketch 4 + Sketch 5 for "Beyond the Forecast"
// Sketch 4: Build Your Weekly Weather Lens
// Sketch 5: Day in Context

(function () {
    const FACTORS = [
        { key: 'rain', label: 'Rain', icon: '☔', color: [67, 132, 210], test: d => d.precip > 0.02 || d.precipprob >= 50 },
        { key: 'cloud', label: 'Cloud cover', icon: '☁', color: [135, 145, 155], test: d => d.cloudcover >= 75 },
        { key: 'daylight', label: 'Low daylight', icon: '◐', color: [118, 96, 170], test: d => d.daylightHours > 0 && d.daylightHours < 10 },
        { key: 'solar', label: 'Low solar energy', icon: '☀', color: [236, 176, 55], test: d => d.solarenergy > 0 && d.solarenergy < 5 },
        { key: 'wind', label: 'Wind', icon: '≋', color: [68, 160, 156], test: d => d.windspeed >= 12 },
        { key: 'temp', label: 'Temperature comfort', icon: '♨', color: [225, 105, 93], test: d => d.feelslike < 45 || d.feelslike > 80 }
    ];

    function initState(manager) {
        if (!manager.weatherState) {
            manager.weatherState = {
                selected: { rain: true, cloud: false, daylight: true, solar: false, wind: true, temp: false },
                weekStart: 0,
                selectedDayOffset: 4,
                hitZones: []
            };
        }
        if (!manager.weatherState.hitZones) manager.weatherState.hitZones = [];
    }

    function computeDaylightHours(d) {
        if (!d.sunrise || !d.sunset) return 0;
        const start = new Date(d.sunrise);
        const end = new Date(d.sunset);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
        return Math.max(0, (end - start) / (1000 * 60 * 60));
    }

    function cleanRows(rows) {
        return (rows || []).map(function (r) {
            const d = Object.assign({}, r);
            d.date = r.datetime || r.date || '';
            d.precip = parseFloat(r.precip) || 0;
            d.precipprob = parseFloat(r.precipprob) || 0;
            d.cloudcover = parseFloat(r.cloudcover) || 0;
            d.solarenergy = parseFloat(r.solarenergy) || 0;
            d.windspeed = parseFloat(r.windspeed) || 0;
            d.feelslike = parseFloat(r.feelslike || r.temp) || 0;
            d.temp = parseFloat(r.temp) || d.feelslike;
            d.daylightHours = parseFloat(r.daylightHours) || computeDaylightHours(r);
            return d;
        }).filter(d => d.date).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function getDailyData(manager) {
        if (!manager.weatherDaily || manager.weatherDaily.length === 0) {
            manager.weatherDaily = makeFallbackData();
        }
        return manager.weatherDaily;
    }

    function makeFallbackData() {
        // Used only if the CSV is not loaded yet. This keeps the sketch visible while testing.
        const start = new Date('2025-03-10T12:00:00');
        const rows = [];
        for (let i = 0; i < 21; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            rows.push({
                date: date.toISOString().slice(0, 10),
                precip: [0.00, 0.06, 0.02, 0.00, 0.42, 0.10, 0.00][i % 7],
                precipprob: [10, 80, 45, 20, 100, 70, 5][i % 7],
                cloudcover: [68, 88, 80, 60, 92, 76, 35][i % 7],
                daylightHours: [8.8, 8.9, 9.0, 9.1, 8.7, 9.2, 9.4][i % 7],
                solarenergy: [3.8, 2.1, 4.6, 6.2, 2.1, 4.8, 8.0][i % 7],
                windspeed: [8, 11, 7, 13, 14, 9, 5][i % 7],
                feelslike: [48, 46, 49, 50, 48, 51, 54][i % 7],
                temp: [50, 48, 51, 52, 50, 53, 56][i % 7],
                conditions: ['Cloudy', 'Rain', 'Cloudy', 'Windy', 'Rain and wind', 'Rain', 'Partly cloudy'][i % 7]
            });
        }
        return rows;
    }

    function selectedFactors(manager) {
        const state = manager.weatherState;
        return FACTORS.filter(f => state.selected[f.key]);
    }

    function activeFactorsForDay(d) {
        return FACTORS.filter(f => f.test(d));
    }

    function selectedOverlapCount(d, manager) {
        return selectedFactors(manager).filter(f => f.test(d)).length;
    }

    function weekData(manager) {
        const data = getDailyData(manager);
        const state = manager.weatherState;
        const maxStart = Math.max(0, data.length - 7);
        state.weekStart = Math.max(0, Math.min(state.weekStart, maxStart));
        return data.slice(state.weekStart, state.weekStart + 7);
    }

    function addZone(manager, type, key, x, y, w, h) {
        manager.weatherState.hitZones.push({ type, key, x, y, w, h });
    }

    function mouseIn(zone, mx, my) {
        return mx >= zone.x && mx <= zone.x + zone.w && my >= zone.y && my <= zone.y + zone.h;
    }

    function setupMouse(p, manager) {
        if (manager._weatherLensMouseReady) return;
        manager._weatherLensMouseReady = true;
        p.mousePressed = function () {
            initState(manager);
            const ai = manager.state.activeIndex || 0;
            if (ai !== 4 && ai !== 5) return;
            const zones = manager.weatherState.hitZones || [];
            for (let i = zones.length - 1; i >= 0; i--) {
                const z = zones[i];
                if (!mouseIn(z, p.mouseX, p.mouseY)) continue;
                if (z.type === 'factor') {
                    manager.weatherState.selected[z.key] = !manager.weatherState.selected[z.key];
                    return;
                }
                if (z.type === 'preset') {
                    applyPreset(manager, z.key);
                    return;
                }
                if (z.type === 'day') {
                    manager.weatherState.selectedDayOffset = z.key;
                    return;
                }
                if (z.type === 'prevWeek') {
                    manager.weatherState.weekStart = Math.max(0, manager.weatherState.weekStart - 7);
                    return;
                }
                if (z.type === 'nextWeek') {
                    const data = getDailyData(manager);
                    manager.weatherState.weekStart = Math.min(Math.max(0, data.length - 7), manager.weatherState.weekStart + 7);
                    return;
                }
            }
        };
    }

    function applyPreset(manager, preset) {
        const s = { rain: false, cloud: false, daylight: false, solar: false, wind: false, temp: false };
        if (preset === 'walker') { s.rain = true; s.wind = true; s.temp = true; }
        if (preset === 'bus') { s.rain = true; s.wind = true; s.daylight = true; }
        if (preset === 'evening') { s.daylight = true; s.wind = true; s.temp = true; }
        if (preset === 'gray') { s.cloud = true; s.solar = true; s.daylight = true; }
        if (preset === 'clear') { /* keep all false */ }
        manager.weatherState.selected = s;
    }

    function fmtDate(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function dow(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }

    function drawButton(p, x, y, w, h, label, active, color) {
        p.stroke(active ? p.color(color[0], color[1], color[2]) : 220);
        p.strokeWeight(active ? 2 : 1);
        p.fill(active ? p.color(color[0], color[1], color[2], 35) : 255);
        p.rect(x, y, w, h, 8);
        p.noStroke();
        p.fill(35);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.text(label, x + 12, y + h / 2);
        if (active) {
            p.fill(color[0], color[1], color[2]);
            p.textAlign(p.RIGHT, p.CENTER);
            p.text('✓', x + w - 12, y + h / 2);
        }
    }

    function drawSketch4(p, manager) {
        initState(manager);
        setupMouse(p, manager);
        manager.weatherState.hitZones = [];

        const ox = manager.offsetX || 20;
        const oy = manager.offsetY || 0;
        const w = manager.width || 600;
        const h = manager.height || 520;
        const week = weekData(manager);

        p.push();
        p.textFont('system-ui');
        p.noStroke();
        p.fill(20);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(22);
        p.text('Build Your Weekly Weather Lens', ox, oy + 8);
        p.textSize(13);
        p.fill(85);
        p.text('Choose the weather factors that matter most to your routine. Days become darker when selected conditions overlap.', ox, oy + 40, w - 20, 40);

        const panelX = ox;
        const panelY = oy + 88;
        const panelW = Math.min(190, w * 0.30);
        const panelH = 360;
        p.fill(250);
        p.stroke(225);
        p.rect(panelX, panelY, panelW, panelH, 12);
        p.noStroke();
        p.fill(40);
        p.textSize(14);
        p.text('Select factors', panelX + 14, panelY + 14);

        let y = panelY + 45;
        FACTORS.forEach(function (f) {
            drawButton(p, panelX + 14, y, panelW - 28, 30, f.icon + '  ' + f.label, manager.weatherState.selected[f.key], f.color);
            addZone(manager, 'factor', f.key, panelX + 14, y, panelW - 28, 30);
            y += 39;
        });

        p.fill(40);
        p.textSize(13);
        p.text('Quick presets', panelX + 14, y + 10);
        y += 36;
        const presets = [
            ['walker', 'Campus walker'],
            ['bus', 'Bus commuter'],
            ['evening', 'Evening class'],
            ['gray', 'Gray weather sensitive'],
            ['clear', 'Clear all']
        ];
        presets.forEach(function (pr) {
            p.stroke(220);
            p.fill(255);
            p.rect(panelX + 14, y, panelW - 28, 26, 7);
            p.noStroke();
            p.fill(55);
            p.textSize(11);
            p.text(pr[1], panelX + 24, y + 6);
            addZone(manager, 'preset', pr[0], panelX + 14, y, panelW - 28, 26);
            y += 31;
        });

        const chartX = panelX + panelW + 30;
        const chartY = oy + 100;
        const chartW = w - panelW - 50;
        const dayW = chartW / 7;
        const rowH = 38;
        const headerH = 58;

        p.noStroke();
        p.fill(35);
        p.textSize(16);
        p.text('Weekly Forecast Lens', chartX, oy + 78);

        // week navigation
        p.stroke(210);
        p.fill(255);
        p.rect(chartX + chartW - 120, oy + 74, 50, 26, 7);
        p.rect(chartX + chartW - 60, oy + 74, 50, 26, 7);
        p.noStroke();
        p.fill(80);
        p.textSize(12);
        p.text('← Prev', chartX + chartW - 110, oy + 80);
        p.text('Next →', chartX + chartW - 52, oy + 80);
        addZone(manager, 'prevWeek', null, chartX + chartW - 120, oy + 74, 50, 26);
        addZone(manager, 'nextWeek', null, chartX + chartW - 60, oy + 74, 50, 26);

        // headers
        week.forEach(function (d, i) {
            const x = chartX + i * dayW;
            p.noStroke();
            p.fill(45);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text(dow(d.date), x + dayW / 2, chartY);
            p.fill(105);
            p.textSize(11);
            p.text(fmtDate(d.date), x + dayW / 2, chartY + 18);
            p.textSize(20);
            p.text(weatherIcon(d), x + dayW / 2, chartY + 34);
        });

        // factor rows with cells
        FACTORS.forEach(function (f, r) {
            const yy = chartY + headerH + r * rowH;
            p.noStroke();
            p.fill(f.color[0], f.color[1], f.color[2]);
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(13);
            p.text(f.icon, chartX - 14, yy + rowH / 2);

            week.forEach(function (d, i) {
                const x = chartX + i * dayW;
                const active = f.test(d);
                p.stroke(230);
                p.strokeWeight(1);
                p.fill(active ? p.color(f.color[0], f.color[1], f.color[2], 55) : p.color(255));
                p.rect(x, yy, dayW, rowH);
            });
        });

        // selected overlap darkness overlay and clickable day zones
        week.forEach(function (d, i) {
            const x = chartX + i * dayW;
            const count = selectedOverlapCount(d, manager);
            if (count > 0) {
                const alpha = Math.min(160, 45 + count * 38);
                p.noStroke();
                p.fill(45, 64, 110, alpha);
                p.rect(x + 1, chartY + headerH, dayW - 2, FACTORS.length * rowH, 4);
            }
            if (manager.weatherState.selectedDayOffset === i) {
                p.noFill();
                p.stroke(40, 75, 160);
                p.strokeWeight(3);
                p.rect(x + 2, chartY + headerH - 2, dayW - 4, FACTORS.length * rowH + 4, 5);
            }
            addZone(manager, 'day', i, x, chartY, dayW, headerH + FACTORS.length * rowH);
        });

        // legend/explanation
        const legendY = chartY + headerH + FACTORS.length * rowH + 28;
        p.noStroke();
        p.fill(80);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(12);
        p.text('How to read it:', chartX, legendY);
        p.text('Light cells = a condition is present. Darker columns = more of your selected conditions overlap on that day. Click a day to use it in the Day in Context view.', chartX, legendY + 20, chartW, 44);

        const lx = chartX;
        const ly = legendY + 76;
        for (let i = 0; i < 5; i++) {
            p.noStroke();
            p.fill(45, 64, 110, i * 35);
            p.rect(lx + i * 34, ly, 30, 14);
        }
        p.fill(100);
        p.textSize(11);
        p.text('less overlap', lx, ly + 20);
        p.text('more overlap', lx + 120, ly + 20);
        p.pop();
    }

    function weatherIcon(d) {
        if (d.precip > 0.02 || d.precipprob >= 50) return '🌧';
        if (d.cloudcover >= 75) return '☁';
        if (d.windspeed >= 12) return '💨';
        return '☀';
    }

    function drawSketch5(p, manager) {
        initState(manager);
        setupMouse(p, manager);
        manager.weatherState.hitZones = [];

        const ox = manager.offsetX || 20;
        const oy = manager.offsetY || 0;
        const w = manager.width || 600;
        const h = manager.height || 520;
        const week = weekData(manager);
        const day = week[manager.weatherState.selectedDayOffset] || week[0];
        const active = activeFactorsForDay(day);
        const selectedActive = selectedFactors(manager).filter(f => f.test(day));

        p.push();
        p.textFont('system-ui');
        p.noStroke();
        p.fill(20);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(22);
        p.text('Day in Context', ox, oy + 8);
        p.fill(85);
        p.textSize(13);
        p.text('Click a day in the weekly lens, then use this view to see the real weather values behind the highlighted pattern.', ox, oy + 40, w - 20, 40);

        const leftW = Math.min(260, w * 0.42);
        const cardX = ox;
        const cardY = oy + 95;
        const cardH = 330;

        // illustrated day card
        p.fill(248);
        p.stroke(225);
        p.rect(cardX, cardY, leftW, cardH, 14);
        p.noStroke();
        p.fill(40, 75, 160);
        p.textSize(17);
        p.text(dow(day.date) + ', ' + fmtDate(day.date), cardX + 18, cardY + 18);
        p.fill(70);
        p.textSize(12);
        p.text(day.conditions || 'Selected weather day', cardX + 18, cardY + 44);
        drawCampusScene(p, cardX + 18, cardY + 76, leftW - 36, 180, day);

        p.fill(50);
        p.textSize(13);
        p.text('Selected layers active today:', cardX + 18, cardY + 275);
        let tagX = cardX + 18;
        selectedActive.forEach(function (f) {
            drawTag(p, tagX, cardY + 300, f.icon + ' ' + f.label, f.color);
            tagX += Math.min(105, 42 + f.label.length * 6);
        });
        if (selectedActive.length === 0) {
            p.fill(120);
            p.text('None of your selected layers are active on this day.', cardX + 18, cardY + 303);
        }

        const tableX = cardX + leftW + 28;
        const tableY = cardY;
        const tableW = w - leftW - 28;
        p.fill(255);
        p.stroke(225);
        p.rect(tableX, tableY, tableW, cardH, 14);
        p.noStroke();
        p.fill(35);
        p.textSize(16);
        p.text('Environmental conditions', tableX + 18, tableY + 18);

        const values = [
            ['rain', 'Rain amount', day.precip.toFixed(2) + ' in'],
            ['cloud', 'Cloud cover', Math.round(day.cloudcover) + '%'],
            ['daylight', 'Daylight duration', day.daylightHours.toFixed(1) + ' hrs'],
            ['solar', 'Solar energy', day.solarenergy.toFixed(1) + ' MJ/m²'],
            ['wind', 'Wind speed', Math.round(day.windspeed) + ' mph'],
            ['temp', 'Feels-like temperature', Math.round(day.feelslike) + '°F']
        ];

        values.forEach(function (row, i) {
            const f = FACTORS.find(ff => ff.key === row[0]);
            const yy = tableY + 60 + i * 39;
            p.stroke(238);
            p.line(tableX + 18, yy + 26, tableX + tableW - 18, yy + 26);
            p.noStroke();
            p.fill(f.color[0], f.color[1], f.color[2]);
            p.textSize(16);
            p.text(f.icon, tableX + 18, yy);
            p.fill(45);
            p.textSize(13);
            p.text(row[1], tableX + 48, yy + 2);
            p.textAlign(p.RIGHT, p.TOP);
            p.fill(35);
            p.text(row[2], tableX + tableW - 95, yy + 2);
            const isSelected = manager.weatherState.selected[row[0]];
            const isActive = f.test(day);
            p.textAlign(p.LEFT, p.TOP);
            if (isSelected && isActive) drawTinyStatus(p, tableX + tableW - 80, yy - 2, 'ACTIVE', f.color);
            else if (isSelected) drawTinyStatus(p, tableX + tableW - 80, yy - 2, 'selected', [150, 150, 150]);
            else drawTinyStatus(p, tableX + tableW - 80, yy - 2, '—', [190, 190, 190]);
        });

        // explanation box
        const explainY = tableY + cardH + 22;
        p.fill(250, 247, 238);
        p.stroke(225, 215, 190);
        p.rect(ox, explainY, w, 82, 12);
        p.noStroke();
        p.fill(45);
        p.textSize(15);
        p.text('Why this day may feel hard', ox + 18, explainY + 14);
        p.fill(75);
        p.textSize(13);
        p.text(makeExplanation(day, selectedActive), ox + 18, explainY + 38, w - 36, 40);

        // bottom mini week picker
        const pickerY = explainY + 110;
        p.fill(70);
        p.textSize(12);
        p.text('Choose another day from the same week:', ox, pickerY - 20);
        const weekW = Math.min(w, 420);
        const dayW = weekW / 7;
        week.forEach(function (d, i) {
            const x = ox + i * dayW;
            const count = selectedOverlapCount(d, manager);
            p.stroke(i === manager.weatherState.selectedDayOffset ? p.color(40, 75, 160) : p.color(220));
            p.strokeWeight(i === manager.weatherState.selectedDayOffset ? 2 : 1);
            p.fill(count > 0 ? p.color(45, 64, 110, Math.min(170, 50 + count * 40)) : p.color(255));
            p.rect(x, pickerY, dayW - 4, 42, 7);
            p.noStroke();
            p.fill(count > 1 ? 255 : 45);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);
            p.text(dow(d.date), x + dayW / 2 - 2, pickerY + 6);
            p.text(fmtDate(d.date), x + dayW / 2 - 2, pickerY + 22);
            addZone(manager, 'day', i, x, pickerY, dayW - 4, 42);
        });
        p.pop();
    }

    function drawTag(p, x, y, label, color) {
        const tw = Math.min(120, 34 + label.length * 6);
        p.fill(color[0], color[1], color[2], 35);
        p.stroke(color[0], color[1], color[2]);
        p.rect(x, y, tw, 24, 12);
        p.noStroke();
        p.fill(45);
        p.textSize(11);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(label, x + 10, y + 12);
    }

    function drawTinyStatus(p, x, y, label, color) {
        p.fill(color[0], color[1], color[2], 30);
        p.stroke(color[0], color[1], color[2]);
        p.rect(x, y, 64, 24, 7);
        p.noStroke();
        p.fill(60);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(label, x + 32, y + 12);
    }

    function drawCampusScene(p, x, y, w, h, d) {
        p.push();
        p.noStroke();
        p.fill(230, 235, 240);
        p.rect(x, y, w, h, 10);
        if (d.cloudcover >= 75) {
            p.fill(110, 120, 130, 80);
            for (let i = 0; i < 6; i++) p.ellipse(x + 35 + i * 38, y + 30 + (i % 2) * 10, 70, 28);
        }
        if (d.precip > 0.02 || d.precipprob >= 50) {
            p.stroke(67, 132, 210, 140);
            for (let i = 0; i < 35; i++) {
                const rx = x + 10 + (i * 23) % (w - 20);
                const ry = y + 10 + (i * 37) % (h - 40);
                p.line(rx, ry, rx - 5, ry + 14);
            }
        }
        p.noStroke();
        p.fill(85, 95, 105);
        p.rect(x + w * 0.42, y + h * 0.42, w * 0.20, h * 0.34);
        p.triangle(x + w * 0.42, y + h * 0.42, x + w * 0.52, y + h * 0.28, x + w * 0.62, y + h * 0.42);
        p.fill(60, 70, 80);
        p.rect(x + w * 0.18, y + h * 0.62, w * 0.45, 8);
        p.fill(45, 55, 65);
        p.ellipse(x + w * 0.26, y + h * 0.78, 18, 18);
        p.ellipse(x + w * 0.55, y + h * 0.78, 18, 18);
        p.fill(35, 60, 90);
        p.ellipse(x + w * 0.22, y + h * 0.65, 18, 18);
        p.rect(x + w * 0.205, y + h * 0.70, 18, 32, 8);
        if (d.windspeed >= 12) {
            p.stroke(68, 160, 156, 140);
            p.strokeWeight(2);
            p.line(x + w * 0.70, y + h * 0.58, x + w * 0.90, y + h * 0.55);
            p.line(x + w * 0.72, y + h * 0.66, x + w * 0.86, y + h * 0.63);
        }
        p.pop();
    }

    function makeExplanation(day, selectedActive) {
        const parts = [];
        if (selectedActive.some(f => f.key === 'rain')) parts.push('wet ground');
        if (selectedActive.some(f => f.key === 'cloud')) parts.push('gray sky');
        if (selectedActive.some(f => f.key === 'daylight')) parts.push('short daylight');
        if (selectedActive.some(f => f.key === 'solar')) parts.push('low solar energy');
        if (selectedActive.some(f => f.key === 'wind')) parts.push('wind');
        if (selectedActive.some(f => f.key === 'temp')) parts.push('uncomfortable temperature');
        if (parts.length === 0) {
            return 'This day does not strongly match the factors you selected. Try choosing another day or selecting different layers in the weekly lens.';
        }
        return 'This day may feel harder because it combines ' + joinEnglish(parts) + '. These conditions overlap and can make campus travel and outdoor time less comfortable.';
    }

    function joinEnglish(parts) {
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return parts[0] + ' and ' + parts[1];
        return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
    }

    window.WeatherWeekViz = {
        cleanRows: cleanRows,
        drawSketch4: drawSketch4,
        drawSketch5: drawSketch5
    };
})();
