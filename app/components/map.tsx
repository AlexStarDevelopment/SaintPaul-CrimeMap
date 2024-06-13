"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Marker } from "react-leaflet/Marker";
import { Popup } from "react-leaflet/Popup";
import { Icon } from "leaflet";
import useSWR from "swr";

// @ts-ignore
const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

const customIcon = new Icon({
  iconUrl: "/dot-svgrepo-com.svg",
  iconSize: [10, 10],
});

const MyMap = () => {
  const { data, error, isLoading } = useSWR("/api/data", fetcher);

  if (data) console.log(data[0].crimes);

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;

  return (
    <>
      <MapContainer
        center={[44.9308168, -93.0796477]}
        zoom={14}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data &&
          data[0].crimes.map(
            (i: Crime, index: React.Key | null | undefined) => {
              return (
                <Marker key={index} icon={customIcon} position={[i.LAT, i.LON]}>
                  <Popup>{i.INCIDENT_TYPE + " - " + i.BLOCK}</Popup>
                </Marker>
              );
            }
          )}
      </MapContainer>
    </>
  );
};

export default MyMap;
