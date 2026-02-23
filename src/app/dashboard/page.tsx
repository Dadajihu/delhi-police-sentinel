'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import {
    ShieldCheck,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    ChevronLeft,
    Filter,
    Search,
    Activity
} from 'lucide-react';
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
    validity_score: number | null;
    priority_score: number | null;
    created_at: string;
};

export default function DashboardPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending_review, approved, rejected

    // Fetch Reports
    useEffect(() => {
        fetchReports();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                (payload) => {
                    console.log('Real-time update:', payload);
                    fetchReports(); // Refresh on changes
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('priority_score', { ascending: false, nullsFirst: false });

            if (error) throw error;
            setReports(data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'all') return r.status !== 'rejected';
        if (filter === 'pending_review') return ['submitted', 'ai_processed', 'pending_review'].includes(r.status);
        if (filter === 'rejected') return r.status === 'rejected';
        return r.status === filter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
            case 'sent_to_police':
                return <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase flex items-center gap-1.5 shadow-sm w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
            case 'rejected':
                return <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase flex items-center gap-1.5 shadow-sm w-fit"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
            default:
                return <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase flex items-center gap-1.5 shadow-sm w-fit"><Clock className="w-3.5 h-3.5" /> Pending Review</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
            {/* Officer Nav */}
            <nav className="sticky top-0 w-full z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm safe-top">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200 shadow-inner">
                            <ShieldCheck className="w-6 h-6 text-blue-700" />
                        </div>
                        <span className={`font-extrabold tracking-tight text-xl text-[#0a192f] ${merriweather.className}`}>
                            Officer <span className="italic text-blue-700 hidden sm:inline">Dashboard</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            System Online
                        </div>
                        <Link href="/" className="text-xs transition-all font-bold text-gray-400 hover:text-blue-900 bg-gray-100 hover:bg-blue-50 px-4 py-2 rounded-full flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Home</span>
                            <span className="sm:hidden">Back</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-10 safe-bottom">
                {/* Header Setup */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className={`text-4xl md:text-5xl text-[#0a192f] mb-4 leading-[1.2] tracking-tight ${merriweather.className}`}>Priority Queue</h1>
                        <p className="text-lg text-gray-500 font-medium">Review and action AI-processed citizen reports.</p>
                    </div>

                    <div className="flex overflow-x-auto items-center gap-2 h-fit mt-4 md:mt-0 pb-2 md:pb-0 scrollbar-hide">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-colors shrink-0 ${filter === 'all' ? 'bg-blue-50 text-blue-900' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            All Reports
                        </button>
                        <button
                            onClick={() => setFilter('pending_review')}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-colors shrink-0 ${filter === 'pending_review' ? 'bg-blue-50 text-blue-900' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            Needs Review
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-colors shrink-0 ${filter === 'approved' ? 'bg-blue-50 text-blue-900' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            Approved
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-colors shrink-0 ${filter === 'rejected' ? 'bg-blue-50 text-blue-900' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            Rejected
                        </button>
                    </div>
                </div>

                {/* List View */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-blue-900 font-bold">
                        <Activity className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        Loading intelligence queue...
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 rounded-3xl bg-white shadow-sm max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <ShieldCheck className="w-10 h-10 text-blue-600" />
                        </div>
                        <p className="text-xl font-bold text-[#0a192f] mb-2">No reports found in queue.</p>
                        <p className="text-sm font-medium text-gray-500">Queue is clean.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReports.map((report) => (
                            <Link
                                href={`/dashboard/review?id=${report.id}`}
                                key={report.id}
                                className="group flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 block"
                            >
                                {/* Media Preview / Skeleton */}
                                <div className="relative aspect-video bg-gray-100 overflow-hidden border-b border-gray-200">
                                    {(report.media_url?.includes('.mp4') || report.media_url?.includes('.mov')) ? (
                                        <video src={report.media_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <img src={report.media_url || '/placeholder.jpg'} alt="Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    )}

                                    {/* Overlay Badges */}
                                    <div className="absolute top-3 left-3">
                                        {getStatusBadge(report.status)}
                                    </div>
                                    {report.validity_score && (
                                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur text-blue-900 text-[10px] font-mono font-extrabold rounded-lg border border-gray-200 shadow-sm">
                                            AI Score: {Math.round(report.validity_score * 100)}%
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center justify-between mb-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                        <span className={`text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full truncate ${merriweather.className} font-bold text-xs`}>{report.violation_type}</span>
                                        <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="px-4 py-2 bg-gray-50 text-gray-600 font-bold font-mono text-sm rounded-lg tracking-widest truncate border border-gray-100 shadow-sm">
                                            {report.plate_number || 'PENDING AI...'}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex justify-end">
                                        <div className="px-6 py-3 rounded-full bg-blue-50 text-blue-900 font-semibold text-sm transition-all group-hover:bg-blue-100 flex items-center gap-2">
                                            Review Case <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
