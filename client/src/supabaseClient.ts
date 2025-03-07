import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nzkjwlcipqbvxvwxemfh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56a2p3bGNpcHFidnh2d3hlbWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NzY3MjEsImV4cCI6MjA1NjE1MjcyMX0.El1hdUUeG0YZ6Ey8TOdS0n-4nIvMG9d64lqc4JjbVF8";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
