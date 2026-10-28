import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  List,
  Map as MapIcon,
  Filter,
  Clock,
  Star,
  Activity,
  SlidersHorizontal,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { getUserLocation } from '../../lib/geocoding';
import HospitalCard from './HospitalCard';
import MapView from './MapView';

const SPECIALTIES = [
  "All Specialties",
  "General Physician",
  "Pediatrics",
  "Dermatology",
  "Dental",
  "ENT",
  "Gynaecology",
  "Cardiology",
  "Orthopedics"
];

const PRESET_LOCATIONS = [
  { name: "Near Me (GPS)", lat: 12.9784, lng: 77.6408 },
  { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "Bannerghatta Rd", lat: 12.8956, lng: 77.5989 },
  { name: "HSR Layout", lat: 12.9121, lng: 77.6446 },
  { name: "HAL Airport Rd", lat: 12.9592, lng: 77.6482 },
];

export default function DiscoveryFeed({ onSelectHospital }) {
  const { hospitals, doctors, getDoctorQueueStats } = useQueue();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'open' | 'shortest' | 'top_rated'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  const [userLocation, setUserLocation] = useState({ lat: 12.9784, lng: 77.6408 });
  const [selectedArea, setSelectedArea] = useState('Indiranagar, Bengaluru');
  const [isLocating, setIsLocating] = useState(false);

  // Auto detect location on mount
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    const loc = await getUserLocation();
    setUserLocation(loc);
    if (!loc.isDefault) {
      setSelectedArea('Current GPS Location');
    }
    setIsLocating(false);
  };

  const filteredHospitals = hospitals.filter((hospital) => {
    // Exclude soft-deleted facilities from patient view
    if (hospital.is_deleted) return false;

    // Search matching
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Specialty filter
    if (selectedSpecialty !== 'All Specialties') {
      const hospitalDocs = doctors.filter(d => d.hospital_id === hospital.id && !d.is_resigned && d.status !== 'resigned');
      const hasSpecialty = hospitalDocs.some(d => d.specialty === selectedSpecialty) ||
        hospital.specialties?.includes(selectedSpecialty);
      if (!hasSpecialty) return false;
    }

    // Filter Chips: Open now, Shortest wait, Top rated
    if (activeFilter === 'open' && !hospital.is_open) return false;
    if (activeFilter === 'top_rated' && (hospital.rating || 0) < 4.7) return false;

    return true;
  });

  // Sort if "Shortest wait" filter selected
  const sortedHospitals = [...filteredHospitals].sort((a, b) => {
    if (activeFilter === 'shortest') {
      const docA = doctors.find(d => d.hospital_id === a.id && !d.is_resigned && d.status !== 'resigned');
      const docB = doctors.find(d => d.hospital_id === b.id && !d.is_resigned && d.status !== 'resigned');
      const waitA = docA ? getDoctorQueueStats(docA.id).estimatedWaitMins : 999;
      const waitB = docB ? getDoctorQueueStats(docB.id).estimatedWaitMins : 999;
      return waitA - waitB;
    }
    return 0;
  });


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Banner with Swiggy/Zomato energy adapted for OPD Walk-ins */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-clinical-700 via-clinical-500 to-[#3B3F8C] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-amber-300 border border-white/20 mb-3">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Skip Crowded Waiting Rooms</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
            Grab Live OPD Tokens for Nearby Clinics & Doctors
          </h1>
          <p className="mt-2 text-sm sm:text-base text-clinical-100 font-normal">
            Wait comfortably from home or a café. Track your position in queue in real time.
          </p>
        </div>

        {/* Decorative background visual */}
        <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-8 translate-y-8">
          <div className="w-80 h-80 rounded-full border-8 border-white"></div>
        </div>
      </div>

      {/* Sticky Search Bar & Location Selector */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Location Chip */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold rounded-xl flex items-center justify-between sm:justify-start gap-2 transition-colors border border-slate-200"
            >
              <MapPin className="w-4 h-4 text-clinical-600 shrink-0" />
              <span className="truncate max-w-[160px] text-left">
                {isLocating ? 'Locating...' : selectedArea}
              </span>
              <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospitals, clinics, doctor names or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          {/* List vs Map View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-clinical-700 shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-clinical-700 shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 pr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 border transition-all ${
              activeFilter === 'all'
                ? 'bg-clinical-500 text-white border-clinical-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Hospitals ({hospitals.length})
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'open' ? 'all' : 'open')}
            className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 border flex items-center gap-1 transition-all ${
              activeFilter === 'open'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Open Now
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'shortest' ? 'all' : 'shortest')}
            className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 border flex items-center gap-1 transition-all ${
              activeFilter === 'shortest'
                ? 'bg-amberState-dark text-white border-amber-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Shortest Wait
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'top_rated' ? 'all' : 'top_rated')}
            className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 border flex items-center gap-1 transition-all ${
              activeFilter === 'top_rated'
                ? 'bg-indigoConsole text-white border-indigo-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Top Rated (4.7+)
          </button>
        </div>

        {/* Medical Specialty Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                selectedSpecialty === spec
                  ? 'bg-clinical-50 text-clinical-700 font-bold border-2 border-clinical-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section: List View or Map View */}
      {viewMode === 'list' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-ink">
              Nearby OPD Clinics & Hospitals
              <span className="ml-2 text-xs text-ink-muted font-sans font-normal">
                ({sortedHospitals.length} places found)
              </span>
            </h2>
          </div>

          {sortedHospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedHospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  onSelect={onSelectHospital}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-display text-base font-bold text-ink">No matching OPD clinics found</h3>
              <p className="text-xs text-ink-muted mt-1">Try clearing your specialty or filter selection.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('All Specialties');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-clinical-500 text-white rounded-lg hover:bg-clinical-600"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <MapView
          hospitals={sortedHospitals}
          userLocation={userLocation}
          onSelectHospital={onSelectHospital}
        />
      )}
    </div>
  );
}
