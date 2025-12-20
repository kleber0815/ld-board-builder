// Utility functions for the project

/**
 * Returns a debounced version of the provided function.
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - The debounce delay in ms.
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export async function getAnonymizedUserId() {
    let uid = localStorage.getItem('ld_uid');
    if (!uid) {
        uid = crypto.randomUUID();
        localStorage.setItem('ld_uid', uid);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(uid + '|ld_board_builder_v1');
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}
