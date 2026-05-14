import os
import pandas as pd
import datetime

DATA_DIR = "../data"
SEGMENTS_FILE = os.path.join(DATA_DIR, "segments.parquet")
TRAFFIC_DIR = os.path.join(DATA_DIR, "traffic")
TODAY_FILE = datetime.datetime.now().strftime('%Y-%m-%d.parquet')

segments_df = pd.read_parquet(SEGMENTS_FILE)
traffic_df = pd.read_parquet(TRAFFIC_DIR + '/' + TODAY_FILE)

print(traffic_df.tail(10))