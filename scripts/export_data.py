import json
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import datetime
import zoneinfo
#from dateutil.parser import parse

BASE = Path(__file__).parent.parent

#s = '2026-05-08 11:30:05,244'.split(',')[0]
#dt = datetime.datetime.strptime(s, '%Y-%m-%d %H:%M:%S')
#dt2 = dt.astimezone(zoneinfo.ZoneInfo('Europe/Ljubljana')).strftime('%Y-%m-%d %H:%M:%S')
#dt2 = parse(s)

args = sys.argv
if len(args) > 1:
    day_file = args[1]
else:
    today = datetime.datetime.now()
    yesterday = today - datetime.timedelta(days=1)
    day_file = today.strftime('%Y-%m-%d.parquet')

SEGMENTS_FILE = BASE / 'data' / 'data' / 'segments.parquet'
TRAFFIC_DIR = BASE / 'data' / 'data' / 'traffic'
TRAFFIC_FILE = TRAFFIC_DIR / day_file

OUTPUT_DIR = BASE / 'web' / 'exported'
FRAMES_DIR = OUTPUT_DIR / 'frames'

def makedirs():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(exist_ok=True)


# export geometry
def export_geometry():
    #print('Loading segments...')
    segments = pd.read_parquet(SEGMENTS_FILE)

    geometry = {}

    for _, row in segments.iterrows():
        seg_id = str(row['segment_id'])

        coords = []

        for p in row['geometry']:
            p = np.array(p)

            lat = float(p[0])
            lon = float(p[1])

            coords.append([lat, lon])
        
        geometry[seg_id] = coords

    with open(OUTPUT_DIR / 'geometry.json', 'w') as f:
        json.dump(geometry, f)

    print('Saved geometry.json')


# export traffic frames

#traffic['timestamp'] = traffic['timestamp'].astype(str)

#print('converted datetime timestamps to string')

def export_traffic():
    print('Loading traffic...')
    traffic = pd.read_parquet(TRAFFIC_FILE)

    print('preparing traffic data')

    frames = []
    values = {}

    prev_ts = None

    for _, row in traffic.iterrows():
    #for i in range(len(traffic)):
        row = traffic.iloc[i]

        timestamp = str(row['timestamp'])
        segment_id = str(row['segment_id'])
        c = int(row['c'])

        if timestamp != prev_ts and prev_ts is not None:
            frames.append({
                'timestamp': prev_ts,
                'values': values
            })
            values = {}
            print('.', end='')
        
        values[segment_id] = c

        prev_ts = timestamp

    # let's not forget the last frame
    if prev_ts is not None:
        frames.append({
            'timestamp': prev_ts,
            'values': values
        })

    print('prepared traffic data for json saving')

    with open(OUTPUT_DIR / 'traffic.json', 'w') as f:
        json.dump(frames, f)

    print('Saved traffic.json')


def update_dateindex():
    dates = sorted([file.stem for file in TRAFFIC_DIR.glob('*.parquet')])

    with open(TRAFFIC_DIR / 'index.json', 'w') as f:
        json.dump(dates, f)


#makedirs()
#export_geometry() # uncomment if you need to export again, otherwise leave commented
#export_traffic() # uncomment for exporting traffic - IMPORTANT: very RAM heavy! (it kills the process on the 1GB RAM linux server)

update_dateindex()

print('Done')