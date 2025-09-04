"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download, Database, FileText, Calendar, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function BackupExportPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState({
    categories: 0,
    questions: 0,
    activities: 0,
    admins: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchStats()
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

  const fetchStats = async () => {
    try {
      const [categories, questions, activities, admins] = await Promise.all([
        supabase.from("categories").select("id"),
        supabase.from("diamond_questions").select("id"),
        supabase.from("activity_logs").select("id"),
        supabase.from("admins").select("id")
      ])

      setStats({
        categories: categories.data?.length || 0,
        questions: questions.data?.length || 0,
        activities: activities.data?.length || 0,
        admins: admins.data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportCategories = async () => {
    setExporting(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const timestamp = new Date().toISOString().split('T')[0]
      downloadJSON(data, `categories-backup-${timestamp}.json`)
      downloadCSV(data || [], `categories-backup-${timestamp}.csv`)
      
      alert(`✅ Categories exported successfully!\n📁 ${data?.length || 0} categories downloaded`)
    } catch (error) {
      console.error('Export error:', error)
      alert('❌ Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportQuestions = async () => {
    setExporting(true)
    try {
      const { data, error } = await supabase
        .from("diamond_questions")
        .select(`
          *,
          categories (
            name_ar,
            name_en
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const timestamp = new Date().toISOString().split('T')[0]
      downloadJSON(data, `questions-backup-${timestamp}.json`)
      downloadCSV(data || [], `questions-backup-${timestamp}.csv`)
      
      alert(`✅ Questions exported successfully!\n📁 ${data?.length || 0} questions downloaded`)
    } catch (error) {
      console.error('Export error:', error)
      alert('❌ Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportComplete = async () => {
    setExporting(true)
    try {
      const [categories, questions, activities, admins] = await Promise.all([
        supabase.from("categories").select("*").order("created_at", { ascending: false }),
        supabase.from("diamond_questions").select("*, categories(name_ar, name_en)").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("admins").select("*").order("created_at", { ascending: false })
      ])

      const completeBackup = {
        backup_info: {
          created_at: new Date().toISOString(),
          created_by: user.email,
          version: "1.0"
        },
        categories: categories.data || [],
        questions: questions.data || [],
        activity_logs: activities.data || [],
        admins: admins.data || []
      }

      const timestamp = new Date().toISOString().split('T')[0]
      downloadJSON(completeBackup, `complete-backup-${timestamp}.json`)
      
      alert(`✅ Complete backup created successfully!\n📁 All data exported to JSON file`)
    } catch (error) {
      console.error('Complete backup error:', error)
      alert('❌ Backup failed. Please try again.')
    } finally {
      setExporting(false)
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Backup & Export</h1>
              <p className="text-gray-600">Download and backup all your quiz data</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
              <p className="text-sm text-gray-600">Categories</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.questions}</p>
              <p className="text-sm text-gray-600">Questions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.activities}</p>
              <p className="text-sm text-gray-600">Activities</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Export Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Download all categories with descriptions and images</p>
              <Badge variant="outline" className="text-blue-600 border-blue-300 mb-4">
                {stats.categories} items
              </Badge>
              <Button 
                onClick={exportCategories}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Categories'}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Export Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Download all questions with answers and media</p>
              <Badge variant="outline" className="text-green-600 border-green-300 mb-4">
                {stats.questions} items
              </Badge>
              <Button 
                onClick={exportQuestions}
                disabled={exporting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Questions'}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Complete Backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Download everything in one comprehensive backup file</p>
              <Badge variant="outline" className="text-purple-600 border-purple-300 mb-4">
                Full System
              </Badge>
              <Button 
                onClick={exportComplete}
                disabled={exporting}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Creating Backup...' : 'Complete Backup'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Backup Information:</strong> Files are downloaded in both JSON and CSV formats. 
            JSON files preserve all data structure, while CSV files are great for Excel. 
            Store backups safely - they contain all your quiz content!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}