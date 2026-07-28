import React, { useState, useEffect, useRef } from 'react';
import { House } from '../../types';
import { usePlatform } from '../../context/PlatformContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Navigation as NavIcon, 
  MapPin, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Car, 
  Bike, 
  Footprints, 
  Bus, 
  Sparkles, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  ArrowUp, 
  ArrowLeft, 
  ArrowRight, 
  CornerUpRight, 
  Flag, 
  Clock, 
  Gauge, 
  ShieldCheck, 
  Route, 
  Zap,
  Mic,
  X
} from 'lucide-react';

export type TransportMode = 'driving' | 'motorcycle' | 'walking' | 'public';
export type VoiceType = 'female' | 'male' | 'child';

interface RouteStep {
  instruction: string;
  distanceMeters: number;
  street: string;
  maneuver: 'straight' | 'turn-left' | 'turn-right' | 'slight-right' | 'destination';
  lat: number;
  lng: number;
}

export const NavigationView: React.FC = () => {
  const { navigatingHouse, setNavigatingHouse, setActiveTab, openHouseDetails, setActiveConversationId, showToast } = usePlatform();
  const { user } = useAuth();

  const [availableHouses, setAvailableHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(navigatingHouse);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [voiceType, setVoiceType] = useState<VoiceType>('female');
  const [isMuted, setIsMuted] = useState(false);

  // Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(45);
  const [currentStreet, setCurrentStreet] = useState<string>('Nairobi CBD Boulevard');
  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>('CasaLink AI Navigation ready. Choose a house to begin live guidance.');
  const [isRerouting, setIsRerouting] = useState<boolean>(false);

  // Leaflet Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const houseMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const altPolylineRef = useRef<L.Polyline | null>(null);

  // Default User Location (Nairobi CBD)
  const [userCoord, setUserCoord] = useState<{ lat: number; lng: number }>({
    lat: -1.286389,
    lng: 36.817223,
  });

  // Fetch houses if no target house passed
  useEffect(() => {
    api.getHouses()
      .then(res => {
        setAvailableHouses(res);
        if (!selectedHouse && res.length > 0) {
          setSelectedHouse(res[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (navigatingHouse) {
      setSelectedHouse(navigatingHouse);
    }
  }, [navigatingHouse]);

  // Destination coords
  const destCoord = selectedHouse ? {
    lat: selectedHouse.location.lat,
    lng: selectedHouse.location.lng,
  } : {
    lat: -1.2980,
    lng: 36.7900,
  };

  // Generate Turn-By-Turn Steps along route
  const generateRouteSteps = (): RouteStep[] => {
    const lat1 = userCoord.lat;
    const lng1 = userCoord.lng;
    const lat2 = destCoord.lat;
    const lng2 = destCoord.lng;

    const dLat = (lat2 - lat1) / 5;
    const dLng = (lng2 - lng1) / 5;

    return [
      {
        instruction: 'Head north on Commercial St towards City Center',
        distanceMeters: 250,
        street: 'Commercial Street',
        maneuver: 'straight',
        lat: lat1,
        lng: lng1,
      },
      {
        instruction: 'In 200 metres, turn left onto Waiyaki Way Highway',
        distanceMeters: 600,
        street: 'Waiyaki Way',
        maneuver: 'turn-left',
        lat: lat1 + dLat * 1.2,
        lng: lng1 + dLng * 0.8,
      },
      {
        instruction: 'Continue straight for 800 metres past Yaya Center',
        distanceMeters: 800,
        street: 'Argwings Kodhek Road',
        maneuver: 'straight',
        lat: lat1 + dLat * 2.5,
        lng: lng1 + dLng * 2.2,
      },
      {
        instruction: 'In 300 metres, turn right onto Ring Road Kilimani',
        distanceMeters: 300,
        street: 'Ring Road Kilimani',
        maneuver: 'turn-right',
        lat: lat1 + dLat * 3.8,
        lng: lng1 + dLng * 3.5,
      },
      {
        instruction: 'Take the next left onto Chania Avenue',
        distanceMeters: 150,
        street: 'Chania Avenue',
        maneuver: 'slight-right',
        lat: lat1 + dLat * 4.4,
        lng: lng1 + dLng * 4.3,
      },
      {
        instruction: `You have arrived at ${selectedHouse ? selectedHouse.title : 'Destination'}`,
        distanceMeters: 0,
        street: selectedHouse ? selectedHouse.location.address : 'Destination Address',
        maneuver: 'destination',
        lat: lat2,
        lng: lng2,
      },
    ];
  };

  const routeSteps = generateRouteSteps();

  // Speech Synthesis Helper
  const speakVoice = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);

      // Pitch & Rate adjustments based on voiceType
      if (voiceType === 'female') {
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      } else if (voiceType === 'male') {
        utterance.pitch = 0.85;
        utterance.rate = 0.95;
      } else if (voiceType === 'child') {
        utterance.pitch = 1.5;
        utterance.rate = 1.1;
      }

      // Voice selection if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (voiceType === 'female') {
          const fVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
          if (fVoice) utterance.voice = fVoice;
        } else if (voiceType === 'male') {
          const mVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Google US English') || v.name.includes('Alex') || v.name.includes('Daniel'));
          if (mVoice) utterance.voice = mVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // quiet fallback
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userCoord.lat, userCoord.lng],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Remove existing markers & lines
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (houseMarkerRef.current) map.removeLayer(houseMarkerRef.current);
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (altPolylineRef.current) map.removeLayer(altPolylineRef.current);

    // User Location Pulse Marker
    const userIcon = L.divIcon({
      className: 'custom-user-nav-pin',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; background: rgba(20, 108, 90, 0.25); border-radius: 50%; animation: ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="background: #146C5A; border: 3px solid #E8D8B9; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); transform: rotate(${heading}deg); transition: transform 0.3s ease;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="12 2 19 21 12 17 5 21 12 2"></polygon></svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const uMarker = L.marker([userCoord.lat, userCoord.lng], { icon: userIcon }).addTo(map);
    userMarkerRef.current = uMarker;

    // House Destination Marker
    if (selectedHouse) {
      const houseIcon = L.divIcon({
        className: 'custom-house-nav-pin',
        html: `
          <div style="background: #242424; border: 2.5px solid #B66A32; color: #E8D8B9; padding: 4px 8px; border-radius: 12px; font-weight: 800; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.4); white-space: nowrap;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B66A32" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            <span>KES ${selectedHouse.rent.toLocaleString()}</span>
          </div>
        `,
        iconSize: [110, 32],
        iconAnchor: [55, 16],
      });

      const hMarker = L.marker([destCoord.lat, destCoord.lng], { icon: houseIcon }).addTo(map);
      houseMarkerRef.current = hMarker;
    }

    // Polyline Route
    const waypoints: [number, number][] = routeSteps.map(s => [s.lat, s.lng]);
    const polyline = L.polyline(waypoints, {
      color: '#146C5A',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routePolylineRef.current = polyline;

    // Alternative Route Polyline
    const altWaypoints: [number, number][] = waypoints.map(([la, ln], i) => [
      la + (i % 2 === 0 ? 0.0015 : -0.0012),
      ln + (i % 2 === 0 ? -0.001 : 0.0018),
    ]);
    const altPolyline = L.polyline(altWaypoints, {
      color: '#B66A32',
      weight: 4,
      opacity: 0.5,
      dashArray: '8, 8',
    }).addTo(map);
    altPolylineRef.current = altPolyline;

    // Fit Map Bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [selectedHouse, userCoord.lat, userCoord.lng]);

  // Simulation Timer loop
  useEffect(() => {
    let timer: any;
    if (isNavigating && !isPaused && !hasArrived) {
      timer = setInterval(() => {
        setProgressPercent(prev => {
          const next = prev + 1.2 * simSpeed;
          if (next >= 100) {
            setHasArrived(true);
            setIsNavigating(false);
            setCurrentSpeed(0);
            speakVoice(`🎉 You have arrived at your destination! ${selectedHouse?.title || ''}`);
            setAiMessage(`🎉 Welcome! You have arrived at ${selectedHouse?.title}. Your landlord is ${selectedHouse?.landlordName}.`);
            return 100;
          }

          // Compute interpolated position along route steps
          const stepCount = routeSteps.length - 1;
          const currentStep = Math.min(Math.floor((next / 100) * stepCount), stepCount - 1);
          setCurrentStepIndex(currentStep);

          const stepStart = routeSteps[currentStep];
          const stepEnd = routeSteps[currentStep + 1] || stepStart;
          const stepFrac = ((next / 100) * stepCount) % 1;

          const curLat = stepStart.lat + (stepEnd.lat - stepStart.lat) * stepFrac;
          const curLng = stepStart.lng + (stepEnd.lng - stepStart.lng) * stepFrac;

          // Compute angle/heading
          const dY = stepEnd.lat - stepStart.lat;
          const dX = stepEnd.lng - stepStart.lng;
          const angle = Math.round((Math.atan2(dX, dY) * 180) / Math.PI);
          setHeading((angle + 360) % 360);

          setUserCoord({ lat: curLat, lng: curLng });
          setCurrentStreet(stepStart.street);

          // Update Leaflet marker position & pan
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([curLat, curLng]);
          }
          if (mapRef.current) {
            mapRef.current.panTo([curLat, curLng], { animate: true });
          }

          // Voice Callout trigger at step boundaries
          if (Math.abs(stepFrac - 0.05) < 0.05) {
            speakVoice(stepStart.instruction);
          }

          // Dynamic Speed based on mode
          const baseSpeed = transportMode === 'driving' ? 42 : transportMode === 'motorcycle' ? 36 : transportMode === 'walking' ? 5 : 28;
          const jitter = Math.floor(Math.sin(next) * 4);
          setCurrentSpeed(Math.max(1, baseSpeed + jitter));

          // AI Smart Contextual Updates
          if (next > 25 && next < 30) {
            setAiMessage('⚠️ AI Traffic Alert: Moderate traffic detected ahead on Waiyaki Way. Delay estimated at 1 min.');
          } else if (next > 55 && next < 60) {
            setAiMessage('✨ AI Route Advisory: Optimal path confirmed via Ring Road Kilimani. Save 2 mins!');
          } else if (next > 85 && next < 90) {
            setAiMessage('🏁 Almost there! Your destination is approximately 1 minute away on the left.');
          }

          return next;
        });
      }, 400);
    }
    return () => clearInterval(timer);
  }, [isNavigating, isPaused, hasArrived, simSpeed, transportMode, voiceType, isMuted, selectedHouse]);

  // Start Navigation Action
  const handleStartNavigation = () => {
    setHasArrived(false);
    setProgressPercent(0);
    setCurrentStepIndex(0);
    setIsNavigating(true);
    setIsPaused(false);
    
    speakVoice(`Starting CasaLink live navigation to ${selectedHouse ? selectedHouse.title : 'your property'}. ${routeSteps[0].instruction}`);
    setAiMessage(`Navigation started via ${transportMode.toUpperCase()} mode. Following optimal route.`);
  };

  // Pause / Resume Action
  const handleTogglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      showToast(next ? 'Navigation Paused' : 'Resuming Navigation', '', 'info');
      return next;
    });
  };

  // Reset Trip Action
  const handleResetTrip = () => {
    setIsNavigating(false);
    setIsPaused(false);
    setProgressPercent(0);
    setCurrentStepIndex(0);
    setHasArrived(false);
    setCurrentSpeed(0);
    if (routeSteps[0]) {
      setUserCoord({ lat: routeSteps[0].lat, lng: routeSteps[0].lng });
    }
    showToast('Trip Reset', 'Position returned to starting point.', 'info');
  };

  // AI Reroute Action
  const handleAiReroute = () => {
    setIsRerouting(true);
    speakVoice('Recalculating route... Alternative faster path selected.');
    setAiMessage('🔄 AI Rerouted: Switched to shorter side route via Chania Avenue.');
    setTimeout(() => {
      setIsRerouting(false);
      showToast('AI Route Updated', 'Optimized path applied to map.', 'success');
    }, 1200);
  };

  // Calculate Metrics
  const totalDistKm = transportMode === 'walking' ? 1.8 : 3.4;
  const remainingDistKm = Math.max(0, Number((totalDistKm * (1 - progressPercent / 100)).toFixed(1)));
  
  const totalMin = transportMode === 'driving' ? 8 : transportMode === 'motorcycle' ? 7 : transportMode === 'walking' ? 24 : 12;
  const remainingMin = Math.max(0, Math.ceil(totalMin * (1 - progressPercent / 100)));

  const now = new Date();
  const etaDate = new Date(now.getTime() + remainingMin * 60000);
  const etaString = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const currentManeuver = routeSteps[currentStepIndex] || routeSteps[0];

  return (
    <div className="space-y-4">
      
      {/* Top Header & Property Selector */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#146C5A] text-[#E8D8B9] rounded-2xl shadow-sm">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-[#242424]">CasaLink Built-in Live Navigation</h1>
              <span className="px-2.5 py-0.5 bg-[#146C5A]/10 text-[#146C5A] font-extrabold text-[10px] uppercase rounded-full border border-[#146C5A]/20">
                In-App GPS
              </span>
            </div>
            <p className="text-xs text-gray-500">Built-in live map, turn-by-turn voice prompts & AI assistant guidance</p>
          </div>
        </div>

        {/* Target Property Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">Destination:</span>
          <select
            value={selectedHouse?.id || ''}
            onChange={(e) => {
              const h = availableHouses.find(house => house.id === e.target.value);
              if (h) {
                setSelectedHouse(h);
                setNavigatingHouse(h);
                handleResetTrip();
              }
            }}
            className="bg-[#F8F9FA] border border-gray-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none max-w-[220px] truncate"
          >
            {availableHouses.map(h => (
              <option key={h.id} value={h.id}>
                {h.title} (KES {h.rent.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Map Navigation Stage */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-gray-100 min-h-[520px] flex flex-col">
        
        {/* TOP FLOATING MANEUVER INSTRUCTION BANNER */}
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-[#146C5A] text-white p-4 rounded-3xl shadow-xl border border-[#E8D8B9]/30 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-[#E8D8B9] text-[#146C5A] rounded-2xl shrink-0 shadow-md">
              {currentManeuver.maneuver === 'turn-left' && <ArrowLeft className="w-7 h-7 stroke-[3]" />}
              {currentManeuver.maneuver === 'turn-right' && <ArrowRight className="w-7 h-7 stroke-[3]" />}
              {currentManeuver.maneuver === 'slight-right' && <CornerUpRight className="w-7 h-7 stroke-[3]" />}
              {currentManeuver.maneuver === 'straight' && <ArrowUp className="w-7 h-7 stroke-[3]" />}
              {currentManeuver.maneuver === 'destination' && <Flag className="w-7 h-7 stroke-[3] text-[#B66A32]" />}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#E8D8B9] uppercase tracking-wider">
                  {progressPercent === 0 ? 'Ready to Start' : `In ${Math.round(currentManeuver.distanceMeters * (1 - (progressPercent % 20) / 20))}m`}
                </span>
                <span className="px-2 py-0.5 bg-black/30 rounded-lg text-[10px] text-gray-200">
                  {currentStreet}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-extrabold text-white truncate leading-tight">
                {currentManeuver.instruction}
              </h3>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
            <span className="text-[10px] font-bold text-gray-300 uppercase">Target Property</span>
            <span className="text-xs font-extrabold text-[#E8D8B9] max-w-[150px] truncate">{selectedHouse?.title}</span>
          </div>
        </div>

        {/* MAP CONTAINER */}
        <div ref={mapContainerRef} className="w-full h-[520px] z-10" />

        {/* BOTTOM FLOATING LIVE METRICS & CONTROLS BAR */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-gray-200 shadow-xl space-y-3">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            
            {/* ETA */}
            <div className="p-2.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-[#146C5A]" /> ETA
              </span>
              <p className="text-sm font-extrabold text-[#146C5A]">{etaString}</p>
            </div>

            {/* Time Remaining */}
            <div className="p-2.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-[#B66A32]" /> Remaining
              </span>
              <p className="text-sm font-extrabold text-[#242424]">{remainingMin} min</p>
            </div>

            {/* Distance Remaining */}
            <div className="p-2.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1">
                <Route className="w-3 h-3 text-[#146C5A]" /> Distance
              </span>
              <p className="text-sm font-extrabold text-[#242424]">{remainingDistKm} km</p>
            </div>

            {/* Speed */}
            <div className="p-2.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1">
                <Gauge className="w-3 h-3 text-[#146C5A]" /> Speed
              </span>
              <p className="text-sm font-extrabold text-[#242424]">{currentSpeed} km/h</p>
            </div>

            {/* Compass Heading */}
            <div className="p-2.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80 hidden sm:block">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1">
                <Compass className="w-3 h-3 text-[#146C5A]" /> Compass
              </span>
              <div className="flex items-center justify-center gap-1">
                <span style={{ transform: `rotate(${heading}deg)` }} className="inline-block transition-transform duration-300 font-extrabold text-[#146C5A]">
                  ↑
                </span>
                <span className="text-xs font-extrabold text-[#242424]">{heading}° NE</span>
              </div>
            </div>
          </div>

          {/* Animated Route Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
              <span>Route Progress</span>
              <span>{Math.round(progressPercent)}% Completed</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#146C5A] via-[#2E8B57] to-[#B66A32] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Controls & Settings Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            
            {/* Transport Mode Pills */}
            <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-2xl border border-gray-200">
              <button
                onClick={() => setTransportMode('driving')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  transportMode === 'driving' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Driving Mode"
              >
                <Car className="w-3.5 h-3.5" /> <span className="hidden md:inline">Drive</span>
              </button>

              <button
                onClick={() => setTransportMode('motorcycle')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  transportMode === 'motorcycle' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Motorcycle Mode"
              >
                <Bike className="w-3.5 h-3.5" /> <span className="hidden md:inline">Boda</span>
              </button>

              <button
                onClick={() => setTransportMode('walking')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  transportMode === 'walking' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Walking Mode"
              >
                <Footprints className="w-3.5 h-3.5" /> <span className="hidden md:inline">Walk</span>
              </button>

              <button
                onClick={() => setTransportMode('public')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  transportMode === 'public' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Public Matatu Mode"
              >
                <Bus className="w-3.5 h-3.5" /> <span className="hidden md:inline">Matatu</span>
              </button>
            </div>

            {/* Voice Voice Type Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  isMuted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#146C5A]/10 text-[#146C5A] border-[#146C5A]/20'
                }`}
                title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <select
                value={voiceType}
                onChange={(e) => {
                  const vt = e.target.value as VoiceType;
                  setVoiceType(vt);
                  speakVoice(`Voice changed to ${vt} voice.`);
                }}
                className="bg-[#F8F9FA] border border-gray-300 text-xs font-bold text-gray-700 rounded-xl px-2.5 py-1.5 focus:ring-[#146C5A] focus:outline-none"
              >
                <option value="female">Adult Female Voice</option>
                <option value="male">Adult Male Voice</option>
                <option value="child">Child Voice</option>
              </select>
            </div>

            {/* Primary Drive / Pause / Reset Buttons */}
            <div className="flex items-center gap-2">
              {!isNavigating ? (
                <button
                  onClick={handleStartNavigation}
                  className="py-2.5 px-5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                  <NavIcon className="w-4 h-4 text-[#E8D8B9] fill-current" />
                  Start Trip
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTogglePause}
                    className="py-2 px-3.5 bg-gray-800 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-[#E8D8B9]" /> : <Pause className="w-3.5 h-3.5 text-[#E8D8B9]" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    onClick={handleResetTrip}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                    title="Reset Trip"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* AI Navigation Assistant Banner */}
      <div className="bg-gradient-to-r from-[#146C5A]/10 via-[#B66A32]/10 to-[#146C5A]/10 p-4 rounded-3xl border border-[#146C5A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#146C5A] text-[#E8D8B9] rounded-2xl shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-[#146C5A] uppercase tracking-wider">CasaLink AI Navigation Assistant</span>
              <span className="w-2 h-2 rounded-full bg-[#2E8B57] animate-ping" />
            </div>
            <p className="text-xs font-semibold text-[#242424]">{aiMessage}</p>
          </div>
        </div>

        <button
          onClick={handleAiReroute}
          disabled={isRerouting}
          className="py-2 px-4 bg-white hover:bg-[#146C5A]/10 text-[#146C5A] border border-[#146C5A]/30 font-bold text-xs rounded-2xl flex items-center gap-2 shrink-0 transition-all shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-[#B66A32]" />
          {isRerouting ? 'Recalculating...' : 'AI Recalculate Route'}
        </button>
      </div>

      {/* ARRIVAL CELEBRATION MODAL */}
      <AnimatePresence>
        {hasArrived && selectedHouse && (
          <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border-2 border-[#146C5A] space-y-5 text-center relative overflow-hidden"
            >
              {/* Confetti Background Accent */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E8D8B9] rounded-full blur-2xl opacity-50" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#146C5A] rounded-full blur-2xl opacity-20" />

              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-[#146C5A] text-[#E8D8B9] rounded-3xl mx-auto flex items-center justify-center shadow-lg border-2 border-[#E8D8B9]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-3xl">🎉</span>
                  <h2 className="text-xl font-extrabold text-[#242424]">You Have Arrived at Your Destination!</h2>
                  <p className="text-xs text-gray-500">Welcome to your target house location in {selectedHouse.location.city}</p>
                </div>

                {/* House Details Card */}
                <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-200 text-left flex items-center gap-4">
                  <img
                    src={selectedHouse.photos[0]}
                    alt={selectedHouse.title}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-extrabold text-[#242424] truncate">{selectedHouse.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{selectedHouse.location.address}</p>
                    <p className="text-xs font-extrabold text-[#146C5A]">
                      KES {selectedHouse.rent.toLocaleString()} / month
                    </p>
                  </div>
                </div>

                {/* Landlord Contact Info */}
                <div className="p-3 bg-[#E8D8B9]/30 rounded-2xl border border-[#B66A32]/30 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedHouse.landlordAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                      alt={selectedHouse.landlordName}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-[#146C5A]"
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-[#242424]">{selectedHouse.landlordName}</h4>
                      <p className="text-[10px] text-gray-500">Property Owner</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-[#B66A32]">{selectedHouse.landlordPhone}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setHasArrived(false);
                      setActiveConversationId(selectedHouse.id);
                      setActiveTab('messages');
                    }}
                    className="py-3 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-[#E8D8B9]" />
                    Message Landlord
                  </button>

                  <a
                    href={`tel:${selectedHouse.landlordPhone}`}
                    className="py-3 px-4 bg-[#B66A32] hover:bg-[#a05b2a] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Landlord
                  </a>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setHasArrived(false);
                      openHouseDetails(selectedHouse);
                    }}
                    className="text-xs font-bold text-[#146C5A] hover:underline"
                  >
                    View Property Details
                  </button>

                  <span className="text-gray-300">•</span>

                  <button
                    onClick={() => setHasArrived(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
