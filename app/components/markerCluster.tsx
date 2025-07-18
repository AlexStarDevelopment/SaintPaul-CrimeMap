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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import L from 'leaflet';
import 'leaflet.markercluster';
import { DivIcon, Icon } from 'leaflet';
import React, { useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useMap } from 'react-leaflet';
import { Crime } from '../models/models';

// Pre-render all FontAwesome icons to strings for better performance
const iconMap = {
  fist: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faHandFist} color="black" />
  ),
  car: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faCar} color="black" />
  ),
  money: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faMoneyBill} color="black" />
  ),
  house: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faHouse} color="black" />
  ),
  gun: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faGun} color="black" />
  ),
  graffiti: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faSprayCan} color="black" />
  ),
  narco: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faPills} color="black" />
  ),
  robbery: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faMask} color="black" />
  ),
  arson: ReactDOMServer.renderToString(
    <FontAwesomeIcon height={20} width={20} icon={faFire} color="black" />
  ),
};

interface MarkerClusterProps {
  markers: Crime[];
}

const MarkerCluster = ({ markers }: MarkerClusterProps) => {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const isInitialized = useRef(false);

  const newDivIcon = (icon: string): DivIcon => {
    return new DivIcon({
      html: icon,
      iconSize: [22, 20],
      className: 'custom-div-icon',
    });
  };

  const getIcon = (incident: string): DivIcon | Icon => {
    const lowerIncident = incident?.toLowerCase();
    switch (lowerIncident) {
      case 'agg. assault':
      case 'agg. assault dom.':
      case 'agg. assault dom':
      case 'simple asasult dom.':
      case 'simple assault dom.':
        return newDivIcon(iconMap.fist);
      case 'auto theft':
        return newDivIcon(iconMap.car);
      case 'theft':
        return newDivIcon(iconMap.money);
      case 'burglary':
        return newDivIcon(iconMap.house);
      case 'discharge':
        return newDivIcon(iconMap.gun);
      case 'graffiti':
      case 'vandalism':
      case 'criminal damage':
        return newDivIcon(iconMap.graffiti);
      case 'narcotics':
        return newDivIcon(iconMap.narco);
      case 'robbery':
        return newDivIcon(iconMap.robbery);
      case 'arson':
        return newDivIcon(iconMap.arson);
      default:
        return new Icon({
          iconUrl: '/dot-svgrepo-com.svg',
          iconSize: [10, 10],
        });
    }
  };

  useEffect(() => {
    if (!map || isInitialized.current) return;

    // Initialize marker cluster group only once
    try {
      if (!markerClusterGroupRef.current) {
        markerClusterGroupRef.current = L.markerClusterGroup({
          maxClusterRadius: 50,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            let size = 'small';
            
            if (count >= 100) {
              size = 'large';
            } else if (count >= 10) {
              size = 'medium';
            }
            
            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `custom-cluster-icon custom-cluster-${size}`,
              iconSize: L.point(33, 33, true),
            });
          },
        });
        
        map.addLayer(markerClusterGroupRef.current);
        isInitialized.current = true;
      }
    } catch (error) {
      console.error('Error initializing marker cluster:', error);
    }
  }, [map]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!markerClusterGroupRef.current || !isInitialized.current) return;

    try {
      // Clear existing markers
      markerClusterGroupRef.current.clearLayers();

      // Add new markers
      markers.forEach((crime) => {
        const marker = L.marker([crime.LAT, crime.LON], {
          icon: getIcon(crime.INCIDENT || ''),
        }).bindPopup(
          `<div class="crime-popup">
            <p><strong>Case Number:</strong> ${crime.CASE_NUMBER}</p>
            <p><strong>Date:</strong> ${new Date(crime.DATE).toLocaleString()}</p>
            <p><strong>Incident:</strong> ${crime.INCIDENT}</p>
            <p><strong>Incident details:</strong> ${crime.INCIDENT_TYPE}</p>
            <p><strong>Location:</strong> ${crime.BLOCK_VIEW}</p>
            <p><strong>Call Disposition:</strong> ${crime.CALL_DISPOSITION}</p>
          </div>`
        );
        
        markerClusterGroupRef.current?.addLayer(marker);
      });
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [markers]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (markerClusterGroupRef.current && map) {
        try {
          if (map.hasLayer(markerClusterGroupRef.current)) {
            map.removeLayer(markerClusterGroupRef.current);
          }
          markerClusterGroupRef.current = null;
          isInitialized.current = false;
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    };
  }, [map]);

  return null;
};

export default MarkerCluster;
