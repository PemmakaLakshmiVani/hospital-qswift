import React from 'react';
import { Star, MapPin, Clock, Stethoscope, ChevronRight, Activity, Building2 } from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

export default function HospitalCard({ hospital, onSelect }) {
  const { doctors, getDoctorQueueStats, isHospitalCurrentlyOpen, isHospitalClosedOnDate, formatTimeAMPM } = useQueue();

  // Find active doctors belonging to this hospital (excluding resigned doctors)
  const hospitalDoctors = doctors.filter(d => d.hospital_id === hospital.id && !d.is_resigned && d.status !== 'resigned');
  const primaryDoctor = hospitalDoctors[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const isClosedToday = isHospitalClosedOnDate(hospital, todayStr);
  const isOpenNow = isHospitalCurrentlyOpen(hospital);

  // Calculate stats for primary doctor snippet
  const primaryStats = primaryDoctor ? getDoctorQueueStats(primaryDoctor.id) : null;

  return (
    <div
      onClick={() => onSelect(hospital)}
      className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
        !isOpenNow
          ? 'bg-slate-50 border-slate-300/80 shadow-xs'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Cover Image & Rating Badge */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={(() => {
            const raw = hospital.photo_url;
            if (!raw) return "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80";
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
          alt={hospital.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent"></div>

        {/* Type Pill, Verified Badge & Open Status */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-ink rounded-full shadow-sm">
            {hospital.type?.replace('_', ' ') || 'Clinic'}
          </span>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-clinical-500 text-white rounded-full shadow-sm flex items-center gap-1">
            ✓ Verified Facility
          </span>
          {isOpenNow ? (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              Open Now
            </span>
          ) : isClosedToday ? (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded-full shadow-sm flex items-center gap-1">
              🔴 CLOSED TODAY {hospital.closed_from && hospital.closed_to ? `(${hospital.closed_from} to ${hospital.closed_to})` : ''}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white rounded-full shadow-sm flex items-center gap-1">
              🌙 CLOSED NOW (OPD: {formatTimeAMPM(hospital.open_time || '08:00')} – {formatTimeAMPM(hospital.close_time || '20:00')})
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-ink rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{hospital.rating || 4.8}</span>
          <span className="text-[10px] text-slate-400 font-normal">({hospital.review_count})</span>
        </div>

        {/* Distance Chip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-medium bg-ink/40 backdrop-blur-sm px-2.5 py-0.5 rounded-md">
          <MapPin className="w-3.5 h-3.5 text-clinical-100" />
          <span>{hospital.distance_km || 1.5} km away</span>
        </div>
      </div>

      {/* Details & Live OPD Doctor Queue Snippet */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-ink group-hover:text-clinical-600 transition-colors line-clamp-1">
            {hospital.name}
          </h3>
          <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{hospital.address}</p>

          {/* Specialties Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(hospital.specialties || ["General Physician", "Pediatrics"]).slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 text-[11px] font-semibold bg-clinical-50 text-clinical-700 rounded-md border border-clinical-100/50"
              >
                {spec}
              </span>
            ))}
            {hospital.specialties?.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded-md">
                +{hospital.specialties.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Live OPD Doctor Snippet — Section 3 key requirement */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {primaryDoctor && primaryStats ? (
            <div className="p-2.5 bg-clinical-50/60 rounded-xl border border-clinical-100/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-clinical-500 text-white flex items-center justify-center font-bold text-xs">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink line-clamp-1">
                    {primaryDoctor.name} <span className="font-normal text-[11px] text-ink-muted">({primaryDoctor.specialty})</span>
                  </p>
                  <p className="text-[11px] text-clinical-700 font-medium flex items-center gap-1">
                    <span>Token <strong className="font-mono text-clinical-700">#{primaryStats.servingTokenNumber || 1}</strong> serving</span>
                    <span>·</span>
                    <span className="text-amberState-dark font-bold">~{primaryStats.estimatedWaitMins} min wait</span>
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-clinical-600 group-hover:translate-x-1 transition-transform" />
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
              <span>{hospitalDoctors.length} Doctors Available</span>
              <span className="text-clinical-600 font-bold group-hover:underline flex items-center gap-0.5">
                Book OPD Token <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
