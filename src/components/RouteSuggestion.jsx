import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";

// Gets the price per km from .env file, but also default to 2 if not set
const KM_PRICE = parseFloat(import.meta.env.VITE_ROUTE_KM_PRICE) || 2;

const RouteSuggestion = ({ dataToChild }) => {
    const [selectedRoute, setSelectedRoute] = useState({
      index: 0,
      text: "Visualisointi autolle 1 (Runkoreitti)",
    });

    const routeSuggestions = dataToChild[0] || [];
    const routeTimetable = (dataToChild[1] || []).map((time) => {
      const parsedTime = parseFloat(time);
      if (isNaN(parsedTime)) {
      console.error(`Invalid time value: ${time}`);
      return null;
      }
      return parsedTime;
    });

    console.log("RouteSuggestion routeTimetable:", routeTimetable);
  
    // Reset selectedRoute when dataToChild changes
    useEffect(() => {
      setSelectedRoute({
        index: 0,
        text: "Visualisointi autolle 1 (Runkoreitti)",
      });
    }, [dataToChild]);

    // Debugging useEffect
    useEffect(() => {
      console.log("RouteSuggestion dataToChild:", dataToChild);
    }, [dataToChild]);
  
    // For showing if error happens when fetching optimized routes. 
    if (!dataToChild || Object.keys(dataToChild).length === 0) {
      if (dataToChild === null) {
        return <div id="route-suggestion-error">Virhe tapahtui reittioptimoinnissa! Yritä uudelleen.</div>;
      } 
      else {
        return <div>Muodosta reittiehdotus "muodosta reittiehdotus" painikkeella.</div>;
      }
    }

    // Ensure selectedRoute.index is valid before rendering
    // Otherwise can cause to issues if the dataToChild changes and selectedRoute.index is out of bounds.
    if (!routeSuggestions[selectedRoute.index]) {
      return <div>Odota... Ladataan reittiehdotuksia.</div>;
    }

    return (
      <div>
        {routeSuggestions.map((suggestion, index) => (
          <div className="row-center">
            <input
              className="route-suggestion-radio"
              type="radio"
              name="activeRoute"
              value={index}
              checked={selectedRoute.index === index}
              onChange={() =>
                setSelectedRoute({
                  index: index,
                  text: `Visualisointi autolle ${index + 1} ${
                    index === 0 ? "(Runkoreitti)" : "(Lisäkuljetus)"
                  }`,
                })
              }
            />
            <div key={index} id="route-suggestion">
              <h4 id="route-suggestion-title">Reittiehdotus autolle {index + 1} {index === 0 ? "(Runkoreitti)" : "(Lisäkuljetus)"}</h4>
              <p><strong>
                Aika-arvio: {Math.floor(suggestion.durations / 60)} h {Math.round(suggestion.durations % 60)} min 
                | Kokonaismatka: {suggestion.distances.toFixed(2)} km
                | Kustannusarvio: {(suggestion.distances * KM_PRICE).toFixed(2)} € (km * {KM_PRICE})
              </strong></p>
              <p className="warning-text">
                {(routeTimetable[1] - routeTimetable[0]) < (suggestion.durations / 60) && (
                  <span>
                    Varoitus! Aika-arvio ylittää asetetun aikataulun (klo {routeTimetable[0]} - {routeTimetable[1]})! <br/>
                    Harkitse useamman auton käyttämistä.
                  </span>
                )}
              </p>

              <strong>Optimoitu reitti:</strong>
              {suggestion.ordered_routes.length > 0 ? (
              <ol style={{ listStyle: 'none' }}>
              {suggestion.ordered_routes.map((place, index) => {
                const isFirst = index === 0;
                const isLast = index === suggestion.ordered_routes.length - 1;
                const label = isFirst ? 'Aloituspaikka:' : isLast ? 'Lopetuspaikka:' : `${index}.`;
            
                return (
                  <li key={index}>
                    {label} {place.name}, {place.address}, {place.city}
                  </li>
                )
              })}
              </ol>
              ) : ("Ei noutopaikkoja valikoituna.")}
          </div>
        </div>
        ))}
      <div id="map-container">
        <strong id="map-header">{selectedRoute.text}</strong>
        <LeafletMap dataToParent={routeSuggestions[selectedRoute.index].ordered_routes}></LeafletMap>
      </div>
    </div>
    );
};
  
export default RouteSuggestion;
  