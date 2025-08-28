"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SidebarProvider } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, Trophy } from "lucide-react"
import Image from "next/image"

interface Category {
  id: string
  name_ar: string
  name_en: string
  image_url: string | null
}

interface Question {
  id: string
  category_id: string
  question_ar: string
  question_en: string
  answer_ar: string
  answer_en: string
  points: number
  question_type?: 'text' | 'video' | 'image' | 'audio'
  media_url?: string
  media_duration?: number
}

interface GameState {
  team1Name: string
  team2Name: string
  team1Score: number
  team2Score: number
  team1Categories: string[]
  team2Categories: string[]
  answeredQuestions: string[]
}

interface ProgressRecord {
  last_used_question_ids: string[]
}

// Shuffle array helper
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Get 2 questions per category/point value: unused first, then used
function getQuestionsForCategoryPoint(
  categoryId: string,
  points: number,
  allQuestions: Question[],
  usedQuestionIds: string[]
): Question[] {
  const questions = allQuestions.filter(
    q => q.category_id === categoryId && q.points === points
  )
  
  // Separate unused and used questions
  const unusedQuestions = questions.filter(q => !usedQuestionIds.includes(q.id))
  const usedQuestions = questions.filter(q => usedQuestionIds.includes(q.id))
  
  // Shuffle unused questions for variety
  const shuffledUnused = shuffle(unusedQuestions)
  
  // Sort used questions by when they were used (oldest first)
  const sortedUsed = usedQuestions.sort((a, b) => {
    const aIndex = usedQuestionIds.indexOf(a.id)
    const bIndex = usedQuestionIds.indexOf(b.id)
    return aIndex - bIndex
  })
  
  // Take up to 2 questions: unused first, then used
  const selectedQuestions = []
  
  // Add unused questions first
  selectedQuestions.push(...shuffledUnused.slice(0, 2))
  
  // If we need more questions, add used ones
  if (selectedQuestions.length < 2) {
    const needed = 2 - selectedQuestions.length
    selectedQuestions.push(...sortedUsed.slice(0, needed))
  }
  
  // If still not enough, duplicate existing questions
  while (selectedQuestions.length < 2 && questions.length > 0) {
    selectedQuestions.push(questions[0])
  }
  
  return selectedQuestions.slice(0, 2)
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>({
    team1Name: "",
    team2Name: "",
    team1Score: 0,
    team2Score: 0,
    team1Categories: [],
    team2Categories: [],
    answeredQuestions: [],
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [rotatedQuestionsMap, setRotatedQuestionsMap] = useState<Record<string, Question[]>>({})
  const router = useRouter()
  const { language, t } = useLanguage()

  useEffect(() => {
    initializeGame()
  }, [])

  // Load used questions from localStorage (persistent across games)
  const getUsedQuestions = (): string[] => {
    const used = localStorage.getItem('usedQuestionIds')
    return used ? JSON.parse(used) : []
  }

  // Save used questions to localStorage
  const saveUsedQuestions = (usedIds: string[]) => {
    localStorage.setItem('usedQuestionIds', JSON.stringify(usedIds))
  }

  const initializeGame = async () => {
    const team1Name = localStorage.getItem("team1Name") || "Team 1"
    const team2Name = localStorage.getItem("team2Name") || "Team 2"
    const team1Categories = JSON.parse(localStorage.getItem("team1Categories") || "[]")
    const team2Categories = JSON.parse(localStorage.getItem("team2Categories") || "[]")

    setGameState((prev) => ({
      ...prev,
      team1Name,
      team2Name,
      team1Categories,
      team2Categories,
    }))

    const allSelectedCategories = [...team1Categories, ...team2Categories]

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .in("id", allSelectedCategories)

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
      return
    }

    setCategories(categoriesData || [])

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .in("category_id", allSelectedCategories)
      .order("points")

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return
    }

    const sortedQuestions = (questionsData || []).sort((a, b) => a.id.localeCompare(b.id))
    setQuestions(sortedQuestions)

    // Get used questions from localStorage
    const usedQuestionIds = getUsedQuestions()
    
    // Pre-load questions map with unused/used logic
    const map: Record<string, Question[]> = {}
    for (const category of categoriesData || []) {
      for (const points of [200, 400, 600]) {
        const key = `${category.id}-${points}`
        map[key] = getQuestionsForCategoryPoint(category.id, points, sortedQuestions, usedQuestionIds)
      }
    }
    setRotatedQuestionsMap(map)
  }

  const handleQuestionClick = (question: Question) => {
    if (gameState.answeredQuestions.includes(question.id)) return
    setSelectedQuestion(question)
    setShowAnswer(false)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleAnswerResult = (teamNumber: number) => {
    if (!selectedQuestion) return

    // Update score
    const newTeam1Score = teamNumber === 1 ? gameState.team1Score + selectedQuestion.points : gameState.team1Score
    const newTeam2Score = teamNumber === 2 ? gameState.team2Score + selectedQuestion.points : gameState.team2Score

    // Mark as answered in state
    setGameState((prev) => ({
      ...prev,
      team1Score: newTeam1Score,
      team2Score: newTeam2Score,
      answeredQuestions: [...prev.answeredQuestions, selectedQuestion.id],
    }))

    // Mark question as used and save to localStorage
    const usedQuestionIds = getUsedQuestions()
    if (!usedQuestionIds.includes(selectedQuestion.id)) {
      const newUsedIds = [...usedQuestionIds, selectedQuestion.id]
      saveUsedQuestions(newUsedIds)
    }

    // Close dialog
    setSelectedQuestion(null)
    setShowAnswer(false)
  }

  const handleBack = () => {
    router.push("/category-selection")
  }

  const handleFinishGame = () => {
    localStorage.setItem("finalTeam1Score", gameState.team1Score.toString())
    localStorage.setItem("finalTeam2Score", gameState.team2Score.toString())
    router.push("/results")
  }

  const getCategoryName = (category: Category) => {
    return language === "ar" ? category.name_ar : category.name_en
  }

  const getQuestionText = (question: Question) => {
    return language === "ar" ? question.question_ar : question.question_en
  }

  const getAnswerText = (question: Question) => {
    return language === "ar" ? question.answer_ar : question.answer_en
  }

  return (
    <div className="flex min-h-screen bg-white">
      <SidebarProvider>
        <main className="flex-1 p-4 sm:p-8 md:ml-16">
          <div className="max-w-7xl mx-auto">
            {/* Game Header */}
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{gameState.team1Name}</h2>
                <Badge variant="outline" className="text-lg sm:text-xl mt-2 px-3 py-1">
                  {gameState.team1Score} pts
                </Badge>
              </div>
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-4 sm:px-6 py-2 bg-blue-800 text-white border-blue-800 hover:bg-blue-700 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("back_to_categories")}
              </Button>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{gameState.team2Name}</h2>
                <Badge variant="outline" className="text-lg sm:text-xl mt-2 px-3 py-1">
                  {gameState.team2Score} pts
                </Badge>
              </div>
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="bg-blue-800 text-white text-center py-4">
                    <CardTitle className="text-lg sm:text-xl font-bold">{getCategoryName(category)}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-0">
                      {/* Left Column */}
                      <div className="space-y-0">
                        {[600, 400, 200].map((points) => {
                          const key = `${category.id}-${points}`
                          const available = rotatedQuestionsMap[key] || []
                          const firstQuestion = available[0] || null
                          const isAnswered = firstQuestion ? gameState.answeredQuestions.includes(firstQuestion.id) : true

                          return (
                            <Button
                              key={`left-${category.id}-${points}`}
                              variant="outline"
                              disabled={isAnswered || !firstQuestion}
                              onClick={() => firstQuestion && handleQuestionClick(firstQuestion)}
                              className="w-full h-16 sm:h-20 text-lg sm:text-xl font-bold rounded-none border-gray-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              {isAnswered ? "✓" : points}
                            </Button>
                          )
                        })}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-0">
                        {[600, 400, 200].map((points) => {
                          const key = `${category.id}-${points}`
                          const available = rotatedQuestionsMap[key] || []
                          const secondQuestion = available[1] || null
                          const isAnswered = secondQuestion ? gameState.answeredQuestions.includes(secondQuestion.id) : true

                          return (
                            <Button
                              key={`right-${category.id}-${points}`}
                              variant="outline"
                              disabled={isAnswered || !secondQuestion}
                              onClick={() => secondQuestion && handleQuestionClick(secondQuestion)}
                              className="w-full h-16 sm:h-20 text-lg sm:text-xl font-bold rounded-none border-gray-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              {isAnswered ? "✓" : points}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Finish Game Button */}
            <div className="text-center">
              <Button
                onClick={handleFinishGame}
                className="px-6 sm:px-8 py-3 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                <Trophy className="w-4 h-4 mr-2" />
                {t("finish_game")}
              </Button>
            </div>

            {/* Question Dialog */}
            <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
              <DialogContent className="max-w-2xl" aria-describedby="question-dialog-description">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl sm:text-2xl">
                    {selectedQuestion && `${selectedQuestion.points} ${t("points")}`}
                  </DialogTitle>
                </DialogHeader>
                <div id="question-dialog-description" className="sr-only">
                  Question and answer dialog for the quiz game
                </div>
                {selectedQuestion && (
                  <div className="space-y-6 p-4">
                    {/* Question */}
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <p
                        className="text-lg sm:text-xl font-medium break-words whitespace-normal text-right leading-relaxed mb-4"
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        {getQuestionText(selectedQuestion)}
                      </p>
                      
                      {/* Media Content */}
                      {selectedQuestion.media_url && (
                        <div className="mt-4">
                          {selectedQuestion.question_type === 'image' && (
                            <div className="flex justify-center">
                              <Image
                                src={selectedQuestion.media_url}
                                alt="Question image"
                                width={400}
                                height={300}
                                className="rounded-lg object-cover max-w-full h-auto"
                              />
                            </div>
                          )}
                          
                          {selectedQuestion.question_type === 'video' && (
                            <div className="flex justify-center">
                              <video
                                src={selectedQuestion.media_url}
                                controls
                                className="rounded-lg max-w-full h-auto"
                                style={{ maxHeight: '300px' }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                          
                          {selectedQuestion.question_type === 'audio' && (
                            <div className="flex justify-center">
                              <audio
                                src={selectedQuestion.media_url}
                                controls
                                className="w-full max-w-md"
                              >
                                Your browser does not support the audio tag.
                              </audio>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Answer */}
                    {showAnswer && (
                      <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <p
                          className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-200 break-words whitespace-normal text-right leading-relaxed"
                          dir={language === "ar" ? "rtl" : "ltr"}
                        >
                          {getAnswerText(selectedQuestion)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      {!showAnswer ? (
                        <Button
                          onClick={handleShowAnswer}
                          className="w-full h-12 sm:h-14 text-base sm:text-lg bg-blue-800 hover:bg-blue-600"
                        >
                          {t("show_answer")}
                        </Button>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Button
                            onClick={() => handleAnswerResult(1)}
                            variant="default"
                            className="h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                          >
                            {gameState.team1Name}
                          </Button>
                          <Button
                            onClick={() => handleAnswerResult(0)}
                            variant="secondary"
                            className="h-12 sm:h-14 text-sm sm:text-base"
                          >
                            {t("no_one")}
                          </Button>
                          <Button
                            onClick={() => handleAnswerResult(2)}
                            variant="default"
                            className="h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                          >
                            {gameState.team2Name}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}