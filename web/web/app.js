// app.js

import { parquetReadObjects } from 'https://cdn.jsdelivr.net/npm/hyparquet/+esm';

// --------------------------------------------------
// MAP
// --------------------------------------------------

const map = L.map('map', {
    zoomControl: false
}).setView([46.05, 14.5], 12);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

L.control.zoom({
    position: 'topright'
}).addTo(map);

// --------------------------------------------------
// GLOBALS
// --------------------------------------------------

let geometry = {};
let segmentLayers = {};

//let frameFiles = [];
let trafficFrames = [];

let currentFrame = 0;
let timer = null;

let isPlaying = false;

let legendShown = false;
let weatherShown = false;

// day selector
const startDate = "2026-04-17";
const endDate = "2026-05-14";

// weather data
async function getWeatherData(date) {

    const params = new URLSearchParams({
        latitude: 46.05,
        longitude: 14.51,
        start_date: date,
        end_date: date,
        hourly: 'temperature_2m,precipitation,weathercode',
        timezone: 'UTC'
    });

    const url = `https://archive-api.open-meteo.com/v1/archive?${params}`;

    const response = await fetch(url);

    return await response.json();
}

let weatherData = null; //await getWeatherData(endDate);


// --------------------------------------------------
// UI
// --------------------------------------------------

const timeline = document.getElementById('timeline');
const timestampDiv = document.getElementById('timestamp');
const speedSelect = document.getElementById('speedSelect');

const loadingOverlay = document.getElementById('loadingOverlay')
const loadingText = document.getElementById('loadingText')
function showLoading() {
    loadingOverlay.style.display = 'flex';
}
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

const legendBtn = document.getElementById('legendBtn');
const legend = document.getElementById('legend');
legend.style.display = 'none';

// weather
const weatherBtn = document.getElementById('weatherBtn');
const weather = document.getElementById('weather');
weather.style.display = 'none';

//console.log(weatherData.hourly);

function weatherIcon(code) {

    if (code === 0) return '☀';

    if ([1,2,3].includes(code)) return '🌤';

    if ([51,53,55].includes(code)) return '🌦';

    if ([61,63,65].includes(code)) return '🌧';

    if ([71,73,75].includes(code)) return '❄';

    return '☁';
}

function updateHourlyWeather(hourIndex) {
    weather.innerText = `vreme: ${weatherIcon(weatherData.hourly.weathercode[hourIndex])}
                        padavine: ${weatherData.hourly.precipitation[hourIndex]}mm
                        temperatura: ${weatherData.hourly.temperature_2m[hourIndex]}°C`;
}

