"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, RotateCcw } from "lucide-react"
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
    <div className="flex min-h-screen bg-white">
      <SidebarProvider>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 md:ml-16">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center py-8">
              <div className="flex justify-center mb-6">
                {winner === 0 ? (
                  <Medal className="h-16 w-16 text-yellow-500" />
                ) : (
                  <Trophy className="h-16 w-16 text-yellow-500" />
                )}
              </div>
              <CardTitle className="text-3xl font-bold">{t("game_over")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Winner Announcement */}
              <div className="text-center">
                {winner === 0 ? (
                  <h2 className="text-2xl font-bold text-yellow-600">{t("tie")}!🤝</h2>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{t("winner")}</h2>
                    <h1 className="text-3xl font-bold text-green-600">{winnerName}!</h1>
                  </div>
                )}
              </div>

              {/* Final Scores */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">{t("final_score")}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`text-center p-6 rounded-lg ${
                      winner === 1 ? "bg-green-100 dark:bg-green-900 ring-2 ring-green-500" : "bg-muted"
                    }`}
                  >
                    <h4 className="text-lg font-semibold">{team1Name}</h4>
                    <Badge variant="outline" className="text-2xl font-bold mt-2">
                      {team1Score}
                    </Badge>
                    {winner === 1 && <Trophy className="h-6 w-6 text-yellow-500 mx-auto mt-2" />}
                  </div>

                  <div
                    className={`text-center p-6 rounded-lg ${
                      winner === 2 ? "bg-green-100 dark:bg-green-900 ring-2 ring-green-500" : "bg-muted"
                    }`}
                  >
                    <h4 className="text-lg font-semibold">{team2Name}</h4>
                    <Badge variant="outline" className="text-2xl font-bold mt-2">
                      {team2Score}
                    </Badge>
                    {winner === 2 && <Trophy className="h-6 w-6 text-yellow-500 mx-auto mt-2" />}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center pt-4">
                <Button
                  onClick={handlePlayAgain}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("play_again")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarProvider>
    </div>
  )
}
