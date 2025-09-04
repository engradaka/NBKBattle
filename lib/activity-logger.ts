import { supabase } from './supabase'

export const logActivity = async (
  adminEmail: string,
  action: 'create' | 'update' | 'delete',
  resourceType: 'category' | 'question',
  resourceId: string,
  resourceName: string,
  details?: any
) => {
  try {
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
  } catch (err) {
    console.error('Activity logging error:', err)
  }
}