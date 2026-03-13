import React, { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Popup, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const BACKEND_URL = 'http://localhost:3001';

const INITIAL_LAT = 39.140115;
const INITIAL_LNG = -84.513876;

type SelectedFeature = {
  longitude: number;
  latitude: number;
  properties: Record<string, unknown>;
};

function App() {
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback((e: any) => {
    (window as any).__testMap = e.target;
  }, []);

  const fetchObjects = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius: 10,
          minHeight: 100,
        }),
      });
      const data = await res.json();
      setGeojsonData(data);
    } catch (err) {
      console.error('Failed to fetch objects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load data for initial view
  useEffect(() => {
    fetchObjects(INITIAL_LAT, INITIAL_LNG);
  }, [fetchObjects]);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const features = e.features;
      if (features && features.length > 0) {
        const f = features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        setSelected({
          longitude: coords[0],
          latitude: coords[1],
          properties: f.properties as Record<string, unknown>,
        });
        return;
      }
      setSelected(null);
      fetchObjects(e.lngLat.lat, e.lngLat.lng);
    },
    [fetchObjects]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div data-testid="status-bar" style={{
        position: 'absolute', top: 10, left: 10, zIndex: 1,
        background: 'white', padding: '8px 12px', borderRadius: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)', fontSize: 14,
      }}>
        {loading ? 'Loading...' : 'Click the map to find tall stuff nearby'}
        {geojsonData && !loading && (
          <span> &mdash; {geojsonData.features.length} objects found</span>
        )}
      </div>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: INITIAL_LAT,
          longitude: INITIAL_LNG,
          zoom: 8,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        interactiveLayerIds={['objects-circle']}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        cursor="pointer"
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {geojsonData && (
          <Source id="objects" type="geojson" data={geojsonData}>
            <Layer
              id="objects-circle"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate', ['linear'], ['get', 'AGL'],
                  100, 4,
                  500, 8,
                  1000, 14,
                  2000, 20,
                ],
                'circle-color': [
                  'interpolate', ['linear'], ['get', 'AGL'],
                  100, '#2196F3',
                  500, '#FF9800',
                  1000, '#F44336',
                  2000, '#9C27B0',
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
              }}
            />
          </Source>
        )}

        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            onClose={() => setSelected(null)}
            maxWidth="320px"
          >
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ fontSize: 15 }}>
                {String(selected.properties.ObjectType).replace(/_/g, ' ')}
              </strong>
              <br />
              <strong>City:</strong> {String(selected.properties.City)}, {String(selected.properties.State)}
              <br />
              <strong>Height AGL:</strong> {String(selected.properties.AGL)} ft
              <br />
              <strong>Height AMSL:</strong> {String(selected.properties.AMSL)} ft
              <br />
              <strong>Distance:</strong> {Number(selected.properties.distanceFromLocation).toFixed(2)} mi
              <br />
              <strong>OAS #:</strong> {String(selected.properties.OASNumber)}
              <br />
              <strong>FAA Study:</strong> {String(selected.properties.FAAStudyNumber)}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default App;
