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

    const pickUpPointObjects = [
      dataToParent.startPlace,
      ...dataToParent.routes,
      dataToParent.endPlace,
    ];

    L.Routing.control({
      waypoints: pickUpPointObjects.map((point) => L.latLng(point.lat, point.lon)),
      showAlternatives: false,
    }).addTo(map);

    pickUpPointObjects.forEach((point, index, array) => {
      let label;

      if (index === 0) {
        label = "Aloituspaikka:";
      } else if (index === array.length - 1) {
        label = "Lopetuspaikka";
      } else {
        label = index.toString() + '.';
      }
      L.marker([point.lat, point.lon])
        .addTo(map)
        .bindTooltip(`${label} ${point.name}`, { permanent: true, direction: 'right' })
        .openTooltip()
        .bindPopup(
          `${point.name}<br>
          ${point.address}<br>
          ${point.city}, ${point.postalCode}<br>
          Vakionouto: ${point.standardPickup == 'yes' ? 'Kyllä' : 'Ei'}`
        );
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