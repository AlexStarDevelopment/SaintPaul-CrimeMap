"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import "leaflet.markercluster";
import MarkerCluster from "./markerCluster";
import { dataSelectionType } from "../const";
import { useState } from "react";
import { getCrimes, getTotalCrimes } from "../api/getCrimes";

interface MyMapProps {
  items: Crime[];
  isLoading: boolean;
}

const MyMap = ({ items, isLoading }: MyMapProps) => {
  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;

  return (
    <>
      <MapContainer
        center={[44.953672, -93.102277]}
        zoom={12}
        key={items.length}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerCluster markers={items} />
      </MapContainer>
    </>
  );
};

export default MyMap;
