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