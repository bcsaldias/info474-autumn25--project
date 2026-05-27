let weatherTable;
let weatherData = [];
let monthlyData = [];

let activeSection = 0;
let selectedFactor = "rain";
let selectedMonth = 10; // November by default
let selectedWeekStart = 300;

let selectedLayers = {
  rain: true,
  cloud: false,
  daylight: false,
  solar: false,
  wind: false,
  temp: false
};

const FACTORS = {
  rain: {
    label: "Rain",
    color: "#4A90E2",
    column: "precip",
    unit: "in",
    description: "Wet ground and rain exposure"
  },
  cloud: {
    label: "Cloud Cover",
    color: "#8E8E93",
    column: "cloudcover",
    unit: "%",
    description: "Grayness and visual heaviness"
  },
  daylight: {
    label: "Daylight",
    color: "#F4D35E",
    column: "daylightHours",
    unit: "hrs",
    description: "Available daylight in a day"
  },
  solar: {
    label: "Solar Energy",
    color: "#F6A04D",
    column: "solarenergy",
    unit: "MJ/m²",
    description: "Strength of sunlight reaching the city"
  },
  wind: {
    label: "Wind",
    color: "#2CB1A1",
    column: "windspeed",
    unit: "mph",
    description: "Outdoor movement discomfort"
  },
  temp: {
    label: "Temperature Comfort",
    color: "#E76F51",
    column: "feelslike",
    unit: "°F",
    description: "How temperature feels on the body"
  }
};

function preload() {
  weatherTable = loadTable(
    "data/seattle_weather_2025.csv",
    "csv",
    "header",
    () => {
      console.log("CSV loaded successfully");
    },
    (err) => {
      console.error("CSV failed to load. Check file path/name:", err);
    }
  );
}

function setup() {
  const canvas = createCanvas(windowWidth * 0.58, windowHeight * 0.82);
  canvas.parent("vis");

  textFont("Arial");
  processWeatherData();
  setupSectionObserver();
}

function draw() {
  background("#FAF7F0");

  if (!weatherData.length) {
    drawLoading();
    return;
  }

  if (activeSection === 0) {
    drawTitleView();
  } else if (activeSection === 1) {
    drawForecastLayers();
  } else if (activeSection === 2) {
    drawFactorPattern();
  } else if (activeSection === 3) {
    drawMonthProfile();
  } else if (activeSection === 4) {
    drawWeeklyLens();
  } else {
    drawDayContext();
  }
}

function windowResized() {
  resizeCanvas(windowWidth * 0.58, windowHeight * 0.82);
}

/* -------------------------
   Safe CSV reading helpers
-------------------------- */

function getCell(row, columnName, fallback = "") {
  try {
    const value = row.get(columnName);
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    return value;
  } catch (e) {
    return fallback;
  }
}

function getNumberCell(row, columnName, fallback = 0) {
  const value = Number(getCell(row, columnName, fallback));
  return isNaN(value) ? fallback : value;
}

function getStringCell(row, columnName, fallback = "") {
  const value = getCell(row, columnName, fallback);
  return String(value);
}

/* -------------------------
   Data processing
-------------------------- */

