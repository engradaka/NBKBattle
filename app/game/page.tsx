"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  diamonds: number
  question_type?: 'text' | 'video' | 'image' | 'audio'
  media_url?: string
  media_duration?: number
  answer_type?: 'text' | 'video' | 'image' | 'audio'
  answer_media_url?: string
  answer_media_duration?: number
}

interface PowerUp {
  id: string
  name: string
  description: string
  icon: string
  used: boolean
}

interface GameState {
  team1Name: string
  team2Name: string
  team1Score: number
  team2Score: number
  team1Categories: string[]
  team2Categories: string[]
  answeredQuestions: string[]
  team1PowerUps: PowerUp[]
  team2PowerUps: PowerUp[]
  team1ConsecutiveWrong: number
  team2ConsecutiveWrong: number
  team1ConsecutiveRight: number
  team2ConsecutiveRight: number
  lastPowerUpGranted: number // Question number when last power-up was granted
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

// Get 1 question per category/diamond value: unused first, then used
function getQuestionForCategoryPoint(
  categoryId: string,
  diamonds: number,
  allQuestions: Question[],
  usedQuestionIds: string[]
): Question | null {
  const questions = allQuestions.filter(
    q => q.category_id === categoryId && q.diamonds === diamonds
  )
  
  // Separate unused and used questions
  const unusedQuestions = questions.filter(q => !usedQuestionIds.includes(q.id))
  const usedQuestions = questions.filter(q => usedQuestionIds.includes(q.id))
  
  // Shuffle unused questions for variety
  const shuffledUnused = shuffle(unusedQuestions)
  
  // Return first unused question, or first used question, or null
  if (shuffledUnused.length > 0) {
    return shuffledUnused[0]
  } else if (usedQuestions.length > 0) {
    return usedQuestions[0]
  }
  
  return null
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
    team1PowerUps: [],
    team2PowerUps: [],
    team1ConsecutiveWrong: 0,
    team2ConsecutiveWrong: 0,
    team1ConsecutiveRight: 0,
    team2ConsecutiveRight: 0,
    lastPowerUpGranted: 0,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [rotatedQuestionsMap, setRotatedQuestionsMap] = useState<Record<string, Question[]>>({})
  const [currentTurn, setCurrentTurn] = useState<1 | 2 | 'finished'>(1)
  const [nextQuestionTurn, setNextQuestionTurn] = useState<1 | 2>(1)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [activePowerUp, setActivePowerUp] = useState<PowerUp | null>(null)
  const [powerUpTeam, setPowerUpTeam] = useState<1 | 2 | null>(null)
  const [powerUpMode, setPowerUpMode] = useState<string | null>(null)
  const [showPowerUpAnimation, setShowPowerUpAnimation] = useState<{powerUp: PowerUp, team: 1 | 2} | null>(null)
  const router = useRouter()
  const { language, t } = useLanguage()

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up for current team
            if (currentTurn === 1) {
              // Switch to team 2
              setCurrentTurn(2)
              setTimeLeft(30)
              return 30
            } else {
              // Both teams failed, show answer
              setCurrentTurn('finished')
              setTimerActive(false)
              setShowAnswer(true)
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeLeft, currentTurn])

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

  // Power-up definitions
  const createPowerUp = (id: string, name: string, description: string, icon: string): PowerUp => ({
    id, name, description, icon, used: false
  })

  const availablePowerUps = {
    doublePoints: createPowerUp('double', 'Double Points', '2x points for this question', '🔥'),
    questionSwap: createPowerUp('swap', 'Question Swap', 'Replace with different same-point question', '🔄'),
    stealTurn: createPowerUp('steal', 'Steal Turn', 'Answer opponent question', '🎯'),
    blockQuestion: createPowerUp('block', 'Block Question', 'Click any question to eliminate it', '🚫')
  }

