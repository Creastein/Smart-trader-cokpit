'use client';

import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { ModeSelector } from '@/components/ModeSelector';
import { UploadZone } from '@/components/UploadZone';
import { AnalysisResult } from '@/components/AnalysisResult';
import { TradingJournal } from '@/components/TradingJournal';
import { ContextInput } from '@/components/ContextInput';
import { saveJournalEntry } from '@/lib/journalStorage';
import { BarChart3, BookOpen } from 'lucide-react';

interface AnalysisResponse {
    decision: 'BUY' | 'WAIT' | 'SELL';
    confidence_score: 'High' | 'Medium' | 'Low';
    is_demo?: boolean;
    analysis_summary: string;
    trading_plan: {
        entry_area: string;
        target_price: string;
        stop_loss: string;
        risk_reward_ratio: string;
    };
}

export default function Home() {
    const [selectedMode, setSelectedMode] = useState<'scalping' | 'swing' | null>(null);
    const [selectedImageHTF, setSelectedImageHTF] = useState<File | null>(null);
    const [selectedImageLTF, setSelectedImageLTF] = useState<File | null>(null);
    const [context, setContext] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [isJournalOpen, setIsJournalOpen] = useState(false);

    // Determines if we have at least one valid image to analyze
    const canAnalyze = (selectedImageHTF !== null || selectedImageLTF !== null);

    // Safety: Cooldown Timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleModeSelect = (mode: 'scalping' | 'swing') => {
        setSelectedMode(mode);
        // Don't reset result here to allow changing mode context
        if (analysisResult) setAnalysisResult(null);
    };

    const handleImagesSelected = (fileHTF: File | null, fileLTF: File | null) => {
        if (fileHTF) setSelectedImageHTF(fileHTF);
        if (fileLTF) setSelectedImageLTF(fileLTF);

        // If clearing
        if (fileHTF === null && fileLTF === null) {
            setSelectedImageHTF(null);
            setSelectedImageLTF(null);
        }

        setAnalysisResult(null);
    };

    const handleImageError = (errorMessage: string) => {
        toast.error(errorMessage, {
            duration: 4000,
            position: 'top-center',
            style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #ef4444',
            },
        });
    };

    const handleClearImages = () => {
        setSelectedImageHTF(null);
        setSelectedImageLTF(null);
        setAnalysisResult(null);
    };

    const handleAnalyze = async () => {
        // STRICT SAFETY CHECK
        if (!selectedMode || !canAnalyze || isAnalyzing || cooldown > 0) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const formData = new FormData();

            // Logic for file upload priority
            // If both present -> HTF + LTF (Multi-Timeframe)
            // If only HTF -> Treat as single
            // If only LTF -> Treat as single (backward compat)

            if (selectedImageHTF) {
                formData.append('image_htf', selectedImageHTF);
            }

            if (selectedImageLTF) {
                formData.append('image_ltf', selectedImageLTF);
            }

            // Fallback for single image Logic
            // If only one image exists, ensuring API receives at least one 'image' or specific keys
            // The API expects 'image_htf' and optionally 'image_ltf', OR just 'image'

            formData.append('mode', selectedMode);
            formData.append('context', context);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            // Try to parse JSON regardless of status to check for custom error messages
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // If JSON parse fails, it might be a raw server error (timeout/gateway)
                console.error("JSON parse failed", jsonError);
            }

            if (!response.ok) {
                // Use the error message from server if available, otherwise fallback to status text
                const errorMessage = data?.error || `Analysis failed (${response.status}): ${response.statusText}`;
                throw new Error(errorMessage);
            }

            // data is already parsed above


            if (data.error) {
                throw new Error(data.error);
            }

            setAnalysisResult(data);

            // Save to Trading Journal (on success only)
            // Save the "Main" image (LTF if available, otherwise HTF)
            const mainImage = selectedImageLTF || selectedImageHTF;
            if (mainImage && selectedMode) {
                try {
                    // Check if multi-timeframe
                    const isConfluence = !!(selectedImageHTF && selectedImageLTF);
                    await saveJournalEntry(selectedMode, mainImage, data, undefined, isConfluence);
                    console.log('Analysis saved to journal');
                } catch (journalError) {
                    console.error('Failed to save to journal:', journalError);
                }
            }

        } catch (error: unknown) {
            console.error("Analysis failed:", error);
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Analysis failed: ${message}`, {
                duration: 5000,
                position: 'top-center',
                style: {
                    background: '#1e293b',
                    color: '#f1f5f9',
                    border: '1px solid #ef4444',
                },
            });
        } finally {
            setIsAnalyzing(false);
            setCooldown(10); // Start 10s safety cooldown
        }
    };

    return (
        <main className="min-h-screen p-6 md:p-12 relative overflow-hidden">
            <Toaster />

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="max-w-4xl mx-auto mb-12 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Smart Trader Cockpit</h1>
                            <p className="text-slate-400 font-medium">Personal Edition v1.1 <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full ml-2">Multi-TF</span></p>
                        </div>
                    </div>

                    {/* Journal Button */}
                    <button
                        onClick={() => setIsJournalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group"
                        aria-label="Buka jurnal trading"
                    >
                        <BookOpen className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                        <span className="font-medium">Jurnal</span>
                    </button>
                </div>

                {/* Demo Mode Badge */}
                {analysisResult?.is_demo && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-full px-4 py-1 animate-pulse">
                        <span className="text-yellow-500 text-sm font-semibold tracking-wider">⚠️ MODE DEMO / SIMULASI AKTIF</span>
                    </div>
                )}
            </header>

            {/* Step 1: Mode Selection */}
            <section className="mb-8">
                <ModeSelector
                    selectedMode={selectedMode}
                    onSelectMode={handleModeSelect}
                    disabled={isAnalyzing}
                />
            </section>

            {/* Step 2: Upload Zone (Only visible after mode selected) */}
            {selectedMode && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <UploadZone
                        onImagesSelected={handleImagesSelected}
                        selectedImageHTF={selectedImageHTF}
                        selectedImageLTF={selectedImageLTF}
                        onClear={handleClearImages}
                        disabled={isAnalyzing}
                        onError={handleImageError}
                    />

                    {/* NEW: Context Input (Only visible when at least one image is selected) */}
                    {canAnalyze && (
                        <ContextInput
                            value={context}
                            onChange={setContext}
                            disabled={isAnalyzing}
                        />
                    )}
                </section>
            )}

            {/* Action Button */}
            {selectedMode && canAnalyze && !analysisResult && (
                <div className="flex justify-center mt-8 animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || cooldown > 0}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-900/20 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-3"
                    >
                        {isAnalyzing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menjalankan Analisa Multi-Dimensi...</span>
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <span className="text-lg">Tunggu Sebentar ({cooldown}s)</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">Analisa Struktur Pasar</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Step 3: Result */}
            <section className="mb-24">
                <AnalysisResult data={analysisResult} isLoading={isAnalyzing} />
            </section>

            {/* Trading Journal Sidebar */}
            <TradingJournal
                isOpen={isJournalOpen}
                onClose={() => setIsJournalOpen(false)}
            />
        </main>
    );
}
