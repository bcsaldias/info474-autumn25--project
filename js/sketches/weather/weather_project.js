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
  const canvas = createCanvas(windowWidth * 0.58, windowHeight * 0.82);
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
  resizeCanvas(windowWidth * 0.58, windowHeight * 0.82);
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

    const monthSummary = {
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
    };

    monthlyData.push(monthSummary);
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
  textSize(26);
  textStyle(BOLD);
  text(title, 34, 46, width - 68);

  textStyle(NORMAL);
  textSize(13);
  fill("#555");
  text(subtitle, 34, 78, width - 68);
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

  textSize(20);
  text(icon, x + w / 2, y + 22);

  fill(active ? "#2f276f" : "#333");
  textSize(11);
  textStyle(active ? BOLD : NORMAL);
  text(label, x + w / 2, y + h - 15);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function getValuesForFactor(factorKey) {
  const column = FACTORS[factorKey].column;
  return monthlyData.map(d => d[factorKey]);
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

function normalizeValue(value, minValue, maxValue) {
  if (maxValue === minValue) return 0.5;
  return (value - minValue) / (maxValue - minValue);
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
    "1  BEYOND THE FORECAST: WEATHER LAYERS",
    "A forecast shows numbers, but it does not always connect how those conditions overlap in daily life."
  );

  drawSectionNumber("1", 39, 43);

  const leftX = 42;
  const topY = 128;
  const leftW = 260;
  const cardH = 390;
  const arrowX = leftX + leftW + 34;
  const rightX = arrowX + 56;
  const rightW = width - rightX - 42;

  drawForecastCard(day, leftX, topY, leftW, cardH);
  drawConnectionArrow(arrowX, topY + cardH / 2);
  drawLayerStack(day, rightX, topY, rightW, cardH);
  drawVizOneTakeaway(topY + cardH + 28);
}

function pickExampleDay() {
  const target = weatherData.find(d => d.monthName === "Nov" && d.day === 15);
  if (target) return target;
  return weatherData[Math.min(304, weatherData.length - 1)];
}

function drawForecastCard(day, x, y, w, h) {
  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("WHAT THE FORECAST SHOWS", x, y - 12);

  drawCard(x, y, w, h, 16);

  fill("#F8FBFF");
  stroke("#B6CDE5");
  rect(x + 18, y + 25, w - 36, h - 50, 14);

  noStroke();
  fill("#333");
  textSize(13);
  textStyle(BOLD);
  text(day.date, x + 34, y + 58);

  textSize(36);
  textStyle(BOLD);
  fill("#222");
  text(`${Math.round(day.feelslike)}°F`, x + 34, y + 112);

  textSize(34);
  textAlign(CENTER, CENTER);
  text("🌧️", x + w - 68, y + 98);
  textAlign(LEFT, BASELINE);

  fill("#444");
  textSize(15);
  textStyle(NORMAL);
  text(day.conditions, x + 34, y + 145, w - 68);

  drawMiniDivider(x + 30, y + 165, x + w - 30, y + 165);

  const rows = [
    ["💧", "Rain", `${nf(day.precip, 1, 2)} in`],
    ["☁️", "Cloud", `${Math.round(day.cloudcover)}%`],
    ["〰️", "Wind", `${nf(day.windspeed, 1, 1)} mph`],
    ["🌅", "Sunrise", formatTime(day.sunrise)],
    ["🌇", "Sunset", formatTime(day.sunset)]
  ];

  let rowY = y + 205;

  for (let i = 0; i < rows.length; i++) {
    const [icon, label, value] = rows[i];

    fill("#333");
    textSize(15);
    text(icon, x + 34, rowY);

    fill("#555");
    textSize(13);
    text(label, x + 65, rowY);

    fill("#222");
    textAlign(RIGHT, BASELINE);
    text(value, x + w - 34, rowY);
    textAlign(LEFT, BASELINE);

    rowY += 37;
  }
}

