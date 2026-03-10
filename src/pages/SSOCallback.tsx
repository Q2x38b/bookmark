import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useClerk } from "@clerk/clerk-react"
import { Loader2 } from "lucide-react"

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback({
          afterSignInUrl: "/",
          afterSignUpUrl: "/",
        })
      } catch {
        navigate("/sign-in")
      }
    }

    handleCallback()
  }, [handleRedirectCallback, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
