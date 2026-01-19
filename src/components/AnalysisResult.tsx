import React, { useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { ShieldAlert, TrendingUp, DollarSign, BrainCircuit, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface TradingPlan {
    entry_area: string;
    target_price: string;
    stop_loss: string;
    risk_reward_ratio: string;
}

interface AnalysisData {
    decision: 'BUY' | 'WAIT' | 'SELL';
    confidence_score: 'High' | 'Medium' | 'Low';
    analysis_summary: string;
    trading_plan: TradingPlan;
}

interface AnalysisResultProps {
    data: AnalysisData | null;
    isLoading: boolean;
}

export function AnalysisResult({ data, isLoading }: AnalysisResultProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
            } as Parameters<typeof html2canvas>[1]);

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `smart-trader-analysis-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export image. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center animate-pulse">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <BrainCircuit className="w-12 h-12 text-blue-500 animate-spin-slow" />
                    <h3 className="text-xl font-medium text-slate-300">AI Analyst Sedang Bekerja...</h3>
                    <p className="text-slate-500 text-sm">Menganalisa Price Action, Order Book, dan Struktur Momentum.</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'BUY': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'SELL': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        }
    };

    const getConfidenceColor = (score: string) => {
        switch (score) {
            case 'High': return 'text-emerald-400';
            case 'Medium': return 'text-amber-400';
            default: return 'text-slate-400';
        }
    };

    const decisionColorClass = getDecisionColor(data.decision);

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Export Actions Header */}
            <div className="flex justify-end mb-3">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700"
                >
                    {isExporting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Share2 className="w-4 h-4" />
                    )}
                    <span>{isExporting ? 'Generating...' : 'Share / Export'}</span>
                </button>
            </div>

            <div
                ref={reportRef}
                className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative"
            >
                {/* Branding Watermark (Only affects export usually, but visible is fine) */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <BrainCircuit className="w-64 h-64" />
                </div>

                {/* Header - Decision & Confidence */}
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={twMerge("px-6 py-2 rounded-lg border-2 font-black text-3xl tracking-wider", decisionColorClass)}>
                            {data.decision}
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Confidence</p>
                            <p className={twMerge("font-bold text-lg", getConfidenceColor(data.confidence_score))}>
                                {data.confidence_score}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500 text-sm">
                        <BrainCircuit className="w-4 h-4" />
                        <span>Generated by Smart Trader AI</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-slate-800 relative z-10">
                    {/* Main Analysis Text */}
                    <div className="col-span-2 p-6">
                        <h4 className="flex items-center gap-2 text-slate-200 font-bold mb-4">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Ringkasan Analisa
                        </h4>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            {data.analysis_summary}
                        </p>
                    </div>

                    {/* Trading Plan / Stats */}
                    <div className="p-6 bg-slate-800/30">
                        <h4 className="flex items-center gap-2 text-slate-200 font-bold mb-4">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Rencana Eksekusi
                        </h4>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                <span className="text-slate-400 text-sm">Entry Area</span>
                                <span className="text-slate-200 font-mono font-medium">{data.trading_plan.entry_area}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                <span className="text-slate-400 text-sm">Target (TP)</span>
                                <span className="text-emerald-400 font-mono font-bold">{data.trading_plan.target_price}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                <span className="text-slate-400 text-sm">Stop Loss</span>
                                <span className="text-red-400 font-mono font-bold">{data.trading_plan.stop_loss}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400 text-sm">Risk/Reward</span>
                                <span className="text-blue-400 font-mono font-medium">{data.trading_plan.risk_reward_ratio}</span>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 flex gap-2 items-start p-3 bg-slate-800 rounded-lg text-xs text-slate-500">
                            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p>Peringatan: Ini analisa AI. Bukan nasihat keuangan. Trading dengan risiko sendiri.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
