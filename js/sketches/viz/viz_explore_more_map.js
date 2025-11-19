// notes:
// map:
// us-atlas dataset json files which contian vector boundaries for each state / county.
// each feature has an id to the FIPS code: 2 digit for states, 5 digit for counties.
// laod the json then convert to geojson for drawing. also use
// d3-geo albers to proejct a map of the us. d3-geo mercator to do each state and county.

(function () {
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

      const topoStatesUrl   = manager.topoStatesUrl   || 'data/states-10m.json';
      const topoCountiesUrl = manager.topoCountiesUrl || 'data/counties-10m.json';

      if (!manager._init) {
        manager._init = true;
        manager._scene = 'nation';
        manager._selectedStateFips = null;
        manager._mouseLatch = false;
        manager._escLatch = false;
      }

      
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
          ctx.fillStyle = '#e6eef7';
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = '#ffffffff';
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

        // click 
        if (p.mouseIsPressed && !manager._mouseLatch && hovered && manager._countiesGeo) {
          manager._selectedStateFips = String(hovered.id).padStart(2, '0');
          manager._scene = 'state';
          manager._mouseLatch = true;
        }
        if (!p.mouseIsPressed) manager._mouseLatch = false;

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
          ctx.beginPath(); pathState(f);
          ctx.fillStyle = '#e6eef7';
          ctx.fill();
          ctx.lineWidth = 0.6; ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
        ctx.restore();

        // ESC to go back 
        p.noStroke(); p.fill(90); p.textAlign(p.RIGHT, p.TOP); p.textSize(11);
        p.text('Press ESC to return', left + W - 10, top - 26);

        if (p.keyIsPressed && p.keyCode === 27 && !manager._escLatch) {
          manager._scene = 'nation';
          manager._selectedStateFips = null;
          manager._escLatch = true;
        }
        if (!p.keyIsPressed) manager._escLatch = false;

        p.pop();
        return;
      }

      p.pop();
    }
  };
})();