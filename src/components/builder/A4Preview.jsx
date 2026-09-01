import React, { useMemo } from 'react'
import { sectionLetter, formatDate, formatDuration, computeSectionMarks, computeGroupMarks, buildNumbering, formatMarks, questionEffectiveMarks, orderedQuestionsForSet, seedForSet, classSectionLabel, resolveSubject } from '../../lib/utils'
import { RichText } from '../../lib/richText'
import { GROUP_MODES, PAPER_SIZES } from '../../data/mockData'
import { EditableLine } from './EditableLine'
import { useAppStore } from '../../store/useAppStore'
import { useTranslate } from '../../i18n'

const FONT_CLASS = { sans: 'font-sans', serif: 'font-serif', display: 'font-display' }

// SRS 17.1/17.2 — lightweight visual template presets (header rule + accent).
const TEMPLATE_CLASS = {
  classic: { headerRule: 'border-b-2 border-ink-800', accent: 'text-gold-600 border-gold-500' },
  modern: { headerRule: 'border-b-4 border-ink-900 rounded-t-sm', accent: 'text-sky-600 border-sky-500' },
  minimal: { headerRule: 'border-b border-ink-300', accent: 'text-ink-500 border-ink-400' },
  school: { headerRule: 'border-b-2 border-double border-ink-800', accent: 'text-emerald-600 border-emerald-500' },
}

function modeInstruction(group) {
  const modeInfo = GROUP_MODES.find((m) => m.value === group.mode)
  let base
  if (group.mode === 'attempt_any') {
    base = `Attempt any ${group.attemptCount} out of ${group.questionCount} questions. (${group.marksPerQuestion} marks each)`
  } else if (group.mode === 'or') {
    base = `Attempt any ONE option. (${group.marksPerQuestion} marks)`
  } else {
    base = group.instruction || `${modeInfo?.label ?? ''}`
  }
  if (group.negativeMarks) {
    base = `${base ? base + ' ' : ''}(+${group.marksPerQuestion} correct, −${group.negativeMarks} incorrect)`
  }
  return base
}

function AnswerSpaceBlock({ space }) {
  if (!space || space.type === 'none') return null
  if (space.type === 'drawing') {
    return (
      <div
        className="mt-1.5 flex items-center justify-center rounded border border-dashed border-ink-300 text-[10px] italic text-ink-300 dark:border-ink-700"
        style={{ height: `${space.heightMm ?? 55}mm` }}
      >
        Drawing Space
      </div>
    )
  }
  if (space.type === 'half' || space.type === 'full' || space.type === 'custom') {
    const height = space.type === 'half' ? '55mm' : space.type === 'full' ? '110mm' : `${space.heightMm ?? 40}mm`
    return <div className="mt-1.5 rounded border border-dashed border-ink-200 dark:border-ink-700" style={{ height }} />
  }
  const lines = Number(space.type) || Number(space.lines) || 2
  return (
    <div className="mt-1.5 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="border-b border-dashed border-ink-300 dark:border-ink-700" />
      ))}
    </div>
  )
}

function QuestionImage({ image }) {
  if (!image?.url) return null
  return (
    <div className="my-1.5" style={{ width: `${image.width ?? 50}%` }}>
      <img src={image.url} alt={image.caption || 'question figure'} className="w-full rounded border border-ink-200 object-contain dark:border-ink-700" />
      {image.caption && <p className="mt-0.5 text-center text-[10px] italic text-ink-400">{image.caption}</p>}
    </div>
  )
}

