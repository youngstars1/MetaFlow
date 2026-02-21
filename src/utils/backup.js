// ==================================================
// DATA BACKUP & RESTORE — Export/Import JSON
// ==================================================

const ALL_KEYS = [
    'metaflow_goals',
    'metaflow_transactions',
    'metaflow_routines',
    'metaflow_profile',
    'metaflow_gamification',
    'metaflow_envelopes',
];

/**
 * Export all app data as a JSON file download
 */
export function exportData() {
    const data = {};
    ALL_KEYS.forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) data[key] = JSON.parse(raw);
        } catch { /* skip corrupted data */ }
    });

    data._meta = {
        app: 'MetaFlow',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        creator: 'YoungStars Design',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
}

/**
 * Import data from a JSON backup file
 * Returns { success: boolean, message: string, stats: object }
 */
export function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Validate it's a MetaFlow backup
        if (!data._meta || data._meta.app !== 'MetaFlow') {
            return {
                success: false,
                message: 'El archivo no es un backup válido de MetaFlow.',
            };
        }

        const stats = { restored: 0, skipped: 0 };

        ALL_KEYS.forEach(key => {
            if (data[key]) {
                try {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                    stats.restored++;
                } catch {
                    stats.skipped++;
                }
            }
        });

        return {
            success: true,
            message: `Backup restaurado exitosamente. ${stats.restored} categorías importadas.`,
            stats,
            exportedAt: data._meta.exportedAt,
        };
    } catch (err) {
        return {
            success: false,
            message: `Error leyendo el archivo: ${err.message}`,
        };
    }
}

/**
 * Create a manual backup to localStorage with timestamp
 */
export function createManualBackup() {
    const data = {};
    ALL_KEYS.forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) data[key] = JSON.parse(raw);
        } catch { /* skip */ }
    });

    data._meta = {
        app: 'MetaFlow',
        version: '1.0.0',
        backupAt: new Date().toISOString(),
    };

    try {
        localStorage.setItem('metaflow_manual_backup', JSON.stringify(data));
        return { success: true, timestamp: data._meta.backupAt };
    } catch {
        return { success: false, message: 'No hay espacio suficiente en el navegador.' };
    }
}

/**
 * Restore from manual backup
 */
export function restoreManualBackup() {
    try {
        const raw = localStorage.getItem('metaflow_manual_backup');
        if (!raw) return { success: false, message: 'No hay backup manual disponible.' };

        const data = JSON.parse(raw);
        ALL_KEYS.forEach(key => {
            if (data[key]) {
                localStorage.setItem(key, JSON.stringify(data[key]));
            }
        });

        return {
            success: true,
            message: `Backup del ${new Date(data._meta.backupAt).toLocaleString('es-CL')} restaurado.`,
        };
    } catch (err) {
        return { success: false, message: `Error: ${err.message}` };
    }
}

/**
 * Get last backup info
 */
export function getLastBackupInfo() {
    try {
        const raw = localStorage.getItem('metaflow_manual_backup');
        if (!raw) return null;
        const data = JSON.parse(raw);
        return {
            timestamp: data._meta?.backupAt,
            formatted: new Date(data._meta?.backupAt).toLocaleString('es-CL'),
        };
    } catch {
        return null;
    }
}
