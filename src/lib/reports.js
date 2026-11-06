import { supabase } from './supabase.js'

export const REPORT_REASONS = ['spam', 'harassment', 'fake_profile', 'no_show', 'payment_issue', 'other']

// status is not sent: the column defaults to 'open', and the RLS insert
// check refuses anything else.
export async function fileReport({ reporterId, reportedUserId, reportedBookingId, reason, details }) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId || null,
    reported_booking_id: reportedBookingId || null,
    reason,
    details: details.trim() || null,
  })
  if (error) throw error
}
