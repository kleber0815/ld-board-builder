// This is a large module, so we'll structure it clearly.
import { addBoard } from '../api.js';
import { createModal, showModal, showInfoModal } from '../components/modal.js';

// --- Module State ---
let currentMode = 'regular mode'; // 'regular' or 'guild'
let currentMap = 'normal'; // e.g., 'god', 'hard', etc.
let boardState = {}; // { 'x-y': { unit, img }, ... }
let unitData = {}; // To be loaded from JSON
let selectedUnit = null;

// --- Constants ---
const REGULAR_GRID = { rows: 3, cols: 6 };
const GUILD_GRID = { rows: 5, cols: 6 };
const MAPS = {
    'regular mode': [
        { id: 'normal', name: 'Normal', img: 'assets/boards/regular mode/normal.webp' },
        { id: 'hard', name: 'Hard', img: 'assets/boards/regular mode/hard.webp' },
        { id: 'hell', name: 'Hell', img: 'assets/boards/regular mode/hell.webp' },
        { id: 'god', name: 'God', img: 'assets/boards/regular mode/god.webp' },
        { id: 'primeval', name: 'Primeval', img: 'assets/boards/regular mode/primeval.webp' },
    ],
    guild: [
        { id: 'graid', name: 'Guild Raid', img: 'assets/boards/guild battle/graid.webp' },
        { id: 'gbboard', name: 'Guild Battle', img: 'assets/boards/guild battle/gbboard.webp' }
    ]
};

// --- DOM Elements (to be assigned in render) ---
let pageElement, boardGrid, unitPalette, boardArea, mapSelectionContainer;

// --- Core Functions ---

/** Fetches unit data from the JSON file */
async function loadUnitData() {
    if (Object.keys(unitData).length > 0) return;
    try {
        const response = await fetch('./units.json');
        unitData = await response.json();
    } catch (error) {
        console.error("Failed to load unit data:", error);
    }
}

/** Renders the unit selection palette as tabs */
function renderUnitPalette() {
    unitPalette.innerHTML = ''; // Clear previous content

    const CATEGORY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic', 'immortal'];

    const tabList = document.createElement('div');
    tabList.className = 'unit-tabs';

    const tabPanels = document.createElement('div');
    tabPanels.className = 'unit-tab-panels';

    let isFirstTab = true;

    CATEGORY_ORDER.forEach(category => {
        if (!unitData[category]) return; // Skip if category doesn't exist in data

        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = category;
        tabButton.dataset.category = category;

        // Create tab panel
        const tabPanel = document.createElement('div');
        tabPanel.className = 'tab-panel';
        tabPanel.dataset.category = category;

        const unitsContainer = document.createElement('div');
        unitsContainer.className = 'unit-list';
        
        unitData[category].forEach(unit => {
            const unitEl = document.createElement('img');
            unitEl.src = unit.img;
            unitEl.alt = unit.label;
            unitEl.title = unit.label;
            unitEl.className = 'unit-selector';
            unitEl.dataset.unitName = unit.name;
            unitEl.dataset.rarity = category; // Add data-rarity for styling
            unitEl.loading = 'lazy';
            unitEl.addEventListener('click', () => {
                document.querySelectorAll('.unit-selector').forEach(u => u.classList.remove('selected'));
                unitEl.classList.add('selected');
                selectedUnit = unit;
            });
            unitsContainer.appendChild(unitEl);
        });
        
        tabPanel.appendChild(unitsContainer);
        
        if (isFirstTab) {
            tabButton.classList.add('active');
            tabPanel.classList.add('active');
            isFirstTab = false;
        }
        
        tabList.appendChild(tabButton);
        tabPanels.appendChild(tabPanel);
    });

    unitPalette.appendChild(tabList);
    unitPalette.appendChild(tabPanels);

    // Add event listener for tab switching
    tabList.addEventListener('click', (e) => {
        if (e.target.matches('.tab-button')) {
            const category = e.target.dataset.category;
            
            // Update button active state
            tabList.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Update panel active state
            tabPanels.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            tabPanels.querySelector(`.tab-panel[data-category="${category}"]`).classList.add('active');
        }
    });
}

