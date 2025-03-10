/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 


import React, { useState } from 'react';
import Table from "../components/pickupForm/table";

const PlanningPage = (data) => {

    const [pickups, setNewPickups] = useState([]);

    const handleFormData = (idata) => {
        setNewPickups([...pickups, idata]);
    }

    const removePickup = (index) => {
        const updatedPickups = pickups.filter((_, i) => i !== index);
        setNewPickups(updatedPickups);
      };
    
    return <div>
        <div className="content">Reittisuunnittelu sivu
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
            <Table returnDataToList={handleFormData}/>
        </div>
    </div>
};

export default PlanningPage;