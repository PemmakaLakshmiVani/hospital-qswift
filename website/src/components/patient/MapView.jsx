import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Clock, Star, Navigation } from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

// Custom SVG Leaflet Pin Marker with Hospital Icon & Clinical Teal Color
const createCustomMarkerIcon = (hospitalType) => {
  const color = hospitalType === 'hospital' ? '#0E7C86' : hospitalType === 'clinic' ? '#3B3F8C' : '#E8A33D';
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2.5px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">
        ✚
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function MapView({ hospitals, userLocation, onSelectHospital }) {
  const { doctors, getDoctorQueueStats } = useQueue();

  const centerLat = userLocation?.lat || 12.9716;
  const centerLng = userLocation?.lng || 77.5946;

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-0">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView center={[centerLat, centerLng]} />

        {/* User Location Pulse Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `
                <div class="relative flex items-center justify-center w-8 h-8">
                  <div class="absolute w-8 h-8 rounded-full bg-clinical-500/30 animate-ping"></div>
                  <div class="w-4 h-4 rounded-full bg-clinical-600 border-2 border-white shadow-md"></div>
                </div>
              `,
              className: 'user-loc-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div className="text-xs font-semibold text-ink">📍 Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Hospital Pin Markers */}
        {hospitals.map((hsp) => {
          const hspDoctors = doctors.filter(d => d.hospital_id === hsp.id);
          const topDoc = hspDoctors[0];
          const topStats = topDoc ? getDoctorQueueStats(topDoc.id) : null;

          return (
            <Marker
              key={hsp.id}
              position={[hsp.lat, hsp.lng]}
              icon={createCustomMarkerIcon(hsp.type)}
            >
              <Popup className="custom-popup">
                <div className="w-64">
                  <img
                    src={(() => {
                      const raw = hsp.photo_url;
                      if (!raw) return "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80";
                      if (raw.includes('google.com/imgres') || raw.includes('imgurl=')) {
                        const match = raw.match(/[?&]imgurl=([^&]+)/);
                        if (match && match[1]) return decodeURIComponent(match[1]);
                      }
                      if (raw.includes('google.com/url?') && raw.includes('url=')) {
                        const match = raw.match(/[?&]url=([^&]+)/);
                        if (match && match[1]) return decodeURIComponent(match[1]);
                      }
                      return raw;
                    })()}
                    alt={hsp.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-clinical-700 bg-clinical-50 px-2 py-0.5 rounded">
                      {hsp.type?.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{hsp.rating || 4.8}</span>
                    </div>
                  </div>

                  <h4 className="font-display font-bold text-sm text-ink mt-1 line-clamp-1">{hsp.name}</h4>
                  <p className="text-[11px] text-ink-muted line-clamp-1">{hsp.address}</p>

                  {topDoc && topStats && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px]">
                      <p className="font-semibold text-ink truncate">{topDoc.name} ({topDoc.specialty})</p>
                      <p className="text-clinical-700 font-medium">
                        Token #{topStats.servingTokenNumber} serving · ~{topStats.estimatedWaitMins}m wait
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectHospital(hsp)}
                    className="mt-3 w-full py-1.5 px-3 bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                  >
                    <span>View Doctors & Grab Token</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