/** Renders the board grid based on the current mode */
function renderBoardGrid() {
    const gridConfig = currentMode === 'regular mode' ? REGULAR_GRID : GUILD_GRID;
    const mapData = MAPS[currentMode].find(m => m.id === currentMap);
    const mapImageEl = boardArea.querySelector('.map-image');

    // Show loading state for grid
    boardGrid.innerHTML = '<p>Loading map...</p>';

    // Function to render the grid content
    const renderGridContent = () => {
        // Clear and configure the grid overlay now that the image is loaded
        boardGrid.innerHTML = '';
        boardGrid.className = 'board-grid';
        boardGrid.dataset.mode = currentMode;
        boardGrid.style.gridTemplateColumns = `repeat(${gridConfig.cols}, 1fr)`;
        boardGrid.style.gridTemplateRows = `repeat(${gridConfig.rows}, 1fr)`;

        // Set grid offsets for regular/guild, and special case for 'hell'
        if (currentMode === 'regular mode' && currentMap === 'hell') {
            boardGrid.style.setProperty('--grid-offset-top', '10%'); // 6% + 4%
            boardGrid.style.setProperty('--grid-offset-right', '5%');
            boardGrid.style.setProperty('--grid-offset-bottom', '18%'); // 20% - 2%
            boardGrid.style.setProperty('--grid-offset-left', '5%');
        } else if (currentMode === 'regular mode') {
            boardGrid.style.setProperty('--grid-offset-top', '6%');
            boardGrid.style.setProperty('--grid-offset-right', '5%');
            boardGrid.style.setProperty('--grid-offset-bottom', '20%');
            boardGrid.style.setProperty('--grid-offset-left', '5%');
        } else {
            boardGrid.style.setProperty('--grid-offset-top', '8%');
            boardGrid.style.setProperty('--grid-offset-right', '5%');
            boardGrid.style.setProperty('--grid-offset-bottom', '11%');
            boardGrid.style.setProperty('--grid-offset-left', '5%');
        }

        for (let r = 0; r < gridConfig.rows; r++) {
            for (let c = 0; c < gridConfig.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                const positionKey = `${c}-${r}`;
                if (boardState[positionKey]) {
                    const unitDiv = document.createElement('div');
                    unitDiv.className = 'unit-on-board';
                    unitDiv.style.backgroundImage = `url(${boardState[positionKey].img})`;
                    cell.appendChild(unitDiv);
                }

                cell.addEventListener('click', () => handleCellClick(cell, positionKey));
                cell.addEventListener('contextmenu', (e) => handleCellRightClick(e, cell, positionKey));
                boardGrid.appendChild(cell);
            }
        }
    };

    const handleImageError = () => {
        boardGrid.innerHTML = '<p class="text-danger">Failed to load map image.</p>';
    };

    // Clean up any existing event listeners to prevent memory leaks
    mapImageEl.removeEventListener('load', renderGridContent);
    mapImageEl.removeEventListener('error', handleImageError);
    
    // Check if the image we want is already loaded
    if (mapImageEl.src.endsWith(mapData.img.split('/').pop()) && mapImageEl.complete && mapImageEl.naturalHeight !== 0) {
        // Same image is already loaded, render immediately
        renderGridContent();
    } else {
        // Set up new event listeners
        mapImageEl.addEventListener('load', renderGridContent, { once: true });
        mapImageEl.addEventListener('error', handleImageError, { once: true });
        
        // Set the map image source to trigger loading
        mapImageEl.src = mapData.img;
    }
    
    // Set the alt text regardless of loading state
    mapImageEl.alt = `Map: ${mapData.name}`;
}

/** Clears all units from the board state and re-renders the grid */
function clearBoard() {
    boardState = {};
    renderBoardGrid();
}

