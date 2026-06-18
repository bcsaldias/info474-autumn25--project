(function () {
  let fromIdx = 0, toIdx = 0, animT = 1.0, sliderPx = 0;

  const YEARS = [2006, 2011, 2016, 2021, 2026];
  const ITEMS = ['Bananas', 'Beef', 'Bread', 'Chicken', 'Eggs', 'Milk', 'Oranges', 'Tomatoes'];
  const UNITS = { Bananas: 'lb', Beef: 'lb', Bread: 'lb', Chicken: 'lb', Eggs: 'doz', Milk: 'gal', Oranges: 'lb', Tomatoes: 'lb' };
  const RAW = {
    2006: { Bananas: { p: .535, q: 3 }, Beef: { p: 2.723, q: .5 }, Bread: { p: 1.173, q: 2 }, Chicken: { p: 1.124, q: 3 }, Eggs: { p: 1.381, q: 2 }, Milk: { p: 3.261, q: 1 }, Oranges: { p: 1.108, q: 1.5 }, Tomatoes: { p: 1.792, q: 2 } },
    2011: { Bananas: { p: .630, q: 2 }, Beef: { p: 3.287, q: 0 }, Bread: { p: 1.491, q: 2 }, Chicken: { p: 1.332, q: 3 }, Eggs: { p: 1.825, q: 2 }, Milk: { p: 3.685, q: 1 }, Oranges: { p: 1.130, q: .5 }, Tomatoes: { p: 1.720, q: 2 } },
    2016: { Bananas: { p: .590, q: 2 }, Beef: { p: 3.961, q: 0 }, Bread: { p: 1.413, q: 2 }, Chicken: { p: 1.508, q: 3 }, Eggs: { p: 1.735, q: 2 }, Milk: { p: 3.301, q: 1 }, Oranges: { p: 1.284, q: .5 }, Tomatoes: { p: 1.983, q: 2 } },
    2021: { Bananas: { p: .642, q: 2 }, Beef: { p: 4.875, q: 0 }, Bread: { p: 1.629, q: 2 }, Chicken: { p: 1.632, q: 2 }, Eggs: { p: 1.790, q: 2 }, Milk: { p: 3.790, q: 1 }, Oranges: { p: 1.092, q: 0 }, Tomatoes: { p: 1.977, q: 2 } },
    2026: { Bananas: { p: .690, q: 0 }, Beef: { p: 7.119, q: 0 }, Bread: { p: 1.943, q: 2 }, Chicken: { p: 2.149, q: 1 }, Eggs: { p: 2.553, q: 2 }, Milk: { p: 4.306, q: 1 }, Oranges: { p: 1.591, q: 0 }, Tomatoes: { p: 2.274, q: 2 } },
  };
  const IC = {
    Bananas: [240, 200, 38], Beef: [168, 62, 52], Bread: [192, 140, 80], Chicken: [215, 172, 110],
    Eggs: [245, 238, 222], Milk: [208, 230, 248], Oranges: [228, 118, 40], Tomatoes: [202, 60, 50],
  };

  const W = 920, H = 580;
  const SL = { x1: 80, x2: 840, y: 72 };
  const BK = { cx: 210, cy: 558, bw: 344, bh: 302 };
  const RC = { rx: 440, ry: 98, rw: 462, rh: 463 };
  const FONT = "'Inter', sans-serif";

  function xForIdx(i) { return SL.x1 + (SL.x2 - SL.x1) * i / (YEARS.length - 1); }
  function idxForX(x, p) { return Math.round(p.constrain((x - SL.x1) / (SL.x2 - SL.x1) * (YEARS.length - 1), 0, YEARS.length - 1)); }

  function interp(p) {
    let out = {}, t = p.constrain(animT, 0, 1);
    for (let k of ITEMS) {
      let a = RAW[YEARS[fromIdx]][k], b = RAW[YEARS[toIdx]][k];
      out[k] = {
        price: p.lerp(a.p, b.p, t),
        qty: RAW[YEARS[toIdx]][k].q,  // snap to target year — no interpolation
      };
    }
    return out;
  }

  window.GroceryBasket = {
    draw: function (p, manager, ai, progress) {
      animT = Math.min(1.0, animT + 0.04);
      sliderPx += (xForIdx(toIdx) - sliderPx) * 0.12;
      let cd = interp(p);
      let yr = YEARS[toIdx];

      // Scale the fixed W×H coordinate space to fit the actual canvas
      let cw = manager.canvasWidth || W;
      let ch = manager.canvasHeight || H;
      let sc = Math.min(cw / W, ch / H);
      let tx = (cw - W * sc) / 2;
      let ty = (ch - H * sc) / 2;

      // Transform mouse coordinates into the viz's local space
      let mx = (p.mouseX - tx) / sc;
      let my = (p.mouseY - ty) / sc;

      p.push();
      p.translate(tx, ty);
      p.scale(sc);

      _header(p, yr);
      _slider(p);
      _basket(p, cd);
      _recipe(p, cd, yr);

      if (p.mouseIsPressed && p.abs(my - SL.y) < 24 && mx >= SL.x1 - 30 && mx <= SL.x2 + 30) {
        let ni = idxForX(p.constrain(mx, SL.x1, SL.x2), p);
        if (ni !== toIdx) { fromIdx = toIdx; toIdx = ni; animT = 0; }
      }

      p.pop();
    }
  };

  function _header(p, yr) {
    p.noStroke(); p.fill('#3d2b1f'); p.rect(0, 0, W, 50);
    p.fill('#f5ede0'); p.textFont(FONT); p.textStyle(p.BOLD);
    p.textSize(20); p.textAlign(p.LEFT, p.CENTER); p.text('Washington Grocery Basket', 25, 17);
    p.fill('#c4a882'); p.textStyle(p.NORMAL); p.textSize(11);
    p.text('Inflation impact: what $20 buys in ' + yr, 25, 36);
    p.fill('#e07b39'); p.noStroke(); p.rect(W - 90, 10, 74, 30, 15);
    p.fill('#fff'); p.textStyle(p.BOLD); p.textSize(17);
    p.textAlign(p.CENTER, p.CENTER); p.text('$20', W - 53, 25);
  }

  function _slider(p) {
    let y = SL.y;
    p.stroke('#d4bc96'); p.strokeWeight(4); p.line(SL.x1, y, SL.x2, y);
    p.stroke('#2DA3EE'); p.strokeWeight(4); p.line(SL.x1, y, sliderPx, y);
    for (let i = 0; i < YEARS.length; i++) {
      let tx = xForIdx(i), active = (i === toIdx);
      p.strokeWeight(active ? 2.5 : 1.5);
      p.stroke(active ? '#2DA3EE' : '#a0805a');
      p.line(tx, y - 8, tx, y + 8);
      p.noStroke();
      p.fill(active ? '#2DA3EE' : '#7b5c3e');
      p.textFont(FONT); p.textStyle(active ? p.BOLD : p.NORMAL);
      // y - 6 keeps year labels below the header bar (which ends at y=50)
      p.textSize(active ? 13 : 11); p.textAlign(p.CENTER, p.BOTTOM);
      p.text(YEARS[i], tx, y - 6);
    }
    p.noStroke(); p.fill(0, 0, 0, 28); p.ellipse(sliderPx + 2, y + 2, 24, 24);
    p.fill('#2DA3EE'); p.ellipse(sliderPx, y, 24, 24);
    p.fill('#fff'); p.ellipse(sliderPx, y, 10, 10);
  }

  function _basket(p, cd) {
    let { cx, cy, bw, bh } = BK, btop = cy - bh;
    p.noStroke(); p.fill('#3d2b1f');
    p.textFont(FONT); p.textStyle(p.BOLD);
    p.textSize(14); p.textAlign(p.CENTER, p.TOP); p.text('The Basket', cx, 100);
    p.fill('#7b5c3e'); p.textStyle(p.NORMAL); p.textSize(9);
    p.text('drag slider to see prices rise', cx, 117);

    p.noStroke(); p.fill(0, 0, 0, 16);
    p.beginShape();
    p.vertex(cx - bw / 2 + 26 + 5, btop); p.vertex(cx + bw / 2 - 26 + 5, btop);
    p.vertex(cx + bw / 2 + 5, cy); p.vertex(cx - bw / 2 + 5, cy);
    p.endShape(p.CLOSE);

    p.fill('#c49050'); p.stroke('#7a4e20'); p.strokeWeight(2);
    p.beginShape();
    p.vertex(cx - bw / 2 + 26, btop); p.vertex(cx + bw / 2 - 26, btop);
    p.vertex(cx + bw / 2, cy); p.vertex(cx - bw / 2, cy);
    p.endShape(p.CLOSE);

    p.stroke('#a07230'); p.strokeWeight(1.5);
    for (let b = 1; b <= 6; b++) {
      let fy = btop + b * (bh / 7), prog = (fy - btop) / bh, lw = (bw - 52) + 52 * prog;
      p.line(cx - lw / 2, fy, cx + lw / 2, fy);
    }
    p.strokeWeight(1);
    for (let d = -6; d <= 6; d++) {
      p.stroke(130, 82, 28, 95);
      p.line(cx + d * 46 - 14, btop, cx + d * 46 + 18, cy);
    }

    p.stroke('#7a4e20'); p.strokeWeight(5); p.noFill();
    p.line(cx - bw / 2 + 26, btop, cx + bw / 2 - 26, btop);

    p.noFill(); p.stroke('#8a5e2a'); p.strokeWeight(6);
    p.arc(cx, btop, 118, 96, p.PI, p.TWO_PI, p.OPEN);
    p.stroke('#d4a050'); p.strokeWeight(2);
    p.arc(cx, btop - 4, 104, 82, p.PI + .28, p.TWO_PI - .28, p.OPEN);

    const POS = [
      [cx - 116, btop + 82], [cx - 38, btop + 76], [cx + 42, btop + 80], [cx + 117, btop + 78],
      [cx - 116, btop + 192], [cx - 38, btop + 196], [cx + 42, btop + 189], [cx + 117, btop + 194],
    ];
    for (let i = 0; i < ITEMS.length; i++) _icon(p, ITEMS[i], POS[i][0], POS[i][1], 22, cd[ITEMS[i]].qty);
  }

  function _icon(p, name, x, y, s, qty) {
    let c = IC[name], gone = qty < .05;
    // higher alpha for "gone" items so basket weave doesn't bleed through the icon
    let al = gone ? 90 : qty < .6 ? p.map(qty, .05, .6, 110, 222) : 222;
    p.push(); p.translate(x, y);
    switch (name) {
      case 'Bananas':
        p.strokeWeight(4.5); p.stroke(c[0], c[1], c[2], al); p.noFill();
        p.arc(0, s * .18, s * 2.3, s * 2.0, p.PI * 1.18, p.PI * 2.05, p.OPEN);
        p.noStroke(); p.fill(c[0] - 18, c[1] - 14, 8, al);
        p.ellipse(-s * .64, -s * .45, 7, 7); p.ellipse(s * .66, -s * .33, 6, 6);
        break;
      case 'Beef':
        p.noStroke(); p.fill(c[0], c[1], c[2], al); p.ellipse(0, 0, s * 2.4, s * 1.75);
        p.fill(232, 210, 205, al * .78); p.ellipse(-s * .28, -s * .22, s * .72, s * .38); p.ellipse(s * .42, s * .18, s * .46, s * .28);
        p.stroke(c[0] - 25, c[1] - 12, c[2] - 10, al * .42); p.strokeWeight(1.5); p.noFill();
        p.arc(-s * .1, s * .1, s * 1.6, s * 1.3, -.28, .62);
        break;
      case 'Bread':
        p.noStroke(); p.fill(c[0], c[1], c[2], al);
        p.rect(-s, -s * .52, s * 2, s * 1.22, 8); p.ellipse(0, -s * .52, s * 2, s * .84);
        p.fill(c[0] + 26, c[1] + 18, c[2] - 4, al * .48); p.ellipse(0, -s * .66, s * 1.3, s * .52);
        p.stroke(c[0] - 46, c[1] - 36, c[2] - 26, al); p.strokeWeight(1.5); p.noFill();
        for (let k = -1; k <= 1; k++) p.line(k * s * .42, -s * .1, k * s * .42, s * .54);
        break;
      case 'Chicken':
        p.noStroke(); p.fill(c[0], c[1], c[2], al);
        p.ellipse(0, s * .22, s * 2.06, s * 1.76); p.ellipse(s * .56, -s * .63, s * 1.02, s * 1.02);
        p.fill(215, 165, 52, al); p.triangle(s * .97, -s * .75, s * 1.38, -s * .64, s * .97, -s * .53);
        p.fill(35, 25, 15, al); p.ellipse(s * .68, -s * .72, 6, 6);
        p.fill(255, 255, 255, al * .8); p.ellipse(s * .7, -s * .74, 2.5, 2.5);
        p.fill(192, 56, 48, al); p.ellipse(s * .44, -s * 1.04, 10, 15);
        break;
      case 'Eggs':
        p.noStroke();
        for (let k = -1; k <= 1; k += 2) {
          p.fill(c[0], c[1], c[2], al); p.stroke(195, 182, 160, al * .4); p.strokeWeight(1);
          p.ellipse(k * s * .58, s * .08, s * 1.06, s * 1.38);
        }
        break;
      case 'Milk':
        p.noStroke();
        p.fill(c[0], c[1], c[2], al); p.rect(-s * .73, -s * .78, s * 1.46, s * 1.62, 4);
        p.fill(78, 138, 200, al); p.rect(-s * .73, -s * .08, s * 1.46, s * .74);
        p.fill(228, 238, 250, al); p.triangle(-s * .55, -s * .78, 0, -s * 1.48, s * .55, -s * .78);
        p.fill(255, 255, 255, al); p.textFont(FONT); p.textSize(7); p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER); p.text('MILK', 0, s * .3);
        break;
      case 'Oranges':
        p.noStroke(); p.fill(c[0], c[1], c[2], al); p.ellipse(0, 0, s * 2.15, s * 2.15);
        p.stroke(c[0] - 26, c[1] - 34, c[2] - 46, al * .32); p.strokeWeight(1); p.noFill();
        for (let r of [.45, .75, 1.0]) p.arc(0, 0, s * r * 2, s * r * 2, 0, p.PI);
        p.noStroke(); p.fill(68, 125, 55, al);
        p.ellipse(0, -s * 1.02, 6, 9); p.ellipse(-5, -s * .98, 8, 6);
        break;
      case 'Tomatoes':
        p.noStroke(); p.fill(c[0], c[1], c[2], al); p.ellipse(0, s * .1, s * 2.12, s * 2.02);
        p.fill(255, 200, 192, al * .36); p.ellipse(-s * .28, -s * .5, s * .62, s * .42);
        p.fill(62, 132, 62, al);
        for (let k = -2; k <= 2; k++) p.ellipse(k * s * .35, -s * .84, s * .36, s * .62);
        p.ellipse(0, -s * .74, s * .56, s * .36);
        break;
    }
    p.pop();

    p.noStroke();
    if (!gone) {
      p.fill('#3d2b1f'); p.textFont(FONT); p.textStyle(p.NORMAL);
      p.textSize(9); p.textAlign(p.CENTER, p.CENTER);
      let qs = qty < 1 ? qty.toFixed(1) : (qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(1));
      p.text(qs + ' ' + UNITS[name], x, y + s + 12);
    } else {
      p.stroke('#c04a3c'); p.strokeWeight(2.5);
      p.line(x - 8, y - 8, x + 8, y + 8); p.line(x + 8, y - 8, x - 8, y + 8);
      p.noStroke(); p.fill('#c04a3c');
      p.textFont(FONT); p.textStyle(p.NORMAL);
      p.textSize(8); p.textAlign(p.CENTER, p.CENTER);
      p.text('too costly', x, y + s + 12);
    }
  }

  function _recipe(p, cd, yr) {
    let { rx, ry, rw, rh } = RC;

    p.noStroke(); p.fill(0, 0, 0, 20); p.rect(rx + 5, ry + 5, rw, rh, 10);
    p.fill('#f2e6ce'); p.stroke('#d0aa80'); p.strokeWeight(1.5); p.rect(rx, ry, rw, rh, 8);
    p.noFill(); p.stroke('#c8a472'); p.strokeWeight(.5); p.rect(rx + 7, ry + 7, rw - 14, rh - 14, 6);

    p.fill('#4a7c59'); p.noStroke(); p.rect(rx, ry, rw, 52, 8, 8, 0, 0);
    p.fill('#fff'); p.textFont(FONT); p.textStyle(p.BOLD);
    p.textSize(16); p.textAlign(p.LEFT, p.CENTER); p.text('Market Receipt', rx + 16, ry + 18);
    p.fill('#b8dfc4'); p.textStyle(p.NORMAL); p.textSize(10);
    p.text('Spending $20 on groceries in Seattle — ' + yr, rx + 16, ry + 37);

    let c1 = rx + 17, c2 = rx + 248, c3 = rx + 320, c4 = rx + rw - 15, hY = ry + 68;
    p.noStroke(); p.fill('#7b5c3e'); p.textFont(FONT); p.textStyle(p.NORMAL);
    p.textSize(9);
    p.textAlign(p.LEFT, p.CENTER); p.text('ITEM', c1 + 12, hY);
    p.textAlign(p.CENTER, p.CENTER); p.text('$/UNIT', c2, hY); p.text('QTY', c3, hY);
    p.textAlign(p.RIGHT, p.CENTER); p.text('COST', c4, hY);
    p.stroke('#c8a472'); p.strokeWeight(.8); p.line(rx + 12, hY + 11, rx + rw - 12, hY + 11);

    let rowH = 35, total = 0;
    for (let i = 0; i < ITEMS.length; i++) {
      let it = ITEMS[i], d = cd[it], cost = d.price * d.qty, rowY = ry + 82 + i * rowH, gone = d.qty < .05;
      total += cost;
      if (i % 2 === 0) { p.noStroke(); p.fill(218, 198, 168, 52); p.rect(rx + 10, rowY - 12, rw - 20, rowH, 3); }

      let cl = IC[it]; p.noStroke(); p.fill(cl[0], cl[1], cl[2], gone ? 68 : 228); p.rect(c1, rowY - 5, 9, 10, 2);

      let lbl = it + ' (' + UNITS[it] + ')';
      p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(12.5);
      p.textAlign(p.LEFT, p.CENTER);
      if (gone) {
        p.fill('#b09878'); p.text(lbl, c1 + 14, rowY);
        p.stroke(175, 78, 68, 172); p.strokeWeight(1);
        p.line(c1 + 14, rowY, c1 + 14 + p.textWidth(lbl), rowY); p.noStroke();
      } else {
        p.fill('#3d2b1f'); p.text(lbl, c1 + 14, rowY);
      }

      p.textSize(12); p.textAlign(p.CENTER, p.CENTER);
      p.fill(gone ? '#b09878' : '#5a3e28');
      p.text('$' + d.price.toFixed(2), c2, rowY);

      let qs = gone ? '0' : (d.qty < 1 ? d.qty.toFixed(1) : (d.qty % 1 === 0 ? d.qty.toFixed(0) : d.qty.toFixed(1)));
      p.text(qs, c3, rowY);

      p.textAlign(p.RIGHT, p.CENTER);
      if (!gone) { p.fill('#4a7c59'); p.text('$' + cost.toFixed(2), c4, rowY); }
      else { p.fill('#b09878'); p.text('—', c4, rowY); }
    }

    let tY = ry + rh - 76;
    p.stroke('#c8a472'); p.strokeWeight(1.5); p.line(rx + 12, tY, rx + rw - 12, tY);
    p.strokeWeight(.5); p.line(rx + 12, tY + 4, rx + rw - 12, tY + 4);

    p.noStroke(); p.fill('#3d2b1f');
    p.textFont(FONT); p.textStyle(p.BOLD);
    p.textSize(14); p.textAlign(p.LEFT, p.CENTER); p.text('TOTAL', c1, tY + 22);
    p.textSize(16); p.textAlign(p.RIGHT, p.CENTER);
    p.fill(total > 20.4 ? '#c04a3c' : '#4a7c59'); p.text('$' + total.toFixed(2), c4, tY + 22);

    let bY = tY + 38, bW = rw - 24;
    p.noStroke(); p.fill('#ddd0bc'); p.rect(rx + 12, bY, bW, 12, 6);
    p.fill(total > 20.4 ? '#c04a3c' : '#4a7c59'); p.rect(rx + 12, bY, bW * Math.min(1, total / 20), 12, 6);
    p.fill('#7b5c3e'); p.textFont(FONT); p.textStyle(p.NORMAL);
    p.textSize(8.5); p.textAlign(p.RIGHT, p.BOTTOM); p.text('$20.00 budget', rx + rw - 12, bY);

    let dropped = ITEMS.filter(it => cd[it].qty < .05);
    if (dropped.length > 0) {
      p.noStroke(); p.fill('#c04a3c');
      p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(9);
      p.textAlign(p.LEFT, p.TOP);
      p.text('Can no longer afford: ' + dropped.join(', '), rx + 12, tY + 54);
    }

    if (toIdx > 0) {
      let base = ITEMS.reduce((s, it) => s + RAW[2006][it].p * RAW[2006][it].q, 0);
      let now = ITEMS.reduce((s, it) => s + cd[it].price * RAW[2006][it].q, 0);
      let pct = ((now - base) / base * 100).toFixed(0);
      p.noStroke(); p.fill('#a07040');
      p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(9);
      // placed in the gap between last item row and the total separator — above the border lines
      p.textAlign(p.RIGHT, p.TOP);
      p.text('Prices +' + pct + '% vs 2006 for same items', rx + rw - 12, ry + 82 + ITEMS.length * rowH + 6);
    }
  }
})();
