'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import {
    ChevronLeft,
    ShieldCheck,
    Car,
    Activity as ActivityIcon,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Merriweather } from 'next/font/google';

const merriweather = Merriweather({
    subsets: ['latin'],
    weight: ['300', '400', '700', '900'],
    style: ['normal', 'italic'],
});

type Report = {
    id: string;
    media_url: string;
    violation_type: string;
    plate_number: string | null;
    status: string;
    created_at: string;
    metadata: any;
};

export default function ActivityPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyReports();
    }, []);

    const fetchMyReports = async () => {
        try {
            const citizen_id = localStorage.getItem('citizen_id');
            if (!citizen_id) {
                setLoading(false);
                return; // No citizen id, so they haven't submitted anything yet on this device
            }

            // Fetch all reports, we will filter by metadata->>citizen_id = citizen_id locally 
            // since Supabase raw querying jsonb with text can be tricky depending on setup
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter locally for simplicity (find reports where metadata.citizen_id matches)
            const myReports = (data || []).filter(r => {
                let meta = r.metadata;
                if (typeof meta === 'string') {
                    try { meta = JSON.parse(meta); } catch (e) { }
                }
                return meta && meta.citizen_id === citizen_id;
            });

            setReports(myReports);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'approved':
            case 'sent_to_police':
                return <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase tracking-widest rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm"><CheckCircle2 className="w-4 h-4" /> Approved</div>;
            case 'rejected':
                return <div className="px-3 py-1.5 bg-red-50 text-red-700 font-extrabold text-[10px] uppercase tracking-widest rounded-full border border-red-200 flex items-center gap-1.5 shadow-sm"><XCircle className="w-4 h-4" /> Rejected</div>;
            default:
                return <div className="px-3 py-1.5 bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase tracking-widest rounded-full border border-amber-200 flex items-center gap-1.5 shadow-sm"><Clock className="w-4 h-4" /> Processing</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
            {/* Top Nav */}
            <nav className="sticky top-0 w-full z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors text-sm font-semibold bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-full">
                        <ChevronLeft className="w-4 h-4" /> Back Home
                    </Link>
                    <div className="flex items-center gap-2 text-[#0a192f]">
                        <ActivityIcon className="w-5 h-5 text-blue-500" />
                        <span className={`font-extrabold tracking-tight text-xl ${merriweather.className}`}>Recent Activity</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 pt-12">
                <div className="mb-12 text-center">
                    <h1 className={`text-4xl md:text-5xl text-[#0a192f] mb-4 leading-[1.2] tracking-tight ${merriweather.className}`}>My Reported Cases</h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Track the ongoing status of your submitted traffic violations.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-blue-900 font-bold">
                        <ActivityIcon className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        Loading your cases...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 rounded-3xl bg-white shadow-sm max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <ShieldCheck className="w-10 h-10 text-blue-600" />
                        </div>
                        <p className="text-xl font-bold text-[#0a192f] mb-2">No cases found</p>
                        <p className="text-gray-500 font-medium">Submit a report to see its status here.</p>
                        <Link href="/report" className="mt-8 px-8 py-4 bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-700/20 hover:scale-[1.02] hover:bg-blue-800 transition-all flex items-center gap-2 border-2 border-transparent hover:border-blue-400">
                            Report a Violation
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="flex flex-col sm:flex-row bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
                            >
                                {/* Image Section */}
                                <div className="relative aspect-video sm:w-[40%] sm:aspect-auto bg-gray-100 border-b sm:border-b-0 sm:border-r border-gray-200">
                                    {(report.media_url?.includes('.mp4') || report.media_url?.includes('.mov')) ? (
                                        <video src={report.media_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={report.media_url || '/placeholder.jpg'} alt="Evidence" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                {/* Info Section */}
                                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between flex-wrap gap-4">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Detected Violation</p>
                                                <h3 className={`text-2xl font-bold text-[#0a192f] leading-tight ${merriweather.className}`}>{report.violation_type}</h3>
                                            </div>
                                            <div className="mt-1">
                                                {getStatusDisplay(report.status)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-6 mt-4 border-t border-gray-100 w-full">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                                                <Car className="w-4 h-4 text-blue-600" />
                                                <span className="font-mono tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-900 font-bold">
                                                    {report.plate_number ? report.plate_number : 'PENDING'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium ml-auto">
                                                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
