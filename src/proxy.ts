import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Start with a plain "continue" response; we may replace it below.
  let response = NextResponse.next({ request })

  // Build a Supabase client that can read/write the session cookie.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Write updated cookies into the outgoing response so the
          // browser keeps the refreshed session token.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT server-side — never trust getSession() alone.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = pathname.startsWith('/home') || pathname.startsWith('/dashboard')
  const isLoginPage = pathname.startsWith('/login')

  if (isProtected && !user) {
    // Not authenticated — redirect to login, preserving the intended URL.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isLoginPage && user) {
    // Already authenticated — skip login page.
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    url.searchParams.delete('next')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Run on all routes except Next.js internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.json|icon.*\\.png).*)'],
}
