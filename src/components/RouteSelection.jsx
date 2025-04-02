import React, { useState, useEffect } from 'react';
import TemplateBody from "../components/templateDropdown/TemplateBody";
import TableSection from "../components/pickupForm/Tablesection";
import { geocodePoints } from '../utils';
import ErrorModal from './modals/ErrorModal';

const RouteSelection = ({ dataToParent }) => {
  const [pickups, setNewPickups] = useState([]);
  const [selectedOptionalPickups, setSelectedOptionalPickups] = useState([]);

  useEffect(() => {
    console.log("RouteSelection dataToParent:", dataToParent);
  }, [dataToParent]);

  if (!dataToParent || !dataToParent.name) {
    return <div>Reittidataa ei ole saatavilla.</div>;
  }

  const routeData = dataToParent;

  const handleFormData = (idata) => {
    setNewPickups([...pickups, idata]);
  };

  const formRouteSuggestion = async () => {
    const objs = [];
    const optionalIdxs = document.getElementsByClassName("point-check");
    Array.from(optionalIdxs).forEach((checkbox) => {
      if (checkbox.checked) {
        objs.push(pickups[checkbox.id.substring(8)]);
        checkbox.checked = false;
      }
    });
    setSelectedOptionalPickups(await geocodePoints(objs));
    const cont = document.getElementById("current-route-container");
    let para = document.getElementById("optional-route");
    if (!para) {
      para = document.createElement("p");
      para.id = "optional-route";
    }

    let p_text = "Lisätyt noutopaikat: ";
    objs.forEach((point) => {
      p_text += point.name + ", ";
    });
    p_text = p_text.slice(0, -2);
    para.innerHTML = p_text;
    cont.appendChild(para);
  };

  const removePickup = (index) => {
    const updatedPickups = pickups.filter((_, i) => i !== index);
    setNewPickups(updatedPickups);
  };

  const deleteOptionalRoutes = () => {
    setSelectedOptionalPickups([]);
    const btn = document.getElementById("optional-route");
    if (btn) btn.remove();
  };

  const showOptional = () => {
    return <ErrorModal />;
  };

  return (
    <div>
      <div id="current-route-container">
        <p>Valittu reitti: {routeData.name}</p>
        <p>Lähtöpaikka: {routeData.startPlace.name}</p>
        <p>Määräpaikka: {routeData.endPlace.name}</p>
        <p>Aikataulu: {routeData.startTime} - {routeData.endTime}</p>
        {document.getElementById("optional-route") && (
          <button id="optional-route-delete-btn" onClick={deleteOptionalRoutes}>
            Poista lisätyt reitit
          </button>
        )}
      </div>
      {pickups.length > 0 && (
        <div className="PickupList">
          <ul className="pointList">
            {pickups.map((itinerary, index) => (
              <li key={index} className="point">
                <div className="point-info">
                  <label className="point-name">{itinerary.name}</label>
                  <label>
                    {itinerary.address}, {itinerary.postalCode}, {itinerary.city}
                  </label>
                </div>
                <div className="point-list-controls">
                  <button onClick={() => removePickup(index)} className="point-remove">
                    Poista
                  </button>
                  <input type="checkbox" id={"checkbox" + index} className="point-check" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pickups.length > 0 && (
        <button id="form-route-btn" onClick={formRouteSuggestion}>
          Muodosta reittiehdotus
        </button>
      )}
      <TemplateBody
        PropComponent={TableSection}
        PropName={"pickupform"}
        PropTitle={"Lisää uusi noutopaikka"}
        PropFunc={handleFormData}
        Expandable={true}
      />
    </div>
  );
};

export default RouteSelection;
