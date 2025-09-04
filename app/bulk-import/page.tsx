"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, Download, FileText, CheckCircle, AlertCircle, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { parseCSV } from "@/lib/csv-parser"
import { logActivity } from "@/lib/activity-logger"

interface ImportRow {
  category_name: string
  question_ar: string
  question_en: string
  answer_ar: string
  answer_en: string
  diamonds: string
  row_number: number
  errors: string[]
  category_id?: string
}

export default function BulkImportPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportRow[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [validRows, setValidRows] = useState<ImportRow[]>([])
  const [invalidRows, setInvalidRows] = useState<ImportRow[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importComplete, setImportComplete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session?.user) {
        router.push("/login")
        return
      }

      if (session.user.email !== 'engradaka@gmail.com') {
        router.push("/dashboard")
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name_ar, name_en")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const downloadTemplate = () => {
    const template = `category_name,question_ar,question_en,answer_ar,answer_en,diamonds
Sports,ما هي رياضة كرة القدم؟,What is football?,رياضة جماعية,Team sport,25
Science,ما هو الماء؟,What is water?,H2O,H2O,50
History,متى تأسست المملكة؟,When was the kingdom founded?,1932,1932,75`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setImportComplete(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      const parsed = parseCSV(csvText)
      
      const processedData: ImportRow[] = parsed.map((row, index) => ({
        ...row,
        row_number: index + 2, // +2 because index starts at 0 and we skip header
        errors: []
      }))

      validateData(processedData)
    }
    reader.readAsText(uploadedFile)
  }

  const validateData = (data: ImportRow[]) => {
    const valid: ImportRow[] = []
    const invalid: ImportRow[] = []

    data.forEach(row => {
      const errors: string[] = []

      // Check required fields
      if (!row.category_name?.trim()) errors.push('Category name is required')
      if (!row.question_ar?.trim()) errors.push('Arabic question is required')
      if (!row.question_en?.trim()) errors.push('English question is required')
      if (!row.answer_ar?.trim()) errors.push('Arabic answer is required')
      if (!row.answer_en?.trim()) errors.push('English answer is required')
      if (!row.diamonds?.trim()) errors.push('Diamonds value is required')

      // Validate diamonds value
      const diamondsValue = parseInt(row.diamonds)
      if (![10, 25, 50, 75, 100].includes(diamondsValue)) {
        errors.push('Diamonds must be 10, 25, 50, 75, or 100')
      }

      // Find matching category
      const matchingCategory = categories.find(cat => 
        cat.name_ar === row.category_name?.trim() || 
        cat.name_en === row.category_name?.trim()
      )

      if (!matchingCategory) {
        errors.push(`Category "${row.category_name}" not found`)
      } else {
        row.category_id = matchingCategory.id
      }

      row.errors = errors

      if (errors.length === 0) {
        valid.push(row)
      } else {
        invalid.push(row)
      }
    })

    setValidRows(valid)
    setInvalidRows(invalid)
    setParsedData(data)
  }

  const handleImport = async () => {
    if (validRows.length === 0) return

    setImporting(true)
    setImportProgress(0)

    try {
      const batchSize = 10
      let imported = 0

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize)
        
        const questionsToInsert = batch.map(row => ({
          category_id: row.category_id,
          question_ar: row.question_ar.trim(),
          question_en: row.question_en.trim(),
          answer_ar: row.answer_ar.trim(),
          answer_en: row.answer_en.trim(),
          diamonds: parseInt(row.diamonds)
        }))

        const { error } = await supabase
          .from('diamond_questions')
          .insert(questionsToInsert)

        if (error) throw error

        imported += batch.length
        setImportProgress((imported / validRows.length) * 100)

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Log activity
      await logActivity(
        user?.email || '',
        'create',
        'question',
        'bulk-import',
        `Bulk imported ${imported} questions`,
        { 
          imported_count: imported,
          file_name: file?.name,
          categories_affected: [...new Set(validRows.map(r => r.category_name))]
        }
      )

      setImportComplete(true)
      alert(`✅ Successfully imported ${imported} questions!`)

    } catch (error) {
      console.error('Import error:', error)
      alert('❌ Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setFile(null)
    setParsedData([])
    setValidRows([])
    setInvalidRows([])
    setImportProgress(0)
    setImportComplete(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/master-dashboard')}
              variant="outline"
              className="px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Master Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulk Import</h1>
              <p className="text-gray-600">Upload multiple questions from CSV or Excel files</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use:</strong> Download the template, fill in your questions with categories, answers, and diamond values (10, 25, 50, 75, 100), then upload the file.
          </AlertDescription>
        </Alert>

        {/* Template Download */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Step 1: Download Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Download the CSV template with the correct format and example data.
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Step 2: Upload Your File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {file ? `Selected: ${file.name}` : 'Choose a CSV or Excel file to upload'}
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  {file ? 'Choose Different File' : 'Choose File'}
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Validation Results */}
        {parsedData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Valid Rows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Valid Questions ({validRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validRows.slice(0, 5).map((row, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded border">
                      <p className="text-sm font-medium">{row.question_en}</p>
                      <p className="text-xs text-gray-600">
                        {row.category_name} • 💎 {row.diamonds}
                      </p>
                    </div>
                  ))}
                  {validRows.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {validRows.length - 5} more valid questions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invalid Rows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Issues Found ({invalidRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {invalidRows.slice(0, 5).map((row, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded border">
                      <p className="text-sm font-medium">Row {row.row_number}</p>
                      <ul className="text-xs text-red-600">
                        {row.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {invalidRows.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {invalidRows.length - 5} more issues
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Progress */}
        {importing && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-lg font-medium mb-4">Importing Questions...</p>
                <Progress value={importProgress} className="mb-2" />
                <p className="text-sm text-gray-600">{Math.round(importProgress)}% complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Actions */}
        {validRows.length > 0 && !importComplete && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ready to Import</h3>
                  <p className="text-gray-600">
                    {validRows.length} valid questions will be imported
                    {invalidRows.length > 0 && ` (${invalidRows.length} rows will be skipped)`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={resetImport} variant="outline">
                    Reset
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={importing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importing ? 'Importing...' : `Import ${validRows.length} Questions`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Complete */}
        {importComplete && (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">Import Complete!</h3>
              <p className="text-gray-600 mb-4">
                Successfully imported {validRows.length} questions to your quiz database.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={resetImport} variant="outline">
                  Import More
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  View Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}