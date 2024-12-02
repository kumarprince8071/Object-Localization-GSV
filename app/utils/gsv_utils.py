# app/utils/gsv_utils.py
import re
import requests
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

def extract_data_from_url(street_view_url):
    gps_pattern = r"@([0-9.-]+),([0-9.-]+)"
    heading_pattern = r"h,([0-9.]+)"
    panoid_pattern = r"panoid%3D([\w-]+)"

    # Extract GPS coordinates
    gps_match = re.search(gps_pattern, street_view_url)
    if gps_match:
        latitude = float(gps_match.group(1))
        longitude = float(gps_match.group(2))
        camera_gps = (latitude, longitude)
    else:
        raise ValueError("Could not extract GPS coordinates from the URL.")

    # Extract heading (azimuth)
    heading_match = re.search(heading_pattern, street_view_url)
    base_azimuth = float(heading_match.group(1)) if heading_match else 0.0

    # Extract panoid
    panoid_match = re.search(panoid_pattern, street_view_url)
    panoid = panoid_match.group(1) if panoid_match else None

    return camera_gps, base_azimuth, panoid

def fetch_image(camera_gps, panoid, heading=0, pitch=0, fov=180, save_path=None):
    api_key = os.getenv("GSV_API_KEY")
    if not api_key:
        raise ValueError("Google Street View API key not found in environment variables.")

    base_url = "https://maps.googleapis.com/maps/api/streetview"
    params = {
        "size": "640x640",
        "heading": heading,
        "pitch": pitch,
        "fov": fov,
        "key": api_key
    }
    if panoid:
        params["pano"] = panoid
    else:
        params["location"] = f"{camera_gps[0]},{camera_gps[1]}"

    response = requests.get(base_url, params=params, stream=True)
    if response.status_code == 200:
        if not save_path:
            save_path = f"temp_image_{uuid.uuid4()}.jpg"
        with open(save_path, "wb") as f:
            f.write(response.content)
        return save_path
    else:
        raise Exception(f"Failed to fetch image: {response.status_code}, {response.text}")
