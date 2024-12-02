# app/utils/image_utils.py
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
import base64

def process_image(image_path, detection_results, camera_gps=None, base_azimuth=None):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Failed to load image.")

    # Draw bounding boxes on the image
    annotated_img = detection_results[0].plot()

    _, buffer = cv2.imencode('.jpg', annotated_img)
    encoded_image = base64.b64encode(buffer).decode('utf-8')

    # Convert image to base64 or save it to a file as needed
    # Here we just return detection data
    detections = []
    for result in detection_results:
        boxes = result.boxes
        for box in boxes:
            xmin, ymin, xmax, ymax = map(float, box.xyxy[0])
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = detection_results[0].names[class_id]

            detections.append({
                "class_name": class_name,
                "class_id": class_id,
                "confidence": confidence,
                "bbox": [xmin, ymin, xmax, ymax]
            })

    return {
        "detections": detections,
        "annotated_image": encoded_image
    }
