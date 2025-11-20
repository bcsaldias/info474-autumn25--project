let importsData, exportsData;
let top10Data = [];
let sectors = [];
let showing = "imports";
let selectedYear = 2018;
let yearSelect, toggleButton;

function preload() {
  importsData = loadTable('../datasets/gunner/import_types.csv', 'csv', 'header');
  exportsData = loadTable('../datasets/gunner/import_types.csv', 'csv', 'header');
}

function setup() {
  createCanvas(1200, 600);

  // Year selector
  yearSelect = createSelect();
  yearSelect.position(10, 10);
  for (let y = 2018; y <= 2024; y++) {
    yearSelect.option(y);
  }
  yearSelect.changed(() => {
    selectedYear = int(yearSelect.value());
    processData();
  });

  // Toggle button
  toggleButton = createButton('Switch to Exports');
  toggleButton.position(150, 10);
  toggleButton.mousePressed(toggleData);

  processData();
}

function draw() {
  background(255);
  fill(0);
  textSize(18);
  textAlign(CENTER);
  text(`Top 10 Countries by ${showing.charAt(0).toUpperCase() + showing.slice(1)} (${selectedYear})`, width / 2, 50);

  if (top10Data.length === 0) return;

  let margin = 120;
  let chartWidth = width - 200 - 2 * margin;
  let chartHeight = height - 2 * margin;
  let barWidth = chartWidth / top10Data.length * 0.6;

  // Find maximum total value for scaling
  let maxVal = max(top10Data.map(d => sectors.reduce((sum, s) => sum + (d[s] || 0), 0)));

  textSize(12);
  for (let i = 0; i < top10Data.length; i++) {
    let d = top10Data[i];
    let x = margin + i * (chartWidth / top10Data.length) + (chartWidth / top10Data.length - barWidth) / 2;

    let yBottom = height - margin;
    for (let j = 0; j < sectors.length; j++) {
      let val = d[sectors[j]] || 0;
      let barHeight = map(val, 0, maxVal, 0, chartHeight);
      fill(colors[j]);
      rect(x, yBottom - barHeight, barWidth, barHeight);
      yBottom -= barHeight;
    }

    fill(0);
    textAlign(CENTER);
    text(d.country, x + barWidth / 2, height - margin + 15);
  }

  // Legend
  let lx = 900;
  let ly = 60;
  textAlign(LEFT);
  for (let i = 0; i < sectors.length; i++) {
    fill(colors[i]);
    rect(lx, ly, 15, 15);
    fill(0);
    text(sectors[i], lx + 20, ly + 12);
    ly += 20;
  }
}

function toggleData() {
  if (showing === "imports") {
    showing = "exports";
    toggleButton.html('Switch to Imports');
  } else {
    showing = "imports";
    toggleButton.html('Switch to Exports');
  }
  processData();
}

function processData() {
  let table = showing === "imports" ? importsData : exportsData;

  let rows = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    if (int(table.getString(r, "Year")) === selectedYear) {
      rows.push(table.getRow(r));
    }
  }

  // Aggregate totals per country
  let totals = {};
  let sectorSet = new Set();
  for (let row of rows) {
    let country = row.get("Reporting Economy");
    let sector = row.get("Product/Sector");
    let value = parseFloat(row.get("Value"));
    sectorSet.add(sector);

    if (!totals[country]) totals[country] = {};
    if (!totals[country][sector]) totals[country][sector] = 0;
    totals[country][sector] += value;
  }

  sectors = Array.from(sectorSet); // dynamic sectors

  // Generate colors for sectors only once
  colors = [];
  for (let i = 0; i < sectors.length; i++) {
    let r, g, b; // Declare R, G, B variables
  
    if (showing == "imports") {
      r = (255 / 2) + (10 * i);
      g = (i * (255 / 11));
      b = 255;
    } else {
      r = 255;
      g = (i * (255 / 11));
      b = (i * (255 / 11));
    }
    colors.push(color(r, g, b)); 
  }

  // Compute total per country for top 10
  let totalsArr = Object.entries(totals).map(([country, data]) => {
    let total = Object.values(data).reduce((a, b) => a + b, 0);
    return { country, data, total };
  });

  totalsArr.sort((a, b) => b.total - a.total);
  top10Data = totalsArr.slice(0, 10).map(d => ({ country: d.country, ...d.data }));
}


