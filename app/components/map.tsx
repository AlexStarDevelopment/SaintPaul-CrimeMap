"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Marker } from "react-leaflet/Marker";
import { Popup } from "react-leaflet/Popup";
import { Icon, Point } from "leaflet";
import * as L from "leaflet";
import "leaflet.markercluster";
import useSWR from "swr";
import { useMap } from "react-leaflet";

// @ts-ignore
const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

const customIcon = new Icon({
  iconUrl: "/dot-svgrepo-com.svg",
  iconSize: [10, 10],
});

const MyMap = () => {
  const { data, error, isLoading } = useSWR("/api/data", fetcher);
  // const data = undefined;
  // const isLoading = true;
  if (data) console.log(data[0].crimes);

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;
  if (!data)
    return <span className="loading loading-infinity loading-lg"></span>;

  const mcg = L.markerClusterGroup();

  const MarkerCluster = ({ markers }: any) => {
    const map = useMap();

    React.useEffect(() => {
      mcg.clearLayers();
      markers.forEach((position: any) =>
        L.marker(new L.LatLng(position.LAT, position.LON), {
          icon: customIcon,
        })
          .addTo(mcg)
          .bindPopup(
            position.INCIDENT_TYPE +
              " " +
              position.BLOCK +
              " " +
              position.LAT +
              " " +
              position.LON
          )
      );

      // optionally center the map around the markers
      // map.fitBounds(mcg.getBounds());
      // // add the marker cluster group to the map
      map.addLayer(mcg);
    }, [markers, map]);

    return null;
  };

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
        <MarkerCluster markers={data[0].crimes} />
      </MapContainer>
    </>
  );
};

export default MyMap;
