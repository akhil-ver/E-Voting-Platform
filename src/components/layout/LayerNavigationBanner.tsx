/**
 * 3-Layer Architecture Workflow & Navigation Banner
 * Provides a clear, high-contrast, interactive roadmap for:
 * Layer 1: Login, Registration, and Voter Management
 * Layer 2: Election Management, Voter Eligibility, and Vote Casting
 * Layer 3: Election Closure, Result Declaration, and Vote Verification
 */
import React from 'react';
import {
  Users,
  Vote,
  BarChart3,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LayerNavigationBannerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  registeredVotersCount?: number;
  votesCastCount?: number;
}

export const LayerNavigationBanner: React.FC<LayerNavigationBannerProps> = ({
  activeTab,
  setActiveTab,
  registeredVotersCount = 500,
  votesCastCount = 0,
}) => {
  const layers = [
    {
      id: 'areas',
      tabKey: 'areas',
      layerNumber: 'LAYER 1',
      title: 'Voter Roll & Identity',
      subtitle: '10 Cities • 500 Records • Single Admin',
      description: 'Sign-up via Election ID + Aadhaar Last 4, duplicate prevention, and city-wise voter lists.',
      icon: Users,
      color: 'cyan',
      activeBorder: 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      inactiveBorder: 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'voter',
      tabKey: 'voter',
      layerNumber: 'LAYER 2',
      title: 'Cast Ballot & Candidates',
      subtitle: 'Area Fencing • Symbols • SHA-256 Hash',
      description: 'Select open election areas, match candidate symbols, cast anonymous vote, and lock double-voting.',
      icon: Vote,
      color: 'emerald',
      activeBorder: 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
      inactiveBorder: 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'results',
      tabKey: 'results',
      layerNumber: 'LAYER 3',
      title: 'Closure, Results & Verification',
      subtitle: 'Admin Closure • Tallies • Counted Status',
      description: 'Admin closes polls area-wise, declares certified tallies, and voters verify receipts ("Counted" vs "Not verified").',
      icon: BarChart3,
      color: 'purple',
      activeBorder: 'border-purple-400 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]',
      inactiveBorder: 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Sovereign E-Voting Simulation Architecture</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                3-Layer Guided Workflow
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Direct Shortcuts:</span>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-500/40 hover:text-amber-300'
            }`}
          >
            <Search className="h-3 w-3" />
            <span>Verify Receipt</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-violet-500/40 hover:text-violet-300'
            }`}
          >
            <Lock className="h-3 w-3" />
            <span>Admin Hub</span>
          </button>
        </div>
      </div>

      {/* 3 Interactive Layer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isSelected =
            activeTab === layer.tabKey ||
            (layer.id === 'results' && activeTab === 'verify');
          return (
            <div
              key={layer.id}
              onClick={() => setActiveTab(layer.tabKey)}
              className={`rounded-2xl border p-4.5 transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                isSelected ? layer.activeBorder : layer.inactiveBorder
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase border ${layer.badgeColor}`}
                  >
                    {layer.layerNumber}
                  </span>
                  <div
                    className={`h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center ${layer.iconColor} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="text-sm font-black text-white mt-2.5 flex items-center justify-between">
                  <span>{layer.title}</span>
                  <ArrowRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      isSelected
                        ? `${layer.iconColor} translate-x-0.5`
                        : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1'
                    }`}
                  />
                </h3>

                <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                  {layer.subtitle}
                </p>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">
                  {layer.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="font-mono text-slate-400">
                  {layer.id === 'areas' && `500 Eligible Records Across 10 Cities`}
                  {layer.id === 'voter' && `Live Aadhaar Gate & Official Symbols`}
                  {layer.id === 'results' && `Certified Tally & "Counted" Receipts`}
                </span>
                <span
                  className={`font-bold uppercase ${
                    isSelected ? layer.iconColor : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {isSelected ? '● Active View' : 'Explore →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
