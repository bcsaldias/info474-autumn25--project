let weatherTable;
let weatherData = [];
let monthlyData = [];

let activeSection = 0;
let selectedFactor = "rain";
let selectedMonth = 10; // November
let currentCanvasHeight = 760;
let selectedWeekStartIndex = -1;
let weeklySelectedFactors = ["rain", "cloud", "daylight"];
let selectedWeeklyDayIndex = 0;
let selectedContextDayIndex = -1;

const VIZ_HEIGHTS = {
  1: 860,
  2: 980,
  3: 760,
  4: 900,
  5: 900
};

let selectedWeekStart = 0;
let selectedDayGlobalIndex = 0;

let selectedLayers = {
  rain: false,
  cloud: false,
  daylight: false,
  solar: false,
  wind: false,
  temp: false
};

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
    description: "Outside a prototype comfort range"
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

  currentCanvasHeight = getTargetCanvasHeight();

  const canvas = createCanvas(canvasW, currentCanvasHeight);
  canvas.parent("vis");

  updateVisContainerHeight();

  textFont("Arial");

  processWeatherData();
  buildMonthlyData();
  setupSectionObserver();
}

function draw() {
  resizeCanvasForActiveSection();

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
  } else if (activeSection === 4) {
    drawWeeklyWeatherLensPanel();
  } else if (activeSection === 5) {
    drawDayInContextPanel();
  } else if (activeSection === 6) {
    drawTakeawayPanel();
  } else {
    drawPlaceholderPanel();
  }
}

function windowResized() {
  const visContainer = document.getElementById("vis");
  const canvasW = Math.max(720, visContainer.clientWidth);

  currentCanvasHeight = getTargetCanvasHeight();

  resizeCanvas(canvasW, currentCanvasHeight);
  updateVisContainerHeight();
}

function mousePressed() {
  if (activeSection === 2) {
    handleFactorSelection();
  }

  if (activeSection === 3) {
    handleMonthSelection();
  }

  if (activeSection === 4) {
    handleWeeklyLensInteraction();
  }

  if (activeSection === 5) {
    handleDayContextInteraction();
  }
}

/* -------------------------
   Canvas sizing helpers
-------------------------- */

function getTargetCanvasHeight() {
  return VIZ_HEIGHTS[activeSection] || 760;
}

function updateVisContainerHeight() {
  const visContainer = document.getElementById("vis");

  if (visContainer) {
    visContainer.style.minHeight = `${currentCanvasHeight}px`;
  }
}

