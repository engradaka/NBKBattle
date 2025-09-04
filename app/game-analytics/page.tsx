"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BarChart3, TrendingUp, Target, Award, Zap, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CategoryStats {
  id: string
  name_ar: string
  name_en: string
  total_questions: number
  total_diamonds: number
  questions_used: number
  usage_percentage: number
  avg_diamonds: number
}

interface QuestionStats {
  id: string
  question_ar: string
  question_en: string
  diamonds: number
  category_name: string
  times_used: number
  last_used: string | null
}

export default function GameAnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([])
  const [overallStats, setOverallStats] = useState({
    totalCategories: 0,
    totalQuestions: 0,
    totalDiamonds: 0,
    questionsUsed: 0,
    usageRate: 0,
    mostPopularCategory: '',
    leastUsedCategory: '',
    avgDiamondsPerQuestion: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
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

  const fetchAnalytics = async () => {
    try {
      // Get categories with question counts
      const { data: categories } = await supabase
        .from("categories")
        .select(`
          id,
          name_ar,
          name_en,
          diamond_questions (
            id,
            diamonds
          )
        `)

      // Get used questions
      const { data: usedQuestions } = await supabase
        .from("used_questions")
        .select(`
          question_id,
          used_at,
          diamond_questions (
            id,
            question_ar,
            question_en,
            diamonds,
            category_id,
            categories (
              name_ar,
              name_en
            )
          )
        `)

      if (categories) {
        // Process category statistics
        const categoryStatsData: CategoryStats[] = categories.map(category => {
          const questions = category.diamond_questions || []
          const totalQuestions = questions.length
          const totalDiamonds = questions.reduce((sum, q) => sum + q.diamonds, 0)
          
          // Count how many questions from this category were used
          const questionsUsed = usedQuestions?.filter(uq => 
            uq.diamond_questions?.category_id === category.id
          ).length || 0

          return {
            id: category.id,
            name_ar: category.name_ar,
            name_en: category.name_en,
            total_questions: totalQuestions,
            total_diamonds: totalDiamonds,
            questions_used: questionsUsed,
            usage_percentage: totalQuestions > 0 ? (questionsUsed / totalQuestions) * 100 : 0,
            avg_diamonds: totalQuestions > 0 ? totalDiamonds / totalQuestions : 0
          }
        })

        setCategoryStats(categoryStatsData)

        // Process question statistics
        const questionUsageMap = new Map()
        usedQuestions?.forEach(uq => {
          const questionId = uq.diamond_questions?.id
          if (questionId) {
            questionUsageMap.set(questionId, (questionUsageMap.get(questionId) || 0) + 1)
          }
        })

        const questionStatsData: QuestionStats[] = []
        categories.forEach(category => {
          category.diamond_questions?.forEach(question => {
            const timesUsed = questionUsageMap.get(question.id) || 0
            const lastUsedEntry = usedQuestions?.find(uq => uq.diamond_questions?.id === question.id)
            
            questionStatsData.push({
              id: question.id,
              question_ar: question.question_ar || '',
              question_en: question.question_en || '',
              diamonds: question.diamonds,
              category_name: category.name_en || category.name_ar,
              times_used: timesUsed,
              last_used: lastUsedEntry?.used_at || null
            })
          })
        })

        // Sort by most used
        questionStatsData.sort((a, b) => b.times_used - a.times_used)
        setQuestionStats(questionStatsData.slice(0, 10)) // Top 10

        // Calculate overall statistics
        const totalCategories = categories.length
        const totalQuestions = questionStatsData.length
        const totalDiamonds = questionStatsData.reduce((sum, q) => sum + q.diamonds, 0)
        const questionsUsed = questionUsageMap.size
        const usageRate = totalQuestions > 0 ? (questionsUsed / totalQuestions) * 100 : 0

        const mostPopularCategory = categoryStatsData.reduce((prev, current) => 
          prev.questions_used > current.questions_used ? prev : current
        )

        const leastUsedCategory = categoryStatsData.reduce((prev, current) => 
          prev.questions_used < current.questions_used ? prev : current
        )

        setOverallStats({
          totalCategories,
          totalQuestions,
          totalDiamonds,
          questionsUsed,
          usageRate,
          mostPopularCategory: mostPopularCategory?.name_en || mostPopularCategory?.name_ar || 'N/A',
          leastUsedCategory: leastUsedCategory?.name_en || leastUsedCategory?.name_ar || 'N/A',
          avgDiamondsPerQuestion: totalQuestions > 0 ? totalDiamonds / totalQuestions : 0
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Game Analytics</h1>
              <p className="text-gray-600">Insights into your quiz performance and usage</p>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalQuestions}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Questions Used</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.questionsUsed}</p>
                  <p className="text-xs text-gray-500">{overallStats.usageRate.toFixed(1)}% usage rate</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Diamonds</p>
                  <p className="text-2xl font-bold text-gray-900">💎 {overallStats.totalDiamonds}</p>
                  <p className="text-xs text-gray-500">Avg: {overallStats.avgDiamondsPerQuestion.toFixed(1)} per question</p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalCategories}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name_en}</h3>
                      <p className="text-sm text-gray-600">{category.name_ar}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {category.questions_used}/{category.total_questions} used
                      </Badge>
                      <p className="text-sm text-gray-600">💎 {category.total_diamonds} total</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Usage Rate</span>
                      <span>{category.usage_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={category.usage_percentage} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avg diamonds: {category.avg_diamonds.toFixed(1)}</span>
                    <span>{category.total_questions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Used Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Most Used Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questionStats.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      <Badge variant="outline" className="text-xs">💎 {question.diamonds}</Badge>
                      <Badge variant="outline" className="text-xs">{question.category_name}</Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {question.question_en || question.question_ar}
                    </p>
                    {question.last_used && (
                      <p className="text-xs text-gray-500">
                        Last used: {new Date(question.last_used).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{question.times_used}</p>
                    <p className="text-xs text-gray-500">times used</p>
                  </div>
                </div>
              ))}
              
              {questionStats.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No usage data yet. Start playing games to see analytics!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}