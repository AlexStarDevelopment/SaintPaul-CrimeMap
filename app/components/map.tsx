"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Marker } from "react-leaflet/Marker";
import { Popup } from "react-leaflet/Popup";
import { Icon, DivIcon } from "leaflet";
import * as L from "leaflet";
import "leaflet.markercluster";
import useSWR from "swr";
import { useMap } from "react-leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactDOMServer from "react-dom/server";
import { faHandFist } from "@fortawesome/free-solid-svg-icons/faHandFist";
import { faCar } from "@fortawesome/free-solid-svg-icons/faCar";
import { faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { faHouse } from "@fortawesome/free-solid-svg-icons/faHouse";
import { faGun } from "@fortawesome/free-solid-svg-icons/faGun";
import { faSprayCan } from "@fortawesome/free-solid-svg-icons/faSprayCan";
import { faPills } from "@fortawesome/free-solid-svg-icons/faPills";
import { faFire } from "@fortawesome/free-solid-svg-icons/faFire";
import { faMask } from "@fortawesome/free-solid-svg-icons/faMask";
import MarkerCluster from "./markerCluster";
import { june24, may24 } from "../const";

// @ts-ignore
const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

interface MyMapProps {
  option: number;
}

const MyMap = ({ option }: MyMapProps) => {
  const { data, error, isLoading } = useSWR("/api/data", fetcher);
  // const data = undefined;
  // const isLoading = true;

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;
  if (!data)
    return <span className="loading loading-infinity loading-lg"></span>;

  return (
    <>
      <MapContainer
        center={
          Number(option) === june24 || Number(option) === may24
            ? [44.953672, -93.102277]
            : [44.9308168, -93.0796477]
        }
        zoom={Number(option) === june24 || Number(option) === may24 ? 12 : 14}
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
