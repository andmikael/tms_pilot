import React, { useState, useEffect } from 'react';
import TemplateBody from "../components/templateDropdown/TemplateBody";
import RouteSelection from '../components/RouteSelection';
import ErrorModal from '../components/modals/ErrorModal';
import PropTypes from "prop-types";
import { fetchExcelData, fetchRoutes, deleteExcelFile } from "../utils";
import { Trash2 } from 'lucide-react';

const PlanningPage = () => {
  // Initialize component state
  const [excelData, setExcelData] = useState({});  // Data for loaded Excel files
  const [routeData, setRouteData] = useState({});  // Data for routes
  const [selectedFile, setSelectedFile] = useState(null);  // Selected file
  const [deleteMessage, setDeleteMessage] = useState("");  // Message after file deletion
  const [modalError, setModalError] = useState(false);
  const [modalErrorDesc, setModalErrorDesc] = useState(null);
  const [error, setError] = useState(null);
  
  /**
   * Loads the Excel data when the component is first rendered
   */
  useEffect(() => {
    fetchExcelData(setExcelData, setSelectedFile, setError, selectedFile);
  }, []);

  /**
   * Loads the route data when the component is first rendered
   */
  useEffect(() => {
    fetchRoutes(setRouteData, setError);
  }, []);

  /**
   * If no file is selected, set the first loaded file as the selected one
   */
  useEffect(() => {
    if (!selectedFile && Object.keys(excelData).length > 0) {
      const firstFile = Object.keys(excelData)[0];
      setSelectedFile(firstFile);
    }
  }, [excelData, selectedFile]);

  // Determine the route key based on the selected file and available route data
  const routeKey = selectedFile && routeData[selectedFile]
    ? selectedFile
    : selectedFile
      ? (Object.keys(routeData).find(file => file.startsWith(selectedFile)) || selectedFile)
      : null;

  let selectedRoute = null;
  if (routeKey && routeData[routeKey]) {
    selectedRoute =  { ...routeData[routeKey] };
  }

  /**
   * Deletes the selected Excel file and updates the state accordingly
   */
  const handleDeleteExcelFile = async () => {
    if (!selectedFile) return;
    const result = await deleteExcelFile(selectedFile);
    if (!result.error) {
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
              <button 
                onClick={handleDeleteExcelFile} 
                disabled={!selectedFile} 
                title="Poista reitti" 
                className="delete-file-btn"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <p>TMS ei ole ladattu reittejä. Voit ladata uuden tiedoston järjestelmään "Tiedostot" -välilehdeltä.<br/>
              Ladatut tiedostot tulevat näkymään tässä.
            </p>
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
  </>
) : (
  <div></div>
  )}
  </div>
  </div>
  )
};

PlanningPage.propTypes = {
  data: PropTypes.array,
};

export default PlanningPage;
