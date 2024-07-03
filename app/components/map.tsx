"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import "leaflet.markercluster";
import useSWR from "swr";
import MarkerCluster from "./markerCluster";
import { dataSelectionType } from "../const";

// @ts-ignore
const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

interface MyMapProps {
  option: dataSelectionType;
}

const MyMap = ({ option }: MyMapProps) => {
  console.log(option);
  const { data, error, isLoading } = useSWR(
    `/api/${option.month}/${option.year}`,
    fetcher
  );
  // const data = undefined;
  // const isLoading = true;

  console.log(error);

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;
  if (!data || data.length === 0)
    return <span className="loading loading-infinity loading-lg"></span>;

  return (
    <>
      <MapContainer
        center={[44.953672, -93.102277]}
        zoom={12}
        key={option.id}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerCluster markers={data[0].crimes} />
      </MapContainer>
    </>
  );
};

export default MyMap;
