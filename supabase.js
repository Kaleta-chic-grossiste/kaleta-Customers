import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmiviijhgirvkvfbvyjj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaXZpaWpoZ2lydmt2ZmJ2eWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjg2MDQsImV4cCI6MjA5NDYwNDYwNH0.EoiBSDF3gBw8LSZZb97lfyAmb-NH2v3mPgkMhCnlQjU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);