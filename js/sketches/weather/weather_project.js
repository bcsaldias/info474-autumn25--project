let weatherTable;
let weatherData = [];
let monthlyData = [];

let activeSection = 0;
let selectedFactor = "rain";
let selectedMonth = 10; // November

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
  const canvasH = Math.min(900, Math.max(760, windowHeight * 0.9));

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
  const canvasH = Math.min(900, Math.max(760, windowHeight * 0.9));

  resizeCanvas(canvasW, canvasH);
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
    "A forecast shows useful numbers, but it does not show how those conditions layer together during a campus day."
  );

  drawSectionNumber("1", 38, 43);

  const margin = 46;
  const topY = 130;
  const panelH = height - 250;

  const forecastW = Math.min(280, width * 0.3);
  const arrowW = 78;
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
  stroke("#555");
  strokeWeight(2);
  line(x - 22, y, x + 22, y);
  line(x + 22, y, x + 10, y - 9);
  line(x + 22, y, x + 10, y + 9);
  strokeWeight(1);

  noStroke();
  fill("#666");
  textSize(10.3);
  textAlign(CENTER);
  text("separate", x, y - 24);
  text("numbers", x, y - 10);
  text("become", x, y + 26);
  text("layers", x, y + 40);
  textAlign(LEFT, BASELINE);
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

  const noteH = 42;
  const listY = innerY + 44;
  const listBottom = y + h - noteH - 24;
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

  const noteY = y + h - noteH - 14;

  fill("#F3EFE8");
  noStroke();
  rect(innerX, noteY, innerW, noteH, 10);

  fill("#444");
  textSize(10.7);
  textStyle(NORMAL);
  text(
    "Temperature is treated as comfort: it is only flagged when it is too cold or too hot, not simply when the number is higher.",
    innerX + 16,
    noteY + 15,
    innerW - 32
  );
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

  drawCard(chartX - 22, chartY - 42, chartW + 44, chartH + 118, 18);

  fill("#222");
  noStroke();
  textSize(18);
  textStyle(BOLD);
  text(metric.title, chartX, chartY - 16);

  fill("#555");
  textSize(11.8);
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

  // Grid and y-axis value labels
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

  // Current range note
  textAlign(LEFT, BASELINE);
  fill("#555");
  textSize(11);
  textStyle(NORMAL);
  text(
    `Observed range: ${formatYearlyValue(minVal, selectedFactor)} – ${formatYearlyValue(maxVal, selectedFactor)}`,
    plotX,
    plotY + plotH + 58
  );

  // Chart reading note
  fill("#F3EFE8");
  noStroke();
  rect(plotX, plotY + plotH + 76, plotW, 34, 10);

  fill("#444");
  textSize(10.8);
  text(
    metric.readingNote,
    plotX + 14,
    plotY + plotH + 97,
    plotW - 28
  );

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
  const h = 320;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("WHAT TO NOTICE", x + 18, y + 28);

  fill("#222");
  textSize(24);
  textAlign(CENTER);
  text(info.icon, x + w / 2, y + 70);
  textAlign(LEFT);

  fill("#333");
  textSize(13);
  textStyle(BOLD);
  text(info.label, x + 18, y + 102);

  fill("#555");
  textSize(11.2);
  textStyle(NORMAL);
  text(metric.explanation, x + 18, y + 126, w - 36);

  drawMiniDivider(x + 18, y + h - 92, x + w - 18, y + h - 92);

  fill("#2f276f");
  textSize(11.2);
  textStyle(BOLD);
  text("Data shown", x + 18, y + h - 65);

  fill("#555");
  textSize(10.8);
  textStyle(NORMAL);
  text(
    `${metric.yLabel}, measured in ${metric.unit}.`,
    x + 18,
    y + h - 45,
    w - 36
  );
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
    "Compare one month across six weather layers. Bars show how many days each layer was present."
  );

  drawSectionNumber("3", 38, 43);

  drawMonthButtons();
  drawMonthlyFlaggedDaysProfile();
  drawMonthlyMethodNote();
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

