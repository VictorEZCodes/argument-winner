import { supabase } from '@/lib/db/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { searchTerm, page = 0 } = await request.json()
    const resultsPerPage = 10

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      )
    }

    // console.log('[Search API] Received search term:', searchTerm)

    // splitted search term into words and remove common words
    const searchWords = searchTerm
      .toLowerCase()
      .split(' ')
      .filter(word => !['what', 'is', 'the', 'a', 'an', 'and', 'or', 'but'].includes(word))
    
    // console.log('[Search API] Filtered search words:', searchWords)

    // build the search query with explicit field selection
    let query = supabase
      .from('studies')
      .select('id, title, abstract, authors, year, url, created_at', { count: 'exact' })

    // search conditions
    if (searchWords.length > 0) {
      const conditions = searchWords.map(word => (
        `title.ilike.%${word}%,abstract.ilike.%${word}%`
      )).join(',')

      query = query.or(conditions)
    }

    // get results with count
    const { data: results, count: totalResults, error: searchError } = await query
      .range(page * resultsPerPage, (page + 1) * resultsPerPage - 1)
      .order('created_at', { ascending: false })

    if (searchError) {
      // console.error('[Search API] Search error:', searchError)
      throw searchError
    }

    // console.log('[Search API] Total matching results:', totalResults)
    // console.log('[Search API] Results for page', page + 1, ':', results?.length || 0)
    
    if (results && results.length > 0) {
      // console.log('[Search API] First match:', {
      //   title: results[0].title,
      //   url: results[0].url,
      //   abstract: typeof results[0].abstract === 'string' 
      //     ? results[0].abstract.substring(0, 100) + '...'
      //     : JSON.stringify(results[0].abstract)
      // })
    }

    return NextResponse.json({
      studies: results || [],
      totalResults,
      currentPage: page,
      totalPages: Math.ceil(totalResults / resultsPerPage)
    })

  } catch (error) {
    // console.error('[Search API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search studies' },
      { status: 500 }
    )
  }
}