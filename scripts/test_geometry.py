import pandas as pd
import folium
import numpy as np

MAP_NAME = 'new_map.html'

df = pd.read_parquet("data/segments.parquet")

# center map (Ljubljana)
m = folium.Map(location=[46.05, 14.5], zoom_start=13)

def normalize_line(line):
    coords = []

    for p in line:
        p = np.array(p)

        lat, lon = float(p[0]), float(p[1])

        # sanity check: swap if clearly wrong
        if abs(lat) > 90:  
            lat, lon = lon, lat

        coords.append((lat, lon))

    return coords


# traffic congestion overlay
traffic = pd.read_parquet("data/traffic/2026-04-21.parquet")

latest = traffic.sort_values("timestamp").groupby("segment_id").tail(1)

df = df.merge(latest, on="segment_id", how="left")


def color(c):
    if c is None:
        return "gray"
    if c < 60:
        return "green"
    if c < 250:
        return "orange"
    if c < 500:
        return "red"
    return "darkred"


count = 0

for _, row in df.iterrows():
    line = normalize_line(row["geometry"])

    # skip broken lines
    if len(line) < 2:
        continue

    folium.PolyLine(
        line,
        color=color(row["c"]),
        weight=3,
    ).add_to(m)

    #folium.PolyLine(
    #    line,
    #    color="blue",
    #    weight=2,
    #    opacity=0.7
    #).add_to(m)

    count += 1

print("Lines drawn:", count)

m.save(f"visuals/{MAP_NAME}.html")
print(f"Saved {MAP_NAME}.html")