"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "ar" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const translations = {
  ar: {
    welcome: "NBK Battle ",
    start_challenge: "ابدأ التحدي",
    login: "تسجيل الدخول",
    language: "اللغة",
    description: "اختبر معلوماتك واستمتع بتجربة تحدي مثيرة",
    choose_team_names: "اختيار أسماء الفرق",
    team_setup_description: "أختيار الأسماء للفريقين ",
    team_one: "الفريق الأول",
    team_two: "الفريق الثاني",
    enter_team_one_name: "أدخل اسم الفريق الأول",
    enter_team_two_name: "أدخل اسم الفريق الثاني",
    back: "رجوع",
    next: "التالي",
    enter_both_team_names: "يرجى إدخال أسماء الفريقين",
    select_categories: "اختر الفئات",
    category_selection_description: "كل فريق يجب أن يختار 3 فئات بالضبط",
    current_turn: "الدور الحالي",
    select_categories_remaining: "اختر {count} فئات أخرى",
    ready_to_start: "جميع الفرق جاهزة! يمكنك بدء التحدي الآن",
    back_to_categories: " العودة للفئات",
    points: "نقطة",
    show_answer: "إظهار الإجابة",
    no_one: "لا أحد",
    finish_game: "إنهاء اللعبة",
    game_over: "انتهت اللعبة",
    winner: "الفائز",
    tie: "تعادل",
    final_score: "النتيجة النهائية",
    play_again: "العب مرة أخرى",
  },
  en: {
    welcome: "Welcome to NBK Battle",
    start_challenge: "Start Challenge",
    login: "Login",
    language: "Language",
    description: "Test your skills and enjoy an exciting challenge experience",
    choose_team_names: "Choose Team Names",
    team_setup_description: "Enter the names of the competing teams",
    team_one: "Team One",
    team_two: "Team Two",
    enter_team_one_name: "Enter team one name",
    enter_team_two_name: "Enter team two name",
    back: "Back",
    next: "Next",
    enter_both_team_names: "Please enter both team names",
    select_categories: "Select Categories",
    category_selection_description: "Each team must select exactly 3 categories",
    current_turn: "Current Turn",
    select_categories_remaining: "Select {count} more categories",
    category_description: "Category full of exciting questions",
    ready_to_start: "All teams ready! You can start the challenge now",
    back_to_categories: " Back to Categories",
    points: "Points",
    show_answer: "Show Answer",
    no_one: "No One",
    finish_game: "Finish Game",
    game_over: "Game Over",
    winner: "Winner",
    tie: "Tie",
    final_score: "Final Score",
    play_again: "Play Again",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[language][key as keyof (typeof translations)["ar"]] || key

    // Simple parameter replacement
    if (params) {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{${param}}`, params[param])
      })
    }

    return translation
  }

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
