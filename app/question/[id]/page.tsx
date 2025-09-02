"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

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
  answer_type?: 'text' | 'video' | 'image' | 'audio'
  answer_media_url?: string
}

export default function QuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(true)
  const [currentTurn, setCurrentTurn] = useState<1 | 2 | 'finished'>(1)
  const router = useRouter()
  const params = useParams()
  const { language } = useLanguage()
  const questionId = params.id as string

  const gameState = {
    team1Name: localStorage.getItem("team1Name") || "Team 1",
    team2Name: localStorage.getItem("team2Name") || "Team 2",
  }

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && timeLeft > 0 && !showAnswer) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (currentTurn === 1) {
              setCurrentTurn(2)
              return 30
            } else {
              setCurrentTurn('finished')
              setTimerActive(false)
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft, currentTurn, showAnswer])

  const fetchQuestion = async () => {
    const { data, error } = await supabase
      .from("diamond_questions")
      .select("*")
      .eq("id", questionId)
      .single()

    if (error) {
      console.error("Error fetching question:", error)
      router.push("/game")
    } else {
      setQuestion(data)
    }
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    setTimerActive(false)
  }

  const handleAnswerResult = (teamNumber: number) => {
    const params = new URLSearchParams({
      questionId,
      teamNumber: teamNumber.toString(),
      diamonds: question?.diamonds.toString() || "0"
    })
    router.push(`/game?${params.toString()}`)
  }

  const getQuestionText = (q: Question) => language === "ar" ? q.question_ar : q.question_en
  const getAnswerText = (q: Question) => language === "ar" ? q.answer_ar : q.answer_en
  const isArabicText = (text: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
  const getTextDirection = (text: string) => isArabicText(text) ? 'rtl' : 'ltr'

  if (!question) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => router.push("/game")} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Game
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            💎 {question.diamonds} Diamonds
          </Badge>
        </div>

        {/* Timer and Turn */}
        {!showAnswer && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-6">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTurn === 'finished' ? 'Time\'s Up!' : 
                   `${currentTurn === 1 ? gameState.team1Name : gameState.team2Name}'s Turn`}
                </div>
                <div className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
                  {timeLeft}s
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <p
                className="text-xl md:text-2xl font-medium mb-6"
                dir={getTextDirection(getQuestionText(question))}
                style={{ textAlign: getTextDirection(getQuestionText(question)) === 'rtl' ? 'right' : 'left' }}
              >
                {getQuestionText(question)}
              </p>
              
              {/* Question Media */}
              {question.media_url && (
                <div className="mt-6">
                  {question.question_type === 'image' && (
                    <div className="flex justify-center">
                      <Image
                        src={question.media_url}
                        alt="Question"
                        width={600}
                        height={400}
                        className="rounded-lg object-contain max-w-full h-auto max-h-96"
                      />
                    </div>
                  )}
                  
                  {question.question_type === 'video' && (
                    <video
                      src={question.media_url}
                      controls
                      className="w-full max-w-2xl mx-auto rounded-lg"
                      style={{ maxHeight: '400px' }}
                    >
                      Your browser does not support video.
                    </video>
                  )}
                  
                  {question.question_type === 'audio' && (
                    <audio
                      src={question.media_url}
                      controls
                      className="w-full max-w-md mx-auto"
                    >
                      Your browser does not support audio.
                    </audio>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answer */}
        {showAnswer && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center">
                <p
                  className="text-xl md:text-2xl font-bold text-green-800 mb-6"
                  dir={getTextDirection(getAnswerText(question))}
                  style={{ textAlign: getTextDirection(getAnswerText(question)) === 'rtl' ? 'right' : 'left' }}
                >
                  {getAnswerText(question)}
                </p>
                
                {/* Answer Media */}
                {question.answer_media_url && (
                  <div className="mt-6">
                    {question.answer_type === 'image' && (
                      <div className="flex justify-center">
                        <Image
                          src={question.answer_media_url}
                          alt="Answer"
                          width={600}
                          height={400}
                          className="rounded-lg object-contain max-w-full h-auto max-h-96"
                        />
                      </div>
                    )}
                    
                    {question.answer_type === 'video' && (
                      <video
                        src={question.answer_media_url}
                        controls
                        autoPlay
                        className="w-full max-w-2xl mx-auto rounded-lg"
                        style={{ maxHeight: '400px' }}
                      >
                        Your browser does not support video.
                      </video>
                    )}
                    
                    {question.answer_type === 'audio' && (
                      <audio
                        src={question.answer_media_url}
                        controls
                        autoPlay
                        className="w-full max-w-md mx-auto"
                      >
                        Your browser does not support audio.
                      </audio>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {!showAnswer ? (
            <Button
              onClick={handleShowAnswer}
              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Show Answer
            </Button>
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
                No One
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}