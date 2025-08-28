"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, RotateCcw, Star } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
      {/* Floating Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            {['🎉', '🎊', '⭐', '🏆', '🎈', '✨'][Math.floor(Math.random() * 6)]}
          </div>
        ))}
      </div>
      
      <SidebarProvider>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 md:ml-16 relative z-10">
          <Card className="w-full max-w-2xl shadow-2xl border-4 border-yellow-300">
            <CardHeader className="text-center py-8 bg-gradient-to-r from-yellow-100 to-orange-100">
              <div className="flex justify-center mb-6 relative">
                {winner === 0 ? (
                  <div className="relative">
                    <Medal className="h-20 w-20 text-yellow-500 animate-pulse" />
                    <div className="absolute -top-2 -right-2 animate-spin">
                      <Star className="h-8 w-8 text-yellow-400" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
                    <div className="absolute -top-4 -left-4 animate-ping">
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="absolute -top-4 -right-4 animate-ping" style={{animationDelay: '0.5s'}}>
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                )}
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t("game_over")} 🎊
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Winner Announcement */}
              <div className="text-center p-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl">
                {winner === 0 ? (
                  <div>
                    <h2 className="text-3xl font-bold text-yellow-600 animate-pulse">
                      🤝 {t("tie")}! 🤝
                    </h2>
                    <p className="text-lg text-gray-600 mt-2">Amazing teamwork! 🌟</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-semibold mb-2 text-purple-600">
                      🎉 {t("winner")} 🎉
                    </h2>
                    <h1 className="text-4xl font-bold text-green-600 animate-bounce">
                      🏆 {winnerName}! 🏆
                    </h1>
                    <p className="text-lg text-gray-600 mt-2">Congratulations! Outstanding performance! ⭐</p>
                  </div>
                )}
              </div>

              {/* Final Scores */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">{t("final_score")}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`text-center p-6 rounded-lg transform transition-all ${
                      winner === 1 
                        ? "bg-gradient-to-br from-green-100 to-yellow-100 ring-4 ring-green-400 scale-105 shadow-lg" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    }`}
                  >
                    <h4 className="text-lg font-semibold">{team1Name}</h4>
                    <Badge variant="outline" className={`text-2xl font-bold mt-2 ${
                      winner === 1 ? 'bg-green-200 text-green-800' : ''
                    }`}>
                      {team1Score} 🎯
                    </Badge>
                    {winner === 1 && (
                      <div className="mt-2">
                        <Trophy className="h-8 w-8 text-yellow-500 mx-auto animate-bounce" />
                        <p className="text-sm text-green-600 font-bold mt-1">🎉 CHAMPION! 🎉</p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-center p-6 rounded-lg transform transition-all ${
                      winner === 2 
                        ? "bg-gradient-to-br from-green-100 to-yellow-100 ring-4 ring-green-400 scale-105 shadow-lg" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    }`}
                  >
                    <h4 className="text-lg font-semibold">{team2Name}</h4>
                    <Badge variant="outline" className={`text-2xl font-bold mt-2 ${
                      winner === 2 ? 'bg-green-200 text-green-800' : ''
                    }`}>
                      {team2Score} 🎯
                    </Badge>
                    {winner === 2 && (
                      <div className="mt-2">
                        <Trophy className="h-8 w-8 text-yellow-500 mx-auto animate-bounce" />
                        <p className="text-sm text-green-600 font-bold mt-1">🎉 CHAMPION! 🎉</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center pt-6">
                <Button
                  onClick={handlePlayAgain}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  🎮 {t("play_again")} 🎮
                </Button>
                <p className="text-sm text-gray-500 mt-3">Ready for another epic battle? ⚔️</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarProvider>
    </div>
  )
}
