import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const user = request.cookies.get('user')?.value;
    
    console.log('Middleware check:', {
      hasUserCookie: !!user,
      path: request.nextUrl.pathname
    });

    if (!user) {
      console.log('No user cookie found, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    try {
      const userData = JSON.parse(user);
      console.log('User data found:', {
        email: userData.email,
        path: request.nextUrl.pathname
      });
      return NextResponse.next();
    } catch (error) {
      console.log('Invalid user cookie:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      loginUrl.searchParams.set('error', 'invalid_session');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
}; 