function drawMonthlyFlaggedDaysProfile() {
  const month = monthlyData[selectedMonth] || monthlyData[0];
  const keys = ["rain", "cloud", "daylight", "solar", "wind", "temp"];

  const chartX = 54;
  const chartY = 190;
  const chartW = width - 108;
  const chartH = 420;

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
    "Main bars show flagged days in this month. Smaller labels show the monthly average value from the original weather data.",
    chartX + 34,
    chartY + 68,
    chartW - 68
  );

  const plotX = chartX + 76;
  const plotY = chartY + 128;
  const plotW = chartW - 128;
  const plotH = 210;

  const maxDays = getDaysInSelectedMonth(month);
  const maxAxis = max(1, maxDays);

  drawFlaggedDaysAxis(plotX, plotY, plotH, maxAxis);

  const usableW = plotW - 55;
  const gap = usableW / keys.length;
  const barW = 54;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];

    const centerX = plotX + 58 + i * gap + gap / 2;
    const barX = centerX - barW / 2;

    const flaggedDays = getMonthlyFlaggedDays(month, key);
    const barH = map(flaggedDays, 0, maxAxis, 0, plotH);

    const c = color(info.color);

    // icon
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text(info.icon, centerX, plotY - 36);

    // label
    fill("#333");
    textSize(11.5);
    textStyle(BOLD);
    text(info.shortLabel, centerX, plotY - 13);

    // background bar
    fill("#EFEAE2");
    stroke("#D9D2C7");
    strokeWeight(1);
    rect(barX, plotY, barW, plotH, 8);

    // actual flagged days bar
    fill(red(c), green(c), blue(c), 88);
    stroke(info.color);
    strokeWeight(1.6);
    rect(barX, plotY + plotH - barH, barW, barH, 8);
    strokeWeight(1);

    // flagged days number
    noStroke();
    fill("#222");
    textSize(16);
    textStyle(BOLD);
    text(`${flaggedDays}`, centerX, plotY + plotH + 28);

    fill("#666");
    textSize(10.5);
    textStyle(NORMAL);
    text("flagged days", centerX, plotY + plotH + 44);

    // raw monthly average
    fill("#444");
    textSize(10.5);
    text(getMonthlyAverageLabel(month, key), centerX, plotY + plotH + 65);
  }

  textAlign(LEFT, BASELINE);

  drawMonthlySelectedInsight(month, chartX + 34, chartY + chartH - 60, chartW - 68);
}

function drawFlaggedDaysAxis(x, y, h, maxDays) {
  stroke("#D8D0C8");
  strokeWeight(1.2);
  line(x, y, x, y + h);

  const ticks = [0, Math.round(maxDays / 2), maxDays];

  for (let i = 0; i < ticks.length; i++) {
    const value = ticks[i];
    const ty = map(value, 0, maxDays, y + h, y);

    stroke("#E8E0D7");
    line(x, ty, width - 120, ty);

    noStroke();
    fill("#666");
    textSize(10.5);
    textAlign(RIGHT, CENTER);
    text(value, x - 10, ty);
  }

  push();
  translate(x - 46, y + h / 2);
  rotate(-HALF_PI);
  fill("#555");
  textSize(10.8);
  textAlign(CENTER, CENTER);
  text("Flagged days", 0, 0);
  pop();

  textAlign(LEFT, BASELINE);
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
  if (key === "rain") {
    return `avg ${nf(month.rain, 1, 2)} in`;
  }

  if (key === "cloud") {
    return `avg ${nf(month.cloud, 1, 0)}%`;
  }

  if (key === "daylight") {
    return `avg ${nf(month.daylight, 1, 1)} hrs`;
  }

  if (key === "solar") {
    return `avg ${nf(month.solar, 1, 1)} MJ/m²`;
  }

  if (key === "wind") {
    return `avg ${nf(month.wind, 1, 1)} mph`;
  }

  if (key === "temp") {
    return `comfort range`;
  }

  return "";
}

function drawMonthlySelectedInsight(month, x, y, w) {
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

  fill("#F3EFE8");
  noStroke();
  rect(x, y, w, 38, 10);

  fill("#2f276f");
  textSize(12);
  textStyle(BOLD);
  text("What stands out", x + 16, y + 24);

  fill("#333");
  textSize(11.5);
  textStyle(NORMAL);
  text(
    `${info.label} appears most often in ${month.monthName}, with ${highestValue} flagged days. This shows which layer shaped the month most frequently.`,
    x + 140,
    y + 24,
    w - 160
  );
}

function drawMonthlyMethodNote() {
  const x = 54;
  const y = 635;
  const w = width - 108;
  const h = 128;

  drawCard(x, y, w, h, 16);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("How flagged days are defined", x + 24, y + 30);

  fill("#555");
  textSize(11.3);
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
  const cardH = 36;
  const rowGap = 14;

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
    textSize(10.8);
    textStyle(BOLD);
    text(`${icon} ${label}`, cx + 12, cy + 14);

    fill("#666");
    textSize(10.2);
    textStyle(NORMAL);
    text(rule, cx + 12, cy + 29);
  }
}

