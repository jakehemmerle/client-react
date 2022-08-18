import React from 'react';
import logo from './logo.svg';
import Map from 'react-map-gl';

function App() {
  return <Map
    initialViewState={{
      longitude: -100,
      latitude: 40,
      zoom: 3.5
    }}
    style={{ width: 600, height: 400 }}
    mapStyle="mapbox://styles/mapbox/streets-v9"
  />;
}

export default App;
