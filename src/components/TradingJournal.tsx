'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    getJournal,
    deleteJournalEntry,
    updateJournalOutcome,
    getJournalStats,
    JournalEntry,
    TradeOutcome,
    JournalStats
} from '@/lib/journalStorage';
import { BookOpen, Trash2, X, Clock, Zap, TrendingUp, Filter, BarChart3, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { TradeOutcomeSelector } from './TradeOutcomeSelector';
import { PerformanceStats } from './PerformanceStats';

type FilterType = 'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING';
type ViewTab = 'entries' | 'stats';

interface TradingJournalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEntry?: (entry: JournalEntry) => void;
}

export function TradingJournal({ isOpen, onClose, onSelectEntry }: TradingJournalProps) {
    const [entries, setEntries] = useState<JournalEntry[]>(() => {
        if (typeof window !== 'undefined') {
            return getJournal().entries;
        }
        return [];
    });
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [activeTab, setActiveTab] = useState<ViewTab>('entries');
    const [stats, setStats] = useState<JournalStats | null>(null);

    // Refresh entries and stats when opening the journal
    useEffect(() => {
        if (!isOpen) return;

        queueMicrotask(() => {
            const journal = getJournal();
            setEntries(journal.entries);
            setStats(getJournalStats());
        });
    }, [isOpen]);

    // Filter entries based on selected filter
    const filteredEntries = useMemo(() => {
        if (filter === 'ALL') return entries;
        return entries.filter(e => {
            const outcome = e.outcome || 'PENDING';
            return outcome === filter;
        });
    }, [entries, filter]);

    const refreshData = () => {
        setEntries(getJournal().entries);
        setStats(getJournalStats());
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (confirm('Delete this journal entry?')) {
            deleteJournalEntry(id);
            refreshData();

            if (selectedEntry?.id === id) {
                setSelectedEntry(null);
            }
        }
    };

    const handleOutcomeChange = (entryId: string, outcome: TradeOutcome, notes?: string, pnl?: number) => {
        const success = updateJournalOutcome(entryId, outcome, notes, pnl);
        if (success) {
            refreshData();
        }
    };

    const handleViewDetails = (entry: JournalEntry) => {
        setSelectedEntry(entry);
        if (onSelectEntry) {
            onSelectEntry(entry);
        }
    };

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'BUY':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'SELL':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    const getOutcomeBadge = (outcome?: TradeOutcome) => {
        switch (outcome) {
            case 'WIN':
                return { bg: 'bg-green-500', text: 'W', color: 'text-white' };
            case 'LOSS':
                return { bg: 'bg-red-500', text: 'L', color: 'text-white' };
            case 'BREAKEVEN':
                return { bg: 'bg-yellow-500', text: 'BE', color: 'text-black' };
            default:
                return null;
        }
    };

    const getModeIcon = (mode: string) => {
        return mode === 'scalping' ? Zap : TrendingUp;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filterOptions: { value: FilterType; label: string; color: string }[] = [
        { value: 'ALL', label: 'All', color: 'text-slate-400' },
        { value: 'WIN', label: 'Wins', color: 'text-green-400' },
        { value: 'LOSS', label: 'Losses', color: 'text-red-400' },
        { value: 'BREAKEVEN', label: 'BE', color: 'text-yellow-400' },
        { value: 'PENDING', label: 'Pending', color: 'text-slate-400' },
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={twMerge(
                    "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-700 z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col shadow-2xl",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Jurnal Trading</h2>
                                <p className="text-xs text-slate-400">
                                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                                    {stats && stats.winRate > 0 && (
                                        <span className="ml-2 text-green-400">
                                            • {stats.winRate.toFixed(0)}% Win Rate
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Close journal"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('entries')}
                            className={twMerge(
                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === 'entries'
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                            Entries
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={twMerge(
                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === 'stats'
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Stats
                        </button>
                    </div>
                </div>

                {/* Stats Tab */}
                {activeTab === 'stats' && stats && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <PerformanceStats stats={stats} />
                    </div>
                )}

                {/* Entries Tab */}
                {activeTab === 'entries' && (
                    <>
                        {/* Filter Bar */}
                        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <div className="flex gap-1 flex-1 overflow-x-auto">
                                    {filterOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFilter(opt.value)}
                                            className={twMerge(
                                                "px-2.5 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                                                filter === opt.value
                                                    ? "bg-blue-600 text-white"
                                                    : `bg-slate-800 ${opt.color} hover:bg-slate-700`
                                            )}
                                        >
                                            {opt.label}
                                            {opt.value !== 'ALL' && (
                                                <span className="ml-1 opacity-70">
                                                    ({entries.filter(e => (e.outcome || 'PENDING') === opt.value).length})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Entries List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredEntries.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="p-4 bg-slate-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-slate-600" />
                                    </div>
                                    <p className="text-slate-300 font-medium mb-1">
                                        {filter === 'ALL' ? 'Belum ada data jurnal' : `Tidak ada trade ${filter.toLowerCase()}`}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {filter === 'ALL'
                                            ? 'Riwayat analisa Anda akan muncul di sini'
                                            : 'Coba ganti filter lain'}
                                    </p>
                                </div>
                            ) : (
                                filteredEntries.map((entry) => {
                                    const ModeIcon = getModeIcon(entry.mode);
                                    const outcomeBadge = getOutcomeBadge(entry.outcome);

                                    return (
                                        <div
                                            key={entry.id}
                                            className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all duration-200 hover:shadow-lg"
                                        >
                                            {/* Thumbnail + Main Info */}
                                            <div
                                                className="flex gap-3 mb-3 cursor-pointer"
                                                onClick={() => handleViewDetails(entry)}
                                            >
                                                {/* Thumbnail with outcome badge */}
                                                <div className="relative">
                                                    {entry.imageThumbnail ? (
                                                        <img
                                                            src={entry.imageThumbnail}
                                                            alt={entry.imageFileName}
                                                            className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
                                                            <BookOpen className="w-6 h-6 text-slate-500" />
                                                        </div>
                                                    )}
                                                    {/* Outcome Badge */}
                                                    {outcomeBadge && (
                                                        <div className={twMerge(
                                                            "absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg",
                                                            outcomeBadge.bg,
                                                            outcomeBadge.color
                                                        )}>
                                                            {outcomeBadge.text === 'W' ? <Check className="w-3.5 h-3.5" /> : outcomeBadge.text}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={twMerge(
                                                            "px-2 py-0.5 rounded-full text-xs font-bold border uppercase",
                                                            getDecisionColor(entry.decision)
                                                        )}>
                                                            {entry.decision}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-slate-400 uppercase">
                                                            <ModeIcon className="w-3 h-3" />
                                                            {entry.mode}
                                                        </span>
                                                        {entry.pair && (
                                                            <span className="text-xs text-blue-400 font-medium">
                                                                {entry.pair}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(entry.timestamp)}
                                                    </div>

                                                    {entry.pnl !== undefined && (
                                                        <div className={twMerge(
                                                            "text-xs font-medium",
                                                            entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                                        )}>
                                                            {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Outcome Selector (compact) */}
                                            <div className="mb-3">
                                                <TradeOutcomeSelector
                                                    currentOutcome={entry.outcome || 'PENDING'}
                                                    currentNotes={entry.notes}
                                                    currentPnl={entry.pnl}
                                                    onOutcomeChange={(outcome, notes, pnl) =>
                                                        handleOutcomeChange(entry.id, outcome, notes, pnl)
                                                    }
                                                    compact
                                                />
                                            </div>

                                            {/* Notes preview */}
                                            {entry.notes && (
                                                <div className="text-xs text-slate-400 mb-3 px-1 italic line-clamp-1">
                                                    &quot;{entry.notes}&quot;
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(entry)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Lihat Detail
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(entry.id, e)}
                                                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                                    aria-label="Delete entry"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* Footer Quick Stats */}
                {entries.length > 0 && activeTab === 'entries' && stats && (
                    <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-green-500/10 rounded-lg p-2">
                                <div className="text-green-400 text-lg font-bold">{stats.winCount}</div>
                                <div className="text-xs text-slate-500">WIN</div>
                            </div>
                            <div className="bg-red-500/10 rounded-lg p-2">
                                <div className="text-red-400 text-lg font-bold">{stats.lossCount}</div>
                                <div className="text-xs text-slate-500">LOSS</div>
                            </div>
                            <div className="bg-yellow-500/10 rounded-lg p-2">
                                <div className="text-yellow-400 text-lg font-bold">{stats.breakEvenCount}</div>
                                <div className="text-xs text-slate-500">BE</div>
                            </div>
                            <div className="bg-slate-500/10 rounded-lg p-2">
                                <div className="text-slate-400 text-lg font-bold">{stats.pendingCount}</div>
                                <div className="text-xs text-slate-500">PENDING</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
