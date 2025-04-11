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
      ...dataToParent
    ];

    const colors = [
      '#0074D9', // strong blue
      '#2ECC40', // medium green
      '#FF851B', // orange
      '#B10DC9', // purple
      '#85144b', // maroon
      '#3D9970', // teal
      '#555555', // dark gray
      '#FF4136', // red
      '#7FDBFF', // light blue
      '#F012BE', // pink
      '#01FF70', // neon green
      '#AAAAAA', // medium gray
      '#FFDC00', // golden yellow
      '#39CCCC', // light teal
      '#111111', // blackish
      '#F0E68C', // khaki
      '#8B4513', // saddle brown
      '#4682B4', // steel blue
    ];

    pickUpPointObjects.forEach((point, index) => {
      const nextPoint = pickUpPointObjects[index + 1];
      if (!nextPoint) return; // skip last point if no pair
    
      L.Routing.control({
        waypoints: [
          L.latLng(point.lat, point.lon),
          L.latLng(nextPoint.lat, nextPoint.lon),
        ],
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        lineOptions: {
          styles: [
            { color: 'black', weight: 4 }, // Base color
            { color: colors[index % colors.length], weight: 2 }, // "Stroke" around the line
          ],
        },
      }).addTo(map);
    });


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