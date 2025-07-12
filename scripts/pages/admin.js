import { getAdminBoards, updateBoard, deleteBoard } from '../api.js';
import { createBoardCard } from '../components/boardCard.js';
import { createModal, showModal, showConfirmModal, showInfoModal } from '../components/modal.js';
import { debounce } from '../utils.js';

let allBoards = [];
let pageElement;

const maps = {
    "Regular Maps": [
        { id: 'normal', name: 'Normal' },
        { id: 'hard', name: 'Hard' },
        { id: 'hell', name: 'Hell' },
        { id: 'god', name: 'God' },
        { id: 'primeval', name: 'Primeval' }
    ],
    "Guild Maps": [
        { id: 'gbboard', name: 'Guild Battle' }
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
        pageElement = document.createElement('div');
        pageElement.className = 'page page-admin';
        pageElement.innerHTML = `
            <div class="admin-header container">
                <h1 class="h1">Admin Panel</h1>
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
            </div>
            <section class="container mt-lg">
                <div id="admin-boards-grid" class="grid-container"></div>
            </section>
        `;

        this.afterRender(pageElement);
        return pageElement;
    },

    async afterRender(page) {
        let filteredBoards = [];
        const grid = page.querySelector('#admin-boards-grid');
        const searchInput = page.querySelector('#admin-search-title');
        const filterDropdown = page.querySelector('.filter-dropdown-content');

        // Load all boards once
        allBoards = await getAdminBoards();

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