import { getAdminBoards, updateBoard, deleteBoard, getAnalyticsEvents } from '../api.js';
import { createBoardCard } from '../components/boardCard.js';
import { createModal, showModal, showConfirmModal, showInfoModal } from '../components/modal.js';
import { debounce } from '../utils.js';

let allBoards = [];
let pageElement;
let analyticsRefreshTimer = null;

const maps = {
    "Regular Maps": [
        { id: 'normal', name: 'Normal' },
        { id: 'hard', name: 'Hard' },
        { id: 'hell', name: 'Hell' },
        { id: 'god', name: 'God' },
        { id: 'primeval', name: 'Primeval' }
    ],
    "Guild Maps": [
        { id: 'graid', name: 'Guild Raid' }
    ],
    "Challange Maps": [
        { id: 'extreme', name: 'Extreme' },
        { id: 'endless', name: 'Endless' }
    ]
};
const mapFilterCheckboxes = Object.entries(maps).map(([category, mapList]) => `
    <div class="map-filter-category">
        <strong>${category}</strong>
        ${mapList.map(map => `
            <div class="form-check">
                <input type="checkbox" id="admin-map-${map.id}" name="mapFilter" value="${map.id}" checked>
                <label for="admin-map-${map.id}">${map.name}</label>
            </div>
        `).join('')}
    </div>
`).join('');

async function loadAndRenderBoards() {
    const grid = pageElement.querySelector('#admin-boards-grid');
    grid.innerHTML = '<p>Loading boards...</p>';
    try {
        allBoards = await getAdminBoards();
        grid.innerHTML = '';
        if (allBoards.length > 0) {
            const cardPromises = allBoards.map(board => createBoardCard(board, true));
            const cards = await Promise.all(cardPromises);
            cards.forEach(card => grid.appendChild(card));
        } else {
            grid.innerHTML = '<p>No boards found.</p>';
        }
    } catch (error) {
        grid.innerHTML = '<p class="text-danger">Failed to load boards.</p>';
        console.error(error);
    }
}

