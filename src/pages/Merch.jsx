import CrmPage from '../components/crm/CrmPage'

const FIELDS = [
  { key: 'item_name', label: 'Item', type: 'text', required: true, searchable: true },
  { key: 'vendor', label: 'Vendor', type: 'text', searchable: true },
  { key: 'quantity', label: 'Qty', type: 'number' },
  { key: 'unit_price', label: 'Unit price (₹)', type: 'number' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ['pending', 'ordered', 'in_production', 'delivered', 'cancelled'],
  },
  { key: 'notes', label: 'Notes', type: 'textarea', inTable: false },
]

export default function Merch() {
  return (
    <CrmPage
      table="merch_orders"
      title="Merch"
      description="Merchandise orders and vendor tracking"
      fields={FIELDS}
    />
  )
}
