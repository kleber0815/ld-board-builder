import { supabase } from './supabase.js';

/**
 * Fetches the most recent boards that have a title.
 * @param {number} limit - The maximum number of boards to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of board objects.
 */
export async function getRecentBoards(limit = 3) {
    const { data, error } = await supabase
        .from('boards')
        .select('*')
        .not('title', 'is', null) // Ensure title exists
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent boards:', error);
        throw error;
    }
    return data;
}

/**
 * Fetches a single board by its unique view_link ID.
 * @param {string} id - The view_link of the board.
 * @returns {Promise<Object>} A promise that resolves to the board object.
 */
export async function getBoardById(id) {
    const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('view_link', id)
        .maybeSingle(); // Expecting zero or one result

    if (error) {
        console.error(`Error fetching board with id ${id}:`, error);
        throw error;
    }
    return data;
}

/**
 * Adds a new board to the database.
 * @param {Object} boardData - The board data to insert.
 * @returns {Promise<Object>} A promise that resolves to the newly created board object.
 */
export async function addBoard(boardData) {
    const { data, error } = await supabase
        .from('boards')
        .insert([boardData])
        .select()
        .single();
        
    if (error) {
        console.error('Error adding board:', error);
        throw error;
    }
    return data;
}

/**
 * Updates an existing board.
 * @param {string} id - The UUID of the board to update.
 * @param {Object} updatedFields - An object with the fields to update.
 * @returns {Promise<Object>} A promise that resolves to the updated board object.
 */
export async function updateBoard(id, updatedFields) {
    const { data, error } = await supabase
        .from('boards')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error updating board ${id}:`, error);
        throw error;
    }
    return data;
}

/**
 * Deletes a board from the database.
 * @param {string} id - The UUID of the board to delete.
 * @returns {Promise<void>}
 */
export async function deleteBoard(id) {
    const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting board ${id}:`, error);
        throw error;
    }
}

/**
 * Fetches boards for the discover page with filtering and pagination.
 * @param {Object} options - Filtering and pagination options.
 * @param {number} options.page - The current page number.
 * @param {number} options.limit - The number of items per page.
 * @param {string} options.mapFilter - The map to filter by.
 * @param {string} options.titleSearch - The title search query.
 * @returns {Promise<{data: Array, count: number}>} A promise that resolves to the data and total count.
 */
export async function getDiscoverBoards({ page = 1, limit = 8, mapFilter = [], titleSearch = '' }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('boards')
        .select('*', { count: 'exact' })
        .not('title', 'is', null) // Only boards with titles
        .order('created_at', { ascending: false });

    // Handle title search
    if (titleSearch) {
        query = query.ilike('title', `%${titleSearch}%`);
    }

    // Handle map filters
    if (mapFilter && mapFilter.length > 0) {
        query = query.in('board_type', mapFilter);
    } else if (mapFilter && mapFilter.length === 0) {
        // If filters are active but no maps are selected, return nothing.
        return { data: [], count: 0 };
    }
    
    // Add pagination at the end
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching discover boards:', error);
        throw error;
    }

    return { data, count };
}

/**
 * Fetches all boards for the admin panel.
 */
export async function getAdminBoards() {
    const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching admin boards:', error);
        throw error;
    }
    return data;
} 