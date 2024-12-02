# app/main.py
from fastapi import FastAPI
from routers import detection
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="Object Detection API",
    description="An API for detecting objects in Google Street View images",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include the detection router
app.include_router(detection.router)
