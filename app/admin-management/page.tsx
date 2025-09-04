"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, X, Clock, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { checkAdminRole, getAdminRequests, approveAdminRequest, rejectAdminRequest, type AdminRequest } from "@/lib/admin-utils"

export default function AdminManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

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
      loadRequests()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadRequests = async () => {
    const { data, error } = await getAdminRequests()
    if (error) {
      console.error('Failed to load requests:', error)
    } else {
      setRequests(data || [])
    }
  }

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId)
    const { error } = await approveAdminRequest(requestId, user.email)
    
    if (error) {
      alert('Failed to approve request: ' + error.message)
    } else {
      alert('Admin request approved successfully!')
      loadRequests()
    }
    setProcessing(null)
  }

  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    const { error } = await rejectAdminRequest(requestId, user.email)
    
    if (error) {
      alert('Failed to reject request: ' + error.message)
    } else {
      alert('Admin request rejected.')
      loadRequests()
    }
    setProcessing(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300"><Check className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300"><X className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Management</h1>
              <p className="text-gray-600">Approve or reject admin access requests</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-gray-600">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Check className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                  <p className="text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <X className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                  <p className="text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Admin Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No admin requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.full_name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-gray-600 mb-2">{request.email}</p>
                        {request.message && (
                          <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg mb-3">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.reviewed_at && (
                          <p className="text-xs text-gray-500">
                            Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(request.id)}
                            disabled={processing === request.id}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 px-4 py-2"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
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