function drawConnectionArrow(x, y) {
  stroke("#444");
  strokeWeight(2);
  line(x - 18, y, x + 18, y);
  line(x + 18, y, x + 8, y - 8);
  line(x + 18, y, x + 8, y + 8);
  strokeWeight(1);

  noStroke();
  fill("#555");
  textSize(12);
  textAlign(CENTER);
  text("but what does it connect?", x, y + 34);
  textAlign(LEFT);
}

function drawLayerStack(day, x, y, w, h) {
  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("WHAT IT DOESN'T CONNECT", x, y - 12);

  drawCard(x, y, w, h, 16);

  const layerKeys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];
  const layerH = 46;
  const gap = 10;
  const stackX = x + 28;
  const stackY = y + 35;
  const stackW = w - 56;

  for (let i = 0; i < layerKeys.length; i++) {
    const key = layerKeys[i];
    const info = FACTORS[key];
    const yy = stackY + i * (layerH + gap);
    const active = day.layers[key];
    const c = color(info.color);

    if (active) {
      fill(red(c), green(c), blue(c), 80);
      stroke(info.color);
    } else {
      fill(red(c), green(c), blue(c), 25);
      stroke(red(c), green(c), blue(c), 100);
    }

    rect(stackX, yy, stackW, layerH, 12);

    noStroke();
    fill("#222");
    textSize(18);
    textAlign(CENTER, CENTER);
    text(info.icon, stackX + 28, yy + layerH / 2);

    textAlign(LEFT, CENTER);
    textSize(13);
    textStyle(BOLD);
    fill("#222");
    text(info.label, stackX + 60, yy + layerH / 2 - 8);

    textStyle(NORMAL);
    textSize(11);
    fill("#555");
    text(info.description, stackX + 60, yy + layerH / 2 + 10);

    if (active) {
      fill("#2f276f");
      textSize(11);
      textStyle(BOLD);
      textAlign(RIGHT, CENTER);
      text("active", stackX + stackW - 18, yy + layerH / 2);
      textAlign(LEFT, BASELINE);
    }
  }

  fill("#444");
  textSize(13);
  textStyle(NORMAL);
  text(
    "A day can feel hard when several ordinary layers appear together, even if no single number looks extreme.",
    x + 30,
    y + h - 45,
    w - 60
  );
}

function drawVizOneTakeaway(y) {
  drawCard(45, y, width - 90, 70, 14);

  fill("#2f276f");
  textSize(15);
  textStyle(BOLD);
  text("Takeaway", 70, y + 28);

  fill("#333");
  textSize(14);
  textStyle(NORMAL);
  text(
    "The forecast is useful, but the campus experience comes from how rain, cloud cover, daylight, solar energy, wind, and temperature comfort overlap.",
    150,
    y + 28,
    width - 210
  );
}

/* -------------------------
   Section 2: Viz 2 Yearly factor patterns
-------------------------- */

function drawYearlyFactorPatternPanel() {
  drawMainTitle(
    "2  FACTOR PATTERNS ACROSS THE YEAR",
    "Choose a factor to explore how it changes through 2025."
  );

  drawSectionNumber("2", 39, 43);

  drawFactorButtons();
  drawYearlyLineChart();
  drawYearlyAnnotationCard();
}

function drawFactorButtons() {
  const keys = Object.keys(FACTORS);
  const startX = 48;
  const y = 122;
  const w = 88;
  const h = 66;
  const gap = 14;

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
  const y = 122;
  const w = 88;
  const h = 66;
  const gap = 14;

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
  const w = width - 280;
  const h = 260;

  drawCard(x - 25, y - 35, w + 50, h + 80, 16);

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
    y + h + 55
  );
}

function drawYearlyAnnotationCard() {
  const info = FACTORS[selectedFactor];

  const x = width - 195;
  const y = 250;
  const w = 155;
  const h = 230;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(15);
  textStyle(BOLD);
  text("EXAMPLE", x + 18, y + 32);

  fill("#222");
  textSize(20);
  textAlign(CENTER);
  text(info.icon, x + w / 2, y + 70);
  textAlign(LEFT);

  fill("#333");
  textSize(13);
  textStyle(BOLD);
  text(info.label, x + 18, y + 100);

  fill("#555");
  textSize(12);
  textStyle(NORMAL);
  text(getFactorExplanation(selectedFactor), x + 18, y + 124, w - 36);
}

