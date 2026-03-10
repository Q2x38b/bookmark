import { useParams, Link } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe, Github } from "lucide-react"
import { Logo } from "@/components/Logo"

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()

  const profile = useQuery(
    api.users.getPublicProfile,
    username ? { username } : "skip"
  )

  const bookmarks = useQuery(
    api.users.getPublicBookmarks,
    profile?._id ? { userId: profile._id } : "skip"
  )

  // Loading state
  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Not found state
  if (profile === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-6xl font-bold text-muted-foreground/20">404</div>
        <p className="text-muted-foreground">Profile not found</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    )
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <Logo className="h-5 w-5" />
            <span className="font-medium text-sm">minimal</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex gap-16">
          {/* Profile Sidebar */}
          <aside className="w-64 shrink-0">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback className="text-2xl">
                {profile.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-xl font-semibold">{profile.name}</h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            <div className="mt-4 flex items-center gap-3">
              {profile.website && (
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={profile.website}
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {profile.githubUsername && (
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={`@${profile.githubUsername}`}
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {profile.twitterUsername && (
                <a
                  href={`https://x.com/${profile.twitterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={`@${profile.twitterUsername}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
            </div>
          </aside>

          {/* Bookmarks List */}
          <div className="flex-1 min-w-0">
            {/* Table Header */}
            <div className="flex items-center border-b border-border pb-3 mb-2">
              <div className="flex-1 text-sm font-medium text-muted-foreground">Title</div>
              <div className="w-20 text-sm font-medium text-muted-foreground text-right">Updated</div>
            </div>

            {/* Bookmarks */}
            {bookmarks && bookmarks.length > 0 ? (
              <div className="space-y-0">
                {bookmarks.map((bookmark) => (
                  <a
                    key={bookmark._id}
                    href={bookmark.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
                  >
                    {/* Favicon */}
                    <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {bookmark.favicon ? (
                        <img
                          src={bookmark.favicon}
                          alt=""
                          className="h-4 w-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {bookmark.title?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>

                    {/* Title and Domain */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {bookmark.title}
                      </span>
                      {bookmark.content && (
                        <span className="text-xs text-muted-foreground truncate">
                          {new URL(bookmark.content).hostname.replace("www.", "")}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="w-20 text-xs text-muted-foreground text-right shrink-0">
                      {formatDate(bookmark.updatedAt || bookmark.createdAt)}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 border border-border/50 mb-4">
                  <svg
                    className="h-6 w-6 text-muted-foreground/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                </div>
                <p className="font-medium text-foreground">No public bookmarks</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This user hasn't shared any bookmarks yet
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
