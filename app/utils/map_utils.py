# app/utils/map_utils.py
from geopy.distance import geodesic
import math
import cv2

def calculate_object_locations(detection_results, camera_gps, base_azimuth, image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Failed to load image for object location calculations.")

    img_width = img.shape[1]
    locations = []

    for result in detection_results:
        boxes = result.boxes
        for box in boxes:
            xmin, ymin, xmax, ymax = map(float, box.xyxy[0])
            class_id = int(box.cls[0])
            class_name = result.names[class_id]
            confidence = float(box.conf)

            # Bounding box center
            object_center_x = (xmin + xmax) / 2
            azimuth_offset = ((object_center_x / img_width) * 30) - 15  # Adjust as needed
            object_azimuth = (base_azimuth + azimuth_offset) % 360

            # Estimate distance dynamically (simplified example)
            box_width = xmax - xmin
            box_height = ymax - ymin
            size = max(box_width, box_height)
            distance = 10 * (200 / size)  # Adjust as needed

            # Calculate real-world coordinates
            destination = geodesic(meters=distance).destination(camera_gps, object_azimuth)
            object_location = {
                "class_name": class_name,
                "latitude": destination.latitude,
                "longitude": destination.longitude,
                "distance": distance,
                "azimuth": object_azimuth,
                "confidence":confidence
            }
            locations.append(object_location)

    return locations
