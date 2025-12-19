/**
 * Generates a preview image for a board using Canvas.
 * This function is designed to be self-contained and does not rely on external state.
 * @param {object} board - The full board object from Supabase.
 * @returns {Promise<string>} A promise that resolves to a base64 data URL of the preview image.
 */
async function generateBoardPreview(board) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use a consistent, high-quality canvas size
        canvas.width = 500;
        canvas.height = 300;
        
        const boardImage = new Image();
        boardImage.crossOrigin = "anonymous";
        
        boardImage.onload = async () => {
            // Draw the board background centered and scaled to fit
            const boardAspectRatio = boardImage.width / boardImage.height;
            let drawWidth = canvas.width;
            let drawHeight = drawWidth / boardAspectRatio;

            if (drawHeight > canvas.height) {
                drawHeight = canvas.height;
                drawWidth = drawHeight * boardAspectRatio;
            }

            const offsetX = (canvas.width - drawWidth) / 2;
            const offsetY = (canvas.height - drawHeight) / 2;

            ctx.drawImage(boardImage, offsetX, offsetY, drawWidth, drawHeight);

            // --- Draw Grid ---
            let rows;
            if (board.mode === 'regular mode') {
                rows = 3;
            } else if (board.mode === 'guild') {
                rows = 4; // Guild Raid (6x4)
            } else if (board.mode === 'challenge') {
                // Check if this is the 'endless' map (3x6) or default challenge (5x6)
                rows = (board.board_type === 'endless') ? 3 : 5;
            }

            const gridConfig = {
                rows: rows,
                cols: 6
            };
            
            // These are percentages to apply to the drawn image size.
            const margins = board.mode === 'regular mode'
                ? { top: 0.12, right: 0.065, bottom: 0.20, left: 0.08 } // Regular (3x6)
                : board.mode === 'guild'
                ? { top: 0.12, right: 0.045, bottom: 0.15, left: 0.045 } // Guild Raid (6x4)
                : (board.board_type === 'endless')
                ? { top: 0.12, right: 0.045, bottom: 0.10, left: 0.04 } // Endless mode (3x6)
                : { top: 0.08, right: 0.045, bottom: 0.11, left: 0.045 }; // Default challenge (5x6)

            const marginTop = drawHeight * margins.top;
            const marginRight = drawWidth * margins.right;
            const marginBottom = drawHeight * margins.bottom;
            const marginLeft = drawWidth * margins.left;

            const gridWidth = drawWidth - marginLeft - marginRight;
            const gridHeight = drawHeight - marginTop - marginBottom;
            const gridOffsetX = offsetX + marginLeft;
            const gridOffsetY = offsetY + marginTop;

            const cellWidth = gridWidth / gridConfig.cols;
            const cellHeight = gridHeight / gridConfig.rows;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;

            // Draw vertical lines
            for (let i = 1; i < gridConfig.cols; i++) {
                ctx.beginPath();
                ctx.moveTo(gridOffsetX + i * cellWidth, gridOffsetY);
                ctx.lineTo(gridOffsetX + i * cellWidth, gridOffsetY + gridHeight);
                ctx.stroke();
            }

            // Draw horizontal lines
            for (let i = 1; i < gridConfig.rows; i++) {
                ctx.beginPath();
                ctx.moveTo(gridOffsetX, gridOffsetY + i * cellHeight);
                ctx.lineTo(gridOffsetX + gridWidth, gridOffsetY + i * cellHeight);
                ctx.stroke();
            }
            // --- End Grid ---

            // Parse board_data safely
            let boardDataParsed = {};
            try {
                boardDataParsed = typeof board.board_data === 'string'
                    ? JSON.parse(board.board_data)
                    : board.board_data;
            } catch (e) {
                console.error('Failed to parse board_data for preview:', e);
                // Resolve with a placeholder or default image if parsing fails
                resolve(canvas.toDataURL('image/webp'));
                return;
            }

            if (boardDataParsed && Array.isArray(boardDataParsed.units) && boardDataParsed.units.length > 0) {
                const unitImages = await Promise.all(
                    boardDataParsed.units.map(unit => new Promise((resolveUnit) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.onload = () => resolveUnit({ img, unit });
                        img.onerror = () => resolveUnit(null); // Handle broken unit images
                        
                        // Handle both absolute and relative image paths, and strip foreign domains
                        let imageSrc = unit.imagePath;
                        try {
                            const url = new URL(imageSrc);
                            // If it's a full URL, strip the domain and use only the path.
                            // This forces the app to use its own local assets.
                            imageSrc = url.pathname;
                        } catch (e) {
                            // It's not a full URL, treat it as a relative path.
                            // No action needed, path is already relative.
                        }
                        
                        // Ensure the path starts with a single '/'
                        img.src = `/${imageSrc.replace(/^\//, '')}`;
                    }))
                );

                unitImages.forEach(item => {
                    if (!item) return; // Skip if image failed to load
                    const { img, unit } = item;
                    const col = unit.position % gridConfig.cols;
                    const row = Math.floor(unit.position / gridConfig.cols);

                    // Get the cell's top-left coordinates
                    const cellX = gridOffsetX + col * cellWidth;
                    const cellY = gridOffsetY + row * cellHeight;

                    // Replicate CSS for .unit-on-board: 80% size with 'contain' behavior.
                    const unitContainerWidth = cellWidth * 0.8;
                    const unitContainerHeight = cellHeight * 0.8;
                    
                    // Center this container in the cell.
                    const unitContainerX = cellX + (cellWidth - unitContainerWidth) / 2;
                    const unitContainerY = cellY + (cellHeight - unitContainerHeight) / 2;

                    // Calculate 'contain' dimensions to preserve aspect ratio.
                    const imageAspectRatio = img.width / img.height;
                    const containerAspectRatio = unitContainerWidth / unitContainerHeight;

                    let finalDrawWidth, finalDrawHeight;
                    if (imageAspectRatio > containerAspectRatio) {
                        finalDrawWidth = unitContainerWidth;
                        finalDrawHeight = finalDrawWidth / imageAspectRatio;
                    } else {
                        finalDrawHeight = unitContainerHeight;
                        finalDrawWidth = finalDrawHeight * imageAspectRatio;
                    }

                    // Center the final image within its container.
                    const finalX = unitContainerX + (unitContainerWidth - finalDrawWidth) / 2;
                    const finalY = unitContainerY + (unitContainerHeight - finalDrawHeight) / 2;
                    
                    ctx.drawImage(img, finalX, finalY, finalDrawWidth, finalDrawHeight);
                });
            }

            resolve(canvas.toDataURL('image/webp', 0.9)); // Use webp for better performance
        };

        boardImage.onerror = () => {
            // If the board background fails, resolve with the canvas as-is (with its background color)
            console.error(`Failed to load board image: ${getBoardPath(board.mode, board.board_type)}`);
            resolve(canvas.toDataURL('image/webp'));
        };
        
        // Construct the path to the board background image
        const boardMapImage = getBoardPath(board.mode, board.board_type);
        boardImage.src = boardMapImage;
        
        // Helper function to get the correct board path
        function getBoardPath(mode, boardType) {
            if (mode === 'regular mode') {
                return `/assets/boards/regular mode/${boardType}.webp`;
            } else if (mode === 'guild') {
                return `/assets/boards/guild/${boardType}.webp`;
            } else if (mode === 'challenge') {
                return `/assets/boards/challenge/${boardType}.webp`;
            }
            // Fallback in case of unknown mode
            return `/assets/boards/regular mode/${boardType}.webp`;
        }
    });
}

