/**
 * Manuscript Reader — File extraction utilities
 *
 * Reads plain text from `.txt`, `.docx`, and `.pdf` files. The DOCX and PDF
 * parsers are loaded via dynamic `import()` so users who paste plain text or
 * upload `.txt` never pay the bundle cost (~250KB mammoth, ~2MB pdfjs-dist).
 */

/** Hard cap on input size — roughly 300k Gemini tokens. */
export const MAX_INPUT_CHARS = 1_500_000

export class ManuscriptTooLargeError extends Error {
  readonly chars: number
  constructor(chars: number) {
    super(
      `Naskah terlalu panjang (~${Math.round(chars / 1000)}k karakter). ` +
        `Maksimum ${Math.round(MAX_INPUT_CHARS / 1000)}k. Pecah jadi beberapa file.`
    )
    this.name = 'ManuscriptTooLargeError'
    this.chars = chars
  }
}

export class UnsupportedFileTypeError extends Error {
  readonly fileName: string
  constructor(fileName: string) {
    super(`Format file tidak didukung: ${fileName}. Gunakan .txt, .docx, atau .pdf.`)
    this.name = 'UnsupportedFileTypeError'
    this.fileName = fileName
  }
}

function ensureWithinCap(text: string): string {
  if (text.length > MAX_INPUT_CHARS) {
    throw new ManuscriptTooLargeError(text.length)
  }
  return text
}

/** Read a `.txt` file (UTF-8 assumed). */
export function readPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(ensureWithinCap(String(reader.result ?? '')))
    reader.onerror = () => reject(reader.error || new Error('Gagal membaca file teks'))
    reader.readAsText(file, 'utf-8')
  })
}

/** Read a `.docx` file. Mammoth is loaded lazily. */
export async function readDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer })
  return ensureWithinCap(result.value || '')
}

/** Read a `.pdf` file. pdfjs-dist is loaded lazily. */
export async function readPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  // Dynamically import the legacy ESM build which works in browser bundlers.
  const pdfjs = (await import('pdfjs-dist')) as unknown as {
    GlobalWorkerOptions?: { workerSrc?: string }
    getDocument: (init: { data: ArrayBuffer }) => { promise: Promise<PdfDocLite> }
  }
  // pdfjs requires a worker. We use the bundled fake worker as a fallback so
  // callers don't have to host an external worker file.
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = (
      await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ).default
  }

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText)

    // Bail out early if we'd blow past the cap mid-extraction.
    if (pages.join('\n\n').length > MAX_INPUT_CHARS) {
      throw new ManuscriptTooLargeError(pages.join('\n\n').length)
    }
  }

  return ensureWithinCap(pages.join('\n\n'))
}

interface PdfDocLite {
  numPages: number
  getPage: (n: number) => Promise<{
    getTextContent: () => Promise<{ items: Array<{ str?: string }> }>
  }>
}

/** Dispatch on MIME type and file extension. */
export async function extractTextFromFile(file: File): Promise<string> {
  const lower = file.name.toLowerCase()
  if (file.type === 'text/plain' || lower.endsWith('.txt')) {
    return readPlainText(file)
  }
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return readDocx(file)
  }
  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
    return readPdf(file)
  }
  throw new UnsupportedFileTypeError(file.name)
}

/** Friendly accept attribute for `<input type="file">`. */
export const ACCEPTED_FILE_TYPES = '.txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
