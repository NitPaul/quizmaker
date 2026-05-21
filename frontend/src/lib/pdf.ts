import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Attempt, Quiz } from '../api/quizzes'

const INDIGO: [number, number, number] = [79, 70, 229]
const EMERALD_BG: [number, number, number] = [209, 250, 229]
const EMERALD_TXT: [number, number, number] = [6, 95, 70]
const ROSE_BG: [number, number, number] = [254, 226, 226]
const ROSE_TXT: [number, number, number] = [153, 27, 27]
const GRAY_BG: [number, number, number] = [243, 244, 246]
const GRAY_TXT: [number, number, number] = [75, 85, 99]

export function downloadResultsPdf(quiz: Quiz, attempt: Attempt) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  doc.setFillColor(...INDIGO)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('QuizMaker', margin, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const date = new Date(attempt.finished_at).toLocaleString()
  doc.text(date, pageWidth - margin, 18, { align: 'right' })

  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(quiz.title, margin, 42)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Score: ${attempt.score} / ${attempt.total}  (${attempt.percentage}%)`,
    margin,
    52,
  )
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.text(
    `Mode: ${attempt.mode}   |   Duration: ${attempt.duration_seconds}s`,
    margin,
    59,
  )

  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Review', margin, 72)

  const questionById = new Map(quiz.questions.map((q) => [q.id, q]))
  const body = attempt.answers.map((a, i) => {
    const q = questionById.get(a.question)
    const status = !a.user_answer ? 'Skipped' : a.is_correct ? 'Correct' : 'Wrong'
    return [
      String(i + 1),
      q ? q.text : '(missing question)',
      a.user_answer || '(skipped)',
      q ? q.correct_answer : '',
      status,
    ]
  })

  autoTable(doc, {
    startY: 76,
    head: [['#', 'Question', 'Your answer', 'Correct answer', 'Result']],
    body,
    theme: 'grid',
    headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const answer = attempt.answers[data.row.index]
      if (!answer) return
      if (data.column.index !== 4) return
      if (!answer.user_answer) {
        data.cell.styles.fillColor = GRAY_BG
        data.cell.styles.textColor = GRAY_TXT
      } else if (answer.is_correct) {
        data.cell.styles.fillColor = EMERALD_BG
        data.cell.styles.textColor = EMERALD_TXT
      } else {
        data.cell.styles.fillColor = ROSE_BG
        data.cell.styles.textColor = ROSE_TXT
      }
    },
  })

  const safeTitle = quiz.title.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60) || 'quiz'
  doc.save(`${safeTitle}-results.pdf`)
}
