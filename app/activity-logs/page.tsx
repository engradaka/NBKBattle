"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Activity, Plus, Edit, Trash2, User, Calendar, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { checkAdminRole, getActivityLogs, type ActivityLog } from "@/lib/admin-utils"

export default function ActivityLogsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterResource, setFilterResource] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filterAction, filterResource])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session?.user) {
        router.push("/login")
        return
      }

      // Check if user is master admin
      const { isAdmin, role } = await checkAdminRole(session.user.email || '')
      
      if (!isAdmin || role !== 'master_admin') {
        alert('Access denied. Master admin privileges required.')
        router.push('/dashboard')
        return
      }

      setUser(session.user)
      loadActivityLogs()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLogs = async () => {
    const { data, error } = await getActivityLogs(100) // Get last 100 activities
    if (error) {
      console.error('Failed to load activity logs:', error)
    } else {
      setLogs(data || [])
    }
  }

  const applyFilters = () => {
    let filtered = logs

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction)
    }

    if (filterResource !== 'all') {
      filtered = filtered.filter(log => log.resource_type === filterResource)
    }

    setFilteredLogs(filtered)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><Plus className="w-3 h-3 mr-1" />Created</Badge>
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><Edit className="w-3 h-3 mr-1" />Updated</Badge>
      case 'delete':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><Trash2 className="w-3 h-3 mr-1" />Deleted</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const getResourceBadge = (resourceType: string) => {
    switch (resourceType) {
      case 'category':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">Category</Badge>
      case 'question':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Question</Badge>
      default:
        return <Badge variant="outline">{resourceType}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/master-dashboard')}
              variant="outline"
              className="px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Master Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-gray-600">Track all admin actions and changes</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                  <p className="text-gray-600">Total Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plus className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {logs.filter(log => log.action === 'create').length}
                  </p>
                  <p className="text-gray-600">Created</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {logs.filter(log => log.action === 'update').length}
                  </p>
                  <p className="text-gray-600">Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trash2 className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {logs.filter(log => log.action === 'delete').length}
                  </p>
                  <p className="text-gray-600">Deleted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Action</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Created</SelectItem>
                    <SelectItem value="update">Updated</SelectItem>
                    <SelectItem value="delete">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Resource Type</label>
                <Select value={filterResource} onValueChange={setFilterResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    <SelectItem value="category">Categories</SelectItem>
                    <SelectItem value="question">Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activities ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activity logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getActionBadge(log.action)}
                          {getResourceBadge(log.resource_type)}
                          <span className="text-sm text-gray-500 flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {log.admin_email}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {log.resource_name}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {log.action === 'create' && `Created new ${log.resource_type}`}
                          {log.action === 'update' && `Updated ${log.resource_type}`}
                          {log.action === 'delete' && `Deleted ${log.resource_type}`}
                        </p>
                        
                        {log.details && (
                          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-2">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}