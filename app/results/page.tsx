"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, RotateCcw, Star } from "lucide-react"

import { useLanguage } from "@/lib/language-context"

export default function ResultsPage() {
  const [team1Name, setTeam1Name] = useState("")
  const [team2Name, setTeam2Name] = useState("")
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
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
      {/* Floating Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => {
          // Use index-based positioning to avoid hydration mismatch
          const left = (i * 17 + 23) % 100
          const top = (i * 13 + 31) % 100
          const delay = (i * 0.3) % 2
          const duration = 2 + (i % 3)
          const emojiIndex = i % 6
          const emojis = ['🎉', '🎊', '⭐', '💎', '🎈', '✨']
          
          return (
            <div
              key={i}
              className="absolute animate-bounce text-sm sm:text-base md:text-xl lg:text-2xl"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            >
              {emojis[emojiIndex]}
            </div>
          )
        })}
      </div>
      
      <main className="flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 min-h-screen">
        <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-2xl border-2 md:border-4 border-yellow-300">
            <CardHeader className="text-center py-3 md:py-6 bg-gradient-to-r from-blue-100 to-orange-100">
              <div className="flex justify-center mb-4 md:mb-6 relative">
                {winner === 0 ? (
                  <div className="relative">
                    <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl animate-pulse">
                      💎
                    </div>
                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 animate-spin">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-400" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl animate-bounce">
                      💎
                    </div>
                    <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 animate-ping">
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-6 lg:w-6 text-yellow-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 animate-ping" style={{animationDelay: '0.5s'}}>
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-6 lg:w-6 text-blue-400" />
                    </div>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-blue-600">
                {t("game_over")} 🎊
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 md:space-y-4 p-3 md:p-4">
              {/* Winner Announcement */}
              <div className="text-center p-4 md:p-6 bg-gradient-to-r from-blue-100 to-blue-100 rounded-xl">
                {winner === 0 ? (
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold text-blue-600 animate-pulse">
                      🤝 {t("tie")}! 🤝
                    </h2>
                    <p className="text-sm md:text-lg text-gray-600 mt-2">Amazing teamwork! 🌟</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-semibold mb-2 text-blue-600">
                      🎉 {t("winner")} 🎉
                    </h2>
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-blue-600 animate-bounce break-words">
                      💎 {winnerName} 💎
                    </h1>
                    <p className="text-sm md:text-lg text-gray-600 mt-2">Congratulations! Outstanding performance! ⭐</p>
                  </div>
                )}
              </div>

              {/* Final Scores */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-center">{t("final_score")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`text-center p-4 md:p-6 rounded-lg transform transition-all ${
                      winner === 1 
                        ? "bg-gradient-to-br from-green-100 to-blue-100 ring-2 md:ring-4 ring-blue-400 md:scale-105 shadow-lg" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    }`}
                  >
                    <h4 className="text-base md:text-lg font-semibold break-words">{team1Name}</h4>
                    <Badge variant="outline" className={`text-lg md:text-2xl font-bold mt-2 ${
                      winner === 1 ? 'bg-green-200 text-blue-800' : ''
                    }`}>
                      {team1Score} 🎯
                    </Badge>
                    {winner === 1 && (
                      <div className="mt-2">
                        <div className="text-2xl md:text-3xl mx-auto animate-bounce">💎</div>
                        <p className="text-xs md:text-sm text-blue-600 font-bold mt-1">🎉 CHAMPION! 🎉</p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-center p-4 md:p-6 rounded-lg transform transition-all ${
                      winner === 2 
                        ? "bg-gradient-to-br from-bue-100 to-blue-100 ring-2 md:ring-4 ring-blue-400 md:scale-105 shadow-lg" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    }`}
                  >
                    <h4 className="text-base md:text-lg font-semibold break-words">{team2Name}</h4>
                    <Badge variant="outline" className={`text-lg md:text-2xl font-bold mt-2 ${
                      winner === 2 ? 'bg-blue-200 text-blue-800' : ''
                    }`}>
                      {team2Score} 🎯
                    </Badge>
                    {winner === 2 && (
                      <div className="mt-2">
                        <div className="text-2xl md:text-3xl mx-auto animate-bounce">💎</div>
                        <p className="text-xs md:text-sm text-blue-600 font-bold mt-1">🎉 CHAMPION! 🎉</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center pt-4 md:pt-6">
                <Button
                  onClick={handlePlayAgain}
                  className="px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white rounded-xl font-bold text-base md:text-lg shadow-lg transform hover:scale-105 transition-all w-full md:w-auto"
                >
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  🎮 {t("play_again")} 🎮
                </Button>
                <p className="text-xs md:text-sm text-gray-500 mt-3">Ready for another epic battle? ⚔️</p>
              </div>
            </CardContent>
          </Card>
        </main>
    </div>
  )
}
