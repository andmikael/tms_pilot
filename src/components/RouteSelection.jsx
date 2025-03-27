/**
 * Reittivalinta komponentti - näyttää aktiivisen reitin tiedot
 * Reittiin voi lisätä uusia noutopaikkoja
 */

import React, { useState, useEffect } from 'react';
import TemplateBody from "../components/templateDropdown/TemplateBody";
import TableSection from "../components/pickupForm/Tablesection";
import { exampleRoute, geocodePoints } from '../utils';

const RouteSelection = ({ dataToParent, dataToChild }) => {
      const [pickups, setNewPickups] = useState([]);
      const [selectedOptionalPickups, setSelectedOptionalPickups] = useState([]);
      const [excelData, setExcelData] = useState([]);

      if (excelData.length == 0 && dataToChild.length != 0) {
        setExcelData(dataToChild);
      }

      // lisää uusi noutopaikka formsista
      const handleFormData = (idata) => {
        setNewPickups([...pickups, idata]);
      };

      const returnRouteCoords= (data) => {
         // palauta reittikoordinaatit ylemmälle komponentille
        dataToParent(data);
      }
    
      const formRouteSuggestion = async () => {
        var objs = []
        const optionalIdxs = document.getElementsByClassName("point-check");
        Array.from(optionalIdxs).forEach(checkbox => {
          if (checkbox.checked == true) {
            objs.push(pickups[checkbox.id.substring(8)])
            checkbox.checked = false;
          }
        })
        setSelectedOptionalPickups(await geocodePoints(objs));
        const cont = document.getElementById("current-route-container");
        var para = document.getElementById("optional-route");
        if (para == null) {
            var para = document.createElement("p");
            para.id="optional-route";
        }

        var p_text = "Lisätyt noutopaikat: "
        objs.forEach((point => {
            p_text += point.name + ", ";
        }))

        // poista pilkku ja välilyönti viimeisestä noutopisteestä
        p_text = p_text.substring(0, p_text.length - 2);
        para.innerHTML = p_text;
        cont.appendChild(para);


      }
    
      const removePickup = (index) => {
        const updatedPickups = pickups.filter((_, i) => i !== index);
        setNewPickups(updatedPickups);
      }

     const deleteOptionalRoutes = () => {
        setSelectedOptionalPickups([]);
        const btn = document.getElementById("optional-route");
        btn.remove();
        console.log(selectedOptionalPickups);
     }

     const showOptional = () => {
        console.log(selectedOptionalPickups);
     }

     // Geneerisempi ratkaisu vakioreitin täytölle, kun excelData on routePropType muodossa
     /**
      *  var route = excelData.startPlace.name;
      *  
      * excelData.routes.forEach((point => {
          route += ", " + point.name
        }))
          route += ", " + excelData.endPlace.name;
      */
     var route = exampleRoute.startPlace.name;

     exampleRoute.routes.forEach((point => {
          route += ", " + point.name
    }))

    route += ", " + exampleRoute.endPlace.name;


    return (
        <div>
            <div id="current-route-container">
                <p>Lähtöpaikka: {exampleRoute.startPlace.name}</p>
                <p>Määräpaikka: {exampleRoute.endPlace.name}</p>
                <p>Aikataulu: {exampleRoute.startTime} - {exampleRoute.endTime}</p>
                <p id="route-p">Vakioreitti: {route}</p>
                {document.getElementById("optional-route") != null ? <button id="optional-route-delete-btn" onClick={deleteOptionalRoutes}>Poista lisätyt reitit</button> : ("")}
                <button onClick={showOptional}>näytä</button>
            </div>
            {pickups != null ? (
                <div className="PickupList">
                    <ul className="pointList">
                         {(pickups.map((itinerary, index) => (
                          <li key={index} className="point">
                            <div className="point-info">
                              <label className="point-name">{itinerary.name}</label>
                              <label>{itinerary.address}, {itinerary.postalCode}, {itinerary.city}</label>
                            </div>
                            <div className="point-list-controls">
                              <button onClick={() => removePickup(index)} className="point-remove">Remove</button>
                              <input type="checkbox" id={"checkbox" + index} className="point-check"/>
                            </div>
                          </li>)
                        ))}
                    </ul>
                  </div>) : ("")}
                {excelData && pickups.length > 0 ? <button id="form-route-btn" onClick={formRouteSuggestion}>Muodosta reittiehdotus</button> : ("")}
            <TemplateBody PropComponent={TableSection} PropName={"pickupform"} PropTitle={"Lisää uusi noutopaikka"} PropFunc={handleFormData} Expandable={true}/>
        </div>
    )
}

export default RouteSelection;