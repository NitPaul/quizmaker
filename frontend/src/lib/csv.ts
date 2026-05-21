import * as XLSX from 'xlsx'

export interface ParsedQuestion {
  question: string
  correctAnswer: string
  options: string[]
}

export async function parseFile(file: File): Promise<ParsedQuestion[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) {
    return parseCsv(await file.text())
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXlsx(await file.arrayBuffer())
  }
  throw new Error('Unsupported file type. Please upload a CSV or XLSX file.')
}

function parseCsv(text: string): ParsedQuestion[] {
  const rows = text.split(/\r?\n/).filter((row) => row.trim() !== '')
  if (rows.length < 2) throw new Error('File is empty or has only a header.')
  return rows
    .slice(1)
    .map((row, i) => {
      const columns = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      if (columns.length < 5) {
        throw new Error(
          `Row ${i + 2} is malformed. Expected at least 5 columns: Question, CorrectAnswer, Option2, Option3, Option4.`,
        )
      }
      return {
        question: columns[0],
        correctAnswer: columns[1],
        options: columns.slice(1, 5),
      }
    })
    .filter((q) => q.question && q.correctAnswer)
}

function parseXlsx(buffer: ArrayBuffer): ParsedQuestion[] {
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })
  if (rows.length < 2) throw new Error('Sheet is empty or has only a header.')
  return rows
    .slice(1)
    .map((row, i) => {
      if (!Array.isArray(row) || row.length < 5) {
        throw new Error(`Row ${i + 2} is malformed. Expected at least 5 columns.`)
      }
      return {
        question: String(row[0] ?? ''),
        correctAnswer: String(row[1] ?? ''),
        options: row.slice(1, 5).map((v) => String(v ?? '')),
      }
    })
    .filter((q) => q.question && q.correctAnswer)
}
