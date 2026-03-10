import { useEffect, useState, forwardRef } from "react"
import QRCodeLib from "qrcode"

interface RoundedQRCodeProps {
  value: string
  size?: number
  fgColor?: string
  bgColor?: string
  level?: "L" | "M" | "Q" | "H"
}

export const RoundedQRCode = forwardRef<HTMLDivElement, RoundedQRCodeProps>(
  ({ value, size = 180, fgColor = "#000000", bgColor = "transparent", level = "M" }, ref) => {
    const [modules, setModules] = useState<boolean[][]>([])

    useEffect(() => {
      const generate = async () => {
        try {
          const qr = await QRCodeLib.create(value, {
            errorCorrectionLevel: level,
          })
          const moduleCount = qr.modules.size
          const data = qr.modules.data

          const matrix: boolean[][] = []
          for (let row = 0; row < moduleCount; row++) {
            const rowData: boolean[] = []
            for (let col = 0; col < moduleCount; col++) {
              rowData.push(data[row * moduleCount + col] === 1)
            }
            matrix.push(rowData)
          }
          setModules(matrix)
        } catch {
          console.error("Failed to generate QR code")
        }
      }
      generate()
    }, [value, level])

    if (modules.length === 0) return null

    const moduleCount = modules.length
    const moduleSize = size / moduleCount

    // Check if position is part of finder pattern
    const isFinderPattern = (row: number, col: number) => {
      // Top-left finder pattern (0-6, 0-6)
      if (row < 7 && col < 7) return true
      // Top-right finder pattern (0-6, moduleCount-7 to moduleCount-1)
      if (row < 7 && col >= moduleCount - 7) return true
      // Bottom-left finder pattern (moduleCount-7 to moduleCount-1, 0-6)
      if (row >= moduleCount - 7 && col < 7) return true
      return false
    }

    // Render a single finder pattern with rounded outer square and inner circle
    const renderFinderPattern = (startRow: number, startCol: number) => {
      const x = startCol * moduleSize
      const y = startRow * moduleSize
      const patternSize = 7 * moduleSize
      const outerRadius = moduleSize * 0.8
      const middleSize = 5 * moduleSize
      const middleOffset = moduleSize
      const innerSize = 3 * moduleSize

      return (
        <g key={`finder-${startRow}-${startCol}`}>
          {/* Outer rounded square */}
          <rect
            x={x}
            y={y}
            width={patternSize}
            height={patternSize}
            rx={outerRadius}
            ry={outerRadius}
            fill={fgColor}
          />
          {/* Middle white rounded square */}
          <rect
            x={x + middleOffset}
            y={y + middleOffset}
            width={middleSize}
            height={middleSize}
            rx={outerRadius * 0.6}
            ry={outerRadius * 0.6}
            fill={bgColor === "transparent" ? "#ffffff" : bgColor}
          />
          {/* Inner circle */}
          <circle
            cx={x + patternSize / 2}
            cy={y + patternSize / 2}
            r={innerSize / 2}
            fill={fgColor}
          />
        </g>
      )
    }

    return (
      <div ref={ref}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {bgColor !== "transparent" && (
            <rect width={size} height={size} fill={bgColor} />
          )}

          {/* Render finder patterns */}
          {renderFinderPattern(0, 0)}
          {renderFinderPattern(0, moduleCount - 7)}
          {renderFinderPattern(moduleCount - 7, 0)}

          {/* Render data modules as circles */}
          {modules.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (!cell) return null
              // Skip finder pattern areas
              if (isFinderPattern(rowIndex, colIndex)) return null

              const cx = colIndex * moduleSize + moduleSize / 2
              const cy = rowIndex * moduleSize + moduleSize / 2
              const radius = moduleSize * 0.4

              return (
                <circle
                  key={`${rowIndex}-${colIndex}`}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={fgColor}
                />
              )
            })
          )}
        </svg>
      </div>
    )
  }
)

RoundedQRCode.displayName = "RoundedQRCode"