function processWeatherData() {
  weatherData = [];

  console.log("Loaded columns:", weatherTable.columns);

  for (let r = 0; r < weatherTable.getRowCount(); r++) {
    const row = weatherTable.getRow(r);

    const dateStr = getStringCell(row, "date", "");

    if (!dateStr) {
      console.warn("Missing date at row:", r);
      continue;
    }

    const dateObj = new Date(dateStr + "T12:00:00");

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date at row:", r, dateStr);
      continue;
    }

    const item = {
      date: dateStr,
      dateObj: dateObj,

      month: getNumberCell(row, "month", dateObj.getMonth() + 1) - 1,
      monthName: getStringCell(
        row,
        "monthName",
        dateObj.toLocaleString("en-US", { month: "short" })
      ),
      day: dateObj.getDate(),
      dayOfYear: getNumberCell(row, "dayOfYear", r + 1),

      temp: getNumberCell(row, "temp", 0),
      feelslike: getNumberCell(row, "feelslike", 0),
      precip: getNumberCell(row, "precip", 0),
      cloudcover: getNumberCell(row, "cloudcover", 0),
      solarenergy: getNumberCell(row, "solarenergy", 0),
      windspeed: getNumberCell(row, "windspeed", 0),
      daylightHours: getNumberCell(row, "daylightHours", 0),

      conditions: getStringCell(row, "conditions", "No condition label"),
      description: getStringCell(row, "description", "No description available")
    };

    // Use active layer columns from cleaned CSV directly
    item.layers = {
      rain: getNumberCell(row, "rainActive", 0) === 1,
      cloud: getNumberCell(row, "cloudActive", 0) === 1,
      daylight: getNumberCell(row, "lowDaylightActive", 0) === 1,
      solar: getNumberCell(row, "lowSolarActive", 0) === 1,
      wind: getNumberCell(row, "windActive", 0) === 1,
      temp: getNumberCell(row, "tempDiscomfortActive", 0) === 1
    };

    weatherData.push(item);
  }

  console.log("Processed weather rows:", weatherData.length);

  if (weatherData.length > 0) {
    console.log("First processed row:", weatherData[0]);
  }

  buildMonthlyData();
}

function buildMonthlyData() {
  monthlyData = [];

  for (let m = 0; m < 12; m++) {
    const days = weatherData.filter(d => d.month === m);

    if (!days.length) continue;

    monthlyData.push({
      month: m,
      monthName: days[0].monthName,
      rain: average(days, "precip"),
      cloud: average(days, "cloudcover"),
      daylight: average(days, "daylightHours"),
      solar: average(days, "solarenergy"),
      wind: average(days, "windspeed"),
      temp: average(days, "feelslike")
    });
  }
}

function average(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((sum, d) => sum + d[key], 0) / arr.length;
}

function setupSectionObserver() {
  const steps = document.querySelectorAll(".step");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeSection = Number(entry.target.dataset.activeIndex || 0);
        }
      });
    },
    { threshold: 0.55 }
  );

  steps.forEach(step => observer.observe(step));
}

function mousePressed() {
  if (activeSection === 2) {
    handleFactorButtons();
  }

  if (activeSection === 3) {
    handleMonthButtons();
  }

  if (activeSection === 4) {
    handleLayerButtons();
  }
}

/* -------------------------
   Shared drawing helpers
-------------------------- */

function drawTitle(textValue, subtitle) {
  fill("#222");
  noStroke();
  textSize(28);
  textStyle(BOLD);
  text(textValue, 40, 55, width - 80);

  textStyle(NORMAL);
  textSize(14);
  fill("#555");
  text(subtitle, 40, 90, width - 80);
}

function drawCard(x, y, w, h) {
  noStroke();
  fill("#FFFFFF");
  rect(x, y, w, h, 18);

  stroke("#E6E0D8");
  noFill();
  rect(x, y, w, h, 18);
}

function drawLoading() {
  fill("#222");
  textSize(20);
  text("Loading Seattle weather data...", 40, 60);
}

function drawButton(x, y, w, h, label, isActive, colorValue) {
  noStroke();
  fill(isActive ? colorValue : "#FFFFFF");
  rect(x, y, w, h, 14);

  stroke(isActive ? colorValue : "#D8D0C8");
  noFill();
  rect(x, y, w, h, 14);

  noStroke();
  fill(isActive ? "#FFFFFF" : "#333");
  textSize(12);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
  textAlign(LEFT, BASELINE);
}

/* -------------------------
   View 0: Title
-------------------------- */

function drawTitleView() {
  drawTitle(
    "Beyond the Forecast",
    "What environmental factors make Seattle weather feel hard?"
  );

  drawCard(50, 135, width - 100, 315);

  fill("#222");
  textSize(34);
  textStyle(BOLD);
  text("Seattle weather is not just rain.", 85, 195, width - 170);

  textStyle(NORMAL);
  textSize(18);
  fill("#444");
  text(
    "A campus day can feel difficult when several ordinary conditions overlap: rain, cloud cover, short daylight, low solar energy, wind, and temperature discomfort.",
    85,
    250,
    width - 170
  );

  const labels = ["Rain", "Cloud", "Daylight", "Solar", "Wind", "Temp"];
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  for (let i = 0; i < labels.length; i++) {
    const x = 85 + i * 95;
    const y = 365;

    fill(FACTORS[keys[i]].color);
    noStroke();
    circle(x, y, 32);

    fill("#333");
    textSize(13);
    textAlign(CENTER);
    text(labels[i], x, y + 34);
  }

  textAlign(LEFT);
}

