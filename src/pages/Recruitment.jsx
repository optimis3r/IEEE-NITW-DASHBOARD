import CrmPage from '../components/crm/CrmPage'

const FIELDS = [
  { key: 'candidate_name', label: 'Candidate', type: 'text', required: true, searchable: true },
  { key: 'email', label: 'Email', type: 'text', searchable: true },
  { key: 'phone', label: 'Phone', type: 'text', inTable: false },
  { key: 'branch_year', label: 'Branch / Year', type: 'text', searchable: true },
  { key: 'position_applied', label: 'Position', type: 'text', searchable: true },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ['applied', 'shortlisted', 'interviewed', 'accepted', 'rejected'],
  },
  { key: 'resume_url', label: 'Resume', type: 'file' },
  { key: 'notes', label: 'Notes', type: 'textarea', inTable: false },
]

export default function Recruitment() {
  return (
    <CrmPage
      table="recruitment"
      title="Recruitment"
      description="Candidate pipeline with resume uploads"
      fields={FIELDS}
    />
  )
}
