const API_KEY = "e3e31fe0288f0af119d82843ec5e1800";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

let currentCity = "Kolkata";
let useCelsius = true;


const ICONS = {
  "01d":"☀️","01n":"🌙",
  "02d":"⛅","02n":"☁️",
  "03d":"☁️","03n":"☁️",
  "04d":"☁️","04n":"☁️",
  "09d":"🌧️","09n":"🌧️",
  "10d":"🌦️","10n":"🌧️",
  "11d":"⛈️","11n":"⛈️",
  "13d":"❄️","13n":"❄️",
  "50d":"🌫️","50n":"🌫️"
};


const el = id => document.getElementById(id);
const setText = (id, val) => { if (el(id)) el(id).textContent = val; };


window.onload = () => {
  updateDate();
  loadWeather(currentCity);

  el("searchCity").addEventListener("keypress", e => {
    if (e.key === "Enter") searchCity();
  });

  el("btnC").onclick = () => toggleTemp(true);
  el("btnF").onclick = () => toggleTemp(false);
};


function updateDate() {
  const d = new Date();
  setText("dayName", d.toLocaleDateString("en-US",{weekday:"long"}));
  setText("fullDate", d.toLocaleDateString("en-US",{day:"2-digit",month:"short",year:"numeric"}));
}


function searchCity() {
  const val = el("searchCity").value.trim();
  if (val) {
    loadWeather(val);
    el("searchCity").value = "";
  }
}


function toggleTemp(c) {
  useCelsius = c;
  el("btnC").classList.toggle("active", c);
  el("btnF").classList.toggle("active", !c);
  loadWeather(currentCity);
}


async function loadWeather(city) {
  try {
    const units = useCelsius ? "metric" : "imperial";
    const sym = useCelsius ? "°C" : "°F";

    
    const wRes = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
    if (!wRes.ok) throw new Error("City not found");
    const w = await wRes.json();
    currentCity = w.name;

    renderCurrent(w, sym);

    
    const fRes = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
    const f = await fRes.json();
    
    window.forecastData = f;

    renderHourly(f, sym);
    renderTomorrow(f, sym);

    
    const aRes = await fetch(
      `${BASE_URL}/air_pollution?lat=${w.coord.lat}&lon=${w.coord.lon}&appid=${API_KEY}`
    );
    const aqi = await aRes.json();
    renderAQI(aqi);

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}


function renderCurrent(d, sym) {
  setText("locName", d.name);
  setText("mainTemp", Math.round(d.main.temp) + sym);
  setText("hiLo", `H: ${Math.round(d.main.temp_max)}  L: ${Math.round(d.main.temp_min)}`);
  setText("condition", d.weather[0].main);
  setText("feelsVal", Math.round(d.main.feels_like));
  setText("bigIcon", ICONS[d.weather[0].icon] || "☀️");

  setText("windVal", (d.wind.speed * 3.6).toFixed(1));
  rotateWind(d.wind.deg);

  setText("visVal", (d.visibility / 1000).toFixed(1) + " km");
  setText("pressVal", d.main.pressure);

  setText("rainVal", d.rain?.["1h"] ? d.rain["1h"] + " mm" : "0 mm");

  
  const len = d.sys.sunset - d.sys.sunrise;
  setText("dayLenVal", `${Math.floor(len/3600)}h ${Math.floor((len%3600)/60)}m`);

 
  setText("mapTempVal", Math.round(d.main.temp) + "°");
  updateTempMapColor(Math.round(d.main.temp));

}
function updateTempMapColor(temp) {
  const map = document.querySelector(".map-box");
  if (!map) return;

  let gradient;

  if (temp <= 5) {
    gradient = "linear-gradient(135deg, #4facfe, #00f2fe)";
  } else if (temp <= 15) {
    gradient = "linear-gradient(135deg, #43e97b, #38f9d7)";
  } else if (temp <= 25) {
    gradient = "linear-gradient(135deg, #fddb92, #d1fdff)";
  } else if (temp <= 35) {
    gradient = "linear-gradient(135deg, #ff9a44, #ff6a00)";
  } else {
    gradient = "linear-gradient(135deg, #ff416c, #ff4b2b)";
  }

  map.style.background = gradient;
}


function rotateWind(deg) {
  const arrows = ["↑","↗","→","↘","↓","↙","←","↖"];
  setText("windDir", arrows[Math.round(deg / 45) % 8]);
}


function renderHourly(d, sym) {
  const box = el("hourlyData");
  box.innerHTML = "";

  d.list.slice(0, 8).forEach(i => {
    const t = new Date(i.dt * 1000).toLocaleTimeString("en-US",{hour:"numeric",hour12:true});
    box.innerHTML += `
      <div class="hour-item">
        <div class="hour-time">${t}</div>
        <div class="hour-icon">${ICONS[i.weather[0].icon] || "☀️"}</div>
        <div class="hour-temp">${Math.round(i.main.temp)}${sym}</div>
      </div>
    `;
  });
}


function renderTomorrow(data, sym) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowItems = data.list.filter(item => {
    const d = new Date(item.dt * 1000);
    return d.getDate() === tomorrow.getDate();
  });

  if (!tomorrowItems.length) {
    setText("tmrTemp", "--°");
    return;
  }

  const avgTemp =
    tomorrowItems.reduce((sum, i) => sum + i.main.temp, 0) /
    tomorrowItems.length;

  const mid = tomorrowItems[Math.floor(tomorrowItems.length / 2)];

  setText("tmrTemp", Math.round(avgTemp) + sym);
  setText("tmrIcon", ICONS[mid.weather[0].icon] || "🌤️");
}


function renderAQI(d) {
  const aqi = d.list[0].main.aqi;
  const labels = ["Good","Fair","Moderate","Poor","Very Poor"];

  setText("aqiVal", `${aqi} - ${labels[aqi - 1]}`);

  const mark = document.querySelector(".aqi-mark");
  if (mark) {
    mark.style.left = ((aqi - 1) / 4) * 100 + "%";
  }
}

function displayWeeklyForecast(data, tempSymbol) {
  const container = document.getElementById('hourlyData');
  container.innerHTML = '';

  const days = {};

  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) {
      days[date] = {
        temps: [],
        icon: item.weather[0].icon
      };
    }
    days[date].temps.push(item.main.temp);
  });

  Object.keys(days).slice(0, 5).forEach(date => {
    const temps = days[date].temps;
    const min = Math.round(Math.min(...temps));
    const max = Math.round(Math.max(...temps));
    const icon = ICONS[days[date].icon] || "☀️";

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

    const el = document.createElement('div');
    el.className = 'hour-item';
    el.innerHTML = `
      <div class="hour-time">${dayName}</div>
      <div class="hour-icon">${icon}</div>
      <div class="hour-temp">${min}${tempSymbol} / ${max}${tempSymbol}</div>
    `;
    container.appendChild(el);
  });
}
document.getElementById("btnToday")?.addEventListener("click", () => {
  document.getElementById("btnToday").classList.add("active");
  document.getElementById("btnWeek").classList.remove("active");
  renderHourly(window.forecastData, useCelsius ? "°C" : "°F");
});

document.getElementById("btnWeek")?.addEventListener("click", () => {
  document.getElementById("btnWeek").classList.add("active");
  document.getElementById("btnToday").classList.remove("active");
  displayWeeklyForecast(window.forecastData, useCelsius ? "°C" : "°F");
});

