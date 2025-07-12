// Supabase configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Try to import config file (should be gitignored)
let config = null;
try {
    config = await import('../config.js');
} catch (e) {
    // Config file doesn't exist, use defaults
}

const supabaseUrl = config?.config?.supabase?.url || 'https://uombtmlxjqgzqkpedcgn.supabase.co'
const supabaseKey = config?.config?.supabase?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbWJ0bWx4anFnenFrcGVkY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTY5MzksImV4cCI6MjA2NDg5MjkzOX0.KkfKVCm7KCj3v2kTW4TpqY0J0Rb7tuetZyuGcRxkdS8'

export const supabase = createClient(supabaseUrl, supabaseKey);