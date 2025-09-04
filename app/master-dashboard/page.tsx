"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import {
  Settings,
  ExternalLink,
  LogOut,
  Users,
  Activity,
  BookOpen,
  HelpCircle,
  Trophy,
  Shield,
  UserCheck,
  Clock,
  Upload,
  BarChart3,
  Download,
  Plus
} from "lucide-react"

export default function MasterDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalQuestions: 0,
    totalPoints: 0,
    pendingRequests: 0,
    totalAdmins: 0,
    recentActivities: 0
  })
  const router = useRouter()
  const { language } = useLanguage()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

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
      } else if (session.user.email !== 'engradaka@gmail.com') {
        // Not master admin, redirect to regular dashboard
        router.push("/dashboard")
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

  const fetchStats = async () => {
    try {
      // Get categories count
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
      
      // Get questions count and total points
      const { data: questions } = await supabase
        .from("diamond_questions")
        .select("diamonds")
      
      // Get admin requests count (if table exists)
      const { data: requests } = await supabase
        .from("admin_requests")
        .select("id")
        .eq("status", "pending")
      
      // Get admins count (if table exists)
      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("status", "active")
      
      // Get recent activities count (if table exists)
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalCategories: categories?.length || 0,
        totalQuestions: questions?.length || 0,
        totalPoints: questions?.reduce((sum, q) => sum + q.diamonds, 0) || 0,
        pendingRequests: requests?.length || 0,
        totalAdmins: admins?.length || 0,
        recentActivities: activities?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogout = async () => {
    // Update logout time and calculate session duration
    if (user?.email) {
      try {
        // Get the most recent login for this user
        const { data: recentLogin } = await supabase
          .from('login_logs')
          .select('id, login_time')
          .eq('admin_email', user.email)
          .is('logout_time', null)
          .order('login_time', { ascending: false })
          .limit(1)
          .single()

        if (recentLogin) {
          const logoutTime = new Date()
          const loginTime = new Date(recentLogin.login_time)
          const durationMinutes = Math.round((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60))

          await supabase
            .from('login_logs')
            .update({
              logout_time: logoutTime.toISOString(),
              session_duration: durationMinutes
            })
            .eq('id', recentLogin.id)
        }
      } catch (error) {
        console.log('Logout logging failed:', error)
      }
    }

    localStorage.clear()
    setUser(null)
    router.push("/")
  }

  const handleViewQuiz = () => {
    router.push("/")
  }

  const handleRegularDashboard = () => {
    router.push("/dashboard")
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
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Master Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600">System administration and user management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={handleRegularDashboard}
              variant="outline"
              className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent text-xs sm:text-sm"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Admin Panel
            </Button>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Master Admin! 👑
          </h2>
          <p className="text-gray-600">
            Manage your quiz system, approve admins, and monitor all activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
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

          <Card>
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

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Admins</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalAdmins}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Recent Activities</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.recentActivities}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-management')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Manage Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Approve or reject admin access requests</p>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                {stats.pendingRequests} pending
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/activity-logs')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Monitor all admin actions and changes</p>
              <Badge variant="outline" className="text-indigo-600 border-indigo-300">
                {stats.recentActivities} this week
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/bulk-import')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-green-600" />
                Bulk Import
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Upload multiple questions from CSV/Excel</p>
              <Badge variant="outline" className="text-green-600 border-green-300">
                Fast upload
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/game-analytics')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                Game Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View quiz performance and statistics</p>
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Insights
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/backup-export')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-teal-600" />
                Backup & Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Export and backup all your data</p>
              <Badge variant="outline" className="text-teal-600 border-teal-300">
                Secure
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/quick-add')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-600" />
                Quick Add
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quickly add questions to any category</p>
              <Badge variant="outline" className="text-green-600 border-green-300">
                Fast entry
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleRegularDashboard}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage categories and questions</p>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {stats.totalCategories} categories
              </Badge>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}