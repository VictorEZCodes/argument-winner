import { getRecentStudies } from '@/lib/db/studies'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const studies = await getRecentStudies()
    return NextResponse.json({ studies })
  } catch (error) {
    // console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch studies' }, { status: 500 })
  }
}