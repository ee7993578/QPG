import React, { useState } from 'react'
import { KeyRound, Shuffle, SlidersHorizontal, Settings2 } from 'lucide-react'
import { A4Preview } from './A4Preview'
import { Select } from '../ui/Select'
import { Input, Label } from '../ui/Input'
import {
  PAPER_SETS, BORDER_OPTIONS, PAPER_SIZES, PAGE_ORIENTATIONS, COLUMN_LAYOUTS, MARGIN_PRESETS,
  FONT_SIZE_PRESETS, LINE_HEIGHT_PRESETS, SPACING_PRESETS,
  BORDER_STYLE_OPTIONS, BORDER_WIDTH_OPTIONS, CORNER_RADIUS_OPTIONS,
  PAGE_BG_OPTIONS, WATERMARK_OPACITY_OPTIONS, WATERMARK_ANGLE_OPTIONS,
  PAGE_NUMBER_FORMAT_OPTIONS, PAGE_NUMBER_POSITION_OPTIONS, FOOTER_ALIGN_OPTIONS,
} from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import { useTranslate } from '../../i18n'

// Small field wrapper so every Page Settings control lines up the same way.
function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

const PAGE_SETTINGS_TABS = [
  { key: 'page', titleKey: 'pageSettings_pagePaper' },
  { key: 'typography', titleKey: 'pageSettings_typography' },
  { key: 'spacing', titleKey: 'pageSettings_spacing' },
  { key: 'border', titleKey: 'pageSettings_borderFrame' },
  { key: 'background', titleKey: 'pageSettings_background' },
  { key: 'numbering', titleKey: 'pageSettings_numbering' },
]

/** SRS 48/49 (multiple paper sets, preview-only reorder), 50 (answer key toggle), and Feature 9 (border).
 *  Page Settings (gear icon) — every field below defaults to the paper's
 *  original look. A paper nobody has opened this panel for renders exactly
 *  as it always has; nothing here changes anything until picked. */
