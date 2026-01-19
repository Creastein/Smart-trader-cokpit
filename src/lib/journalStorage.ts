/**
 * Trading Journal - LocalStorage Management
 * Handles saving, loading, and managing trade analysis history
 */

export interface AnalysisResponse {
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

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING';

export interface JournalEntry {
    id: string;
    timestamp: number;
    mode: 'scalping' | 'swing';
    imageThumbnail: string; // Will store the Main/LTF thumbnail
    imageFileName: string;
    decision: 'BUY' | 'WAIT' | 'SELL';
    confidence: 'High' | 'Medium' | 'Low';
    analysis: AnalysisResponse;
    // New fields for Win/Loss tracking
    outcome?: TradeOutcome;
    outcomeUpdatedAt?: number;
    pair?: string;
    notes?: string;
    pnl?: number; // Percentage gain/loss
    isConfluence?: boolean; // New: metadata for Multi-TF
}

export interface JournalStats {
    total: number;
    winCount: number;
    lossCount: number;
    breakEvenCount: number;
    pendingCount: number;
    winRate: number;
    winRateScalping: number;
    winRateSwing: number;
    currentStreak: number;
    streakType: 'WIN' | 'LOSS' | 'NONE';
    totalPnl: number;
    avgPnl: number;
}

interface JournalStore {
    entries: JournalEntry[];
}

const STORAGE_KEY = 'smart-trader-journal-v1';
const MAX_ENTRIES = 50;
const THUMBNAIL_MAX_SIZE = 200;
const THUMBNAIL_QUALITY = 0.7;

/**
 * Create thumbnail from image file
 */
const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate scaled dimensions
                if (width > height) {
                    if (width > THUMBNAIL_MAX_SIZE) {
                        height *= THUMBNAIL_MAX_SIZE / width;
                        width = THUMBNAIL_MAX_SIZE;
                    }
                } else {
                    if (height > THUMBNAIL_MAX_SIZE) {
                        width *= THUMBNAIL_MAX_SIZE / height;
                        height = THUMBNAIL_MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY));
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

/**
 * Get journal from localStorage
 */
export const getJournal = (): JournalStore => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return { entries: [] };

        const parsed = JSON.parse(data);
        return parsed as JournalStore;
    } catch (error) {
        console.error('Failed to load journal:', error);
        return { entries: [] };
    }
};

/**
 * Save journal to localStorage with error handling
 */
const saveJournalToStorage = (journal: JournalStore): boolean => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
        return true;
    } catch (error) {
        // Handle QuotaExceededError
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, attempting to free space...');

            // Try removing oldest entry
            if (journal.entries.length > 1) {
                journal.entries = journal.entries.slice(0, -1);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
                    console.log('Saved after removing oldest entry');
                    return true;
                } catch (_retryError) {
                    console.error('Still failed after removing oldest entry');
                }
            }
        }

        console.error('Failed to save journal:', error);
        return false;
    }
};

/**
 * Save new journal entry
 */
export const saveJournalEntry = async (
    mode: 'scalping' | 'swing',
    imageFile: File,
    analysis: AnalysisResponse,
    pair?: string,
    isConfluence?: boolean
): Promise<void> => {
    try {
        // Generate thumbnail
        let thumbnail = '';
        try {
            thumbnail = await createThumbnail(imageFile);
        } catch (thumbError) {
            console.warn('Failed to create thumbnail, using placeholder:', thumbError);
            thumbnail = ''; // Will save without thumbnail
        }

        const entry: JournalEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            mode,
            imageThumbnail: thumbnail,
            imageFileName: imageFile.name,
            decision: analysis.decision,
            confidence: analysis.confidence_score,
            analysis,
            // Initialize new fields
            outcome: 'PENDING',
            pair: pair || undefined,
            isConfluence: isConfluence || false,
        };

        const journal = getJournal();
        journal.entries.unshift(entry); // Add to beginning (newest first)

        // Keep only MAX_ENTRIES
        if (journal.entries.length > MAX_ENTRIES) {
            journal.entries = journal.entries.slice(0, MAX_ENTRIES);
        }

        // Try to save
        const saved = saveJournalToStorage(journal);

        // If still failed and we have thumbnail, try without it
        if (!saved && thumbnail) {
            console.warn('Attempting to save without thumbnail...');
            entry.imageThumbnail = '';
            journal.entries[0] = entry;
            saveJournalToStorage(journal);
        }
    } catch (error) {
        console.error('Failed to save journal entry:', error);
        // Don't throw - we don't want to break the analysis flow
    }
};

