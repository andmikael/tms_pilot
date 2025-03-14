/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 
import LeafletMap from "../components/LeafletMap";


import React, { useState } from 'react';
import { routePropType } from "../propTypes/routePropType";
import PropTypes from "prop-types";
import TemplateBody from "../components/templateDropdown/TemplateBody";
import TableSection from "../components/pickupForm/Tablesection";

const PlanningPage = ( {data} ) => {

    const [pickups, setNewPickups] = useState([]);

    const handleFormData = (idata) => {
        setNewPickups([...pickups, idata]);
    }

    const removePickup = (index) => {
        const updatedPickups = pickups.filter((_, i) => i !== index);
        setNewPickups(updatedPickups);
      };
    
    return (
      <div>
        <div className="content">
          Reittisuunnittelu sivu
          <p>Järjestelmän reitit: {JSON.stringify(data)}</p>
        </div>
        <h3>Valittavat noutopisteet</h3>
        <div className="PickupList">
                <ul className="pointList">
                    {pickups.map((itinerary, index) => (
                      <li key={index} className="point">
                        <label>{itinerary.name}, {itinerary.address}, {itinerary.zipcode}, {itinerary.city}</label>
                        <button onClick={() => removePickup(index)} className="point-remove">Remove</button>
                        <input type="checkbox" id="" value={itinerary.name} className="point-check"/>
                      </li>
                    ))}
                </ul>
          </div>
        <div>
        <TemplateBody PropComponent={TableSection} PropName={"pickupform"} PropTitle={"Lisää uusi noutopaikka"} PropFunc={handleFormData}/>
        </div>
        
        <div>
              <TemplateBody PropComponent={LeafletMap} PropName={"test-container"} PropTitle={"test container text"}/>
        </div>
      </div>
    );
};

// Määritellään sivun data eli järjestelmän reitit noudattamaan routesPropTypeä, joka on määritelty propTypes/routesPropType.js tiedostossa.
PlanningPage.propTypes = {
  data: PropTypes.arrayOf(routePropType),
};

export default PlanningPage;