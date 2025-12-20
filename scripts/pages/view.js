import { getBoardById, recordAnalyticsEvent } from '../api.js';
import { showInfoModal } from '../components/modal.js';
import * as utils from '../utils.js';

// Screenshot function for view page
async function takeScreenshot(boardElement, mode, title, boardType) {
    // Set fixed size based on mode, matching aspect ratio
    let width, height;
    if (mode === 'guild') {
        width = 600;
        height = 330;
    } else if (mode === 'challenge' && boardType === 'endless') {
        width = 600;
        height = 280; // 3x6 endless mode
    } else if (mode === 'challenge') {
        width = 600;
        height = 420; // 5x6 challenge
    } else {
        width = 600;
        height = 300;
    }

    // Clone the board and set fixed size
    const clone = boardElement.cloneNode(true);
    clone.style.width = width + 'px';
    clone.style.height = height + 'px';
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.zIndex = '-1';
    // Remove background color to make it transparent
    clone.style.backgroundColor = 'transparent';
    document.body.appendChild(clone);

    // SPECIAL HANDLING FOR CHALLENGE MODE SCREENSHOT
    if (mode === 'challenge' && boardType === 'endless') {
        const gridClone = clone.querySelector('.board-grid');
        if (gridClone) {
            gridClone.style.top = '32px';
            gridClone.style.right = '30px'; 
            gridClone.style.bottom = '24px';
            gridClone.style.left = '30px';
            gridClone.style.inset = '32px 30px 24px 30px';
        }
    } else if (mode === 'challenge') {
        const gridClone = clone.querySelector('.board-grid');
        if (gridClone) {
            gridClone.style.top = '22px';
            gridClone.style.right = '30px';
            gridClone.style.bottom = '40px';
            gridClone.style.left = '30px';
            gridClone.style.inset = '22px 30px 40px 30px';
        }
    }

    if (mode === 'guild') {
        const gridClone = clone.querySelector('.board-grid');
        if (gridClone) {
            // Adjust the grid offsets for the screenshot specifically
            // Convert percentage offsets to fixed pixels based on original 400px height
            gridClone.style.top = '24px';    // 400px * 17% = 68px
            gridClone.style.right = '30px';  // 600px * 5% = 30px
            gridClone.style.bottom = '40px'; // 400px * 20% = 80px
            gridClone.style.left = '30px';   // 600px * 5% = 30px
            
            // Override the CSS variable usage with fixed pixel values
            gridClone.style.inset = '22px 30px 40px 30px';
        }
    }
    
    try {
        const canvas = await html2canvas(clone, {
            useCORS: true,
            backgroundColor: null,
            width,
            height,
            scale: 1 // Prevents upscaling on high-DPI screens
        });
        const link = document.createElement('a');
        // Format date as YYYY-MM-DD-HH-mm-ss
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        
        // Use board title in filename if available
        const safeTitle = title ? title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') : 'Board';
        link.download = `${safeTitle}-${dateStr}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error taking screenshot:', error);
        showInfoModal('Error', 'Could not take screenshot. See console for details.');
    } finally {
        document.body.removeChild(clone);
    }
}

const ViewPage = {
    async render(params) {
        const page = document.createElement('div');
        page.className = 'page page-view';
        
        const boardId = params.get('id');
        if (!boardId) {
            page.innerHTML = `<h1 class="h1">Error</h1><p>No board ID provided.</p>`;
            return page;
        }

        page.innerHTML = `<p>Loading board...</p>`;
        
        this.afterRender(page, boardId);
        return page;
    },
    
    async afterRender(page, boardId) {
        try {
            const board = await getBoardById(boardId);
            if (!board) {
                page.innerHTML = `<h1 class="h1">Board Not Found</h1><p>The requested board does not exist or has been deleted.</p>`;
                return;
            }

            const { title, description, created_at, board_data, mode, board_type } = board;
            const units = board_data.units || [];
            const createdAtDate = new Date(created_at).toLocaleString();
            try {
                const userId = await (async () => {
                    if (typeof utils.getAnonymizedUserId === 'function') {
                        return await utils.getAnonymizedUserId();
                    }
                    let uid = localStorage.getItem('ld_uid');
                    if (!uid) {
                        uid = (crypto && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : Math.random().toString(36).slice(2);
                        localStorage.setItem('ld_uid', uid);
                    }
                    if (crypto && crypto.subtle && typeof TextEncoder !== 'undefined') {
                        const encoder = new TextEncoder();
                        const data = encoder.encode(uid + '|ld_board_builder_v1');
                        const digest = await crypto.subtle.digest('SHA-256', data);
                        const bytes = new Uint8Array(digest);
                        let hex = '';
                        for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
                        return hex;
                    }
                    return uid;
                })();
                recordAnalyticsEvent({
                    event_type: 'view',
                    board_id: board.id || null,
                    view_link: board.view_link || null,
                    user_id: userId,
                    metadata: { mode, board_type, page: 'view' }
                });
            } catch (_) {}

            // Determine grid configuration based on mode
            let gridConfig;
            if (mode === 'regular mode') {
                gridConfig = { rows: 3, cols: 6 };
            } else if (mode === 'guild') {
                gridConfig = { rows: 4, cols: 6 };
            } else if (mode === 'challenge') {
                // Check if this is the 'endless' map (3x6) or default challenge (5x6)
                gridConfig = { rows: (board_type === 'endless') ? 3 : 5, cols: 6 };
            }

            // Update path construction for map images
            const modePath = mode === 'regular mode' ? 'regular mode' : 
                            mode === 'guild' ? 'guild' : 
                            'challenge'; // New path for challenge mode
            const mapImage = `assets/boards/${modePath}/${board_type}.webp`.replace(/ /g, '%20');

            const isGuild = mode === 'guild';
            const isChallenge = mode === 'challenge';
            const backgroundSize = (isGuild || isChallenge) ? 'contain' : 'cover';
            const aspectRatio = isGuild ? '6 / 4' : isChallenge ? '6 / 5' : '6 / 3'; // Updated aspect ratios

            // Set the page HTML before selecting the grid
            page.innerHTML = `
                <div class="view-header container">
                    <h1 class="h1">${title || 'Anonymous Board'}</h1>
                    <p class="meta">Created on ${createdAtDate}</p>
                    ${description ? `<p class="description">${description}</p>` : ''}
                </div>

                <div id="board-area-view" class="container mt-lg">
                    <div class="board-wrapper" style="background-image: url('${mapImage}'); background-size: ${backgroundSize}; background-position: center; background-repeat: no-repeat; position: relative; width: 100%; max-width: 600px; aspect-ratio: ${aspectRatio}; margin: 0 auto; background-color: var(--color-surface-2);">
                        <div class="board-grid"></div>
                    </div>
                </div>

                <div class="view-actions container mt-lg text-center">
                    <button id="screenshot-btn" class="btn btn-primary">Take Screenshot</button>
                    <a href="#builder" class="btn btn-primary">Create Your Own Board</a>
                </div>
            `;

            // Now select the grid from the newly set HTML
            const boardGrid = page.querySelector('.board-grid');
            boardGrid.dataset.mode = mode;
            
            // Apply percent-based grid offsets for alignment
            if (mode === 'regular mode' && board_type === 'hell') {
                boardGrid.style.setProperty('--grid-offset-top', '10%');
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '18%');
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            } else if (mode === 'regular mode') {
                boardGrid.style.setProperty('--grid-offset-top', '6%');
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '20%');
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            } else if (mode === 'guild') {
                boardGrid.style.setProperty('--grid-offset-top', '17%');
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '20%');
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            } else if (mode === 'challenge' && board_type === 'endless') {
                // Endless mode (3x6) - use similar offsets to regular mode
                boardGrid.style.setProperty('--grid-offset-top', '28%');
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '28%');
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            } else if (mode === 'challenge') {
                // Default challenge mode (5x6)
                boardGrid.style.setProperty('--grid-offset-top', '13%');
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '16%');
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            }

            boardGrid.style.position = 'absolute';
            boardGrid.style.inset = 'var(--grid-offset-top) var(--grid-offset-right) var(--grid-offset-bottom) var(--grid-offset-left)';
            boardGrid.style.width = 'auto';
            boardGrid.style.height = 'auto';
            boardGrid.style.display = 'grid';
            boardGrid.style.gridTemplateColumns = `repeat(${gridConfig.cols}, 1fr)`;
            boardGrid.style.gridTemplateRows = `repeat(${gridConfig.rows}, 1fr)`;
            boardGrid.style.backgroundSize = `calc(100% / ${gridConfig.cols}) calc(100% / ${gridConfig.rows})`;

            // Build a lookup for units by position
            const unitLookup = {};
            for (const unit of units) {
                const cols = gridConfig.cols;
                const col = unit.position % cols;
                const row = Math.floor(unit.position / cols);
                unitLookup[`${col}-${row}`] = unit;
            }

            for (let r = 0; r < gridConfig.rows; r++) {
                for (let c = 0; c < gridConfig.cols; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    const positionKey = `${c}-${r}`;
                    if (unitLookup[positionKey]) {
                        const unitDiv = document.createElement('div');
                        unitDiv.className = 'unit-on-board';
                        unitDiv.style.backgroundImage = `url(${unitLookup[positionKey].imagePath})`;
                        cell.appendChild(unitDiv);
                    }
                    boardGrid.appendChild(cell);
                }
            }

            // Add event listener for screenshot button
            const screenshotBtn = page.querySelector('#screenshot-btn');
            const boardElement = page.querySelector('.board-wrapper');
            screenshotBtn.addEventListener('click', () => {
                takeScreenshot(boardElement, mode, title, board_type);
                (async () => {
                    const userId = await (async () => {
                        if (typeof utils.getAnonymizedUserId === 'function') {
                            return await utils.getAnonymizedUserId();
                        }
                        let uid = localStorage.getItem('ld_uid');
                        if (!uid) {
                            uid = (crypto && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : Math.random().toString(36).slice(2);
                            localStorage.setItem('ld_uid', uid);
                        }
                        if (crypto && crypto.subtle && typeof TextEncoder !== 'undefined') {
                            const encoder = new TextEncoder();
                            const data = encoder.encode(uid + '|ld_board_builder_v1');
                            const digest = await crypto.subtle.digest('SHA-256', data);
                            const bytes = new Uint8Array(digest);
                            let hex = '';
                            for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
                            return hex;
                        }
                        return uid;
                    })();
                    recordAnalyticsEvent({
                        event_type: 'download',
                        board_id: board.id || null,
                        view_link: board.view_link || null,
                        user_id: userId,
                        metadata: { mode, board_type, page: 'view' }
                    });
                })();
            });

        } catch (error) {
            console.error('Failed to load view page:', error);
            page.innerHTML = `<h1 class="h1">Error</h1><p>Could not load the board. Please try again later.</p>`;
        }
    }
};

export default ViewPage; 
