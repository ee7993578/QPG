globalThis.window = globalThis
globalThis.window.atob = (s) => Buffer.from(s, 'base64').toString('binary')
globalThis.window.Image = class {
  set src(v) { setTimeout(() => this.onload && this.onload(), 0) }
  get naturalWidth() { return 300 }
  get naturalHeight() { return 200 }
}
let savedBlob = null
globalThis.document = {
  createElement: () => ({ click() {}, style: {} }),
  body: { appendChild() {}, removeChild() {} },
}
globalThis.URL.createObjectURL = (b) => { savedBlob = b; return 'blob:mock' }

const { downloadPaperAsDocx } = await import('./exportDocx-bundled.mjs')
