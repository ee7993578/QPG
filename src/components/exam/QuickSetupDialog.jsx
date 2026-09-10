import React, { useMemo, useState } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input, Label } from '../ui/Input'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { QUESTION_TYPES } from '../../data/mockData'
import { useTranslate } from '../../i18n'

/**
 * Quick Setup — a completely optional accelerator offered from Step 3 of
 * CreateExam. A teacher who never opens this sees zero change to the
 * normal Step 1 → 2 → 3 → Builder flow.
 *
 * This does NOT create a paper or any questions itself — it only figures
 * out "one section per selected question type" the same shape
 * QUICK_START_TEMPLATES already uses (`{ questionGroups: [{ questionType,
 * mode, questionCount, marksPerQuestion }] }`), and hands that back via
 * onConfirm. CreateExam.jsx then creates the real paper and applies it
 * with the exact same `addSection` + `addQuestionGroup` calls a
 * quick-start template uses — so every question this produces is a
 * completely normal, fully editable question from the moment the builder
 * opens. No parallel question model, no fake content.
 */
export function QuickSetupDialog({ open, onClose, targetTotalMarks, onConfirm }) {
  const t = useTranslate()

  // { [questionType]: { marksPerQuestion, questionCount } } — only for
  // currently-checked types; unchecking a type drops its config.
  const [config, setConfig] = useState({})

  const toggleType = (type) => {
    setConfig((prev) => {
      const next = { ...prev }
      if (next[type]) {
        delete next[type]
      } else {
        next[type] = { marksPerQuestion: '1', questionCount: '5' }
      }
      return next
    })
  }

  const updateField = (type, field, value) => {
    setConfig((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }))
  }

  const selectedTypes = QUESTION_TYPES.filter((type) => config[type])

  const rows = useMemo(
    () =>
      selectedTypes.map((type) => {
        const marks = Number(config[type].marksPerQuestion) || 0
        const count = Number(config[type].questionCount) || 0
        return { type, marks, count, total: marks * count }
      }),
    [selectedTypes, config]
  )

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0)

  // Every field across every selected type must be a genuine positive
  // number before we let the teacher proceed — this is the only
  // validation Quick Setup needs, and it's checked live rather than only
  // on submit so the message never feels like a surprise.
  const hasInvalidValues = rows.some((r) => r.marks <= 0 || r.count <= 0)

  const hasTarget = Number.isFinite(targetTotalMarks) && targetTotalMarks > 0
  const marksMatch = hasTarget ? grandTotal === targetTotalMarks : null

  const canOpen = selectedTypes.length > 0 && !hasInvalidValues && (!hasTarget || marksMatch)
  // If marks don't match, still offer a lighter, explicit way through
  // rather than trapping the teacher — never silently proceed, but never
  // hard-block either.
  const canOpenAnyway = selectedTypes.length > 0 && !hasInvalidValues && hasTarget && !marksMatch

  const buildSections = () =>
    selectedTypes.map((type) => ({
      questionGroups: [
        {
          questionType: type,
          mode: 'normal',
          questionCount: Number(config[type].questionCount),
          marksPerQuestion: Number(config[type].marksPerQuestion),
        },
      ],
    }))

  const handleConfirm = () => {
    if (selectedTypes.length === 0 || hasInvalidValues) return
    onConfirm(buildSections())
  }

  const handleClose = () => {
    setConfig({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t('quickSetup_title')}
      className="max-h-[85vh] w-full max-w-2xl overflow-y-auto"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>{t('quickSetup_cancel')}</Button>
          {canOpen ? (
            <Button onClick={handleConfirm}>{t('quickSetup_openBuilder')}</Button>
          ) : canOpenAnyway ? (
            <Button variant="outline" onClick={handleConfirm}>{t('quickSetup_openAnyway')}</Button>
          ) : (
            <Button disabled>{t('quickSetup_openBuilder')}</Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
            {t('quickSetup_heading')}
          </p>
          <p className="mt-1 text-xs text-ink-400">{t('quickSetup_subheading')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {QUESTION_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-2.5 py-2 text-xs font-medium text-ink-600 hover:border-gold-400 dark:border-ink-700 dark:text-ink-300"
            >
              <input
                type="checkbox"
                checked={!!config[type]}
                onChange={() => toggleType(type)}
                className="h-3.5 w-3.5 shrink-0 rounded border-ink-300"
              />
              <span className="truncate">{type}</span>
            </label>
          ))}
        </div>

        {selectedTypes.length > 0 && (
          <div className="space-y-2.5 border-t border-ink-100 pt-3 dark:border-ink-800">
            {rows.map(({ type, total }) => (
              <div
                key={type}
                className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2 rounded-lg bg-ink-50 p-2.5 dark:bg-ink-950/40 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                <p className="col-span-4 -mb-1 truncate text-xs font-semibold text-ink-800 dark:text-ink-100 sm:col-span-1 sm:mb-0">
                  {type}
                </p>
                <div>
                  <Label className="text-[10px]">{t('quickSetup_marksPerQuestion')}</Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 text-xs"
                    value={config[type].marksPerQuestion}
                    onChange={(e) => updateField(type, 'marksPerQuestion', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[10px]">{t('quickSetup_numberOfQuestions')}</Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 text-xs"
                    value={config[type].questionCount}
                    onChange={(e) => updateField(type, 'questionCount', e.target.value)}
                  />
                </div>
                <div className="whitespace-nowrap pb-1.5 text-right text-xs font-semibold text-ink-500 dark:text-ink-400">
                  {t('quickSetup_typeTotal')}: {total}
                </div>
              </div>
            ))}

            {hasInvalidValues && (
              <p className="text-xs text-pen-red">{t('quickSetup_invalidValues')}</p>
            )}

            <div className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2 dark:border-ink-700">
              <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">{t('quickSetup_grandTotal')}</span>
              <span className="font-mono text-sm font-bold text-ink-900 dark:text-ink-50">{grandTotal}</span>
            </div>

            {!hasInvalidValues && hasTarget && (
              marksMatch ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {grandTotal} / {targetTotalMarks} Marks — {t('quickSetup_matchSuccess')}
                </p>
              ) : (
                <p className="flex items-start gap-1.5 text-xs font-medium text-gold-700 dark:text-gold-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
                  {t('quickSetup_mismatchWarning').replace('{total}', targetTotalMarks).replace('{current}', grandTotal)}
                </p>
              )
            )}
            {!hasInvalidValues && !hasTarget && (
              <p className="text-xs text-ink-400">{t('quickSetup_noTargetHint')}</p>
            )}
          </div>
        )}

        {selectedTypes.length === 0 && (
          <p className="text-xs text-ink-400">{t('quickSetup_noneSelected')}</p>
        )}
      </div>
    </Dialog>
  )
}
