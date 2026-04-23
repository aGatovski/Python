import { Transaction } from '../types/transaction'
import CategoryBadge from './CategoryBadge'
import EmptyState from './EmptyState'

interface TransactionTableProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onAddNew: () => void
}

/**
 * Formats a number as a currency string with sign and 2 decimal places.
 * Positive values are shown in green, negative in red.
 */
function formatAmount(amount: number): { text: string; colorClass: string } {
  const formatted = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    signDisplay: 'always',
  }).format(amount)

  return {
    text: formatted,
    colorClass: amount >= 0 ? 'text-emerald-600' : 'text-red-500',
  }
}

/**
 * Formats an ISO date string to a human-readable short date.
 * e.g. "2024-03-15" → "Mar 15, 2024"
 */
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate + 'T00:00:00'))
}

/**
 * Responsive transaction table with edit and delete action buttons per row.
 * Shows an EmptyState when the transactions array is empty.
 */
export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  onAddNew,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="Add your first transaction or adjust your filters to see results."
        action={{ label: 'Add Transaction', onClick: onAddNew }}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Transactions list">
        <thead>
          <tr className="border-b border-slate-100">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              Amount
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              Category
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              Description
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((txn) => {
            const { text: amountText, colorClass } = formatAmount(txn.amount)
            return (
              <tr
                key={txn.id}
                className="group hover:bg-slate-50 transition-colors"
              >
                {/* Date */}
                <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 tabular-nums">
                  {formatDate(txn.date)}
                </td>

                {/* Amount — right-aligned, color-coded */}
                <td className={`px-4 py-3.5 text-right whitespace-nowrap font-medium tabular-nums ${colorClass}`}>
                  {amountText}
                </td>

                {/* Category badge */}
                <td className="px-4 py-3.5">
                  <CategoryBadge category={txn.category} />
                </td>

                {/* Description */}
                <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate" title={txn.description}>
                  {txn.description}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {/* Edit button */}
                    <button
                      onClick={() => onEdit(txn)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Edit transaction: ${txn.description}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(txn.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete transaction: ${txn.description}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}