import { useState } from "react"
import { useSignUp } from "@clerk/clerk-react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    setIsLoading(true)
    setError("")

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> }
      setError(clerkError.errors?.[0]?.message || "Sign up failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    setIsLoading(true)
    setError("")

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        navigate("/")
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> }
      setError(clerkError.errors?.[0]?.message || "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return

    setIsGoogleLoading(true)
    setError("")

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      })
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> }
      setError(clerkError.errors?.[0]?.message || "Google sign up failed")
      setIsGoogleLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <button
            onClick={() => setPendingVerification(false)}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <Link to="/" className="mb-8 flex justify-center">
            <Logo size={40} />
          </Link>

          <div className="rounded-lg border border-[#262626] bg-[#141414] p-6">
            <h1 className="mb-2 text-center text-xl font-semibold text-white">
              Check your email
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              We sent a verification code to {email}
            </p>

            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="border-[#262626] bg-[#1a1a1a] text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify email"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              onClick={() => signUp?.prepareEmailAddressVerification({ strategy: "email_code" })}
              className="text-white hover:underline"
            >
              Resend
            </button>
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link
          to="/"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <Link to="/" className="mb-8 flex justify-center">
          <Logo size={40} />
        </Link>

        <div className="rounded-lg border border-[#262626] bg-[#141414] p-6">
          <h1 className="mb-2 text-center text-xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Start organizing your bookmarks
          </p>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full gap-2 border-[#262626] bg-[#1a1a1a] hover:bg-[#262626]"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Your name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-[#262626] bg-[#1a1a1a]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#262626] bg-[#1a1a1a]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#262626] bg-[#1a1a1a] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Clerk CAPTCHA container for bot protection */}
            <div id="clerk-captcha" className="flex justify-center" />

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-white hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground/60">
          By signing up, you agree to our{" "}
          <a
            href="https://weekday.so/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-white transition-colors"
          >
            terms of service
          </a>{" "}
          and{" "}
          <a
            href="https://weekday.so/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-white transition-colors"
          >
            privacy policy
          </a>
          .
        </p>
      </motion.div>
    </div>
  )
}
