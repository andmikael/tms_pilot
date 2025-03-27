import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types'
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

    const pickUpPoints = [
      L.latLng(dataToParent.startPlace.lat, dataToParent.startPlace.lon),
      ...dataToParent.routes.map((place) => L.latLng(place.lat, place.lon)),
      L.latLng(dataToParent.endPlace.lat, dataToParent.endPlace.lon),
    ];

    L.Routing.control({
      waypoints: pickUpPoints,
    }).addTo(map);

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