function handleEdit(boardId) {
    const board = allBoards.find(b => b.id === boardId);
    if (!board) return;

    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
        <div class="form-group">
            <label for="edit-board-title">Title</label>
            <input type="text" id="edit-board-title" maxlength="18" value="${board.title || ''}">
        </div>
        <div class="form-group">
            <label for="edit-board-description">Description</label>
            <textarea id="edit-board-description" maxlength="500">${board.description || ''}</textarea>
        </div>
        <button id="submit-edit" class="btn btn-primary" style="width: 100%;">Save Changes</button>
    `;
    const editModal = createModal('Edit Board', modalContent, `edit-modal-${boardId}`);
    showModal(editModal);

    editModal.querySelector('#submit-edit').addEventListener('click', async () => {
        const newTitle = editModal.querySelector('#edit-board-title').value;
        const newDescription = editModal.querySelector('#edit-board-description').value;

        try {
            await updateBoard(boardId, { title: newTitle, description: newDescription });
            editModal.querySelector('.modal-close').click();
            loadAndRenderBoards(); // Refresh the list
        } catch (error) {
            showInfoModal('Error', 'Failed to update board. See console for details.');
            console.error(error);
        }
    });
}

async function handleDelete(boardId) {
    const confirmed = await showConfirmModal('Delete Board', 'Are you sure you want to delete this board? This action cannot be undone.');
    if (confirmed) {
        try {
            await deleteBoard(boardId);
            loadAndRenderBoards(); // Refresh the list
        } catch (error) {
            showInfoModal('Error', 'Failed to delete board. See console for details.');
            console.error(error);
        }
    }
}

const AdminPage = {
    async render() {
        allBoards = [];
        pageElement = null;
        pageElement = document.createElement('div');
        pageElement.className = 'page page-admin';
        pageElement.innerHTML = `
            <div class="admin-header container">
                <h1 class="h1">Admin Panel</h1>
                <div class="admin-tabs">
                    <button class="admin-tab btn btn-secondary active" data-tab="boards">Board Management</button>
                    <button class="admin-tab btn btn-secondary" data-tab="analytics">Analytics Dashboard</button>
                </div>
            </div>
            <section class="container mt-lg admin-tab-content" data-tab-content="analytics" style="display:none;">
                <div class="analytics-dashboard">
                    <div class="filters filters-centered">
                        <div class="form-group">
                            <select id="analytics-range">
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="all">All time</option>
                            <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div class="form-group custom-range">
                            <input type="date" id="analytics-from" style="display:none;">
                            <input type="date" id="analytics-to" style="display:none;">
                        </div>
                        <div class="form-group">
                            <button id="analytics-apply" class="btn btn-secondary">Apply</button>
                        </div>
                    </div>
                    <div class="summary">
                        <div class="summary-item">
                            <div class="summary-label">Total Views (All-time)</div>
                            <div class="summary-value" id="metric-total-views-all">0</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Views (Selected)</div>
                            <div class="summary-value" id="metric-total-views">0</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Unique Views</div>
                            <div class="summary-value" id="metric-unique-views">0</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Downloads</div>
                            <div class="summary-value" id="metric-total-downloads">0</div>
                        </div>
                    </div>
                    <div class="breakdown">
                        <h3>Top Boards by Views</h3>
                        <div class="chart" id="views-chart"></div>
                        <div class="empty" id="views-empty" style="display:none;">No view data available for the selected period.</div>
                        <h3 style="margin-top: var(--space-md);">Top Boards by Downloads</h3>
                        <div class="chart" id="downloads-chart"></div>
                        <div class="empty" id="downloads-empty" style="display:none;">No download data available for the selected period.</div>
                    </div>
                    <div class="loading" id="analytics-loading" style="display:none;">Loading analytics...</div>
                </div>
            </section>
            <section class="container mt-lg admin-tab-content" data-tab-content="boards">
                <div class="admin-filters">
                    <div class="filter-group">
                        <div class="form-group search-bar">
                            <input type="search" id="admin-search-title" placeholder="Search by Title...">
                        </div>
                        <details class="filter-dropdown">
                            <summary>Filter by Map</summary>
                            <div class="filter-dropdown-content">
                                ${mapFilterCheckboxes}
                            </div>
                        </details>
                    </div>
                </div>
                <div id="admin-boards-grid" class="grid-container mt-lg"></div>
            </section>
        `;
        const style = document.createElement('style');
        style.textContent = `
            .admin-tabs { display: flex; gap: var(--space-sm); margin-top: var(--space-md); justify-content: center; }
            .analytics-dashboard { margin-top: var(--space-md); }
            .analytics-dashboard .filters { display: flex; gap: var(--space-sm); align-items: center; flex-wrap: wrap; justify-content: center; background: var(--color-surface-secondary); padding: var(--space-sm); border-radius: var(--radius-md); }
            .analytics-dashboard .filters .form-group select,
            .analytics-dashboard .filters .form-group input[type="date"] { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); padding: var(--space-sm); border-radius: var(--radius-sm); }
            .custom-range { display: flex; gap: var(--space-sm); }
            .analytics-dashboard .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-sm); margin-top: var(--space-sm); }
            .summary-item { background: var(--color-surface-secondary); padding: var(--space-md); border-radius: var(--radius-md); }
            .summary-label { color: var(--color-text-muted); font-size: 0.9rem; }
            .summary-value { font-size: 1.5rem; font-weight: 700; }
            .breakdown { margin-top: var(--space-md); }
            .chart { display: grid; gap: 8px; margin-top: var(--space-sm); }
            .chart-bar { position: relative; background: var(--color-surface-secondary); border-radius: var(--radius-sm); padding: 8px; }
            .chart-bar::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: var(--bar-width, 0%); background: var(--color-primary); opacity: 0.25; border-radius: var(--radius-sm); }
            .bar-label { position: relative; z-index: 1; }
            .bar-value { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); z-index: 1; }
            @media (max-width: 768px) {
                .analytics-dashboard .summary { grid-template-columns: 1fr 1fr; }
            }
        `;
        pageElement.prepend(style);

        this.afterRender(pageElement);
        return pageElement;
    },

    async afterRender(page) {
        let filteredBoards = [];
        const grid = page.querySelector('#admin-boards-grid');
        const searchInput = page.querySelector('#admin-search-title');
        const filterDropdown = page.querySelector('.filter-dropdown-content');
        const rangeSelect = page.querySelector('#analytics-range');
        const fromInput = page.querySelector('#analytics-from');
        const toInput = page.querySelector('#analytics-to');
        const applyBtn = page.querySelector('#analytics-apply');
        const totalViewsAllEl = page.querySelector('#metric-total-views-all');
        const totalViewsEl = page.querySelector('#metric-total-views');
        const uniqueViewsEl = page.querySelector('#metric-unique-views');
        const totalDownloadsEl = page.querySelector('#metric-total-downloads');
        const viewsChart = page.querySelector('#views-chart');
        const downloadsChart = page.querySelector('#downloads-chart');
        const viewsEmpty = page.querySelector('#views-empty');
        const downloadsEmpty = page.querySelector('#downloads-empty');
        const analyticsLoading = page.querySelector('#analytics-loading');
        const tabs = page.querySelectorAll('.admin-tab');
        const tabContents = page.querySelectorAll('.admin-tab-content');

        // Load all boards once
        allBoards = await getAdminBoards();

        function showTab(name) {
            tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
            tabContents.forEach(c => {
                const tabName = c.dataset.tabContent || c.getAttribute('data-tab-content');
                c.style.display = tabName === name ? '' : 'none';
            });
            if (name === 'analytics') {
                startAnalyticsRefresh();
            } else {
                stopAnalyticsRefresh();
            }
        }

        tabs.forEach(t => {
            t.addEventListener('click', () => showTab(t.dataset.tab));
        });

        function startAnalyticsRefresh() {
            stopAnalyticsRefresh();
            refreshAnalytics();
            analyticsRefreshTimer = setInterval(refreshAnalytics, 30000);
        }
        function stopAnalyticsRefresh() {
            if (analyticsRefreshTimer) {
                clearInterval(analyticsRefreshTimer);
                analyticsRefreshTimer = null;
            }
        }

        function computeDateRange() {
            const now = new Date();
            let from = null;
            let to = now.toISOString();
            const val = rangeSelect.value;
            if (val === '24h') {
                const d = new Date(now);
                d.setHours(d.getHours() - 24);
                from = d.toISOString();
            } else if (val === '7d') {
                const d = new Date(now);
                d.setDate(d.getDate() - 7);
                from = d.toISOString();
            } else if (val === '30d') {
                const d = new Date(now);
                d.setDate(d.getDate() - 30);
                from = d.toISOString();
            } else if (val === '90d') {
                const d = new Date(now);
                d.setDate(d.getDate() - 90);
                from = d.toISOString();
            } else if (val === 'custom') {
                const f = fromInput.value ? new Date(fromInput.value) : null;
                const t = toInput.value ? new Date(toInput.value) : null;
                from = f ? new Date(f.setHours(0,0,0,0)).toISOString() : null;
                to = t ? new Date(t.setHours(23,59,59,999)).toISOString() : to;
            } else {
                from = null;
            }
            return { from, to };
        }

        function renderAnalytics(allTimeEvents, rangeEvents) {
            const views = rangeEvents.filter(e => e.event_type === 'view');
            const downloads = rangeEvents.filter(e => e.event_type === 'download');
            const viewsAll = allTimeEvents.filter(e => e.event_type === 'view');
            totalViewsEl.textContent = views.length.toString();
            totalViewsAllEl.textContent = viewsAll.length.toString();
            const uniqueUsers = new Set(views.map(v => v.user_id).filter(Boolean));
            uniqueViewsEl.textContent = uniqueUsers.size.toString();
            totalDownloadsEl.textContent = downloads.length.toString();
            const perBoardViews = {};
            const perBoardDownloads = {};
            for (const ev of views) {
                const key = ev.board_id || ev.view_link || 'unknown';
                if (!perBoardViews[key]) perBoardViews[key] = { count: 0, board: null };
                perBoardViews[key].count++;
            }
            for (const ev of downloads) {
                const key = ev.board_id || ev.view_link || 'unknown';
                if (!perBoardDownloads[key]) perBoardDownloads[key] = { count: 0, board: null };
                perBoardDownloads[key].count++;
            }
            for (const b of allBoards) {
                const key = b.id || b.view_link;
                if (perBoardViews[key]) perBoardViews[key].board = b;
                if (perBoardDownloads[key]) perBoardDownloads[key].board = b;
            }
            const viewItems = Object.values(perBoardViews).filter(i => i.board);
            const downloadItems = Object.values(perBoardDownloads).filter(i => i.board);
            viewItems.sort((a, b) => b.count - a.count);
            downloadItems.sort((a, b) => b.count - a.count);
            const topViews = viewItems.slice(0, 10);
            const topDownloads = downloadItems.slice(0, 10);
            viewsChart.innerHTML = '';
            downloadsChart.innerHTML = '';
            viewsEmpty.style.display = topViews.length === 0 ? '' : 'none';
            downloadsEmpty.style.display = topDownloads.length === 0 ? '' : 'none';
            if (topViews.length > 0) {
                const maxViews = topViews.reduce((m, i) => Math.max(m, i.count), 0);
                topViews.forEach(item => {
                    const bar = document.createElement('div');
                    bar.className = 'chart-bar';
                    const width = maxViews ? Math.round((item.count / maxViews) * 100) : 0;
                    bar.style.setProperty('--bar-width', width + '%');
                    bar.innerHTML = `<span class="bar-label">${item.board.title || 'Untitled'}</span><span class="bar-value">${item.count}</span>`;
                    viewsChart.appendChild(bar);
                });
            }
            if (topDownloads.length > 0) {
                const maxDownloads = topDownloads.reduce((m, i) => Math.max(m, i.count), 0);
                topDownloads.forEach(item => {
                    const bar = document.createElement('div');
                    bar.className = 'chart-bar';
                    const width = maxDownloads ? Math.round((item.count / maxDownloads) * 100) : 0;
                    bar.style.setProperty('--bar-width', width + '%');
                    bar.innerHTML = `<span class="bar-label">${item.board.title || 'Untitled'}</span><span class="bar-value">${item.count}</span>`;
                    downloadsChart.appendChild(bar);
                });
            }
        }

        function toggleCustomDates() {
            const isCustom = rangeSelect.value === 'custom';
            fromInput.style.display = isCustom ? 'inline-block' : 'none';
            toInput.style.display = isCustom ? 'inline-block' : 'none';
        }

        rangeSelect.addEventListener('change', () => {
            toggleCustomDates();
        });

        async function refreshAnalytics() {
            analyticsLoading.style.display = 'block';
            const { from, to } = computeDateRange();
            const [{ data: allData }, { data }] = await Promise.all([
                getAnalyticsEvents({}),
                getAnalyticsEvents({ from, to })
            ]);
            renderAnalytics(allData, data);
            analyticsLoading.style.display = 'none';
        }

        applyBtn.addEventListener('click', refreshAnalytics);

        toggleCustomDates();
        showTab('boards');

        function filterBoards() {
            const selectedMaps = [...page.querySelectorAll('input[name="mapFilter"]:checked')].map(cb => cb.value);
            const searchValue = searchInput.value.trim().toLowerCase();
            filteredBoards = allBoards.filter(board => {
                const matchesMap = selectedMaps.length === 0 ? false : selectedMaps.includes(board.board_type);
                const matchesTitle = !searchValue || (board.title && board.title.toLowerCase().includes(searchValue));
                return matchesMap && matchesTitle;
            });
            renderBoards();
        }

        function renderBoards() {
            grid.innerHTML = '';
            if (filteredBoards.length > 0) {
                const cardPromises = filteredBoards.map(board => createBoardCard(board, true));
                Promise.all(cardPromises).then(cards => {
                    cards.forEach(card => grid.appendChild(card));
                });
            } else {
                grid.innerHTML = '<p>No boards found.</p>';
            }
        }

        searchInput.addEventListener('input', debounce(filterBoards, 300));
        filterDropdown.addEventListener('change', filterBoards);

        // Initial render
        filterBoards();

        page.addEventListener('click', (e) => {
            const editButton = e.target.closest('.btn-edit');
            if (editButton) {
                handleEdit(editButton.dataset.id);
            }

            const deleteButton = e.target.closest('.btn-delete');
            if (deleteButton) {
                handleDelete(deleteButton.dataset.id);
            }
        });
    }
};

export default AdminPage; 
