import { NextRequest, NextResponse } from 'next/server'
import { getSessionId, readSessionCV } from '@/lib/session'
import { CVSchema } from '@/lib/schema'
import { getTemplate } from '@/lib/templates'
import type { Paragraph } from 'docx'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return escapeHtml(url)
    }
  } catch {
    // invalid URL
  }
  return '#'
}

function generateCVHtml(cv: ReturnType<typeof CVSchema.parse>): string {
  const template = getTemplate(cv.customization.templateId) || getTemplate('modern')!
  const { primaryColor, textColor, backgroundColor, fontFamily, fontSize, lineHeight } = cv.customization
  const isA4 = cv.customization.paperSize === 'a4'
  const isTwoColumn = template.columns === 2

  const sectionOrder = cv.customization.sectionOrder.filter(s => !cv.customization.hiddenSections.includes(s))

  const experienceHtml = cv.experience.map(exp => `
    <div class="exp-item" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong style="font-size: ${fontSize + 1}px;">${escapeHtml(exp.role)}</strong>
          <span style="color: ${primaryColor};"> @ ${escapeHtml(exp.company)}</span>
          ${exp.location ? `<span style="color: #666;"> · ${escapeHtml(exp.location)}</span>` : ''}
        </div>
        <div style="font-size: ${fontSize - 1}px; color: #666; white-space: nowrap; margin-left: 8px;">
          ${escapeHtml(exp.startDate)}${exp.current ? ' – Present' : exp.endDate ? ` – ${escapeHtml(exp.endDate)}` : ''}
        </div>
      </div>
      ${exp.description ? `<p style="margin: 4px 0; color: #555;">${escapeHtml(exp.description)}</p>` : ''}
      ${exp.bullets.length > 0 ? `<ul style="margin: 4px 0 0 16px; padding: 0;">${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('')

  const educationHtml = cv.education.map(edu => `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <strong>${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ''}</strong>
          <div style="color: ${primaryColor};">${escapeHtml(edu.institution)}</div>
        </div>
        <div style="font-size: ${fontSize - 1}px; color: #666;">
          ${escapeHtml(edu.startDate)}${edu.endDate ? ` – ${escapeHtml(edu.endDate)}` : ''}
          ${edu.gpa ? `<div>GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
        </div>
      </div>
    </div>
  `).join('')

  const skillsHtml = `
    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
      ${cv.skills.map(s => `<span style="background: ${primaryColor}15; color: ${primaryColor}; padding: 2px 8px; border-radius: 12px; font-size: ${fontSize - 1}px;">${escapeHtml(s.name)}</span>`).join('')}
    </div>
  `

  const projectsHtml = cv.projects.map(p => `
    <div style="margin-bottom: 10px;">
      <strong>${escapeHtml(p.name)}</strong>${p.url ? ` · <a href="${sanitizeUrl(p.url)}" style="color: ${primaryColor};">${escapeHtml(p.url)}</a>` : ''}
      ${p.technologies.length > 0 ? `<div style="font-size: ${fontSize - 1}px; color: #666;">${escapeHtml(p.technologies.join(', '))}</div>` : ''}
      ${p.description ? `<p style="margin: 4px 0;">${escapeHtml(p.description)}</p>` : ''}
    </div>
  `).join('')

  const certificationsHtml = cv.certifications.map(c => `
    <div style="margin-bottom: 8px;">
      <strong>${escapeHtml(c.name)}</strong> – ${escapeHtml(c.issuer)}
      ${c.date ? `<span style="color: #666;"> (${escapeHtml(c.date)})</span>` : ''}
    </div>
  `).join('')

  const languagesHtml = cv.languages.map(l => `
    <span style="margin-right: 12px;">${escapeHtml(l.name)}${l.level ? ` (${escapeHtml(l.level)})` : ''}</span>
  `).join('')

  const sectionsMap: Record<string, { title: string; html: string }> = {
    summary: { title: 'Professional Summary', html: cv.summary ? `<p>${escapeHtml(cv.summary)}</p>` : '' },
    experience: { title: 'Experience', html: experienceHtml },
    education: { title: 'Education', html: educationHtml },
    skills: { title: 'Skills', html: skillsHtml },
    projects: { title: 'Projects', html: projectsHtml },
    certifications: { title: 'Certifications', html: certificationsHtml },
    languages: { title: 'Languages', html: languagesHtml },
  }

  const renderSection = (key: string) => {
    const s = sectionsMap[key]
    if (!s || !s.html.trim()) return ''
    return `
      <div class="section" style="margin-bottom: 16px;">
        <h2 style="font-size: ${fontSize + 2}px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">${s.title}</h2>
        ${s.html}
      </div>
    `
  }

  const mainSections = sectionOrder.filter(s => s !== 'personal' && s !== 'summary')
  const summarySections = sectionOrder.filter(s => s === 'summary')

  let bodyContent = ''
  if (isTwoColumn) {
    const leftSections = mainSections.filter(s => ['skills', 'languages', 'certifications'].includes(s))
    const rightSections = mainSections.filter(s => !['skills', 'languages', 'certifications'].includes(s))

    bodyContent = `
      <div style="display: flex; gap: 24px;">
        <div style="width: 35%; min-width: 35%;">
          ${summarySections.map(renderSection).join('')}
          ${leftSections.map(renderSection).join('')}
        </div>
        <div style="flex: 1;">
          ${rightSections.map(renderSection).join('')}
        </div>
      </div>
    `
  } else {
    bodyContent = [...summarySections, ...mainSections].map(renderSection).join('')
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: '${fontFamily}', sans-serif;
    font-size: ${fontSize}px;
    line-height: ${lineHeight};
    color: ${textColor};
    background: ${backgroundColor};
    width: ${isA4 ? '210mm' : '216mm'};
    min-height: ${isA4 ? '297mm' : '279mm'};
    padding: 20mm;
  }
  @media print {
    body { width: 100%; padding: 15mm; }
    @page { size: ${isA4 ? 'A4' : 'letter'}; margin: 0; }
  }
  h1 { font-size: ${fontSize + 10}px; color: ${textColor}; }
  h2 { font-size: ${fontSize + 2}px; }
  ul { list-style: disc; }
  a { color: ${primaryColor}; }
  .header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 3px solid ${primaryColor}; }
  .contact-info { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; font-size: ${fontSize - 1}px; color: #666; }
</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(cv.personal.fullName || 'Your Name')}</h1>
    ${cv.personal.title ? `<div style="font-size: ${fontSize + 2}px; color: ${primaryColor}; margin-top: 2px;">${escapeHtml(cv.personal.title)}</div>` : ''}
    <div class="contact-info">
      ${cv.personal.email ? `<span>✉ ${escapeHtml(cv.personal.email)}</span>` : ''}
      ${cv.personal.phone ? `<span>📞 ${escapeHtml(cv.personal.phone)}</span>` : ''}
      ${cv.personal.location ? `<span>📍 ${escapeHtml(cv.personal.location)}</span>` : ''}
      ${cv.personal.linkedin ? `<span>in ${escapeHtml(cv.personal.linkedin.replace('https://', ''))}</span>` : ''}
      ${cv.personal.github ? `<span>⌨ ${escapeHtml(cv.personal.github.replace('https://', ''))}</span>` : ''}
      ${cv.personal.website ? `<span>🌐 ${escapeHtml(cv.personal.website.replace('https://', ''))}</span>` : ''}
    </div>
  </div>
  ${bodyContent}
</body>
</html>`
}

async function generatePDF(html: string, paperSize: 'a4' | 'letter' = 'a4'): Promise<Buffer> {
  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdfBuffer = await page.pdf({
      format: paperSize === 'letter' ? 'Letter' : 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await browser.close()
    return Buffer.from(pdfBuffer)
  } catch {
    throw new Error('PDF generation requires Playwright. Run: npx playwright install chromium')
  }
}

async function generateDOCX(cv: ReturnType<typeof CVSchema.parse>): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx')

  const primaryColor = cv.customization.primaryColor.replace('#', '')

  const paragraphs: Paragraph[] = []

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: cv.personal.fullName || 'Your Name', bold: true, size: 36, color: primaryColor }),
      ],
      alignment: AlignmentType.CENTER,
    })
  )

  if (cv.personal.title) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: cv.personal.title, size: 24, color: '666666' })],
        alignment: AlignmentType.CENTER,
      })
    )
  }

  const contactParts = [
    cv.personal.email,
    cv.personal.phone,
    cv.personal.location,
    cv.personal.linkedin,
  ].filter(Boolean)
  if (contactParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join(' | '), size: 18, color: '666666' })],
        alignment: AlignmentType.CENTER,
      })
    )
  }

  paragraphs.push(new Paragraph({ text: '' }))

  if (cv.summary) {
    paragraphs.push(
      new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ children: [new TextRun({ text: cv.summary, size: 20 })] }),
      new Paragraph({ text: '' })
    )
  }

  if (cv.experience.length > 0) {
    paragraphs.push(new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_2 }))
    for (const exp of cv.experience) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.role, bold: true, size: 22 }),
            new TextRun({ text: ` @ ${exp.company}`, size: 22, color: primaryColor }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: `${exp.startDate}${exp.current ? ' – Present' : exp.endDate ? ` – ${exp.endDate}` : ''}${exp.location ? ` | ${exp.location}` : ''}`, size: 18, color: '666666' })],
        })
      )
      if (exp.description) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: exp.description, size: 20 })] }))
      }
      for (const bullet of exp.bullets) {
        paragraphs.push(new Paragraph({ text: bullet, bullet: { level: 0 } }))
      }
      paragraphs.push(new Paragraph({ text: '' }))
    }
  }

  if (cv.education.length > 0) {
    paragraphs.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2 }))
    for (const edu of cv.education) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: edu.institution, size: 20, color: primaryColor })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`, size: 18, color: '666666' })],
        }),
        new Paragraph({ text: '' })
      )
    }
  }

  if (cv.skills.length > 0) {
    paragraphs.push(
      new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [new TextRun({ text: cv.skills.map(s => s.name).join(' · '), size: 20 })],
      }),
      new Paragraph({ text: '' })
    )
  }

  if (cv.projects.length > 0) {
    paragraphs.push(new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_2 }))
    for (const proj of cv.projects) {
      paragraphs.push(
        new Paragraph({ children: [new TextRun({ text: proj.name, bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: proj.description, size: 20 })] }),
        new Paragraph({ text: '' })
      )
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  })

  return await Packer.toBuffer(doc)
}

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  const format = req.nextUrl.searchParams.get('format') || 'pdf'
  if (!['pdf', 'docx'].includes(format)) {
    return NextResponse.json({ error: 'Invalid format. Use pdf or docx' }, { status: 400 })
  }

  const cvData = await readSessionCV(sessionId)
  if (!cvData) {
    return NextResponse.json({ error: 'No CV found. Create one first.' }, { status: 404 })
  }

  const cvParsed = CVSchema.safeParse(cvData)
  if (!cvParsed.success) {
    return NextResponse.json({ error: 'Invalid CV data' }, { status: 400 })
  }

  const cv = cvParsed.data
  const name = (cv.personal.fullName || 'cv').replace(/[^a-zA-Z0-9]/g, '_')

  try {
    if (format === 'pdf') {
      const html = generateCVHtml(cv)
      const pdfBuffer = await generatePDF(html, cv.customization.paperSize)
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${name}.pdf"`,
        },
      })
    } else {
      const docxBuffer = await generateDOCX(cv)
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${name}.docx"`,
        },
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
