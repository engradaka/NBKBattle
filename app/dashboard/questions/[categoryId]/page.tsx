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
  points: number
  question_type: 'text' | 'video' | 'image' | 'audio'
  media_url?: string
  media_duration?: number
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
    points: 200,
    question_type: 'text' as 'text' | 'video' | 'image' | 'audio',
    media_url: "",
    media_duration: 5,
  })
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>("")
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
      .from("questions")
      .select("*")
      .eq("category_id", categoryId)
      .order("points")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let mediaUrl = formData.media_url

    // Upload media if selected
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

    const questionData = {
      ...formData,
      category_id: categoryId,
      media_url: mediaUrl,
    }

    if (editingQuestion) {
      // Update existing question
      const { error } = await supabase.from("questions").update(questionData).eq("id", editingQuestion.id)

      if (error) {
        console.error("Error updating question:", error)
        return
      }
    } else {
      // Create new question
      const { error } = await supabase.from("questions").insert([questionData])

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
      points: 200,
      question_type: 'text',
      media_url: "",
      media_duration: 5,
    })
    setSelectedMedia(null)
    setMediaPreview("")
    fetchQuestions()
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question_ar: question.question_ar,
      question_en: question.question_en,
      answer_ar: question.answer_ar,
      answer_en: question.answer_en,
      points: question.points,
      question_type: question.question_type || 'text',
      media_url: question.media_url || "",
      media_duration: question.media_duration || 5,
    })
    setSelectedMedia(null)
    setMediaPreview("")
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      const { error } = await supabase.from("questions").delete().eq("id", id)

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
      points: 200,
      question_type: 'text',
      media_url: "",
      media_duration: 5,
    })
    setSelectedMedia(null)
    setMediaPreview("")
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

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  if (!category) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getCategoryName(category)} Questions</h1>
              <p className="text-gray-600 mt-1">
                Manage questions for the {getCategoryName(category)} category • {questions.length} questions •{" "}
                {totalPoints} total points
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                  <DialogDescription>
                    {editingQuestion ? "Edit the question details below" : "Create a new quiz question with text, image, video, or audio content"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question_type">Question Type</Label>
                    <Select
                      value={formData.question_type}
                      onValueChange={(value: 'text' | 'video' | 'image' | 'audio') => setFormData({ ...formData, question_type: value })}
                    >
                      <SelectTrigger>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question_ar">Arabic Question</Label>
                      <Textarea
                        id="question_ar"
                        value={formData.question_ar}
                        onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                        placeholder="Enter question in Arabic"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="question_en">English Question</Label>
                      <Textarea
                        id="question_en"
                        value={formData.question_en}
                        onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                        placeholder="Enter question in English"
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="answer_ar">Arabic Answer</Label>
                      <Textarea
                        id="answer_ar"
                        value={formData.answer_ar}
                        onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                        placeholder="Enter answer in Arabic"
                        rows={2}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="answer_en">English Answer</Label>
                      <Textarea
                        id="answer_en"
                        value={formData.answer_en}
                        onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                        placeholder="Enter answer in English"
                        rows={2}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Select
                      value={formData.points.toString()}
                      onValueChange={(value: string) => setFormData({ ...formData, points: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="200">200 Points</SelectItem>
                        <SelectItem value="400">400 Points</SelectItem>
                        <SelectItem value="600">600 Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingQuestion ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Questions Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
          <div className="text-right">
            <span className="text-lg font-bold">Total Points: {totalPoints}</span>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <Badge variant="outline" className="text-sm">
                      {question.points} pts
                    </Badge>
                    <Badge variant={question.question_type === 'text' ? 'secondary' : 'default'} className="text-sm">
                      {question.question_type === 'text' && <FileText className="w-3 h-3 mr-1" />}
                      {question.question_type === 'video' && <Video className="w-3 h-3 mr-1" />}
                      {question.question_type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                      {question.question_type === 'audio' && <Music className="w-3 h-3 mr-1" />}
                      {question.question_type || 'text'}
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                      Column {(index % 2) + 1}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Added {new Date(question.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 
                      className="font-medium text-gray-900"
                      dir={getTextDirection(getQuestionText(question))}
                      style={{ textAlign: getTextDirection(getQuestionText(question)) === 'rtl' ? 'right' : 'left' }}
                    >
                      {getQuestionText(question)}
                    </h3>
                  </div>
                  {question.media_url && question.question_type === 'image' && (
                    <div className="w-24 h-24">
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
                    <div className="text-sm text-blue-600">
                      Media attached • {question.media_duration || 5}s duration
                    </div>
                  )}
                  <div 
                    dir={getTextDirection(getAnswerText(question))}
                    style={{ textAlign: getTextDirection(getAnswerText(question)) === 'rtl' ? 'right' : 'left' }}
                  >
                    <span className="text-sm text-green-600 font-medium">Answer: </span>
                    <span className="text-sm text-green-700">{getAnswerText(question)}</span>
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
