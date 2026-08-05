import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      const token = request.cookies.get('token')?.value;
      const destination = token ? '/activities' : '/auth/login';
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.cookies.set('loomus_native', 'true', { maxAge: 60 * 60 * 24 * 365, path: '/' });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