function drawMonthlyTakeaway() {
  const x = 54;
  const y = 790;
  const w = width - 108;
  const h = 58;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(13.5);
  textStyle(BOLD);
  text("Why this matters", x + 28, y + 23);

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

/* -------------------------
   Section 4: Build Your Weekly Weather Lens
-------------------------- */

function getWeekDays() {
  if (!weatherData.length) return [];

  const maxStart = Math.max(0, weatherData.length - 7);
  selectedWeekStart = constrain(selectedWeekStart, 0, maxStart);

  return weatherData.slice(selectedWeekStart, selectedWeekStart + 7);
}

function getSelectedLayerKeys() {
  return Object.keys(selectedLayers).filter(key => selectedLayers[key]);
}

function getActiveLayerCount(day) {
  let count = 0;
  const keys = Object.keys(selectedLayers);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (selectedLayers[key] && day.layers[key]) {
      count++;
    }
  }

  return count;
}

function getDayLabel(day) {
  return day.dateObj.toLocaleString("en-US", { weekday: "short" });
}

function getShortDateLabel(day) {
  return day.dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getWeatherEmoji(day) {
  if (day.precip >= 0.05 && day.windspeed >= 12) return "🌧️";
  if (day.precip >= 0.05) return "🌦️";
  if (day.cloudcover >= 75) return "☁️";
  if (day.solarenergy >= 10) return "☀️";
  return "🌤️";
}

function drawWeeklyWeatherLensPanel() {
  drawMainTitle(
    "BUILD YOUR WEEKLY WEATHER LENS",
    "Choose the weather layers that matter most to your routine. Days become darker when selected layers overlap."
  );

  drawSectionNumber("4", 38, 43);

  drawLayerSelectorPanel();
  drawWeekNavigator();
  drawWeeklyForecastCards();
  drawWeeklyLensTakeaway();
}

function drawLayerSelectorPanel() {
  const x = 50;
  const y = 125;
  const w = 270;
  const h = 430;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("SELECT WEATHER LAYERS", x + 22, y + 32);

  fill("#555");
  textSize(11);
  textStyle(NORMAL);
  textLeading(16);
  text(
    "Pick the conditions that affect your campus routine most. This does not create a score. It only highlights overlap.",
    x + 22,
    y + 58,
    w - 44
  );

  const keys = Object.keys(FACTORS);

  // Start the rows lower than the description, but high enough to fit all 6 factors.
  const firstRowY = y + 140;
  const rowGap = 42;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const info = FACTORS[key];
    const active = selectedLayers[key];

    const rowX = x + 18;
    const rowY = firstRowY + i * rowGap;

    if (active) {
      drawSoftCard(rowX, rowY - 20, w - 36, 31, info.color, 9);
    }

    stroke(active ? info.color : "#BFB7AD");
    strokeWeight(1.3);
    fill(active ? info.color : "#FFFFFF");
    rect(rowX, rowY - 14, 18, 18, 5);

    if (active) {
      noStroke();
      fill("#FFFFFF");
      textSize(13);
      textStyle(BOLD);
      text("✓", rowX + 4, rowY);
    }

    noStroke();
    fill("#222");
    textSize(13);
    textStyle(active ? BOLD : NORMAL);

    // Shorten the last label so it fits better.
    const label = key === "temp" ? "Temp Comfort" : info.label;
    text(`${info.icon}  ${label}`, rowX + 32, rowY);
  }

  // Move legend below all six factors.
  const legendY = y + h - 55;

  fill("#F3EFE8");
  noStroke();
  rect(x + 18, legendY, w - 36, 34, 10);

  fill("#444");
  textSize(10.5);
  textStyle(NORMAL);
  text("Darker days = more selected layers overlap.", x + 28, legendY + 22);
}

function drawWeekNavigator() {
  const week = getWeekDays();
  if (!week.length) return;

  const x = 345;
  const y = 125;

  fill("#222");
  noStroke();
  textSize(16);
  textStyle(BOLD);
  text("Weekly forecast view", x, y + 5);

  fill("#555");
  textSize(12);
  textStyle(NORMAL);
  text(
    `${getShortDateLabel(week[0])} – ${getShortDateLabel(week[week.length - 1])}, 2025`,
    x,
    y + 28
  );

  drawSmallButton(x + 315, y - 12, 82, 30, "← Prev");
  drawSmallButton(x + 407, y - 12, 82, 30, "Next →");
}

