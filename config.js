/* Nastavení účtů. Sem vlož dvě hodnoty ze Supabase (Project Settings → API / Data API):
   supabaseUrl  = "Project URL", např. https://abcdxyz.supabase.co
   supabaseKey  = "Publishable key" (sb_publishable_…) nebo starší "anon public" klíč.
   Tento klíč je veřejný, to je v pořádku – web smí jen volat funkce ze supabase.sql.
   Když necháš prázdné, trenažér funguje bez účtů a postup ukládá jen v prohlížeči. */
window.TRENER_CONFIG = {
  supabaseUrl: "https://ylcybuglsjdcoklnaijl.supabase.co",
  supabaseKey: "sb_publishable_We_VcLJc5TwMOMVScyfMHg_WxHN17Qe"
};
