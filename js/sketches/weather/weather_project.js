let weatherTable;
let weatherData = [];
let monthlyData = [];

let activeSection = 0;
let selectedFactor = "rain";
let selectedMonth = 10; // November

const FACTORS = {
  rain: {
    label: "Rain",
    shortLabel: "Rain",
    icon: "💧",
    color: "#4A90E2",
    column: "precip",
    unit: "in",
    activeColumn: "rainActive",
    description: "Wet ground and rain exposure"
  },
  cloud: {
    label: "Cloud Cover",
    shortLabel: "Cloud",
    icon: "☁️",
    color: "#8E8E93",
    column: "cloudcover",
    unit: "%",
    activeColumn: "cloudActive",
    description: "Gray sky and visual heaviness"
  },
  daylight: {
    label: "Daylight",
    shortLabel: "Daylight",
    icon: "☀️",
    color: "#F4D35E",
    column: "daylightHours",
    unit: "hrs",
    activeColumn: "lowDaylightActive",
    description: "How much daylight is available"
  },
  solar: {
    label: "Solar Energy",
    shortLabel: "Solar",
    icon: "🌤️",
    color: "#F6A04D",
    column: "solarenergy",
    unit: "MJ/m²",
    activeColumn: "lowSolarActive",
    description: "Strength of sunlight reaching the city"
  },
  wind: {
    label: "Wind",
    shortLabel: "Wind",
    icon: "〰️",
    color: "#2CB1A1",
    column: "windspeed",
    unit: "mph",
    activeColumn: "windActive",
    description: "Outdoor movement discomfort"
  },
  temp: {
    label: "Temperature Comfort",
    shortLabel: "Temp",
    icon: "🌡️",
    color: "#E76F51",
    column: "feelslike",
    unit: "°F",
    activeColumn: "tempDiscomfortActive",
    description: "How temperature feels on the body"
  }
};

function preload() {
  weatherTable = loadTable(
    "data/seattle_weather_2025.csv",
    "csv",
    "header",
    () => console.log("CSV loaded successfully"),
    err => console.error("CSV failed to load. Check file path/name:", err)
  );
}

function setup() {
  const visContainer = document.getElementById("vis");
  const canvasW = Math.max(720, visContainer.clientWidth);
  const canvasH = Math.min(760, Math.max(640, windowHeight * 0.86));

  const canvas = createCanvas(canvasW, canvasH);
  canvas.parent("vis");

  textFont("Arial");
  processWeatherData();
  buildMonthlyData();
  setupSectionObserver();
}

function draw() {
  background("#FAF7F0");

  if (!weatherData.length) {
    drawLoading();
    return;
  }

  if (activeSection === 0) {
    drawOpeningPanel();
  } else if (activeSection === 1) {
    drawWeatherLayersPanel();
  } else if (activeSection === 2) {
    drawYearlyFactorPatternPanel();
  } else if (activeSection === 3) {
    drawMonthlyComparisonPanel();
  } else {
    drawPlaceholderPanel();
  }
}

function windowResized() {
  const visContainer = document.getElementById("vis");
  const canvasW = Math.max(720, visContainer.clientWidth);
  const canvasH = Math.min(760, Math.max(640, windowHeight * 0.86));

  resizeCanvas(canvasW, canvasH);
}

function mousePressed() {
  if (activeSection === 2) {
    handleFactorSelection();
  }

  if (activeSection === 3) {
    handleMonthSelection();
  }
}

