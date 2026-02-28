import { SignUp as ClerkSignUp } from '@clerk/clerk-react'
import { Logo } from '@/components/logo'
import { Link } from 'react-router-dom'

export default function SignUp() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link to="/">
          <Logo />
        </Link>
      </div>
      <div className="w-full max-w-md">
        <ClerkSignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-background border border-border shadow-lg rounded-lg",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-secondary border border-border text-foreground hover:bg-accent",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-background border-border text-foreground",
              footerActionLink: "text-primary hover:text-primary/80",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
            },
            variables: {
              colorPrimary: "#fafafa",
              colorBackground: "#0a0a0a",
              colorText: "#fafafa",
              colorTextSecondary: "#a3a3a3",
              colorInputBackground: "#0a0a0a",
              colorInputText: "#fafafa",
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  )
}
