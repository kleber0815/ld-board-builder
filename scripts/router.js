import { supabase } from './supabase.js';
import { recordAnalyticsEvent } from './api.js';
import * as utils from './utils.js';

// --- Page Loading Functions ---
// Each function is responsible for fetching and rendering the HTML for a page.
// They return the main element for the page.

async function loadHome() {
    const { default: page } = await import('./pages/home.js');
    return page.render();
}

async function loadBuilder() {
    const { default: page } = await import('./pages/builder.js');
    return page.render();
}

async function loadDiscover() {
    const { default: page } = await import('./pages/discover.js');
    return page.render();
}

async function loadView(params) {
    const { default: page } = await import('./pages/view.js');
    return page.render(params);
}

async function loadAdmin() {
    // Protected route: check if user is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.hash = 'home';
        return null;
    }
    const { default: page } = await import('./pages/admin.js');
    return page.render();
}

// --- Router Configuration ---
const routes = {
    'home': loadHome,
    'builder': loadBuilder,
    'discover': loadDiscover,
    'view': loadView,
    'admin': loadAdmin,
};

const appRoot = document.getElementById('app-root');

// --- Router Logic ---
async function router() {
    const url = window.location.hash.slice(1).toLowerCase() || 'home';
    const [path, queryString] = url.split('?');
    
    // Clear previous content
    appRoot.innerHTML = '<h2>Loading...</h2>';

    const routeHandler = routes[path] || routes['home']; // Default to home
    const params = new URLSearchParams(queryString);
    
    try {
        const pageContent = await routeHandler(params);
        if (pageContent) {
            appRoot.innerHTML = ''; // Clear "Loading..."
            appRoot.appendChild(pageContent);
            if (typeof pageContent.afterRender === 'function') {
                pageContent.afterRender();
            }
            if (path !== 'admin') {
                (async () => {
                    try {
                        let uid = null;
                        if (typeof utils.getAnonymizedUserId === 'function') {
                            uid = await utils.getAnonymizedUserId();
                        } else {
                            let local = localStorage.getItem('ld_uid');
                            if (!local) {
                                local = (crypto && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : Math.random().toString(36).slice(2);
                                localStorage.setItem('ld_uid', local);
                            }
                            if (crypto && crypto.subtle && typeof TextEncoder !== 'undefined') {
                                const encoder = new TextEncoder();
                                const data = encoder.encode(local + '|ld_board_builder_v1');
                                const digest = await crypto.subtle.digest('SHA-256', data);
                                const bytes = new Uint8Array(digest);
                                let hex = '';
                                for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
                                uid = hex;
                            } else {
                                uid = local;
                            }
                        }
                        recordAnalyticsEvent({
                            event_type: 'view',
                            board_id: null,
                            view_link: null,
                            user_id: uid,
                            metadata: { route: path, query: Object.fromEntries(params.entries()) }
                        });
                    } catch (_) {}
                })();
            }
        }
    } catch (error) {
        console.error('Error loading page:', error);
        appRoot.innerHTML = '<h2>Error: Could not load page.</h2><p>Please check the console for details.</p>';
        if (path !== 'home') {
            setTimeout(() => window.location.hash = 'home', 3000);
        }
    }

    updateActiveLink(path);
}

function updateActiveLink(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = new URL(link.href).hash.slice(1);
        if (linkPath === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// --- Initialize Router ---
export function initRouter() {
    window.addEventListener('hashchange', router);
    
    // On initial load, if there is no hash, redirect to #home
    if (!window.location.hash) {
        window.location.hash = 'home';
    } else {
        router(); // Initial call to load the page based on the current URL
    }
} 
