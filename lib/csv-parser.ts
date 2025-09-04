// Simple CSV parser utility
export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || ''
      })
      rows.push(row)
    }
  }

  return rows
}

const parseCSVLine = (line: string): string[] => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/"/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.replace(/"/g, ''))
  return result
}