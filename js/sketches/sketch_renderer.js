// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            // show heatmap for the tariffs-focused section (data-active-index="3")
            if (ai === 3) {
                if (window.VizHeatmap && typeof window.VizHeatmap.draw === 'function') {
                    window.VizHeatmap.draw(p, manager, ai, progress);
                    return;
                }
            }

            // treemap on data-active-index="4"
            if (ai === 3) {
                if (window.VizTreemap && typeof window.VizTreemap.draw === 'function') {
                    window.VizTreemap.draw(p, manager, ai, progress);
                    return;
                }
            }

            if (ai >= 5 && ai < 7) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 7) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
