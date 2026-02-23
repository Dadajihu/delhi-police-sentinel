'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import {
    ShieldCheck,
    ChevronLeft,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    BrainCircuit,
    Car,
    FileText,
    MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Merriweather } from 'next/font/google';

const merriweather = Merriweather({
    subsets: ['latin'],
    weight: ['300', '400', '700', '900'],
    style: ['normal', 'italic'],
});

function ReviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const id = searchParams.get('id');

    useEffect(() => {
        if (id) fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', id as string)
                .single();

            if (error) throw error;
            setReport(data);
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: 'approved' | 'rejected') => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('reports')
                .update({
                    status,
                    reviewed_by: 'officer_101', // Mock officer ID
                })
                .eq('id', report.id);

            if (error) throw error;

            // Update local state or redirect
            setReport({ ...report, status });
        } catch (err) {
            console.error('Action error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-blue-900 font-bold">Loading intelligence...</div>;
    if (!report) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-bold">Report not found.</div>;

    const metadata = typeof report.metadata === 'string' ? JSON.parse(report.metadata) : report.metadata;
    const isVideo = report.media_url?.includes('.mp4') || report.media_url?.includes('.mov');

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans selection:bg-blue-100">
            {/* Officer Nav Header */}
            <nav className="sticky top-0 w-full z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm safe-top">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-xs font-bold bg-gray-100/50 hover:bg-blue-50 px-3 py-2 rounded-full"
                    >
                        <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline">Back to Queue</span><span className="sm:hidden">Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="font-bold tracking-tight text-lg sm:text-xl font-mono text-gray-400">CASE // {report.id.split('-')[0].toUpperCase()}</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 safe-bottom">
                {/* Left Column: Evidence Base */}
                <div className="space-y-6">
                    <div className="relative aspect-video bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                        {isVideo ? (
                            <video src={report.media_url} controls className="w-full h-full object-contain bg-black" />
                        ) : (
                            <img src={report.media_url} alt="Evidence" className="w-full h-full object-contain bg-gray-100" />
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-sm border border-gray-200 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                                <MapPin className="w-3 h-3 text-blue-600" /> GPS Intel
                            </div>
                            {metadata?.gps ? (
                                <a
                                    href={`https://www.google.com/maps?q=${metadata.gps.lat},${metadata.gps.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-sm text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-200 hover:decoration-blue-400 transition-colors block"
                                    title="Open in Google Maps"
                                >
                                    {metadata.gps.lat.toFixed(6)}, {metadata.gps.lng.toFixed(6)}
                                </a>
                            ) : (
                                <p className="font-bold text-sm text-gray-400">UNKNOWN</p>
                            )}
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-sm border border-gray-200 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                                <Clock className="w-3 h-3 text-emerald-600" /> Timestamp
                            </div>
                            <p className="font-bold text-[#0a192f] text-sm">
                                {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleString() : 'UNKNOWN'}
                            </p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Hash Integrity
                        </div>
                        <code className="text-xs text-gray-500 break-all font-mono bg-gray-50 p-2 rounded block">{report.evidence_hash || 'PENDING CALCULATION'}</code>
                    </div>
                </div>

                {/* Right Column: AI Analysis & Actions */}
                <div className="space-y-6 flex flex-col">
                    {/* Status Banner */}
                    <div className={cn(
                        "p-6 rounded-3xl border flex items-center justify-between shadow-sm",
                        report.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            report.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                'bg-amber-50 border-amber-200 text-amber-700'
                    )}>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Current Status</p>
                            <h2 className={`text-2xl font-black uppercase tracking-tight ${merriweather.className}`}>
                                {report.status.replace('_', ' ')}
                            </h2>
                        </div>
                        {report.status === 'approved' && <CheckCircle2 className="w-10 h-10" />}
                        {report.status === 'rejected' && <XCircle className="w-10 h-10" />}
                    </div>

                    <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-3xl flex-1 space-y-8">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-700 shadow-inner">
                                <BrainCircuit className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div>
                                <h3 className={`font-extrabold text-xl sm:text-2xl text-[#0a192f] ${merriweather.className}`}>AI Intelligence Report</h3>
                                <p className="text-xs sm:text-sm text-gray-500 font-bold">Confidence: <span className="text-blue-600">{report.validity_score !== null && report.validity_score !== undefined ? `${Math.round(report.validity_score * 100)}%` : 'CALCULATING'}</span></p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identified Vehicle</p>
                                <div className="flex items-center gap-3">
                                    <Car className="w-5 h-5 text-gray-400" />
                                    <div className="px-5 py-2.5 bg-yellow-100 text-[#0a192f] font-black font-mono text-xl rounded-xl tracking-widest border-2 border-yellow-400 shadow-[2px_2px_0px_rgba(250,204,21,1)] w-fit">
                                        {report.plate_number || 'NOT DETECTED'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Violation Facts</p>
                                <div className="bg-gray-50 p-5 rounded-2xl font-mono text-sm space-y-3 border border-gray-200 shadow-inner">
                                    <div className="flex justify-between border-b border-gray-200 pb-3 text-gray-500">
                                        <span className="font-bold">TYPE</span>
                                        <span className="text-[#0a192f] font-black">{report.violation_type}</span>
                                    </div>
                                    <div className="flex justify-between pb-1 text-gray-500">
                                        <span className="font-bold">GEMINI SCORE</span>
                                        <span className="text-blue-700 font-bold">
                                            {report.validity_score !== null && report.validity_score !== undefined ? `${Math.round(report.validity_score * 100)}%` : 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-1 text-gray-500">
                                        <span className="font-bold">AI GENERATED PROBABILITY</span>
                                        <span className={cn(
                                            "font-bold",
                                            report.authenticity_score !== null ? (1 - report.authenticity_score < 0.2 ? "text-emerald-600" : "text-red-600") : "text-amber-600"
                                        )}>
                                            {report.authenticity_score !== null ? `${Math.round((1 - report.authenticity_score) * 100)}%` : 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {metadata?.user_comment && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reporter's Context</p>
                                    <div className="p-5 bg-gray-50 border border-gray-100 text-[#0a192f] rounded-2xl text-sm leading-relaxed flex gap-4 shadow-sm font-medium">
                                        <MessageSquare className="w-5 h-5 shrink-0 text-gray-400 mt-0.5" />
                                        <p>"{metadata.user_comment}"</p>
                                    </div>
                                </div>
                            )}

                            {report.ai_explanation && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Reasoning</p>
                                    <div className="p-5 bg-blue-50/50 border border-blue-100 text-[#0a192f] rounded-2xl text-sm leading-relaxed flex gap-4 shadow-sm font-medium">
                                        <BrainCircuit className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                                        <div
                                            className="prose prose-sm max-w-none text-[#0a192f] whitespace-pre-line"
                                            dangerouslySetInnerHTML={{
                                                __html: report.ai_explanation
                                                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                                    .replace(/\n/g, '<br/>')
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {['submitted', 'ai_processed', 'pending_review'].includes(report.status) && (
                            <div className="pt-8 grid grid-cols-2 gap-4 mt-auto">
                                <button
                                    onClick={() => handleAction('rejected')}
                                    disabled={actionLoading}
                                    className="py-4 rounded-full bg-red-50 text-red-700 hover:bg-red-100 font-bold transition-all flex justify-center items-center gap-2 text-sm"
                                >
                                    <XCircle className="w-5 h-5" /> REJECT
                                </button>
                                <button
                                    onClick={() => handleAction('approved')}
                                    disabled={actionLoading}
                                    className="py-4 rounded-full bg-blue-700 text-white hover:bg-blue-800 font-bold shadow-lg shadow-blue-700/20 transition-all flex justify-center items-center gap-2 hover:scale-[1.02] text-sm"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> APPROVE & ISSUE
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-blue-900 font-bold">Initializing review...</div>}>
            <ReviewContent />
        </Suspense>
    );
}
