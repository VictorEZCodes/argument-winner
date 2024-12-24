import { supabase } from './supabase'

export async function getRecentStudies() {
  const { data, error } = await supabase
    .from('studies')
    .select('*')
    .limit(10)
  
  if (error) {
    console.error('Error fetching studies:', error)
    return []
  }
  
  return data
}