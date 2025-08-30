"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { Users, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TeamSetupPage() {
  const [team1Name, setTeam1Name] = useState("")
  const [team2Name, setTeam2Name] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()

  const handleNext = async () => {
    if (team1Name.trim() && team2Name.trim()) {
      setIsLoading(true)

      // Store team names in localStorage
      localStorage.setItem("team1Name", team1Name.trim())
      localStorage.setItem("team2Name", team2Name.trim())

      // Show success toast
      toast({
        title: "Teams Created! 🎉",
        description: `${team1Name} vs ${team2Name} - Let's select categories!`,
        variant: "success",
      })

      // Simulate loading for better UX
      setTimeout(() => {
        router.push("/category-selection")
      }, 1000)
    }
  }

  const handleBack = () => {
    router.push("/")
  }

  const isFormValid = team1Name.trim() && team2Name.trim()

  return (
      <div className="h-screen">
      {/* Main Content */}
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl border-0 bg-white/80">
            <CardHeader className="text-center pb-6">
              {/* Teams Icon */}
              <div className="w-20 h-20 bg-gradient-to-r from-blue-800 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>

              <div>
                <CardTitle className="text-3x1 font-bold text-blue-900">{t("team_setup_description")}</CardTitle>
                
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Team 1 Input */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg hover:scale-110 transition-transform">
                    1
                  </div>
                  <label className="text-xl font-semibold text-gray-900">{t("team_one")}</label>
                  {team1Name.trim() && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <Input
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder={t("enter_team_one_name")}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300"
                />
              </div>

              {/* Team 2 Input */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg hover:scale-110 transition-transform">
                    2
                  </div>
                  <label className="text-xl font-semibold text-gray-900">{t("team_two")}</label>
                  {team2Name.trim() && (
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  )}
                </div>
                <Input
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder={t("enter_team_two_name")}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-green-600 focus:ring-green-500 rounded-xl transition-all duration-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <div className="flex-1">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="w-full h-14 border-2 border-gray-200 hover:bg-gray-50 bg-transparent rounded-xl text-lg hover:scale-105 transition-transform"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t("back")}
                  </Button>
                </div>

                <div className="flex-1">
                  <Button
                    onClick={handleNext}
                    disabled={!isFormValid || isLoading}
                    className="w-full h-14 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-lg transition-all duration-300 hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
                    ) : (
                      <>
                        {t("next")}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Validation Message */}
              {!isFormValid && (team1Name || team2Name) && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-800 font-medium">{t("enter_both_team_names")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}