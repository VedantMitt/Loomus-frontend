import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // 1. Root route handling
  if (pathname === '/') {
    const userAgent = request.headers.get('user-agent') || '';
    const xRequestedWith = request.headers.get('x-requested-with') || '';
    const isNativeHeader =
      xRequestedWith.toLowerCase() === 'com.loomus.loomus' ||
      xRequestedWith.toLowerCase() === 'com.campusconnect.app';
    const isNativeUserAgent =
      userAgent.includes('LoomusApp') ||
      (userAgent.includes('Android') && userAgent.includes('wv')) ||
      userAgent.includes('Capacitor');
    const isNativeCookie = request.cookies.get('loomus_native')?.value === 'true';

    const isNative = isNativeHeader || isNativeUserAgent || isNativeCookie;

    if (isNative) {
      const destination = token ? '/activities' : '/auth/login';
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.cookies.set('loomus_native', 'true', { maxAge: 60 * 60 * 24 * 365, path: '/' });
      return response;
    }
  }

  // 2. Protect app routes when not logged in
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.'); // Static files (png, svg, jpg, etc.)

  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
