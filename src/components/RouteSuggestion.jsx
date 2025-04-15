import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";
import { postKmPrice } from '../utils';
import { Edit2, Check } from 'lucide-react';

const RouteSuggestion = ({ dataToChild }) => {

  const [kmPrice, setKmPrice] = useState(parseFloat(import.meta.env.VITE_ROUTE_KM_PRICE) || 2);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(kmPrice);

  // Log kmPrice changes
  useEffect(() => {
    console.log("KM-hinta päivitetty:", kmPrice);
  }, [kmPrice]);

    const [selectedRoute, setSelectedRoute] = useState({
      index: 0,
      text: "Visualisointi autolle 1 (Runkoreitti)",
    });

    const routeSuggestions = dataToChild[0] || [];
    const parseTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.error(`Invalid time value: ${timeStr}`);
        return null;
      }
      return hours * 60 + minutes;
    };
    
    const routeTimetable = (dataToChild[1] || []).map(parseTimeToMinutes);

    const formatMinutesToTime = (minutes) => {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hrs}:${mins.toString().padStart(2, '0')}`;
    };
  
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
    if (!routeSuggestions || Object.keys(routeSuggestions).length === 0) {
      if (routeSuggestions === null) {
        return <div id="route-suggestion-error">Virhe tapahtui reittioptimoinnissa! Yritä uudelleen.</div>;
      } 
      else {
        return <div className="dropdown-content-padding">Muodosta reittiehdotus "muodosta reittiehdotus" painikkeella.</div>;
      }
    }

    // Ensure selectedRoute.index is valid before rendering
    // Otherwise can cause to issues if the dataToChild changes and selectedRoute.index is out of bounds.
    if (!routeSuggestions[selectedRoute.index]) {
      return <div className="dropdown-content-padding">Odota... Ladataan reittiehdotuksia.</div>;
    }

    return (
      <div>  
        {routeSuggestions.map((suggestion, index) => (
          <div className="suggestion-row-center" key={index}>
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
                | Kustannusarvio: {(suggestion.distances * kmPrice).toFixed(2)} € (km * {kmPrice})
                {isEditingPrice ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                    />
                  <button
                    className='button-save'
                    onClick={async () => {
                    setKmPrice(tempPrice);
                    setIsEditingPrice(false);
                    await postKmPrice(tempPrice);
                    }}
                  >Tallenna
                  </button>
                </>
                ) : (
                  <span>
                      <button className='editLink'
                        onClick={() => {
                          setTempPrice(kmPrice);
                          setIsEditingPrice(true);
                    }}
                  >
                    <Edit2 size={16} />Muokkaa
                  </button>
                  </span>
                )}
              </strong></p>
              <p className="warning-text">
                {(routeTimetable[1] - routeTimetable[0]) < (suggestion.durations) && (
                  <span>
                    Varoitus! Aika-arvio ylittää asetetun aikataulun (klo {formatMinutesToTime(routeTimetable[0])} - {formatMinutesToTime(routeTimetable[1])})! <br/>
                    Tämä reitti saapuisi perille vasta klo {formatMinutesToTime(routeTimetable[0] + Math.round(suggestion.durations))}<br/>
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
  