import "./App.css"
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AddPage from "./pages/AddPage";
import PlanningPage from "./pages/PlanningPage";
import Header from "./components/Header";
import { routePropType } from "./propTypes/routePropType";
import PropTypes from "prop-types";

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

App.propTypes = {
  newRoute: PropTypes.arrayOf(routePropType),
};

export default App;
