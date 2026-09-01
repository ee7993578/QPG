import React, { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'

// Corner + side handles, same interaction pattern as the image resize
// handles in A4Preview — drag a handle to resize the crop box, drag inside
// the box to move it.
const CROP_HANDLES = [
  { key: 'nw', cls: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
  { key: 'ne', cls: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
  { key: 'se', cls: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
  { key: 'sw', cls: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
]

const DEFAULT_BOX = { x: 10, y: 10, w: 80, h: 80 } // percent of displayed image

/**
 * Feature — crop tool that sits alongside the existing drag-to-resize image
 * handles in A4Preview. The user drags a box over the image (in an
 * on-screen preview, all in percent so it's resolution independent), and
 * "Apply crop" draws just that region onto a canvas at the image's real
 * pixel resolution and hands back a new data-URL.
 */
export function ImageCropDialog({ open, onClose, imageUrl, onApply }) {
  const imgRef = useRef(null)
  const stageRef = useRef(null)
  const [box, setBox] = useState(DEFAULT_BOX)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })

  // Reset the crop box every time a fresh image is opened for cropping.
  useEffect(() => {
    if (open) setBox(DEFAULT_BOX)
  }, [open, imageUrl])

  const clampBox = (b) => {
    let { x, y, w, h } = b
    w = Math.max(8, Math.min(100, w))
    h = Math.max(8, Math.min(100, h))
    x = Math.max(0, Math.min(100 - w, x))
    y = Math.max(0, Math.min(100 - h, y))
    return { x, y, w, h }
  }

  const startMove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const stage = stageRef.current
    if (!stage) return
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* unsupported */ }
    const rect = stage.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startBox = box
    const onMove = (ev) => {
      ev.preventDefault()
      const dxPct = ((ev.clientX - startX) / rect.width) * 100
      const dyPct = ((ev.clientY - startY) / rect.height) * 100
      setBox(clampBox({ ...startBox, x: startBox.x + dxPct, y: startBox.y + dyPct }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (handle) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const stage = stageRef.current
    if (!stage) return
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* unsupported */ }
    const rect = stage.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startBox = box
    const onMove = (ev) => {
      ev.preventDefault()
      const dxPct = ((ev.clientX - startX) / rect.width) * 100
      const dyPct = ((ev.clientY - startY) / rect.height) * 100
      let { x, y, w, h } = startBox
      if (handle.includes('e')) w = startBox.w + dxPct
      if (handle.includes('s')) h = startBox.h + dyPct
      if (handle.includes('w')) { x = startBox.x + dxPct; w = startBox.w - dxPct }
      if (handle.includes('n')) { y = startBox.y + dyPct; h = startBox.h - dyPct }
      setBox(clampBox({ x, y, w, h }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleImgLoad = () => {
    const el = imgRef.current
    if (el) setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight })
  }

  const applyCrop = () => {
    if (!naturalSize.w || !naturalSize.h) return
    const sx = (box.x / 100) * naturalSize.w
    const sy = (box.y / 100) * naturalSize.h
    const sw = (box.w / 100) * naturalSize.w
    const sh = (box.h / 100) * naturalSize.h
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(sw))
    canvas.height = Math.max(1, Math.round(sh))
    const ctx = canvas.getContext('2d')
    const img = imgRef.current
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    const cropped = canvas.toDataURL('image/jpeg', 0.9)
    onApply(cropped)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Crop image" className="max-w-xl">
      <div
        ref={stageRef}
        className="relative mx-auto max-h-[55vh] w-full select-none overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800"
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Crop preview"
          onLoad={handleImgLoad}
          className="block max-h-[55vh] w-full object-contain"
          draggable={false}
        />
        {/* Darkened area outside the crop box */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.w}%`,
            height: `${box.h}%`,
          }}
        />
        <div
          onPointerDown={startMove}
          className="absolute cursor-move border-2 border-gold-500 touch-none"
          style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
        >
          {CROP_HANDLES.map(({ key, cls }) => (
            <span
              key={key}
              onPointerDown={startResize(key)}
              className={`pointer-events-auto touch-none absolute flex h-6 w-6 items-center justify-center select-none ${cls}`}
            >
              <span className="h-2.5 w-2.5 rounded-sm border border-white bg-gold-500 shadow" />
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-400">Drag the box to move it, drag a corner to resize, then apply.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setBox(DEFAULT_BOX)}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
        <Button type="button" onClick={applyCrop}><Check className="h-4 w-4" /> Apply crop</Button>
      </div>
    </Dialog>
  )
}
