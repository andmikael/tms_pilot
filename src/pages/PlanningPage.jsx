/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 
import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";

import Table from "../components/pickupForm/Table";
import { routePropType } from "../propTypes/routePropType";
import PropTypes from "prop-types";

const PlanningPage = ( {data} ) => {

    const [pickups, setNewPickups] = useState([]);

    const handleFormData = (idata) => {
        setNewPickups([...pickups, idata]);
    }

    const removePickup = (index) => {
        const updatedPickups = pickups.filter((_, i) => i !== index);
        setNewPickups(updatedPickups);
      };
    
  const [excelData, setExcelData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchExcelData() {
      try {
        const response = await fetch("http://localhost:8000/api/get_excel_jsons");
        if (!response.ok) {
          throw new Error("Excel-tiedostojen haku epäonnistui");
        }
        const data = await response.json();
        // Välitetään haetut tiedot (kaikki tiedostot erikseen) tilaan
        setExcelData(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchExcelData();
  }, []);
    return (
      <div>
        <div className="content">
          Reittisuunnittelu sivu
          <p>Järjestelmän reitit: {JSON.stringify(data)}</p>
          <pre>{JSON.stringify(excelData, null, 2)}</pre>
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
        <LeafletMap id="map"/>
      </div>
    );
};

// Määritellään sivun data eli järjestelmän reitit noudattamaan routesPropTypeä, joka on määritelty propTypes/routesPropType.js tiedostossa.
PlanningPage.propTypes = {
  data: PropTypes.arrayOf(routePropType),
};

export default PlanningPage;