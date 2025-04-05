import React, { useState, useEffect } from 'react';

const KM_PRICE = 2; // TODO: Should be env variable at some point?

const RouteSuggestion = ({ dataToChild }) => {
  
    // Can be removed later. Only used for debugging.
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

    const routeSuggestions = dataToChild;
  
    return (
      <div>
        {routeSuggestions.map((suggestion, index) => (
            <div key={index} id="route-suggestion">
              <h4 id="route-suggestion-title">Reittiehdotus {index + 1}</h4>
              <p><strong>Aika-arvio: {suggestion.durations.toFixed(2)} min | Kokonaismatka: {suggestion.distances.toFixed(2)} km
                | Kustannusarvio: {(suggestion.distances * KM_PRICE).toFixed(2)} e </strong></p>

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
        ))}
    </div>
    );
};
  
export default RouteSuggestion;
  