/* -------------------------
   View 1: Weather Layers
-------------------------- */

function drawForecastLayers() {
  drawTitle(
    "1. What the Forecast Shows vs. What It Does Not Connect",
    "A normal forecast gives separate numbers. This view keeps each environmental layer visible instead of combining them into one score."
  );

  const day = weatherData[Math.min(305, weatherData.length - 1)];

  drawCard(45, 145, 240, 360);

  fill("#222");
  textSize(18);
  textStyle(BOLD);
  text("Standard Forecast", 70, 180);

  textStyle(NORMAL);
  textSize(14);
  fill("#555");
  text(day.date + " · " + day.conditions, 70, 205, 190);

  const forecastLines = [
    `Temp: ${nf(day.feelslike, 1, 1)}°F`,
    `Rain: ${nf(day.precip, 1, 2)} in`,
    `Cloud: ${nf(day.cloudcover, 1, 0)}%`,
    `Wind: ${nf(day.windspeed, 1, 1)} mph`,
    `Daylight: ${nf(day.daylightHours, 1, 1)} hrs`,
    `Solar: ${nf(day.solarenergy, 1, 1)} MJ/m²`
  ];

  for (let i = 0; i < forecastLines.length; i++) {
    fill("#333");
    textSize(15);
    text(forecastLines[i], 75, 250 + i * 38);
  }

  fill("#222");
  textSize(22);
  textStyle(BOLD);
  text("Weather Layers", 340, 175);

  textStyle(NORMAL);
  textSize(14);
  fill("#555");
  text(
    "Each layer remains visible, so users can see what is shaping the day.",
    340,
    200,
    width - 390
  );

  const keys = Object.keys(FACTORS);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    const x = 360 + i * 34;
    const y = 270 + i * 18;
    const w = 245;
    const h = 52;

    const c = color(FACTORS[key].color);
    fill(red(c), green(c), blue(c), 80);
    stroke(FACTORS[key].color);
    rect(x, y, w, h, 12);

    noStroke();
    fill("#222");
    textSize(14);
    textStyle(BOLD);
    text(FACTORS[key].label, x + 16, y + 22);

    textStyle(NORMAL);
    textSize(12);
    fill("#444");
    text(FACTORS[key].description, x + 16, y + 40);
  }

  fill("#333");
  textSize(15);
  text(
    "Takeaway: the forecast is useful, but the campus experience comes from how these layers overlap.",
    340,
    490,
    width - 390
  );
}

/* -------------------------
   View 2: Factor Pattern
-------------------------- */

function drawFactorPattern() {
  drawTitle(
    "2. Factor Patterns Across the Year",
    "Choose one environmental factor and see how it changes month by month."
  );

  drawFactorSelector(45, 120);

  const factor = selectedFactor;
  const info = FACTORS[factor];

  const chartX = 70;
  const chartY = 220;
  const chartW = width - 120;
  const chartH = 320;

  drawCard(45, 185, width - 90, 410);

  fill("#222");
  textSize(20);
  textStyle(BOLD);
  text(`${info.label} Across 2025`, chartX, chartY - 15);

  const values = monthlyData.map(d => d[factor]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = maxVal === minVal ? 1 : 0;

  stroke("#D8D0C8");
  line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);
  line(chartX, chartY, chartX, chartY + chartH);

  noFill();
  stroke(info.color);
  strokeWeight(3);
  beginShape();

  for (let i = 0; i < monthlyData.length; i++) {
    const x = map(i, 0, monthlyData.length - 1, chartX, chartX + chartW);
    const y = map(
      values[i],
      minVal - padding,
      maxVal + padding,
      chartY + chartH,
      chartY + 20
    );
    vertex(x, y);
  }

  endShape();
  strokeWeight(1);

  for (let i = 0; i < monthlyData.length; i++) {
    const x = map(i, 0, monthlyData.length - 1, chartX, chartX + chartW);
    const y = map(
      values[i],
      minVal - padding,
      maxVal + padding,
      chartY + chartH,
      chartY + 20
    );

    fill(info.color);
    noStroke();
    circle(x, y, 9);

    fill("#555");
    textSize(12);
    textAlign(CENTER);
    text(monthlyData[i].monthName, x, chartY + chartH + 25);
  }

  textAlign(LEFT);
  fill("#555");
  textSize(13);
  text(`Higher: ${nf(maxVal, 1, 1)} ${info.unit}`, chartX + chartW - 145, chartY + 10);
  text(`Lower: ${nf(minVal, 1, 1)} ${info.unit}`, chartX + chartW - 145, chartY + chartH - 10);
}

