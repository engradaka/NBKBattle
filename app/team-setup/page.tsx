"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { Users, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              {/* Teams Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-r from-blue-800 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Users className="w-10 h-10 text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <CardTitle className="text-3x1 font-bold text-blue-900">{t("team_setup_description")}</CardTitle>
                
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Team 1 Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                  >
                    1
                  </motion.div>
                  <label className="text-xl font-semibold text-gray-900">{t("team_one")}</label>
                  <AnimatePresence>
                    {team1Name.trim() && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Input
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder={t("enter_team_one_name")}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300"
                />
              </motion.div>

              {/* Team 2 Input */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                  >
                    2
                  </motion.div>
                  <label className="text-xl font-semibold text-gray-900">{t("team_two")}</label>
                  <AnimatePresence>
                    {team2Name.trim() && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Input
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder={t("enter_team_two_name")}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-green-600 focus:ring-green-500 rounded-xl transition-all duration-300"
                />
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex gap-4 pt-6"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="w-full h-14 border-2 border-gray-200 hover:bg-gray-50 bg-transparent rounded-xl text-lg"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t("back")}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={handleNext}
                    disabled={!isFormValid || isLoading}
                    className="w-full h-14 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-lg transition-all duration-300"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <>
                        {t("next")}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Validation Message */}
              <AnimatePresence>
                {!isFormValid && (team1Name || team2Name) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center"
                  >
                    <p className="text-yellow-800 font-medium">{t("enter_both_team_names")}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
