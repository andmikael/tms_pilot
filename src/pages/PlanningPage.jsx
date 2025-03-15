/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 
import React, { useState, useEffect } from 'react';
import LeafletMap from "../components/LeafletMap";

const PlanningPage = (data) => {
    
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
      </div>
    );
};

export default PlanningPage;