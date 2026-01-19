'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Flame, BarChart3 } from 'lucide-react';
import { JournalStats } from '@/lib/journalStorage';

interface PerformanceStatsProps {
    stats: JournalStats;
    className?: string;
}

export function PerformanceStats({ stats, className }: PerformanceStatsProps) {
    const {
        total,
        winCount,
        lossCount,
        breakEvenCount,
        pendingCount,
        winRate,
        winRateScalping,
        winRateSwing,
        currentStreak,
        streakType,
        totalPnl,
    } = stats;

    const resolvedTrades = winCount + lossCount + breakEvenCount;

    // Win rate color based on percentage
    const getWinRateColor = (rate: number) => {
        if (rate >= 60) return 'text-green-400';
        if (rate >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getWinRateBgColor = (rate: number) => {
        if (rate >= 60) return 'bg-green-500';
        if (rate >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className={twMerge("bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">Performance Stats</h3>
            </div>

            {/* Main Win Rate */}
            <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Win Rate</span>
                    <span className={twMerge("text-2xl font-bold", getWinRateColor(winRate))}>
                        {winRate.toFixed(1)}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={twMerge("h-full transition-all duration-500", getWinRateBgColor(winRate))}
                        style={{ width: `${Math.min(winRate, 100)}%` }}
                    />
                </div>

                <p className="text-xs text-slate-500 mt-2">
                    Based on {resolvedTrades} resolved trades
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Wins */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-green-400">{winCount}</div>
                    <div className="text-xs text-slate-400">Wins</div>
                </div>

                {/* Losses */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                    <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-red-400">{lossCount}</div>
                    <div className="text-xs text-slate-400">Losses</div>
                </div>

                {/* Breakeven */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                    <Minus className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-yellow-400">{breakEvenCount}</div>
                    <div className="text-xs text-slate-400">Break Even</div>
                </div>

                {/* Pending */}
                <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3 text-center">
                    <Target className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-slate-400">{pendingCount}</div>
                    <div className="text-xs text-slate-400">Pending</div>
                </div>
            </div>

            {/* Streak */}
            {currentStreak > 0 && (
                <div className={twMerge(
                    "flex items-center justify-between p-3 rounded-lg",
                    streakType === 'WIN' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                )}>
                    <div className="flex items-center gap-2">
                        <Flame className={twMerge("w-5 h-5", streakType === 'WIN' ? 'text-green-400' : 'text-red-400')} />
                        <span className="text-sm text-slate-300">Current Streak</span>
                    </div>
                    <span className={twMerge(
                        "font-bold text-lg",
                        streakType === 'WIN' ? 'text-green-400' : 'text-red-400'
                    )}>
                        {currentStreak} {streakType === 'WIN' ? 'Wins' : 'Losses'}
                    </span>
                </div>
            )}

            {/* Win Rate by Mode */}
            <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Win Rate by Mode</div>

                <div className="flex items-center justify-between p-2 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <span className="text-sm text-slate-300">Scalping</span>
                    </div>
                    <span className={twMerge("font-medium", getWinRateColor(winRateScalping))}>
                        {winRateScalping.toFixed(1)}%
                    </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm text-slate-300">Swing</span>
                    </div>
                    <span className={twMerge("font-medium", getWinRateColor(winRateSwing))}>
                        {winRateSwing.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Total P&L */}
            {totalPnl !== 0 && (
                <div className={twMerge(
                    "flex items-center justify-between p-3 rounded-lg",
                    totalPnl >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                )}>
                    <div className="flex items-center gap-2">
                        <Trophy className={twMerge("w-5 h-5", totalPnl >= 0 ? 'text-green-400' : 'text-red-400')} />
                        <span className="text-sm text-slate-300">Total P&L</span>
                    </div>
                    <span className={twMerge(
                        "font-bold text-lg",
                        totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                        {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}%
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-700">
                {total} total analyses
            </div>
        </div>
    );
}
