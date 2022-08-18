import React from 'react';
import logo from './logo.svg';
import Map from 'react-map-gl';

function App() {
  return <Map
    initialViewState={{
      latitude: 39.140115,
      longitude: -84.513876,
      zoom: 8
    }}
    style={{ width: 1260, height: 720 }}
    mapStyle="mapbox://styles/mapbox/streets-v10"
  />;
}

export default App;
