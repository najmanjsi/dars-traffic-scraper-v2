// app.js

import { parquetReadObjects } from 'https://cdn.jsdelivr.net/npm/hyparquet/+esm';

// --------------------------------------------------
// MAP
// --------------------------------------------------

const map = L.map('map').setView([46.05, 14.5], 12);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

// --------------------------------------------------
// GLOBALS
// --------------------------------------------------

let geometry = {};
let segmentLayers = {};

//let frameFiles = [];
let trafficFrames = [];

let currentFrame = 0;
let timer = null;

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


// --------------------------------------------------
// COLORS
// --------------------------------------------------

function getColor(c) {

    if (c < 60) return '#008E30';

    if (c < 250) return '#F49E00';

    if (c < 500) return '#E2001A';

    return '#9E0F00';
}

// --------------------------------------------------
// LOAD GEOMETRY
// --------------------------------------------------

async function loadGeometry() {

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

async function loadTrafficDay() {

    showLoading();
    console.log('started loading')
    loadingText.innerText = 'TVOJA MAMI'

    const response = await fetch(
        '/data/traffic/2026-05-11.parquet'
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
        }))
        .sort((a, b) =>
            a.timestamp.localeCompare(b.timestamp)
        );

    console.log(
        'Frames created:',
        trafficFrames.length
    );

    timeline.max = trafficFrames.length - 1;

    hideLoading();
    console.log('finished loading')
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

    timestampDiv.innerText = frame.timestamp;

    timeline.value = frameIndex;

    for (const [segmentId, c]
        of Object.entries(frame.values)) {

        const layer = segmentLayers[segmentId];

        if (!layer) continue;

        layer.setStyle({
            color: getColor(c)
        });
    }
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

document.getElementById('playBtn')
    .onclick = play;

document.getElementById('pauseBtn')
    .onclick = stop;

speedSelect.onchange = () => {

    if (timer) {
        play();
    }
};

timeline.oninput = async (e) => {

    stop();

    currentFrame = parseInt(e.target.value);

    renderFrame(currentFrame);
};

// --------------------------------------------------
// STARTUP
// --------------------------------------------------

async function init() {

    await loadGeometry();

    await loadTrafficDay();

    renderFrame(0);
}

init();