// --- Event Handlers ---
function handleModeChange(newMode) {
    if (currentMode === newMode) return;
    currentMode = newMode;

    // Show map selection if there are multiple maps for the current mode
    if (MAPS[currentMode].length > 1) {
        mapSelectionContainer.style.display = 'block';
    } else {
        mapSelectionContainer.style.display = 'none';
    }

    // Set default map for the new mode and clear the board
    currentMap = MAPS[currentMode][0].id;
    clearBoard();
    renderMapButtons(); // Update map selection UI
    renderBoardGrid();
}

function handleMapChange(newMap) {
    if (currentMap === newMap) return;
    currentMap = newMap;
    renderBoardGrid(); // Re-render with new map bg, but keep units
}

function handleCellClick(cell, positionKey) {
    if (selectedUnit) {
        // Place or replace unit
        boardState[positionKey] = selectedUnit;
        cell.innerHTML = ''; // Clear previous unit
        const unitDiv = document.createElement('div');
        unitDiv.className = 'unit-on-board';
        unitDiv.style.backgroundImage = `url(${selectedUnit.img})`;
        cell.appendChild(unitDiv);
    }
}

function handleCellRightClick(e, cell, positionKey) {
    e.preventDefault();
    if (boardState[positionKey]) {
        delete boardState[positionKey];
        cell.innerHTML = '';
    }
}

/** Renders map selection buttons for the current mode */
function renderMapButtons() {
    const container = pageElement.querySelector('#map-selection');
    container.innerHTML = '';
    MAPS[currentMode].forEach(map => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.textContent = map.name;
        if (map.id === currentMap) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            handleMapChange(map.id);
            // Update active state on buttons
            container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        container.appendChild(btn);
    });
}

// --- Actions (Screenshot & Share) ---

async function takeScreenshot() {
    const boardElement = pageElement.querySelector('.board-wrapper');
    // Determine mode and set target size
    const isGuild = (currentMode === 'guild');
    const width = 600;
    const height = isGuild ? 420 : 300;

    // Clone the board and set fixed size
    const clone = boardElement.cloneNode(true);
    clone.style.width = width + 'px';
    clone.style.height = height + 'px';
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.zIndex = '-1';
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
        link.download = `Board-${dateStr}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error taking screenshot:', error);
        showInfoModal('Error', 'Could not take screenshot. See console for details.');
    } finally {
        document.body.removeChild(clone);
    }
}

function shareBoard() {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
        <div class="form-group">
            <label for="board-title">Title (optional)</label>
            <input type="text" id="board-title" maxlength="18" placeholder="My Awesome Board">
            <span class="char-counter" id="title-counter">0/18</span>
        </div>
        <div class="form-group">
            <label for="board-description">Description (optional)</label>
            <textarea id="board-description" maxlength="500" placeholder="A brief description of my strategy..."></textarea>
            <span class="char-counter" id="desc-counter">0/500</span>
        </div>
        <button id="submit-share" class="btn btn-primary" style="width: 100%;">Share Now</button>
    `;
    
    const shareModal = createModal('Share Your Board', modalContent, 'share-modal');
    showModal(shareModal);

    // Add character counters logic
    const titleInput = shareModal.querySelector('#board-title');
    const descInput = shareModal.querySelector('#board-description');
    titleInput.addEventListener('input', () => shareModal.querySelector('#title-counter').textContent = `${titleInput.value.length}/18`);
    descInput.addEventListener('input', () => shareModal.querySelector('#desc-counter').textContent = `${descInput.value.length}/500`);

    // Handle submission
    shareModal.querySelector('#submit-share').addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.textContent = 'Sharing...';

        try {
            // Transform the boardState object into a clean 'units' array
            const units = Object.entries(boardState).map(([positionKey, unit]) => {
                const [c, r] = positionKey.split('-').map(Number);
                const position = c + (r * 6); // Convert col/row to a single index
                return {
                    id: unit.name.toLowerCase(), // Use the unit's name as a simple ID
                    name: unit.label,
                    position: position,
                    imagePath: unit.img
                };
            });

            const newBoard = {
                title: titleInput.value || null,
                description: descInput.value || null,
                board_type: currentMap,
                mode: currentMode,
                view_link: Math.random().toString(36).substring(2, 10),
                board_data: { units }
            };

            const result = await addBoard(newBoard);
            
            // Show success modal with link
            const linkContent = document.createElement('div');
            // Construct URL correctly, removing any trailing slash before the hash.
            const baseUrl = window.location.href.split('#')[0].replace(/\/$/, '');
            const viewUrl = `${baseUrl}/#view?id=${result.view_link}`;
            
            linkContent.innerHTML = `
                <div class="form-group mt-lg">
                    <label>Your unique link:</label>
                    <input type="text" readonly value="${viewUrl}" id="share-link-input">
                </div>
                <button id="copy-link-btn" class="btn btn-secondary">Copy Link</button>
            `;
            const linkModal = createModal('', linkContent, 'link-modal');
            shareModal.remove(); // Remove the previous modal
            showModal(linkModal);

            linkModal.querySelector('#copy-link-btn').addEventListener('click', (btnE) => {
                navigator.clipboard.writeText(viewUrl);
                linkModal.remove(); // Close modal on copy
            });

        } catch (error) {
            console.error('Failed to share board:', error);
            showInfoModal('Error', 'An error occurred while sharing. Please try again.');
            e.target.disabled = false;
            e.target.textContent = 'Share Now';
        }
    });
}

