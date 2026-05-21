import { describe, expect, it } from 'vitest'
import { parseFile } from './csv'

function makeFile(content: string, name = 'test.csv'): File {
  return new File([content], name, { type: 'text/csv' })
}

describe('parseFile (CSV)', () => {
  it('parses a well-formed CSV', async () => {
    const csv = [
      'Question,CorrectAnswer,Option2,Option3,Option4',
      'Capital of France?,Paris,London,Madrid,Berlin',
      'Largest ocean?,Pacific,Atlantic,Indian,Arctic',
    ].join('\n')
    const result = await parseFile(makeFile(csv))
    expect(result.length).toBe(2)
    expect(result[0].question).toBe('Capital of France?')
    expect(result[0].correctAnswer).toBe('Paris')
    expect(result[0].options).toEqual(['Paris', 'London', 'Madrid', 'Berlin'])
  })

  it('strips wrapping double quotes from cells', async () => {
    const csv = [
      'Question,CorrectAnswer,Option2,Option3,Option4',
      '"What?","Answer","B","C","D"',
    ].join('\n')
    const result = await parseFile(makeFile(csv))
    expect(result[0].question).toBe('What?')
    expect(result[0].correctAnswer).toBe('Answer')
  })

  it('skips blank lines', async () => {
    const csv = [
      'Question,CorrectAnswer,Option2,Option3,Option4',
      '',
      'Q1?,A,B,C,D',
      '',
      'Q2?,A,B,C,D',
    ].join('\n')
    const result = await parseFile(makeFile(csv))
    expect(result.length).toBe(2)
  })

  it('throws when too few columns', async () => {
    const csv = ['Question,CorrectAnswer,Option2,Option3,Option4', 'too,few,cols'].join('\n')
    await expect(parseFile(makeFile(csv))).rejects.toThrow(/at least 5 columns/i)
  })

  it('throws when header-only', async () => {
    const csv = 'Question,CorrectAnswer,Option2,Option3,Option4'
    await expect(parseFile(makeFile(csv))).rejects.toThrow(/empty|only a header/i)
  })

  it('throws on unsupported file extension', async () => {
    const file = new File(['hi'], 'foo.txt', { type: 'text/plain' })
    await expect(parseFile(file)).rejects.toThrow(/unsupported/i)
  })

  it('filters rows missing question or correct answer', async () => {
    const csv = [
      'Question,CorrectAnswer,Option2,Option3,Option4',
      'Real?,Yes,a,b,c',
      ',Missing,b,c,d',
      'No correct?,,a,b,c',
    ].join('\n')
    const result = await parseFile(makeFile(csv))
    expect(result.length).toBe(1)
    expect(result[0].question).toBe('Real?')
  })

  it('handles CRLF line endings', async () => {
    const csv = [
      'Question,CorrectAnswer,Option2,Option3,Option4',
      'Q?,A,B,C,D',
    ].join('\r\n')
    const result = await parseFile(makeFile(csv))
    expect(result.length).toBe(1)
  })
})
