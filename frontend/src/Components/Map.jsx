import React from "react";
import Plot from "react-plotly.js";

const Map = ({ detections, cameraGPS }) => {
  const latitudes = detections.map((det) => det.latitude);
  const longitudes = detections.map((det) => det.longitude);

  return (
    <Plot
      data={[
        {
          type: "scattermapbox",
          lat: latitudes,
          lon: longitudes,
          mode: "markers",
          marker: { size: 14, color: "red" },
          text: detections.map((det) => det.class_name),
        },
      ]}
      layout={{
        mapbox: {
          style: "open-street-map",
          center: { lat: cameraGPS[0], lon: cameraGPS[1] },
          zoom: 15,
        },
        title: "Detected Objects",
      }}
    />
  );
};

export default Map;
