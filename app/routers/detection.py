from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from utils.gsv_utils import extract_data_from_url, fetch_image
from utils.image_utils import process_image
from utils.file_utils import save_temp_file, remove_temp_file
from models.yolo_model import YOLOModel
from utils.map_utils import calculate_object_locations
import os
import uuid

router = APIRouter(
    prefix="/detect",
    tags=["detection"]
)

# Initialize YOLO model (load once)
yolo_model = YOLOModel(model_path="app/models/best.pt")

@router.post("/")
async def detect_objects(
    gsv_url: str = Form(None),
    image_file: UploadFile = File(None)
):
    if gsv_url:
        # Process Google Street View URL
        try:
            camera_gps, base_azimuth, panoid = extract_data_from_url(gsv_url)
            image_path = fetch_image(camera_gps, panoid, heading=base_azimuth)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif image_file:
        # Process uploaded image
        try:
            contents = await image_file.read()
            unique_filename = f"temp_{uuid.uuid4()}.jpg"
            image_path = save_temp_file(unique_filename, contents)
            camera_gps = None
            base_azimuth = None
        except Exception as e:
            raise HTTPException(status_code=400, detail="Failed to process uploaded image.")
    else:
        raise HTTPException(status_code=400, detail="No input provided. Provide a GSV URL or upload an image.")

    # Run detection
    try:
        detection_results = yolo_model.detect(image_path)
        # Process results
        processed_results = process_image(
            image_path, detection_results, camera_gps, base_azimuth
        )
        # Calculate object locations if GPS data is available
        if camera_gps and base_azimuth:
            object_locations = calculate_object_locations(
                detection_results, camera_gps, base_azimuth, image_path
            )
        else:
            object_locations = None

        # Prepare the response
        response = {
            "detections": processed_results["detections"],          # Corrected
            "object_locations": object_locations,
            "annotated_image": processed_results["annotated_image"]
        }

        return response
    finally:
        # Clean up temporary image files
        remove_temp_file(image_path)

