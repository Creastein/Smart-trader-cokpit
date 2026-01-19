'use client';

import React from 'react';
import { FileText } from 'lucide-react';

interface ContextInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function ContextInput({ value, onChange, disabled }: ContextInputProps) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400">
                    <FileText className="w-5 h-5" />
                </div>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Opsional: Tambahkan konteks pasar, berita, atau pengamatan Anda... (misal: 'Ada berita high impact AS jam 7 malam' atau 'Harga tertahan di SBR Daily')"
                    className="w-full min-h-[100px] bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="absolute top-3 right-3 text-xs text-slate-500 pointer-events-none">
                    Multi-modal Context
                </div>
            </div>
        </div>
    );
}