  // Check and grant power-ups - GUARANTEED AT SPECIFIC QUESTIONS (Diamond System - 30 total questions)
  const checkPowerUpTriggers = () => {
    const scoreDiff = Math.abs(gameState.team1Score - gameState.team2Score)
    const losingTeam = gameState.team1Score < gameState.team2Score ? 1 : 2
    const totalQuestions = gameState.answeredQuestions.length
    
    // GUARANTEED POWER-UPS AT SPECIFIC QUESTION NUMBERS (Adjusted for 30 questions total)
    
    // 9th question - First power-up (30% through game)
    if (totalQuestions === 9 && gameState.lastPowerUpGranted < 9) {
      const teamWithFewerPowerUps = gameState.team1PowerUps.length <= gameState.team2PowerUps.length ? 1 : 2
      grantPowerUp(teamWithFewerPowerUps, [availablePowerUps.questionSwap])
      return
    }
    
    // 15th question - Second power-up (50% through game)
    if (totalQuestions === 15 && gameState.lastPowerUpGranted < 15) {
      if (scoreDiff >= 150) { // Adjusted for diamond values (was 600 points)
        // Give to losing team if there's a gap
        grantPowerUp(losingTeam, [availablePowerUps.doublePoints])
      } else {
        // Give to team with fewer power-ups if close game
        const teamWithFewerPowerUps = gameState.team1PowerUps.length <= gameState.team2PowerUps.length ? 1 : 2
        grantPowerUp(teamWithFewerPowerUps, [availablePowerUps.doublePoints])
      }
      return
    }
    
    // 21st question - Third power-up (70% through game)
    if (totalQuestions === 21 && gameState.lastPowerUpGranted < 21) {
      const teamWithFewerPowerUps = gameState.team1PowerUps.length <= gameState.team2PowerUps.length ? 1 : 2
      grantPowerUp(teamWithFewerPowerUps, [availablePowerUps.stealTurn])
      return
    }
    
    // 26th question - Fourth power-up (87% through game)
    if (totalQuestions === 26 && gameState.lastPowerUpGranted < 26) {
      if (scoreDiff >= 200) { // Adjusted for diamond values (was 800 points)
        // Give to losing team if big gap
        grantPowerUp(losingTeam, [availablePowerUps.blockQuestion])
      } else {
        // Give to team with fewer power-ups
        const teamWithFewerPowerUps = gameState.team1PowerUps.length <= gameState.team2PowerUps.length ? 1 : 2
        grantPowerUp(teamWithFewerPowerUps, [availablePowerUps.blockQuestion])
      }
      return
    }
  }

  // Grant power-up to team(s) - ensure no duplicates and max 3 per team
  const grantPowerUp = (team: 1 | 2, powerUps: PowerUp[]) => {
    setGameState(prev => {
      const newState = { ...prev }
      
      powerUps.forEach(powerUp => {
        // Check if team already has 3 power-ups or already has this power-up
        const teamPowerUps = newState[`team${team}PowerUps`]
        const existsOnTeam1 = newState.team1PowerUps.find(p => p.id === powerUp.id)
        const existsOnTeam2 = newState.team2PowerUps.find(p => p.id === powerUp.id)
        
        if (teamPowerUps.length < 3 && !existsOnTeam1 && !existsOnTeam2) {
          newState[`team${team}PowerUps`] = [...teamPowerUps, { ...powerUp }]
          newState.lastPowerUpGranted = newState.answeredQuestions.length // Update cooldown
          
          // Play power-up sound
          const audio = new Audio('/sounds/powerup.mp3')
          audio.volume = 0.6
          audio.play().catch(e => console.log('Audio play failed:', e))
          
          // Show animation
          setShowPowerUpAnimation({ powerUp, team })
          
          // Hide animation after 3 seconds
          setTimeout(() => {
            setShowPowerUpAnimation(null)
          }, 3000)
        }
      })
      
      return newState
    })
  }

  // Use power-up
  const usePowerUp = (team: 1 | 2, powerUpId: string) => {
    const powerUp = gameState[`team${team}PowerUps`].find(p => p.id === powerUpId && !p.used)
    if (!powerUp) return

    // Activate power-up mode
    setActivePowerUp(powerUp)
    setPowerUpTeam(team)
    setPowerUpMode(powerUpId)
    
    // Mark as used
    setGameState(prev => ({
      ...prev,
      [`team${team}PowerUps`]: prev[`team${team}PowerUps`].map(p => 
        p.id === powerUpId ? { ...p, used: true } : p
      )
    }))
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
      .from("diamond_questions")
      .select("*")
      .in("category_id", allSelectedCategories)
      .order("diamonds", { ascending: false })

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return
    }

