"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import "leaflet.markercluster";
import MarkerCluster from "./markerCluster";
import { dataSelectionType } from "../const";
import { useState } from "react";
import { getCrimes } from "../api/getCrimes";

interface MyMapProps {
  option: dataSelectionType;
}

const MyMap = ({ option }: MyMapProps) => {
  const [items, setItems] = useState<any>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const getItems = async () => {
      const { crimes, totalPages } = await getCrimes(
        option.month,
        option.year,
        currentPage,
        30000
      );
      setIsLoading(false);
      setItems(crimes);
      setTotalPages(totalPages);
    };

    getItems();
  }, [currentPage, option]);

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;
  if (!items || items.length === 0)
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
        <MarkerCluster markers={items} />
      </MapContainer>
    </>
  );
};

export default MyMap;
