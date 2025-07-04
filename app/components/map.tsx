'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import 'leaflet.markercluster';
import MarkerCluster from './markerCluster';
import { dataSelection } from '../const';
import { useState } from 'react';
import { Crime } from '../models/models';
import { getCrimes, getTotalCrimes } from '../api/getCrimes';

interface MyMapProps {
  items: Crime[];
  isLoading: boolean;
}

const MyMap = ({ items, isLoading }: MyMapProps) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000, // Ensure it's on top of the map
          }}
        >
          <span className="loading loading-infinity loading-lg"></span>
        </div>
      )}
      <MapContainer
        center={[44.953672, -93.102277]}
        zoom={12}
        key={items.length}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }} // Ensure map takes full height
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerCluster markers={items} />
      </MapContainer>
    </div>
  );
};

export default MyMap;