function drawFactorSelector(x, y) {
  const keys = Object.keys(FACTORS);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    drawButton(
      x + i * 112,
      y,
      100,
      34,
      FACTORS[key].label,
      selectedFactor === key,
      FACTORS[key].color
    );
  }
}

function handleFactorButtons() {
  const keys = Object.keys(FACTORS);
  const x = 45;
  const y = 120;

  for (let i = 0; i < keys.length; i++) {
    const bx = x + i * 112;

    if (mouseX > bx && mouseX < bx + 100 && mouseY > y && mouseY < y + 34) {
      selectedFactor = keys[i];
    }
  }
}

/* -------------------------
   View 3: Month Profile
-------------------------- */

function drawMonthProfile() {
  drawTitle(
    "3. Compare Factors Within a Month",
    "Select a month to see which environmental layers are most present."
  );

  drawMonthSelector(45, 120);

  const month = monthlyData[selectedMonth] || monthlyData[0];

  drawCard(50, 180, width - 100, 430);

  fill("#222");
  textSize(22);
  textStyle(BOLD);
  text(`${month.monthName} Weather Profile`, 80, 225);

  textStyle(NORMAL);
  fill("#555");
  textSize(14);
  text(
    "This view compares one month across all six factors, without turning them into one score.",
    80,
    250
  );

  const keys = Object.keys(FACTORS);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];

    const x = 95;
    const y = 310 + i * 44;
    const barW = width - 310;
    const barH = 20;

    const allMonthlyVals = monthlyData.map(d => d[key]);
    const minVal = Math.min(...allMonthlyVals);
    const maxVal = Math.max(...allMonthlyVals);

    const val = month[key];
    const w = maxVal === minVal ? barW / 2 : map(val, minVal, maxVal, 20, barW);

    fill("#333");
    textSize(13);
    textStyle(BOLD);
    text(info.label, x, y - 5);

    fill("#EFEAE2");
    noStroke();
    rect(x + 160, y - 18, barW, barH, 10);

    fill(info.color);
    rect(x + 160, y - 18, w, barH, 10);

    fill("#333");
    textStyle(NORMAL);
    text(`${nf(val, 1, 1)} ${info.unit}`, x + 175 + barW, y - 3);
  }
}

function drawMonthSelector(x, y) {
  for (let i = 0; i < monthlyData.length; i++) {
    const label = monthlyData[i] ? monthlyData[i].monthName : "";

    drawButton(
      x + i * 57,
      y,
      48,
      30,
      label,
      selectedMonth === i,
      "#6D5DF6"
    );
  }
}

function handleMonthButtons() {
  const x = 45;
  const y = 120;

  for (let i = 0; i < monthlyData.length; i++) {
    const bx = x + i * 57;

    if (mouseX > bx && mouseX < bx + 48 && mouseY > y && mouseY < y + 30) {
      selectedMonth = i;
    }
  }
}

/* -------------------------
   View 4: Weekly Lens
-------------------------- */

