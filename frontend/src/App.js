// src/App.js
import React, { useState, useMemo } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardMedia,
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import 'leaflet/dist/leaflet.css';

// Import marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure the default icon
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41], // Default size for Leaflet markers
  iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Set the default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

const Input = styled('input')({
  display: 'none',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Customize primary color
    },
    secondary: {
      main: '#d32f2f', // Customize secondary color
    },
  },
});

function App() {
  const [gsvUrl, setGsvUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGsvUrlChange = (event) => {
    setGsvUrl(event.target.value);
  };

  const handleImageUpload = (event) => {
    setImageFile(event.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!gsvUrl && !imageFile) {
      alert('Please provide a GSV URL or upload an image.');
      return;
    }

    setLoading(true);
    setDetectionResults(null);

    const formData = new FormData();
    if (gsvUrl) formData.append('gsv_url', gsvUrl);
    if (imageFile) formData.append('image_file', imageFile);

    try {
      const response = await axios.post('http://127.0.0.1:8000/detect/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setDetectionResults(response.data);
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      alert('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!detectionResults || !detectionResults.object_locations) {
      alert('No object locations to download.');
      return;
    }

    const csvRows = [];
    const headers = ['Class Name', 'Confidence', 'Distance (m)', 'Latitude', 'Longitude'];
    csvRows.push(headers.join(','));

    detectionResults.object_locations.forEach((location) => {
      const row = [
        location.class_name,
        (location.confidence * 100).toFixed(2) + '%',
        location.distance.toFixed(2),
        location.latitude,
        location.longitude,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'object_locations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Memoize the center position to prevent unnecessary re-renders
  const centerPosition = useMemo(() => {
    if (detectionResults && detectionResults.object_locations && detectionResults.object_locations.length > 0) {
      return [
        detectionResults.object_locations[0].latitude,
        detectionResults.object_locations[0].longitude,
      ];
    }
    return [51.505, -0.09]; // Default center (e.g., London)
  }, [detectionResults]);

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" style={{ marginTop: '2rem' }}>
        <Typography variant="h4" align="center" gutterBottom style={{ fontWeight: 'bold' }}>
          Object Detection App
        </Typography>

        <Paper style={{ padding: '2rem', marginTop: '2rem' }} elevation={3}>
          <Typography variant="h5" gutterBottom>
            Input
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Google Street View URL"
                variant="outlined"
                fullWidth
                value={gsvUrl}
                onChange={handleGsvUrlChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                Or upload an image:
              </Typography>
              <label htmlFor="upload-image">
                <Input
                  accept="image/*"
                  id="upload-image"
                  type="file"
                  onChange={handleImageUpload}
                />
                <Button variant="contained" component="span" color="primary">
                  Upload Image
                </Button>
                {imageFile && <span style={{ marginLeft: '1rem' }}>{imageFile.name}</span>}
              </label>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={loading}
                size="large"
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <CircularProgress />
          </div>
        )}

        {detectionResults && (
          <div style={{ marginTop: '2rem' }}>
            <Typography variant="h5" gutterBottom>
              Detection Results
            </Typography>
            <Card>
              <CardMedia
                component="img"
                image={`data:image/jpeg;base64,${detectionResults.annotated_image}`}
                alt="Annotated Image"
              />
            </Card>
            {/* Display detections */}
            <Typography variant="h6" style={{ marginTop: '1rem' }}>
              Detected Objects:
            </Typography>
            {detectionResults.detections.map((detection, index) => (
              <Typography key={index}>
                {detection.class_name} ({(detection.confidence * 100).toFixed(2)}%)
              </Typography>
            ))}

            {/* Display map and download button if object locations are available */}
            {detectionResults.object_locations && detectionResults.object_locations.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <Typography variant="h6">Object Locations:</Typography>
                <MapContainer
                  center={centerPosition}
                  zoom={18}
                  style={{ height: '500px', width: '100%', marginTop: '1rem' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {detectionResults.object_locations.map((location, index) => (
                    <Marker
                      key={index}
                      position={[location.latitude, location.longitude]}
                    >
                      <Popup>
                        <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                          {location.class_name}
                        </Typography>
                        <Typography variant="body2">
                          Confidence: {(location.confidence * 100).toFixed(2)}%<br />
                          Distance: {location.distance.toFixed(2)} meters<br />
                          Latitude: {location.latitude.toFixed(6)}<br />
                          Longitude: {location.longitude.toFixed(6)}
                        </Typography>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                <Button
                  variant="contained"
                  color="secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={handleDownload}
                >
                  Download Object Locations
                </Button>
              </div>
            )}
          </div>
        )}

        <footer style={{ marginTop: '4rem', textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            © {new Date().getFullYear()} Your Company Name
          </Typography>
        </footer>
      </Container>
    </ThemeProvider>
  );
}

export default App;
