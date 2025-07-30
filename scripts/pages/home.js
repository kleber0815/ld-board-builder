import { getRecentBoards } from '../api.js';
import { createBoardCard } from '../components/boardCard.js';

const HomePage = {
    async render() {
        const page = document.createElement('div');
        page.className = 'page page-home';

        page.innerHTML = `
            <section class="hero container text-center">
                <h1 class="h1">Welcome to the Board Builder</h1>
                <p class="text-lg" style="max-width: 60ch; margin-inline: auto;">
                    Unleash your strategic genius. Design, build, and share your ultimate game boards for every scenario.
                </p>
                <a href="#builder" class="btn btn-primary mt-lg">Start Building</a>
            </section>

            <section class="recent-boards container mt-lg">
                <h2 class="h2">Recently created Boards</h2>
                <div id="recent-boards-grid" class="grid-container">
                    <p>Loading recent boards...</p>
                </div>
            </section>
        `;

        this.afterRender(page);
        return page;
    },

    async afterRender(page) {
        const grid = page.querySelector('#recent-boards-grid');
        try {
            const boards = await getRecentBoards(4); // Fetch 3 most recent boards with titles
            grid.innerHTML = ''; // Clear loading message
            
            if (boards && boards.length > 0) {
                const cardPromises = boards.map(board => createBoardCard(board));
                const cards = await Promise.all(cardPromises);
                cards.forEach(card => grid.appendChild(card));
            } else {
                grid.innerHTML = '<p>No public boards found. Be the first to create one!</p>';
            }
        } catch (error) {
            console.error('Error fetching recent boards:', error);
            grid.innerHTML = '<p class="text-danger">Could not load recent boards. Please try again later.</p>';
        }
    }
};

export default HomePage; 