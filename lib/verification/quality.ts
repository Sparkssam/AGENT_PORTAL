import sharp from "sharp"
import { QUALITY_ISSUES, type QualityCheckResult, type QualityIssue, type QualityMetrics } from "./types"

const MIN_LAPLACIAN_VARIANCE = 55
const MAX_GLARE_RATIO = 0.12
const MIN_COVERAGE = 0.32
const MIN_EDGE_MARGIN = 0.018

function pixel(data: Buffer, width: number, x: number, y: number) {
  return data[y * width + x] ?? 0
}

function laplacianVariance(data: Buffer, width: number, height: number) {
  const values: number[] = []
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const value =
        pixel(data, width, x, y - 1) +
        pixel(data, width, x - 1, y) +
        pixel(data, width, x + 1, y) +
        pixel(data, width, x, y + 1) -
        4 * pixel(data, width, x, y)
      values.push(value)
    }
  }
  if (!values.length) return 0
  const mean = values.reduce((sum, n) => sum + n, 0) / values.length
  const variance = values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length
  return variance
}

function glareRatio(data: Buffer, width: number, height: number) {
  let hot = 0
  const window = 16
  let blob = false
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] >= 245) hot += 1
  }
  for (let y = 0; y < height - window; y += window) {
    for (let x = 0; x < width - window; x += window) {
      let cellHot = 0
      for (let yy = 0; yy < window; yy += 1) {
        for (let xx = 0; xx < window; xx += 1) {
          if (pixel(data, width, x + xx, y + yy) >= 245) cellHot += 1
        }
      }
      if (cellHot / (window * window) > 0.72) blob = true
    }
  }
  const ratio = hot / Math.max(1, data.length)
  return blob ? Math.max(ratio, MAX_GLARE_RATIO + 0.01) : ratio
}

function frameMetrics(data: Buffer, width: number, height: number) {
  const mag = Buffer.alloc(width * height)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const gx = pixel(data, width, x + 1, y) - pixel(data, width, x - 1, y)
      const gy = pixel(data, width, x, y + 1) - pixel(data, width, x, y - 1)
      mag[y * width + x] = Math.min(255, Math.hypot(gx, gy))
    }
  }

  let sum = 0
  for (let i = 0; i < mag.length; i += 1) sum += mag[i]
  const mean = sum / mag.length
  const threshold = Math.max(28, mean * 1.35)

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let count = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mag[y * width + x] < threshold) continue
      count += 1
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (count < 80) {
    return {
      coverage: 0,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
      cornersVisible: false,
    }
  }

  const boxW = Math.max(1, maxX - minX)
  const boxH = Math.max(1, maxY - minY)
  const coverage = (boxW * boxH) / (width * height)
  const marginLeft = minX / width
  const marginRight = (width - 1 - maxX) / width
  const marginTop = minY / height
  const marginBottom = (height - 1 - maxY) / height

  const cornerSize = Math.max(8, Math.floor(Math.min(boxW, boxH) * 0.18))
  const regions = [
    [minX, minY],
    [maxX - cornerSize, minY],
    [minX, maxY - cornerSize],
    [maxX - cornerSize, maxY],
  ] as const
  const cornersVisible = regions.every(([sx, sy]) => {
    let hits = 0
    for (let y = sy; y < sy + cornerSize; y += 1) {
      for (let x = sx; x < sx + cornerSize; x += 1) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue
        if (mag[y * width + x] >= threshold) hits += 1
      }
    }
    return hits >= 12
  })

  return { coverage, marginLeft, marginRight, marginTop, marginBottom, cornersVisible }
}

export async function checkImageQuality(input: Buffer): Promise<QualityCheckResult> {
  const normalized = await sharp(input, { failOn: "none" }).rotate().toBuffer()
  const preview = sharp(normalized).greyscale().resize({ width: 640, withoutEnlargement: true })
  const { data, info } = await preview.raw().toBuffer({ resolveWithObject: true })
  const width = info.width
  const height = info.height

  const laplacian = laplacianVariance(data, width, height)
  const glare = glareRatio(data, width, height)
  const frame = frameMetrics(data, width, height)

  const metrics: QualityMetrics = {
    laplacianVariance: Number(laplacian.toFixed(2)),
    glareRatio: Number(glare.toFixed(4)),
    coverage: Number(frame.coverage.toFixed(4)),
    marginLeft: Number(frame.marginLeft.toFixed(4)),
    marginRight: Number(frame.marginRight.toFixed(4)),
    marginTop: Number(frame.marginTop.toFixed(4)),
    marginBottom: Number(frame.marginBottom.toFixed(4)),
    width,
    height,
  }

  const issues: QualityIssue[] = []
  if (metrics.laplacianVariance < MIN_LAPLACIAN_VARIANCE) issues.push(QUALITY_ISSUES.blurry)
  if (metrics.glareRatio > MAX_GLARE_RATIO) issues.push(QUALITY_ISSUES.glare)
  const cropped =
    !frame.cornersVisible ||
    frame.coverage < MIN_COVERAGE ||
    frame.marginLeft < MIN_EDGE_MARGIN ||
    frame.marginRight < MIN_EDGE_MARGIN ||
    frame.marginTop < MIN_EDGE_MARGIN ||
    frame.marginBottom < MIN_EDGE_MARGIN
  if (cropped) issues.push(QUALITY_ISSUES.cropped)

  return { passed: issues.length === 0, issues, metrics }
}
