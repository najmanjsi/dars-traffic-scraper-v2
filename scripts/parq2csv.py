import os
import pandas as pd
import datetime
from pathlib import Path

DATA_DIR = "../data/data/"
SEGMENTS_FILE = os.path.join(DATA_DIR, "segments.parquet")
TRAFFIC_DIR = os.path.join(DATA_DIR, "traffic")
TODAY_FILE = datetime.datetime.now().strftime('%Y-%m-%d.parquet')
SELECTED_FILE = '2026-05-01.parquet'
HOUR_TO_EXTRACT = 7
OUTPUT_NAME = f'2026-05-01_{HOUR_TO_EXTRACT:02d}00-{((HOUR_TO_EXTRACT + 1) % 24):02d}00.csv'
CSV_OUTPUT_FILE = Path(TRAFFIC_DIR) / 'example' / OUTPUT_NAME

#segments_df = pd.read_parquet(SEGMENTS_FILE)
traffic_df = pd.read_parquet(TRAFFIC_DIR + '/' + SELECTED_FILE)
hour_df = traffic_df[traffic_df['timestamp'].dt.hour == HOUR_TO_EXTRACT - 2]

hour_df.to_csv(CSV_OUTPUT_FILE, index=False)
