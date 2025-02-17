import React, { useEffect } from 'react';

const MapComponent = () => {
  useEffect(() => {
    const map = L.map('map').setView([51.505, -0.09], 13);

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

  return <div id="map"></div>;
};

export default MapComponent;