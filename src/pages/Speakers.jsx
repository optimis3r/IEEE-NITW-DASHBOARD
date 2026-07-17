import CrmPage from '../components/crm/CrmPage'

const FIELDS = [
  { key: 'full_name', label: 'Speaker', type: 'text', required: true, searchable: true },
  { key: 'organization', label: 'Organization', type: 'text', searchable: true },
  { key: 'topic', label: 'Topic', type: 'text', searchable: true },
  { key: 'email', label: 'Email', type: 'text', inTable: false },
  { key: 'phone', label: 'Phone', type: 'text', inTable: false },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ['identified', 'contacted', 'follow_up', 'confirmed', 'declined'],
  },
  { key: 'deck_url', label: 'Deck', type: 'file' },
  { key: 'notes', label: 'Notes', type: 'textarea', inTable: false },
]

export default function Speakers() {
  return (
    <CrmPage
      table="speakers"
      title="Speakers"
      description="Speaker outreach pipeline with deck uploads"
      fields={FIELDS}
    />
  )
}
