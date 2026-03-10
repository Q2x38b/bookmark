import { Routes, Route } from "react-router-dom"
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import { Suspense, lazy, memo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Logo } from "@/components/Logo"

// Lazy load all pages for better code splitting
const Landing = lazy(() => import("./pages/Landing"))
const SignIn = lazy(() => import("./pages/SignIn"))
const SignUp = lazy(() => import("./pages/SignUp"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const SharedBookmark = lazy(() => import("./pages/SharedBookmark"))
const SSOCallback = lazy(() => import("./pages/SSOCallback"))
const PublicProfile = lazy(() => import("./pages/PublicProfile").then(m => ({ default: m.PublicProfile })))
const NotFound = lazy(() => import("./pages/NotFound"))
const ErrorPage = lazy(() => import("./pages/Error"))
const Unauthorized = lazy(() => import("./pages/Unauthorized"))

// Minimal loading fallback - shows instantly
const PageLoader = memo(function PageLoader() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="shrink-0 flex h-10 items-center justify-between bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-muted-foreground/60">/</span>
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32 rounded-xl" />
      </header>
      <main className="flex-1 overflow-hidden flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="pt-4 pb-2 space-y-2 px-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-border">
              <Skeleton className="h-3 w-12" />
              <div className="flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="px-3 space-y-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-md">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
})

// Minimal loader for auth pages
const AuthPageLoader = memo(function AuthPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-[320px] px-6 space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
})

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <Suspense fallback={<AuthPageLoader />}>
                <Landing />
              </Suspense>
            </SignedOut>
            <SignedIn>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </SignedIn>
          </>
        }
      />
      <Route path="/signin" element={<Suspense fallback={<AuthPageLoader />}><SignIn /></Suspense>} />
      <Route path="/signup" element={<Suspense fallback={<AuthPageLoader />}><SignUp /></Suspense>} />
      <Route path="/sso-callback" element={<Suspense fallback={<AuthPageLoader />}><SSOCallback /></Suspense>} />
      <Route path="/unauthorized" element={<Suspense fallback={<AuthPageLoader />}><Unauthorized /></Suspense>} />
      <Route path="/share/:shareId" element={<Suspense fallback={<PageLoader />}><SharedBookmark /></Suspense>} />
      <Route path="/u/:username" element={<Suspense fallback={<PageLoader />}><PublicProfile /></Suspense>} />
      <Route path="/error" element={<Suspense fallback={<AuthPageLoader />}><ErrorPage /></Suspense>} />
      <Route path="*" element={<Suspense fallback={<AuthPageLoader />}><NotFound /></Suspense>} />
    </Routes>
  )
}