/* -------------------------
   Section 3: Viz 3 Monthly comparison
-------------------------- */

function drawMonthlyComparisonPanel() {
  drawMainTitle(
    "3  COMPARE FACTORS WITHIN A MONTH",
    "Select a month to see how all six environmental factors look together."
  );

  drawSectionNumber("3", 39, 43);

  drawMonthButtons();
  drawMonthlyBars();
  drawMonthlyTakeaway();
}

function drawMonthButtons() {
  const startX = 50;
  const y = 120;
  const w = 52;
  const h = 30;
  const gap = 6;

  for (let i = 0; i < monthlyData.length; i++) {
    const month = monthlyData[i];
    const x = startX + i * (w + gap);
    const active = selectedMonth === i;

    fill(active ? "#4D3F8F" : "#FFFFFF");
    stroke(active ? "#4D3F8F" : "#D9D2C7");
    rect(x, y, w, h, 10);

    noStroke();
    fill(active ? "#FFFFFF" : "#333");
    textSize(11);
    textStyle(active ? BOLD : NORMAL);
    textAlign(CENTER, CENTER);
    text(month.monthName, x + w / 2, y + h / 2);
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function handleMonthSelection() {
  const startX = 50;
  const y = 120;
  const w = 52;
  const h = 30;
  const gap = 6;

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

  drawCard(50, 180, width - 100, 360, 18);

  fill("#222");
  noStroke();
  textSize(20);
  textStyle(BOLD);
  text(`${month.monthName} Weather Profile`, 80, 225);

  fill("#555");
  textSize(13);
  textStyle(NORMAL);
  text(
    "Each bar is normalized within its own factor, so this view compares relative intensity rather than using one combined score.",
    80,
    248,
    width - 160
  );

  const baseY = 455;
  const maxBarH = 145;
  const startX = 95;
  const gap = 92;
  const barW = 32;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];
    const x = startX + i * gap;

    const values = monthlyData.map(d => d[key]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const value = month[key];

    const normalized = normalizeValue(value, minVal, maxVal);
    const barH = map(normalized, 0, 1, 25, maxBarH);

    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text(info.icon, x + barW / 2, 295);

    fill("#333");
    textSize(12);
    textStyle(BOLD);
    text(info.shortLabel, x + barW / 2, 325);

    fill("#EFEAE2");
    stroke("#D9D2C7");
    rect(x, baseY - maxBarH, barW, maxBarH, 5);

    const c = color(info.color);
    fill(red(c), green(c), blue(c), 80);
    stroke(info.color);
    rect(x, baseY - barH, barW, barH, 5);

    noStroke();
    fill("#333");
    textSize(12);
    textStyle(NORMAL);
    text(`${nf(value, 1, 1)} ${info.unit}`, x + barW / 2, baseY + 22);

    let activeDays = month[`${key}ActiveDays`];
    if (activeDays !== undefined) {
      fill("#666");
      textSize(11);
      text(`${activeDays} active days`, x + barW / 2, baseY + 42);
    }
  }

  textAlign(LEFT, BASELINE);
}

function drawMonthlyTakeaway() {
  drawCard(50, 565, width - 100, 58, 14);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("Why this matters", 75, 590);

  fill("#333");
  textSize(13);
  textStyle(NORMAL);
  text(
    "Different combinations create different types of hard days. A month may feel difficult because of rain, grayness, short daylight, wind, or several of them together.",
    190,
    590,
    width - 250
  );
}

/* -------------------------
   Placeholder panels for later commits
-------------------------- */

function drawPlaceholderPanel() {
  const titles = {
    4: "4  BUILD YOUR WEEKLY WEATHER LENS",
    5: "5  DAY IN CONTEXT",
    6: "TAKEAWAY"
  };

  drawMainTitle(
    titles[activeSection] || "NEXT VIEW",
    "This panel is intentionally left as a placeholder for the next implementation commit."
  );

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