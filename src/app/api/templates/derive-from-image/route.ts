import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/session'
import { validateMimeType, sanitizeFilename, ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/security'
import { type DerivedTemplate } from '@/lib/schema'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('image') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  if (!validateMimeType(file.type, ALLOWED_IMAGE_MIME_TYPES)) {
    return NextResponse.json({
      error: 'Invalid file type. Only JPEG and PNG images are allowed.'
    }, { status: 400 })
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({
      error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`
    }, { status: 400 })
  }

  try {
    const sharp = (await import('sharp')).default
    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharp(buffer).metadata()

    const width = metadata.width || 595
    const height = metadata.height || 842
    const aspectRatio = height / width

    const pageRatio: 'a4' | 'letter' = aspectRatio > 1.35 ? 'a4' : 'letter'

    const { dominant } = await sharp(buffer)
      .resize(100, 100, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(async ({ data }) => {
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 3) {
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) continue
          if (data[i] < 20 && data[i + 1] < 20 && data[i + 2] < 20) continue
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
        }
        if (count === 0) return { dominant: '#2563eb' }
        r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count)
        return { dominant: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` }
      })

    const resized = await sharp(buffer)
      .resize(100, 140, { fit: 'fill' })
      .raw()
      .toBuffer()

    let leftDark = 0, rightLight = 0
    for (let y = 0; y < 140; y++) {
      for (let x = 0; x < 100; x++) {
        const idx = (y * 100 + x) * 3
        const brightness = (resized[idx] + resized[idx + 1] + resized[idx + 2]) / 3
        if (x < 30 && brightness < 100) leftDark++
        if (x >= 30 && brightness > 200) rightLight++
      }
    }

    const columns: 1 | 2 = (leftDark > 1000 && rightLight > 1000) ? 2 : 1

    const blocks = columns === 2 ? [
      { id: uuidv4(), type: 'sidebar' as const, x: 0, y: 0, w: 0.3, h: 1.0, section: 'sidebar' },
      { id: uuidv4(), type: 'header' as const, x: 0.3, y: 0, w: 0.7, h: 0.15, section: 'personal' },
      { id: uuidv4(), type: 'main' as const, x: 0.3, y: 0.15, w: 0.7, h: 0.85, section: 'main' },
    ] : [
      { id: uuidv4(), type: 'header' as const, x: 0, y: 0, w: 1.0, h: 0.15, section: 'personal' },
      { id: uuidv4(), type: 'main' as const, x: 0, y: 0.15, w: 1.0, h: 0.85, section: 'main' },
    ]

    const derivedTemplate: DerivedTemplate = {
      id: uuidv4(),
      name: `Derived from ${sanitizeFilename(file.name)}`,
      pageRatio,
      columns,
      blocks,
      palette: {
        primary: dominant,
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
      },
      spacing: 'normal',
      fallbackTemplateId: columns === 2 ? 'two-column' : 'modern',
    }

    return NextResponse.json({
      template: derivedTemplate,
      note: 'This is a best-effort layout detection. Exact pixel-perfect copying is not guaranteed. You can adjust block boundaries in the UI.',
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image processing failed'
    return NextResponse.json({
      error: message,
      fallback: true,
      fallbackTemplateId: 'modern',
      message: 'Could not analyze image. Please choose a built-in template instead.',
    }, { status: 422 })
  }
}