    const sortedQuestions = (questionsData || []).sort((a, b) => a.id.localeCompare(b.id))
    setQuestions(sortedQuestions)

    // Get used questions from localStorage
    const usedQuestionIds = getUsedQuestions()
    
    // Pre-load questions map with unused/used logic - Diamond system
    const map: Record<string, Question[]> = {}
    for (const category of categoriesData || []) {
      // Diamond values: 10, 25, 50, 75, 100
      for (const diamonds of [10, 25, 50, 75, 100]) {
        const key = `${category.id}-${diamonds}`
        const question = getQuestionForCategoryPoint(category.id, diamonds, sortedQuestions, usedQuestionIds)
        map[key] = question ? [question] : []
      }
    }
    setRotatedQuestionsMap(map)
  }

  const handleQuestionClick = (question: Question) => {
    if (gameState.answeredQuestions.includes(question.id)) return
    
    // Handle power-up modes
    if (powerUpMode === 'block') {
      // Block/eliminate the question
      setGameState(prev => ({
        ...prev,
        answeredQuestions: [...prev.answeredQuestions, question.id]
      }))
      // Update the rotated questions map to reflect the blocked question
      const key = `${question.category_id}-${question.points}`
      setRotatedQuestionsMap(prev => {
        const updated = { ...prev }
        if (updated[key]) {
          updated[key] = updated[key].filter(q => q.id !== question.id)
        }
        return updated
      })
      setPowerUpMode(null)
      setActivePowerUp(null)
      setPowerUpTeam(null)
      return
    }
    
    if (powerUpMode === 'swap') {
      // Replace with different question of same points
      const samePointQuestions = questions.filter(q => 
        q.points === question.points && 
        q.id !== question.id &&
        !gameState.answeredQuestions.includes(q.id)
      )
      if (samePointQuestions.length > 0) {
        const randomQuestion = samePointQuestions[Math.floor(Math.random() * samePointQuestions.length)]
        // Update the rotated questions map
        const key = `${question.category_id}-${question.points}`
        setRotatedQuestionsMap(prev => {
          const updated = { ...prev }
          if (updated[key]) {
            updated[key] = updated[key].map(q => q.id === question.id ? randomQuestion : q)
          }
          return updated
        })
      }
      setPowerUpMode(null)
      setActivePowerUp(null)
      setPowerUpTeam(null)
      return
    }
    
    // Normal question selection
    setSelectedQuestion(question)
    setShowAnswer(false)
    setCurrentTurn(1) // Always start with team 1
    setTimeLeft(30)
    setTimerActive(true)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    setTimerActive(false)
  }

  const handleAnswerResult = (teamNumber: number) => {
    if (!selectedQuestion) return

    // Update score
    const newTeam1Score = teamNumber === 1 ? gameState.team1Score + selectedQuestion.points : gameState.team1Score
    const newTeam2Score = teamNumber === 2 ? gameState.team2Score + selectedQuestion.points : gameState.team2Score

    // Update consecutive counters
    const updateConsecutive = (prev: GameState) => {
      if (teamNumber === 1) {
        return {
          ...prev,
          team1ConsecutiveRight: prev.team1ConsecutiveRight + 1,
          team1ConsecutiveWrong: 0,
          team2ConsecutiveWrong: prev.team2ConsecutiveWrong + (teamNumber === 2 ? 0 : 1)
        }
      } else if (teamNumber === 2) {
        return {
          ...prev,
          team2ConsecutiveRight: prev.team2ConsecutiveRight + 1,
          team2ConsecutiveWrong: 0,
          team1ConsecutiveWrong: prev.team1ConsecutiveWrong + 1
        }
      } else {
        return {
          ...prev,
          team1ConsecutiveWrong: prev.team1ConsecutiveWrong + 1,
          team2ConsecutiveWrong: prev.team2ConsecutiveWrong + 1,
          team1ConsecutiveRight: 0,
          team2ConsecutiveRight: 0
        }
      }
    }

    // Apply power-up effects
    let finalDiamonds = selectedQuestion.diamonds
    if (activePowerUp?.id === 'double' && powerUpTeam === teamNumber) {
      finalDiamonds *= 2
    }

    const finalTeam1Score = teamNumber === 1 ? gameState.team1Score + finalDiamonds : gameState.team1Score
    const finalTeam2Score = teamNumber === 2 ? gameState.team2Score + finalDiamonds : gameState.team2Score

    // Mark as answered in state
    setGameState((prev) => {
      const updated = updateConsecutive(prev)
      return {
        ...updated,
        team1Score: finalTeam1Score,
        team2Score: finalTeam2Score,
        answeredQuestions: [...prev.answeredQuestions, selectedQuestion.id],
      }
    })

    // Mark question as used and save to localStorage
    const usedQuestionIds = getUsedQuestions()
    if (!usedQuestionIds.includes(selectedQuestion.id)) {
      const newUsedIds = [...usedQuestionIds, selectedQuestion.id]
      saveUsedQuestions(newUsedIds)
    }

    // Reset timer and close dialog
    setTimerActive(false)
    setSelectedQuestion(null)
    setShowAnswer(false)
    setCurrentTurn(1)
    setTimeLeft(30)
    setActivePowerUp(null)
    setPowerUpTeam(null)
    setPowerUpMode(null)
    
    // Switch to next team for next question
    setNextQuestionTurn(nextQuestionTurn === 1 ? 2 : 1)
    
    // Check for new power-ups after answer
    setTimeout(checkPowerUpTriggers, 500)
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

  // Helper function to detect if text contains Arabic characters
  const isArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRegex.test(text)
  }

  // Get text direction based on content
  const getTextDirection = (text: string) => {
    return isArabicText(text) ? 'rtl' : 'ltr'
  }

  return (
    <div className="flex min-h-screen bg-white">
      <SidebarProvider>
        <main className="flex-1 p-4 sm:p-8 md:ml-16">
          <div className="max-w-7xl mx-auto">
            {/* Turn Indicator */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg">
                <span className="text-lg font-bold text-blue-800">
                  {language === 'ar' ? (
                    <>
                      <span dir="ltr">{gameState[`team${nextQuestionTurn}Name`]}</span> :السؤال التالي: دور فريق
                    </>
                  ) : (
                    <>Next Question: {gameState[`team${nextQuestionTurn}Name`]}'s Turn</>
                  )}
                </span>
              </div>
            </div>

            {/* Game Header */}
            <div className="flex justify-between items-start mb-6 sm:mb-8">
              {/* Team 1 */}
              <div className="text-center">
                <div className={`p-3 rounded-lg border-2 ${nextQuestionTurn === 1 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${nextQuestionTurn === 1 ? 'text-blue-600' : 'text-gray-900'}`}>
                    {gameState.team1Name}
                  </h2>
                  <Badge variant="outline" className="text-lg sm:text-xl mt-2 px-3 py-1">
                    {gameState.team1Score} pts
                  </Badge>
                </div>
                {/* Team 1 Power-ups */}
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {gameState.team1PowerUps.map((powerUp) => (
                    <Button
                      key={powerUp.id}
                      size="sm"
                      variant={powerUp.used ? "secondary" : (powerUpMode === powerUp.id ? "destructive" : "default")}
                      disabled={powerUp.used}
                      onClick={() => usePowerUp(1, powerUp.id)}
                      className="text-xs px-2 py-1 h-8"
                      title={powerUp.description}
                    >
                      {powerUp.icon}
                    </Button>
                  ))}
                </div>
              </div>



              {/* Team 2 */}
              <div className="text-center">
                <div className={`p-3 rounded-lg border-2 ${nextQuestionTurn === 2 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${nextQuestionTurn === 2 ? 'text-blue-600' : 'text-gray-900'}`}>
                    {gameState.team2Name}
                  </h2>
                  <Badge variant="outline" className="text-lg sm:text-xl mt-2 px-3 py-1">
                    {gameState.team2Score} pts
                  </Badge>
                </div>
                {/* Team 2 Power-ups */}
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {gameState.team2PowerUps.map((powerUp) => (
                    <Button
                      key={powerUp.id}
                      size="sm"
                      variant={powerUp.used ? "secondary" : (powerUpMode === powerUp.id ? "destructive" : "default")}
                      disabled={powerUp.used}
                      onClick={() => usePowerUp(2, powerUp.id)}
                      className="text-xs px-2 py-1 h-8"
                      title={powerUp.description}
                    >
                      {powerUp.icon}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Game Board - Diamond System */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="bg-blue-800 text-white text-center py-4">
                    <CardTitle className="text-lg sm:text-xl font-bold">{getCategoryName(category)}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Single Column - Diamond Levels */}
                    <div className="space-y-0">
                      {[100, 75, 50, 25, 10].map((diamonds) => {
                        const key = `${category.id}-${diamonds}`
                        const available = rotatedQuestionsMap[key] || []
                        const question = available[0] || null
                        const isAnswered = question ? gameState.answeredQuestions.includes(question.id) : true

                        return (
                          <Button
                            key={`${category.id}-${diamonds}`}
                            variant="outline"
                            disabled={isAnswered || !question}
                            onClick={() => question && handleQuestionClick(question)}
                            className="w-full h-16 sm:h-20 text-base sm:text-lg font-bold rounded-none border-gray-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2"
                          >
                            {isAnswered ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <>
                                <span className="text-blue-600">💎</span>
                                <span>{diamonds}</span>
                              </>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Game Control Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-4 sm:px-6 py-2 bg-gray-600 text-white border-gray-600 hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("back_to_categories")}
              </Button>
              <Button
                onClick={handleFinishGame}
                className="px-6 sm:px-8 py-3 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                <Trophy className="w-4 h-4 mr-2" />
                {t("finish_game")}
              </Button>
            </div>

            {/* Power-up Animation */}
            {showPowerUpAnimation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="animate-bounce">
                  <div className="bg-yellow-400 rounded-full p-8 shadow-2xl animate-pulse">
                    <div className="text-8xl animate-spin">
                      {showPowerUpAnimation.powerUp.icon}
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white rounded-lg p-4 shadow-xl animate-pulse">
                    <h3 className="text-2xl font-bold text-center text-yellow-600">
                      🎉 POWER-UP GRANTED! 🎉
                    </h3>
                    <p className="text-lg text-center mt-2">
                      <strong>{gameState[`team${showPowerUpAnimation.team}Name`]}</strong> got <strong>{showPowerUpAnimation.powerUp.name}</strong>!
                    </p>
                  </div>
                </div>
                
                {/* Flying animation to team */}
                <div 
                  className={`absolute text-4xl animate-ping ${
                    showPowerUpAnimation.team === 1 
                      ? 'top-20 left-20 animate-bounce' 
                      : 'top-20 right-20 animate-bounce'
                  }`}
                  style={{
                    animation: `flyToTeam${showPowerUpAnimation.team} 2s ease-out 1s forwards`
                  }}
                >
                  {showPowerUpAnimation.powerUp.icon}
                </div>
              </div>
            )}
            
            <style jsx>{`
              @keyframes flyToTeam1 {
                0% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(-200px, -100px) scale(0.5); }
                100% { transform: translate(-400px, -200px) scale(0.2); opacity: 0; }
              }
              @keyframes flyToTeam2 {
                0% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(200px, -100px) scale(0.5); }
                100% { transform: translate(400px, -200px) scale(0.2); opacity: 0; }
              }
            `}</style>

            {/* Question Dialog */}
            <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
              <DialogContent className="max-w-4xl w-[95vw]" aria-describedby="question-dialog-description">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl sm:text-2xl">
                    {selectedQuestion && `💎 ${selectedQuestion.diamonds} Diamonds`}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Question and answer dialog for the quiz game
                  </DialogDescription>
                </DialogHeader>
                {selectedQuestion && (
                  <div className="space-y-6 p-4">
                    {/* Circular Timer and Turn Indicator */}
                    {!showAnswer && (
                      <div className="relative">
                        {/* Circular Timer - Top Left */}
                        <div className="absolute -top-4 -left-4 z-10">
                          <div 
                            className={`relative w-16 h-16 cursor-pointer ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                            onClick={() => setTimerActive(!timerActive)}
                            title={timerActive ? "Click to pause timer" : "Click to resume timer"}
                          >
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                              {/* Background circle */}
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke={timeLeft <= 10 ? '#ef4444' : '#3b82f6'}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / 30)}`}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            {/* Timer text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
                                {timeLeft}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Turn Indicator & Active Power-up */}
                        <div className="text-center mb-4">
                          <div className="text-lg font-bold text-blue-600 break-words px-4">
                            {currentTurn === 'finished' ? (language === 'ar' ? 'انتهى الوقت!' : 'Time\'s Up!') : 
                             language === 'ar' ? (
                               <>
                                 <span dir="ltr">{currentTurn === 1 ? gameState.team1Name : gameState.team2Name}</span> دور
                               </>
                             ) : (
                               currentTurn === 1 ? `${gameState.team1Name}'s Turn` : `${gameState.team2Name}'s Turn`
                             )}
                          </div>
                          {activePowerUp && (
                            <div className="mt-2 p-2 bg-yellow-100 rounded-lg">
                              <span className="text-sm font-bold text-yellow-800">
                                {activePowerUp.icon} {activePowerUp.name} Active!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Question */}
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <p
                        className="text-lg sm:text-xl font-medium break-words whitespace-normal leading-relaxed mb-4"
                        dir={getTextDirection(getQuestionText(selectedQuestion))}
                        style={{ textAlign: getTextDirection(getQuestionText(selectedQuestion)) === 'rtl' ? 'right' : 'left' }}
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
                        {/* Text Answer */}
                        <p
                          className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-200 break-words whitespace-normal leading-relaxed mb-4"
                          dir={getTextDirection(getAnswerText(selectedQuestion))}
                          style={{ textAlign: getTextDirection(getAnswerText(selectedQuestion)) === 'rtl' ? 'right' : 'left' }}
                        >
                          {getAnswerText(selectedQuestion)}
                          {activePowerUp?.id === 'double' && (
                            <span className={`${getTextDirection(getAnswerText(selectedQuestion)) === 'rtl' ? 'mr-2' : 'ml-2'} text-red-600`}>🔥 (Double Diamonds!)</span>
                          )}
                        </p>
                        
                        {/* Answer Media Content */}
                        {selectedQuestion.answer_media_url && (
                          <div className="mt-4">
                            {selectedQuestion.answer_type === 'image' && (
                              <div className="flex justify-center">
                                <Image
                                  src={selectedQuestion.answer_media_url}
                                  alt="Answer image"
                                  width={400}
                                  height={300}
                                  className="rounded-lg object-cover max-w-full h-auto"
                                />
                              </div>
                            )}
                            
                            {selectedQuestion.answer_type === 'video' && (
                              <div className="flex justify-center">
                                <video
                                  src={selectedQuestion.answer_media_url}
                                  controls
                                  autoPlay
                                  className="rounded-lg max-w-full h-auto"
                                  style={{ maxHeight: '400px' }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            )}
                            
                            {selectedQuestion.answer_type === 'audio' && (
                              <div className="flex justify-center">
                                <audio
                                  src={selectedQuestion.answer_media_url}
                                  controls
                                  autoPlay
                                  className="w-full max-w-md"
                                >
                                  Your browser does not support the audio tag.
                                </audio>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      {!showAnswer ? (
                        <div className="space-y-2">
                          <Button
                            onClick={handleShowAnswer}
                            variant="outline"
                            className="w-full h-12 sm:h-14 text-base sm:text-lg"
                          >
                            Show Answer
                          </Button>
                          {currentTurn === 'finished' && (
                            <div className="text-center text-red-600 font-bold">
                              Both teams ran out of time!
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                              onClick={() => handleAnswerResult(1)}
                              variant="default"
                              className="h-14 sm:h-16 bg-green-600 hover:bg-green-700 text-sm sm:text-base px-2 py-2"
                            >
                              <span className="break-words text-center leading-tight">{gameState.team1Name}</span>
                            </Button>
                            <Button
                              onClick={() => handleAnswerResult(2)}
                              variant="default"
                              className="h-14 sm:h-16 bg-green-600 hover:bg-green-700 text-sm sm:text-base px-2 py-2"
                            >
                              <span className="break-words text-center leading-tight">{gameState.team2Name}</span>
                            </Button>
                          </div>
                          <Button
                            onClick={() => handleAnswerResult(0)}
                            variant="secondary"
                            className="h-12 sm:h-14 text-sm sm:text-base"
                          >
                            {t("no_one")}
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