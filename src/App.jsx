import React from "react";
import "./App.css"
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlanningPage from "./pages/PlanningPage";
import FilesPage from "./pages/FilesPage";
import Header from "./components/Header";

function App() {
  const [routes, setRoutes] = useState([]);

  // Function for adding new route into list of routes
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
          <Route path="/files" element={<FilesPage routeHandler={handleUploadingRoute}></FilesPage>} />
        </Routes>
      </Router>
    </>
  )
}

export default App;