function drawSmallButton(x, y, w, h, label) {
  fill("#FFFFFF");
  stroke("#D9D2C7");
  rect(x, y, w, h, 9);

  noStroke();
  fill("#333");
  textSize(11);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
  textAlign(LEFT, BASELINE);
}

function getWeeklyCardLayout() {
  const x = 345;
  const y = 180;

  // Leave enough space on the right side so the last card does not get cut off.
  const rightPadding = 55;
  const availableW = width - x - rightPadding;

  const gap = 10;
  const cardW = (availableW - gap * 6) / 7;
  const cardH = 285;

  return {
    x: x,
    y: y,
    cardW: cardW,
    cardH: cardH,
    gap: gap
  };
}

function drawWeeklyForecastCards() {
  const week = getWeekDays();
  const layout = getWeeklyCardLayout();

  const x = layout.x;
  const y = layout.y;
  const cardW = layout.cardW;
  const cardH = layout.cardH;
  const gap = layout.gap;

  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    const cx = x + i * (cardW + gap);
    const overlap = getActiveLayerCount(day);
    const alpha = map(overlap, 0, 4, 0, 145);

    drawCard(cx, y, cardW, cardH, 14);

    if (overlap > 0) {
      noStroke();
      fill(46, 40, 95, constrain(alpha, 45, 175));
      rect(cx, y, cardW, cardH, 14);
    }

    if (selectedDayGlobalIndex === weatherData.indexOf(day)) {
      noFill();
      stroke("#2f276f");
      strokeWeight(3);
      rect(cx - 2, y - 2, cardW + 4, cardH + 4, 16);
      strokeWeight(1);
    }

    const darkText = overlap >= 2;

    noStroke();
    fill(darkText ? "#FFFFFF" : "#222");
    textAlign(CENTER, CENTER);

    textSize(14);
    textStyle(BOLD);
    text(getDayLabel(day), cx + cardW / 2, y + 28);

    textSize(10.5);
    textStyle(NORMAL);
    fill(darkText ? "#F6F1E8" : "#555");
    text(getShortDateLabel(day), cx + cardW / 2, y + 52);

    textSize(23);
    fill(darkText ? "#FFFFFF" : "#222");
    text(getWeatherEmoji(day), cx + cardW / 2, y + 92);

    // Weather values
    textSize(9.3);
    textStyle(NORMAL);
    fill(darkText ? "#FFFFFF" : "#333");

    text(`Rain ${nf(day.precip, 1, 2)} in`, cx + cardW / 2, y + 130);
    text(`Cloud ${Math.round(day.cloudcover)}%`, cx + cardW / 2, y + 153);
    text(`Day ${nf(day.daylightHours, 1, 1)}h`, cx + cardW / 2, y + 176);
    text(`Wind ${nf(day.windspeed, 1, 1)} mph`, cx + cardW / 2, y + 199);
    text(`Feel ${Math.round(day.feelslike)}°F`, cx + cardW / 2, y + 222);

    fill(darkText ? "#FFFFFF" : "#2f276f");
    textSize(10);
    textStyle(BOLD);
    text(
      `${overlap} layer${overlap === 1 ? "" : "s"}`,
      cx + cardW / 2,
      y + 255
    );
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawWeeklyLensTakeaway() {
  const y = height - 92;

  drawCard(50, y, width - 100, 62, 14);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("Interaction", 75, y + 25);

  fill("#333");
  textSize(12.5);
  textStyle(NORMAL);
  text(
    "Click weather layers, then click a day. Darker shading means more selected conditions overlap.",
    180,
    y + 25,
    width - 250
  );
}

function handleWeeklyLensInteraction() {
  if (handleLayerClick()) return;
  if (handleWeekButtonClick()) return;
  handleWeeklyDayClick();
}

function handleLayerClick() {
  const panelX = 50;
  const panelY = 125;
  const panelW = 270;

  const rowX = panelX + 18;
  const rowW = panelW - 36;

  // Must match drawLayerSelectorPanel()
  const firstRowY = panelY + 140;
  const rowH = 31;
  const rowGap = 42;

  const keys = Object.keys(FACTORS);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    const hitX = rowX;
    const hitY = firstRowY + i * rowGap - 20;

    if (
      mouseX >= hitX &&
      mouseX <= hitX + rowW &&
      mouseY >= hitY &&
      mouseY <= hitY + rowH
    ) {
      selectedLayers[key] = !selectedLayers[key];
      return true;
    }
  }

  return false;
}