/* -------------------------
   Data helpers
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

function processWeatherData() {
  weatherData = [];

  console.log("Loaded columns:", weatherTable.columns);

  for (let r = 0; r < weatherTable.getRowCount(); r++) {
    const row = weatherTable.getRow(r);
    const dateStr = getStringCell(row, "date", "");

    if (!dateStr) continue;

    const dateObj = new Date(dateStr + "T12:00:00");
    if (isNaN(dateObj.getTime())) continue;

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
      uvindex: getNumberCell(row, "uvindex", 0),
      windspeed: getNumberCell(row, "windspeed", 0),
      daylightHours: getNumberCell(row, "daylightHours", 0),

      sunrise: getStringCell(row, "sunrise", ""),
      sunset: getStringCell(row, "sunset", ""),
      conditions: getStringCell(row, "conditions", "No condition label"),
      description: getStringCell(row, "description", "No description available"),

      layers: {
        rain: getNumberCell(row, "rainActive", 0) === 1,
        cloud: getNumberCell(row, "cloudActive", 0) === 1,
        daylight: getNumberCell(row, "lowDaylightActive", 0) === 1,
        solar: getNumberCell(row, "lowSolarActive", 0) === 1,
        wind: getNumberCell(row, "windActive", 0) === 1,
        temp: getNumberCell(row, "tempDiscomfortActive", 0) === 1
      }
    };

    weatherData.push(item);
  }

  console.log("Processed weather rows:", weatherData.length);

  if (weatherData.length > 0) {
    console.log("First processed row:", weatherData[0]);
  }
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
      temp: average(days, "feelslike"),

      rainActiveDays: countActive(days, "rain"),
      cloudActiveDays: countActive(days, "cloud"),
      daylightActiveDays: countActive(days, "daylight"),
      solarActiveDays: countActive(days, "solar"),
      windActiveDays: countActive(days, "wind"),
      tempActiveDays: countActive(days, "temp")
    });
  }

  console.log("Monthly data:", monthlyData);
}

function average(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((sum, d) => sum + d[key], 0) / arr.length;
}

function countActive(days, factorKey) {
  return days.filter(d => d.layers[factorKey]).length;
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

/* -------------------------
   Drawing helpers
-------------------------- */

function drawLoading() {
  fill("#222");
  textSize(20);
  text("Loading Seattle weather data...", 40, 60);
}

function drawMainTitle(title, subtitle) {
  fill("#222");
  noStroke();
  textSize(25);
  textStyle(BOLD);
  text(title, 68, 48, width - 110);

  textStyle(NORMAL);
  textSize(13);
  fill("#555");
  text(subtitle, 68, 80, width - 110);
}

function drawSectionNumber(num, x, y) {
  fill("#4D3F8F");
  noStroke();
  circle(x, y, 26);

  fill("#FFFFFF");
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(num, x, y + 1);
  textAlign(LEFT, BASELINE);
}

function drawCard(x, y, w, h, radius = 16) {
  noStroke();
  fill("#FFFFFF");
  rect(x, y, w, h, radius);

  stroke("#D9D2C7");
  strokeWeight(1.4);
  noFill();
  rect(x, y, w, h, radius);
  strokeWeight(1);
}

function drawSoftCard(x, y, w, h, colorValue, radius = 14) {
  const c = color(colorValue);
  fill(red(c), green(c), blue(c), 30);
  stroke(red(c), green(c), blue(c), 120);
  rect(x, y, w, h, radius);
}

function drawMiniDivider(x1, y1, x2, y2) {
  stroke("#D8D0C8");
  strokeWeight(1.3);
  line(x1, y1, x2, y2);
  strokeWeight(1);
}

function formatTime(timeText) {
  if (!timeText) return "N/A";
  return timeText.toString().slice(0, 5);
}

