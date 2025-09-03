"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { v4 as uuidv4 } from 'uuid';

import { useLanguage } from "@/lib/language-context"
import {
  Settings,
  ExternalLink,
  LogOut,
  BookOpen,
  HelpCircle,
  Trophy,
  Plus,
  Edit,
  Trash2,
  ImageIcon,
  Search,
  X,
} from "lucide-react"
import Image from "next/image"


interface Category {
  id: string
  name_ar: string
  name_en: string
  image_url: string | null
  created_at: string
  question_count?: number
  total_points?: number
  description_ar?: string
  description_en?: string
}

interface Stats {
  totalCategories: number
  totalQuestions: number
  totalPoints: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCategories: 0,
    totalQuestions: 0,
    totalPoints: 0,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    image_url: "",
  })
  const router = useRouter()
  const { language } = useLanguage()

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        router.push('/login')
      } else if (session?.user) {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchCategoriesWithStats()
    }
  }, [user])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
        setSearchQuery("")
        setSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth error:', error)
        router.push("/login")
        return
      }
      
      if (!session?.user) {
        router.push("/login")
      } else {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoriesWithStats = async () => {
    // Fetch categories with diamond question counts and total diamonds
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select(`
        *,
        diamond_questions (
          diamonds
        )
      `)
      .order("created_at", { ascending: false })

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
      return
    }

    // Process categories to add question counts and total diamonds
    const processedCategories =
      categoriesData?.map((category: any) => ({
        ...category,
        question_count: category.diamond_questions?.length || 0,
        total_points: category.diamond_questions?.reduce((sum: number, q: any) => sum + q.diamonds, 0) || 0,
      })) || []

    setCategories(processedCategories)

    // Calculate overall stats
    const totalCategories = processedCategories.length
    const totalQuestions = processedCategories.reduce((sum, cat) => sum + (cat.question_count || 0), 0)
    const totalPoints = processedCategories.reduce((sum, cat) => sum + (cat.total_points || 0), 0)

    setStats({
      totalCategories,
      totalQuestions,
      totalPoints,
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleViewQuiz = () => {
    router.push("/")
  }

  const handleViewQuestions = (categoryId: string) => {
    router.push(`/dashboard/questions/${categoryId}`)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imageUrl = formData.image_url

    // Upload image if selected
    if (selectedImage) {
      const fileExt = selectedImage.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `category-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, selectedImage)

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        alert(`Error uploading image: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath)
      imageUrl = publicUrl
    }

    const categoryData = {
      name_ar: formData.name_ar,
      name_en: formData.name_en,
      description_ar: formData.description_ar,
      description_en: formData.description_en,
      image_url: imageUrl,
    }

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id)

      if (error) {
        console.error("Error updating category:", error)
        return
      }
    } else {
      // Create new category
      const { error } = await supabase.from("categories").insert([categoryData])

      if (error) {
        console.error("Error creating category:", error)
        return
      }
    }

    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name_ar: "", name_en: "", description_ar: "", description_en: "", image_url: "" })
    setSelectedImage(null)
    setImagePreview("")
    fetchCategoriesWithStats()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      description_ar: category.description_ar || "",
      description_en: category.description_en || "",
      image_url: category.image_url || "",
    })
    setSelectedImage(null)
    setImagePreview("")
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all associated questions.")) {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) {
        console.error("Error deleting category:", error)
      } else {
        fetchCategoriesWithStats()
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name_ar: "", name_en: "", description_ar: "", description_en: "", image_url: "" })
    setSelectedImage(null)
    setImagePreview("")
  }

  const getCategoryName = (category: Category) => {
    return language === "ar" ? category.name_ar : category.name_en
  }

  // Search diamond questions across all categories
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const { data: questionsData, error } = await supabase
      .from("diamond_questions")
      .select(`
        *,
        categories!inner(
          name_ar,
          name_en
        )
      `)
      .or(`question_ar.ilike.%${query}%,question_en.ilike.%${query}%,answer_ar.ilike.%${query}%,answer_en.ilike.%${query}%`)
      .limit(10)

    if (!error && questionsData) {
      setSearchResults(questionsData)
      setShowSearchResults(true)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Quiz Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600">Manage categories, questions, and game settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={handleViewQuiz}
              variant="outline"
              className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent text-xs sm:text-sm"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              View Quiz
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Categories</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Diamonds</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">💎 {stats.totalPoints}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Category */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h2>
          
          {/* Global Question Search */}
          <div ref={searchRef} className="relative w-full sm:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions across all categories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((question: any) => (
                  <div key={question.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-blue-600 font-medium">
                        {language === 'ar' ? question.categories.name_ar : question.categories.name_en}
                      </span>
                      <span className="text-xs text-gray-500">💎 {question.diamonds}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Q: {language === 'ar' ? question.question_ar : question.question_en}
                    </p>
                    <p className="text-xs text-green-600">
                      A: {language === 'ar' ? question.answer_ar : question.answer_en}
                    </p>
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-4 text-center text-gray-500">
                    No questions found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setShowSearchResults(false)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Edit the category details below" : "Create a new quiz category with name, description and image"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">Arabic Name</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="Enter Arabic name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">English Name</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Enter English name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_ar">Arabic Description</Label>
                  <Input
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder="Enter Arabic description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_en">English Description</Label>
                  <Input
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Enter English description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_image">Category Image</Label>
                  <Input
                    id="category_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Question Count Badge */}
              <div className="bg-gray-100 px-4 py-2 text-center">
                <Badge variant="secondary" className="text-sm">
                  {category.question_count} questions
                </Badge>
              </div>

              <CardHeader className="pb-4">
                {/* Category Image */}
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  {category.image_url ? (
                    <Image
                      src={category.image_url || "/placeholder.svg"}
                      alt={getCategoryName(category)}
                      width={120}
                      height={120}
                      className="rounded-lg object-cover w-full h-full"
                      priority
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Category Info */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1">{getCategoryName(category)}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {language === "ar" 
                        ? (category.description_ar || "فئة مليئة بالأسئلة المثيرة والمعلومات المفيدة")
                        : (category.description_en || "Category full of exciting questions and useful information")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">💎 {category.total_points}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handleViewQuestions(category.id)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Questions
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleEdit(category)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-600 mb-4">Create your first category to get started with your quiz.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
