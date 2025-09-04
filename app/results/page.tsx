"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, RotateCcw, Star } from "lucide-react"
import Image from "next/image"

import { useLanguage } from "@/lib/language-context"

export default function ResultsPage() {
  const [team1Name, setTeam1Name] = useState("")
  const [team2Name, setTeam2Name] = useState("")
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [showWinner, setShowWinner] = useState(false)
  const router = useRouter()
  const { language, t } = useLanguage()

  useEffect(() => {
    const t1Name = localStorage.getItem("team1Name") || "Team 1"
    const t2Name = localStorage.getItem("team2Name") || "Team 2"
    const t1Score = Number.parseInt(localStorage.getItem("finalTeam1Score") || "0")
    const t2Score = Number.parseInt(localStorage.getItem("finalTeam2Score") || "0")

    setTeam1Name(t1Name)
    setTeam2Name(t2Name)
    setTeam1Score(t1Score)
    setTeam2Score(t2Score)
    
    // Show winner after diamond animation
    setTimeout(() => {
      setShowWinner(true)
    }, 3000)
  }, [])

  const handlePlayAgain = () => {
    // Clear game data
    localStorage.removeItem("team1Categories")
    localStorage.removeItem("team2Categories")
    localStorage.removeItem("finalTeam1Score")
    localStorage.removeItem("finalTeam2Score")

    router.push("/")
  }

  const winner = team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : 0
  const winnerName = winner === 1 ? team1Name : winner === 2 ? team2Name : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">

      
      <main className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 min-h-screen">
        {/* Diamond Animation - Fixed Position */}
        <div className="absolute top-32 sm:top-20 left-1/2 transform -translate-x-1/2">
          <Image
            src="/diamond.webp"
            alt="Diamond"
            width={300}
            height={300}
            priority
            className="w-48 md:w-64 lg:w-80 h-auto animate-[zoomInOut_3s_ease-in-out_forwards]"
          />
        </div>
        
        {/* Spacer for diamond */}
        <div className="h-32 md:h-40 lg:h-48"></div>
        
        {/* Winner Name - Appears after animation */}
        {showWinner && (
          <div className="text-center mb-8 animate-[fadeInUp_1s_ease-out_forwards]">
            {winner === 0 ? (
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-blue-600">
                🤝 {t("tie")} 🤝
              </h1>
            ) : (
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-blue-600 mb-2">
                  {t("winner")}
                </h2>
                <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-blue-600 break-words">
                {winnerName} 
                </h1>
              </div>
            )}
          </div>
        )}
        
        {/* Scores and Play Again - Appears after winner */}
        {showWinner && (
          <Card className="w-full max-w-md lg:max-w-lg shadow-xl border-2 border-blue-300 animate-[fadeInUp_1s_ease-out_0.5s_forwards] opacity-0">
            <CardContent className="p-4 md:p-6">
              {/* Final Scores */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-center text-blue-600">{t("final_score")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-3 md:p-4 rounded-lg ${
                    winner === 1 ? "bg-blue-100 ring-2 ring-blue-400" : "bg-gray-100"
                  }`}>
                    <h4 className="text-sm md:text-base font-semibold break-words">{team1Name}</h4>
                    <Badge variant="outline" className="text-base md:text-lg font-bold mt-2">
                      💎 {team1Score}
                    </Badge>
                  </div>
                  <div className={`text-center p-3 md:p-4 rounded-lg ${
                    winner === 2 ? "bg-blue-100 ring-2 ring-blue-400" : "bg-gray-100"
                  }`}>
                    <h4 className="text-sm md:text-base font-semibold break-words">{team2Name}</h4>
                    <Badge variant="outline" className="text-base md:text-lg font-bold mt-2">
                      💎 {team2Score}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Play Again Button */}
              <div className="text-center">
                <Button
                  onClick={handlePlayAgain}
                  className="px-6 md:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base md:text-lg shadow-lg transform hover:scale-105 transition-all w-full"
                >
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    {t("play_again")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </main>
        
        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes zoomInOut {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes fadeInUp {
            0% { transform: translateY(30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>
    </div>
  )
}
