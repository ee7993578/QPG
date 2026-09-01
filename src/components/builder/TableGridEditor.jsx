import React from 'react'
import { Input, Label } from '../ui/Input'
import { useAppStore } from '../../store/useAppStore'

/** SRS 13 — insert a fill-in table/grid inside a question. */
export function TableGridEditor({ paperId, sectionId, groupId, questionId, tableGrid }) {
  const setTableGrid = useAppStore((s) => s.setTableGrid)
  const updateTableCell = useAppStore((s) => s.updateTableCell)
  const grid = tableGrid || { rows: 2, cols: 2, cells: [['', ''], ['', '']] }

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2">
        <div>
          <Label>Rows</Label>
          <Input
            type="number" min="1" max="10" className="h-8 w-16 text-xs"
            value={grid.rows}
            onChange={(e) => setTableGrid(paperId, sectionId, groupId, questionId, Math.max(1, Number(e.target.value) || 1), grid.cols)}
          />
        </div>
        <div>
          <Label>Columns</Label>
          <Input
            type="number" min="1" max="8" className="h-8 w-16 text-xs"
            value={grid.cols}
            onChange={(e) => setTableGrid(paperId, sectionId, groupId, questionId, grid.rows, Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
      </div>
      <table className="border-collapse text-xs">
        <tbody>
          {grid.cells.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-ink-200 p-0.5 dark:border-ink-700">
                  <input
                    value={cell}
                    onChange={(e) => updateTableCell(paperId, sectionId, groupId, questionId, r, c, e.target.value)}
                    className="h-7 w-24 bg-transparent px-1 text-xs text-ink-900 focus-visible:focus-ring dark:text-ink-50"
                    placeholder={r === 0 ? 'Heading' : ''}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
