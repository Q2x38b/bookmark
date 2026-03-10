import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return ""
  }
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized
  }
  return normalized
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return "Today"
  } else if (diffInDays === 1) {
    return "Yesterday"
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks}w ago`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months}mo ago`
  } else {
    const years = Math.floor(diffInDays / 365)
    return `${years}y ago`
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function isImageFile(fileName: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"]
  const lowerName = fileName.toLowerCase()
  return imageExtensions.some((ext) => lowerName.endsWith(ext))
}

export function isPdfFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf")
}

export function isVideoFile(fileName: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"]
  const lowerName = fileName.toLowerCase()
  return videoExtensions.some((ext) => lowerName.endsWith(ext))
}

export function isAudioFile(fileName: string): boolean {
  const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]
  const lowerName = fileName.toLowerCase()
  return audioExtensions.some((ext) => lowerName.endsWith(ext))
}

export function getFileType(fileName: string): "image" | "pdf" | "video" | "audio" | "other" {
  if (isImageFile(fileName)) return "image"
  if (isPdfFile(fileName)) return "pdf"
  if (isVideoFile(fileName)) return "video"
  if (isAudioFile(fileName)) return "audio"
  return "other"
}
