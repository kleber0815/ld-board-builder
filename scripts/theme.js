const themeToggle = document.getElementById('theme-toggle');
const docElement = document.documentElement;

const applyTheme = (theme) => {
    docElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
};

const getInitialTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    // If a theme is stored in localStorage, use it. Otherwise, default to 'light'.
    return storedTheme || 'light';
};

export function initTheme() {
    if (!themeToggle) return;

    const currentTheme = getInitialTheme();
    applyTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = docElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // This listener is no longer needed as we default to light and save user preference.
        // Keeping it could cause unexpected theme changes if the user hasn't made a choice.
    });
} 