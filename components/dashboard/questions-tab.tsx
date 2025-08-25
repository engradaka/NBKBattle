"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"

interface Category {
  id: string
  name_ar: string
  name_en: string
}

interface Question {
  id: string
  category_id: string
  question_ar: string
  question_en: string
  answer_ar: string
  answer_en: string
  points: number
  created_at: string
  categories?: Category
}

interface QuestionsTabProps {
  onStatsUpdate: () => void
}

export function QuestionsTab({ onStatsUpdate }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    category_id: "",
    question_ar: "",
    question_en: "",
    answer_ar: "",
    answer_en: "",
    points: 200,
  })
  const { language } = useLanguage()

  useEffect(() => {
    fetchQuestions()
    fetchCategories()
  }, [])

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select(`
        *,
        categories (
          id,
          name_ar,
          name_en
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching questions:", error)
    } else {
      setQuestions(data || [])
      onStatsUpdate()
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id, name_ar, name_en").order("name_en")

    if (error) {
      console.error("Error fetching categories:", error)
    } else {
      setCategories(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingQuestion) {
      // Update existing question
      const { error } = await supabase.from("questions").update(formData).eq("id", editingQuestion.id)

      if (error) {
        console.error("Error updating question:", error)
        return
      }
    } else {
      // Create new question
      const { error } = await supabase.from("questions").insert([formData])

      if (error) {
        console.error("Error creating question:", error)
        return
      }
    }

    setIsDialogOpen(false)
    setEditingQuestion(null)
    setFormData({
      category_id: "",
      question_ar: "",
      question_en: "",
      answer_ar: "",
      answer_en: "",
      points: 200,
    })
    fetchQuestions()
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      category_id: question.category_id,
      question_ar: question.question_ar,
      question_en: question.question_en,
      answer_ar: question.answer_ar,
      answer_en: question.answer_en,
      points: question.points,
    })
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
      category_id: "",
      question_ar: "",
      question_en: "",
      answer_ar: "",
      answer_en: "",
      points: 200,
    })
  }

  const getCategoryName = (category: Category) => {
    return language === "ar" ? category.name_ar : category.name_en
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Questions Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            aria-describedby="question-dialog-description"
          >
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
            </DialogHeader>
            <div id="question-dialog-description" className="sr-only">
              {editingQuestion ? "Edit question form" : "Add new question form"}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {getCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  onValueChange={(value) => setFormData({ ...formData, points: Number.parseInt(value) })}
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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Question (AR)</TableHead>
              <TableHead>Question (EN)</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  {question.categories && <Badge variant="outline">{getCategoryName(question.categories)}</Badge>}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={question.question_ar}>
                    {question.question_ar}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={question.question_en}>
                    {question.question_en}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{question.points}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No questions found. Create your first question to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
