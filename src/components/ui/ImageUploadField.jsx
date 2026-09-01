import React, { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Input, Label } from './Input'

/**
 * SRS 1 (question images), 27/28 (header logo) — a real client-side image
 * upload. No backend yet, so files are read as base64 data-URLs and kept in
 * the paper's JSON state; swapping in real object storage later only means
 * changing what `onChange` is given (a hosted URL instead of a data-URL).
 */
export function ImageUploadField({ label = 'Image', value, onChange, compact = false }) {
  const fileRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className={compact ? '' : 'flex-1 min-w-[10rem]'}>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="https://… or upload"
          value={value?.startsWith('data:') ? '(uploaded image)' : value || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={value?.startsWith('data:')}
          className="h-8 flex-1 text-xs"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <button
          type="button"
          title="Upload image from device"
          onClick={() => fileRef.current?.click()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-ink-200 text-ink-400 hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-700"
        ><Upload className="h-3.5 w-3.5" /></button>
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
