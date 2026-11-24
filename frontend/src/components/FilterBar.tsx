import React, { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp, MapPin, Calendar, UserCheck } from 'lucide-react';

interface FilterBarProps {
  site: string;
  onSiteChange: (site: string) => void;
  dayType: string;
  onDayTypeChange: (dayType: string) => void;
  userType: string;
  onUserTypeChange: (userType: string) => void;
  selectedStation: string;
  onStationChange: (station: string) => void;
  availableStations: { station_id: string; site_name: string }[];
  onReset: () => void;
  totalFiltered: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  site,
  onSiteChange,
  dayType,
  onDayTypeChange,
  userType,
  onUserTypeChange,
  selectedStation,
  onStationChange,
  availableStations,
  onReset,
  totalFiltered,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filter station list by current site selection
  const filteredStationOptions = availableStations.filter(
    (s) => site === 'all' || s.site_name.toLowerCase() === site.toLowerCase()
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl overflow-hidden mb-6">
      <div className="p-4 px-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Analytical Filters</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Filtered Dataset:{' '}
              <span className="font-semibold text-indigo-400 font-mono">
                {totalFiltered.toLocaleString()}
              </span>{' '}
              verified charging sessions
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40">
          {/* Site Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              Operating Site
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['all', 'Caltech', 'JPL'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSiteChange(opt)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    site.toLowerCase() === opt.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt === 'all' ? 'All Sites' : opt}
                </button>
              ))}
            </div>
          </div>

          {/* Day Type Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Day Classification
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'All Days' },
                { id: 'weekday', label: 'Weekdays' },
                { id: 'weekend', label: 'Weekends' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onDayTypeChange(opt.id)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    dayType === opt.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Type Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Driver Cohort
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'All' },
                { id: 'Registered User', label: 'Registered' },
                { id: 'Guest / Unregistered', label: 'Guest' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUserTypeChange(opt.id)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    userType === opt.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific EVSE Charger Dropdown */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              EVSE Charging Point
            </label>
            <select
              value={selectedStation}
              onChange={(e) => onStationChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All EVSE Units ({filteredStationOptions.length})</option>
              {filteredStationOptions.map((st) => (
                <option key={st.station_id} value={st.station_id}>
                  {st.station_id} ({st.site_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
