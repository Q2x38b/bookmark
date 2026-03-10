import { useUser as useClerkUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useEffect } from "react"
import { Id } from "../../convex/_generated/dataModel"

export function useUser() {
  const { user: clerkUser, isLoaded } = useClerkUser()
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)

  const user = useQuery(
    api.users.getCurrentUser,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  )

  useEffect(() => {
    if (isLoaded && clerkUser) {
      getOrCreateUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "User",
        avatarUrl: clerkUser.imageUrl,
      })
    }
  }, [isLoaded, clerkUser, getOrCreateUser])

  return {
    user,
    userId: user?._id as Id<"users"> | undefined,
    clerkUser,
    isLoaded: isLoaded && (user !== undefined || !clerkUser),
  }
}