/**
 * Update trade outcome for a journal entry
 */
export const updateJournalOutcome = (
    id: string,
    outcome: TradeOutcome,
    notes?: string,
    pnl?: number
): boolean => {
    try {
        const journal = getJournal();
        const entryIndex = journal.entries.findIndex(e => e.id === id);

        if (entryIndex === -1) {
            console.error('Entry not found:', id);
            return false;
        }

        journal.entries[entryIndex] = {
            ...journal.entries[entryIndex],
            outcome,
            outcomeUpdatedAt: Date.now(),
            notes: notes !== undefined ? notes : journal.entries[entryIndex].notes,
            pnl: pnl !== undefined ? pnl : journal.entries[entryIndex].pnl,
        };

        return saveJournalToStorage(journal);
    } catch (error) {
        console.error('Failed to update journal outcome:', error);
        return false;
    }
};

/**
 * Update pair for a journal entry
 */
export const updateJournalPair = (id: string, pair: string): boolean => {
    try {
        const journal = getJournal();
        const entryIndex = journal.entries.findIndex(e => e.id === id);

        if (entryIndex === -1) return false;

        journal.entries[entryIndex].pair = pair;
        return saveJournalToStorage(journal);
    } catch (error) {
        console.error('Failed to update journal pair:', error);
        return false;
    }
};

/**
 * Delete specific entry by ID
 */
export const deleteJournalEntry = (id: string): void => {
    try {
        const journal = getJournal();
        journal.entries = journal.entries.filter(e => e.id !== id);
        saveJournalToStorage(journal);
    } catch (error) {
        console.error('Failed to delete journal entry:', error);
    }
};

/**
 * Clear all journal entries
 */
export const clearJournal = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear journal:', error);
    }
};

/**
 * Get comprehensive journal statistics with win/loss tracking
 */
export const getJournalStats = (): JournalStats => {
    const journal = getJournal();
    const entries = journal.entries;
    const total = entries.length;

    // Count outcomes (treat undefined as PENDING for backward compatibility)
    const winCount = entries.filter(e => e.outcome === 'WIN').length;
    const lossCount = entries.filter(e => e.outcome === 'LOSS').length;
    const breakEvenCount = entries.filter(e => e.outcome === 'BREAKEVEN').length;
    const pendingCount = entries.filter(e => !e.outcome || e.outcome === 'PENDING').length;

    // Calculate win rate (only from resolved trades)
    const resolvedTrades = winCount + lossCount + breakEvenCount;
    const winRate = resolvedTrades > 0 ? (winCount / resolvedTrades) * 100 : 0;

    // Win rate by mode
    const scalpingEntries = entries.filter(e => e.mode === 'scalping');
    const swingEntries = entries.filter(e => e.mode === 'swing');

    const scalpingWins = scalpingEntries.filter(e => e.outcome === 'WIN').length;
    const scalpingResolved = scalpingEntries.filter(e => e.outcome && e.outcome !== 'PENDING').length;
    const winRateScalping = scalpingResolved > 0 ? (scalpingWins / scalpingResolved) * 100 : 0;

    const swingWins = swingEntries.filter(e => e.outcome === 'WIN').length;
    const swingResolved = swingEntries.filter(e => e.outcome && e.outcome !== 'PENDING').length;
    const winRateSwing = swingResolved > 0 ? (swingWins / swingResolved) * 100 : 0;

    // Calculate streak (based on most recent resolved trades)
    let currentStreak = 0;
    let streakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';

    // Sort by outcomeUpdatedAt or timestamp (most recent first)
    const sortedByOutcome = [...entries]
        .filter(e => e.outcome && e.outcome !== 'PENDING' && e.outcome !== 'BREAKEVEN')
        .sort((a, b) => (b.outcomeUpdatedAt || b.timestamp) - (a.outcomeUpdatedAt || a.timestamp));

    if (sortedByOutcome.length > 0) {
        const firstOutcome = sortedByOutcome[0].outcome as 'WIN' | 'LOSS';
        streakType = firstOutcome;

        for (const entry of sortedByOutcome) {
            if (entry.outcome === firstOutcome) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calculate PnL stats
    const entriesWithPnl = entries.filter(e => e.pnl !== undefined);
    const totalPnl = entriesWithPnl.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const avgPnl = entriesWithPnl.length > 0 ? totalPnl / entriesWithPnl.length : 0;

    return {
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
        avgPnl,
    };
};
