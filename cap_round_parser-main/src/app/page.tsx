'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowRight, ShieldCheck, CheckCircle2, Loader2, Sparkles, Building2, Users, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@scholaris.edu');
  const [password, setPassword] = useState('Admin@Scholaris2025');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#14181F] font-sans flex flex-col justify-between selection:bg-[#2F5EFF] selection:text-white">
      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left 55% Editorial Hero & Product Preview */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E7E9EC] bg-white/50 backdrop-blur-xs">
          {/* Header Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#2F5EFF] flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#14181F]">Scholaris</span>
              <span className="ml-2 text-[10.5px] font-semibold text-[#2F5EFF] bg-[#2F5EFF]/10 px-2 py-0.5 rounded-full">
                Phase 1 ERP
              </span>
            </div>
          </div>

          {/* Hero Headline */}
          <div className="my-8 sm:my-12 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2F5EFF]/10 text-[#2F5EFF] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CAP Allotment Ingestion & Seat Analytics</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#14181F] leading-[1.15]">
              Run your college admissions from one place.
            </h1>

            <p className="text-base text-[#5B6270] font-normal leading-relaxed">
              Transform dense State CET provisional allotment PDFs into clear, queryable seat fill analytics, department matrices, and candidate audit logs in seconds.
            </p>
          </div>

          {/* Static Dashboard Mock Preview Frame */}
          <div className="relative rounded-2xl bg-white border border-[#D8DBE0] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-4 max-w-xl">
            <div className="flex items-center justify-between border-b border-[#E7E9EC] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-semibold text-[#5B6270] font-mono">scholaris.edu/dashboard</span>
              </div>
              <span className="text-[11px] font-semibold text-[#1C9A6C] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                CAP Round II Verified
              </span>
            </div>

            {/* Stat Cards Mock Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E7E9EC]">
                <p className="text-[10px] font-semibold text-[#5B6270] uppercase">Sanction Intake</p>
                <p className="text-xl font-bold text-[#14181F] font-mono mt-0.5">441</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase">Filled Seats</p>
                <p className="text-xl font-bold text-[#1C9A6C] font-mono mt-0.5">426 (96.6%)</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <p className="text-[10px] font-semibold text-amber-800 uppercase">Vacant Seats</p>
                <p className="text-xl font-bold text-[#E0A72E] font-mono mt-0.5">15</p>
              </div>
            </div>

            {/* Department Summary Line Mock */}
            <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E7E9EC] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2F5EFF]" />
                <span className="font-semibold text-[#14181F]">Computer Engineering</span>
              </div>
              <span className="text-[#1C9A6C] font-bold">144 / 144 Seats (100% Full)</span>
            </div>
          </div>

          <div className="pt-6 text-xs text-[#8A909C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1C9A6C]" />
            <span>Automatic line-based parsing with row reconciliation check</span>
          </div>
        </div>

        {/* Right 45% Sign In Form */}
        <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#F7F8FA]">
          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[#14181F]">Admin Sign In</h2>
              <p className="text-xs text-[#5B6270]">
                Sign in with seeded administrator credentials to manage CAP uploads and view seat analytics.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14181F]">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@scholaris.edu"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D8DBE0] text-sm text-[#14181F] placeholder:text-[#8A909C] focus:outline-none focus:border-[#2F5EFF] focus:ring-1 focus:ring-[#2F5EFF] transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14181F]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D8DBE0] text-sm text-[#14181F] placeholder:text-[#8A909C] focus:outline-none focus:border-[#2F5EFF] focus:ring-1 focus:ring-[#2F5EFF] transition-all shadow-2xs"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-[#D64545]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#2F5EFF] hover:bg-[#2449D6] rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#E7E9EC] text-center space-y-2">
              <p className="text-[11.5px] text-[#8A909C]">
                Demo Admin Credentials: <code className="bg-white border border-[#E7E9EC] px-1.5 py-0.5 rounded text-[#14181F] font-mono">admin@scholaris.edu</code>
              </p>
              <p className="text-[11px] text-[#8A909C]">
                Internal College Administration Software • Phase 1
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
