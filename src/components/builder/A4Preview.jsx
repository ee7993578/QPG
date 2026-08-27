import React, { useMemo } from 'react'
import { sectionLetter, formatDate, formatDuration, computeSectionMarks, buildNumbering } from '../../lib/utils'
import { GROUP_MODES } from '../../data/mockData'

function modeInstruction(group) {
  const modeInfo = GROUP_MODES.find((m) => m.value === group.mode)
  if (group.mode === 'attempt_any') {
    return `Attempt any ${group.attemptCount} out of ${group.questionCount} questions. (${group.marksPerQuestion} marks each)`
  }
  if (group.mode === 'or') {
    return `Attempt any ONE option. (${group.marksPerQuestion} marks)`
  }
  return group.instruction || `${modeInfo?.label ?? ''}`
}

export function A4Preview({ paper, pageRef }) {
  const numbering = useMemo(() => buildNumbering(paper), [paper])
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType

  return (
    <div
      ref={pageRef}
      id="print-root"
      className="a4-page mx-auto w-full max-w-[720px] rounded-sm border border-ink-200/70 bg-paper-50 px-8 py-9 shadow-page dark:border-ink-800 sm:px-12 sm:py-12"
    >
      {/* Header */}
      <div className="border-b-2 border-ink-800 pb-4 text-center font-display">
        <p className="text-lg font-bold uppercase tracking-wide text-ink-900">{paper.schoolName || 'School Name'}</p>
        <p className="mt-1 text-base font-semibold uppercase text-ink-700">{examTitle || 'Examination'}</p>
        <div className="mt-3 flex flex-wrap justify-between gap-y-1 text-left text-[13px] font-sans text-ink-700">
          <span>Class: <strong>{paper.className}{paper.section ? `-${paper.section}` : ''}</strong></span>
          <span>Subject: <strong>{paper.subject}</strong></span>
          <span>Date: <strong>{formatDate(paper.examDate) || '—'}</strong></span>
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-y-1 text-left text-[13px] font-sans text-ink-700">
          <span>Time Allowed: <strong>{formatDuration(paper.duration) || '—'}</strong></span>
          <span>Maximum Marks: <strong>{paper.totalMarks || '—'}</strong></span>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-6 space-y-7">
        {paper.sections.length === 0 && (
          <p className="text-center text-sm italic text-ink-400">
            Add a section from the editor to see it appear here.
          </p>
        )}
        {paper.sections.map((section, sIdx) => {
          const { obtainableMarks } = computeSectionMarks(section)
          return (
            <div key={section.id}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gold-500 font-display text-sm font-bold text-gold-600">
                  {sectionLetter(sIdx)}
                </span>
                <h3 className="font-display text-[15px] font-semibold uppercase tracking-wide text-ink-900">
                  {section.title || `Section ${sectionLetter(sIdx)}`}
                </h3>
                <span className="ml-auto text-xs font-mono text-ink-400">[{obtainableMarks} marks]</span>
              </div>
              {section.instruction && (
                <p className="mb-3 text-[12.5px] italic text-ink-500">{section.instruction}</p>
              )}

              <div className="space-y-4">
                {section.questionGroups.map((group) => (
                  <div key={group.id}>
                    {(group.instruction || group.mode !== 'normal') && (
                      <p className="mb-1.5 text-[12px] italic text-ink-500">{modeInstruction(group)}</p>
                    )}
                    <ol className="space-y-2">
                      {group.mode === 'or' ? (
                        <li className="flex gap-2 text-[13.5px] leading-relaxed text-ink-800">
                          <span className="font-semibold shrink-0">{numbering.get(group.questions[0]?.id)?.number}.</span>
                          <div className="flex-1 space-y-1.5">
                            {group.questions.map((question, i) => (
                              <div key={question.id} className="flex gap-1.5">
                                <span className="font-semibold shrink-0">({String.fromCharCode(65 + i)})</span>
                                <span className={question.text ? '' : 'italic text-ink-300'}>
                                  {question.text || 'Untitled question…'}
                                </span>
                                {i < group.questions.length - 1 && (
                                  <span className="ml-1 shrink-0 font-display italic text-gold-600">OR</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="shrink-0 font-mono text-xs text-ink-400">[{group.marksPerQuestion}]</span>
                        </li>
                      ) : (
                        group.questions.map((question) => (
                          <li key={question.id} className="flex gap-2 text-[13.5px] leading-relaxed text-ink-800">
                            <span className="font-semibold shrink-0">{numbering.get(question.id)?.number}.</span>
                            <span className={`flex-1 ${question.text ? '' : 'italic text-ink-300'}`}>
                              {question.text || 'Untitled question…'}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-ink-400">[{question.marks}]</span>
                          </li>
                        ))
                      )}
                    </ol>
                  </div>
                ))}
                {section.questionGroups.length === 0 && (
                  <p className="text-xs italic text-ink-300">No questions added to this section yet.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 border-t border-dashed border-ink-200 pt-2 text-center text-[10px] text-ink-300">
        — End of Question Paper —
      </div>
    </div>
  )
}
