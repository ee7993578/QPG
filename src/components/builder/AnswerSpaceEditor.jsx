import React from 'react'
import { Select } from '../ui/Select'
import { Input, Label } from '../ui/Input'
import { ANSWER_SPACE_OPTIONS } from '../../data/mockData'

/**
 * SRS 6 (answer space), 7 (drawing space) — a layout-only property that
 * never affects marks. Lets a teacher reserve blank lines, a fixed-height
 * box, half/full page, or a drawing area under a question.
 */
export function AnswerSpaceEditor({ value, onChange }) {
  const v = value || { type: 'none', lines: 4, heightMm: 40 }
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <Label>Answer Space</Label>
        <Select value={v.type} onChange={(e) => onChange({ ...v, type: e.target.value })} className="h-8 text-xs">
          {ANSWER_SPACE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
      {v.type === 'custom' && (
        <div>
          <Label>Height (mm)</Label>
          <Input
            type="number" min="5" className="h-8 w-20 text-xs"
            value={v.heightMm ?? 40}
            onChange={(e) => onChange({ ...v, heightMm: Number(e.target.value) || 0 })}
          />
        </div>
      )}
      {v.type === 'drawing' && (
        <div>
          <Label>Box Height (mm)</Label>
          <Input
            type="number" min="20" className="h-8 w-20 text-xs"
            value={v.heightMm ?? 55}
            onChange={(e) => onChange({ ...v, heightMm: Number(e.target.value) || 0 })}
          />
        </div>
      )}
    </div>
  )
}
