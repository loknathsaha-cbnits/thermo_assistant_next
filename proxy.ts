import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const protectedPaths = ['/api/auth/signout', '/chat', '/library'];
  const publicPaths = ['/', '/auth/signin', '/auth/signup', '/api/test-embed', '/api/chat/suggest'];

  const isProtectedPath =
    protectedPaths.some(p => path === p || path.startsWith(`${p}/`));

  const isPublicPath = publicPaths.includes(path);

  if (path.startsWith('/verify/')) {
    return NextResponse.next();
  }

  if (sessionToken && isPublicPath) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  if (path === '/api/auth/signout' && !sessionToken) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (!sessionToken && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}
