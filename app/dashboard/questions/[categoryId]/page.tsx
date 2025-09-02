"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, Plus, Edit, Trash2, Video, Image as ImageIcon, Music, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface Category {
  id: string
  name_ar: string
  name_en: string
  image_url: string | null
  description_en?: string
  description_ar?: string
}

interface Question {
  id: string
  category_id: string
  question_ar: string
  question_en: string
  answer_ar: string
  answer_en: string
  diamonds: number
  question_type: 'text' | 'video' | 'image' | 'audio'
  media_url?: string
  media_duration?: number
  answer_type: 'text' | 'video' | 'image' | 'audio'
  answer_media_url?: string
  answer_media_duration?: number
  created_at: string
}

export default function CategoryQuestionsPage() {
  const [category, setCategory] = useState<Category | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    question_ar: "",
    question_en: "",
    answer_ar: "",
    answer_en: "",
    diamonds: 10,
    question_type: 'text' as 'text' | 'video' | 'image' | 'audio',
    media_url: "",
    media_duration: 5,
    answer_type: 'text' as 'text' | 'video' | 'image' | 'audio',
    answer_media_url: "",
    answer_media_duration: 5,
  })
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>("")
  const [selectedAnswerMedia, setSelectedAnswerMedia] = useState<File | null>(null)
  const [answerMediaPreview, setAnswerMediaPreview] = useState<string>("")
  const router = useRouter()
  const params = useParams()
  const { language } = useLanguage()
  const categoryId = params.categoryId as string

  useEffect(() => {
    if (categoryId) {
      fetchCategory()
      fetchQuestions()
    }
  }, [categoryId])

  const fetchCategory = async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("id", categoryId).single()

    if (error) {
      console.error("Error fetching category:", error)
      router.push("/dashboard")
    } else {
      setCategory(data)
    }
  }

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("diamond_questions")
      .select("*")
      .eq("category_id", categoryId)
      .order("diamonds", { ascending: false })
      .order("created_at")

    if (error) {
      console.error("Error fetching questions:", error)
    } else {
      setQuestions(data || [])
    }
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedMedia(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnswerMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedAnswerMedia(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAnswerMediaPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let mediaUrl = formData.media_url
    let answerMediaUrl = formData.answer_media_url

    // Upload question media if selected
    if (selectedMedia && formData.question_type !== 'text') {
      const fileExt = selectedMedia.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `question-media/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, selectedMedia)

      if (uploadError) {
        console.error("Error uploading media:", uploadError)
        alert(`Error uploading media: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath)
      mediaUrl = publicUrl
    }

    // Upload answer media if selected
    if (selectedAnswerMedia && formData.answer_type !== 'text') {
      const fileExt = selectedAnswerMedia.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `answer-media/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, selectedAnswerMedia)

      if (uploadError) {
        console.error("Error uploading answer media:", uploadError)
        alert(`Error uploading answer media: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath)
      answerMediaUrl = publicUrl
    }

    const questionData = {
      ...formData,
      category_id: categoryId,
      media_url: mediaUrl,
      answer_media_url: answerMediaUrl,
    }

    if (editingQuestion) {
      // Update existing question
      const { error } = await supabase.from("diamond_questions").update(questionData).eq("id", editingQuestion.id)

      if (error) {
        console.error("Error updating question:", error)
        return
      }
    } else {
      // Create new question
      const { error } = await supabase.from("diamond_questions").insert([questionData])

      if (error) {
        console.error("Error creating question:", error)
        return
      }
    }

    setIsDialogOpen(false)
    setEditingQuestion(null)
    setFormData({
      question_ar: "",
      question_en: "",
      answer_ar: "",
      answer_en: "",
      diamonds: 10,
      question_type: 'text',
      media_url: "",
      media_duration: 5,
      answer_type: 'text',
      answer_media_url: "",
      answer_media_duration: 5,
    })
    setSelectedMedia(null)
    setMediaPreview("")
    setSelectedAnswerMedia(null)
    setAnswerMediaPreview("")
    fetchQuestions()
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question_ar: question.question_ar,
      question_en: question.question_en,
      answer_ar: question.answer_ar,
      answer_en: question.answer_en,
      diamonds: question.diamonds,
      question_type: question.question_type || 'text',
      media_url: question.media_url || "",
      media_duration: question.media_duration || 5,
      answer_type: question.answer_type || 'text',
      answer_media_url: question.answer_media_url || "",
      answer_media_duration: question.answer_media_duration || 5,
    })
    setSelectedMedia(null)
    setMediaPreview("")
    setSelectedAnswerMedia(null)
    setAnswerMediaPreview("")
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      const { error } = await supabase.from("diamond_questions").delete().eq("id", id)

      if (error) {
        console.error("Error deleting question:", error)
      } else {
        fetchQuestions()
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingQuestion(null)
    setFormData({
      question_ar: "",
      question_en: "",
      answer_ar: "",
      answer_en: "",
      diamonds: 10,
      question_type: 'text',
      media_url: "",
      media_duration: 5,
      answer_type: 'text',
      answer_media_url: "",
      answer_media_duration: 5,
    })
    setSelectedMedia(null)
    setMediaPreview("")
    setSelectedAnswerMedia(null)
    setAnswerMediaPreview("")
  }

  const getCategoryName = (category: Category) => {
    return language === "ar" ? category.name_ar : category.name_en
  }

  const getQuestionText = (question: Question) => {
    return language === "ar" ? question.question_ar : question.question_en
  }

  const getAnswerText = (question: Question) => {
    return language === "ar" ? question.answer_ar : question.answer_en
  }

  // Helper function to detect if text contains Arabic characters
  const isArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRegex.test(text)
  }

  // Get text direction based on content
  const getTextDirection = (text: string) => {
    return isArabicText(text) ? 'rtl' : 'ltr'
  }

  const totalDiamonds = questions.reduce((sum, q) => sum + q.diamonds, 0)

  if (!category) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{getCategoryName(category)} Questions</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                <span className="block sm:inline">Manage questions for {getCategoryName(category)}</span>
                <span className="block sm:inline"> • {questions.length} questions • 💎 {totalDiamonds} diamonds</span>
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                  <DialogDescription>
                    {editingQuestion ? "Edit the question details below" : "Create a new quiz question with text, image, video, or audio content"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question_type" className="text-sm font-medium">Question Type</Label>
                    <Select
                      value={formData.question_type}
                      onValueChange={(value: 'text' | 'video' | 'image' | 'audio') => setFormData({ ...formData, question_type: value })}
                    >
                      <SelectTrigger id="question_type" className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Text Question
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Video Question
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Image Question
                          </div>
                        </SelectItem>
                        <SelectItem value="audio">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Audio/Lyrics Question
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.question_type !== 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="media_file">
                        {formData.question_type === 'video' && 'Video File'}
                        {formData.question_type === 'image' && 'Image File'}
                        {formData.question_type === 'audio' && 'Audio File'}
                      </Label>
                      <Input
                        id="media_file"
                        type="file"
                        accept={
                          formData.question_type === 'video' ? 'video/*' :
                          formData.question_type === 'image' ? 'image/*' :
                          'audio/*'
                        }
                        onChange={handleMediaChange}
                      />
                      {(formData.question_type === 'video' || formData.question_type === 'audio') && (
                        <div className="space-y-2">
                          <Label htmlFor="media_duration">Duration (seconds)</Label>
                          <Input
                            id="media_duration"
                            type="number"
                            min="1"
                            max="30"
                            value={formData.media_duration}
                            onChange={(e) => setFormData({ ...formData, media_duration: parseInt(e.target.value) })}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question_ar" className="text-sm font-medium">Arabic Question</Label>
                      <Textarea
                        id="question_ar"
                        value={formData.question_ar}
                        onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                        placeholder="Enter question in Arabic"
                        rows={2}
                        className="text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="question_en" className="text-sm font-medium">English Question</Label>
                      <Textarea
                        id="question_en"
                        value={formData.question_en}
                        onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                        placeholder="Enter question in English"
                        rows={2}
                        className="text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="answer_ar" className="text-sm font-medium">Arabic Answer</Label>
                      <Textarea
                        id="answer_ar"
                        value={formData.answer_ar}
                        onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                        placeholder="Enter answer in Arabic"
                        rows={2}
                        className="text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="answer_en" className="text-sm font-medium">English Answer</Label>
                      <Textarea
                        id="answer_en"
                        value={formData.answer_en}
                        onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                        placeholder="Enter answer in English"
                        rows={2}
                        className="text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="answer_type">Answer Type</Label>
                    <Select
                      value={formData.answer_type}
                      onValueChange={(value: 'text' | 'video' | 'image' | 'audio') => setFormData({ ...formData, answer_type: value })}
                    >
                      <SelectTrigger id="answer_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Text Answer
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Video Answer
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Image Answer
                          </div>
                        </SelectItem>
                        <SelectItem value="audio">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Audio Answer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.answer_type !== 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="answer_media_file">
                        {formData.answer_type === 'video' && 'Answer Video File'}
                        {formData.answer_type === 'image' && 'Answer Image File'}
                        {formData.answer_type === 'audio' && 'Answer Audio File'}
                      </Label>
                      <Input
                        id="answer_media_file"
                        type="file"
                        accept={
                          formData.answer_type === 'video' ? 'video/*' :
                          formData.answer_type === 'image' ? 'image/*' :
                          'audio/*'
                        }
                        onChange={handleAnswerMediaChange}
                      />
                      {(formData.answer_type === 'video' || formData.answer_type === 'audio') && (
                        <div className="space-y-2">
                          <Label htmlFor="answer_media_duration">Answer Duration (seconds)</Label>
                          <Input
                            id="answer_media_duration"
                            type="number"
                            min="1"
                            max="60"
                            value={formData.answer_media_duration}
                            onChange={(e) => setFormData({ ...formData, answer_media_duration: parseInt(e.target.value) })}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="diamonds">Diamond Value</Label>
                    <Select
                      value={formData.diamonds.toString()}
                      onValueChange={(value: string) => setFormData({ ...formData, diamonds: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="diamonds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">💎 10 Diamonds</SelectItem>
                        <SelectItem value="25">💎 25 Diamonds</SelectItem>
                        <SelectItem value="50">💎 50 Diamonds</SelectItem>
                        <SelectItem value="75">💎 75 Diamonds</SelectItem>
                        <SelectItem value="100">💎 100 Diamonds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-sm">
                      {editingQuestion ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Questions Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Questions ({questions.length})</h2>
          <div className="text-left sm:text-right">
            <span className="text-sm sm:text-base md:text-lg font-bold">Total: 💎 {totalDiamonds}</span>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="overflow-hidden">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-3 sm:mb-4">
                  <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      💎 {question.diamonds}
                    </Badge>
                    <Badge variant={question.question_type === 'text' ? 'secondary' : 'default'} className="text-xs sm:text-sm">
                      {question.question_type === 'text' && <FileText className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />}
                      {question.question_type === 'video' && <Video className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />}
                      {question.question_type === 'image' && <ImageIcon className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />}
                      {question.question_type === 'audio' && <Music className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />}
                      <span className="hidden sm:inline">{question.question_type || 'text'}</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs sm:text-sm hidden md:inline-flex">
                      Level {question.diamonds === 10 ? '1' : question.diamonds === 25 ? '2' : question.diamonds === 50 ? '3' : question.diamonds === 75 ? '4' : '5'}
                    </Badge>
                    <span className="text-xs sm:text-sm text-gray-500 hidden lg:inline">
                      Added {new Date(question.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1 sm:gap-2 self-end sm:self-start">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(question)} className="text-xs sm:text-sm px-2 sm:px-3">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Edit</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(question.id)} className="text-xs sm:text-sm px-2 sm:px-3">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 
                      className="text-sm sm:text-base font-medium text-gray-900 break-words"
                      dir={getTextDirection(getQuestionText(question))}
                      style={{ textAlign: getTextDirection(getQuestionText(question)) === 'rtl' ? 'right' : 'left' }}
                    >
                      {getQuestionText(question)}
                    </h3>
                  </div>
                  {question.media_url && question.question_type === 'image' && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                      <Image
                        src={question.media_url}
                        alt="Question media"
                        width={96}
                        height={96}
                        className="rounded object-cover w-full h-full"
                      />
                    </div>
                  )}
                  {question.media_url && (question.question_type === 'video' || question.question_type === 'audio') && (
                    <div className="text-xs sm:text-sm text-blue-600">
                      Media attached • {question.media_duration || 5}s duration
                    </div>
                  )}
                  <div 
                    dir={getTextDirection(getAnswerText(question))}
                    style={{ textAlign: getTextDirection(getAnswerText(question)) === 'rtl' ? 'right' : 'left' }}
                  >
                    <span className="text-xs sm:text-sm text-green-600 font-medium">Answer: </span>
                    <span className="text-xs sm:text-sm text-green-700 break-words">{getAnswerText(question)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600 mb-4">Create your first question for this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}