/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 
import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";
import { routePropType } from "../propTypes/routePropType";
import PropTypes from "prop-types";
import TemplateBody from "../components/templateDropdown/TemplateBody";
import TableSection from "../components/pickupForm/Tablesection";

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
      <div className="body-container">
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
                        <div className="point-info">
                          <label className="point-name">{itinerary.name}</label>
                          <label>{itinerary.address}, {itinerary.zipcode}, {itinerary.city}</label>
                        </div>
                        <div className="point-list-controls">
                          <button onClick={() => removePickup(index)} className="point-remove">Remove</button>
                          <input type="checkbox" id="" value={itinerary.name} className="point-check"/>
                        </div>
                      </li>
                    ))}
                </ul>
          </div>
        <div>
          <TemplateBody PropComponent={TableSection} PropName={"pickupform"} PropTitle={"Lisää uusi noutopaikka"} PropFunc={handleFormData} Expandable={true}/>
        </div>
        
        <div>
          <TemplateBody PropComponent={LeafletMap} PropName={"test-container"} PropTitle={"test container text"} Expandable={true}/>
        </div>
      </div>
    );
};

// Määritellään sivun data eli järjestelmän reitit noudattamaan routesPropTypeä, joka on määritelty propTypes/routesPropType.js tiedostossa.
PlanningPage.propTypes = {
  data: PropTypes.arrayOf(routePropType),
};

export default PlanningPage;