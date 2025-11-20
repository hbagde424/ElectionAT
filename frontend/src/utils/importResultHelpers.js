export const safeParseJson = async (response) => {
    try {
        const contentType = response?.headers?.get?.('content-type') || '';
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: false, message: text || `HTTP ${response.status}` };
            }
        }
        if (contentType.includes('application/json')) return await response.json();
        const text = await response.text().catch(() => '');
        try {
            return JSON.parse(text);
        } catch (e) {
            return { success: false, message: text };
        }
    } catch (e) {
        return { success: false, message: e?.message || String(e) };
    }
};

export const safeString = (value) => {
    try {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        // Try JSON stringify first (better readability for objects)
        try {
            return JSON.stringify(value);
        } catch (e) {
            return String(value);
        }
    } catch (e) {
        try { return String(value); } catch { return '[unserializable]'; }
    }
};

export const sanitizeImportResult = (r) => {
    if (!r) return r;
    const out = { ...r };
    if (Array.isArray(out.errors)) {
        out.errors = out.errors.map((err) => {
            if (!err) return { row: '', message: '' };
            if (typeof err === 'string') return { row: '', message: err };
            const row = (err.row === undefined || err.row === null) ? '' : (typeof err.row === 'number' || typeof err.row === 'string' ? err.row : safeString(err.row));
            const message = err.message !== undefined && err.message !== null ? (typeof err.message === 'string' ? err.message : safeString(err.message)) : safeString(err);
            return { row, message };
        });
    }
    return out;
};

export const safeRenderError = (err) => {
    if (!err) return '';
    try {
        const row = err.row === undefined || err.row === null ? '' : (typeof err.row === 'string' || typeof err.row === 'number' ? String(err.row) : safeString(err.row));
        const message = (err.message !== undefined && err.message !== null) ? (typeof err.message === 'string' ? err.message : safeString(err.message)) : safeString(err);
        return `Row ${row}: ${message}`;
    } catch (e) {
        return safeString(err);
    }
};

export default {
    safeParseJson,
    sanitizeImportResult,
    safeString,
    safeRenderError
};
