import { processQuery } from '@/lib/utils/queryProcessor'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { question } = await request.json()

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const searchTerms = await processQuery(question)
    
    return NextResponse.json({ searchTerms })
  } catch (error) {
    // console.error('Question processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    )
  }
}