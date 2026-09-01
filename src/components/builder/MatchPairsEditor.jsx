import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'

/** SRS 4 — a real two-column table editor for Match the Following. */
export function MatchPairsEditor({ paperId, sectionId, groupId, questionId, matchPairs, matchColumnHeads }) {
  const addMatchPair = useAppStore((s) => s.addMatchPair)
  const updateMatchPair = useAppStore((s) => s.updateMatchPair)
  const deleteMatchPair = useAppStore((s) => s.deleteMatchPair)
  const updateQuestion = useAppStore((s) => s.updateQuestion)
  const heads = matchColumnHeads || ['Column I', 'Column II']
  const list = matchPairs || []

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
        <Input
          value={heads[0]}
          onChange={(e) => updateQuestion(paperId, sectionId, groupId, questionId, { matchColumnHeads: [e.target.value, heads[1]] })}
          className="h-7 text-[11px] font-semibold"
        />
        <Input
          value={heads[1]}
          onChange={(e) => updateQuestion(paperId, sectionId, groupId, questionId, { matchColumnHeads: [heads[0], e.target.value] })}
          className="h-7 text-[11px] font-semibold"
        />
        <span />
      </div>
      {list.map((pair) => (
        <div key={pair.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5">
          <Input
            placeholder="A. Item"
            value={pair.left}
            onChange={(e) => updateMatchPair(paperId, sectionId, groupId, questionId, pair.id, { left: e.target.value })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="1. Match"
            value={pair.right}
            onChange={(e) => updateMatchPair(paperId, sectionId, groupId, questionId, pair.id, { right: e.target.value })}
            className="h-8 text-xs"
          />
          <button
            onClick={() => deleteMatchPair(paperId, sectionId, groupId, questionId, pair.id)}
            className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"
          ><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addMatchPair(paperId, sectionId, groupId, questionId)}>
        <Plus className="h-3 w-3" /> Add Row
      </Button>
    </div>
  )
}
