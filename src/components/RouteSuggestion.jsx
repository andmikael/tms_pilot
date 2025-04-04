import React, { useState, useEffect } from 'react';

const KM_PRICE = 2; // TODO: Muuta env. variableksi?

const RouteSuggestion = ({ dataToChild }) => {
  
    // Can be removed later. Only used for debugging.
    useEffect(() => {
      console.log("RouteSuggestion dataToChild:", dataToChild);
    }, [dataToChild]);
  
    
    if (!dataToChild || Object.keys(dataToChild).length === 0) {
      return <div>Muodosta reittiehdotus "muodosta reittiehdotus" painikkeella.</div>;
    }

    const routeSuggestions = dataToChild;
  
    return (
      <div>
        {routeSuggestions.map((suggestion, index) => (
            <div key={index} id="route-suggestion">
            <h4>Reittiehdotus {index + 1}</h4>
            <p><strong>Aika-arvio: {suggestion.durations.toFixed(2)} min | Kustannusarvio: {(suggestion.distances * KM_PRICE).toFixed(2)} e </strong></p>
            <p><strong>Optimoitu reitti:&nbsp;</strong>
                {suggestion.ordered_routes.length > 0 ? (
                suggestion.ordered_routes.map((place, index) => (
                `${place.name}${index < suggestion.ordered_routes.length - 1 ? ' → ' : ''}`
                )).join('')
                ) : (
                ""
                )} </p>
            </div>
        ))}
    </div>
    );
};
  
export default RouteSuggestion;
  