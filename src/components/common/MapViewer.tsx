import React, { useEffect, useRef } from 'react';
import { House, LocationData } from '../../types';
import { Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';

interface MapViewerProps {
  location?: LocationData;
  houses?: House[];
  onLocationSelect?: (loc: { lat: number; lng: number; address: string }) => void;
  isPicker?: boolean;
  onHouseClick?: (house: House) => void;
  height?: string;
  className?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  location,
  houses = [],
  onLocationSelect,
  isPicker = false,
  onHouseClick,
  height = '300px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // Center coordinates (Default to Nairobi)
  const defaultLat = location?.lat || (houses.length > 0 ? houses[0].location.lat : -1.286389);
  const defaultLng = location?.lng || (houses.length > 0 ? houses[0].location.lng : 36.817223);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: isPicker ? 14 : (location ? 15 : 12),
        zoomControl: true,
      });

      // CartoDB Voyager clean tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = L.layerGroup().addTo(map);

      if (isPicker && onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onLocationSelect({
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            address: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        });
      }
    }

    // Refresh tile size after mount
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      // Keep instance or cleanup on unmount
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    // Custom CasaLink Pin Icon
    const customIcon = L.divIcon({
      className: 'custom-casalink-pin',
      html: `
        <div style="background-color: #146C5A; border: 2.5px solid #E8D8B9; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    if (location) {
      const marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(markerGroupRef.current);
      marker.bindPopup(`
        <div style="padding: 4px; font-family: 'Manrope', sans-serif;">
          <b style="color: #146C5A; font-size: 13px;">${location.address}</b>
          <p style="margin: 2px 0 0; font-size: 11px; color: #666;">${location.city}, ${location.county}</p>
        </div>
      `);
      mapInstanceRef.current.setView([location.lat, location.lng], 15);
    } else if (houses.length > 0) {
      const bounds = L.latLngBounds([]);
      houses.forEach(h => {
        const marker = L.marker([h.location.lat, h.location.lng], { icon: customIcon }).addTo(markerGroupRef.current!);
        marker.bindPopup(`
          <div style="padding: 6px; font-family: 'Manrope', sans-serif; min-width: 160px;">
            <b style="color: #146C5A; font-size: 13px; display: block;">${h.title}</b>
            <span style="color: #B66A32; font-weight: bold; font-size: 12px; display: block; margin-top: 2px;">KES ${h.rent.toLocaleString()}/mo</span>
            <p style="margin: 2px 0 6px; font-size: 11px; color: #555;">${h.location.address}</p>
            <button id="btn_popup_${h.id}" style="background-color: #146C5A; color: white; border: none; width: 100%; padding: 5px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">View House Details</button>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn_popup_${h.id}`);
          if (btn && onHouseClick) {
            btn.onclick = () => onHouseClick(h);
          }
        });

        bounds.extend([h.location.lat, h.location.lng]);
      });

      if (houses.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
      } else if (houses.length === 1) {
        mapInstanceRef.current.setView([houses[0].location.lat, houses[0].location.lng], 14);
      }
    }
  }, [location, houses, isPicker]);

  const openLiveDirections = () => {
    if (!location) return;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <div ref={mapContainerRef} style={{ height }} className="w-full bg-[#E8D8B9]/20" />

      {location && !isPicker && (
        <div className="absolute bottom-3 right-3 z-[400]">
          <button
            onClick={openLiveDirections}
            className="py-2.5 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 border border-[#E8D8B9]"
          >
            <Navigation className="w-4 h-4 text-[#E8D8B9]" />
            Live GPS Directions
          </button>
        </div>
      )}

      {isPicker && (
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-semibold text-[#146C5A] border border-[#146C5A]/30 shadow-md flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#B66A32]" />
          Click anywhere on map to set property GPS pin
        </div>
      )}
    </div>
  );
};
