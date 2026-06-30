const API_KEY = "f2a1e5a4f4a4c01fe08366286fbf2277";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const cityNameElement = document.getElementById("cityName");
const countryCodeElement = document.getElementById("countryCode");
const weatherIcon = document.getElementById("weatherIcon");
const temperatureElement = document.getElementById("temperature");
const weatherDescription = document.getElementById("weatherDescription");
const humidityElement = document.getElementById("humidity");
const windSpeedElement = document.getElementById("windSpeed");
const visibilityElement = document.getElementById("visibility");
const updateTimeElement = document.getElementById("updateTime");
const locationElement = document.getElementById("location");
const forecastList = document.getElementById("forecastList");
const cityModal = document.getElementById("cityModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

function getWeatherIcon(iconCode) {
  const iconMap = {
    "01d": "fa-sun",
    "01n": "fa-moon",
    "02d": "fa-cloud-sun",
    "02n": "fa-cloud-moon",
    "03d": "fa-cloud",
    "03n": "fa-cloud",
    "04d": "fa-cloud",
    "04n": "fa-cloud",
    "09d": "fa-cloud-rain",
    "09n": "fa-cloud-rain",
    "10d": "fa-cloud-sun-rain",
    "10n": "fa-cloud-moon-rain",
    "11d": "fa-bolt",
    "11n": "fa-bolt",
    "13d": "fa-snowflake",
    "13n": "fa-snowflake",
    "50d": "fa-smog",
    "50n": "fa-smog",
  };
  return iconMap[iconCode] || "fa-cloud";
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(dateStr) {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

function showError(message) {
  let errorElement = document.querySelector(".error-message");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.className = "error-message";
    const mainWeather = document.getElementById("mainWeather");
    mainWeather.parentNode.insertBefore(errorElement, mainWeather.nextSibling);
  }
  errorElement.textContent = message;
  errorElement.classList.add("visible");

  setTimeout(() => {
    errorElement.classList.remove("visible");
  }, 5000);
}

function showCityModal(cities, searchQuery) {
  modalBody.innerHTML = "";

  cities.forEach((city) => {
    const item = document.createElement("div");
    item.className = "modal-city-item";
    item.innerHTML = `
            <span class="city-name-modal">${city.name}</span>
            <span class="country-name-modal">${city.country} ${city.state ? `(${city.state})` : ""}</span>
        `;
    item.addEventListener("click", () => {
      closeModal();
      fetchWeather(city.lat, city.lon, city.name, city.country);
    });
    modalBody.appendChild(item);
  });

  cityModal.classList.add("active");
}

function closeModal() {
  cityModal.classList.remove("active");
}

cityModal.addEventListener("click", (e) => {
  if (e.target === cityModal) closeModal();
});

modalClose.addEventListener("click", closeModal);

function updateWeatherUI(data) {
  cityNameElement.textContent = data.name;
  countryCodeElement.textContent = data.sys.country;
  locationElement.textContent = `${data.name}, ${data.sys.country}`;

  const temp = Math.round(data.main.temp);
  temperatureElement.innerHTML = `${temp}<sup>°C</sup>`;

  weatherDescription.textContent = data.weather[0].description;

  const iconCode = data.weather[0].icon;
  const iconClass = getWeatherIcon(iconCode);
  weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;

  humidityElement.textContent = `${data.main.humidity}%`;
  windSpeedElement.textContent = `${Math.round(data.wind.speed)} м/с`;

  if (data.visibility) {
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    visibilityElement.textContent = `${visibilityKm} км`;
  } else {
    visibilityElement.textContent = "—";
  }

  updateTimeElement.textContent = formatTime(data.dt);

  localStorage.setItem("lastCity", data.name);
  localStorage.setItem("lastCountry", data.sys.country);
}

function updateForecastUI(forecastData) {
  forecastList.innerHTML = "";

  const dailyData = {};
  forecastData.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        icons: [],
        descriptions: [],
      };
    }
    dailyData[date].temps.push(item.main.temp);
    dailyData[date].icons.push(item.weather[0].icon);
    dailyData[date].descriptions.push(item.weather[0].description);
  });

  const dates = Object.keys(dailyData).slice(0, 7);

  dates.forEach((date, index) => {
    const dayData = dailyData[date];
    const maxTemp = Math.round(Math.max(...dayData.temps));
    const minTemp = Math.round(Math.min(...dayData.temps));

    const iconCount = {};
    dayData.icons.forEach((icon) => {
      iconCount[icon] = (iconCount[icon] || 0) + 1;
    });
    const mostCommonIcon = Object.keys(iconCount).reduce((a, b) =>
      iconCount[a] > iconCount[b] ? a : b,
    );

    const dayElement = document.createElement("div");
    dayElement.className = "forecast-day";

    let dayName;
    if (index === 0) {
      dayName = "Сегодня";
    } else {
      dayName = formatDay(date);
    }

    dayElement.innerHTML = `
            <span class="forecast-day-name">${dayName}</span>
            <span class="forecast-day-icon"><i class="fas ${getWeatherIcon(mostCommonIcon)}"></i></span>
            <span class="forecast-day-temps">
                <span class="max-temp">${maxTemp}°</span>
                <span class="min-temp">${minTemp}°</span>
            </span>
        `;
    forecastList.appendChild(dayElement);
  });
}

async function searchCity(query) {
  try {
    const url = `${GEO_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Ошибка поиска города");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка поиска:", error);
    return [];
  }
}

async function fetchWeather(lat, lon, cityName, country) {
  try {
    const weatherUrl = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error("Ошибка получения погоды");
    }

    const weatherData = await weatherResponse.json();
    updateWeatherUI(weatherData);

    const forecastUrl = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru&cnt=40`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      throw new Error("Ошибка получения прогноза");
    }

    const forecastData = await forecastResponse.json();
    updateForecastUI(forecastData);

    const errorElement = document.querySelector(".error-message");
    if (errorElement) {
      errorElement.classList.remove("visible");
    }

    return weatherData;
  } catch (error) {
    console.error("Ошибка:", error);
    showError(error.message || "Не удалось получить данные о погоде");
    return null;
  }
}

async function searchAndShowWeather(query) {
  const cities = await searchCity(query);

  if (cities.length === 0) {
    showError(`Город "${query}" не найден. Проверьте название.`);
    return;
  }

  if (cities.length === 1) {
    const city = cities[0];
    fetchWeather(city.lat, city.lon, city.name, city.country);
  } else {
    showCityModal(cities, query);
  }
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const city = searchInput.value.trim();

  if (!city) {
    showError("Пожалуйста, введите название города.");
    searchInput.focus();
    return;
  }

  searchAndShowWeather(city);
  searchInput.value = "";
});

document.addEventListener("DOMContentLoaded", function () {
  if (API_KEY === "ВАШ_КЛЮЧ_СЮДА" || API_KEY === "YOUR_API_KEY") {
    console.warn("⚠️ ВНИМАНИЕ: API ключ не настроен!");
    showError("API ключ не настроен. Вставьте ваш ключ в файл script.js");
    return;
  }

  const savedCity = localStorage.getItem("lastCity") || "Москва";
  const savedCountry = localStorage.getItem("lastCountry") || "RU";

  searchAndShowWeather(savedCity);
});

console.log("✅ Приложение погоды загружено!");
console.log("ℹ️ Введите название города для поиска");
console.log("ℹ️ При дубликатах городов появится выбор");
