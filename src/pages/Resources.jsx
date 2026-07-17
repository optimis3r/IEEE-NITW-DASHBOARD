import CrmPage from '../components/crm/CrmPage'

const FIELDS = [
  { key: 'title', label: 'Title', type: 'text', required: true, searchable: true },
  { key: 'category', label: 'Category', type: 'text', searchable: true },
  { key: 'description', label: 'Description', type: 'textarea', inTable: false },
  { key: 'file_url', label: 'File', type: 'file' },
  { key: 'external_url', label: 'External link', type: 'url' },
]

export default function Resources() {
  return (
    <CrmPage
      table="resources"
      title="Resources"
      description="Shared assets, templates, and reference material"
      fields={FIELDS}
    />
  )
}
