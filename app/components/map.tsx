'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import './map.css';
import { Crime } from '../models/models';
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
import ReactDOMServer from 'react-dom/server';

interface MyMapProps {
  items: Crime[];
  isLoading: boolean;
}

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

const newDivIcon = (icon: string): L.DivIcon => {
  return new L.DivIcon({
    html: icon,
    iconSize: [22, 20],
    className: 'custom-div-icon',
  });
};

const getIcon = (incident: string): L.DivIcon | L.Icon => {
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
      return new L.Icon({
        iconUrl: '/dot-svgrepo-com.svg',
        iconSize: [10, 10],
      });
  }
};

const MyMap = ({ items, isLoading }: MyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create the map
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [44.953672, -93.102277],
        zoom: 12,
        scrollWheelZoom: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);

      // Create marker cluster group
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

      mapInstanceRef.current.addLayer(markerClusterGroupRef.current);

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerClusterGroupRef.current = null;
      }
    };
  }, []);

  // Update markers when items change
  useEffect(() => {
    if (!markerClusterGroupRef.current) return;

    try {
      // Clear existing markers
      markerClusterGroupRef.current.clearLayers();

      // Add new markers
      items.forEach((crime) => {
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

      console.log(`Added ${items.length} markers to map`);
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [items]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <span className="loading loading-infinity loading-lg"></span>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MyMap;
