'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronRight, Share2, Info, ArrowLeft } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const reportId = searchParams.get('id');

    return (
        <div className="max-w-xl mx-auto text-center space-y-12 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
            <div className="space-y-6">
                <div className="relative inline-flex">
                    <div className="absolute inset-0 bg-emerald-400 blur-[60px] opacity-40 animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-14 h-14 text-emerald-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#0a192f]">Report Submitted</h1>
                    <p className="text-gray-500 font-medium leading-relaxed">Thank you for contributing to road safety. Your report has been securely logged and sent for AI analysis.</p>
                </div>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 blur-3xl -z-10 rounded-full" />
                <div className="space-y-1 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking ID</p>
                    <code className="text-lg font-mono text-blue-700 font-bold bg-white px-3 py-1 rounded border border-gray-200 inline-block shadow-sm break-all">{reportId || 'N/A'}</code>
                </div>
                <div className="h-px bg-gray-200 my-4" />
                <div className="space-y-3 text-left w-fit mx-auto">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        Evidence Securely Hashed
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
                        AI Processing Queued
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center mt-8 gap-4">
                <Link
                    href="/"
                    className="py-4 px-10 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/20 hover:scale-[1.02]"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Return to Safe Driving
                </Link>
                <Link
                    href="/activity"
                    className="py-4 px-8 rounded-full bg-blue-50 text-blue-900 border border-transparent font-bold flex items-center justify-center gap-3 hover:bg-blue-100 transition-all font-semibold"
                >
                    Track Status
                </Link>
            </div>

            <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto">
                Report updates will be visible on your dashboard once AI analysis is complete.
            </p>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-4 py-12">
            <Suspense fallback={<div className="font-bold text-blue-900 animate-pulse">Processing success...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
