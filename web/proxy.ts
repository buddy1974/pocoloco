import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublic = createRouteMatcher([
  '/',
  '/login(.*)',
  '/sign-in(.*)',
  '/register(.*)',
  '/pricing(.*)',
  '/calibration(.*)',
  '/api/health(.*)',
  '/api/public(.*)',
  '/api/stripe/webhook(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublic(request)) await auth.protect()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/'],
}
