import React, { Suspense, lazy } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { OfflineModal } from "@/components/OfflineModal"
import { Skeleton } from "@/components/ui/skeleton"
import "./index.css"

// Lazy load public pages (no Clerk dependency)
const SharedBookmark = lazy(() => import("./pages/SharedBookmark"))
const PublicProfile = lazy(() => import("./pages/PublicProfile").then(m => ({ default: m.PublicProfile })))

// Lazy load main app (has Clerk dependency)
const App = lazy(() => import("./App"))

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/share/", "/u/"]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

// Simple loader for public pages
function PublicPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#141414] p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0 bg-[#1a1a1a]" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-[#1a1a1a]" />
              <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple loader for main app
function AppLoader() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="shrink-0 flex h-10 items-center justify-between bg-background px-4 sm:px-6">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </header>
    </div>
  )
}

// Public routes wrapper - uses ConvexProvider without Clerk
function PublicRoutes() {
  return (
    <ConvexProvider client={convex}>
      <TooltipProvider delayDuration={300}>
        <Routes>
          <Route path="/share/:shareId" element={<Suspense fallback={<PublicPageLoader />}><SharedBookmark /></Suspense>} />
          <Route path="/u/:username" element={<Suspense fallback={<PublicPageLoader />}><PublicProfile /></Suspense>} />
        </Routes>
        <Toaster />
      </TooltipProvider>
    </ConvexProvider>
  )
}

// Authenticated routes wrapper - uses ClerkProvider + ConvexProviderWithClerk
function AuthenticatedRoutes() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <TooltipProvider delayDuration={300}>
          <Suspense fallback={<AppLoader />}>
            <App />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

// Router that chooses between public and authenticated routes
function RootRouter() {
  const location = useLocation()
  const isPublic = isPublicRoute(location.pathname)

  if (isPublic) {
    return <PublicRoutes />
  }

  return <AuthenticatedRoutes />
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OfflineModal />
    <BrowserRouter>
      <RootRouter />
    </BrowserRouter>
  </React.StrictMode>
)
