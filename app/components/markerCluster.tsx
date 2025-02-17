import {
  faCar,
  faFire,
  faGun,
  faHandFist,
  faHouse,
  faMask,
  faMoneyBill,
  faPills,
  faSprayCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import L from "leaflet";
import { DivIcon, Icon } from "leaflet";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { useMap } from "react-leaflet";

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

interface MarkerClusterProps {
  markers: Crime[];
}

const MarkerCluster = ({ markers }: MarkerClusterProps) => {
  const map = useMap();
  const mcg = L.markerClusterGroup();

  const newDivIcon = (icon: string): DivIcon => {
    return new DivIcon({
      html: icon,
      iconSize: [22, 20],
    });
  };

  React.useEffect(() => {
    const getIcon = (incident: string): DivIcon => {
      const lowerIncident = incident?.toLowerCase();
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
          return new Icon({
            iconUrl: "/dot-svgrepo-com.svg",
            iconSize: [10, 10],
          });
        }
      }
    };

    mcg.clearLayers();
    markers.forEach((position: any) =>
      L.marker(new L.LatLng(position.LAT, position.LON), {
        icon: getIcon(position.INCIDENT),
      })
        .addTo(mcg)
        .bindPopup(
          `<div><p><strong>Case Number:</strong> ${
            position.CASE_NUMBER
          }</p><p><strong>Date:</strong> ${new Date(
            position.DATE
          ).toLocaleString()}</p>
          <p><strong>Incident:</strong> ${position.INCIDENT}</p>
          <p><strong>Incident details:</strong> ${position.INCIDENT_TYPE}</p>
          <p><strong>Location:</strong> ${position.BLOCK_VIEW}</p>
          <p><strong>Call Disposition:</strong> ${position.CALL_DISPOSITION}</p>
          </div>`
        )
    );

    // optionally center the map around the markers
    // map.fitBounds(mcg.getBounds());
    // // add the marker cluster group to the map
    map.addLayer(mcg);
  }, [markers, map, mcg]);

  return null;
};

export default MarkerCluster;
