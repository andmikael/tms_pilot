import React from 'react';
import HelloWorld from './components/HelloWorld';
import MapComponent from './components/MapComponent';

function App() {
  return (
    <div className="App">
      <HelloWorld />
      <p>Open the console to see the output of the API call.</p>
      <MapComponent />
    </div>
  );
}

export default App;
