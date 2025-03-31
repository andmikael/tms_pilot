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

  let displayedRoute = null;
  if (routeKey && routeData[routeKey]) {
    displayedRoute = { ...routeData[routeKey] };
    if (displayedRoute.startPlace) {
      displayedRoute.startPlace.lat = parseFloat(displayedRoute.startPlace.lat);
      displayedRoute.startPlace.lon = parseFloat(displayedRoute.startPlace.lon);
    }
    if (displayedRoute.endPlace) {
      displayedRoute.endPlace.lat = parseFloat(displayedRoute.endPlace.lat);
      displayedRoute.endPlace.lon = parseFloat(displayedRoute.endPlace.lon);
    }
    if (displayedRoute.routes) {
      displayedRoute.routes = displayedRoute.routes.map(route => ({
        ...route,
        lat: parseFloat(route.lat),
        lon: parseFloat(route.lon),
      }));
    }
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

  return (
    <div className="body-container">
      <div className="content">
        <h3>Näytettävä reitti</h3>
        <div className="current-route-selection">
          {Object.keys(excelData).length > 0 ? (
            <div className="route-select">
              <select
                value={selectedFile || ""}
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
                value={selectedFile || ""}
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

        <TemplateBody
          PropComponent={RouteSelection}
          PropName={"route-selection-container"}
          PropTitle={"Noutopaikkojen valinta"}
          PropData={excelData}
          Expandable={true}
        />

        {displayedRoute ? (
          <TemplateBody
            PropComponent={LeafletMap}
            PropName={"leaflet-container"}
            PropTitle={"Reittikartta"}
            PropFunc={displayedRoute}
            Expandable={true}
          />
        ) : (
          <div>Ladataan reittikarttaa…</div>
        )}
      </div>
      {modalError && <ErrorModal dataToParent={setModalError} />}
      <button onClick={showModal}>Näytä virheilmoitus</button>
    </div>
  );
};

PlanningPage.propTypes = {
  data: PropTypes.array,
};

export default PlanningPage;
