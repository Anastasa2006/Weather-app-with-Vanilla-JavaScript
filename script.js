const API_KEY = "f2a1e5a4f4a4c01fe08366286fbf2277";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const cityNameElement = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperatureElement = document.getElementById("temperature");
const weatherDescription = document.getElementById("weatherDescription");
const humidityElement = document.getElementById("humidity");
const windSpeedElement = document.getElementById("windSpeed");
const visibilityElement = document.getElementById("visibility");
const updateTimeElement = document.getElementById("updateTime");
const locationElement = document.getElementById("location");

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

function updateWeatherUI(data) {
  cityNameElement.textContent = data.name;
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

  const errorElement = document.querySelector(".error-message");
  if (errorElement) {
    errorElement.classList.remove("visible");
  }
}

async function fetchWeather(city) {
  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Город "${city}" не найден. Проверьте название.`);
      } else if (response.status === 401) {
        throw new Error("Неверный API ключ. Проверьте настройки.");
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    }

    const data = await response.json();

    updateWeatherUI(data);

    return data;
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
    showError(
      error.message || "Не удалось получить данные о погоде. Попробуйте позже.",
    );
    return null;
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

  fetchWeather(city);

  searchInput.value = "";
});

document.addEventListener("DOMContentLoaded", function () {
  const savedCity = localStorage.getItem("lastCity") || "Москва";
  fetchWeather(savedCity);
});

const originalUpdateUI = updateWeatherUI;
updateWeatherUI = function (data) {
  originalUpdateUI(data);
  localStorage.setItem("lastCity", data.name);
};

console.log("Приложение погоды загружено!");
console.log("Используйте поиск, чтобы узнать погоду в любом городе.");
