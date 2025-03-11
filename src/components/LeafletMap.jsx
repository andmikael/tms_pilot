import React, { useEffect, useRef } from 'react';

const LeafletMap = () => {
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize LeafLet map instance (L.map)
    const map = L.map('map').setView([62.7903, 22.8403], 9);
    mapInstanceRef.current = map;

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

    //Removes previous Map container if it already exists
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <h3>Leaflet Map</h3>
      <div id="map" style={{ height: '60vh', width: '80%' }}></div>
    </div>
  );
};

export default LeafletMap;