// Import modules
import { initRouter } from './router.js';
import { initTheme } from './theme.js';
import { initAuth } from './auth.js';

function initNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu-container');
    const navMenuLinks = navMenu.querySelectorAll('.nav-link');
    const navBackdrop = document.querySelector('.nav-backdrop');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        const isActive = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', isActive);
        document.body.classList.toggle('nav-open', isActive);
        if (isActive) {
            navBackdrop.style.display = 'block';
            navBackdrop.addEventListener('click', closeMenu);
        } else {
            navBackdrop.style.display = 'none';
            navBackdrop.removeEventListener('click', closeMenu);
        }
    });

    const closeMenu = () => {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', false);
        document.body.classList.remove('nav-open');
        navBackdrop.style.display = 'none';
        navBackdrop.removeEventListener('click', closeMenu);
    };

    // Close menu when any link inside it is clicked
    navMenuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// Function to initialize the application
function main() {
    // Initialize theme handling (dark/light mode)
    initTheme();

    // Initialize mobile navigation
    initNav();

    // Initialize the router to handle page navigation
    initRouter();

    // Initialize authentication logic
    initAuth();
}

// Wait for the DOM to be fully loaded before running the main function
document.addEventListener('DOMContentLoaded', main); 