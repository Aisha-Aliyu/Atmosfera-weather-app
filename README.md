# Atmosfera

A weather app that draws the weather instead of only listing it. Rain, snow, clouds and sun are animated on a canvas behind the forecast, and a stylist card suggests what to wear.

Live demo: https://atmosferaa.vercel.app

## Features

- Animated rain, snow, clouds and sun on an HTML canvas, matched to the current conditions, with lightning during thunderstorms.
- Outfit suggestions based on the temperature and conditions, with extra tips for rain and storms.
- Stat cards that flip over to show more detail, such as the dew point and wind gusts.
- A sun path arc that shows where the sun is between sunrise and sunset.
- Humidity, wind, pressure, visibility and a UV meter.
- An hourly forecast.
- Search for any city, or use your current location.
- Installs as a PWA.

## Weather data

Weather and city search come from [Open-Meteo](https://open-meteo.com). It's free and doesn't need an API key, so there's nothing to set up.

## Run it locally

```bash
git clone https://github.com/Aisha-Aliyu/Atmosfera-weather-app.git
cd Atmosfera-weather-app
npx serve
```
