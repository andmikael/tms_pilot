/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 
import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";


import Table from "../components/pickupForm/Table";
import { routePropType } from "../propTypes/routePropType";
import PropTypes from "prop-types";

const PlanningPage = ({ data }) => {
  const [pickups, setNewPickups] = useState([]);
  const [excelData, setExcelData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  // Haetaan tallennetut Excel-tiedostot palvelimelta
  useEffect(() => {
    async function fetchExcelData() {
      try {
        const response = await fetch("http://localhost:8000/api/get_excel_jsons");
        if (!response.ok) {
          throw new Error("Excel-tiedostojen haku epäonnistui");
        }
        const fetchedData = await response.json();
        setExcelData(fetchedData);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchExcelData();
  }, []);

  // Noutopaikkojen lisääminen Table-komponentista
  const handleFormData = (idata) => {
    setNewPickups([...pickups, idata]);
  };

  const removePickup = (index) => {
    const updatedPickups = pickups.filter((_, i) => i !== index);
    setNewPickups(updatedPickups);
  };

  // Poistofunktio: lähettää DELETE-pyynnön palvelimelle poistamaan valitun Excel-tiedoston
  const deleteExcelFile = async () => {
    if (!selectedFile) return;
    try {
      const response = await fetch("http://localhost:8000/api/delete_excel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: selectedFile }),
      });
      const result = await response.json();
      if (response.ok) {
        setDeleteMessage(result.message);
        // Päivitetään tila poistamalla poistettu tiedosto excelData-objektista
        setExcelData(prev => {
          const newData = { ...prev };
          delete newData[selectedFile];
          return newData;
        });
        setSelectedFile("");
      } else {
        setDeleteMessage("Virhe: " + (result.error || result.message));
      }
    } catch (err) {
      setDeleteMessage("Poistopyynnön virhe: " + err.message);
    }
  };
    return (
      <div>
        <div className="content">
          Reittisuunnittelu sivu
          <p>Järjestelmän reitit: {JSON.stringify(data)}</p>
          <pre>{JSON.stringify(excelData, null, 2)}</pre>
          {/* Dropdown Excel-tiedostojen poistoa varten */}
        <div>
          <h3>Poista tallennettu reitti</h3>
          {deleteMessage && <p>{deleteMessage}</p>}
          {excelData && Object.keys(excelData).length > 0 ? (
            <div>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
              >
                <option value="">-- Valitse tiedosto --</option>
                {Object.keys(excelData).map((fileName) => (
                  <option key={fileName} value={fileName}>
                    {fileName}
                  </option>
                ))}
              </select>
              <button onClick={deleteExcelFile} disabled={!selectedFile}>
                Poista tiedosto
              </button>
            </div>
          ) : (
            <p>Ei tallennettuja reittejä</p>
          )}
        </div>
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