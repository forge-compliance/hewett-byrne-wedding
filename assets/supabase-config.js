const WEDDING_SUPABASE_URL = 'https://vyvsouqgzyobxfjuwctl.supabase.co';
const WEDDING_SUPABASE_KEY = 'sb_publishable_PXSxzF2prI_81L4_w_ypLw_te6yJl8q';

window.weddingSupabase = window.supabase.createClient(
  WEDDING_SUPABASE_URL,
  WEDDING_SUPABASE_KEY
);
