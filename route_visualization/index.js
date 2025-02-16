const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve Leaflet and Leaflet Routing Machine files
app.use(
  '/leaflet',
  express.static(path.join(__dirname, 'src', 'leaflet', 'dist'))
);
app.use(
  '/leaflet-routing-machine',
  express.static(path.join(__dirname, 'src', 'leaflet-routing-machine', 'dist'))
);

// Serve the React app
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
