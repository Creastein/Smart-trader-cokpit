import React, { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface UploadZoneProps {
    onImagesSelected: (fileHTF: File | null, fileLTF: File | null) => void;
    onClear: () => void;
    selectedImageHTF: File | null;
    selectedImageLTF: File | null;
    disabled?: boolean;
    onError?: (message: string) => void;
}

interface SingleDropZoneProps {
    id: string;
    label: string;
    subLabel: string;
    file: File | null;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    disabled?: boolean;
    onError?: (message: string) => void;
    required?: boolean;
}

const SingleDropZone = ({
    id,
    label,
    subLabel,
    file,
    onFileSelect,
    onClear,
    disabled,
    onError,
    required
}: SingleDropZoneProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            queueMicrotask(() => setPreviewUrl(url));
            return () => URL.revokeObjectURL(url);
        } else {
            queueMicrotask(() => setPreviewUrl(null));
        }
    }, [file]);

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return `File terlalu besar. Maksimal ukuran adalah ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return `Tipe file tidak didukung. Gunakan: JPEG, PNG, GIF, WebP.`;
        }
        return null;
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const uploadedFile = e.dataTransfer.files[0];
            const validationError = validateFile(uploadedFile);
            if (validationError) {
                onError?.(validationError);
                return;
            }
            onFileSelect(uploadedFile);
        }
    }, [disabled, onFileSelect, onError]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            const validationError = validateFile(uploadedFile);
            if (validationError) {
                onError?.(validationError);
                e.target.value = '';
                return;
            }
            onFileSelect(uploadedFile);
        }
    }, [onFileSelect, onError]);

    if (file && previewUrl) {
        return (
            <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 group h-48 md:h-64 cursor-default">
                <Image
                    src={previewUrl}
                    alt={label}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    unoptimized
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                    disabled={disabled}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-all shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-3 text-white right-3">
                    <div className="flex items-center space-x-2 text-xs font-medium bg-black/60 px-2 py-1 rounded-lg backdrop-blur-md w-fit mb-1">
                        <ImageIcon className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">{label}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={twMerge(
                "relative h-48 md:h-64 border-2 border-dashed rounded-xl p-4 transition-all duration-300 text-center cursor-pointer flex flex-col items-center justify-center",
                isDragOver
                    ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                    : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50",
                disabled && "opacity-50 cursor-not-allowed hover:border-slate-700 hover:bg-transparent"
            )}
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
                id={`upload-${id}`}
            />
            <label htmlFor={`upload-${id}`} className={twMerge("cursor-pointer block w-full h-full flex flex-col items-center justify-center", disabled && "cursor-not-allowed")}>
                <div className={twMerge(
                    "p-3 rounded-full bg-slate-800 mb-3",
                    isDragOver ? "text-blue-500" : "text-slate-400"
                )}>
                    <Upload className="w-6 h-6" />
                </div>
                <div className="text-slate-300">
                    <span className="font-bold text-sm block mb-1">{label}</span>
                    <span className="text-xs text-slate-500 block">{subLabel}</span>
                    {!required && <span className="text-[10px] text-slate-600 mt-2 bg-slate-800/50 px-2 py-0.5 rounded-full inline-block">OPTIONAL</span>}
                </div>
            </label>
        </div>
    );
};

export function UploadZone({
    onImagesSelected,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onClear,
    selectedImageHTF,
    selectedImageLTF,
    disabled,
    onError
}: UploadZoneProps) {

    return (
        <div className="w-full max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">

                {/* Header Guide */}
                <div className="flex items-start gap-3 mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-blue-400">Analisa Multi-Timeframe (Rekomendasi)</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Untuk akurasi maksimal, upload dua chart. AI akan mencari <strong>Konfluensi</strong> (kesamaan sinyal) antara Trend Besar dan Setup Entry.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Higher Timeframe Dropzone */}
                    <SingleDropZone
                        id="htf"
                        label="Timeframe Besar (Macro)"
                        subLabel="cth: Daily, H4, H1"
                        file={selectedImageHTF}
                        onFileSelect={(file) => onImagesSelected(file, selectedImageLTF)}
                        onClear={() => onImagesSelected(null, selectedImageLTF)}
                        disabled={disabled}
                        onError={onError}
                    />

                    {/* Lower Timeframe Dropzone */}
                    <SingleDropZone
                        id="ltf"
                        label="Timeframe Kecil (Entry)"
                        subLabel="cth: M15, M5, M1"
                        file={selectedImageLTF}
                        onFileSelect={(file) => onImagesSelected(selectedImageHTF, file)}
                        onClear={() => onImagesSelected(selectedImageHTF, null)}
                        disabled={disabled}
                        onError={onError}
                        required
                    />
                </div>
            </div>
        </div>
    );
}
