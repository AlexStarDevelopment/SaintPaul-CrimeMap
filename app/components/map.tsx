"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import "leaflet.markercluster";
import useSWR from "swr";
import MarkerCluster from "./markerCluster";

// @ts-ignore
const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

interface MyMapProps {
  option: number;
}

const MyMap = ({ option }: MyMapProps) => {
  const { data, error, isLoading } = useSWR("/api/data", fetcher);
  // const data = undefined;
  // const isLoading = true;

  console.log(error);

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;
  if (!data) return <h1>Down for maintenance</h1>;

  return (
    <>
      <MapContainer
        center={[44.953672, -93.102277]}
        zoom={12}
        key={option}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerCluster markers={data[option].crimes} />
      </MapContainer>
    </>
  );
};

export default MyMap;
