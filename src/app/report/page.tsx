'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, MapPin, Clock, Shield, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function ReportPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [timestamp, setTimestamp] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Try to get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    setError('Location access denied. Metadata will be incomplete.');
                }
            );
        }

        const interval = setInterval(() => {
            setTimestamp(prev => file ? prev : new Date().toISOString());
        }, 1000);

        return () => clearInterval(interval);
    }, [file]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);

            try {
                const { generateFileHash } = await import('@/lib/hash');
                const hash = await generateFileHash(selectedFile);
                setEvidenceHash(hash);
            } catch (err) {
                console.error('Hashing error:', err);
            }
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please provide evidence (image or video).');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `evidence/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('reports')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('reports')
                .getPublicUrl(filePath);

            let citizen_id = localStorage.getItem('citizen_id');
            if (!citizen_id) {
                citizen_id = `citizen_${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem('citizen_id', citizen_id);
            }

            // 2. Insert into Database
            const { data: reportData, error: dbError } = await supabase.from('reports').insert({
                media_url: publicUrl,
                violation_type: 'Pending Selection',
                status: 'submitted',
                evidence_hash: evidenceHash,
                metadata: {
                    gps: location,
                    timestamp: timestamp,
                    device: navigator.userAgent,
                    citizen_id: citizen_id,
                },
            }).select().single();

            if (dbError) throw dbError;

            // 3. Navigate to next step
            router.push(`/report/select?id=${reportData.id}`);
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="fixed top-0 w-full z-50 border-b border-gray-200 bg-white shadow-sm safe-top">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-blue-900">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-[#0a192f] tracking-tight">Report Violation</span>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="safe-pt-24 safe-pb-12 px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Step Indicator */}
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                        <div className="flex items-center gap-2 text-blue-700 font-bold">
                            <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs text-blue-700 shadow-sm">1</span>
                            Evidence
                        </div>
                        <div className="w-8 h-px bg-gray-300" />
                        <div className="flex items-center gap-2 font-semibold">
                            <span className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs text-gray-500">2</span>
                            Details
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#0a192f]">Upload Evidence</h1>
                        <p className="text-gray-500 leading-relaxed font-medium">Please provide a clear photo or video of the traffic violation. Clear views of number plates help AI analysis.</p>
                    </div>

                    {/* Upload Area */}
                    <div
                        className={cn(
                            "relative min-h-[300px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 bg-white",
                            preview ? "border-transparent" : "border-gray-300",
                            error ? "border-red-400 bg-red-50" : ""
                        )}
                    >
                        {preview ? (
                            <div className="w-full h-full relative aspect-video overflow-hidden rounded-3xl">
                                {file?.type.startsWith('video') ? (
                                    <video src={preview} className="w-full h-full object-cover" controls playsInline />
                                ) : (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                                        className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-2 text-red-600 font-bold text-sm shadow-sm"
                                    >
                                        <X className="w-4 h-4" /> Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 w-full p-6">
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => document.getElementById('cameraInput')?.click()}
                                        className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-colors gap-2 shadow-sm"
                                    >
                                        <Camera className="w-8 h-8 text-blue-600" />
                                        <div className="text-center">
                                            <p className="font-extrabold text-[#0a192f] text-sm">Photo</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => document.getElementById('videoInput')?.click()}
                                        className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-colors gap-2 shadow-sm"
                                    >
                                        <div className="relative">
                                            <Camera className="w-8 h-8 text-red-600" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse border-2 border-white" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-extrabold text-[#0a192f] text-sm">Video</p>
                                        </div>
                                    </button>
                                </div>
                                <button
                                    onClick={() => document.getElementById('galleryInput')?.click()}
                                    className="w-full flex items-center justify-center p-5 bg-blue-700 text-white rounded-2xl hover:bg-blue-800 transition-colors gap-3 shadow-md active:scale-[0.98]"
                                >
                                    <Upload className="w-6 h-6" />
                                    <div className="text-left">
                                        <p className="font-extrabold text-sm">Upload from Gallery</p>
                                        <p className="text-[10px] opacity-70 font-medium">Select existing photo/video</p>
                                    </div>
                                </button>
                            </div>
                        )}
                        <input
                            id="cameraInput"
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />
                        <input
                            id="videoInput"
                            type="file"
                            onChange={handleFileChange}
                            accept="video/*"
                            capture="environment"
                            className="hidden"
                        />
                        <input
                            id="galleryInput"
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            className="hidden"
                        />
                    </div>

                    {/* Metadata View */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                                <MapPin className="w-3 h-3 text-blue-600" /> Location
                            </div>
                            <p className="text-sm font-bold text-[#0a192f]">
                                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting...'}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                                <Clock className="w-3 h-3 text-emerald-600" /> Timestamp
                            </div>
                            <p className="text-sm font-bold text-[#0a192f]">
                                {timestamp ? new Date(timestamp).toLocaleTimeString() : 'Determining...'}
                            </p>
                        </div>
                    </div>

                    {/* Integrity Note */}
                    <div className="p-6 rounded-3xl bg-blue-50/80 border border-blue-100 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                            <Shield className="w-6 h-6 text-blue-700" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-extrabold text-blue-900 tracking-tight">Encrypted Audit Trail</h4>
                            <p className="text-sm text-blue-800/80 leading-relaxed font-medium">Evidence is hashed and timestamped upon upload. This ensures the integrity of your report for legal verification.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 shadow-sm">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className={cn(
                            "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg",
                            file && !isUploading
                                ? "bg-blue-700 text-white hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] shadow-blue-700/20"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        {isUploading ? (
                            <span className="flex items-center gap-3">
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Submitting Evidence...
                            </span>
                        ) : (
                            <>
                                Process Evidence
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