function drawWeeklyLens() {
  drawTitle(
    "4. Build Your Weekly Weather Lens",
    "Choose the factors that matter to your routine. Days with overlapping selected layers become darker."
  );

  drawLayerSelector(45, 120);

  const start = Math.min(selectedWeekStart, weatherData.length - 7);
  const week = weatherData.slice(start, start + 7);

  drawCard(50, 190, width - 100, 420);

  for (let i = 0; i < week.length; i++) {
    const d = week[i];
    const cardW = (width - 160) / 7;
    const x = 80 + i * cardW;
    const y = 240;

    const overlap = countSelectedOverlap(d);

    fill(255);
    stroke("#DDD");
    rect(x, y, cardW - 12, 250, 16);

    if (overlap > 0) {
      noStroke();
      fill(110, 93, 246, 40 + overlap * 38);
      rect(x, y, cardW - 12, 250, 16);
    }

    fill("#222");
    noStroke();
    textSize(14);
    textStyle(BOLD);
    text(d.monthName + " " + d.day, x + 12, y + 30);

    textStyle(NORMAL);
    textSize(12);
    fill("#555");
    text(d.conditions, x + 12, y + 52, cardW - 30);

    let yy = y + 95;

    Object.keys(FACTORS).forEach(key => {
      if (selectedLayers[key] && d.layers[key]) {
        fill(FACTORS[key].color);
        circle(x + 18, yy - 4, 8);

        fill("#333");
        textSize(11);
        text(FACTORS[key].label, x + 30, yy);

        yy += 22;
      }
    });
  }

  fill("#555");
  textSize(13);
  text(
    "Darker cards do not mean a formal score. They show that more of your selected conditions are present on the same day.",
    80,
    545,
    width - 160
  );
}

function drawLayerSelector(x, y) {
  const keys = Object.keys(FACTORS);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    drawButton(
      x + i * 112,
      y,
      100,
      34,
      FACTORS[key].label,
      selectedLayers[key],
      FACTORS[key].color
    );
  }
}

function handleLayerButtons() {
  const keys = Object.keys(FACTORS);
  const x = 45;
  const y = 120;

  for (let i = 0; i < keys.length; i++) {
    const bx = x + i * 112;

    if (mouseX > bx && mouseX < bx + 100 && mouseY > y && mouseY < y + 34) {
      selectedLayers[keys[i]] = !selectedLayers[keys[i]];
    }
  }
}

function countSelectedOverlap(d) {
  let count = 0;

  Object.keys(selectedLayers).forEach(key => {
    if (selectedLayers[key] && d.layers[key]) {
      count++;
    }
  });

  return count;
}

/* -------------------------
   View 5: Day in Context
-------------------------- */

function drawDayContext() {
  drawTitle(
    "5. A Day in Context",
    "The detail view explains a selected day through raw values and active weather layers."
  );

  const day = weatherData[Math.min(304, weatherData.length - 1)];

  drawCard(65, 150, width - 130, 450);

  fill("#222");
  textSize(24);
  textStyle(BOLD);
  text(`${day.date}: ${day.conditions}`, 95, 200, width - 190);

  textStyle(NORMAL);
  fill("#555");
  textSize(14);
  text(day.description, 95, 230, width - 190);

  const details = [
    ["Rain", `${nf(day.precip, 1, 2)} in`, "rain"],
    ["Cloud Cover", `${nf(day.cloudcover, 1, 0)}%`, "cloud"],
    ["Daylight", `${nf(day.daylightHours, 1, 1)} hrs`, "daylight"],
    ["Solar Energy", `${nf(day.solarenergy, 1, 1)} MJ/m²`, "solar"],
    ["Wind", `${nf(day.windspeed, 1, 1)} mph`, "wind"],
    ["Feels Like", `${nf(day.feelslike, 1, 1)}°F`, "temp"]
  ];

  for (let i = 0; i < details.length; i++) {
    const [label, value, key] = details[i];

    const x = 105 + (i % 2) * 300;
    const y = 315 + Math.floor(i / 2) * 78;

    fill(FACTORS[key].color);
    noStroke();
    circle(x, y, 18);

    fill("#222");
    textSize(15);
    textStyle(BOLD);
    text(label, x + 28, y - 6);

    textStyle(NORMAL);
    fill("#555");
    text(value, x + 28, y + 16);
  }

  fill("#F3EFE8");
  noStroke();
  rect(95, 535, width - 190, 48, 12);

  fill("#333");
  textSize(14);
  text(
    "Interpretation: this day may feel harder because several layers appear together, such as wet ground, gray sky, short daylight, or wind.",
    115,
    562,
    width - 230
  );
}