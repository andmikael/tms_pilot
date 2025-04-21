import React, { useEffect, useRef } from 'react';
import { routePropType } from '../propTypes/routePropType';

const LeafletMap = ({ dataToParent }) => {
  if (!dataToParent) {
    return <div>dataToParent not defined. Can't draw LeafletMap</div>;
  }
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize LeafLet map instance (L.map)
    const map = L.map('map').setView([62.7903, 22.8403], 9);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const pickUpPointObjects = [
      ...dataToParent
    ];

    const waypoints = pickUpPointObjects.map(point => L.latLng(point.lat, point.lon));

    L.Routing.control({
      waypoints: waypoints,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
    }).addTo(map);

    // Grouped points are needed as sometimes multiple points are in the same location (coordinates)
    // Otherwise, the markers would be stacked on top of each other and bottom ones would not be visible
    const groupedPoints = {};


    pickUpPointObjects.forEach((point, index, array) => {
      const key = `${point.lat},${point.lon}`;
      if (!groupedPoints[key]) {
        groupedPoints[key] = [];
      }
    
      let label;
      if (index === 0) {
        label = "Aloituspaikka:";
      } else if (index === array.length - 1) {
        label = "Lopetuspaikka:";
      } else {
        label = index.toString() + '.';
      }
      // Saves the points in a dictionary with the coordinates as the key
      // The coordinates are in format "lat,lon" (e.g. "62.7903,22.8403")
      groupedPoints[key].push({
        label,
        name: point.name,
        address: point.address,
        city: point.city,
        postalCode: point.postalCode,
        standardPickup: point.standardPickup,
      });
    });

    // Creates markers with (possible) combined labels
    Object.entries(groupedPoints).forEach(([key, points]) => {
      const [lat, lon] = key.split(',').map(Number);
    
      // Tooltip text (the always visible one) 
      const tooltipText = points.map(p => `${p.label} ${p.name}`).join('<br>');
    
      // Popup text (the one that opens when clicking the marker)
      const popupText = points.map(p => `
        ${p.name}<br>
        ${p.address}<br>
        ${p.city}, ${p.postalCode}<br>
        Vakionouto: ${p.standardPickup == 'yes' ? 'Kyllä' : 'Ei'}
      `).join('<hr>');
      
      L.marker([lat, lon])
        .addTo(map)
        .bindTooltip(tooltipText, { permanent: true, direction: 'right' })
        .openTooltip()
        .bindPopup(popupText);
    });

    //Removes previous Map container if it already exists
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [dataToParent]);

  return (
    <div>
      <div id="map" style={{ height: '60vh' }}></div>
    </div>
  );
};

LeafletMap.propTypes = {
  route: routePropType.isRequired,
}

export default LeafletMap;