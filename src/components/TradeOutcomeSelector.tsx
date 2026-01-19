'use client';

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Check, X, Minus, Clock, ChevronDown, ChevronUp, MessageSquare, Percent } from 'lucide-react';
import { TradeOutcome } from '@/lib/journalStorage';

interface TradeOutcomeSelectorProps {
    currentOutcome?: TradeOutcome;
    currentNotes?: string;
    currentPnl?: number;
    onOutcomeChange: (outcome: TradeOutcome, notes?: string, pnl?: number) => void;
    compact?: boolean;
    disabled?: boolean;
}

const OUTCOME_CONFIG = {
    WIN: {
        label: 'WIN',
        icon: Check,
        bgColor: 'bg-green-500',
        bgColorHover: 'hover:bg-green-400',
        bgColorMuted: 'bg-green-500/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/50',
    },
    LOSS: {
        label: 'LOSS',
        icon: X,
        bgColor: 'bg-red-500',
        bgColorHover: 'hover:bg-red-400',
        bgColorMuted: 'bg-red-500/20',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/50',
    },
    BREAKEVEN: {
        label: 'BE',
        icon: Minus,
        bgColor: 'bg-yellow-500',
        bgColorHover: 'hover:bg-yellow-400',
        bgColorMuted: 'bg-yellow-500/20',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/50',
    },
    PENDING: {
        label: 'PENDING',
        icon: Clock,
        bgColor: 'bg-slate-500',
        bgColorHover: 'hover:bg-slate-400',
        bgColorMuted: 'bg-slate-500/20',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/50',
    },
};

export function TradeOutcomeSelector({
    currentOutcome = 'PENDING',
    currentNotes = '',
    currentPnl,
    onOutcomeChange,
    compact = false,
    disabled = false,
}: TradeOutcomeSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState(currentNotes);
    const [pnl, setPnl] = useState<string>(currentPnl !== undefined ? currentPnl.toString() : '');

    const handleOutcomeClick = (outcome: TradeOutcome) => {
        if (disabled) return;

        const pnlValue = pnl !== '' ? parseFloat(pnl) : undefined;
        onOutcomeChange(outcome, notes || undefined, pnlValue);
    };

    const handleNotesBlur = () => {
        const pnlValue = pnl !== '' ? parseFloat(pnl) : undefined;
        onOutcomeChange(currentOutcome, notes || undefined, pnlValue);
    };

    const handlePnlBlur = () => {
        const pnlValue = pnl !== '' ? parseFloat(pnl) : undefined;
        onOutcomeChange(currentOutcome, notes || undefined, pnlValue);
    };

    const config = OUTCOME_CONFIG[currentOutcome];

    // Compact mode - just show buttons
    if (compact) {
        return (
            <div className="flex gap-1">
                {(Object.keys(OUTCOME_CONFIG) as TradeOutcome[]).map((outcome) => {
                    const cfg = OUTCOME_CONFIG[outcome];
                    const isActive = currentOutcome === outcome;
                    const Icon = cfg.icon;

                    return (
                        <button
                            key={outcome}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOutcomeClick(outcome);
                            }}
                            disabled={disabled}
                            className={twMerge(
                                "p-1.5 rounded-md transition-all",
                                isActive
                                    ? `${cfg.bgColor} text-white`
                                    : `${cfg.bgColorMuted} ${cfg.textColor} ${cfg.bgColorHover}`,
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            title={cfg.label}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    );
                })}
            </div>
        );
    }

    // Full mode - with expand/collapse for notes & PnL
    return (
        <div className="space-y-3">
            {/* Outcome Buttons */}
            <div className="flex gap-2">
                {(Object.keys(OUTCOME_CONFIG) as TradeOutcome[]).map((outcome) => {
                    const cfg = OUTCOME_CONFIG[outcome];
                    const isActive = currentOutcome === outcome;
                    const Icon = cfg.icon;

                    return (
                        <button
                            key={outcome}
                            onClick={() => handleOutcomeClick(outcome)}
                            disabled={disabled}
                            className={twMerge(
                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all border",
                                isActive
                                    ? `${cfg.bgColor} text-white border-transparent shadow-lg`
                                    : `${cfg.bgColorMuted} ${cfg.textColor} ${cfg.borderColor} hover:border-opacity-100`,
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{cfg.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Expand/Collapse Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>{isExpanded ? 'Hide details' : 'Add notes & PnL'}</span>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* PnL Input */}
                    <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="P&L % (e.g., 2.5 or -1.5)"
                            value={pnl}
                            onChange={(e) => setPnl(e.target.value)}
                            onBlur={handlePnlBlur}
                            disabled={disabled}
                            className={twMerge(
                                "w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>

                    {/* Notes Input */}
                    <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <textarea
                            placeholder="Add notes about this trade..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            disabled={disabled}
                            rows={2}
                            className={twMerge(
                                "w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Current Status Badge */}
            {currentOutcome !== 'PENDING' && (
                <div className={twMerge(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                    config.bgColorMuted,
                    config.textColor
                )}>
                    <config.icon className="w-4 h-4" />
                    <span className="font-medium">
                        Marked as {config.label}
                        {currentPnl !== undefined && ` (${currentPnl >= 0 ? '+' : ''}${currentPnl.toFixed(2)}%)`}
                    </span>
                </div>
            )}
        </div>
    );
}
