import { getDiscoverBoards } from '../api.js';
import { createBoardCard } from '../components/boardCard.js';
import { debounce } from '../utils.js';

let currentPage = 1;
const limit = 8;
let currentFilters = { mapFilter: '', titleSearch: '' };
let totalBoards = 0;

const DiscoverPage = {
    async render() {
        currentPage = 1;
        currentFilters = { mapFilter: '', titleSearch: '' };
        totalBoards = 0;

        const page = document.createElement('div');
        page.className = 'page page-discover';

        // Define maps for the filter, separating ID from display name.
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
                        <input type="checkbox" id="map-${map.id}" name="mapFilter" value="${map.id}" checked>
                        <label for="map-${map.id}">${map.name}</label>
                    </div>
                `).join('')}
            </div>
        `).join('');

        page.innerHTML = `
            <div class="discover-header container">
                <h1 class="h1">Discover Boards</h1>
                <div class="discover-filters">
                    <div class="filter-group">
                        <div class="form-group search-bar">
                            <input type="search" id="search-title" placeholder="Search by Title...">
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
                <div id="discover-grid" class="grid-container">
                    <p>Loading boards...</p>
                </div>

                <div id="pagination-controls" class="pagination-controls mt-lg"></div>
            </section>
        `;
        
        this.afterRender(page);
        return page;
    },

    async afterRender(page) {
        const grid = page.querySelector('#discover-grid');
        const paginationControls = page.querySelector('#pagination-controls');

        const searchInput = page.querySelector('#search-title');
        const mapFilter = page.querySelector('#filter-map');

        const loadBoards = async () => {
            grid.innerHTML = '<p>Loading boards...</p>';
            try {
                const { data, count } = await getDiscoverBoards({ 
                    page: currentPage, 
                    limit, 
                    ...currentFilters 
                });
                
                totalBoards = count;
                grid.innerHTML = '';
                
                if (data && data.length > 0) {
                    const cardPromises = data.map(board => createBoardCard(board));
                    const cards = await Promise.all(cardPromises);
                    cards.forEach(card => grid.appendChild(card));
                } else {
                    grid.innerHTML = '<p>No boards found matching your criteria.</p>';
                }
                renderPagination(paginationControls);

            } catch (error) {
                console.error("Error loading discover boards:", error);
                grid.innerHTML = '<p class="text-danger">Failed to load boards.</p>';
            }
        };

        const renderPagination = (container) => {
            container.innerHTML = '';
            const totalPages = Math.ceil(totalBoards / limit);
            if (totalPages <= 1) return;

            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.className = 'btn btn-secondary';
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    loadBoards();
                }
            });
            container.appendChild(prevButton);

            const pageInfo = document.createElement('span');
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            pageInfo.className = 'page-info';
            container.appendChild(pageInfo);

            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.className = 'btn btn-secondary';
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    loadBoards();
                }
            });
            container.appendChild(nextButton);
        };

        const handleFilterChange = () => {
            currentPage = 1;
            // Get selected map filters
            const selectedMaps = [...page.querySelectorAll('input[name="mapFilter"]:checked')].map(cb => cb.value);
            
            currentFilters.titleSearch = searchInput.value;
            currentFilters.mapFilter = selectedMaps; // Use array of maps
            loadBoards();
        };

        searchInput.addEventListener('input', debounce(handleFilterChange, 300));
        page.querySelector('.filter-dropdown-content').addEventListener('change', handleFilterChange);

        // Initial load
        loadBoards();
    }
};

export default DiscoverPage; 