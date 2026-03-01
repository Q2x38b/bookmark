import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { LogoIcon } from '@/components/logo'
import { Loader2 } from 'lucide-react'

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
// Color hex code regex
const COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
// Image URL regex
const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i

function isUrl(text: string): boolean {
  return URL_REGEX.test(text) || text.startsWith('http://') || text.startsWith('https://')
}

function isColorCode(text: string): boolean {
  return COLOR_REGEX.test(text)
}

function isImageUrl(text: string): boolean {
  return IMAGE_URL_REGEX.test(text) && isUrl(text)
}

async function fetchMetadata(url: string): Promise<{ title: string; favicon: string }> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(fullUrl)
    const domain = urlObj.hostname
    const title = domain.replace(/^www\./, '').split('.')[0]
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    return { title: capitalizedTitle, favicon }
  } catch {
    return { title: url, favicon: '' }
  }
}

export default function AddBookmark() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [status, setStatus] = useState<'loading' | 'creating' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  )

  // Get groups for current user
  const groups = useQuery(
    api.groups.getGroups,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  )

  const createBookmark = useMutation(api.bookmarks.createBookmark)

  // Initialize user in Convex
  useEffect(() => {
    if (user && isUserLoaded) {
      getOrCreateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || undefined,
        imageUrl: user.imageUrl || undefined,
      })
    }
  }, [user, isUserLoaded, getOrCreateUser])

  // Create bookmark when we have all the data
  useEffect(() => {
    const createBookmarkFromUrl = async () => {
      if (!isUserLoaded) return

      // If not signed in, redirect to sign-in with return URL
      if (!user) {
        const returnUrl = `/add?${searchParams.toString()}`
        navigate(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`)
        return
      }

      if (!currentUser?._id || !groups || groups.length === 0) return

      setStatus('creating')

      // Get parameters from URL
      const url = searchParams.get('url')
      const title = searchParams.get('title')
      const text = searchParams.get('text')
      const color = searchParams.get('color')
      const type = searchParams.get('type') as 'link' | 'text' | 'color' | 'image' | null
      const groupName = searchParams.get('group')

      // Find target group
      let targetGroupId = groups[0]._id
      if (groupName) {
        const foundGroup = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase())
        if (foundGroup) {
          targetGroupId = foundGroup._id
        }
      }

      try {
        // Determine what to create based on parameters
        if (color && isColorCode(color)) {
          // Create color bookmark
          await createBookmark({
            userId: currentUser._id,
            groupId: targetGroupId,
            type: 'color',
            title: title || color,
            color: color,
          })
          toast.success('Color saved')
        } else if (url) {
          // Check if it's an image URL
          if (type === 'image' || isImageUrl(url)) {
            await createBookmark({
              userId: currentUser._id,
              groupId: targetGroupId,
              type: 'image',
              title: title || 'Image',
              imageUrl: url.startsWith('http') ? url : `https://${url}`,
            })
            toast.success('Image saved')
          } else if (isUrl(url)) {
            // Create link bookmark
            const metadata = await fetchMetadata(url)
            await createBookmark({
              userId: currentUser._id,
              groupId: targetGroupId,
              type: 'link',
              title: title || metadata.title,
              url: url.startsWith('http') ? url : `https://${url}`,
              favicon: metadata.favicon,
            })
            toast.success('Link saved')
          } else {
            throw new Error('Invalid URL')
          }
        } else if (text) {
          // Create text bookmark
          await createBookmark({
            userId: currentUser._id,
            groupId: targetGroupId,
            type: 'text',
            title: title || (text.length > 50 ? text.slice(0, 50) + '...' : text),
            content: text,
          })
          toast.success('Note saved')
        } else {
          throw new Error('No content provided. Use ?url=, ?text=, or ?color= parameters.')
        }

        setStatus('success')

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/')
        }, 500)
      } catch (error) {
        console.error('Failed to create bookmark:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create bookmark')
        toast.error('Failed to save bookmark')
      }
    }

    createBookmarkFromUrl()
  }, [isUserLoaded, user, currentUser, groups, searchParams, createBookmark, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <LogoIcon className="h-10 w-10 mx-auto" />

        {status === 'loading' && (
          <div className="space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}

        {status === 'creating' && (
          <div className="space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Saving bookmark...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Bookmark saved! Redirecting...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
