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
import { exampleRoute, geocodePoints } from '../utils';
import RouteSelection from '../components/RouteSelection';

const PlanningPage = ({ data }) => {
  const [excelData, setExcelData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
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
        setSelectedFile(null);
      } else {
        setDeleteMessage("Virhe: " + (result.error || result.message));
      }
    } catch (err) {
      setDeleteMessage("Poistopyynnön virhe: " + err.message);
    }
  };

  if (selectedFile == null && excelData && Object.keys(excelData).length > 0) {
    setSelectedFile(Object.keys(excelData)[0]);
  }

  //           <pre>{JSON.stringify(excelData, null, 2)}</pre>

    return (
      <div className="body-container">
        <div className="content">
          <h3>
            Näytettävä reitti
          </h3>
          <div className="current-route-selection">
          {excelData && Object.keys(excelData).length > 0 ? (
            <div className="route-select">
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
              >
                {Object.keys(excelData).map((fileName) => (
                  <option key={fileName} value={fileName}>
                    {fileName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p>Ladattuja reittejä ei löytynyt</p>
          )}
          </div>
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
          <TemplateBody PropComponent={RouteSelection} PropName={"route-selection-container"} PropTitle={"Noutopaikkojen valinta"} PropData={excelData} Expandable={true}/>
          <TemplateBody PropComponent={LeafletMap} PropName={"leaflet-container"} PropTitle={"Reittikartta"} PropFunc={exampleRoute} Expandable={true}/>
        </div>
      </div>
    );
};

// Määritellään sivun data eli järjestelmän reitit noudattamaan routesPropTypeä, joka on määritelty propTypes/routesPropType.js tiedostossa.
PlanningPage.propTypes = {
  data: PropTypes.arrayOf(routePropType),
};

export default PlanningPage;