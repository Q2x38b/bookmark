import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import Landing from '@/pages/Landing'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import Dashboard from '@/pages/Dashboard'
import AddBookmark from '@/pages/AddBookmark'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="pocket-theme">
      <TooltipProvider>
        <Routes>
          <Route path="/" element={
            <>
              <SignedOut>
                <Landing />
              </SignedOut>
              <SignedIn>
                <Dashboard />
              </SignedIn>
            </>
          } />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
          <Route path="/add" element={<AddBookmark />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
