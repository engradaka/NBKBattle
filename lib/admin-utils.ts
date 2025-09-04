import { supabase } from './supabase'

export interface Admin {
  id: string
  email: string
  role: 'master_admin' | 'admin'
  status: 'active' | 'inactive'
  created_at: string
}

export interface AdminRequest {
  id: string
  email: string
  full_name: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface ActivityLog {
  id: string
  admin_email: string
  action: 'create' | 'update' | 'delete'
  resource_type: 'category' | 'question'
  resource_id: string
  resource_name: string
  details?: any
  created_at: string
}

// Check if user is admin and get role
export const checkAdminRole = async (email: string): Promise<{ isAdmin: boolean; role?: string }> => {
  const { data, error } = await supabase
    .from('admins')
    .select('role')
    .eq('email', email)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return { isAdmin: false }
  }

  return { isAdmin: true, role: data.role }
}

// Log admin activity
export const logActivity = async (
  adminEmail: string,
  action: 'create' | 'update' | 'delete',
  resourceType: 'category' | 'question',
  resourceId: string,
  resourceName: string,
  details?: any
) => {
  const { error } = await supabase
    .from('activity_logs')
    .insert([{
      admin_email: adminEmail,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      details
    }])

  if (error) {
    console.error('Failed to log activity:', error)
  }
}

// Get all admin requests (master admin only)
export const getAdminRequests = async () => {
  const { data, error } = await supabase
    .from('admin_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

// Approve admin request
export const approveAdminRequest = async (requestId: string, reviewerEmail: string) => {
  const { data: request, error: fetchError } = await supabase
    .from('admin_requests')
    .select('email')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { error: fetchError }
  }

  // Add to admins table
  const { error: adminError } = await supabase
    .from('admins')
    .insert([{
      email: request.email,
      role: 'admin',
      status: 'active'
    }])

  if (adminError) {
    return { error: adminError }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('admin_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerEmail
    })
    .eq('id', requestId)

  return { error: updateError }
}

// Reject admin request
export const rejectAdminRequest = async (requestId: string, reviewerEmail: string) => {
  const { error } = await supabase
    .from('admin_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerEmail
    })
    .eq('id', requestId)

  return { error }
}

// Get activity logs
export const getActivityLogs = async (limit = 50) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}