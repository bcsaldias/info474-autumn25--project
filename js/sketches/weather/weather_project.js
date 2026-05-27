let weatherTable;
let weatherData = [];
let activeSection = 0;

const FACTORS = {
  rain: {
    label: "Rain",
    icon: "💧",
    color: "#4A90E2",
    column: "precip",
    unit: "in",
    description: "Wet ground and rain exposure"
  },
  cloud: {
    label: "Cloud Cover",
    icon: "☁️",
    color: "#8E8E93",
    column: "cloudcover",
    unit: "%",
    description: "Gray sky and visual heaviness"
  },
  daylight: {
    label: "Daylight",
    icon: "☀️",
    color: "#F4D35E",
    column: "daylightHours",
    unit: "hrs",
    description: "How much daylight is available"
  },
  solar: {
    label: "Solar Energy",
    icon: "🌤️",
    color: "#F6A04D",
    column: "solarenergy",
    unit: "MJ/m²",
    description: "Strength of sunlight reaching the city"
  },
  wind: {
    label: "Wind",
    icon: "〰️",
    color: "#2CB1A1",
    column: "windspeed",
    unit: "mph",
    description: "Outdoor movement discomfort"
  },
  temp: {
    label: "Temperature Comfort",
    icon: "🌡️",
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
    drawOpeningPanel();
  } else if (activeSection === 1) {
    drawWeatherLayersPanel();
  } else {
    drawPlaceholderPanel();
  }
}

function windowResized() {
  resizeCanvas(windowWidth * 0.58, windowHeight * 0.82);
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
    text(FACTORS[key].label, x, y + 38);
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
   Placeholder panels for later commits
-------------------------- */

function drawPlaceholderPanel() {
  const titles = {
    2: "2  FACTOR PATTERNS ACROSS THE YEAR",
    3: "3  COMPARE FACTORS WITHIN A MONTH",
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
    "This project is being implemented step by step so the commit history clearly shows progress from one visualization to the next.",
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
    "Current completed view: Viz 1 — Beyond the Forecast: Weather Layers",
    130,
    382
  );
}