function handleWeekButtonClick() {
  const x = 345;
  const y = 125;
  const maxStart = Math.max(0, weatherData.length - 7);

  if (
    mouseX >= x + 315 &&
    mouseX <= x + 397 &&
    mouseY >= y - 12 &&
    mouseY <= y + 18
  ) {
    selectedWeekStart = Math.max(0, selectedWeekStart - 7);
    selectedDayGlobalIndex = selectedWeekStart;
    return true;
  }

  if (
    mouseX >= x + 407 &&
    mouseX <= x + 489 &&
    mouseY >= y - 12 &&
    mouseY <= y + 18
  ) {
    selectedWeekStart = Math.min(maxStart, selectedWeekStart + 7);
    selectedDayGlobalIndex = selectedWeekStart;
    return true;
  }

  return false;
}

function handleWeeklyDayClick() {
  const week = getWeekDays();
  const layout = getWeeklyCardLayout();

  const x = layout.x;
  const y = layout.y;
  const cardW = layout.cardW;
  const cardH = layout.cardH;
  const gap = layout.gap;

  for (let i = 0; i < week.length; i++) {
    const cx = x + i * (cardW + gap);

    if (
      mouseX >= cx &&
      mouseX <= cx + cardW &&
      mouseY >= y &&
      mouseY <= y + cardH
    ) {
      selectedDayGlobalIndex = weatherData.indexOf(week[i]);
      return true;
    }
  }

  return false;
}

/* -------------------------
   Section 5: Day in Context
-------------------------- */

function drawDayInContextPanel() {
  if (!weatherData.length) return;

  selectedDayGlobalIndex = constrain(
    selectedDayGlobalIndex,
    0,
    weatherData.length - 1
  );

  const day = weatherData[selectedDayGlobalIndex];

  drawMainTitle(
    "DAY IN CONTEXT",
    "Inspect one selected day through raw weather values and active layers, not through a final score."
  );

  drawSectionNumber("5", 38, 43);

  drawDaySummaryCard(day);
  drawRawWeatherValues(day);
  drawActiveLayerExplanation(day);
  drawMiniWeekStrip();
}

function drawDaySummaryCard(day) {
  const x = 55;
  const y = 130;
  const w = 280;
  const h = 330;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("SELECTED DAY", x + 24, y + 32);

  fill("#222");
  textSize(24);
  textStyle(BOLD);
  text(`${getDayLabel(day)}, ${getShortDateLabel(day)}`, x + 24, y + 76);

  textSize(60);
  textAlign(CENTER, CENTER);
  text(getWeatherEmoji(day), x + w / 2, y + 150);
  textAlign(LEFT, BASELINE);

  fill("#555");
  textSize(13);
  textStyle(NORMAL);
  text(day.conditions, x + 24, y + 220);

  const selected = getSelectedLayerKeys();

  fill("#F3EFE8");
  noStroke();
  rect(x + 24, y + 255, w - 48, 58, 12);

  fill("#333");
  textSize(11.5);
  textStyle(BOLD);
  text("Your selected layers:", x + 40, y + 280);

  fill("#555");
  textSize(10.5);
  textStyle(NORMAL);
  text(
    selected.length
      ? selected.map(k => FACTORS[k].shortLabel).join(", ")
      : "None selected yet",
    x + 40,
    y + 302,
    w - 80
  );
}

