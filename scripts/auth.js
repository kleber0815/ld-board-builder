import { supabase } from './supabase.js';
import { createModal, showModal, showInfoModal } from './components/modal.js';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimeoutId = null;

function updateNavUI(isLoggedIn) {
    const adminLink = document.getElementById('admin-link');
    const logoutLink = document.getElementById('logout-link');

    if (isLoggedIn) {
        adminLink.style.display = 'block';
        logoutLink.style.display = 'block';
    } else {
        adminLink.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    } else {
        clearTimeout(sessionTimeoutId);
        updateNavUI(false);
        window.location.hash = 'home'; // Redirect to home on logout
    }
}

function startSessionTimeout() {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = setTimeout(() => {
        showInfoModal('Session Expired', 'Your session has expired. You have been logged out.');
        handleLogout();
    }, SESSION_TIMEOUT);
}

function showLoginModal() {
    const modalContent = document.createElement('form');
    modalContent.id = 'login-form';
    modalContent.innerHTML = `
        <div class="form-group">
            <input type="email" placeholder="Email" id="email" required autocomplete="email">
        </div>
        <div class="form-group">
            <input type="password" id="password" placeholder="Password" required autocomplete="current-password">
        </div>
        <p id="login-error" class="text-danger" style="display:none;"></p>
        <button type="submit" class="btn btn-primary" style="width:100%;">Login</button>
    `;

    const loginModal = createModal('Login', modalContent, 'login-modal');
    showModal(loginModal);

    modalContent.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const errorEl = loginModal.querySelector('#login-error');
        errorEl.style.display = 'none';

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('Login failed:', error.message);
            errorEl.textContent = 'Login failed. Please check your credentials.';
            errorEl.style.display = 'block';
        } else if (data.user) {
            updateNavUI(true);
            startSessionTimeout();
            loginModal.querySelector('.modal-close').click(); // Close modal on success
        }
    });
}

export function initAuth() {
    // Check initial auth state
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            updateNavUI(true);
            startSessionTimeout();
        } else if (event === 'SIGNED_OUT') {
            updateNavUI(false);
            clearTimeout(sessionTimeoutId);
        }
    });

    // Check if a user is already logged in on page load
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
            updateNavUI(true);
            startSessionTimeout();
        } else {
            updateNavUI(false);
        }
    });

    // Setup logout button
    const logoutLink = document.getElementById('logout-link');
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Setup Ctrl+M shortcut for login
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            showLoginModal();
        }
    });

    // Long-press on burger menu icon (mobile) to open admin login modal
    const navToggle = document.querySelector('.nav-toggle');
    let longPressTimer = null;
    if (navToggle) {
        navToggle.addEventListener('touchstart', (e) => {
            if (longPressTimer) clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => {
                // Only show if not already logged in
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (!user) showLoginModal();
                });
            }, 2000); // 2 seconds
        });
        navToggle.addEventListener('touchend', () => {
            if (longPressTimer) clearTimeout(longPressTimer);
        });
        navToggle.addEventListener('touchmove', () => {
            if (longPressTimer) clearTimeout(longPressTimer);
        });
    }
} 