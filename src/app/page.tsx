import Link from 'next/link';
import { Camera, Shield, User, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { Merriweather } from 'next/font/google';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
});

export default function Home() {
  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col text-gray-900 ${merriweather.className} selection:bg-blue-100`}>

      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] aspect-square bg-blue-100/50 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] aspect-square bg-emerald-50/50 blur-[120px] rounded-full" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-12">

          {/* Brand Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 mb-2">
              <ShieldCheck className="w-10 h-10 text-blue-700" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#0a192f]">
              Sentinel <span className="text-blue-700 italic">AI</span>
            </h1>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest px-4">
              Official Traffic Enforcement Platform
            </p>
          </div>

          {/* Role Selection Grid */}
          <div className="grid grid-cols-1 gap-6 pt-4">

            {/* Citizen Role */}
            <Link
              href="/report"
              className="group relative flex flex-col p-8 bg-white border border-gray-100 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-2 overflow-hidden active:scale-95"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0 translate-x-12 -translate-y-12 group-hover:bg-blue-100 transition-colors" />
              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0a192f] group-hover:text-blue-900 transition-colors">Citizen Sentinel</h3>
                  <p className="text-gray-500 text-sm font-medium mt-1">Report violations and make roads safer.</p>
                </div>
                <div className="flex items-center gap-2 text-blue-700 text-sm font-black uppercase tracking-widest pt-2">
                  Launch Reporter <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Officer Role */}
            <Link
              href="/dashboard"
              className="group relative flex flex-col p-8 bg-[#0a192f] text-white rounded-[32px] shadow-[0_30px_60px_rgba(10,25,47,0.25)] hover:shadow-[0_30px_60px_rgba(10,25,47,0.4)] transition-all hover:-translate-y-2 overflow-hidden active:scale-95"
            >
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-[100px] -z-0 translate-x-8 translate-y-8 group-hover:bg-white/10 transition-colors" />
              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Officer Portal</h3>
                  <p className="text-blue-200/60 text-sm font-medium mt-1">Verify cases and issue legal challans.</p>
                </div>
                <div className="flex items-center gap-2 text-blue-400 text-sm font-black uppercase tracking-widest pt-2">
                  Access Dashboard <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

          </div>

          {/* Secondary Actions */}
          <div className="flex justify-center pt-8">
            <Link href="/activity" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-emerald-50 text-gray-400 hover:text-emerald-700 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest active:scale-95">
              <Activity className="w-4 h-4" />
              Track Existing Report
            </Link>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-8 text-center px-6">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
          Authority: Delhi Traffic Police Initiative
        </p>
      </footer>
    </div>
  );
}
