import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import App from "./App"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { OfflineModal } from "@/components/OfflineModal"
import "./index.css"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OfflineModal />
    <ConvexClerkProvider>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <App />
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </ConvexClerkProvider>
  </React.StrictMode>
)
