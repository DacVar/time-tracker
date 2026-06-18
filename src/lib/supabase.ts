import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client — uses cookies so the session is visible
// to the Next.js middleware (server-side) on every request.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