function OptionsBlock({ options, layout, correctOptionId, showAnswerKey }) {
  if (!options || options.length === 0) return null
  const LETTERS = 'ABCDEFGH'
  return (
    <div className={`mt-1.5 ${layout === 'grid' ? 'grid grid-cols-2 gap-x-4 gap-y-1' : 'space-y-1'}`}>
      {options.map((opt, i) => {
        const isCorrect = showAnswerKey && correctOptionId === opt.id
        return (
          <div key={opt.id} className={`flex items-start gap-1.5 text-[13px] ${isCorrect ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-ink-800'}`}>
            <span className="font-semibold shrink-0">{LETTERS[i] || i + 1}.{isCorrect ? ' \u2713' : ''}</span>
            {opt.imageUrl ? (
              <img src={opt.imageUrl} alt={opt.text || 'option'} className="h-16 w-16 rounded border border-ink-200 object-cover dark:border-ink-700" />
            ) : (
              <span className={opt.text ? '' : 'italic text-ink-300'}>{opt.text ? <RichText text={opt.text} /> : 'Option…'}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MatchTable({ question }) {
  const heads = question.matchColumnHeads || ['Column I', 'Column II']
  const pairs = question.matchPairs || []
  return (
    <table className="mt-1.5 w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="border border-ink-300 bg-ink-50 px-2 py-1 text-left font-semibold dark:border-ink-700 dark:bg-ink-800">{heads[0]}</th>
          <th className="border border-ink-300 bg-ink-50 px-2 py-1 text-left font-semibold dark:border-ink-700 dark:bg-ink-800">{heads[1]}</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((p) => (
          <tr key={p.id}>
            <td className="border border-ink-200 px-2 py-1 dark:border-ink-700">{p.left || '—'}</td>
            <td className="border border-ink-200 px-2 py-1 dark:border-ink-700">{p.right || '—'}</td>
          </tr>
        ))}
        {pairs.length === 0 && (
          <tr><td colSpan={2} className="border border-ink-200 px-2 py-1 text-center italic text-ink-300 dark:border-ink-700">No rows added yet.</td></tr>
        )}
      </tbody>
    </table>
  )
}

function TableGridBlock({ tableGrid }) {
  if (!tableGrid) return null
  return (
    <table className="mt-1.5 border-collapse text-[13px]">
      <tbody>
        {tableGrid.cells.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c} className="border border-ink-300 px-2.5 py-1 dark:border-ink-700">{cell || '\u00A0'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SubQuestionsBlock({ subQuestions, marksPosition }) {
  if (!subQuestions || subQuestions.length === 0) return null
  return (
    <div className="mt-1.5 space-y-1.5 pl-1">
      {subQuestions.map((sq) => (
        <div key={sq.id}>
          {sq.orWith && <p className="mb-1 text-[11px] font-semibold italic text-gold-600">— OR —</p>}
          <div className="flex gap-1.5 text-[13px] text-ink-800">
            <span className="font-semibold shrink-0">({sq.label})</span>
            <span className={`flex-1 ${sq.text ? '' : 'italic text-ink-300'}`}>{sq.text ? <RichText text={sq.text} /> : 'Sub-part…'}</span>
            <span className="shrink-0 font-mono text-xs text-ink-400">{formatMarks(marksPosition, sq.marks)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuestionBody({ question, group, marksPosition, showAnswerKey, onTextChange, onAlignChange }) {
  const type = group.questionType
  if (type === 'Assertion-Reason') {
    return (
      <div className="flex-1 space-y-1">
        <p className="text-[13.5px] text-ink-800">{question.assertion ? <RichText text={question.assertion} /> : <span className="italic text-ink-300">Assertion (A): …</span>}</p>
        <p className="text-[13.5px] text-ink-800">{question.reason ? <RichText text={question.reason} /> : <span className="italic text-ink-300">Reason (R): …</span>}</p>
        <QuestionImage image={question.image} />
        <OptionsBlock options={question.options} layout={group.optionsLayout} correctOptionId={question.correctOptionId} showAnswerKey={showAnswerKey} />
      </div>
    )
  }
  if (type === 'Match the Following') {
    return (
      <div className="flex-1">
        <MatchTable question={question} />
      </div>
    )
  }
  if (type === 'Table/Grid') {
    return (
      <div className="flex-1">
        <p className={`text-[13.5px] leading-relaxed text-ink-800 ${question.text ? '' : 'italic text-ink-300'}`}>{question.text ? <RichText text={question.text} /> : 'Untitled question…'}</p>
        <TableGridBlock tableGrid={question.tableGrid} />
      </div>
    )
  }
  return (
    <div className="flex-1" dir={question.dir === 'rtl' ? 'rtl' : 'ltr'}>
      <EditableLine
        as="p"
        text={question.text}
        align={question.dir === 'rtl' ? (question.align === 'left' ? 'right' : question.align) : (question.align || 'left')}
        onAlign={onAlignChange}
        onText={onTextChange}
        className="text-[13.5px] leading-relaxed text-ink-800"
        placeholder="Untitled question…"
        dir={question.dir === 'rtl' ? 'rtl' : 'ltr'}
      />
      <QuestionImage image={question.image} />
      <OptionsBlock options={question.options} layout={group.optionsLayout} correctOptionId={question.correctOptionId} showAnswerKey={showAnswerKey} />
      <SubQuestionsBlock subQuestions={question.subQuestions} marksPosition={marksPosition} />
      <AnswerSpaceBlock space={question.answerSpace} />
    </div>
  )
}

export function A4Preview({ paper, pageRef, activeSet = '', showAnswerKey = false }) {
  const t = useTranslate()
  const updateSection = useAppStore((s) => s.updateSection)
  const updateQuestion = useAppStore((s) => s.updateQuestion)
  const numbering = useMemo(() => buildNumbering(paper, activeSet), [paper, activeSet])
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType
  const settings = paper.settings || {}
  const marksPosition = settings.marksPosition || 'bracket'
  const fontClass = FONT_CLASS[settings.fontFamily] || ''
  const tpl = TEMPLATE_CLASS[settings.template] || TEMPLATE_CLASS.classic
  const sizeInfo = PAPER_SIZES.find((p) => p.value === settings.paperSize) || PAPER_SIZES[0]
  const seed = seedForSet(activeSet || 'A')
  const border = settings.border || 'none'
  const instructions = (settings.instructions || []).filter((x) => x && x.trim())

  // Feature 9 — border can wrap the whole paper, just the header, both, or nothing.
  const paperBorderClass = border === 'paper' || border === 'both' ? 'border-2 border-ink-800 dark:border-ink-200' : 'border border-ink-200/70 dark:border-ink-800'
  const headerBorderClass = border === 'header' || border === 'both' ? 'border-2 border-ink-800 p-3 dark:border-ink-200' : ''

  // SRS 48/49 — deterministic per-set reorder, preview-only (does not mutate the paper).
  // Only shuffles when a Set has actually been picked; numbering (above) uses
  // the exact same order so the printed numbers always match what's shown.
  const orderedQuestions = (group) => orderedQuestionsForSet(group, activeSet, seed)

  return (
    <div
      ref={pageRef}
      id="print-root"
      className={`a4-page relative mx-auto w-full rounded-sm bg-paper-50 px-8 py-9 shadow-page sm:px-12 sm:py-12 ${fontClass} ${paperBorderClass}`}
      style={{ maxWidth: `${sizeInfo.widthPx}px`, aspectRatio: `${sizeInfo.aspect}` }}
    >
      {settings.watermarkText && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="rotate-[-30deg] select-none whitespace-nowrap text-6xl font-bold text-ink-900/5 dark:text-white/5">
            {settings.watermarkText}
          </span>
        </div>
      )}

      {showAnswerKey && (
        <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {t('preview_answerKeyBanner')}
        </div>
      )}

      {/* Header */}
      <div className={`pb-4 font-display ${tpl.headerRule} ${headerBorderClass}`}>
        {settings.headerLayout === 'split' || settings.headerLayout === 'split-both' ? (
          <div className="flex items-center gap-3">
            {settings.headerLogoUrl && <img src={settings.headerLogoUrl} alt="School logo" className="h-12 w-12 shrink-0 rounded-full object-contain" />}
            <div className="flex-1 text-center">
              <p className="text-lg font-bold uppercase tracking-wide text-ink-900">
                {paper.schoolName || t('a4_schoolPlaceholder')}
                {settings.showAddress && settings.address && (
                  <span className="block text-xs font-normal normal-case tracking-normal text-ink-500">({settings.address})</span>
                )}
              </p>
              <p className="mt-1 text-base font-semibold uppercase text-ink-700">{examTitle || t('a4_examPlaceholder')}</p>
            </div>
            {settings.headerLayout === 'split-both' && settings.headerLogoUrl && (
              <img src={settings.headerLogoUrl} alt="School logo" className="h-12 w-12 shrink-0 rounded-full object-contain" />
            )}
          </div>
        ) : (
          <div className="text-center">
            {settings.headerLogoUrl && <img src={settings.headerLogoUrl} alt="School logo" className="mx-auto mb-1.5 h-12 w-12 rounded-full object-contain" />}
            <p className="text-lg font-bold uppercase tracking-wide text-ink-900">
              {paper.schoolName || t('a4_schoolPlaceholder')}
              {settings.showAddress && settings.address && (
                <span className="block text-xs font-normal normal-case tracking-normal text-ink-500">({settings.address})</span>
              )}
            </p>
            <p className="mt-1 text-base font-semibold uppercase text-ink-700">{examTitle || t('a4_examPlaceholder')}</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap justify-between gap-y-1 text-left text-[13px] font-sans text-ink-700">
          {classSectionLabel(paper) && <span>{t('a4_class')}: <strong>{classSectionLabel(paper)}</strong></span>}
          {resolveSubject(paper) && <span>{t('a4_subject')}: <strong>{resolveSubject(paper)}</strong></span>}
          <span>{t('a4_date')}: <strong>{formatDate(paper.examDate) || '—'}</strong></span>
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-y-1 text-left text-[13px] font-sans text-ink-700">
          <span>{t('a4_timeAllowed')}: <strong>{formatDuration(paper.duration) || '—'}</strong></span>
          <span>{t('a4_maxMarks')}: <strong>{paper.totalMarks || '—'}</strong></span>
          {/* Feature 8 — nothing is printed here unless a Set was actually picked. */}
          {activeSet && <span>{t('a4_set')}: <strong>{activeSet}</strong></span>}
        </div>

        {/* Feature 1 — optional header instructions list; fully absent when empty. */}
        {instructions.length > 0 && (
          <div className="mt-3 text-left text-[12.5px] text-ink-700">
            <p className="font-bold">{t('headerInstructions_title')}:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {instructions.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="mt-6 space-y-7">
        {paper.sections.length === 0 && (
          <p className="text-center text-sm italic text-ink-400">{t('preview_noSections')}</p>
        )}
        {paper.sections.map((section, sIdx) => {
          const { obtainableMarks } = computeSectionMarks(section)
          const noticeBox = section.noticeBox
          return (
            <div key={section.id}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${tpl.accent}`}>
                  {sectionLetter(sIdx)}
                </span>
                {section.showTitle === true && (
                  <div className="flex-1">
                    <EditableLine
                      as="h3"
                      text={section.title}
                      align={section.align || 'left'}
                      onAlign={(align) => updateSection(paper.id, section.id, { align })}
                      onText={(title) => updateSection(paper.id, section.id, { title })}
                      className="font-display text-[15px] font-semibold uppercase tracking-wide text-ink-900"
                      placeholder={`Section ${sectionLetter(sIdx)}`}
                    />
                  </div>
                )}
                {section.showMarks !== false && (
                  <span className="ml-auto shrink-0 text-xs font-mono text-ink-400">{formatMarks(marksPosition, obtainableMarks)}</span>
                )}
              </div>
              {section.instruction && (
                <p className="mb-3 text-[12.5px] italic text-ink-500">{section.instruction}</p>
              )}
              {noticeBox?.enabled && noticeBox.text && (
                <div className="mb-3 rounded border border-ink-300 bg-ink-50/70 px-3 py-2 text-[12px] font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-800/50 dark:text-ink-200">
                  {noticeBox.text}
                </div>
              )}

              <div className="space-y-4">
                {section.questionGroups.map((group) => (
                  <div key={group.id}>
                    {group.pageBreakBefore && (
                      <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wide text-ink-300" style={{ breakBefore: 'page' }}>
                        <span className="h-px flex-1 border-t border-dashed border-ink-300" />
                        Page Break
                        <span className="h-px flex-1 border-t border-dashed border-ink-300" />
                      </div>
                    )}
                    {/* Feature 10 — custom type label shown instead of the picked type, when set.
                        Feature 8 — question-type total marks, same hide/show toggle as a Section's total. */}
                    {(group.customTypeName || group.showMarks !== false) && (
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold italic text-ink-400">{group.customTypeName}</p>
                        {group.showMarks !== false && (
                          <span className="shrink-0 text-xs font-mono text-ink-400">{formatMarks(marksPosition, computeGroupMarks(group).obtainableMarks)}</span>
                        )}
                      </div>
                    )}
                    {(group.instruction || group.mode !== 'normal' || group.negativeMarks) && (
                      <p className="mb-1.5 text-[12px] italic text-ink-500">{modeInstruction(group)}</p>
                    )}
                    {group.questionType === 'Case Study' && group.passage && (
                      <div className="mb-2 rounded border border-ink-200 bg-ink-50/60 p-2.5 dark:border-ink-700 dark:bg-ink-800/40">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gold-600">Case Study</p>
                        <p className="text-[12.5px] italic text-ink-600 dark:text-ink-300">{group.passage}</p>
                      </div>
                    )}
                    {group.questionType !== 'Case Study' && (group.hasPassage || group.passage) && group.passage && (
                      <div className="mb-2 rounded border border-ink-200 bg-ink-50/60 p-2.5 dark:border-ink-700 dark:bg-ink-800/40">
                        <p className="text-[12.5px] italic text-ink-600 dark:text-ink-300">{group.passage}</p>
                      </div>
                    )}
                    <ol className="space-y-2">
                      {group.mode === 'or' ? (
                        <li className="flex gap-2 text-[13.5px] leading-relaxed text-ink-800">
                          <span className="font-semibold shrink-0">{numbering.get(group.questions[0]?.id)?.display}</span>
                          <div className="flex-1 space-y-1.5">
                            {group.questions.map((question, i) => (
                              <div key={question.id} className="flex gap-1.5" style={question.keepTogether ? { breakInside: 'avoid' } : undefined}>
                                <span className="font-semibold shrink-0">({String.fromCharCode(65 + i)})</span>
                                <QuestionBody
                                  question={question} group={group} marksPosition={marksPosition} showAnswerKey={showAnswerKey}
                                  onTextChange={(text) => updateQuestion(paper.id, section.id, group.id, question.id, { text })}
                                  onAlignChange={(align) => updateQuestion(paper.id, section.id, group.id, question.id, { align })}
                                />
                                {i < group.questions.length - 1 && (
                                  <span className="ml-1 shrink-0 font-display italic text-gold-600">OR</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="shrink-0 font-mono text-xs text-ink-400">{formatMarks(marksPosition, group.marksPerQuestion)}</span>
                        </li>
                      ) : (
                        orderedQuestions(group).map((question) => (
                          <li
                            key={question.id}
                            className="flex gap-2 text-[13.5px] leading-relaxed text-ink-800"
                            style={question.keepTogether ? { breakInside: 'avoid' } : undefined}
                          >
                            <span className="font-semibold shrink-0">{numbering.get(question.id)?.display}</span>
                            <QuestionBody
                              question={question} group={group} marksPosition={marksPosition} showAnswerKey={showAnswerKey}
                              onTextChange={(text) => updateQuestion(paper.id, section.id, group.id, question.id, { text })}
                              onAlignChange={(align) => updateQuestion(paper.id, section.id, group.id, question.id, { align })}
                            />
                            <span className="shrink-0 font-mono text-xs text-ink-400">{formatMarks(marksPosition, questionEffectiveMarks(question))}</span>
                          </li>
                        ))
                      )}
                    </ol>
                  </div>
                ))}
                {section.questionGroups.length === 0 && (
                  <p className="text-xs italic text-ink-300">{t('preview_noQuestions')}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 border-t border-dashed border-ink-200 pt-2 text-center text-[10px] text-ink-300">
        {settings.footerText ? <p>{settings.footerText}</p> : null}
        <p>{t('a4_endOfPaper')}{settings.showPageNumber ? ` · ${t('a4_page')}` : ''}</p>
      </div>
    </div>
  )
}