function drawRoundedButton(x, y, w, h, label, icon, active, colorValue) {
  if (active) {
    drawSoftCard(x, y, w, h, colorValue, 12);
  } else {
    fill("#FFFFFF");
    stroke("#D9D2C7");
    rect(x, y, w, h, 12);
  }

  noStroke();
  textAlign(CENTER, CENTER);

  textSize(19);
  text(icon, x + w / 2, y + 21);

  fill(active ? "#2f276f" : "#333");
  textSize(10.5);
  textStyle(active ? BOLD : NORMAL);
  text(label, x + w / 2, y + h - 14);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function normalizeValue(value, minValue, maxValue) {
  if (maxValue === minValue) return 0.5;
  return (value - minValue) / (maxValue - minValue);
}

function getFactorExplanation(factorKey) {
  const explanations = {
    rain: "Rain tends to be more present in fall and winter, but lower in summer. This challenges the idea that Seattle always feels equally rainy.",
    cloud: "Cloud cover stays high in colder months, which can make days feel visually heavier even when rain is light.",
    daylight: "Daylight is lowest in winter and highest in summer, making the same campus routine feel different across seasons.",
    solar: "Solar energy is much lower in winter, which helps explain why some days feel dim even when it is not actively raining.",
    wind: "Wind varies less smoothly than daylight or solar energy, but windy days can still change outdoor comfort.",
    temp: "Temperature comfort is not only about the actual temperature. It is about how the air feels when combined with other conditions."
  };

  return explanations[factorKey];
}

function getShortFactorExplanation(factorKey) {
  const explanations = {
    rain: "Rain is higher in colder months and lower in summer. This shows that rainy feeling is seasonal, not constant.",
    cloud: "Cloud cover stays high in many colder months, which can make days feel gray even without heavy rain.",
    daylight: "Daylight changes gradually through the year and reaches its lowest point in winter.",
    solar: "Solar energy drops in winter, helping explain why some days feel dim even when rain is light.",
    wind: "Wind is less seasonal than daylight, but it still affects walking, waiting, and outdoor comfort.",
    temp: "Temperature comfort shows how the air feels, especially when combined with wind, rain, or low daylight."
  };

  return explanations[factorKey];
}

/* -------------------------
   Section 0: Opening panel
-------------------------- */

function drawOpeningPanel() {
  drawMainTitle(
    "BEYOND THE FORECAST",
    "What environmental factors make Seattle weather feel hard?"
  );

  drawCard(45, 125, width - 90, 365, 18);

  fill("#2f276f");
  textSize(22);
  textStyle(BOLD);
  text("Seattle weather is not just rain.", 75, 185, width - 150);

  textStyle(NORMAL);
  fill("#444");
  textSize(17);
  text(
    "This project starts from a simple idea: a forecast can tell us the weather, but it does not always explain the experience of moving through campus.",
    75,
    235,
    width - 150
  );

  const keys = Object.keys(FACTORS);
  const startX = 95;
  const y = 365;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const x = startX + i * 92;

    fill(FACTORS[key].color);
    noStroke();
    circle(x, y, 34);

    fill("#222");
    textSize(18);
    textAlign(CENTER, CENTER);
    text(FACTORS[key].icon, x, y);

    fill("#333");
    textSize(12);
    textStyle(NORMAL);
    text(FACTORS[key].shortLabel, x, y + 38);
  }

  textAlign(LEFT, BASELINE);

  fill("#F3EFE8");
  noStroke();
  rect(80, 525, width - 160, 45, 12);

  fill("#333");
  textSize(14);
  text(
    "Not a score. Not one cause. More layers, more context.",
    105,
    553,
    width - 210
  );
}

/* -------------------------
   Section 1: Viz 1 Weather Layers
-------------------------- */

function drawWeatherLayersPanel() {
  const day = pickExampleDay();

  drawMainTitle(
    "BEYOND THE FORECAST: WEATHER LAYERS",
    "A forecast shows numbers, but it does not always connect how those conditions overlap in daily life."
  );

  drawSectionNumber("1", 38, 43);

  const margin = 42;
  const topY = 135;
  const panelH = height - 245;

  const forecastW = Math.min(255, width * 0.28);
  const arrowW = 70;
  const gap = 24;
  const layerW = width - margin * 2 - forecastW - arrowW - gap * 2;

  const forecastX = margin;
  const arrowX = forecastX + forecastW + gap;
  const layerX = arrowX + arrowW + gap;

  drawForecastCard(day, forecastX, topY, forecastW, panelH);
  drawConnectionArrow(arrowX + arrowW / 2, topY + panelH / 2);
  drawLayerStack(day, layerX, topY, layerW, panelH);

  drawVizOneTakeaway(height - 92);
}

function pickExampleDay() {
  const target = weatherData.find(d => d.monthName === "Nov" && d.day === 15);
  if (target) return target;
  return weatherData[Math.min(304, weatherData.length - 1)];
}

function drawForecastCard(day, x, y, w, h) {
  fill("#2f276f");
  noStroke();
  textSize(13);
  textStyle(BOLD);
  text("WHAT THE FORECAST SHOWS", x, y - 12);

  drawCard(x, y, w, h, 16);

  const innerX = x + 18;
  const innerY = y + 25;
  const innerW = w - 36;
  const innerH = h - 50;

  fill("#F8FBFF");
  stroke("#B6CDE5");
  rect(innerX, innerY, innerW, innerH, 14);

  noStroke();
  fill("#333");
  textSize(12);
  textStyle(BOLD);
  text(day.date, innerX + 18, innerY + 42);

  textSize(34);
  textStyle(BOLD);
  fill("#222");
  text(`${Math.round(day.feelslike)}°F`, innerX + 18, innerY + 95);

  textSize(30);
  textAlign(CENTER, CENTER);
  text("🌧️", innerX + innerW - 42, innerY + 78);
  textAlign(LEFT, BASELINE);

  fill("#444");
  textSize(14);
  textStyle(NORMAL);
  text(day.conditions, innerX + 18, innerY + 132, innerW - 36);

  drawMiniDivider(innerX + 14, innerY + 150, innerX + innerW - 14, innerY + 150);

  const rows = [
    ["💧", "Rain", `${nf(day.precip, 1, 2)} in`],
    ["☁️", "Cloud", `${Math.round(day.cloudcover)}%`],
    ["〰️", "Wind", `${nf(day.windspeed, 1, 1)} mph`],
    ["🌅", "Sunrise", formatTime(day.sunrise)],
    ["🌇", "Sunset", formatTime(day.sunset)]
  ];

  let rowY = innerY + 190;

  for (let i = 0; i < rows.length; i++) {
    const [icon, label, value] = rows[i];

    fill("#333");
    textSize(13);
    text(icon, innerX + 18, rowY);

    fill("#555");
    textSize(12);
    text(label, innerX + 48, rowY);

    fill("#222");
    textAlign(RIGHT, BASELINE);
    textSize(12);
    text(value, innerX + innerW - 18, rowY);
    textAlign(LEFT, BASELINE);

    rowY += 34;
  }
}

