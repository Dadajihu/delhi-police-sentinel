'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, ChevronRight, AlertCircle, CheckCircle2, ChevronLeft, Car, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/api';

const VIOLATIONS = [
    { id: 'helmet', label: 'No Helmet', icon: '⛑️' },
    { id: 'signal', label: 'Signal Jumping', icon: '🚦' },
    { id: 'wrong-side', label: 'Wrong Side Driving', icon: '↔️' },
    { id: 'zebra', label: 'Zebra Crossing Violation', icon: '🦓' },
    { id: 'parking', label: 'Illegal Parking', icon: '🅿️' },
    { id: 'other', label: 'Other Violation', icon: '⚠️' },
];

function ViolationSelectionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reportId = searchParams.get('id');

    const [selected, setSelected] = useState<string | null>(null);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!reportId) {
            router.push('/report');
        }
    }, [reportId, router]);

    const handleFinalize = async () => {
        if (!selected || !reportId) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Fetch the report to get the media URL and metadata
            const { data: reportData, error: fetchError } = await supabase
                .from('reports')
                .select('media_url, metadata')
                .eq('id', reportId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Call our AI Orchestrator API
            const aiResponse = await fetch(getApiUrl('/api/analyze'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_id: reportId,
                    media_url: reportData.media_url,
                    user_comment: comment
                }),
            });

            const responseText = await aiResponse.text();
            let aiData;
            try {
                aiData = JSON.parse(responseText);
            } catch (e) {
                console.error('Non-JSON response:', responseText);
                throw new Error('API unreachable on mobile. If testing locally, set NEXT_PUBLIC_API_BASE_URL to your computer\'s IP address (e.g., http://192.168.1.5:3000).');
            }

            if (!aiResponse.ok) {
                throw new Error(aiData.error || 'AI Analysis failed');
            }

            const { analysis } = aiData;

            // Append comment to metadata
            let existingMetadata = reportData.metadata;
            if (typeof existingMetadata === 'string') {
                try { existingMetadata = JSON.parse(existingMetadata); } catch (e) { }
            }
            existingMetadata = existingMetadata || {};
            if (comment) {
                existingMetadata.user_comment = comment;
            }

            // 3. Update Supabase with user selection AND AI results
            const { error: updateError } = await supabase
                .from('reports')
                .update({
                    violation_type: VIOLATIONS.find(v => v.id === selected)?.label || selected,
                    status: 'ai_processed',
                    authenticity_score: analysis.authenticity_score,
                    plate_number: analysis.plate_number,
                    extracted_data: analysis.extracted_data,
                    validity_score: analysis.validity_score,
                    priority_score: analysis.priority_score,
                    metadata: existingMetadata,
                    ai_explanation: analysis.ai_explanation || 'AI verification complete based on visual evidence and system parameters.'
                })
                .eq('id', reportId);

            if (updateError) throw updateError;

            router.push(`/report/success?id=${reportId}`);
        } catch (err: any) {
            console.error('Finalization error:', err);
            setError(err.message || 'Failed to finalize report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="safe-pt-24 safe-pb-12 px-4 sm:px-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Step Indicator */}
                <div className="flex items-center gap-4 text-sm font-medium text-neutral-500">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                        </span>
                        Evidence
                    </div>
                    <div className="w-8 h-px bg-emerald-500/30" />
                    <div className="flex items-center gap-2 text-blue-500">
                        <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs">2</span>
                        Details
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight">Select Violation</h1>
                    <p className="text-neutral-400">Identify the type of violation captured in your evidence. AI will cross-verify this during processing.</p>
                </div>

                {/* Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {VIOLATIONS.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setSelected(v.id)}
                            className={cn(
                                "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border text-left transition-all duration-300 flex items-center gap-3 sm:gap-4",
                                selected === v.id
                                    ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                    : "bg-neutral-900/50 border-white/5 hover:border-white/20"
                            )}
                        >
                            <span className="text-3xl sm:text-4xl">{v.icon}</span>
                            <div>
                                <p className="font-bold text-base sm:text-lg">{v.label}</p>
                                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5 sm:mt-1">Status: Ready</p>
                            </div>
                            {selected === v.id && <div className="ml-auto w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-black" /></div>}
                        </button>
                    ))}
                </div>

                {/* Comment Field */}
                <div className="space-y-3">
                    <label className="font-bold text-lg block">Additional Details (Optional)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Provide context (e.g. 'signal jumping', 'no helmet'). Helps our AI and Police verify."
                        className="w-full h-32 p-4 rounded-2xl bg-neutral-900 border border-white/5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none transition-all placeholder:text-neutral-600 placeholder:text-xs text-xs leading-tight"
                    />
                </div>

                {/* Note */}
                <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 flex gap-4">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-sm text-neutral-400 leading-relaxed">Your report will be automatically ranked based on the severity of the violation and the clarity of the evidence provided.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleFinalize}
                    disabled={!selected || isSubmitting}
                    className={cn(
                        "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2",
                        selected && !isSubmitting
                            ? "bg-white text-black hover:scale-[1.02] active:scale-[0.98]"
                            : "bg-neutral-900 text-neutral-500 cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? 'Finalizing...' : 'Submit Violation Report'}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </main>
    );
}

export default function SelectionPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30">
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl safe-top">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <span className="font-semibold text-lg">Select Violation</span>
                </div>
            </header>

            <Suspense fallback={<div className="pt-24 text-center">Loading selection...</div>}>
                <ViolationSelectionContent />
            </Suspense>
        </div>
    );
}
