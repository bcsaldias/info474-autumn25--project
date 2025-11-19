// notes:
// map:
// us-atlas dataset json files which contian vector boundaries for each state / county.
// each feature has an id to the FIPS code: 2 digit for states, 5 digit for counties.
// laod the json then convert to geojson for drawing. also use
// d3-geo albers to proejct a map of the us. d3-geo mercator to do each state and county.
// data:
// From the Feeding America file (MMG2025_2019-2023_Data_To_Share.xlsx), 
// I created two smaller CSVs for the map. I filtered both the State and County sheets to Year = 2023 (latest), then selected and renamed just the fields the choropleth needs for each county: FIPS → zero-padded state_fips (2-digit) and county_fips (5-digit),
// parsed County, State to a clean county name, mapped Child Food Insecurity Rate to child_fi_rate, and # of Food Insecure Children as children_insecure for tooltips. 
// I saved these as /data/state_child_fi_2023.csv and /data/county_child_fi_2023.csv, which join directly to the us-atlas TopoJSON by FIPS for the map of state and counties for the us.

// Then bascially join the data to shpaes using the fips code, basically map these
// read the id, look up the rate, pick a colorfrom the blue pallete, and fill based on that percent.

// For interacction, use mouse position to show tooltip, clicking a sate filters the county
// for that state which probbaly needs a redraw.
(function () {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function toPct(x) { if (x==null || x==='') return null; let v=Number(x); if(!isFinite(v)) return null; if(v<=1) v*=100; return v; }
  function fmtPct(x){ if(x==null) return ''; return x<10 ? (x.toFixed(1)+'%') : (Math.round(x)+'%'); }
  // for counts
  function fmtInt(n){
    if (n==null || n==='') return '';
    const v = Number(String(n).replace(/[^0-9.-]/g,''));
    if (!isFinite(v)) return '';
    return v.toLocaleString('en-US');
  }
  function defaultPalette(){ return ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c']; }
  function colorFor(rate, thresholds, palette){
    if(rate==null) return '#e6eef7'; 
    for(let i=thresholds.length-1;i>=0;i--){ if(rate>=thresholds[i]) return palette[Math.min(i+1, palette.length-1)]; }
    return palette[0];
  }
  function drawLegend(p, x, y, thresholds, palette){
    const boxW=22, boxH=10, gap=4;
    for(let i=0;i<palette.length;i++){ p.noStroke(); p.fill(palette[i]); p.rect(x+i*(boxW+2), y, boxW, boxH, 2); }
    p.fill(40); p.textAlign(p.LEFT, p.TOP);
    const labels=['low'].concat(thresholds.map(t=>t+'%')).concat(['high']);
    p.text(labels.join('  '), x, y+boxH+gap);
  }
  function drawTooltip(p, txt, x, y, left, top, W, H){
    p.textSize(12);
    const pad=6, th=18, tw=p.textWidth(txt)+pad*2;
    let tx=x+12, ty=y-10; tx=clamp(tx, left+2, left+W-tw-2); ty=clamp(ty, top+2, top+H-th-2);
    p.noStroke(); p.fill(20,20,20,220); p.rect(tx, ty, tw, th, 3);
    p.fill(255); p.textAlign(p.LEFT, p.CENTER); p.text(txt, tx+pad, ty+th/2);
  }

  // hit test
  function hitFeatureAtMouse(p, features, projection, left, top) {
    if (!features || !features.length) return null;
    const m = [p.mouseX - left, p.mouseY - top];
    const lonlat = projection.invert(m);
    if (!lonlat) return null;
    for (let i = 0; i < features.length; i++) {
      if (d3.geoContains(features[i], lonlat)) return features[i];
    }
    return null;
  }

  window.VizExploreMoreMap = {
    draw: function (p, manager) {
      p.push();

      const left = manager.offsetX || 10;
      const top  = manager.offsetY || 40;
      const W    = Math.max(320, manager.width  || (p.width  - left - 10));
      const H    = Math.max(260, manager.height || (p.height - top  - 10));

      const topoStatesUrl   = manager.topoStatesUrl   || 'data/us-states-10m.json';
      const topoCountiesUrl = manager.topoCountiesUrl || 'data/us-counties-10m.json';

      // choropleth config 
      const stateDataUrl  = manager.stateDataUrl  || 'data/state_child_fi_2023.csv';
      const countyDataUrl = manager.countyDataUrl || 'data/county_child_fi_2023.csv';
      const thresholds   = manager.mapThresholds || [8,12,16,20,24,28];
      const palette      = manager.palette || defaultPalette();

      if (!manager._init) {
        manager._init = true;
        manager._scene = 'nation';
        manager._selectedStateFips = null;
        manager._mouseLatch = false;
        manager._escLatch = false;
      }

      // topojson
      if (!manager._statesTopo && !manager._statesTopoLoading && !manager._statesTopoError) {
        manager._statesTopoLoading = true;
        p.loadJSON(
          topoStatesUrl,
          (json) => { manager._statesTopo = json; manager._statesTopoLoading = false; },
          () => { manager._statesTopoError = true; manager._statesTopoLoading = false; }
        );
      }

      if (manager._statesTopo && !manager._countiesTopo && !manager._countiesTopoLoading && !manager._countiesTopoError) {
        manager._countiesTopoLoading = true;
        p.loadJSON(
          topoCountiesUrl,
          (json) => { manager._countiesTopo = json; manager._countiesTopoLoading = false; },
          () => { manager._countiesTopoError = true; manager._countiesTopoLoading = false; }
        );
      }

      // load state CSV for nation-level coloring
      if (manager._statesTopo && !manager._stateTable && !manager._stateTableLoading && !manager._stateTableError) {
        manager._stateTableLoading = true;
        p.loadTable(
          stateDataUrl, 'csv', 'header',
          (t)=>{ manager._stateTable=t; manager._stateTableLoading=false; },
          ()=>{ manager._stateTableError=true; manager._stateTableLoading=false; }
        );
      }

      // load county CSV for state-level coloring
      if (manager._statesTopo && !manager._countyTable && !manager._countyTableLoading && !manager._countyTableError) {
        manager._countyTableLoading = true;
        p.loadTable(
          countyDataUrl, 'csv', 'header',
          (t)=>{ manager._countyTable=t; manager._countyTableLoading=false; },
          ()=>{ manager._countyTableError=true; manager._countyTableLoading=false; }
        );
      }

      // loading UI
      if (!manager._statesTopo) {
        p.noStroke(); p.fill(80); p.textAlign(p.LEFT, p.TOP); p.textSize(14);
        p.text('Loading U.S. map…', left, top - 24);
        p.pop(); return;
      }

      // topogeo
      if (!manager._statesGeo) {
        manager._statesGeo = topojson.feature(manager._statesTopo, manager._statesTopo.objects.states);
        if (manager._statesTopo.objects.nation) {
          manager._nationGeo = topojson.feature(manager._statesTopo, manager._statesTopo.objects.nation);
        }
      }
      if (manager._countiesTopo && !manager._countiesGeo) {
        manager._countiesGeo = topojson.feature(manager._countiesTopo, manager._countiesTopo.objects.counties);
      }

      // build state lookups once CSV is ready 
      if (manager._stateTable && !manager._stateRates) {
        const cols = manager._stateTable.columns || [];
        const fCol = cols.includes('state_fips') ? 'state_fips' : (cols.includes('FIPS') ? 'FIPS' : cols[0]);
        const rCol = cols.includes('child_fi_rate') ? 'child_fi_rate' : (cols.includes('fi_rate') ? 'fi_rate' : cols[1]);
        const nCol = cols.includes('state') ? 'state' : (cols.includes('State Name') ? 'State Name' : null);
        const kCol = cols.includes('children_insecure') ? 'children_insecure' :
                     (cols.includes('children') ? 'children' : null);

        manager._stateRates = new Map();
        manager._stateNames = new Map();
        if (kCol) manager._stateChildren = new Map();

        for (let r=0; r<manager._stateTable.getRowCount(); r++) {
          const fips = String(manager._stateTable.getString(r, fCol)).padStart(2,'0');
          const rate = toPct(manager._stateTable.getString(r, rCol));
          const name = nCol ? manager._stateTable.getString(r, nCol) : '';
          if (isFinite(rate)) manager._stateRates.set(fips, rate);
          if (name) manager._stateNames.set(fips, name);

          if (kCol) {
            const kids = Number(manager._stateTable.getString(r, kCol));
            if (isFinite(kids)) manager._stateChildren.set(fips, kids);
          }
        }
      }

      // build county lookups once CSV is ready 
      if (manager._countyTable && !manager._countyRate) {
        const ccols = manager._countyTable.columns || [];
        const cfCol = ccols.includes('county_fips') ? 'county_fips' : (ccols.includes('FIPS') ? 'FIPS' : ccols[0]);
        const csCol = ccols.includes('state_fips') ? 'state_fips' : null;
        const crCol = ccols.includes('child_fi_rate') ? 'child_fi_rate' : (ccols.includes('fi_rate') ? 'fi_rate' : ccols[1]);
        const cnCol = ccols.includes('county') ? 'county' : (ccols.includes('County') ? 'County' : null);
        const ckCol = ccols.includes('children_insecure') ? 'children_insecure' :
                      (ccols.includes('children') ? 'children' : null);

        manager._countyRate = new Map();
        manager._countyName = new Map();
        manager._countiesByState = new Map();
        if (ckCol) manager._countyChildren = new Map();

        for (let r=0; r<manager._countyTable.getRowCount(); r++) {
          const cf = String(manager._countyTable.getString(r, cfCol)).padStart(5,'0');
          const sf = csCol ? String(manager._countyTable.getString(r, csCol)).padStart(2,'0') : cf.slice(0,2);
          const nm = cnCol ? manager._countyTable.getString(r, cnCol) : '';
          const rt = toPct(manager._countyTable.getString(r, crCol));

          if (isFinite(rt)) manager._countyRate.set(cf, rt);
          if (nm) manager._countyName.set(cf, nm);
          if (!manager._countiesByState.has(sf)) manager._countiesByState.set(sf, []);
          manager._countiesByState.get(sf).push({ county_fips: cf, name: nm, rate: rt });

          if (ckCol) {
            const kids = Number(manager._countyTable.getString(r, ckCol));
            if (isFinite(kids)) manager._countyChildren.set(cf, kids);
          }
        }
      }

      const ctx = p.drawingContext;

      // us nation
      if (manager._scene === 'nation') {
        const proj = d3.geoAlbersUsa().fitSize([W, H], manager._statesGeo);
        const path = d3.geoPath(proj, ctx);

        // nation
        if (manager._nationGeo) {
          ctx.save(); ctx.translate(left, top);
          ctx.beginPath(); path(manager._nationGeo);
          ctx.fillStyle = '#f9fafb';
          ctx.fill();
          ctx.restore();
        }

        // states
        ctx.save(); ctx.translate(left, top);
        for (const f of manager._statesGeo.features) {
          ctx.beginPath();
          path(f);
          // color by rate if data loaded
          const fips = String(f.id).padStart(2,'0');
          const rate = manager._stateRates ? manager._stateRates.get(fips) : null;
          ctx.fillStyle = colorFor(rate, thresholds, palette);
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
        ctx.restore();

        // hover outline 
        const hovered = hitFeatureAtMouse(p, manager._statesGeo.features, proj, left, top);
        if (hovered) {
          ctx.save(); ctx.translate(left, top);
          ctx.beginPath(); path(hovered);
          ctx.lineWidth = 1.2; ctx.strokeStyle = '#333';
          ctx.stroke();
          ctx.restore();
        }

        // tooltip with name + rate (+ counts if available)
        if (hovered && manager._stateRates) {
          const fips = String(hovered.id).padStart(2,'0');
          const rate = manager._stateRates.get(fips);
          const name = (manager._stateNames && manager._stateNames.get(fips)) ||
                       (hovered.properties && hovered.properties.name) || 'State';
          let label = name + (rate!=null ? (' — ' + fmtPct(rate)) : '');
          const kids = (manager._stateChildren && manager._stateChildren.get(fips));
          if (kids != null) label += ' (' + fmtInt(kids) + ' children)';
          const c = proj(d3.geoCentroid(hovered));
          if (c) drawTooltip(p, label, left + c[0], top + c[1], left, top, W, H);
        }

        // click 
        if (p.mouseIsPressed && !manager._mouseLatch && hovered && manager._countiesGeo) {
          manager._selectedStateFips = String(hovered.id).padStart(2, '0');
          manager._scene = 'state';
          manager._mouseLatch = true;
        }
        if (!p.mouseIsPressed) manager._mouseLatch = false;

        // legend
        if (manager._stateRates) drawLegend(p, left + 10, top + H - 36, thresholds, palette);

        p.pop();
        return;
      }

      // states
      if (manager._scene === 'state') {
        const sf = manager._selectedStateFips;
        if (!sf || !manager._countiesGeo) {
          manager._scene = 'nation';
          p.pop(); return;
        }

        if (!manager._stateCountyKey || manager._stateCountyKey !== sf) {
          const need = new Set();
          for (const f of manager._countiesGeo.features) {
            const cf = String(f.id).padStart(5, '0');
            if (cf.slice(0, 2) === sf) need.add(cf);
          }
          manager._stateCountyFeatures = manager._countiesGeo.features.filter(f =>
            need.has(String(f.id).padStart(5, '0'))
          );
          manager._stateCountyKey = sf;
        }

        const fc = { type: 'FeatureCollection', features: manager._stateCountyFeatures };
        const projState = d3.geoMercator().fitSize([W, H], fc);
        const pathState = d3.geoPath(projState, ctx);

        // draw counties 
        ctx.save(); ctx.translate(left, top);
        for (const f of manager._stateCountyFeatures) {
          const cf = String(f.id).padStart(5,'0');
          const rt = manager._countyRate ? manager._countyRate.get(cf) : null;
          ctx.beginPath(); pathState(f);
          ctx.fillStyle = colorFor(rt, thresholds, palette);
          ctx.fill();
          ctx.lineWidth = 0.6; ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
        ctx.restore();

        // title for the state
        const stateName = (manager._stateNames && manager._stateNames.get(sf)) || 'Selected State';
        p.noStroke(); p.fill(30); p.textAlign(p.CENTER, p.TOP); p.textSize(18);
        p.text(stateName, left + W/2, top - 28);

        // county tooltip 
        const hoveredC = hitFeatureAtMouse(p, manager._stateCountyFeatures, projState, left, top);
        if (hoveredC && manager._countyRate) {
          const cf = String(hoveredC.id).padStart(5,'0');
          const nm = (manager._countyName && manager._countyName.get(cf)) ||
                     (hoveredC.properties && hoveredC.properties.name) || 'County';
          const rt = manager._countyRate.get(cf);
          let label = nm + (rt!=null ? (' — ' + fmtPct(rt)) : '');
          const kids = (manager._countyChildren && manager._countyChildren.get(cf));
          if (kids != null) label += ' (' + fmtInt(kids) + ' children)';
          const c = projState(d3.geoCentroid(hoveredC));
          if (c) drawTooltip(p, label, left + c[0], top + c[1], left, top, W, H);

          // hover outline for county
          ctx.save(); ctx.translate(left, top);
          ctx.beginPath(); pathState(hoveredC);
          ctx.lineWidth = 1.2; ctx.strokeStyle = '#333';
          ctx.stroke();
          ctx.restore();
        }

        // ESC to go back 
        p.noStroke(); p.fill(90); p.textAlign(p.RIGHT, p.TOP); p.textSize(11);
        p.text('Press ESC to return', left + W - 10, top - 26);

        if (p.keyIsPressed && p.keyCode === 27 && !manager._escLatch) {
          manager._scene = 'nation';
          manager._selectedStateFips = null;
          manager._escLatch = true;
        }
        if (!p.keyIsPressed) manager._escLatch = false;

        // legend 
        if (manager._countyRate) drawLegend(p, left + 10, top + H - 36, thresholds, palette);

        p.pop();
        return;
      }

      p.pop();
    }
  };
})();