/**
 * Creates a modal element and appends it to the modal container.
 * @param {string} title - The title of the modal.
 * @param {HTMLElement} content - The HTML element to be used as the modal's body.
 * @param {string} id - A unique ID for the modal overlay.
 * @returns {HTMLElement} The created modal overlay element.
 */
export function createModal(title, content, id) {
    const modalContainer = document.getElementById('modal-container');
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = id;

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
                <button class="modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body"></div>
        </div>
    `;

    modal.querySelector('.modal-body').appendChild(content);
    modalOverlay.appendChild(modal);

    // Close modal logic
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        // Remove the modal from the DOM after the transition ends
        setTimeout(() => modalOverlay.remove(), 300);
    };

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    modalContainer.appendChild(modalOverlay);
    return modalOverlay;
}

/**
 * Shows a modal element by adding the 'active' class.
 * @param {HTMLElement} modalOverlay - The modal overlay element to show.
 */
export function showModal(modalOverlay) {
    // Timeout to allow the element to be in the DOM before adding the class for transition
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
}

/**
 * Shows a confirmation modal.
 * @param {string} title - The title of the confirmation dialog.
 * @param {string} message - The message to display.
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
 */
export function showConfirmModal(title, message) {
    return new Promise(resolve => {
        const confirmContent = document.createElement('div');
        confirmContent.innerHTML = `
            <p>${message}</p>
            <div class="d-flex justify-center gap-md mt-lg">
                <button id="confirm-btn-cancel" class="btn btn-secondary">Cancel</button>
                <button id="confirm-btn-ok" class="btn btn-danger">Confirm</button>
            </div>
        `;
        const confirmModal = createModal(title, confirmContent, 'confirm-modal');
        showModal(confirmModal);

        const close = (result) => {
            confirmModal.querySelector('.modal-close').click();
            resolve(result);
        };

        confirmModal.querySelector('#confirm-btn-ok').onclick = () => close(true);
        confirmModal.querySelector('#confirm-btn-cancel').onclick = () => close(false);
    });
}

/**
 * Shows an informational modal.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message to display.
 */
export function showInfoModal(title, message) {
    const infoContent = document.createElement('div');
    infoContent.innerHTML = `
        <p>${message}</p>
        <div class="d-flex justify-center mt-lg">
            <button id="info-btn-ok" class="btn btn-primary">OK</button>
        </div>
    `;
    const infoModal = createModal(title, infoContent, 'info-modal');
    showModal(infoModal);

    infoModal.querySelector('#info-btn-ok').onclick = () => {
        infoModal.querySelector('.modal-close').click();
    };
} 