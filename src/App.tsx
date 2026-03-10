import { Routes, Route } from "react-router-dom"
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import Landing from "./pages/Landing"
import SignIn from "./pages/SignIn"
import SignUp from "./pages/SignUp"
import Dashboard from "./pages/Dashboard"
import SharedBookmark from "./pages/SharedBookmark"
import SSOCallback from "./pages/SSOCallback"
import { PublicProfile } from "./pages/PublicProfile"
import NotFound from "./pages/NotFound"
import ErrorPage from "./pages/Error"
import Unauthorized from "./pages/Unauthorized"

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <Landing />
            </SignedOut>
            <SignedIn>
              <Dashboard />
            </SignedIn>
          </>
        }
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/sso-callback" element={<SSOCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/share/:shareId" element={<SharedBookmark />} />
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
