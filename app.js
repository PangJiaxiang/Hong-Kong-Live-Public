import { formatAqhi, formatTemp, nextTrain } from "./format.js";

const weatherUrl = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";
const TARGET_WEATHER_STATION = "Hong Kong Observatory";
const MTR_LINE = "ISL";
const MTR_STA = "HKU";
const transportUrl = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${MTR_LINE}&sta=${MTR_STA}&_=${Date.now()}`;
const aqhiUrl = "https://dashboard.data.gov.hk/api/aqhi-individual?format=json";

const temperatureElement = document.getElementById("temperature");
const temperatureDetailElement = document.getElementById("temperature-detail");
const humidityElement = document.getElementById("humidity");
const rainfallElement = document.getElementById("rainfall");
const statusElement = document.getElementById("status");
const islandLineUpElement = document.getElementById("island-line-up");
const islandLineDownElement = document.getElementById("island-line-down");
const transportDetailElement = document.getElementById("transport-detail");
const aqhiCentralWesternElement = document.getElementById("aqhi-central-western");
const aqhiCentralElement = document.getElementById("aqhi-central");
const aqhiCentralWesternNameElement = document.getElementById("aqhi-central-western-name");
const aqhiCentralNameElement = document.getElementById("aqhi-central-name");
const aqhiDetailElement = document.getElementById("aqhi-detail");

function setUnavailable(message) {
  temperatureElement.textContent = "—";
  humidityElement.textContent = "—";
  rainfallElement.textContent = "—";
  statusElement.textContent = message;
}

async function loadWeather() {
  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error("The weather feed returned an error.");
    }

    const data = await response.json();
    const weatherStation = data.temperature?.data?.find(
      (reading) => reading.place === TARGET_WEATHER_STATION
    );
    if (!weatherStation) {
      temperatureElement.textContent = "Weather station unavailable";
      temperatureDetailElement.textContent = TARGET_WEATHER_STATION;
      return;
    }

    const observatoryHumidity = data.humidity.data[0];
    const districtRainfall = Math.max(
      ...data.rainfall.data.map((reading) => Number(reading.max))
    );

    if (!observatoryHumidity || !Number.isFinite(districtRainfall)) {
      throw new Error("The weather feed returned incomplete data.");
    }

    temperatureElement.textContent = formatTemp(data);
    temperatureDetailElement.textContent = `${TARGET_WEATHER_STATION} · ${new Date(data.temperature.recordTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    humidityElement.textContent = `${observatoryHumidity.value}%`;
    rainfallElement.textContent = `${districtRainfall} mm`;
    statusElement.textContent = `Updated ${new Date(data.updateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${TARGET_WEATHER_STATION}`;
  } catch (error) {
    setUnavailable("Hong Kong Observatory data is temporarily unavailable.");
  }
}

async function loadTransport() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(transportUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("The MTR feed returned an error.");
    }

    const data = await response.json();
    if (!data.data) {
      islandLineUpElement.textContent = "—";
      islandLineDownElement.textContent = "—";
      transportDetailElement.textContent = "MTR station unavailable";
      return;
    }

    const stationKey = `${MTR_LINE}-${MTR_STA}`;
    const schedule = data.data?.[stationKey];
    if (!schedule) {
      islandLineUpElement.textContent = "—";
      islandLineDownElement.textContent = "—";
      transportDetailElement.textContent = "MTR station unavailable";
      return;
    }

    const nextUp = schedule.UP.find((service) => service.valid === "Y");
    const nextDown = schedule.DOWN.find((service) => service.valid === "Y");

    if (!nextUp || !nextDown) {
      throw new Error("The MTR feed returned incomplete schedule data.");
    }

    islandLineUpElement.textContent = nextTrain(nextUp, "Platform 1");
    islandLineDownElement.textContent = nextTrain(nextDown, "Platform 2");
    transportDetailElement.textContent = `MTR ${MTR_LINE} · ${MTR_STA} Station · Updated ${new Date(data.curr_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch (error) {
    islandLineUpElement.textContent = "—";
    islandLineDownElement.textContent = "—";
    transportDetailElement.textContent = "MTR schedule is temporarily unavailable.";
  } finally {
    clearTimeout(timeout);
  }
}

async function loadAirQuality() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(aqhiUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error("The AQHI feed returned an error.");
    }

    const data = await response.json();
    const readings = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(readings)) {
      throw new Error("The AQHI feed returned an invalid response.");
    }

    const centralWestern = readings.find((reading) => String(reading.station).trim() === "Central/Western");
    const central = readings.find((reading) => String(reading.station).trim() === "Central");
    const publishDate = new Date(String(centralWestern?.publish_date).replace(" ", "T"));
    if (
      !centralWestern ||
      !central ||
      !Number.isFinite(Number(centralWestern.aqhi)) ||
      !centralWestern.health_risk ||
      !Number.isFinite(Number(central.aqhi)) ||
      !central.health_risk ||
      !Number.isFinite(publishDate.getTime())
    ) {
      throw new Error("The AQHI feed returned incomplete station data.");
    }

    aqhiCentralWesternNameElement.textContent = centralWestern.station;
    aqhiCentralNameElement.textContent = central.station;
    aqhiCentralWesternElement.textContent = formatAqhi(centralWestern);
    aqhiCentralElement.textContent = formatAqhi(central);
    aqhiDetailElement.textContent = `Updated ${publishDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Hong Kong AQHI`;
  } catch (error) {
    aqhiCentralWesternElement.textContent = "—";
    aqhiCentralElement.textContent = "—";
    aqhiDetailElement.textContent = "AQHI data is temporarily unavailable.";
  } finally {
    clearTimeout(timeout);
  }
}

loadWeather();
loadTransport();
loadAirQuality();
