import os
import pandas as pd
import datetime
import argparse

parser = argparse.ArgumentParser('read_parquet', suggest_on_error=True)
parser.add_argument('-f', '--filetype', default='traffic', choices=['segments', 'traffic'], help='either "segments" (segment id to geometry mapping) or "traffic" (daily scraped files)')
parser.add_argument('-t', '--tail', default=10, type=int, help='number of lines to be returned (at the end of the file)')
args = parser.parse_args()


DATA_DIR = "../data/data"
SEGMENTS_FILE = os.path.join(DATA_DIR, "segments.parquet")
TRAFFIC_DIR = os.path.join(DATA_DIR, "traffic")
TODAY_FILE = datetime.datetime.now().strftime('%Y-%m-%d.parquet')

segments_df = pd.read_parquet(SEGMENTS_FILE)
traffic_df = pd.read_parquet(TRAFFIC_DIR + '/' + TODAY_FILE)

t = args.tail
if args.filetype == 'segments':
    print(segments_df.iloc[0]['geometry'])
else:
    print(traffic_df.tail(t))