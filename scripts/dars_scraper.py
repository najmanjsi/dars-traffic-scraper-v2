import requests
import mapbox_vector_tile
import pandas as pd
import os
import math
import hashlib
import logging
import json
from datetime import datetime
import sys
#print("Python:", sys.executable)
#print('script started')

# ---------------- CONFIG ----------------
DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL' # if you want to get discord messages on errors, you have to also uncomment 'send_discord' method calls
BASE_URL = "https://gis.dars.si/data/tiles/fcd"
TILES = [(11, 1106, 727), (11, 1106, 728)]
DATA_DIR = "../data/data/"
TRAFFIC_DIR = os.path.join(DATA_DIR, "traffic")
RAW_DIR = os.path.join(DATA_DIR, "raw")
LOGS_DIR = os.path.join(DATA_DIR, 'logs')
LOGS_FILE = os.path.join(DATA_DIR, 'logs/scraper.log')
SEGMENTS_FILE = os.path.join(DATA_DIR, "segments.parquet")

EXTENT = 4096

os.makedirs(TRAFFIC_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

open(LOGS_FILE, 'a').close()
logging.basicConfig(
    filename=LOGS_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# ---------------- HELPERS ----------------

def tile_to_latlon(z, x, y, px, py):
    n = 2 ** z
    x_global = (x + px / EXTENT) / n
    y_global = (y + 1 - py / EXTENT) / n

    lon = x_global * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y_global))))
    return lat, lon


def get_segment_id(coords):
    return hashlib.md5(str(coords).encode()).hexdigest()


def convert_geometry(coords, z, x, y):
    """Convert full LineString from tile coords → lat/lon"""
    return [
        tile_to_latlon(z, x, y, px, py)
        for px, py in coords
    ]


def send_discord(msg):
    url = DISCORD_WEBHOOK_URL
    requests.post(url, json={'content': msg})


# ---------------- LOAD EXISTING SEGMENTS ----------------

if os.path.exists(SEGMENTS_FILE):
    segments_df = pd.read_parquet(SEGMENTS_FILE)
    known_segments = set(segments_df["segment_id"])
else:
    segments_df = pd.DataFrame(columns=["segment_id", "geometry"])
    known_segments = set()

# ---------------- SCRAPE ----------------

timestamp = datetime.now()
traffic_rows = []
new_segments = []

logging.info(f"Starting scrape at {timestamp}")
for z, x, y in TILES:
    url = f"{BASE_URL}/{z}/{x}/{y}.vector.pbf"

    try:
        r = requests.get(url)

        if r.status_code != 200:
            logging.warning(f"Failed tile {z}/{x}/{y}: {r.status_code}")
            continue

        tile = mapbox_vector_tile.decode(r.content)

        for layer_name, layer in tile.items():
            if not layer_name.startswith("segments"):
                continue

            for feature in layer["features"]:
                props = feature.get("properties", {})
                c_val = props.get("c")

                if c_val is None or c_val <= -2:
                    continue

                geom = feature.get("geometry")

                if not geom or geom["type"] != "LineString":
                    continue

                coords = geom["coordinates"]

                if not coords:
                    continue

                segment_id = get_segment_id(coords)

                # convert FULL geometry
                geometry_latlon = convert_geometry(coords, z, x, y)

                # store traffic
                traffic_rows.append({
                    "timestamp": timestamp,
                    "segment_id": segment_id,
                    "c": int(c_val)
                })

                # store new segment geometry once
                if segment_id not in known_segments:
                    new_segments.append({
                        "segment_id": segment_id,
                        "geometry": geometry_latlon
                    })
                    known_segments.add(segment_id)
        
    except Exception as e:
        error = f'Error fetching tile {z}/{x}/{y}: {e}'
        logging.error(error)
        #send_discord(error)


# ---------------- SAVE SEGMENTS ----------------

if new_segments:
    new_df = pd.DataFrame(new_segments)
    segments_df = pd.concat([segments_df, new_df], ignore_index=True)
    segments_df.to_parquet(SEGMENTS_FILE, index=False)

# ---------------- SAVE TRAFFIC ----------------

if traffic_rows:
    traffic_df = pd.DataFrame(traffic_rows)

    day_file = os.path.join(
        TRAFFIC_DIR,
        timestamp.strftime("%Y-%m-%d.parquet")
    )

    if os.path.exists(day_file):
        existing = pd.read_parquet(day_file)
        traffic_df = pd.concat([existing, traffic_df], ignore_index=True)

    traffic_df.to_parquet(day_file, index=False)
else:
    pass
    #send_discord('No traffic data returned.')


logging.info(f'Saved {len(traffic_rows)} rows')
