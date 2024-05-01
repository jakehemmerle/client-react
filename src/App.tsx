import React from 'react';
import Map from 'react-map-gl';
import './App.css'; // Ensure the CSS file is imported

// Constants for map configuration
const MAP_INITIAL_STATE = {
  latitude: 39.140115,
  longitude: -84.513876,
  zoom: 8
};

// App component with explicit return type annotation
const App: React.FC = () => {
  return (
    <div className="App">
      <Map
        initialViewState={MAP_INITIAL_STATE}
        style={{ width: '100%', height: '100vh' }} // Apply styles directly
        mapStyle="mapbox://styles/mapbox/streets-v8"
      />
    </div>
  );
}

export default App;
