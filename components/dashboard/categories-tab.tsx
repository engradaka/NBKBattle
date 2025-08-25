"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

interface Category {
  id: string
  name_ar: string
  name_en: string
  image_url: string | null
  created_at: string
}

interface CategoriesTabProps {
  onStatsUpdate: () => void
}

export function CategoriesTab({ onStatsUpdate }: CategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    image_url: "",
  })
  const { t } = useLanguage()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching categories:", error)
    } else {
      setCategories(data || [])
      onStatsUpdate()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase.from("categories").update(formData).eq("id", editingCategory.id)

      if (error) {
        console.error("Error updating category:", error)
        return
      }
    } else {
      // Create new category
      const { error } = await supabase.from("categories").insert([formData])

      if (error) {
        console.error("Error creating category:", error)
        return
      }
    }

    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name_ar: "", name_en: "", image_url: "" })
    fetchCategories()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      image_url: category.image_url || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all associated questions.")) {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) {
        console.error("Error deleting category:", error)
      } else {
        fetchCategories()
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name_ar: "", name_en: "", image_url: "" })
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Categories Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="category-dialog-description">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            <div id="category-dialog-description" className="sr-only">
              {editingCategory ? "Edit category form" : "Add new category form"}
            </div>
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
                <Label htmlFor="image_url">Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Arabic Name</TableHead>
              <TableHead>English Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  {category.image_url ? (
                    <Image
                      src={category.image_url || "/placeholder.svg"}
                      alt={category.name_en}
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{category.name_ar}</TableCell>
                <TableCell>{category.name_en}</TableCell>
                <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No categories found. Create your first category to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
