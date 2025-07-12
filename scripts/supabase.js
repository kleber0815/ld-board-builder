// Supabase configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://uombtmlxjqgzqkpedcgn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbWJ0bWx4anFnenFrcGVkY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTY5MzksImV4cCI6MjA2NDg5MjkzOX0.KkfKVCm7KCj3v2kTW4TpqY0J0Rb7tuetZyuGcRxkdS8'

export const supabase = createClient(supabaseUrl, supabaseKey);