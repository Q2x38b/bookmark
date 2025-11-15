# Fonts Setup

This project uses custom fonts for the modern, sleek design:

## Required Fonts

### Satoshi
Download from: https://www.fontshare.com/fonts/satoshi

Required weights:
- Light (300)
- Regular (400)
- Medium (500)
- Bold (700)
- Black (900)

### Geist & Geist Mono
These are loaded from Google Fonts CDN automatically.

## Installation

1. Create a `fonts/` directory in the project root
2. Download Satoshi font files (.woff format)
3. Place the following files in the `fonts/` directory:
   - `Satoshi-Light.woff`
   - `Satoshi-Regular.woff`
   - `Satoshi-Medium.woff`
   - `Satoshi-Bold.woff`
   - `Satoshi-Black.woff`

## Directory Structure

```
BMarks Project/
├── fonts/
│   ├── Satoshi-Light.woff
│   ├── Satoshi-Regular.woff
│   ├── Satoshi-Medium.woff
│   ├── Satoshi-Bold.woff
│   └── Satoshi-Black.woff
├── styles/
│   ├── main.css (references ../fonts/)
│   ├── auth.css
│   └── home.css
└── ...
```

## Fallback

If Satoshi fonts are not found, the system will fall back to:
- `-apple-system`
- `BlinkMacSystemFont`
- `Segoe UI`
- `Helvetica`
- `Arial`
- `sans-serif`

## License

Make sure to check the license terms for Satoshi before using in production.
Geist fonts are open source and free to use.

