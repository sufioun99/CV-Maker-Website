export interface TemplateDefinition {
  id: string
  name: string
  description: string
  category: string
  columns: 1 | 2
  preview: string // CSS class or color
  accentColor: string
  fontFamily: string
  tags: string[]
}

export const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with bold headers and accent colors',
    category: 'professional',
    columns: 1,
    preview: 'bg-blue-50 border-blue-500',
    accentColor: '#2563eb',
    fontFamily: 'Inter',
    tags: ['modern', 'clean', 'professional'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant design focusing on content with minimal decoration',
    category: 'simple',
    columns: 1,
    preview: 'bg-gray-50 border-gray-400',
    accentColor: '#374151',
    fontFamily: 'Georgia',
    tags: ['minimal', 'simple', 'elegant'],
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional CV format with serif fonts and formal structure',
    category: 'traditional',
    columns: 1,
    preview: 'bg-amber-50 border-amber-700',
    accentColor: '#92400e',
    fontFamily: 'Georgia',
    tags: ['classic', 'traditional', 'formal'],
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Modern two-column layout with sidebar for skills and contact info',
    category: 'modern',
    columns: 2,
    preview: 'bg-indigo-50 border-indigo-600',
    accentColor: '#4f46e5',
    fontFamily: 'Inter',
    tags: ['two-column', 'modern', 'sidebar'],
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Designed for academics and researchers with publications support',
    category: 'academic',
    columns: 1,
    preview: 'bg-emerald-50 border-emerald-700',
    accentColor: '#065f46',
    fontFamily: 'Times New Roman',
    tags: ['academic', 'research', 'formal'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and vibrant design for creative professionals',
    category: 'creative',
    columns: 2,
    preview: 'bg-rose-50 border-rose-500',
    accentColor: '#e11d48',
    fontFamily: 'Poppins',
    tags: ['creative', 'colorful', 'bold'],
  },
]

export function getTemplate(id: string): TemplateDefinition | undefined {
  return BUILT_IN_TEMPLATES.find(t => t.id === id)
}