function drawConnectionArrow(x, y) {
  stroke("#444");
  strokeWeight(2);
  line(x - 22, y, x + 22, y);
  line(x + 22, y, x + 10, y - 9);
  line(x + 22, y, x + 10, y + 9);
  strokeWeight(1);

  noStroke();
  fill("#555");
  textSize(11);
  textAlign(CENTER);
  text("connects to", x, y + 34);
  textAlign(LEFT, BASELINE);
}

function drawLayerStack(day, x, y, w, h) {
  fill("#2f276f");
  noStroke();
  textSize(13);
  textStyle(BOLD);
  text("WHAT IT DOESN'T CONNECT", x, y - 12);

  drawCard(x, y, w, h, 16);

  const layerKeys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];
  const innerX = x + 26;
  const innerY = y + 34;
  const innerW = w - 52;

  const availableH = h - 96;
  const gap = 9;
  const layerH = (availableH - gap * (layerKeys.length - 1)) / layerKeys.length;

  for (let i = 0; i < layerKeys.length; i++) {
    const key = layerKeys[i];
    const info = FACTORS[key];
    const yy = innerY + i * (layerH + gap);
    const active = day.layers[key];
    const c = color(info.color);

    if (active) {
      fill(red(c), green(c), blue(c), 82);
      stroke(info.color);
    } else {
      fill(red(c), green(c), blue(c), 24);
      stroke(red(c), green(c), blue(c), 95);
    }

    rect(innerX, yy, innerW, layerH, 12);

    noStroke();

    fill("#222");
    textSize(17);
    textAlign(CENTER, CENTER);
    text(info.icon, innerX + 30, yy + layerH / 2);

    textAlign(LEFT, CENTER);
    fill("#222");
    textSize(13);
    textStyle(BOLD);
    text(info.label, innerX + 62, yy + layerH / 2 - 8);

    fill("#555");
    textSize(11);
    textStyle(NORMAL);
    text(info.description, innerX + 62, yy + layerH / 2 + 10, innerW - 150);

    if (active) {
      fill("#2f276f");
      textSize(10.5);
      textStyle(BOLD);
      textAlign(RIGHT, CENTER);
      text("active", innerX + innerW - 18, yy + layerH / 2);
      textAlign(LEFT, BASELINE);
    }
  }

  fill("#444");
  textSize(12);
  textStyle(NORMAL);
  text(
    "A day can feel hard when several ordinary layers appear together, even if no single number looks extreme.",
    innerX,
    y + h - 38,
    innerW
  );
}

function drawVizOneTakeaway(y) {
  const x = 42;
  const w = width - 84;

  drawCard(x, y, w, 64, 14);

  fill("#2f276f");
  textSize(14);
  textStyle(BOLD);
  text("Takeaway", x + 26, y + 28);

  fill("#333");
  textSize(12.5);
  textStyle(NORMAL);
  text(
    "The forecast is useful, but the campus experience comes from how rain, cloud cover, daylight, solar energy, wind, and temperature comfort overlap.",
    x + 120,
    y + 24,
    w - 150
  );
}

/* -------------------------
   Section 2: Viz 2 Yearly factor patterns
-------------------------- */

