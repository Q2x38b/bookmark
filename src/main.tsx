import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, useLocation } from "react-router-dom"
import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import App from "./App"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { OfflineModal } from "@/components/OfflineModal"
import "./index.css"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/share/", "/u/"]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

function ConvexOnlyProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}

function SmartConvexProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isPublic = isPublicRoute(location.pathname)

  if (isPublic) {
    return <ConvexOnlyProvider>{children}</ConvexOnlyProvider>
  }

  return <ConvexClerkProvider>{children}</ConvexClerkProvider>
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OfflineModal />
    <BrowserRouter>
      <SmartConvexProvider>
        <TooltipProvider delayDuration={300}>
          <App />
          <Toaster />
        </TooltipProvider>
      </SmartConvexProvider>
    </BrowserRouter>
  </React.StrictMode>
)