function drawRawWeatherValues(day) {
  const x = 370;
  const y = 130;
  const w = width - 425;
  const h = 245;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("RAW WEATHER VALUES", x + 24, y + 32);

  const rows = [
    ["rain", "Rain amount", `${nf(day.precip, 1, 2)} in`],
    ["cloud", "Cloud cover", `${Math.round(day.cloudcover)}%`],
    ["daylight", "Daylight duration", `${nf(day.daylightHours, 1, 1)} hrs`],
    ["solar", "Solar energy", `${nf(day.solarenergy, 1, 1)} MJ/m²`],
    ["wind", "Wind speed", `${nf(day.windspeed, 1, 1)} mph`],
    ["temp", "Feels-like temperature", `${Math.round(day.feelslike)}°F`]
  ];

  const colW = (w - 72) / 2;

  for (let i = 0; i < rows.length; i++) {
    const [key, label, value] = rows[i];
    const info = FACTORS[key];

    const col = i % 2;
    const row = Math.floor(i / 2);

    const bx = x + 24 + col * (colW + 16);
    const by = y + 72 + row * 56;

    const isActive = day.layers[key];
    const isSelected = selectedLayers[key];

    if (isSelected && isActive) {
      drawSoftCard(bx, by - 20, colW, 42, info.color, 10);
    } else {
      fill("#FFFFFF");
      stroke("#E1D9CF");
      rect(bx, by - 20, colW, 42, 10);
    }

    noStroke();
    fill("#222");
    textSize(12);
    textStyle(BOLD);
    text(`${info.icon} ${label}`, bx + 12, by - 2);

    fill("#555");
    textSize(11);
    textStyle(NORMAL);
    text(value, bx + 12, by + 15);

    if (isSelected && isActive) {
      fill("#2f276f");
      textSize(9.5);
      textStyle(BOLD);
      textAlign(RIGHT, BASELINE);
      text("ACTIVE", bx + colW - 12, by + 15);
      textAlign(LEFT, BASELINE);
    }
  }
}

function drawActiveLayerExplanation(day) {
  const x = 370;
  const y = 395;
  const w = width - 425;
  const h = 135;

  drawCard(x, y, w, h, 18);

  fill("#2f276f");
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("WHY THIS DAY MAY FEEL HARD", x + 24, y + 32);

  const reasons = [];

  if (day.layers.rain) reasons.push("wet ground");
  if (day.layers.cloud) reasons.push("gray sky");
  if (day.layers.daylight) reasons.push("short daylight");
  if (day.layers.solar) reasons.push("low solar energy");
  if (day.layers.wind) reasons.push("wind");
  if (day.layers.temp) reasons.push("temperature discomfort");

  let sentence;

  if (reasons.length === 0) {
    sentence =
      "This day does not strongly cross the prototype thresholds for the six weather layers.";
  } else {
    sentence =
      "This day may feel harder because it combines " +
      reasons.slice(0, 4).join(", ") +
      ".";
  }

  fill("#444");
  textSize(13.5);
  textStyle(NORMAL);
  text(sentence, x + 24, y + 62, w - 48);

  fill("#F3EFE8");
  noStroke();
  rect(x + 24, y + h - 38, w - 48, 24, 9);

  fill("#555");
  textSize(10.5);
  text(
    "This explanation uses raw weather values and active layers.",
    x + 38,
    y + h - 21
  );
}

function drawMiniWeekStrip() {
  const week = getWeekDays();

  const x = 55;
  const y = height - 115;
  const w = width - 110;
  const h = 90;

  drawCard(x, y, w, h, 14);

  fill("#2f276f");
  noStroke();
  textSize(11.5);
  textStyle(BOLD);
  text("Choose another day from this week", x + 22, y + 24);

  const totalButtonWidth = 7 * 72 + 6 * 10;
  const startX = x + (w - totalButtonWidth) / 2;
  const buttonY = y + 38;
  const buttonW = 72;
  const buttonH = 34;
  const gap = 10;

  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    const cx = startX + i * (buttonW + gap);
    const selected = selectedDayGlobalIndex === weatherData.indexOf(day);

    fill(selected ? "#4D3F8F" : "#FFFFFF");
    stroke(selected ? "#4D3F8F" : "#D9D2C7");
    rect(cx, buttonY, buttonW, buttonH, 10);

    noStroke();
    fill(selected ? "#FFFFFF" : "#333");
    textSize(10.5);
    textStyle(selected ? BOLD : NORMAL);
    textAlign(CENTER, CENTER);
    text(getDayLabel(day), cx + buttonW / 2, buttonY + buttonH / 2);
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function handleDayContextInteraction() {
  const week = getWeekDays();

  const x = 55;
  const y = height - 115;
  const w = width - 110;

  const totalButtonWidth = 7 * 72 + 6 * 10;
  const startX = x + (w - totalButtonWidth) / 2;
  const buttonY = y + 38;
  const buttonW = 72;
  const buttonH = 34;
  const gap = 10;

  for (let i = 0; i < week.length; i++) {
    const cx = startX + i * (buttonW + gap);

    if (
      mouseX >= cx &&
      mouseX <= cx + buttonW &&
      mouseY >= buttonY &&
      mouseY <= buttonY + buttonH
    ) {
      selectedDayGlobalIndex = weatherData.indexOf(week[i]);
      return true;
    }
  }

  return false;
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