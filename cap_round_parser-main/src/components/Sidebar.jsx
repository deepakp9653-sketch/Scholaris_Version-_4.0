import React from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Building2, 
  FolderOpen, 
  FileUp, 
  CheckCircle2, 
  ChevronRight,
  Database,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, metadata, onOpenUploader }) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'High-level institutional snapshot'
    },
    {
      id: 'candidates',
      label: 'Candidate List',
      icon: Users,
      description: 'Search & audit candidate records'
    },
    {
      id: 'departments',
      label: 'Department Matrix',
      icon: Building2,
      description: 'Choice code deep-dive analytics'
    },
    {
      id: 'data',
      label: 'Data & Upload',
      icon: FolderOpen,
      description: 'Manage PDF files & schema'
    }
  ];

  return (
    <aside className="w-64 bg-black/90 backdrop-blur-2xl border-r border-zinc-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 select-none shadow-2xl">
      {/* Top Branding Header */}
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-white/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative h-10 w-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight text-white font-sans">
                Scholaris
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black bg-white rounded-md">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">CAP Seat Allotment Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
              Navigation
            </p>
            <Sparkles className="w-3 h-3 text-zinc-400" />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-white text-black shadow-lg shadow-white/10 border border-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                }`}
              >
                {/* Left Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-black rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-black' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-90 text-black" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Context */}
      <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-950/80 backdrop-blur-md">
        {metadata ? (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-300" /> Dataset Status:
              </span>
              <span className="text-white font-bold flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 text-[10px]">
                <CheckCircle2 className="w-3 h-3 text-white" /> Loaded
              </span>
            </div>

            <p className="text-xs font-bold text-white truncate" title={metadata.institution_code_name}>
              {metadata.institution_code_name.split('-')[0]}
            </p>

            <div className="text-[10.5px] text-zinc-400 flex items-center justify-between font-mono pt-1.5 border-t border-zinc-800">
              <span>{metadata.total_departments} Choice Codes</span>
              <span>{metadata.total_candidate_records} Records</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
            <p className="text-xs font-semibold text-zinc-400">No Dataset Active</p>
            <p className="text-[10.5px] text-zinc-500">Upload PDF to populate</p>
          </div>
        )}

        <button
          onClick={onOpenUploader}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-xl transition-all shadow-lg active:scale-95 border border-white"
        >
          <FileUp className="w-4 h-4 text-black" />
          <span>Upload PDF Document</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