export function PreviewPanel({ paper }) {
  const t = useTranslate()
  const updatePaperSettings = useAppStore((s) => s.updatePaperSettings)
  // Feature 8 — no Set is chosen by default, so nothing prints on the paper
  // until the teacher deliberately picks one.
  const [activeSet, setActiveSet] = useState('')
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  // Preview options stay tucked away by default — one click reveals them.
  const [showOptions, setShowOptions] = useState(false)
  // Page Settings panel (gear icon) — also tucked away by default.
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [pageSettingsTab, setPageSettingsTab] = useState('page')

  const settings = paper.settings || {}
  const update = (patch) => updatePaperSettings(paper.id, patch)

  const border = settings.border || 'none'
  const marginPreset = settings.marginPreset || 'normal'
  const marginCustom = settings.marginCustom || { top: 32, right: 32, bottom: 32, left: 32 }
  const updateMarginCustom = (key, value) => {
    const n = value === '' ? 0 : Number(value)
    update({ marginCustom: { ...marginCustom, [key]: n } })
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-ink-100/60 p-4 dark:bg-ink-950 sm:p-8">
      <div className="mx-auto mb-4 w-full max-w-[720px]">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-500 shadow-sm hover:text-ink-800 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> {showOptions ? t('common_lessOptions') : t('common_moreOptions')}
        </button>

        {showOptions && (
          <div className="mt-2 flex w-full flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs dark:border-ink-800 dark:bg-ink-900">
            <span className="flex items-center gap-1.5 font-medium text-ink-600 dark:text-ink-300">
              <Shuffle className="h-3.5 w-3.5" /> {t('preview_set')}
            </span>
            <Select value={activeSet} onChange={(e) => setActiveSet(e.target.value)} className="h-7 w-24 text-xs">
              <option value="">{t('preview_setNone')}</option>
              {PAPER_SETS.map((s) => <option key={s} value={s}>Set {s}</option>)}
            </Select>

            <span className="mx-1 hidden h-5 w-px bg-ink-200 dark:bg-ink-700 sm:block" />

            <label className="flex shrink-0 items-center gap-1.5 font-medium text-ink-600 dark:text-ink-300">
              <input type="checkbox" checked={showAnswerKey} onChange={(e) => setShowAnswerKey(e.target.checked)} />
              <KeyRound className="h-3.5 w-3.5" /> {t('preview_answerKey')}
            </label>

            <span className="hidden text-ink-400 md:inline">{t('preview_setHint')}</span>

            <button
              type="button"
              onClick={() => setShowPageSettings((v) => !v)}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1 font-medium text-ink-600 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <Settings2 className="h-3.5 w-3.5" /> {t('pageSettings_title')}
            </button>
          </div>
        )}

        {showOptions && showPageSettings && (
          <div className="mt-2 w-full rounded-lg border border-ink-200 bg-white text-xs dark:border-ink-800 dark:bg-ink-900">
            {/* Tabs */}
            <div className="scroll-thin flex overflow-x-auto border-b border-ink-100 px-2 dark:border-ink-800">
              {PAGE_SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPageSettingsTab(tab.key)}
                  className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 font-medium transition-colors ${
                    pageSettingsTab === tab.key
                      ? 'border-gold-500 text-ink-900 dark:text-ink-50'
                      : 'border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
                  }`}
                >
                  {t(tab.titleKey)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3 p-3">
              {/* Page / Paper */}
              {pageSettingsTab === 'page' && (
                <>
                  <Field label={t('paperSettings_paperSize')}>
                    <Select value={settings.paperSize || 'A4'} onChange={(e) => update({ paperSize: e.target.value })} className="h-8 w-40 text-xs">
                      {PAPER_SIZES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_orientation')}>
                    <Select value={settings.orientation || 'portrait'} onChange={(e) => update({ orientation: e.target.value })} className="h-8 w-32 text-xs">
                      {PAGE_ORIENTATIONS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_columns')}>
                    <Select value={settings.columns === 2 ? 2 : 1} onChange={(e) => update({ columns: Number(e.target.value) })} className="h-8 w-32 text-xs">
                      {COLUMN_LAYOUTS.map((c) => <option key={c.value} value={c.value}>{t(c.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_margins')}>
                    <Select value={marginPreset} onChange={(e) => update({ marginPreset: e.target.value })} className="h-8 w-32 text-xs">
                      {MARGIN_PRESETS.map((m) => <option key={m.value} value={m.value}>{t(m.labelKey)}</option>)}
                    </Select>
                  </Field>
                  {marginPreset === 'custom' && (
                    <div className="flex w-full flex-wrap items-end gap-2 border-t border-dashed border-ink-100 pt-2 dark:border-ink-800">
                      <Field label={t('pageSettings_marginTop')}>
                        <Input type="number" min="0" value={marginCustom.top} onChange={(e) => updateMarginCustom('top', e.target.value)} className="h-8 w-16 text-xs" />
                      </Field>
                      <Field label={t('pageSettings_marginRight')}>
                        <Input type="number" min="0" value={marginCustom.right} onChange={(e) => updateMarginCustom('right', e.target.value)} className="h-8 w-16 text-xs" />
                      </Field>
                      <Field label={t('pageSettings_marginBottom')}>
                        <Input type="number" min="0" value={marginCustom.bottom} onChange={(e) => updateMarginCustom('bottom', e.target.value)} className="h-8 w-16 text-xs" />
                      </Field>
                      <Field label={t('pageSettings_marginLeft')}>
                        <Input type="number" min="0" value={marginCustom.left} onChange={(e) => updateMarginCustom('left', e.target.value)} className="h-8 w-16 text-xs" />
                      </Field>
                    </div>
                  )}
                </>
              )}

              {/* Typography */}
              {pageSettingsTab === 'typography' && (
                <>
                  <Field label={t('pageSettings_fontSize')}>
                    <Select value={settings.fontSizePreset || 'normal'} onChange={(e) => update({ fontSizePreset: e.target.value })} className="h-8 w-32 text-xs">
                      {FONT_SIZE_PRESETS.map((f) => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_lineHeight')}>
                    <Select value={settings.lineHeightPreset || 'normal'} onChange={(e) => update({ lineHeightPreset: e.target.value })} className="h-8 w-32 text-xs">
                      {LINE_HEIGHT_PRESETS.map((l) => <option key={l.value} value={l.value}>{t(l.labelKey)}</option>)}
                    </Select>
                  </Field>
                </>
              )}

              {/* Spacing */}
              {pageSettingsTab === 'spacing' && (
                <Field label={t('pageSettings_spacingPreset')}>
                  <Select value={settings.spacingPreset || 'normal'} onChange={(e) => update({ spacingPreset: e.target.value })} className="h-8 w-40 text-xs">
                    {SPACING_PRESETS.map((s) => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
                  </Select>
                </Field>
              )}

              {/* Border & Frame */}
              {pageSettingsTab === 'border' && (
                <>
                  <Field label={t('border_label')}>
                    <Select value={border} onChange={(e) => update({ border: e.target.value })} className="h-8 w-40 text-xs">
                      {BORDER_OPTIONS.map((b) => <option key={b.value} value={b.value}>{t(b.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_borderStyle')}>
                    <Select value={settings.borderStyle || 'solid'} onChange={(e) => update({ borderStyle: e.target.value })} disabled={border === 'none'} className="h-8 w-32 text-xs disabled:opacity-50">
                      {BORDER_STYLE_OPTIONS.map((b) => <option key={b.value} value={b.value}>{t(b.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_borderWidth')}>
                    <Select value={settings.borderWidth || 'medium'} onChange={(e) => update({ borderWidth: e.target.value })} disabled={border === 'none'} className="h-8 w-32 text-xs disabled:opacity-50">
                      {BORDER_WIDTH_OPTIONS.map((b) => <option key={b.value} value={b.value}>{t(b.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_cornerRadius')}>
                    <Select value={settings.cornerRadius || 'sharp'} onChange={(e) => update({ cornerRadius: e.target.value })} className="h-8 w-32 text-xs">
                      {CORNER_RADIUS_OPTIONS.map((c) => <option key={c.value} value={c.value}>{t(c.labelKey)}</option>)}
                    </Select>
                  </Field>
                </>
              )}

              {/* Background & Watermark */}
              {pageSettingsTab === 'background' && (
                <>
                  <Field label={t('pageSettings_pageBg')}>
                    <Select value={settings.pageBg || 'default'} onChange={(e) => update({ pageBg: e.target.value })} className="h-8 w-32 text-xs">
                      {PAGE_BG_OPTIONS.map((p) => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_watermarkOpacity')}>
                    <Select
                      value={settings.watermarkOpacity || 'light'}
                      onChange={(e) => update({ watermarkOpacity: e.target.value })}
                      disabled={!settings.watermarkText}
                      className="h-8 w-32 text-xs disabled:opacity-50"
                    >
                      {WATERMARK_OPACITY_OPTIONS.map((w) => <option key={w.value} value={w.value}>{t(w.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_watermarkAngle')}>
                    <Select
                      value={settings.watermarkAngle ?? -30}
                      onChange={(e) => update({ watermarkAngle: Number(e.target.value) })}
                      disabled={!settings.watermarkText}
                      className="h-8 w-36 text-xs disabled:opacity-50"
                    >
                      {WATERMARK_ANGLE_OPTIONS.map((w) => <option key={w.value} value={w.value}>{t(w.labelKey)}</option>)}
                    </Select>
                  </Field>
                  {!settings.watermarkText && (
                    <span className="basis-full text-[11px] text-ink-400">{t('paperSettings_watermark')}: —</span>
                  )}
                </>
              )}

              {/* Numbering & Footer */}
              {pageSettingsTab === 'numbering' && (
                <>
                  <Field label={t('pageSettings_pageNumberFormat')}>
                    <Select
                      value={settings.pageNumberFormat || 'default'}
                      onChange={(e) => update({ pageNumberFormat: e.target.value })}
                      disabled={settings.showPageNumber === false}
                      className="h-8 w-36 text-xs disabled:opacity-50"
                    >
                      {PAGE_NUMBER_FORMAT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_pageNumberPosition')}>
                    <Select
                      value={settings.pageNumberPosition || 'inline'}
                      onChange={(e) => update({ pageNumberPosition: e.target.value })}
                      disabled={settings.showPageNumber === false}
                      className="h-8 w-40 text-xs disabled:opacity-50"
                    >
                      {PAGE_NUMBER_POSITION_OPTIONS.map((p) => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('pageSettings_footerAlign')}>
                    <Select value={settings.footerAlign || 'center'} onChange={(e) => update({ footerAlign: e.target.value })} className="h-8 w-28 text-xs">
                      {FOOTER_ALIGN_OPTIONS.map((f) => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
                    </Select>
                  </Field>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="mx-auto mb-3 w-full max-w-[720px] text-center text-[11px] text-ink-400">{t('preview_tapToFormat')}</p>
      <A4Preview paper={paper} activeSet={activeSet} showAnswerKey={showAnswerKey} />
    </div>
  )
}
