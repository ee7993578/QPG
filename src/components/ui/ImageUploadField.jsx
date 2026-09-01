import React, { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Input, Label } from './Input'
import { compressImageFile } from '../../lib/utils'

/**
 * SRS 1 (question images), 27/28 (header logo) — a real client-side image
 * upload. No backend yet, so files are read as base64 data-URLs and kept in
 * the paper's JSON state; swapping in real object storage later only means
 * changing what `onChange` is given (a hosted URL instead of a data-URL).
 *
 * Every upload is compressed to ~200 KB before it's stored, regardless of
 * the original file size, so large phone-camera photos don't bloat the
 * paper's saved JSON or slow down autosave/export.
 */
export function ImageUploadField({ label = 'Image', value, onChange, compact = false }) {
  const fileRef = useRef(null)
  const [compressing, setCompressing] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    setCompressing(true)
    try {
      const compressed = await compressImageFile(file, 200)
      onChange(compressed)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className={compact ? '' : 'flex-1 min-w-[10rem]'}>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="https://… or upload"
          value={compressing ? 'Compressing…' : value?.startsWith('data:') ? '(uploaded image)' : value || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={compressing || value?.startsWith('data:')}
          className="h-8 flex-1 text-xs"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <button
          type="button"
          title="Upload image from device"
          disabled={compressing}
          onClick={() => fileRef.current?.click()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-ink-200 text-ink-400 hover:bg-ink-100 disabled:opacity-50 dark:border-ink-700 dark:hover:bg-ink-700"
        >{compressing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}</button>
        {value && (
          <button
            type="button"
            title="Remove image"
            onClick={() => onChange('')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-ink-200 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:border-ink-700"
          ><X className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div>
  )
}