function resizeCanvasForActiveSection() {
  const targetHeight = getTargetCanvasHeight();
  const visContainer = document.getElementById("vis");
  const targetWidth = Math.max(720, visContainer ? visContainer.clientWidth : width);

  if (currentCanvasHeight !== targetHeight || width !== targetWidth) {
    currentCanvasHeight = targetHeight;
    resizeCanvas(targetWidth, currentCanvasHeight);
    updateVisContainerHeight();
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

  const str = timeText.toString().trim();

  // Handles values like "2025-11-15T07:18:00" or "2025-11-15 07:18:00"
  const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return str;

  let hour = Number(timeMatch[1]);
  const minute = timeMatch[2];
  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${suffix}`;
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
  background("#FAF7F0");

  const cardX = 64;
  const cardY = 46;
  const cardW = width - 128;
  const cardH = 520;

  drawCard(cardX, cardY, cardW, cardH, 24);

  // Header
  fill("#222");
  noStroke();
  textStyle(BOLD);
  textSize(30);
  text("BEYOND THE FORECAST", cardX + 38, cardY + 62);

  fill("#555");
  textStyle(NORMAL);
  textSize(14);
  text(
    "A roadmap for reading Seattle weather as layers, not as one score.",
    cardX + 38,
    cardY + 90
  );

  drawOpeningRoadmap(cardX + 38, cardY + 128, cardW - 76, 320);

  // Bottom takeaway strip
  const stripX = cardX + 38;
  const stripY = cardY + cardH - 70;
  const stripW = cardW - 76;
  const stripH = 44;

  fill("#F3EFE8");
  noStroke();
  rect(stripX, stripY, stripW, stripH, 12);

  fill("#333");
  textSize(13.5);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(
    "Not a score. Not one cause. More layers, more context.",
    stripX + stripW / 2,
    stripY + stripH / 2
  );

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawOpeningRoadmap(x, y, w, h) {
  const sectionH = 86;
  const gap = 24;

  drawRoadmapSection(
    x,
    y,
    w,
    sectionH,
    "1",
    "Forecast numbers",
    "A normal forecast gives separate measurements.",
    ["55°F", "0.01 in rain", "99% cloud", "15.6 mph wind", "sunrise / sunset"]
  );

  drawDownArrow(x + w / 2, y + sectionH + 6);

  drawRoadmapSection(
    x,
    y + sectionH + gap,
    w,
    sectionH,
    "2",
    "Weather layers",
    "We translate those measurements into visible conditions.",
    ["Rain", "Cloud", "Daylight", "Solar", "Wind", "Temp comfort"]
  );

  drawDownArrow(x + w / 2, y + sectionH * 2 + gap + 6);

  drawRoadmapSection(
    x,
    y + sectionH * 2 + gap * 2,
    w,
    sectionH,
    "3",
    "Explore context",
    "Readers move from broad patterns to one specific day.",
    ["Year", "Month", "Week", "Day"]
  );
}

function drawRoadmapSection(x, y, w, h, num, title, subtitle, items) {
  fill("#FFFFFF");
  stroke("#DED6CA");
  strokeWeight(1.2);
  rect(x, y, w, h, 16);

  // Number circle
  fill("#4D3F8F");
  noStroke();
  circle(x + 28, y + 30, 28);

  fill("#FFFFFF");
  textSize(13);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(num, x + 28, y + 30);

  textAlign(LEFT, BASELINE);

  // Left text area
  fill("#2f276f");
  textSize(14.5);
  textStyle(BOLD);
  text(title, x + 52, y + 28);

  fill("#555");
  textSize(11.2);
  textStyle(NORMAL);
  text(subtitle, x + 52, y + 48, 260);

  // Pill area
  const pillAreaX = x + 360;
  const pillAreaY = y + 18;
  const pillAreaW = w - 390;

  let currentX = pillAreaX;
  let currentY = pillAreaY;

  const pillH = 28;
  const pillGap = 8;
  const rowGap = 8;

  for (let i = 0; i < items.length; i++) {
    const label = items[i];
    const pillW = getRoadmapPillWidth(label);

    // Wrap to second row if it would go outside the card
    if (currentX + pillW > pillAreaX + pillAreaW) {
      currentX = pillAreaX;
      currentY += pillH + rowGap;
    }

    fill("#FBFAF6");
    stroke("#DED6CA");
    strokeWeight(1);
    rect(currentX, currentY, pillW, pillH, 9);

    noStroke();
    fill("#333");
    textSize(10);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(label, currentX + pillW / 2, currentY + pillH / 2);

    currentX += pillW + pillGap;
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function getRoadmapPillWidth(label) {
  if (label.length <= 4) return 58;
  if (label.length <= 7) return 72;
  if (label.length <= 10) return 94;
  if (label.length <= 14) return 116;
  return 126;
}

function drawDownArrow(x, y) {
  stroke("#8B8175");
  strokeWeight(2);
  line(x, y, x, y + 16);
  line(x, y + 16, x - 6, y + 10);
  line(x, y + 16, x + 6, y + 10);
  noStroke();
}

function drawOpeningDataTransformation(x, y, w, h) {
  const colGap = 28;
  const colW = (w - colGap * 2 - 60) / 3;

  const col1X = x + 30;
  const col2X = col1X + colW + colGap + 30;
  const col3X = col2X + colW + colGap + 30;

  const topY = y + 42;

  drawOpeningColumn(
    col1X,
    topY,
    colW,
    "1",
    "Forecast numbers",
    [
      "55°F temperature",
      "0.01 in rain",
      "99% cloud cover",
      "15.6 mph wind",
      "Sunrise / sunset"
    ]
  );

  drawOpeningColumn(
    col2X,
    topY,
    colW,
    "2",
    "Weather layers",
    [
      "💧 Rain",
      "☁️ Cloud cover",
      "☀️ Daylight",
      "🌤️ Solar energy",
      "〰️ Wind",
      "🌡️ Temp comfort"
    ]
  );

  drawOpeningColumn(
    col3X,
    topY,
    colW,
    "3",
    "Explore context",
    [
      "Yearly patterns",
      "Monthly profile",
      "Weekly lens",
      "Day in context"
    ]
  );

  drawOpeningArrow(col1X + colW + 10, y + h / 2);
  drawOpeningArrow(col2X + colW + 10, y + h / 2);
}

function drawOpeningColumn(x, y, w, num, title, items) {
  // Number circle
  fill("#4D3F8F");
  noStroke();
  circle(x + 15, y - 4, 28);

  fill("#FFFFFF");
  textSize(13);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(num, x + 15, y - 4);

  textAlign(LEFT, BASELINE);

  fill("#2f276f");
  textSize(15);
  textStyle(BOLD);
  text(title, x + 38, y + 2);

  const listY = y + 34;

  for (let i = 0; i < items.length; i++) {
    const itemY = listY + i * 34;

    fill("#FBFAF6");
    stroke("#DED6CA");
    strokeWeight(1);
    rect(x, itemY, w, 26, 8);

    noStroke();
    fill("#333");
    textSize(11.5);
    textStyle(NORMAL);
    text(items[i], x + 12, itemY + 17);
  }
}

function drawOpeningArrow(x, y) {
  stroke("#8B8175");
  strokeWeight(2);
  line(x, y, x + 32, y);

  line(x + 32, y, x + 24, y - 7);
  line(x + 32, y, x + 24, y + 7);

  noStroke();
}

/* -------------------------
   Section 1: Viz 1 Weather Layers
-------------------------- */

function drawWeatherLayersPanel() {
  const day = pickExampleDay();

  drawMainTitle(
    "BEYOND THE FORECAST: WEATHER LAYERS",
    "A forecast shows useful numbers, but it does not show how those conditions layer together during a campus day."
  );

  drawSectionNumber("1", 38, 43);

  const margin = 46;
  const topY = 130;
  const panelH = height - 250;

  // Make the left card slightly narrower and give the arrow more space.
  const forecastW = Math.min(260, width * 0.28);
  const arrowW = 120;
  const gap = 30;

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

function getForecastIcon(day) {
  const condition = (day.conditions || "").toLowerCase();

  if (condition.includes("rain")) return "🌧️";
  if (condition.includes("cloud") || condition.includes("overcast")) return "☁️";
  if (condition.includes("clear")) return "☀️";
  if (condition.includes("snow")) return "❄️";
  if (condition.includes("fog")) return "🌫️";

  return "🌤️";
}

function drawForecastCard(day, x, y, w, h) {
  fill("#2f276f");
  noStroke();
  textSize(13);
  textStyle(BOLD);
  text("WHAT THE FORECAST SHOWS", x, y - 12);

  drawCard(x, y, w, h, 16);

  const innerX = x + 18;
  const innerY = y + 24;
  const innerW = w - 36;
  const innerH = h - 48;

  fill("#F8FBFF");
  stroke("#B6CDE5");
  strokeWeight(1.2);
  rect(innerX, innerY, innerW, innerH, 14);
  strokeWeight(1);

  noStroke();

  fill("#333");
  textSize(12);
  textStyle(BOLD);
  text(day.date, innerX + 18, innerY + 38);

  textSize(34);
  textStyle(BOLD);
  fill("#222");
  text(`${Math.round(day.feelslike)}°F`, innerX + 18, innerY + 90);

  textSize(30);
  textAlign(CENTER, CENTER);
  text(getForecastIcon(day), innerX + innerW - 42, innerY + 72);
  textAlign(LEFT, BASELINE);

  fill("#444");
  textSize(13.5);
  textStyle(NORMAL);
  text(day.conditions, innerX + 18, innerY + 124, innerW - 36);

  drawMiniDivider(innerX + 14, innerY + 142, innerX + innerW - 14, innerY + 142);

  const rows = [
    ["💧", "Rain", `${nf(day.precip, 1, 2)} in`],
    ["☁️", "Cloud cover", `${Math.round(day.cloudcover)}%`],
    ["〰️", "Wind", `${nf(day.windspeed, 1, 1)} mph`],
    ["🌅", "Sunrise", formatTime(day.sunrise)],
    ["🌇", "Sunset", formatTime(day.sunset)],
    ["🌡️", "Feels like", `${nf(day.feelslike, 1, 1)}°F`]
  ];

  let rowY = innerY + 178;

  for (let i = 0; i < rows.length; i++) {
    const [icon, label, value] = rows[i];

    fill("#333");
    textSize(12.5);
    text(icon, innerX + 18, rowY);

    fill("#555");
    textSize(11.5);
    text(label, innerX + 48, rowY);

    fill("#222");
    textAlign(RIGHT, BASELINE);
    textSize(11.5);
    text(value, innerX + innerW - 18, rowY);
    textAlign(LEFT, BASELINE);

    rowY += 28;
  }

  const noteH = 44;
  const noteY = innerY + innerH - noteH - 14;

  fill("#F3EFE8");
  noStroke();
  rect(innerX + 14, noteY, innerW - 28, noteH, 10);

  fill("#555");
  textSize(10.6);
  textStyle(NORMAL);
  text(
    "Useful numbers, but still shown as separate pieces.",
    innerX + 26,
    noteY + 17,
    innerW - 52
  );
}

function drawConnectionArrow(x, y) {
  // Main arrow
  stroke("#555");
  strokeWeight(2);
  line(x - 34, y, x + 34, y);
  line(x + 34, y, x + 22, y - 9);
  line(x + 34, y, x + 22, y + 9);
  strokeWeight(1);

  // Small label above arrow
  noStroke();
  fill("#F3EFE8");
  rect(x - 42, y - 48, 84, 28, 9);

  fill("#555");
  textSize(10.5);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("connect", x, y - 34);

  // Small label below arrow
  fill("#F3EFE8");
  noStroke();
  rect(x - 42, y + 22, 84, 28, 9);

  fill("#555");
  textSize(10.5);
  textStyle(BOLD);
  text("as layers", x, y + 36);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawLayerStack(day, x, y, w, h) {
  fill("#2f276f");
  noStroke();
  textSize(13);
  textStyle(BOLD);
  text("WHAT THE FORECAST DOESN'T CONNECT", x, y - 12);

  drawCard(x, y, w, h, 16);

  const layerKeys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];
  const innerX = x + 26;
  const innerY = y + 30;
  const innerW = w - 52;

  fill("#444");
  noStroke();
  textSize(11.4);
  textStyle(NORMAL);
  text(
    "Each row is one weather layer. Present means the layer crossed our prototype campus-experience threshold.",
    innerX,
    innerY,
    innerW
  );

  // Make the bottom note taller and give the layer list less vertical space.
  const noteH = 62;
  const listY = innerY + 48;
  const noteY = y + h - noteH - 18;
  const listBottom = noteY - 14;

  const availableH = listBottom - listY;
  const gap = 7;
  const layerH = (availableH - gap * (layerKeys.length - 1)) / layerKeys.length;

  for (let i = 0; i < layerKeys.length; i++) {
    const key = layerKeys[i];
    const info = FACTORS[key];
    const yy = listY + i * (layerH + gap);
    const active = day.layers[key];
    const c = color(info.color);

    if (active) {
      fill(red(c), green(c), blue(c), 68);
      stroke(info.color);
      strokeWeight(1.4);
    } else {
      fill("#FBFAF6");
      stroke("#DED6CA");
      strokeWeight(1.1);
    }

    rect(innerX, yy, innerW, layerH, 11);
    strokeWeight(1);
    noStroke();

    fill(active ? "#222" : "#888");
    textSize(16);
    textAlign(CENTER, CENTER);
    text(info.icon, innerX + 30, yy + layerH / 2);

    textAlign(LEFT, CENTER);

    fill(active ? "#222" : "#666");
    textSize(12.2);
    textStyle(BOLD);
    text(info.label, innerX + 58, yy + layerH / 2 - 10);

    fill(active ? "#444" : "#777");
    textSize(10.2);
    textStyle(NORMAL);
    text(getLayerActualValue(day, key), innerX + 58, yy + layerH / 2 + 8);

    const badgeW = 92;
    const badgeH = 24;
    const badgeX = innerX + innerW - badgeW - 14;
    const badgeY = yy + layerH / 2 - badgeH / 2;

    if (active) {
      fill(red(c), green(c), blue(c), 120);
      stroke(info.color);
      rect(badgeX, badgeY, badgeW, badgeH, 999);

      noStroke();
      fill("#222");
      textSize(9.8);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text("layer present", badgeX + badgeW / 2, badgeY + badgeH / 2);
    } else {
      fill("#FFFFFF");
      stroke("#D9D2C7");
      rect(badgeX, badgeY, badgeW, badgeH, 999);

      noStroke();
      fill("#777");
      textSize(9.8);
      textStyle(NORMAL);
      textAlign(CENTER, CENTER);
      text("not present", badgeX + badgeW / 2, badgeY + badgeH / 2);
    }

    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
  }

  // Bottom note box
  fill("#F3EFE8");
  noStroke();
  rect(innerX, noteY, innerW, noteH, 12);

  fill("#444");
  textSize(10.8);
  textStyle(NORMAL);
  textLeading(15);
  text(
    "Temperature is treated as comfort. It is only flagged when it is too cold or too hot, not simply when the number is higher.",
    innerX + 16,
    noteY + 18,
    innerW - 32
  );

  textLeading(13);
}

function getLayerActualValue(day, key) {
  const values = {
    rain: `today: ${nf(day.precip, 1, 2)} in precipitation`,
    cloud: `today: ${Math.round(day.cloudcover)}% cloud cover`,
    daylight: `today: ${nf(day.daylightHours, 1, 1)} hrs daylight`,
    solar: `today: ${nf(day.solarenergy, 1, 1)} MJ/m² solar energy`,
    wind: `today: ${nf(day.windspeed, 1, 1)} mph wind`,
    temp: `today: feels like ${nf(day.feelslike, 1, 1)}°F`
  };

  return values[key];
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
  textSize(12.3);
  textStyle(NORMAL);
  text(
    "The forecast is useful, but the campus experience comes from how weather layers appear together. This view keeps those layers visible instead of turning them into one score.",
    x + 120,
    y + 21,
    w - 150
  );
}

/* -------------------------
   Section 2: Viz 2 Yearly factor patterns
-------------------------- */

function drawYearlyFactorPatternPanel() {
  drawMainTitle(
    "FACTOR PATTERNS ACROSS THE YEAR",
    "Choose one weather layer to see how it changes through 2025. This view shows patterns, not a weather difficulty score."
  );

  drawSectionNumber("2", 38, 43);

  drawFactorButtons();
  drawYearlyLineChart();
  drawYearlyAnnotationCard();
}

function drawFactorButtons() {
  const keys = Object.keys(FACTORS);
  const startX = 52;
  const y = 118;
  const w = 82;
  const h = 62;
  const gap = 10;

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
  const startX = 52;
  const y = 118;
  const w = 82;
  const h = 62;
  const gap = 10;

  for (let i = 0; i < keys.length; i++) {
    const x = startX + i * (w + gap);

    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
      selectedFactor = keys[i];
    }
  }
}

function getYearlyMetricInfo(factorKey) {
  const info = FACTORS[factorKey];

  if (factorKey === "temp") {
    return {
      title: "Temperature Comfort Days Across 2025",
      subtitle: "Monthly count of days outside the prototype comfort range",
      yLabel: "Flagged days",
      unit: "days",
      valueKey: "tempActiveDays",
      explanation:
        "Temperature is shown as comfort days, not average temperature. A month is higher when more days fall outside the prototype comfort range.",
      readingNote:
        "For temperature, higher means more days outside the comfort range, not simply hotter weather."
    };
  }

  const metricMap = {
    rain: {
      title: "Rain Across 2025",
      subtitle: "Monthly average precipitation",
      yLabel: "Average precipitation",
      unit: "in/day",
      valueKey: "rain"
    },
    cloud: {
      title: "Cloud Cover Across 2025",
      subtitle: "Monthly average cloud cover",
      yLabel: "Average cloud cover",
      unit: "%",
      valueKey: "cloud"
    },
    daylight: {
      title: "Daylight Across 2025",
      subtitle: "Monthly average daylight hours",
      yLabel: "Daylight",
      unit: "hrs/day",
      valueKey: "daylight"
    },
    solar: {
      title: "Solar Energy Across 2025",
      subtitle: "Monthly average solar energy",
      yLabel: "Solar energy",
      unit: "MJ/m²",
      valueKey: "solar"
    },
    wind: {
      title: "Wind Across 2025",
      subtitle: "Monthly average wind speed",
      yLabel: "Wind speed",
      unit: "mph",
      valueKey: "wind"
    }
  };

  return {
    ...metricMap[factorKey],
    explanation: getYearlyAnnotationText(factorKey),
    readingNote:
      "This line uses the selected factor’s real unit, so the chart shows seasonal pattern rather than one combined score."
  };
}

function getYearlyValue(monthData, factorKey) {
  const metric = getYearlyMetricInfo(factorKey);
  return monthData[metric.valueKey];
}

function formatYearlyValue(value, factorKey) {
  const metric = getYearlyMetricInfo(factorKey);

  if (factorKey === "rain") {
    return `${nf(value, 1, 2)} ${metric.unit}`;
  }

  if (factorKey === "cloud") {
    return `${nf(value, 1, 0)}%`;
  }

  if (factorKey === "daylight") {
    return `${nf(value, 1, 1)} hrs`;
  }

  if (factorKey === "solar") {
    return `${nf(value, 1, 1)} MJ/m²`;
  }

  if (factorKey === "wind") {
    return `${nf(value, 1, 1)} mph`;
  }

  if (factorKey === "temp") {
    return `${nf(value, 1, 0)} days`;
  }

  return `${nf(value, 1, 1)} ${metric.unit}`;
}

function drawYearlyLineChart() {
  const info = FACTORS[selectedFactor];
  const metric = getYearlyMetricInfo(selectedFactor);

  const chartX = 62;
  const chartY = 225;
  const chartW = width - 315;
  const chartH = Math.min(315, height - 395);

  // Make the main chart card taller so the bottom note stays inside the box
  const cardX = chartX - 22;
  const cardY = chartY - 42;
  const cardW = chartW + 44;
  const cardH = chartH + 190;

  drawCard(cardX, cardY, cardW, cardH, 18);

  fill("#222");
  noStroke();
  textSize(18);
  textStyle(BOLD);
  text(metric.title, chartX, chartY - 16);

  fill("#555");
  textSize(12.5);
  textStyle(NORMAL);
  text(metric.subtitle, chartX, chartY + 5);

  const values = monthlyData.map(d => getYearlyValue(d, selectedFactor));
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  if (selectedFactor === "temp") {
    minVal = 0;
    maxVal = Math.max(1, maxVal);
  }

  const range = maxVal - minVal || 1;
  const paddedMin = selectedFactor === "temp" ? 0 : minVal - range * 0.08;
  const paddedMax = maxVal + range * 0.08;

  const plotX = chartX + 54;
  const plotY = chartY + 56;
  const plotW = chartW - 78;
  const plotH = chartH - 28;

  // Grid and y-axis labels
  stroke("#E7E0D6");
  strokeWeight(1);

  for (let i = 0; i <= 4; i++) {
    const gy = plotY + map(i, 0, 4, 0, plotH);
    line(plotX, gy, plotX + plotW, gy);

    const labelValue = map(i, 0, 4, paddedMax, paddedMin);
    noStroke();
    fill("#666");
    textSize(10.5);
    textAlign(RIGHT, CENTER);
    text(formatAxisValue(labelValue, selectedFactor), plotX - 10, gy);
    stroke("#E7E0D6");
  }

  for (let i = 0; i < monthlyData.length; i++) {
    const gx = map(i, 0, monthlyData.length - 1, plotX, plotX + plotW);
    line(gx, plotY, gx, plotY + plotH);
  }

  // Y-axis label
  noStroke();
  fill("#555");
  textSize(10.5);
  textAlign(CENTER, CENTER);
  push();
  translate(chartX + 8, plotY + plotH / 2);
  rotate(-HALF_PI);
  text(`${metric.yLabel} (${metric.unit})`, 0, 0);
  pop();

  // Line
  noFill();
  stroke(info.color);
  strokeWeight(3);
  beginShape();

  for (let i = 0; i < monthlyData.length; i++) {
    const value = getYearlyValue(monthlyData[i], selectedFactor);
    const px = map(i, 0, monthlyData.length - 1, plotX, plotX + plotW);
    const py = map(value, paddedMin, paddedMax, plotY + plotH, plotY);
    vertex(px, py);
  }

  endShape();
  strokeWeight(1);

  // Points and month labels
  for (let i = 0; i < monthlyData.length; i++) {
    const value = getYearlyValue(monthlyData[i], selectedFactor);
    const px = map(i, 0, monthlyData.length - 1, plotX, plotX + plotW);
    const py = map(value, paddedMin, paddedMax, plotY + plotH, plotY);

    fill("#FFFFFF");
    stroke(info.color);
    strokeWeight(2);
    circle(px, py, 9);

    noStroke();
    fill("#555");
    textSize(11);
    textAlign(CENTER, CENTER);
    text(monthlyData[i].monthName[0], px, plotY + plotH + 24);
  }

  // Observed range inside the chart card
  textAlign(LEFT, BASELINE);
  fill("#555");
  noStroke();
  textSize(11.5);
  textStyle(NORMAL);
  text(
    `Observed range: ${formatYearlyValue(minVal, selectedFactor)} – ${formatYearlyValue(maxVal, selectedFactor)}`,
    plotX,
    plotY + plotH + 55
  );

  // Bottom note inside the chart card
  const noteX = plotX;
  const noteY = plotY + plotH + 72;
  const noteW = plotW;
  const noteH = 42;

  fill("#F3EFE8");
  noStroke();
  rect(noteX, noteY, noteW, noteH, 10);

  fill("#444");
  textSize(11.5);
  textStyle(NORMAL);
  textLeading(15);
  text(
    metric.readingNote,
    noteX + 16,
    noteY + 12,
    noteW - 32
  );

  textLeading(13);
  textAlign(LEFT, BASELINE);
}

function formatAxisValue(value, factorKey) {
  if (factorKey === "rain") {
    return nf(value, 1, 2);
  }

  if (factorKey === "cloud") {
    return `${nf(value, 1, 0)}%`;
  }

  if (factorKey === "daylight") {
    return nf(value, 1, 1);
  }

  if (factorKey === "solar") {
    return nf(value, 1, 1);
  }

  if (factorKey === "wind") {
    return nf(value, 1, 1);
  }

  if (factorKey === "temp") {
    return nf(value, 1, 0);
  }

  return nf(value, 1, 1);
}

function drawYearlyAnnotationCard() {
  const info = FACTORS[selectedFactor];
  const metric = getYearlyMetricInfo(selectedFactor);

  const x = width - 225;
  const y = 235;
  const w = 180;
  const h = 345;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(15.5);
  textStyle(BOLD);
  text("WHAT TO NOTICE", x + 18, y + 30);

  fill("#222");
  textSize(28);
  textAlign(CENTER);
  text(info.icon, x + w / 2, y + 75);
  textAlign(LEFT);

  fill("#333");
  textSize(15);
  textStyle(BOLD);
  text(info.label, x + 18, y + 112);

  fill("#555");
  textSize(12.5);
  textStyle(NORMAL);
  textLeading(16);
  text(metric.explanation, x + 18, y + 138, w - 36);

  drawMiniDivider(x + 18, y + h - 100, x + w - 18, y + h - 100);

  fill("#2f276f");
  textSize(12.5);
  textStyle(BOLD);
  text("Data shown", x + 18, y + h - 70);

  fill("#555");
  textSize(12.3);
  textStyle(NORMAL);
  text(
    `${metric.yLabel}, measured in ${metric.unit}.`,
    x + 18,
    y + h - 48,
    w - 36
  );

  textLeading(13);
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function getYearlyAnnotationText(factorKey) {
  const explanations = {
    rain:
      "Rain is shown as monthly average precipitation. This lets readers see that rainfall is seasonal rather than equally high all year.",
    cloud:
      "Cloud cover is shown as monthly average percent. It helps explain gray days even when precipitation is not heavy.",
    daylight:
      "Daylight is shown in hours. This factor has a strong seasonal rhythm and changes how morning and evening routines feel.",
    solar:
      "Solar energy shows the strength of sunlight reaching the city. It can stay low even on days that are not actively rainy.",
    wind:
      "Wind is shown as monthly average wind speed. It matters for walking, waiting outside, and moving between buildings."
  };

  return explanations[factorKey] || "";
}

/* -------------------------
   Section 3: Viz 3 Monthly Weather Layer Profile
-------------------------- */

function drawMonthlyComparisonPanel() {
  drawMainTitle(
    "MONTHLY WEATHER LAYER PROFILE",
    "Compare one month across six weather layers by how often each layer was present."
  );

  drawSectionNumber("3", 38, 43);

  drawMonthButtons();
  drawMonthlyFlaggedDaysProfile();
  drawMonthlyAverageSummary();
  drawMonthlySelectedInsight();
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
    strokeWeight(1);
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

function drawMonthlyFlaggedDaysProfile() {
  const month = monthlyData[selectedMonth] || monthlyData[0];
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  const chartX = 54;
  const chartY = 175;
  const chartW = width - 108;
  const chartH = 350;

  drawCard(chartX, chartY, chartW, chartH, 18);

  fill("#222");
  noStroke();
  textSize(20);
  textStyle(BOLD);
  text(`${month.monthName} Weather Layer Profile`, chartX + 34, chartY + 42);

  fill("#555");
  textSize(12.2);
  textStyle(NORMAL);
  text(
    "Bars show how many days each layer crossed its prototype threshold in this month.",
    chartX + 34,
    chartY + 74,
    chartW - 68
  );

  const plotX = chartX + 82;
  const plotY = chartY + 165;
  const plotW = chartW - 145;
  const plotH = 135;

  const maxDays = getDaysInSelectedMonth(month);
  const maxAxis = max(1, maxDays);

  drawFlaggedDaysAxis(plotX, plotY, plotH, maxAxis, plotW);

  const usableW = plotW - 40;
  const gap = usableW / keys.length;
  const barW = 58;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];

    const centerX = plotX + 42 + i * gap + gap / 2;
    const barX = centerX - barW / 2;

    const flaggedDays = getMonthlyFlaggedDays(month, key);
    const barH = map(flaggedDays, 0, maxAxis, 0, plotH);

    const c = color(info.color);

    // icon
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(22);
    text(info.icon, centerX, plotY - 58);

    // label
    fill("#333");
    textSize(11.5);
    textStyle(BOLD);
    text(info.shortLabel, centerX, plotY - 28);

    // background bar
    fill("#EFEAE2");
    stroke("#D9D2C7");
    strokeWeight(1);
    rect(barX, plotY, barW, plotH, 8);

    // filled bar
    fill(red(c), green(c), blue(c), 88);
    stroke(info.color);
    strokeWeight(1.6);
    rect(barX, plotY + plotH - barH, barW, barH, 8);

    // move these UP so they stay inside the card
    noStroke();
    fill("#222");
    textSize(18);
    textStyle(BOLD);
    text(`${flaggedDays}`, centerX, plotY + plotH + 22);

    fill("#666");
    textSize(10.5);
    textStyle(NORMAL);
    text("days", centerX, plotY + plotH + 40);
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawFlaggedDaysAxis(x, y, h, maxDays, plotW) {
  stroke("#D8D0C8");
  strokeWeight(1.2);
  line(x, y, x, y + h);

  const ticks = [0, Math.round(maxDays / 2), maxDays];

  for (let i = 0; i < ticks.length; i++) {
    const value = ticks[i];
    const ty = map(value, 0, maxDays, y + h, y);

    stroke("#E8E0D7");
    strokeWeight(1);
    line(x, ty, x + plotW, ty);

    noStroke();
    fill("#666");
    textSize(10.5);
    textAlign(RIGHT, CENTER);
    text(value, x - 12, ty);
  }

  push();
  translate(x - 50, y + h / 2);
  rotate(-HALF_PI);
  fill("#555");
  textSize(10.8);
  textAlign(CENTER, CENTER);
  text("Flagged days", 0, 0);
  pop();

  textAlign(LEFT, BASELINE);
}

function drawMonthlyAverageSummary() {
  const month = monthlyData[selectedMonth] || monthlyData[0];
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  const x = 54;
  const y = 545;
  const w = width - 108;
  const h = 78;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Monthly averages", x + 24, y + 29);

  fill("#555");
  textSize(10.8);
  textStyle(NORMAL);
  text("Raw values behind the flagged-day view", x + 24, y + 50);

  const startX = x + 230;
  const usableW = w - 260;
  const gap = usableW / keys.length;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];
    const centerX = startX + i * gap + gap / 2;

    textAlign(CENTER, BASELINE);

    fill("#333");
    textSize(15);
    text(info.icon, centerX, y + 22);

    fill("#333");
    textSize(10.5);
    textStyle(BOLD);
    text(info.shortLabel, centerX, y + 42);

    fill("#555");
    textSize(10.2);
    textStyle(NORMAL);
    text(getMonthlyAverageLabel(month, key), centerX, y + 60);
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawMonthlySelectedInsight() {
  const month = monthlyData[selectedMonth] || monthlyData[0];
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  let highestKey = keys[0];
  let highestValue = getMonthlyFlaggedDays(month, highestKey);

  for (let i = 1; i < keys.length; i++) {
    const value = getMonthlyFlaggedDays(month, keys[i]);
    if (value > highestValue) {
      highestValue = value;
      highestKey = keys[i];
    }
  }

  const info = FACTORS[highestKey];

  // moved upward
  const x = 54;
  const y = 655;
  const w = width - 108;
  const h = 64;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("What stands out", x + 24, y + 26);

  fill("#333");
  textSize(12.1);
  textStyle(NORMAL);
  text(
    `${info.label} appears most often in ${month.monthName}, with ${highestValue} flagged days. This suggests which layer showed up most frequently in this month.`,
    x + 160,
    y + 22,
    w - 190
  );
}

function drawMonthlyMethodNote() {
  const x = 54;
  const y = 735;
  const w = width - 108;
  const h = 118;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("How flagged days are defined", x + 24, y + 30);

  fill("#555");
  textSize(11.1);
  textStyle(NORMAL);
  text(
    "A flagged day means that a layer crossed our prototype campus-experience threshold. These thresholds are used for exploration, not as a universal weather score.",
    x + 24,
    y + 52,
    330
  );

  const rules = [
    ["💧", "Rain", "precip ≥ 0.05 in"],
    ["☁️", "Cloud", "cloud cover ≥ 75%"],
    ["☀️", "Daylight", "daylight ≤ 9.5 hrs"],
    ["🌤️", "Solar", "solar energy ≤ 4 MJ/m²"],
    ["〰️", "Wind", "wind speed ≥ 12 mph"],
    ["🌡️", "Temp Comfort", "feels like ≤45°F or ≥78°F"]
  ];

  const gridX = x + 390;
  const gridY = y + 24;
  const cardW = (w - 430) / 3;
  const cardH = 34;
  const rowGap = 12;

  for (let i = 0; i < rules.length; i++) {
    const [icon, label, rule] = rules[i];

    const col = i % 3;
    const row = Math.floor(i / 3);

    const cx = gridX + col * (cardW + 12);
    const cy = gridY + row * (cardH + rowGap);

    fill("#F3EFE8");
    noStroke();
    rect(cx, cy, cardW, cardH, 10);

    fill("#333");
    textSize(10.6);
    textStyle(BOLD);
    text(`${icon} ${label}`, cx + 12, cy + 13);

    fill("#666");
    textSize(10);
    textStyle(NORMAL);
    text(rule, cx + 12, cy + 27);
  }
}

function drawMonthlyTakeaway() {
  const x = 54;
  const y = 870;
  const w = width - 108;
  const h = 60;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Why this matters", x + 28, y + 24);

  fill("#333");
  textSize(12.2);
  textStyle(NORMAL);
  text(
    "This profile separates frequency from raw intensity. A month can stand out because one layer appears often, even if no single weather number looks extreme.",
    x + 190,
    y + 23,
    w - 225
  );
}

function getDaysInSelectedMonth(month) {
  if (!weatherData || weatherData.length === 0) return 31;

  const rows = weatherData.filter(d => d.monthName === month.monthName);
  return rows.length || 31;
}

function getMonthlyFlaggedDays(month, key) {
  if (!month) return 0;

  if (key === "temp") {
    return Number(
      month.tempActiveDays ??
      month.tempDiscomfortActiveDays ??
      month.temperatureComfortActiveDays ??
      0
    );
  }

  return Number(month[`${key}ActiveDays`] ?? 0);
}

function getMonthlyAverageLabel(month, key) {
  if (key === "rain") return `avg ${nf(month.rain, 1, 2)} in`;
  if (key === "cloud") return `avg ${nf(month.cloud, 1, 0)}%`;
  if (key === "daylight") return `avg ${nf(month.daylight, 1, 1)} hrs`;
  if (key === "solar") return `avg ${nf(month.solar, 1, 1)} MJ/m²`;
  if (key === "wind") return `avg ${nf(month.wind, 1, 1)} mph`;
  if (key === "temp") return `comfort range`;
  return "";
}

/* -------------------------
   Section 4: Viz 4 Weekly Weather Lens
-------------------------- */

function drawWeeklyWeatherLensPanel() {
  ensureWeeklyLensInitialized();

  drawMainTitle(
    "BUILD YOUR WEEKLY WEATHER LENS",
    "Choose the layers that matter to your campus routine and see which days match your selected concerns."
  );

  drawSectionNumber("4", 38, 43);

  drawWeeklyFactorControls();
  drawWeeklyTimeline();
  drawWeeklyDayDetail();
  drawWeeklyLensGuide();
  drawWeeklyLensTakeaway();
}

function ensureWeeklyLensInitialized() {
  if (!weatherData.length) return;

  if (selectedWeekStartIndex >= 0) return;

  // Default to a November week because it usually shows layered Seattle conditions.
  const targetIndex = weatherData.findIndex(d => d.monthName === "Nov" && d.day >= 10);

  if (targetIndex >= 0) {
    selectedWeekStartIndex = targetIndex;
  } else {
    selectedWeekStartIndex = 0;
  }

  selectedWeeklyDayIndex = 0;
}

function getCurrentWeekDays() {
  ensureWeeklyLensInitialized();

  if (selectedWeekStartIndex < 0) return [];

  return weatherData.slice(selectedWeekStartIndex, selectedWeekStartIndex + 7);
}

function drawWeeklyFactorControls() {
  const x = 54;
  const y = 118;
  const w = width - 108;
  const h = 138;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(15);
  textStyle(BOLD);
  text("Choose your weather layers", x + 26, y + 32);

  fill("#555");
  textSize(11.5);
  textStyle(NORMAL);
  text(
    "Select the factors that matter most to your routine. The weekly view updates based on your choices.",
    x + 26,
    y + 55,
    w - 52
  );

  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];
  const buttonY = y + 78;

  // Make the six buttons fit inside the card
  const startX = x + 26;
  const endX = x + w - 26;
  const gap = 10;
  const buttonW = (endX - startX - gap * (keys.length - 1)) / keys.length;
  const buttonH = 38;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];

    const bx = startX + i * (buttonW + gap);
    const active = weeklySelectedFactors.includes(key);
    const c = color(info.color);

    if (active) {
      fill(red(c), green(c), blue(c), 78);
      stroke(info.color);
      strokeWeight(1.5);
    } else {
      fill("#FFFFFF");
      stroke("#D9D2C7");
      strokeWeight(1);
    }

    rect(bx, buttonY, buttonW, buttonH, 12);

    noStroke();
    fill(active ? "#222" : "#666");
    textAlign(CENTER, CENTER);

    textSize(14);
    text(info.icon, bx + buttonW * 0.25, buttonY + buttonH / 2);

    textSize(10.5);
    textStyle(active ? BOLD : NORMAL);
    text(info.shortLabel, bx + buttonW * 0.62, buttonY + buttonH / 2);

    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
  }
}

function handleWeeklyLensInteraction() {
  handleWeeklyFactorToggle();
  handleWeekNavigation();
  handleWeeklyDaySelection();
}

function handleWeeklyFactorToggle() {
  const x = 54;
  const y = 118;
  const w = width - 108;
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  const buttonY = y + 78;

  // Must match drawWeeklyFactorControls()
  const startX = x + 26;
  const endX = x + w - 26;
  const gap = 10;
  const buttonW = (endX - startX - gap * (keys.length - 1)) / keys.length;
  const buttonH = 38;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const bx = startX + i * (buttonW + gap);

    if (
      mouseX >= bx &&
      mouseX <= bx + buttonW &&
      mouseY >= buttonY &&
      mouseY <= buttonY + buttonH
    ) {
      if (weeklySelectedFactors.includes(key)) {
        // Keep at least one selected layer so the chart always has meaning.
        if (weeklySelectedFactors.length > 1) {
          weeklySelectedFactors = weeklySelectedFactors.filter(k => k !== key);
        }
      } else {
        weeklySelectedFactors.push(key);
      }
    }
  }
}

function handleWeekNavigation() {
  const y = 284;
  const leftX = 54;
  const rightX = width - 134;
  const buttonW = 80;
  const buttonH = 34;

  if (
    mouseX >= leftX &&
    mouseX <= leftX + buttonW &&
    mouseY >= y &&
    mouseY <= y + buttonH
  ) {
    selectedWeekStartIndex = max(0, selectedWeekStartIndex - 7);
    selectedWeeklyDayIndex = 0;
  }

  if (
    mouseX >= rightX &&
    mouseX <= rightX + buttonW &&
    mouseY >= y &&
    mouseY <= y + buttonH
  ) {
    selectedWeekStartIndex = min(
      max(0, weatherData.length - 7),
      selectedWeekStartIndex + 7
    );
    selectedWeeklyDayIndex = 0;
  }
}

function handleWeeklyDaySelection() {
  const week = getCurrentWeekDays();
  if (!week.length) return;

  const chartX = 54;
  const chartY = 320;
  const chartW = width - 108;
  const cardGap = 12;
  const cardW = (chartW - cardGap * 6) / 7;
  const cardH = 190;

  for (let i = 0; i < week.length; i++) {
    const x = chartX + i * (cardW + cardGap);
    const y = chartY;

    if (
      mouseX >= x &&
      mouseX <= x + cardW &&
      mouseY >= y &&
      mouseY <= y + cardH
    ) {
      selectedWeeklyDayIndex = i;
    }
  }
}

function drawWeeklyTimeline() {
  const week = getCurrentWeekDays();
  if (!week.length) return;

  const navY = 276;

  drawWeekNavButton(54, navY, "← Prev");
  drawWeekNavButton(width - 134, navY, "Next →");

  fill("#333");
  noStroke();
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  const firstDay = week[0];
  const lastDay = week[week.length - 1];

  text(
    `${firstDay.monthName} ${firstDay.day} – ${lastDay.monthName} ${lastDay.day}, 2025`,
    width / 2,
    navY + 18
  );

  textAlign(LEFT, BASELINE);

  // Move the day cards upward and make them slightly shorter
  const chartX = 54;
  const chartY = 320;
  const chartW = width - 108;
  const cardGap = 12;
  const cardW = (chartW - cardGap * 6) / 7;
  const cardH = 190;

  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    const x = chartX + i * (cardW + cardGap);
    const y = chartY;
    const count = getSelectedLayerCount(day);
    const selected = i === selectedWeeklyDayIndex;

    drawWeeklyDayCard(day, x, y, cardW, cardH, count, selected);
  }
}

function drawWeekNavButton(x, y, label) {
  fill("#FFFFFF");
  stroke("#D9D2C7");
  strokeWeight(1);
  rect(x, y, 80, 34, 12);

  noStroke();
  fill("#333");
  textSize(11.5);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(label, x + 40, y + 17);
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawWeeklyDayCard(day, x, y, w, h, count, selected) {
  const maxSelected = max(1, weeklySelectedFactors.length);
  const intensity = count / maxSelected;

  const base = color("#F7F1E7");
  const dark = color("#7A6A58");
  const bg = lerpColor(base, dark, intensity * 0.55);

  fill(bg);
  stroke(selected ? "#2f276f" : "#D9D2C7");
  strokeWeight(selected ? 2.4 : 1.1);
  rect(x, y, w, h, 16);
  strokeWeight(1);

  noStroke();

  fill(selected ? "#2f276f" : "#333");
  textAlign(CENTER, CENTER);
  textSize(12);
  textStyle(BOLD);
  text(getShortWeekday(day.dateObj), x + w / 2, y + 22);

  fill("#555");
  textSize(10.5);
  textStyle(NORMAL);
  text(`${day.monthName} ${day.day}`, x + w / 2, y + 40);

  fill("#222");
  textSize(23);
  textStyle(BOLD);
  text(`${count}`, x + w / 2, y + 68);

  fill("#555");
  textSize(10);
  textStyle(NORMAL);
  text("selected", x + w / 2, y + 89);
  text("layers", x + w / 2, y + 104);

  drawWeeklyLayerDots(day, x + w / 2, y + 132);

  fill("#333");
  textSize(10.2);
  text(
    `${Math.round(day.feelslike)}°F`,
    x + w / 2,
    y + h - 20
  );

  textAlign(LEFT, BASELINE);
}

function drawWeeklyLayerDots(day, centerX, y) {
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];
  const dotGap = 13;
  const startX = centerX - (keys.length - 1) * dotGap / 2;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];
    const isSelected = weeklySelectedFactors.includes(key);
    const isPresent = day.layers[key];

    if (isSelected && isPresent) {
      fill(info.color);
      stroke(info.color);
    } else if (isSelected && !isPresent) {
      fill("#FFFFFF");
      stroke(info.color);
    } else {
      fill("#E2DBD0");
      stroke("#D0C7BC");
    }

    strokeWeight(1);
    circle(startX + i * dotGap, y, 8);
  }

  strokeWeight(1);
}

function getSelectedLayerCount(day) {
  let count = 0;

  for (let i = 0; i < weeklySelectedFactors.length; i++) {
    const key = weeklySelectedFactors[i];

    if (day.layers[key]) {
      count++;
    }
  }

  return count;
}

function getShortWeekday(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleString("en-US", { weekday: "short" });
}

function drawWeeklyDayDetail() {
  const week = getCurrentWeekDays();
  if (!week.length) return;

  const day = week[selectedWeeklyDayIndex] || week[0];

  const x = 54;
  const y = 530;
  const w = width - 108;
  const h = 108;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("Selected day", x + 24, y + 27);

  fill("#222");
  textSize(17);
  textStyle(BOLD);
  text(`${getShortWeekday(day.dateObj)}, ${day.monthName} ${day.day}`, x + 24, y + 55);

  fill("#555");
  textSize(11.2);
  textStyle(NORMAL);
  text(
    "The details show which selected layers were present on this day.",
    x + 24,
    y + 78,
    300
  );

  const selectedKeys = weeklySelectedFactors;
  const gridX = x + 360;
  const gridY = y + 22;
  const chipW = 130;
  const chipH = 30;
  const gap = 12;

  for (let i = 0; i < selectedKeys.length; i++) {
    const key = selectedKeys[i];
    const info = FACTORS[key];
    const present = day.layers[key];

    const col = i % 3;
    const row = Math.floor(i / 3);

    const cx = gridX + col * (chipW + gap);
    const cy = gridY + row * (chipH + 10);

    const c = color(info.color);

    if (present) {
      fill(red(c), green(c), blue(c), 78);
      stroke(info.color);
    } else {
      fill("#FFFFFF");
      stroke("#D9D2C7");
    }

    rect(cx, cy, chipW, chipH, 10);

    noStroke();
    fill(present ? "#222" : "#666");
    textSize(10.3);
    textStyle(present ? BOLD : NORMAL);
    text(`${info.icon} ${info.shortLabel}`, cx + 12, cy + 19);

    fill(present ? "#2f276f" : "#777");
    textAlign(RIGHT, BASELINE);
    textSize(9.8);
    text(present ? "present" : "not present", cx + chipW - 10, cy + 19);
    textAlign(LEFT, BASELINE);
  }

  textStyle(NORMAL);
}

function drawWeeklyLensGuide() {
  const x = 54;
  const y = 655;
  const w = width - 108;
  const h = 76;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("How to read this view", x + 24, y + 27);

  fill("#333");
  textSize(11.3);
  textStyle(NORMAL);
  textLeading(15);
  text(
    "Each day card counts only the layers you selected. A darker day means more selected layers were present, not that the day is universally worse.",
    x + 185,
    y + 19,
    w - 215
  );

  drawWeeklyDotLegend(x + 185, y + 56);

  textLeading(13);
}

function drawWeeklyDotLegend(x, y) {
  const items = [
    ["selected + present", "#4D3F8F", true],
    ["selected + not present", "#FFFFFF", true],
    ["not selected", "#D8D0C4", false]
  ];

  let currentX = x;

  for (let i = 0; i < items.length; i++) {
    const [label, fillColor, outlined] = items[i];

    fill(fillColor);
    stroke(outlined ? "#4D3F8F" : "#D0C7BC");
    circle(currentX, y, 9);

    noStroke();
    fill("#555");
    textSize(10.5);
    text(label, currentX + 10, y + 4);

    currentX += 145;
  }
}

function drawWeeklyLensTakeaway() {
  const x = 54;
  const y = 750;
  const w = width - 108;
  const h = 52;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Why this matters", x + 24, y + 23);

  fill("#333");
  textSize(11.7);
  textStyle(NORMAL);
  text(
    "The same week can look different depending on whether a reader cares most about wet walking, low daylight, gray skies, wind, or temperature comfort.",
    x + 165,
    y + 19,
    w - 195
  );
}

/* -------------------------
   Section 5: Viz 5 Day in Context
-------------------------- */

function drawDayInContextPanel() {
  ensureDayContextInitialized();

  drawMainTitle(
    "DAY IN CONTEXT",
    "Inspect one day’s raw weather values and see which layers were present."
  );

  drawSectionNumber("5", 38, 43);

  drawContextDaySelector();
  drawContextOverviewCard();
  drawContextRawValues();
  drawContextLayerExplanation();
  drawContextTrustNote();
  drawContextTakeaway();
}

function ensureDayContextInitialized() {
  if (!weatherData.length) return;

  if (selectedContextDayIndex >= 0) return;

  // If user selected a day in Viz 4, use that same day here.
  if (selectedWeekStartIndex >= 0) {
    selectedContextDayIndex = min(
      weatherData.length - 1,
      selectedWeekStartIndex + selectedWeeklyDayIndex
    );
    return;
  }

  const targetIndex = weatherData.findIndex(d => d.monthName === "Nov" && d.day === 15);
  selectedContextDayIndex = targetIndex >= 0 ? targetIndex : 0;
}

function getSelectedContextDay() {
  ensureDayContextInitialized();
  return weatherData[selectedContextDayIndex] || weatherData[0];
}

function handleDayContextInteraction() {
  handleContextDaySelector();
}

function handleContextDaySelector() {
  const days = getContextDayOptions();
  if (!days.length) return;

  const layout = getContextArrowSelectorLayout();

  const firstIndex = days[0].index;
  const lastIndex = days[days.length - 1].index;

  // Previous day button
  if (
    mouseX >= layout.prevX &&
    mouseX <= layout.prevX + layout.arrowW &&
    mouseY >= layout.buttonY &&
    mouseY <= layout.buttonY + layout.buttonH
  ) {
    selectedContextDayIndex = max(firstIndex, selectedContextDayIndex - 1);
    return;
  }

  // Next day button
  if (
    mouseX >= layout.nextX &&
    mouseX <= layout.nextX + layout.arrowW &&
    mouseY >= layout.buttonY &&
    mouseY <= layout.buttonY + layout.buttonH
  ) {
    selectedContextDayIndex = min(lastIndex, selectedContextDayIndex + 1);
    return;
  }
}

function getContextDayOptions() {
  if (!weatherData.length) return [];

  let start = 0;

  if (selectedWeekStartIndex >= 0) {
    start = selectedWeekStartIndex;
  } else if (selectedContextDayIndex >= 0) {
    start = max(0, selectedContextDayIndex - 3);
  }

  start = min(start, max(0, weatherData.length - 7));

  const options = [];

  for (let i = 0; i < 7; i++) {
    const index = start + i;
    if (weatherData[index]) {
      options.push({
        index,
        day: weatherData[index]
      });
    }
  }

  return options;
}

function drawContextDaySelector() {
  const days = getContextDayOptions();
  if (!days.length) return;

  const day = getSelectedContextDay();
  const layout = getContextArrowSelectorLayout();

  const x = layout.x;
  const y = layout.y;
  const w = layout.w;
  const h = layout.h;

  drawCard(x, y, w, h, 16);

  // Left text block
  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("Choose a day to inspect", x + 24, y + 30);

  fill("#555");
  textSize(11.2);
  textStyle(NORMAL);
  textLeading(15);
  text(
    "Use the arrows to move through the same week from the weekly lens.",
    x + 24,
    y + 52,
    250
  );

  // Previous day button
  drawContextArrowButton(
    layout.prevX,
    layout.buttonY,
    layout.arrowW,
    layout.buttonH,
    "←",
    "Previous"
  );

  // Selected day card
  fill("#4D3F8F");
  stroke("#4D3F8F");
  strokeWeight(1.2);
  rect(layout.dayCardX, layout.buttonY, layout.dayCardW, layout.buttonH, 12);

  noStroke();
  fill("#FFFFFF");
  textAlign(CENTER, CENTER);

  textSize(13);
  textStyle(BOLD);
  text(getShortWeekday(day.dateObj), layout.dayCardX + layout.dayCardW / 2, layout.buttonY + 20);

  textSize(11);
  textStyle(NORMAL);
  text(`${day.monthName} ${day.day}`, layout.dayCardX + layout.dayCardW / 2, layout.buttonY + 42);

  // Next day button
  drawContextArrowButton(
    layout.nextX,
    layout.buttonY,
    layout.arrowW,
    layout.buttonH,
    "→",
    "Next"
  );

  textLeading(13);
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function getContextArrowSelectorLayout() {
  const x = 54;
  const y = 118;
  const w = width - 108;
  const h = 112;

  // Keep the left text block separate from the controls
  const controlStartX = x + 330;
  const controlY = y + 30;

  const arrowW = 88;
  const dayCardW = 170;
  const buttonH = 54;
  const gap = 14;

  const totalControlW = arrowW + gap + dayCardW + gap + arrowW;
  const centeredStartX = x + w - totalControlW - 34;

  return {
    x: x,
    y: y,
    w: w,
    h: h,
    buttonY: controlY,
    arrowW: arrowW,
    dayCardW: dayCardW,
    buttonH: buttonH,
    prevX: centeredStartX,
    dayCardX: centeredStartX + arrowW + gap,
    nextX: centeredStartX + arrowW + gap + dayCardW + gap
  };
}

function drawContextArrowButton(x, y, w, h, arrow, label) {
  fill("#FFFFFF");
  stroke("#D9D2C7");
  strokeWeight(1.2);
  rect(x, y, w, h, 12);

  noStroke();
  fill("#333");
  textAlign(CENTER, CENTER);

  textSize(16);
  textStyle(BOLD);
  text(arrow, x + w / 2, y + 20);

  textSize(9.5);
  textStyle(NORMAL);
  text(label, x + w / 2, y + 39);

  textAlign(LEFT, BASELINE);
}

function getContextDayButtonLayout(cardX, cardY, cardW, dayCount) {
  const textBlockW = 230;
  const startX = cardX + 24 + textBlockW;
  const y = cardY + 29;
  const rightPadding = 24;
  const gap = 10;
  const buttonH = 54;

  const availableW = cardX + cardW - rightPadding - startX;
  const buttonW = (availableW - gap * (dayCount - 1)) / dayCount;

  return {
    startX: startX,
    y: y,
    buttonW: buttonW,
    buttonH: buttonH,
    gap: gap
  };
}

function drawContextOverviewCard() {
  const day = getSelectedContextDay();

  const x = 54;
  const y = 248;
  const w = 270;
  const h = 240;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Selected day", x + 24, y + 30);

  fill("#222");
  textSize(22);
  textStyle(BOLD);
  text(`${getShortWeekday(day.dateObj)}, ${day.monthName} ${day.day}`, x + 24, y + 70);

  fill("#555");
  textSize(11.5);
  textStyle(NORMAL);
  text(day.date, x + 24, y + 95);

  textSize(42);
  textStyle(BOLD);
  fill("#222");
  text(`${Math.round(day.feelslike)}°F`, x + 24, y + 152);

  textSize(34);
  textAlign(CENTER, CENTER);
  text(getForecastIcon(day), x + w - 58, y + 135);
  textAlign(LEFT, BASELINE);

  fill("#555");
  textSize(12.2);
  textStyle(NORMAL);
  text(day.conditions || "No condition label", x + 24, y + 184, w - 48);

  fill("#F3EFE8");
  noStroke();
  rect(x + 24, y + h - 44, w - 48, 30, 9);

  fill("#444");
  textSize(10.8);
  textAlign(CENTER, CENTER);
  text(
    `${getAllActiveLayerCount(day)} of 6 layers present`,
    x + w / 2,
    y + h - 29
  );

  textAlign(LEFT, BASELINE);
}

function drawContextRawValues() {
  const day = getSelectedContextDay();

  const x = 350;
  const y = 248;
  const w = width - 404;
  const h = 240;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Raw weather values", x + 24, y + 30);

  fill("#555");
  textSize(11.2);
  textStyle(NORMAL);
  text(
    "These values come directly from the cleaned daily weather dataset.",
    x + 24,
    y + 52
  );

  const values = [
    ["💧", "Precipitation", `${nf(day.precip, 1, 2)} in`, "Rain"],
    ["☁️", "Cloud cover", `${Math.round(day.cloudcover)}%`, "Cloud"],
    ["☀️", "Daylight", `${nf(day.daylightHours, 1, 1)} hrs`, "Daylight"],
    ["🌤️", "Solar energy", `${nf(day.solarenergy, 1, 1)} MJ/m²`, "Solar"],
    ["〰️", "Wind speed", `${nf(day.windspeed, 1, 1)} mph`, "Wind"],
    ["🌡️", "Feels like", `${nf(day.feelslike, 1, 1)}°F`, "Temp"]
  ];

  const gridX = x + 24;
  const gridY = y + 82;
  const gapX = 10;
  const gapY = 14;
  const cardW = (w - 48 - gapX * 2) / 3;
  const cardH = 58;

  for (let i = 0; i < values.length; i++) {
    const [icon, label, value, layer] = values[i];

    const col = i % 3;
    const row = Math.floor(i / 3);

    const cx = gridX + col * (cardW + gapX);
    const cy = gridY + row * (cardH + gapY);

    fill("#FBFAF6");
    stroke("#DED6CA");
    strokeWeight(1);
    rect(cx, cy, cardW, cardH, 12);

    noStroke();

    fill("#333");
    textSize(14);
    text(icon, cx + 12, cy + 24);

    fill("#333");
    textSize(10.6);
    textStyle(BOLD);
    text(label, cx + 34, cy + 21);

    fill("#222");
    textSize(12.2);
    textStyle(BOLD);
    text(value, cx + 34, cy + 43);

    fill("#777");
    textSize(9.6);
    textStyle(NORMAL);
    textAlign(RIGHT, BASELINE);
    text(layer, cx + cardW - 10, cy + 43);
    textAlign(LEFT, BASELINE);
  }

  textStyle(NORMAL);
}

function drawContextLayerExplanation() {
  const day = getSelectedContextDay();

  const x = 54;
  const y = 520;
  const w = width - 108;
  const h = 220;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("Which layers are present on this day?", x + 24, y + 30);

  fill("#555");
  textSize(11.2);
  textStyle(NORMAL);
  text(
    "A layer is present when the raw value crosses our prototype threshold.",
    x + 24,
    y + 54
  );

  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  const startX = x + 24;
  const startY = y + 86;
  const gapX = 12;
  const gapY = 18;
  const cardW = (w - 72) / 3;
  const cardH = 50;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];
    const present = day.layers[key];

    const col = i % 3;
    const row = Math.floor(i / 3);

    const cx = startX + col * (cardW + gapX);
    const cy = startY + row * (cardH + gapY);

    const c = color(info.color);

    if (present) {
      fill(red(c), green(c), blue(c), 72);
      stroke(info.color);
    } else {
      fill("#FFFFFF");
      stroke("#D9D2C7");
    }

    strokeWeight(1.2);
    rect(cx, cy, cardW, cardH, 12);

    noStroke();

    fill(present ? "#222" : "#666");
    textSize(11.6);
    textStyle(BOLD);
    text(`${info.icon} ${info.label}`, cx + 14, cy + 20);

    fill(present ? "#2f276f" : "#777");
    textSize(10.2);
    textStyle(NORMAL);
    text(getContextThresholdText(key), cx + 14, cy + 39);

    textAlign(RIGHT, BASELINE);
    textSize(10.4);
    textStyle(present ? BOLD : NORMAL);
    text(present ? "present" : "not present", cx + cardW - 14, cy + 39);
    textAlign(LEFT, BASELINE);
  }

  textStyle(NORMAL);
}

function getContextThresholdText(key) {
  const rules = {
    rain: "precip ≥ 0.05 in",
    cloud: "cloud cover ≥ 75%",
    daylight: "daylight ≤ 9.5 hrs",
    solar: "solar energy ≤ 4 MJ/m²",
    wind: "wind speed ≥ 12 mph",
    temp: "feels like ≤45°F or ≥78°F"
  };

  return rules[key];
}

function drawContextTrustNote() {
  const x = 54;
  const y = 755;
  const w = width - 108;
  const h = 76;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Why this view builds trust", x + 24, y + 29);

  fill("#333");
  textSize(11.3);
  textStyle(NORMAL);
  textLeading(15);
  text(
    "This detail view shows the actual daily values behind the earlier summaries, so readers can check what each layer is based on.",
    x + 220,
    y + 22,
    w - 250
  );

  textLeading(13);
}

function drawContextTakeaway() {
  const day = getSelectedContextDay();
  const activeCount = getAllActiveLayerCount(day);

  const x = 54;
  const y = 850;
  const w = width - 108;
  const h = 54;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Takeaway", x + 24, y + 24);

  fill("#333");
  textSize(11.8);
  textStyle(NORMAL);
  text(
    `This day is not explained by one number alone. It has ${activeCount} active layers, showing how multiple ordinary weather conditions can shape a campus day together.`,
    x + 135,
    y + 19,
    w - 170
  );
}

function getAllActiveLayerCount(day) {
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];
  let count = 0;

  for (let i = 0; i < keys.length; i++) {
    if (day.layers[keys[i]]) {
      count++;
    }
  }

  return count;
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