// --- Page Object ---
const BuilderPage = {
    async render() {
        // Always reset all state variables to default when rendering the Builder page
        currentMode = 'regular mode';
        currentMap = 'normal';
        boardState = {};
        selectedUnit = null;
        pageElement = document.createElement('div');
        pageElement.className = 'page page-builder';
        pageElement.innerHTML = `
            <div class="builder-controls container mt-lg">
                <div class="control-group">
                    <h3>Game Mode</h3>
                    <div id="mode-selection">
                        <button class="btn btn-secondary active" data-mode="regular mode">Co-op Modes</button>
                        <button class="btn btn-secondary" data-mode="guild">Guild Modes</button>
                    </div>
                </div>
                <div class="control-group" data-control="map-selection">
                    <h3>Map Selection</h3>
                    <div id="map-selection">
                        <!-- Map buttons will be rendered here -->
                    </div>
                </div>
            </div>

            <div class="unit-palette-container container mt-lg">
                <h2 class="h2 text-center">Units</h2>
                <div id="unit-palette">Loading units...</div>
            </div>

            <div id="board-area" class="container mt-lg">
                <div class="board-wrapper">
                    <img class="map-image" src="" alt="Selected map">
                    <div id="board-grid"></div>
                </div>
            </div>

            <div class="builder-actions container mt-lg text-center">
                <button id="screenshot-btn" class="btn btn-primary">Take a Screenshot</button>
                <button id="share-btn" class="btn btn-primary">Share Your Board</button>
            </div>
        `;

        this.afterRender(pageElement);
        return pageElement;
    },

    async afterRender(page) {
        // Assign DOM elements
        boardGrid = page.querySelector('#board-grid');
        unitPalette = page.querySelector('#unit-palette');
        boardArea = page.querySelector('#board-area');
        mapSelectionContainer = page.querySelector('[data-control="map-selection"]');

        // Initial setup
        await loadUnitData();
        renderUnitPalette();
        renderMapButtons();
        renderBoardGrid();
        
        // Add event listeners
        page.querySelector('#mode-selection').addEventListener('click', (e) => {
            if(e.target.matches('button[data-mode]')) {
                const newMode = e.target.dataset.mode;
                handleModeChange(newMode);
                page.querySelectorAll('#mode-selection button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        page.querySelector('#screenshot-btn').addEventListener('click', takeScreenshot);
        page.querySelector('#share-btn').addEventListener('click', shareBoard);
    }
};

export default BuilderPage; 