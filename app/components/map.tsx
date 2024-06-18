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

const fist = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faHandFist} color="black" />
);
const car = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faCar} color="black" />
);
const money = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faMoneyBill} color="black" />
);
const house = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faHouse} color="black" />
);
const gun = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faGun} color="black" />
);
const graffiti = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faSprayCan} color="black" />
);
const narco = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faPills} color="black" />
);
const robbery = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faMask} color="black" />
);
const arson = ReactDOMServer.renderToString(
  <FontAwesomeIcon height={20} width={20} icon={faFire} color="black" />
);

// @ts-ignore
const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

const MyMap = () => {
  const { data, error, isLoading } = useSWR("/api/data", fetcher);
  // const data = undefined;
  // const isLoading = true;

  if (isLoading)
    return <span className="loading loading-infinity loading-lg"></span>;
  if (!data)
    return <span className="loading loading-infinity loading-lg"></span>;

  const mcg = L.markerClusterGroup();

  const MarkerCluster = ({ markers }: any) => {
    const map = useMap();

    const newDivIcon = (icon: string): DivIcon => {
      return new DivIcon({
        html: icon,
        iconSize: [22, 20],
      });
    };

    const getIcon = (incident: string): DivIcon => {
      const lowerIncident = incident.toLowerCase();
      switch (lowerIncident) {
        case "agg. assault":
          return newDivIcon(fist);
        case "agg. assault dom.":
          return newDivIcon(fist);
        case "agg. assault dom":
          return newDivIcon(fist);
        case "simple asasult dom.":
          return newDivIcon(fist);
        case "simple assault dom.":
          return newDivIcon(fist);
        case "auto theft":
          return newDivIcon(car);
        case "theft":
          return newDivIcon(money);
        case "burglary":
          return newDivIcon(house);
        case "discharge":
          return newDivIcon(gun);
        case "graffiti":
          return newDivIcon(graffiti);
        case "vandalism":
          return newDivIcon(graffiti);
        case "criminal damage":
          return newDivIcon(graffiti);
        case "narcotics":
          return newDivIcon(narco);
        case "robbery":
          return newDivIcon(robbery);
        case "robbery":
          return newDivIcon(robbery);
        case "arson":
          return newDivIcon(arson);
        default: {
          console.log(incident);
          return new Icon({
            iconUrl: "/dot-svgrepo-com.svg",
            iconSize: [10, 10],
          });
        }
      }
    };

    React.useEffect(() => {
      mcg.clearLayers();
      markers.forEach((position: any) =>
        L.marker(new L.LatLng(position.LAT, position.LON), {
          icon: getIcon(position.INCIDENT),
        })
          .addTo(mcg)
          .bindPopup(
            `<div><p>${new Date(position.DATE).toLocaleString()}</p>${
              position.INCIDENT_TYPE
            }<p></p></div>`
          )
      );

      // optionally center the map around the markers
      // map.fitBounds(mcg.getBounds());
      // // add the marker cluster group to the map
      map.addLayer(mcg);
    }, [markers, map, getIcon]);

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
