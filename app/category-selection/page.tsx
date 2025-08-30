"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarProvider } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, Check, ArrowRight } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface Category {
  id: string
  name_ar: string
  name_en: string
  image_url: string | null
  icon: string
  description_en?: string
  description_ar?: string
}

export default function CategorySelectionPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [team1Categories, setTeam1Categories] = useState<string[]>([])
  const [team2Categories, setTeam2Categories] = useState<string[]>([])
  const [currentTeam, setCurrentTeam] = useState(1)
  const [team1Name, setTeam1Name] = useState("")
  const [team2Name, setTeam2Name] = useState("")
  const router = useRouter()
  const { language, t } = useLanguage()

  useEffect(() => {
    const t1Name = localStorage.getItem("team1Name") || "Team 1"
    const t2Name = localStorage.getItem("team2Name") || "Team 2"
    setTeam1Name(t1Name)
    setTeam2Name(t2Name)
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at")
    if (error) {
      console.error("Error fetching categories:", error)
    } else {
      setCategories(data || [])
    }
  }

  // Helper functions for current team
  const getCurrentTeamCategories = () => currentTeam === 1 ? team1Categories : team2Categories
  const setCurrentTeamCategories = (categories: string[]) => {
    if (currentTeam === 1) setTeam1Categories(categories)
    else setTeam2Categories(categories)
  }

  // Selection logic
  const handleCategorySelect = (categoryId: string) => {
    const currentCategories = getCurrentTeamCategories()
    const otherCategories = currentTeam === 1 ? team2Categories : team1Categories

    // Prevent picking categories chosen by the other team
    if (otherCategories.includes(categoryId)) return

    // Deselect if already picked
    if (currentCategories.includes(categoryId)) {
      setCurrentTeamCategories(currentCategories.filter((id) => id !== categoryId))
    } else if (currentCategories.length < 3) {
      setCurrentTeamCategories([...currentCategories, categoryId])
    }
  }

  // Button logic
  const handleNextTeam = () => {
    if (currentTeam === 1 && team1Categories.length === 3) {
      setCurrentTeam(2)
    }
  }

  const handleStartGame = () => {
    if (team1Categories.length === 3 && team2Categories.length === 3) {
      localStorage.setItem("team1Categories", JSON.stringify(team1Categories))
      localStorage.setItem("team2Categories", JSON.stringify(team2Categories))
      router.push("/game")
    }
  }

  // UI helpers
  const currentTeamName = currentTeam === 1 ? team1Name : team2Name
  const currentCategories = getCurrentTeamCategories()
  const isTeam1Complete = team1Categories.length === 3
  const isTeam2Complete = team2Categories.length === 3
  const allTeamsComplete = isTeam1Complete && isTeam2Complete
  const getCategoryName = (category: Category) => {
  return language === "ar" ? category.name_ar : category.name_en
}
  const handleBack = () => {
  router.push("/team-setup")
}
  return (
    <div className="flex min-h-screen bg-white">
      <SidebarProvider>
        <main className="flex-1 p-4 sm:p-8 md:ml-16">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="responsive-title font-bold text-gray-900 mb-4 sm:mb-6">{t("select_categories")}</h1>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isTeam1Complete ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                  <span className="font-semibold">{team1Name}</span>
                  <Badge variant="outline" className="bg-white">{team1Categories.length}/3</Badge>
                </div>
                <div className="hidden sm:block w-8 h-px bg-gray-300"></div>
                <div className="sm:hidden w-px h-4 bg-gray-300"></div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isTeam2Complete ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  <span className="font-semibold">{team2Name}</span>
                  <Badge variant="outline" className="bg-white">{team2Categories.length}/3</Badge>
                </div>
              </div>
              {!allTeamsComplete && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-blue-800 font-medium">
                    {language === "ar" ? (
                      <span dir="ltr">{currentTeamName}</span>
                    ) : (
                      <span>{t("current_turn")}: <span className="font-bold">{currentTeamName}</span></span>
                    )} {language === "ar" && ` :${t("current_turn")}`}
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    {t("select_categories_remaining", { count: 3 - currentCategories.length })}
                  </p>
                </div>
              )}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
{categories.map((category) => {
  const isSelectedByCurrentTeam = currentCategories.includes(category.id)
  const isSelectedByOtherTeam = currentTeam === 1
    ? team2Categories.includes(category.id)
    : team1Categories.includes(category.id)
  const isDisabled =
    isSelectedByOtherTeam ||
    allTeamsComplete ||
    (!isSelectedByCurrentTeam && currentCategories.length >= 3)

  // Allow clicking if:
  // - The category is already picked by the current team (for deselect)
  // - OR the current team has less than 3 picks and the category is not picked by the other team
  const canClick =
    isSelectedByCurrentTeam ||
    (!isSelectedByCurrentTeam && currentCategories.length < 3 && !isSelectedByOtherTeam && !allTeamsComplete)

  return (
    <Card
      key={category.id}
      className={`category-card cursor-pointer relative ${
        isSelectedByCurrentTeam
          ? "category-card-selected ring-4 ring-blue-500 shadow-lg"
          : isSelectedByOtherTeam
            ? "ring-2 ring-gray-400 opacity-60 pointer-events-none"
            : isDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:shadow-lg hover:scale-105"
      }`}
      onClick={() => canClick ? handleCategorySelect(category.id) : null}
    >
      {isSelectedByCurrentTeam && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
        </div>
      )}
      {/* Full-width image */}
      {category.image_url ? (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <Image
            src={category.image_url || "/placeholder.svg"}
            alt={getCategoryName(category)}
            width={300}
            height={192}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-t-lg">
          <span className="text-6xl">{category.icon}</span>
        </div>
      )}
      
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 text-center">
          {getCategoryName(category)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs sm:text-sm text-gray-600 text-center">
          {language === "ar" 
            ? (category.description_ar || "وصف هذه الفئة")
            : (category.description_en || "Category description")}
        </p>
      </CardContent>
    </Card>
  )
})}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 h-10 sm:h-12 border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent touch-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">{t("back")}</span>
              </Button>
              {currentTeam === 1 && isTeam1Complete && !isTeam2Complete && (
                <Button
                  onClick={handleNextTeam}
                  className="w-full sm:w-auto px-6 sm:px-8 h-10 sm:h-12 gradient-blue hover:opacity-90 transition-opacity rounded-xl font-semibold touch-button"
                >
                  <span className="text-sm sm:text-base">{team2Name} {t("next")}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {allTeamsComplete && (
                <Button
                  onClick={handleStartGame}
                  className="w-full sm:w-auto px-6 sm:px-8 h-10 sm:h-12 gradient-blue hover:opacity-90 transition-opacity rounded-xl font-semibold touch-button"
                >
                  <span className="text-sm sm:text-base">{t("start_challenge")}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Warning Message */}
            {!allTeamsComplete && currentCategories.length !== 3 && (
              <div className="mt-4 sm:mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center max-w-md mx-auto">
                <p className="text-orange-600 font-medium">
                  {currentTeamName} {t("select_categories")}
                </p>
              </div>
            )}
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}
