import React from 'react';
import { Lightbulb, CheckCircle2, TrendingUp, AlertOctagon, Users, Clock } from 'lucide-react';

export const BusinessInsights: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Data Analyst Business Findings & Strategic Takeaways
          </h3>
          <p className="text-xs text-slate-400">
            Calculated from 27,870 genuine Caltech & JPL charging sessions (2019)
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Insight 1 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-2">
              <Clock className="w-4 h-4" />
              The "Dwell Time Paradox" (43.9% Idle Stall Waste)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              While average vehicle connection duration is <strong className="text-white">6.70 hours</strong>, active charging draws power for only <strong className="text-white">3.69 hours</strong>. Vehicles remain plugged in for <strong className="text-rose-400">2.94 idle hours</strong> after full charge, wasting over 81,000 cumulative stall-hours per year.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
            <strong>Analyst Action:</strong> Implement idle dwell fees or automated valet/cable-sharing notifications 30 min after charging completes.
          </div>
        </div>

        {/* Insight 2 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
              <TrendingUp className="w-4 h-4" />
              Morning Commuter Influx Concentration (07:00–09:00 AM)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Charging arrivals are heavily frontloaded: <strong className="text-white">07:00 AM is the single peak hour</strong> accounting for <strong className="text-amber-400">6,009 sessions (21.6%)</strong>. Together, 07:00–09:00 AM captures over 41% of all daily charging starts.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
            <strong>Analyst Action:</strong> Introduce dynamic load management (pilot current curtailment) during 07:00–09:00 to reduce transformer peak demand charges.
          </div>
        </div>

        {/* Insight 3 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-2">
              <AlertOctagon className="w-4 h-4" />
              Severe Weekday vs. Weekend Asymmetry (-88% Drop)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Midweek demand peaks on <strong className="text-white">Wednesday (5,595 sessions)</strong> and Thursday (5,411 sessions). In contrast, weekend demand drops by <strong className="text-indigo-400">88%</strong> (Sunday records only 446 sessions), characteristic of workplace commuter infrastructure.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
            <strong>Analyst Action:</strong> Schedule scheduled hardware maintenance and electrical inspections on Saturdays/Sundays to minimize driver disruption.
          </div>
        </div>

        {/* Insight 4 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Site Workload Specialization (JPL vs. Caltech)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              NASA JPL accounts for <strong className="text-cyan-400">72.7% of total energy (251,826 kWh)</strong> across 17,273 sessions with strict 8-hour shift alignment (avg 7.16h dwell), while Caltech operates as an academic hub with higher turnover (avg 5.94h dwell).
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
            <strong>Analyst Action:</strong> JPL needs higher charger density per worker, while Caltech benefits from shorter parking space turnover incentives.
          </div>
        </div>

        {/* Insight 5 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-2">
              <Users className="w-4 h-4" />
              Power User Loyalty (Top 15% Drive 52% of Load)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Of 628 registered mobile app users, the top cohort charging 50+ times per year represents just <strong className="text-white">15.2% of drivers</strong>, yet consumes <strong className="text-emerald-400">52.4% of total energy</strong> with predictable daily schedules.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
            <strong>Analyst Action:</strong> Create dedicated charging reservations or subscription tiers for high-frequency daily commuter drivers.
          </div>
        </div>

        {/* Insight 6 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-2">
              <AlertOctagon className="w-4 h-4" />
              EVSE Capacity Bottlenecks (55 Units at High Risk)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our rule-based capacity model identifies that <strong className="text-rose-400">55 of 106 physical EVSEs</strong> exceed 50% peak-hour occupancy (led by EVSE 1-1-178-823 at 42% 24/7 occupancy), while bottom quartile chargers sit below 15% utilization.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
            <strong>Analyst Action:</strong> Reallocate parking garage stalls and directional signage to balance incoming traffic toward underutilized EVSE banks.
          </div>
        </div>
      </div>
    </div>
  );
};
