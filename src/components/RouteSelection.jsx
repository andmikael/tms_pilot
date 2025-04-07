import React, { useState, useEffect } from 'react';
import TemplateBody from "../components/templateDropdown/TemplateBody";
import TableSection from "../components/pickupForm/Tablesection";
import { geocodePoints, getOptimizedRoutes, appendPlaceToExcel, removePlaceFromExcel } from '../utils';
import ErrorModal from './modals/ErrorModal';
import RouteSuggestion from '../components/RouteSuggestion';

const RouteSelection = ({ dataToParent }) => {
  const [optionalPickups, setOptionalPickups] = useState([]);
  const [standardPickups, setStandardPickups] = useState([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [amountOfVehicles, setAmountOfVehicles] = useState(1);
  const [trafficMode, setTrafficMode] = useState("best_guess");
  const [isEditMode, setIsEditMode] = useState(false);

  const unselectRoutes = () => {
    const optionalIdxs = document.getElementsByClassName("point-check");
    Array.from(optionalIdxs).forEach((checkbox) => {
      if (checkbox.checked) {
        checkbox.checked = false;
      }
    });
  };

  useEffect(() => {
    if (dataToParent) {
      setRouteData(dataToParent);
    }
    // Removing previous route suggestions and emptying checked boxes.
    setOptimizedRoutes([]);
    unselectRoutes();
  }, [dataToParent]);

  useEffect(() => {
    if (routeData && Array.isArray(routeData.routes)) {
      const standardPickupArray = routeData.routes.filter(place => place.standardPickup === 'yes');
      const optionalPickupArray = routeData.routes.filter(place => place.standardPickup === 'no');

      setStandardPickups(standardPickupArray);
      setOptionalPickups(optionalPickupArray);
    }
  }, [routeData]);

  if (!routeData || !routeData.name) {
    return <div>Reittidataa ei ole saatavilla.</div>;
  }

  const handleFormData = async (idata) => {
    const newPickup = await geocodePoints(idata);
    const excelFilename = routeData.name;
    const result = await appendPlaceToExcel(excelFilename, newPickup);
    if (!result.error) {
      setOptionalPickups([...optionalPickups, newPickup]);
    } else {
      alert(result.message);
    }
  };
  const formRouteSuggestion = async () => {
    const selectedPickups = [];
    const optionalIdxs = document.getElementsByClassName("point-check");
    Array.from(optionalIdxs).forEach((checkbox) => {
      if (checkbox.checked) {
        selectedPickups.push(optionalPickups[checkbox.id.substring(8)]);
      }
    });

    /* Commented out, not needed at the moment but can be modified to show selected pickup points for the done route suggestions.

    const cont = document.getElementById("current-route-container");
    let para = document.getElementById("optional-route");
    if (!para) {
      para = document.createElement("p");
      para.id = "optional-route";
    }

    let p_text = "Lisätyt noutopaikat: ";
    selectedPickups.forEach((point) => {
      p_text += point.name + ", ";
    });
    p_text = p_text.slice(0, -2);
    para.innerHTML = p_text;
    cont.appendChild(para);
    */

    const response = await getOptimizedRoutes(routeData.startPlace, routeData.endPlace, 
      standardPickups, selectedPickups, amountOfVehicles, trafficMode); 
    setOptimizedRoutes(response);
  };

  const removePickup = async (index) => {
    const pickupToRemove = optionalPickups[index];
    const excelFilename = routeData.name;
    const result = await removePlaceFromExcel(excelFilename, pickupToRemove);
    if (!result.error) {
      const updatedPickups = optionalPickups.filter((_, i) => i !== index);
      setOptionalPickups(updatedPickups);
    } else {
      alert(result.message || 'Noutopaikan poistaminen epäonnistui.');
    }
  };

  return (
    <div>
      <div id="current-route-container" className="dropdown-content-padding">
        <p><strong>Valittu reitti:</strong> {routeData.name}</p>
        <p><strong>Lähtöpaikka:</strong> {routeData.startPlace.name}</p>
        <p><strong>Määräpaikka:</strong> {routeData.endPlace.name}</p>
        <p><strong>Aikataulu:</strong> {routeData.startTime} - {routeData.endTime}</p>
        <p><strong>Vakioreitin noutopaikat:</strong> {standardPickups.length > 0 ? (
          standardPickups.map((place, index) => (
            `${place.name}` + (index < standardPickups.length - 1 ? ', ' : ''))
          ).join('') 
        ) : (
          <span>Ei vakionoutopaikkoja reitillä.</span>
        )} 
        </p>
      </div>
      {optionalPickups.length > 0 && (
        <div className="PickupList">
          <div className="row-center">
            <h4 className="dropdown-content-padding">Valinnaiset noutopaikat:</h4>
            <button id="edit-pickup-btn"onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? "Valmis" : "Muokkaa noutopaikkoja"}
            </button>
          </div>

          {isEditMode && (
            <TemplateBody
              PropComponent={TableSection}
              PropName={"pickupform dropdown-content-padding"}
              PropTitle={"Lisää uusi noutopaikka"}
              PropFunc={handleFormData}
              Expandable={true}
            />
          )}
        
          <ul className="pointList dropdown-content-padding">
            {optionalPickups.map((itinerary, index) => (
              <li key={index} className="point">
                <div className="point-info">
                  <label className="point-name">{itinerary.name}</label>
                  <label>
                    {itinerary.address}, {itinerary.postalCode}, {itinerary.city}
                  </label>
                </div>
                <div className="point-list-controls">
                  <input type="checkbox" id={"checkbox" + index} className="point-check"/>

                  {isEditMode && (
                      <button onClick={() => removePickup(index)} className="point-remove-btn">
                        Poista
                      </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        <button id="optional-route-unselect-btn" onClick={unselectRoutes}>
          Poista noutopaikkojen valinnat
        </button>
        </div>
      )}

    <div id="route-options" className="dropdown-content-padding">
    <span>Ajoneuvojen määrä</span>
              <select id="vehicles-select"
                value={amountOfVehicles} 
                onChange={(e) => {
                  setAmountOfVehicles(parseInt(e.target.value))}}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <span>Liikenteen määrä</span>
              <select id="traffic-pred"
                value={trafficMode} 
                onChange={(e) => {
                setTrafficMode(e.target.value)}}>
                <option value="optimistic">optimistinen</option>
                <option value="best_guess">paras arvaus</option>
                <option value="pessimistic">pessimistinen</option>
              </select>
              <button id="form-route-btn" onClick={formRouteSuggestion}>Muodosta reittiehdotus</button>
    </div>  
      <TemplateBody
        PropComponent={RouteSuggestion}
        PropName={'route-suggestion-container'}
        PropTitle={'Reittiehdotus'}
        PropData={optimizedRoutes}
        Expandable={true}
      />
    </div>
  );
};

export default RouteSelection;
