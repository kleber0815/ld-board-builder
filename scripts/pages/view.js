import { getBoardById } from '../api.js';
import { showInfoModal } from '../components/modal.js';

// Screenshot function for view page
async function takeScreenshot(boardElement, mode, title) {
    // Set fixed size based on mode, matching aspect ratio
    let width, height;
    if (mode === 'guild') {
        width = 600;
        height = 500; // 6:5 aspect ratio
    } else {
        width = 600;
        height = 300; // 2:1 aspect ratio
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

            // Determine grid configuration and map image based on mode
            const gridConfig = mode === 'regular mode' ? { rows: 3, cols: 6 } : { rows: 5, cols: 6 };
            // Encode spaces in the path for the background image
            const mapImage = `assets/boards/${mode === 'regular mode' ? 'regular mode' : 'guild battle'}/${board_type}.webp`.replace(/ /g, '%20');

            const isGuild = mode === 'guild';
            const backgroundSize = isGuild ? 'contain' : 'cover';
            const aspectRatio = isGuild ? '6 / 5' : '6 / 3';

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
                boardGrid.style.setProperty('--grid-offset-top', '10%'); // 6% + 4%
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '18%'); // 20% - 2%
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            } else if (mode === 'regular mode') {
                boardGrid.style.setProperty('--grid-offset-top', '6%');
                boardGrid.style.setProperty('--grid-offset-right', '5%');
                boardGrid.style.setProperty('--grid-offset-bottom', '20%');
                boardGrid.style.setProperty('--grid-offset-left', '5%');
            } else {
                boardGrid.style.setProperty('--grid-offset-top', '14%');
                boardGrid.style.setProperty('--grid-offset-right', '4%');
                boardGrid.style.setProperty('--grid-offset-bottom', '16%');
                boardGrid.style.setProperty('--grid-offset-left', '4%');
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
                takeScreenshot(boardElement, mode, title);
            });

        } catch (error) {
            console.error('Failed to load view page:', error);
            page.innerHTML = `<h1 class="h1">Error</h1><p>Could not load the board. Please try again later.</p>`;
        }
    }
};

export default ViewPage; 