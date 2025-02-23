import "./App.css"
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AddPage from "./pages/AddPage";
import PlanningPage from "./pages/PlanningPage";
import Header from "./components/Header";

function App() {
  const [routes, setRoutes] = useState([]);

  // Funktio uuden runkoreitin lisäämisestä reittilistaan.
  const handleUploadingRoute = (newRoute) => {
    setRoutes((prev) => [...prev, newRoute]);
  };

  return (
    <>
      {/* React router*/}
      <Router>
        {/* Header ja navigaatio */}
        <Header/>

        <Routes>
          <Route path="/" element={<PlanningPage data={routes}></PlanningPage>} /> 
          <Route path="/add" element={<AddPage routeHandler={handleUploadingRoute}></AddPage>} />
        </Routes>
      </Router>
    </>
  )
}

export default App;
