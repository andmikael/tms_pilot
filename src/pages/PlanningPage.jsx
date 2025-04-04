import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";
import TemplateBody from "../components/templateDropdown/TemplateBody";
import RouteSelection from '../components/RouteSelection';
import ErrorModal from '../components/modals/ErrorModal';
import PropTypes from "prop-types";
import { fetchExcelData, fetchRoutes } from "../utils";

const PlanningPage = () => {
  const [excelData, setExcelData] = useState({});
  const [routeData, setRouteData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [modalError, setModalError] = useState(false);
  const [modalErrorDesc, setModalErrorDesc] = useState(null);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    fetchExcelData(setExcelData, setSelectedFile, setError, selectedFile);
  }, []);

  useEffect(() => {
    fetchRoutes(setRouteData, setError);
  }, []);

  useEffect(() => {
    if (!selectedFile && Object.keys(excelData).length > 0) {
      const firstFile = Object.keys(excelData)[0];
      setSelectedFile(firstFile);
    }
  }, [excelData, selectedFile]);

  const routeKey = selectedFile && routeData[selectedFile]
    ? selectedFile
    : selectedFile
      ? (Object.keys(routeData).find(file => file.startsWith(selectedFile)) || selectedFile)
      : null;

  let selectedRoute = null;
  if (routeKey && routeData[routeKey]) {
    selectedRoute =  { ...routeData[routeKey] };
  }

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

  const showModal = () => {
    setModalError(!modalError);
  };
  console.log("PlanningPage selectedRoute:", selectedRoute);

  return (
    <div className="body-container">
      <div className="content">
        <h3>Näytettävä reitti</h3>
        <div className="current-route-selection">
          {Object.keys(excelData).length > 0 ? (
            <div className="route-select">
              <select
                value={selectedFile || ''}
                onChange={(e) => {
                  setSelectedFile(e.target.value);
                }}
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

        <div>
          <h3>Poista tallennettu reitti</h3>
          {deleteMessage && <p>{deleteMessage}</p>}
          {Object.keys(excelData).length > 0 ? (
            <div>
              <select
                value={selectedFile || ''}
                onChange={(e) => {
                  setSelectedFile(e.target.value);
                }}
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

        {selectedRoute ? (
  <>
    <TemplateBody
      PropComponent={RouteSelection}
      PropName={'route-selection-container'}
      PropTitle={'Noutopaikkojen valinta'}
      PropData={excelData}
      PropFunc={selectedRoute}
      Expandable={false}
    />
    <TemplateBody
      PropComponent={LeafletMap}
      PropName={'leaflet-container'}
      PropTitle={'Reittikartta'}
      PropFunc={selectedRoute}
      Expandable={true}
    />
  </>
) : (
  <div>Reittiä ei ole valittu. Reittikarttaa ei voida piirtää.</div>
  )}
  </div>
  </div>
  )
};

PlanningPage.propTypes = {
  data: PropTypes.array,
};

export default PlanningPage;
