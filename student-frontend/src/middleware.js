import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  // Root → redirect based on auth state
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? '/student/dashboard' : '/login', request.url)
    );
  }

  // Already authenticated → skip auth pages
  if ((pathname === '/login' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // Guard all student routes
  if (pathname.startsWith('/student') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)',],
};
