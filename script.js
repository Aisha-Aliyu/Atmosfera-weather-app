// script.js - Atmosfera Weather App

(function() {
  // ---------- Configuration ----------
  // Open-Meteo needs no API key (the old OpenWeather key lived in a config.js that was
  // never deployed, so the page stopped on the loader)
  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
  
  // ---------- DOM Elements ----------
  const canvas = document.getElementById('weatherCanvas');
  const ctx = canvas.getContext('2d');
  
  // Search elements
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const locationBtn = document.getElementById('locationBtn');
  
  // Weather content elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const weatherContent = document.getElementById('weatherContent');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');
  
  // Weather data elements
  const cityName = document.getElementById('cityName');
  const localTime = document.getElementById('localTime');
  const temperature = document.getElementById('temperature');
  const condition = document.getElementById('condition');
  const weatherIcon = document.getElementById('weatherIcon');
  
  // Stats elements
  const humidity = document.getElementById('humidity');
  const windSpeed = document.getElementById('windSpeed');
  const windGust = document.getElementById('windGust');
  const pressure = document.getElementById('pressure');
  const pressureTrend = document.getElementById('pressureTrend');
  const uvIndex = document.getElementById('uvIndex');
  const uvFill = document.getElementById('uvFill');
  const visibility = document.getElementById('visibility');
  const visibilityDesc = document.getElementById('visibilityDesc');
  const dewPoint = document.getElementById('dewPoint');
  
  // Sun elements
  const sunrise = document.getElementById('sunrise');
  const sunset = document.getElementById('sunset');
  const sunPosition = document.getElementById('sunPosition');
  
  // Forecast containers
  const hourlyForecast = document.getElementById('hourlyForecast');
  const weeklyForecast = document.getElementById('weeklyForecast');
  
  // AI recommendation
  const aiMessage = document.getElementById('aiMessage');
  
  // Sound toggle
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  
  // PWA install
  const installContainer = document.getElementById('installContainer');
  const installBtn = document.getElementById('installBtn');
  let deferredPrompt;
  
  // ---------- State ----------
  let currentWeather = null;
  let forecast = null;
  let particles = [];
  let animationFrame = null;
  let soundEnabled = localStorage.getItem('weatherSound') !== 'false';
  let currentTheme = 'default';
  
  // Weather condition mappings for particles
  const particleConfigs = {
    Clear: { type: 'sparkle', count: 30 },
    Clouds: { type: 'cloud', count: 15 },
    Rain: { type: 'rain', count: 100 },
    Snow: { type: 'snow', count: 80 },
    Thunderstorm: { type: 'rain', count: 150, lightning: true },
    Drizzle: { type: 'rain', count: 50 },
    Mist: { type: 'fog', count: 20 },
    Fog: { type: 'fog', count: 20 }
  };
  
  // AI clothing recommendations based on weather
  const clothingRecommendations = {
    freezing: [
      "❄️ Heavy winter coat, thermal layers, gloves, and a warm hat - it's freezing out there!",
      "🧥 Multiple layers are your friend. Don't forget a scarf and insulated boots!",
      "☃️ Arctic conditions! Wear your warmest parka and consider hand warmers."
    ],
    cold: [
      "🧣 A warm jacket, sweater, and scarf will keep you comfortable.",
      "🧤 Leather gloves and a beanie would be perfect for today.",
      "🧥 A wool coat with a light sweater underneath should do the trick."
    ],
    cool: [
      "👕 Light jacket or hoodie with jeans is perfect for today.",
      "🧥 A denim jacket or cardigan would be ideal.",
      "👔 Long sleeves with a light vest - comfortable and stylish."
    ],
    mild: [
      "👕 T-shirt with jeans or chinos - perfect weather!",
      "👗 A light dress or shorts would work great today.",
      "🧢 Comfortable and casual - any light clothing works."
    ],
    warm: [
      "🩳 Shorts and a breathable t-shirt are your best bet.",
      "👕 Light, loose clothing and sunglasses recommended.",
      "🧴 Don't forget sunscreen if you're going out!"
    ],
    hot: [
      "🥵 Stay inside if you can! Light linen clothing and a hat are essential.",
      "👙 Beach weather! Wear light colors and stay hydrated.",
      "🧊 Breathable fabrics only - it's scorching out there!"
    ],
    rainy: [
      "☔ Don't forget your umbrella and a waterproof jacket!",
      "👢 Rain boots and a raincoat will keep you dry.",
      "🌂 Waterproof layers are essential today."
    ],
    snowy: [
      "⛄ Waterproof boots and a warm coat are must-haves!",
      "🧤 Gloves, scarf, and thermal socks - it's snowing!",
      "☃️ Snow day! Wear waterproof layers and stay warm."
    ],
    stormy: [
      "⚡ Stay safe indoors if possible! If you must go out, take precautions.",
      "🌪️ Strong winds expected - secure loose items and dress appropriately.",
      "⛈️ Heavy storms - postpone outdoor activities if you can."
    ]
  };
  
  // Mood-based color schemes
  const colorSchemes = {
    Clear: { primary: 45, name: 'Golden Hour' },
    Clouds: { primary: 200, name: 'Overcast' },
    Rain: { primary: 210, name: 'Rainy Day' },
    Snow: { primary: 190, name: 'Winter Wonderland' },
    Thunderstorm: { primary: 260, name: 'Stormy Night' },
    Mist: { primary: 180, name: 'Mystic Morning' },
    Night: { primary: 280, name: 'Starry Night' }
  };
  
  // ---------- Canvas Setup ----------
  function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
  
  // ---------- Particle System ----------
  class Particle {
    constructor(type, canvas) {
      this.type = type;
      this.canvas = canvas;
      this.reset();
    }
    
    reset() {
      switch(this.type) {
        case 'rain':
          this.x = Math.random() * this.canvas.width;
          this.y = Math.random() * this.canvas.height;
          this.length = 15 + Math.random() * 10;
          this.speed = 5 + Math.random() * 5;
          this.opacity = 0.3 + Math.random() * 0.3;
          break;
          
        case 'snow':
          this.x = Math.random() * this.canvas.width;
          this.y = Math.random() * this.canvas.height;
          this.size = 2 + Math.random() * 4;
          this.speed = 1 + Math.random() * 2;
          this.wobble = Math.random() * Math.PI * 2;
          this.opacity = 0.6 + Math.random() * 0.4;
          break;
          
        case 'cloud':
          this.x = Math.random() * this.canvas.width;
          this.y = 20 + Math.random() * 100;
          this.size = 20 + Math.random() * 40;
          this.speed = 0.2 + Math.random() * 0.3;
          this.opacity = 0.1 + Math.random() * 0.2;
          break;
          
        case 'sparkle':
          this.x = Math.random() * this.canvas.width;
          this.y = Math.random() * this.canvas.height;
          this.size = 1 + Math.random() * 2;
          this.speed = 0.5 + Math.random();
          this.phase = Math.random() * Math.PI * 2;
          break;
          
        case 'fog':
          this.x = Math.random() * this.canvas.width;
          this.y = Math.random() * this.canvas.height;
          this.size = 50 + Math.random() * 100;
          this.speed = 0.1 + Math.random() * 0.2;
          this.opacity = 0.05 + Math.random() * 0.1;
          break;
      }
    }
    
    update() {
      switch(this.type) {
        case 'rain':
          this.y += this.speed;
          this.x += Math.sin(this.y * 0.01) * 0.5;
          if (this.y > this.canvas.height) {
            this.y = 0;
            this.x = Math.random() * this.canvas.width;
          }
          break;
          
        case 'snow':
          this.y += this.speed;
          this.wobble += 0.02;
          this.x += Math.sin(this.wobble) * 0.5;
          if (this.y > this.canvas.height) {
            this.y = 0;
            this.x = Math.random() * this.canvas.width;
          }
          break;
          
        case 'cloud':
          this.x += this.speed;
          if (this.x > this.canvas.width + 100) {
            this.x = -100;
          }
          break;
          
        case 'sparkle':
          this.phase += 0.02;
          this.opacity = 0.3 + Math.sin(this.phase) * 0.3;
          break;
          
        case 'fog':
          this.x += this.speed;
          if (this.x > this.canvas.width + 200) {
            this.x = -200;
            this.y = Math.random() * this.canvas.height;
          }
          break;
      }
    }
    
    draw(ctx) {
      ctx.save();
      switch(this.type) {
        case 'rain':
          ctx.strokeStyle = `rgba(240, 245, 223, ${this.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + Math.sin(this.y * 0.01) * 3, this.y + this.length);
          ctx.stroke();
          break;
          
        case 'snow':
          ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'cloud':
          ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
          ctx.arc(this.x + this.size * 0.3, this.y - this.size * 0.1, this.size * 0.4, 0, Math.PI * 2);
          ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'sparkle':
          ctx.fillStyle = `rgba(255, 255, 200, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'fog':
          ctx.fillStyle = `rgba(200, 200, 200, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }
  
  // ---------- Initialize Particles ----------
  function initParticles(weatherType) {
    particles = [];
    const config = particleConfigs[weatherType] || particleConfigs.Clear;
    const type = config.type;
    const count = config.count;
    
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(type, canvas));
    }
    
    // Add lightning effect for thunderstorms
    if (config.lightning) {
      setInterval(() => {
        if (Math.random() > 0.7) {
          document.body.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          setTimeout(() => {
            document.body.style.backgroundColor = '';
          }, 100);
        }
      }, 3000);
    }
  }
  
  // ---------- Animate Particles ----------
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // The page colour (cadet blue) shows through; only the particles are drawn
    
    particles.forEach(particle => {
      particle.update();
      particle.draw(ctx);
    });
    
    animationFrame = requestAnimationFrame(animateParticles);
  }
  
  // ---------- Update Theme Based on Weather ----------
  function updateTheme(weatherType, isDay) {
    let scheme = colorSchemes[weatherType] || colorSchemes.Clear;
    
    if (!isDay && weatherType === 'Clear') {
      scheme = colorSchemes.Night;
    }
    
    const root = document.documentElement;
    root.style.setProperty('--primary-hue', scheme.primary);

  }
  
  // ---------- AI Recommendation Generator ----------
  function getAIRecommendation(weather, temp) {
    const condition = weather.weather[0].main;
    const tempC = Math.round(temp - 273.15);
    
    let category = 'mild';
    let conditionCategory = '';
    
    // Temperature-based category
    if (tempC <= -10) category = 'freezing';
    else if (tempC < 0) category = 'cold';
    else if (tempC < 10) category = 'cool';
    else if (tempC < 20) category = 'mild';
    else if (tempC < 30) category = 'warm';
    else category = 'hot';
    
    // Weather-based override for special conditions
    if (condition === 'Rain' || condition === 'Drizzle') conditionCategory = 'rainy';
    else if (condition === 'Snow') conditionCategory = 'snowy';
    else if (condition === 'Thunderstorm') conditionCategory = 'stormy';
    
    const categoryToUse = conditionCategory || category;
    const recommendations = clothingRecommendations[categoryToUse] || clothingRecommendations.mild;
    const randomIndex = Math.floor(Math.random() * recommendations.length);
    
    return recommendations[randomIndex];
  }
  
  // ---------- Format Time ----------
  function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  // ---------- Get Local Time ----------
  function getLocalTime(timezone) {
    const now = new Date();
    const localTime = new Date(now.getTime() + timezone * 1000 + now.getTimezoneOffset() * 60000);
    return localTime.toLocaleString('en-US', { 
      weekday: 'long', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // ---------- Update Sun Position ----------
  function updateSunPosition(sunriseTime, sunsetTime, currentTime, timezone) {
    const sunriseDate = new Date((sunriseTime + timezone) * 1000);
    const sunsetDate = new Date((sunsetTime + timezone) * 1000);
    const currentDate = new Date((currentTime + timezone) * 1000);
    
    const dayLength = sunsetDate - sunriseDate;
    const timeSinceSunrise = currentDate - sunriseDate;
    
    let position = 0;
    if (timeSinceSunrise > 0 && timeSinceSunrise < dayLength) {
      position = (timeSinceSunrise / dayLength) * 100;
    } else if (currentDate > sunsetDate) {
      position = 100;
    }
    
    sunPosition.style.left = `${position}%`;
  }
  
  // ---------- Weather data ----------
  // Open-Meteo's answers are reshaped into the format the rest of this file was written
  // for (OpenWeather's), so the display code stays the same.

  // WMO weather code as [main, description, OpenWeather icon number]
  function describeCode(code) {
    if (code === 0) return ['Clear', 'clear sky', '01'];
    if (code === 1) return ['Clouds', 'mainly clear', '02'];
    if (code === 2) return ['Clouds', 'partly cloudy', '03'];
    if (code === 3) return ['Clouds', 'overcast', '04'];
    if (code === 45 || code === 48) return ['Fog', 'fog', '50'];
    if (code >= 51 && code <= 57) return ['Drizzle', 'drizzle', '09'];
    if (code >= 61 && code <= 67) return ['Rain', code >= 65 ? 'heavy rain' : 'rain', '10'];
    if (code >= 71 && code <= 77) return ['Snow', 'snow', '13'];
    if (code >= 80 && code <= 82) return ['Rain', 'rain showers', '09'];
    if (code === 85 || code === 86) return ['Snow', 'snow showers', '13'];
    if (code >= 95) return ['Thunderstorm', 'thunderstorm', '11'];
    return ['Clouds', 'cloudy', '03'];
  }

  function conditionFor(code, isDay) {
    const [main, description, icon] = describeCode(code);
    return [{ main, description, icon: `${icon}${isDay ? 'd' : 'n'}` }];
  }

  async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('The weather service is unavailable. Please try again.');
    return response.json();
  }

  async function loadWeather(lat, lon, name, country) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,is_day,weather_code,pressure_msl,wind_speed_10m,wind_gusts_10m',
      hourly: 'temperature_2m,weather_code,is_day,visibility,uv_index',
      daily: 'sunrise,sunset',
      wind_speed_unit: 'ms',
      timezone: 'auto',
      timeformat: 'unixtime',
      forecast_days: '6',
    });
    const data = await getJson(`${FORECAST_URL}?${params}`);
    const { current, hourly, daily } = data;
    const now = Math.floor(Date.now() / 1000);
    let hour = hourly.time.findIndex((t) => t > now) - 1;
    if (hour < 0) hour = 0;

    const weather = {
      name,
      sys: { country, sunrise: daily.sunrise[0], sunset: daily.sunset[0] },
      timezone: data.utc_offset_seconds,
      coord: { lat, lon },
      main: {
        temp: current.temperature_2m + 273.15,
        humidity: current.relative_humidity_2m,
        pressure: Math.round(current.pressure_msl),
      },
      weather: conditionFor(current.weather_code, current.is_day),
      wind: { speed: current.wind_speed_10m, gust: current.wind_gusts_10m },
      visibility: hourly.visibility[hour] ?? 10000,
    };

    // 3-hour steps over the next 5 days, like OpenWeather's forecast
    const list = [];
    for (let i = hour + 1; i < hourly.time.length && list.length < 40; i += 3) {
      list.push({
        dt: hourly.time[i],
        main: { temp: hourly.temperature_2m[i] + 273.15 },
        weather: conditionFor(hourly.weather_code[i], hourly.is_day[i]),
      });
    }

    return { weather, forecastData: { list }, uv: { value: hourly.uv_index[hour] ?? 0 } };
  }

  function showWeather({ weather, forecastData, uv }) {
    currentWeather = weather;
    forecast = forecastData;
    updateUI(weather, forecastData, uv);
    hideLoading();
  }

  // ---------- Fetch Weather Data ----------
  async function fetchWeather(city) {
    showLoading();
    try {
      const geo = await getJson(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      const place = geo.results?.[0];
      if (!place) throw new Error('City not found');
      showWeather(await loadWeather(place.latitude, place.longitude, place.name, place.country_code ?? ''));
    } catch (error) {
      showError(error.message);
    }
  }

  // ---------- Fetch by Coordinates ----------
  async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    try {
      showWeather(await loadWeather(lat, lon, 'Your location', ''));
    } catch (error) {
      showError('Failed to fetch weather for your location');
    }
  }

  // ---------- Update UI ----------
  function updateUI(weather, forecast, uv) {
    // Basic info
    cityName.textContent = weather.sys.country ? `${weather.name}, ${weather.sys.country}` : weather.name;
    localTime.textContent = getLocalTime(weather.timezone);
    
    // Temperature
    const tempC = Math.round(weather.main.temp - 273.15);
    temperature.textContent = tempC;
    
    // Weather condition
    const weatherType = weather.weather[0].main;
    condition.textContent = weather.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
    
    // Stats
    humidity.textContent = `${weather.main.humidity}%`;
    windSpeed.textContent = `${Math.round(weather.wind.speed * 3.6)} km/h`;
    windGust.textContent = weather.wind.gust ? `${Math.round(weather.wind.gust * 3.6)} km/h` : 'N/A';
    pressure.textContent = `${weather.main.pressure} hPa`;
    visibility.textContent = `${(weather.visibility / 1000).toFixed(1)} km`;
    
    // Visibility description
    const visKm = weather.visibility / 1000;
    if (visKm > 10) visibilityDesc.textContent = 'Excellent';
    else if (visKm > 5) visibilityDesc.textContent = 'Good';
    else if (visKm > 2) visibilityDesc.textContent = 'Moderate';
    else visibilityDesc.textContent = 'Poor';
    
    // Dew point calculation (approximate)
    const temp = weather.main.temp - 273.15;
    const hum = weather.main.humidity / 100;
    const dew = temp - ((100 - hum * 100) / 5);
    dewPoint.textContent = `${Math.round(dew)}°C`;
    
    // Pressure trend (simulated - would need historical data)
    pressureTrend.textContent = ['Rising', 'Stable', 'Falling'][Math.floor(Math.random() * 3)];
    
    // UV Index
    const uvValue = uv.value || 0;
    uvIndex.textContent = uvValue.toFixed(1);
    uvFill.style.width = `${(uvValue / 11) * 100}%`;
    
    // Sun times
    sunrise.textContent = formatTime(weather.sys.sunrise, weather.timezone);
    sunset.textContent = formatTime(weather.sys.sunset, weather.timezone);
    
    // Update sun position
    const now = Math.floor(Date.now() / 1000);
    updateSunPosition(weather.sys.sunrise, weather.sys.sunset, now, weather.timezone);
    
    // AI Recommendation
    aiMessage.textContent = getAIRecommendation(weather, weather.main.temp);
    
    // Update theme and particles
    const isDay = weather.weather[0].icon.includes('d');
    updateTheme(weatherType, isDay);
    initParticles(weatherType);
    
    // Hourly forecast
    updateHourlyForecast(forecast, weather.timezone);
    
    // Weekly forecast
    updateWeeklyForecast(forecast, weather.timezone);
    
    // Show content
    weatherContent.classList.remove('hidden');
  }
  
  // ---------- Update Hourly Forecast ----------
  function updateHourlyForecast(forecast, timezone) {
    const hourlyList = forecast.list.slice(0, 8);
    
    hourlyForecast.innerHTML = hourlyList.map(item => {
      const date = new Date((item.dt + timezone) * 1000);
      const hour = date.getHours();
      const temp = Math.round(item.main.temp - 273.15);
      const icon = item.weather[0].icon;
      
      return `
        <div class="hourly-item">
          <div class="hourly-time">${hour}:00</div>
          <img src="https://openweathermap.org/img/wn/${icon}.png" class="hourly-icon" alt="">
          <div class="hourly-temp">${temp}°C</div>
        </div>
      `;
    }).join('');
  }
  
  // ---------- Update Weekly Forecast ----------
  function updateWeeklyForecast(forecast, timezone) {
    // Group by day
    const dailyData = {};
    
    forecast.list.forEach(item => {
      const date = new Date((item.dt + timezone) * 1000);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!dailyData[day]) {
        dailyData[day] = {
          temps: [],
          icon: item.weather[0].icon,
          main: item.weather[0].main
        };
      }
      
      dailyData[day].temps.push(item.main.temp - 273.15);
    });
    
    // Take first 7 days
    const days = Object.keys(dailyData).slice(0, 7);
    
    weeklyForecast.innerHTML = days.map(day => {
      const data = dailyData[day];
      const minTemp = Math.round(Math.min(...data.temps));
      const maxTemp = Math.round(Math.max(...data.temps));
      
      return `
        <div class="weekly-item">
          <div class="weekly-day">${day}</div>
          <img src="https://openweathermap.org/img/wn/${data.icon}.png" class="weekly-icon" alt="">
          <div class="weekly-temp">
            <span>${maxTemp}°</span> / ${minTemp}°
          </div>
        </div>
      `;
    }).join('');
  }
  
  // ---------- UI State Management ----------
  function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    weatherContent.classList.add('hidden');
  }
  
  function hideLoading() {
    loadingState.classList.add('hidden');
  }
  
  function showError(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    errorMessage.textContent = message;
  }
  
  // ---------- Get User Location ----------
  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        error => {
          showError('Location access denied. Please search for a city.');
        }
      );
    } else {
      showError('Geolocation not supported');
    }
  }
  
  // ---------- Sound Toggle ----------
  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('weatherSound', soundEnabled);
    
    if (soundEnabled) {
      soundIcon.src = 'icons/sound-on.svg';
      // Play ambient sound based on weather (would need audio files)
    } else {
      soundIcon.src = 'icons/sound-off.svg';
      // Stop all sounds
    }
  }
  
  // ---------- PWA Install ----------
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installContainer.classList.remove('hidden');
  });
  
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    deferredPrompt = null;
    installContainer.classList.add('hidden');
  });
  
  window.addEventListener('appinstalled', () => {
    installContainer.classList.add('hidden');
    deferredPrompt = null;
  });
  
  // ---------- Event Listeners ----------
  searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
      fetchWeather(city);
    }
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const city = searchInput.value.trim();
      if (city) {
        fetchWeather(city);
      }
    }
  });
  
  locationBtn.addEventListener('click', getUserLocation);
  
  retryBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) {
      fetchWeather(searchInput.value.trim());
    } else {
      getUserLocation();
    }
  });
  
  soundToggle.addEventListener('click', toggleSound);
  
  // ---------- Initialize ----------
  setupCanvas();
  initParticles('Clear');
  animateParticles();
  
  // Load default city
  fetchWeather('London');
  
  // Cleanup animation on page unload
  window.addEventListener('beforeunload', () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
})();