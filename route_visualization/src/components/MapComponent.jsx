import React, { useEffect } from 'react';

const MapComponent = () => {
  useEffect(() => {
    // Check if the map is already initialized
    if (window.map) {
      window.map.remove(); // Remove the existing map instance
      window.map = null;
    }

    const map = L.map('map').setView([62.7903, 22.8403], 9);
    window.map = map; // Store the map instance in the global window object

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.Routing.control({
      waypoints: [
        L.latLng(62.826941, 22.909949),
        L.latLng(62.626202, 22.395327),
        L.latLng(62.424408, 22.173556),
      ],
    }).addTo(map);
  }, []);

  return <div id="map" style={{ height: '100vh', width: '100%' }}></div>;
};

export default MapComponent;