/**
 * Creates and returns an HTML element for a board card.
 * This is an async function because it generates the preview image on the fly.
 * @param {object} board - The board data object.
 * @param {boolean} isAdmin - Flag to show admin controls.
 * @returns {Promise<HTMLElement>} - A promise that resolves to the board card element.
 */
export async function createBoardCard(board, isAdmin = false) {
    const card = document.createElement('div');
    card.className = 'board-card';
    card.dataset.boardId = board.id;

    // Generate the preview image
    const previewImage = await generateBoardPreview(board);

    const title = board.title || 'Anonymous Board';
    const createdAt = new Date(board.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    card.innerHTML = `
        <div class="card-preview-wrapper">
            <img src="${previewImage}" alt="Board preview for ${title}" class="card-preview-img" loading="lazy">
        </div>
        <div class="card-content">
            <h3 class="card-title">${title}</h3>
            <p class="card-meta">Created on ${createdAt}</p>
            <div class="card-actions">
                <a href="#view?id=${board.view_link}" class="btn btn-secondary">View Board</a>
                ${isAdmin ? `
                    <button class="btn-edit" data-id="${board.id}" aria-label="Edit Board">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete" data-id="${board.id}" aria-label="Delete Board">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    // Add styles for admin buttons and the card itself to keep CSS modular
    const style = document.createElement('style');
    style.textContent = `
        .card-preview-wrapper {
            background-color: var(--color-surface-secondary);
            aspect-ratio: 16 / 10;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-top-left-radius: var(--radius-md);
            border-top-right-radius: var(--radius-md);
            padding: var(--space-sm);
            box-sizing: border-box;
        }
        .card-preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: var(--radius-sm);
        }
        ${isAdmin ? `
        .card-actions .btn-edit, .card-actions .btn-delete {
            background: none;
            border: none;
            cursor: pointer;
            padding: var(--space-xs);
            color: var(--color-text-muted);
            transition: color 0.2s ease;
        }
        .card-actions .btn-edit:hover { color: var(--color-primary); }
        .card-actions .btn-delete:hover { color: var(--color-danger); }
        ` : ''}
    `;
    card.prepend(style); // Prepend to ensure it's first

    return card;
} 