function generateDateRange(start, end) {

    const dates = [];

    let current = new Date(start);
    const last = new Date(end);

    while (current <= last) {

        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');

        dates.push(`${yyyy}-${mm}-${dd}`);

        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function generateDateRangeToToday(start) {

    const dates = [];

    let current = new Date(start);
    const last = new Date(); // today

    while (current <= last) {

        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');

        dates.push(`${yyyy}-${mm}-${dd}`);

        current.setDate(current.getDate() + 1);
    }

    return dates;
}

const availableDays = generateDateRange(startDate, endDate);
//console.log(availableDays)

const daySelect = document.getElementById('daySelect');

for (const day of availableDays) {
    const option = document.createElement('option');

    option.value = day;
    option.textContent = day;

    daySelect.appendChild(option);
}


// --------------------------------------------------
// COLORS
// --------------------------------------------------

let useInterpolatedColors = false;
const colorModeBtn = document.getElementById('colorModeBtn');


function getCategoricalColor(c) {
    //return '#391661'
    
    if (c < 60) return '#008E30';

    if (c < 250) return '#F49E00';

    if (c < 500) return '#E2001A';

    return '#9E0F00';
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {

    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));

    return `rgb(${r}, ${g}, ${b})`;
}

function getInterpolatedColor(c) {

    // 0–60
    if (c < 60) {

        const t = c / 60;

        return lerpColor(
            [0, 110, 40],   // darker green
            [0, 142, 48],   // official green
            t
        );
    }

    // 60–250
    if (c < 250) {

        const t = (c - 60) / (250 - 60);

        return lerpColor(
            [255, 220, 120],  // pale orange-yellow
            [244, 158, 0],    // official orange
            t
        );
    }

    // 250–500
    if (c < 500) {

        const t = (c - 250) / (500 - 250);

        return lerpColor(
            [255, 120, 120],  // lighter red
            [226, 0, 26],     // official red
            t
        );
    }

    // 500+
    const t = Math.min((c - 500) / 500, 1);

    return lerpColor(
        [158, 15, 0],   // official dark red
        [90, 0, 0],     // deeper dark red
        t
    );
}


// --------------------------------------------------
// LOAD GEOMETRY
// --------------------------------------------------

async function loadGeometry() {

    hideLoading();

    geometry = await fetch('./exported/geometry.json')
        .then(r => r.json());

    console.log('Geometry loaded:',
        Object.keys(geometry).length);

    for (const [segmentId, coords] of Object.entries(geometry)) {

        const polyline = L.polyline(coords, {
            color: 'gray',
            weight: 3,
            opacity: 0.8
        }).addTo(map);

        segmentLayers[segmentId] = polyline;
    }
}

/*
// --------------------------------------------------
// FRAME FILE LIST
// --------------------------------------------------

async function loadFrameList() {

    // THIS FILE MUST EXIST
    // generated automatically later

    frameFiles = await fetch('./frames/index.json')
        .then(r => r.json());

    console.log('Frames:', frameFiles.length);

    timeline.max = frameFiles.length - 1;
}
*/

async function loadTrafficDay(selectedDay) {

    showLoading();
    //console.log('started loading')
    //loadingText.innerText = 'TVOJA MAMI'

    const response = await fetch(
        `/data/data/traffic/${selectedDay}.parquet`
    );

    // this threw an error: parquet expected AsyncBuffer
    //const rows = await parquetReadObjects({
    //    file: response
    //});

    const arrayBuffer = await response.arrayBuffer();

    const rows = await parquetReadObjects({
        file: arrayBuffer
    });

    console.log('Rows loaded:', rows.length);

    // -----------------------------------
    // BUILD FRAMES
    // -----------------------------------

    const frameMap = new Map();

    for (const row of rows) {

        const ts = String(row.timestamp);

        if (!frameMap.has(ts)) {
            frameMap.set(ts, {});
        }

        frameMap.get(ts)[String(row.segment_id)] = row.c;
    }

    // convert into ordered array

    trafficFrames = Array
        .from(frameMap.entries())
        .map(([timestamp, values]) => ({
            timestamp,
            values
        }));
        //.sort((a, b) =>
        //    a.timestamp.localeCompare(b.timestamp)
        //);

    console.log(
        'Frames created:',
        trafficFrames.length
    );

    timeline.max = trafficFrames.length - 1;

    // weather
    weatherData = await getWeatherData(selectedDay);
    console.log(weatherData.hourly);

    hideLoading();
    //console.log('finished loading')
}

/*
// --------------------------------------------------
// LOAD FRAME PARQUET
// --------------------------------------------------

async function loadFrame(frameIndex) {

    const file = frameFiles[frameIndex];

    if (!file) return;

    const response = await fetch(`./frames/${file}`);

    const rows = await parquetReadObjects({
        file: response
    });

    renderFrame(rows, file);

    currentFrame = frameIndex;
}
*/

// --------------------------------------------------
// RENDER FRAME
// --------------------------------------------------

function renderFrame(frameIndex) {

    const frame = trafficFrames[frameIndex];

    if (!frame) return;

    const date = new Date(frame.timestamp);
    timestampDiv.innerText = date.toLocaleDateString(
        'sl-SI', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

    timeline.value = frameIndex;

    for (const [segmentId, c]
        of Object.entries(frame.values)) {

        const layer = segmentLayers[segmentId];

        if (!layer) continue;
        
        layer.setStyle({
            color: useInterpolatedColors ? getInterpolatedColor(Number(c)) : getCategoricalColor(Number(c))
        });
    }

    // weather
    updateHourlyWeather(date.getUTCHours());
}

function redrawCurrentFrame() {

    if (!frames.length) return;

    renderFrame(currentFrame);
}

// --------------------------------------------------
// PLAYBACK
// --------------------------------------------------

function play() {

    stop();

    const interval = parseInt(speedSelect.value);

    timer = setInterval(async () => {

        renderFrame(currentFrame);

        currentFrame++;

        if (currentFrame >= trafficFrames.length) {
            currentFrame = 0;
        }

    }, interval);
}

function stop() {

    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// --------------------------------------------------
// UI EVENTS
// --------------------------------------------------

//document.getElementById('playBtn')
//    .onclick = play;

//document.getElementById('pauseBtn')
//    .onclick = stop;

function togglePlayback() {
    isPlaying = !isPlaying;

    if (isPlaying) {
        playBtn.innerText = '⏸ Stop';
        play();
    }
    else {
        playBtn.innerText = '▶ Start';
        stop();
    }
}

const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', () => {
    togglePlayback();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
    }
});

speedSelect.onchange = () => {

    if (timer) {
        play();
    }
};

timeline.oninput = async (e) => {

    //stop();

    currentFrame = parseInt(e.target.value);

    renderFrame(currentFrame);
};

daySelect.onchange = async () => {

    stop();
    currentFrame = 0;

    //weatherData = getWeatherData(daySelect.value);

    await loadTrafficDay(daySelect.value);

    renderFrame(0);
};

colorModeBtn.addEventListener('click', () => {

    useInterpolatedColors = !useInterpolatedColors;

    if (useInterpolatedColors) {
        colorModeBtn.innerText = 'Pobarvaj preprosto';
    }
    else {
        colorModeBtn.innerText = 'Pobarvaj interpolirano';
    }

    renderFrame(currentFrame);
    //redrawCurrentFrame();
});


function toggleLegend() {
    legendShown = !legendShown;

    legend.style.display = legendShown? 'inline-block' : 'none';
}

legendBtn.onclick = toggleLegend;

// weather UI
function toggleWeather() {
    weatherShown = !weatherShown;

    weather.style.display = weatherShown? 'inline-block' : 'none';
}

weatherBtn.onclick = toggleWeather;

// --------------------------------------------------
// STARTUP
// --------------------------------------------------

async function init() {

    await loadGeometry();

    const lastDay = availableDays[availableDays.length - 1];
    daySelect.value = lastDay;

    await loadTrafficDay(lastDay);

    renderFrame(0);
}

init();