function drawYearlyFactorPatternPanel() {
  drawMainTitle(
    "FACTOR PATTERNS ACROSS THE YEAR",
    "Choose one weather layer to explore its pattern through 2025."
  );

  drawSectionNumber("2", 38, 43);

  drawFactorButtons();
  drawYearlyLineChart();
  drawYearlyAnnotationCard();
}

function drawFactorButtons() {
  const keys = Object.keys(FACTORS);
  const startX = 48;
  const y = 118;
  const w = 84;
  const h = 64;
  const gap = 12;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];

    drawRoundedButton(
      startX + i * (w + gap),
      y,
      w,
      h,
      info.shortLabel,
      info.icon,
      selectedFactor === key,
      info.color
    );
  }
}

function handleFactorSelection() {
  const keys = Object.keys(FACTORS);
  const startX = 48;
  const y = 118;
  const w = 84;
  const h = 64;
  const gap = 12;

  for (let i = 0; i < keys.length; i++) {
    const x = startX + i * (w + gap);

    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
      selectedFactor = keys[i];
    }
  }
}

function drawYearlyLineChart() {
  const info = FACTORS[selectedFactor];

  const x = 70;
  const y = 230;
  const w = width - 345;
  const h = Math.min(300, height - 390);

  drawCard(x - 25, y - 35, w + 50, h + 85, 16);

  fill("#222");
  noStroke();
  textSize(17);
  textStyle(BOLD);
  text(`${info.label} Across 2025`, x, y - 8);

  const values = monthlyData.map(d => d[selectedFactor]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = maxVal === minVal ? 1 : 0;

  stroke("#E7E0D6");
  strokeWeight(1);

  for (let i = 0; i <= 4; i++) {
    const gy = y + map(i, 0, 4, 0, h);
    line(x, gy, x + w, gy);
  }

  for (let i = 0; i < monthlyData.length; i++) {
    const gx = map(i, 0, monthlyData.length - 1, x, x + w);
    line(gx, y, gx, y + h);
  }

  fill("#555");
  noStroke();
  textSize(12);
  textAlign(RIGHT, CENTER);
  text("High", x - 12, y + 5);
  text("Low", x - 12, y + h - 5);
  textAlign(LEFT, BASELINE);

  noFill();
  stroke(info.color);
  strokeWeight(3);
  beginShape();

  for (let i = 0; i < monthlyData.length; i++) {
    const value = monthlyData[i][selectedFactor];
    const px = map(i, 0, monthlyData.length - 1, x, x + w);
    const py = map(value, minVal - padding, maxVal + padding, y + h, y + 20);
    vertex(px, py);
  }

  endShape();
  strokeWeight(1);

  for (let i = 0; i < monthlyData.length; i++) {
    const value = monthlyData[i][selectedFactor];
    const px = map(i, 0, monthlyData.length - 1, x, x + w);
    const py = map(value, minVal - padding, maxVal + padding, y + h, y + 20);

    fill("#FFFFFF");
    stroke(info.color);
    strokeWeight(2);
    circle(px, py, 9);

    noStroke();
    fill("#555");
    textSize(12);
    textAlign(CENTER);
    text(monthlyData[i].monthName[0], px, y + h + 25);
  }

  textAlign(LEFT, BASELINE);

  fill("#555");
  textSize(12);
  text(
    `Range: ${nf(minVal, 1, 1)}–${nf(maxVal, 1, 1)} ${info.unit}`,
    x,
    y + h + 58
  );
}

function drawYearlyAnnotationCard() {
  const info = FACTORS[selectedFactor];

  const x = width - 235;
  const y = 255;
  const w = 190;
  const h = 250;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("WHAT TO NOTICE", x + 18, y + 30);

  fill("#222");
  textSize(22);
  textAlign(CENTER);
  text(info.icon, x + w / 2, y + 68);
  textAlign(LEFT);

  fill("#333");
  textSize(13);
  textStyle(BOLD);
  text(info.label, x + 18, y + 100);

  fill("#555");
  textSize(11.5);
  textStyle(NORMAL);
  text(getShortFactorExplanation(selectedFactor), x + 18, y + 123, w - 36);
}

/* -------------------------
   Section 3: Viz 3 Monthly Weather Layer Profile
-------------------------- */

function drawMonthlyComparisonPanel() {
  drawMainTitle(
    "MONTHLY WEATHER LAYER PROFILE",
    "Compare one month across six weather layers. Bars show relative intensity; labels show average value and flagged days."
  );

  drawSectionNumber("3", 38, 43);

  drawMonthButtons();
  drawMonthlyBars();
  drawThresholdLegendStrip();
  drawMonthlyTakeaway();
}

function drawMonthButtons() {
  const startX = 54;
  const y = 118;
  const w = 58;
  const h = 32;
  const gap = 7;

  for (let i = 0; i < monthlyData.length; i++) {
    const month = monthlyData[i];
    const x = startX + i * (w + gap);
    const active = selectedMonth === i;

    fill(active ? "#4D3F8F" : "#FFFFFF");
    stroke(active ? "#4D3F8F" : "#D9D2C7");
    rect(x, y, w, h, 10);

    noStroke();
    fill(active ? "#FFFFFF" : "#333");
    textSize(11.5);
    textStyle(active ? BOLD : NORMAL);
    textAlign(CENTER, CENTER);
    text(month.monthName, x + w / 2, y + h / 2);
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function handleMonthSelection() {
  const startX = 54;
  const y = 118;
  const w = 58;
  const h = 32;
  const gap = 7;

  for (let i = 0; i < monthlyData.length; i++) {
    const x = startX + i * (w + gap);

    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
      selectedMonth = i;
    }
  }
}

function drawMonthlyBars() {
  const month = monthlyData[selectedMonth] || monthlyData[0];
  const keys = Object.keys(FACTORS);

  const chartX = 54;
  const chartY = 190;
  const chartW = width - 108;
  const chartH = 360;

  drawCard(chartX, chartY, chartW, chartH, 18);

  fill("#222");
  noStroke();
  textSize(20);
  textStyle(BOLD);
  text(`${month.monthName} Weather Layer Profile`, chartX + 34, chartY + 42);

  fill("#555");
  textSize(12.3);
  textStyle(NORMAL);
  text(
    "Each bar is normalized within its own factor’s yearly range, so the chart compares relative intensity rather than raw units.",
    chartX + 34,
    chartY + 66,
    chartW - 68
  );

  const axisX = chartX + 56;
  const plotTop = chartY + 150;
  const plotBottom = chartY + 270;
  const maxBarH = plotBottom - plotTop;

  drawRelativeIntensityAxis(axisX, plotTop, maxBarH);

  const startX = chartX + 120;
  const usableW = chartW - 165;
  const gap = usableW / keys.length;
  const barW = 40;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];

    const centerX = startX + i * gap + gap / 2;
    const barX = centerX - barW / 2;

    const values = monthlyData.map(d => d[key]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const value = month[key];

    const normalized = normalizeValue(value, minVal, maxVal);
    const barH = map(normalized, 0, 1, 22, maxBarH);

    // icon
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(23);
    text(info.icon, centerX, chartY + 112);

    // factor label
    fill("#333");
    textSize(11.5);
    textStyle(BOLD);
    text(info.shortLabel, centerX, chartY + 136);

    // background bar
    fill("#EFEAE2");
    stroke("#D9D2C7");
    rect(barX, plotBottom - maxBarH, barW, maxBarH, 7);

    // actual relative bar
    const c = color(info.color);
    fill(red(c), green(c), blue(c), 85);
    stroke(info.color);
    strokeWeight(1.5);
    rect(barX, plotBottom - barH, barW, barH, 7);
    strokeWeight(1);

    // avg value
    noStroke();
    fill("#333");
    textSize(10.8);
    textStyle(NORMAL);
    text(
      `avg: ${formatFactorValue(value, info.unit)}`,
      centerX,
      plotBottom + 28
    );

    // flagged days
    const flaggedDays = month[`${key}ActiveDays`];

    fill("#666");
    textSize(10.8);
    text(`${flaggedDays} flagged days`, centerX, plotBottom + 48);
  }

  textAlign(LEFT, BASELINE);

  fill("#F3EFE8");
  noStroke();
  rect(chartX + 34, chartY + chartH - 42, chartW - 68, 28, 10);

  fill("#444");
  textSize(11.3);
  textStyle(NORMAL);
  text(
    "Read this as a profile: which layers are relatively high this month, and how often each layer is flagged.",
    chartX + 52,
    chartY + chartH - 24
  );
}

function formatFactorValue(value, unit) {
  if (unit === "in") {
    return `${nf(value, 1, 2)} in`;
  }

  if (unit === "%") {
    return `${nf(value, 1, 0)}%`;
  }

  if (unit === "hrs") {
    return `${nf(value, 1, 1)} hrs`;
  }

  if (unit === "MJ/m²") {
    return `${nf(value, 1, 1)} MJ/m²`;
  }

  if (unit === "mph") {
    return `${nf(value, 1, 1)} mph`;
  }

  if (unit === "°F") {
    return `${nf(value, 1, 1)}°F`;
  }

  return `${nf(value, 1, 1)} ${unit}`;
}

function drawRelativeIntensityAxis(x, y, h) {
  stroke("#D8D0C8");
  strokeWeight(1.2);
  line(x, y, x, y + h);

  const labels = [
    ["High", y],
    ["Med", y + h / 2],
    ["Low", y + h]
  ];

  noStroke();
  fill("#666");
  textSize(10.5);
  textAlign(RIGHT, CENTER);

  for (let i = 0; i < labels.length; i++) {
    const [label, yy] = labels[i];
    text(label, x - 8, yy);
  }

  textAlign(CENTER, CENTER);
  push();
  translate(x - 42, y + h / 2);
  rotate(-HALF_PI);
  fill("#555");
  textSize(10.5);
  text("Relative intensity", 0, 0);
  pop();

  textAlign(LEFT, BASELINE);
}

function drawThresholdLegendStrip() {
  const x = 54;
  const y = 575;
  const w = width - 108;
  const h = 88;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("How we flag days", x + 24, y + 30);

  fill("#555");
  textSize(11.5);
  textStyle(NORMAL);
  text(
    "A flagged day crosses a prototype experience threshold:",
    x + 24,
    y + 52
  );

  const rules = [
    ["💧", "Rain", "≥ 0.05 in"],
    ["☁️", "Cloud", "≥ 75%"],
    ["☀️", "Daylight", "≤ 9.5 hrs"],
    ["🌤️", "Solar", "≤ 4 MJ/m²"],
    ["〰️", "Wind", "≥ 12 mph"],
    ["🌡️", "Temp", "≤45°F / ≥78°F"]
  ];

  const chipStartX = x + 310;
  const chipY = y + 24;
  const chipW = (w - 340) / 3;
  const chipH = 24;

  for (let i = 0; i < rules.length; i++) {
    const [icon, label, rule] = rules[i];

    const col = i % 3;
    const row = Math.floor(i / 3);

    const cx = chipStartX + col * chipW;
    const cy = chipY + row * 32;

    fill("#F3EFE8");
    noStroke();
    rect(cx, cy, chipW - 12, chipH, 9);

    fill("#333");
    textSize(10.8);
    textStyle(BOLD);
    text(`${icon} ${label}`, cx + 10, cy + 16);

    fill("#666");
    textStyle(NORMAL);
    text(rule, cx + 82, cy + 16);
  }

  fill("#777");
  textSize(10.5);
  textStyle(NORMAL);
  text(
    "Thresholds are used for exploration, not as a universal weather score.",
    x + 24,
    y + h - 13
  );
}

function drawMonthlyTakeaway() {
  const y = height - 76;

  drawCard(54, y, width - 108, 50, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Why this matters", 82, y + 31);

  fill("#333");
  textSize(12.5);
  textStyle(NORMAL);
  text(
    "This view separates strength from frequency: a factor can be intense on average, frequent across many days, or both.",
    220,
    y + 31,
    width - 285
  );
}

/* -------------------------
   Placeholder panels for later commits
-------------------------- */

function drawPlaceholderPanel() {
  const titles = {
    4: "BUILD YOUR WEEKLY WEATHER LENS",
    5: "DAY IN CONTEXT",
    6: "TAKEAWAY"
  };

  const sectionNum = activeSection.toString();

  drawMainTitle(
    titles[activeSection] || "NEXT VIEW",
    "This panel is intentionally left as a placeholder for the next implementation commit."
  );

  drawSectionNumber(sectionNum, 38, 43);

  drawCard(70, 150, width - 140, 320, 18);

  fill("#2f276f");
  textSize(24);
  textStyle(BOLD);
  text("Coming in the next commit", 105, 220);

  fill("#444");
  textSize(16);
  textStyle(NORMAL);
  text(
    "The first three visualizations are now implemented: weather layers, yearly factor patterns, and monthly factor comparison.",
    105,
    270,
    width - 210
  );

  fill("#F3EFE8");
  noStroke();
  rect(105, 350, width - 210, 52, 12);

  fill("#333");
  textSize(14);
  text(
    "Next: weekly weather lens + day-in-context detail view.",
    130,
    382
  );
}