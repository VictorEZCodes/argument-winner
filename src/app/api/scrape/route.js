import { NextResponse } from 'next/server'
import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { supabase } from '@/lib/db/supabase'
import pThrottle from 'p-throttle'
import { openai } from '@/lib/utils/openai'

// rate limiting to axios requests
const throttle = pThrottle({
  limit: 3,    
  interval: 1000  
})

const throttledGet = throttle(async (url) => {
  return axios.get(url)
})

async function fetchFromArxiv(searchTerm, start, maxResults = 10) {  
  const formattedSearch = searchTerm.replace(/\s+/g, '+')
  const url = `http://export.arxiv.org/api/query?search_query=all:${formattedSearch}&start=${start}&max_results=${maxResults}`
  
  // console.log('[Scrape API] Fetching from arXiv:', url)
  const response = await throttledGet(url)
  const parser = new XMLParser()
  const result = parser.parse(response.data)

  const totalResults = parseInt(result.feed['opensearch:totalResults'])
  // console.log('[Scrape API] Total arXiv results available:', totalResults)

  if (!result.feed.entry) return { results: [], total: totalResults }

  const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry]
  const results = entries.map(entry => ({
    title: entry.title.trim(),
    abstract: entry.summary.trim(),
    authors: Array.isArray(entry.author) 
      ? entry.author.map(a => a.name).join(', ')
      : entry.author.name,
    year: new Date(entry.published).getFullYear(),
    url: entry.id,
    source: 'arXiv'
  }))

  return { results, total: totalResults }
}

async function fetchFromPubmed(searchTerm, page = 0, resultsPerPage = 5) {
  try {
    // get PubMed IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchTerm}&retmode=json&retstart=${page * resultsPerPage}&retmax=${resultsPerPage}`
    
    // console.log('[PubMed] Searching:', searchUrl)
    const searchResponse = await throttledGet(searchUrl)
    const ids = searchResponse.data.esearchresult.idlist
    // console.log('[PubMed] Found IDs:', ids)

    if (!ids.length) return { results: [], total: 0 }

    // get article details using efetch
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`
    // console.log('[PubMed] Fetching articles:', fetchUrl)
    
    const response = await throttledGet(fetchUrl)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    })
    const data = parser.parse(response.data)
    
    // process articles from PubmedArticleSet
    const articles = data.PubmedArticleSet?.PubmedArticle || []
    const studies = Array.isArray(articles) ? articles : [articles]

    const results = studies.map(article => {
      try {
        const medlineCitation = article.MedlineCitation
        const articleData = medlineCitation.Article
        
        // get the title
        const title = articleData.ArticleTitle?.['#text'] || 
                     articleData.ArticleTitle || 
                     'No title available'

        // get the abstract
        const abstractTexts = articleData.Abstract?.AbstractText || []
        const abstract = Array.isArray(abstractTexts)
          ? abstractTexts.map(text => text?.['#text'] || text).join(' ')
          : abstractTexts?.['#text'] || abstractTexts || 'No abstract available'

        // get authors
        const authorList = articleData.AuthorList?.Author || []
        const authors = Array.isArray(authorList)
          ? authorList
              .map(a => `${a.LastName || ''} ${a.ForeName || ''}`.trim())
              .join(', ')
          : authorList.LastName 
            ? `${authorList.LastName} ${authorList.ForeName || ''}`.trim()
            : 'Unknown Authors'

        // get year
        const pubDate = articleData.Journal.JournalIssue.PubDate
        const year = pubDate.Year || 
                    (pubDate.MedlineDate ? pubDate.MedlineDate.substring(0, 4) : null) ||
                    new Date().getFullYear()

        // get PMID
        const pmid = medlineCitation.PMID?.['#text'] || medlineCitation.PMID

        return {
          title: typeof title === 'string' ? title.trim() : 'No title available',
          abstract: typeof abstract === 'string' ? abstract.trim() : 'No abstract available',
          authors: typeof authors === 'string' ? authors.trim() : 'Unknown Authors',
          year: parseInt(year),
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: 'PubMed'
        }
      } catch (error) {
        // console.error('[PubMed] Error processing article:', error)
        // console.error('[PubMed] Article data:', JSON.stringify(article, null, 2))
        return null
      }
    }).filter(result => result !== null)

    return { 
      results,
      total: parseInt(searchResponse.data.esearchresult.count)
    }

  } catch (error) {
    // console.error('[PubMed] Error:', error)
    // console.error('[PubMed] Error response:', error.response?.data)
    throw error
  }
}

export async function POST(request) {
  try {
    const { searchTerm, page = 0 } = await request.json()
    const resultsPerPage = 10  

    if (!searchTerm) {
      return NextResponse.json({ 
        studies: [],
        totalResults: 0,
        currentPage: 0,
        totalPages: 0
      })
    }

    // console.log('[Scrape API] Searching for:', searchTerm, 'page:', page)

    const [arxivData, pubmedData] = await Promise.all([
      fetchFromArxiv(searchTerm, page * 5, 5),  // get 5 from arXiv
      fetchFromPubmed(searchTerm, page, 5)      // get 5 from PubMed
    ])

    // console.log('[Scrape API] Found:', {
    //   arxiv: arxivData.results.length,
    //   pubmed: pubmedData.results.length,
    //   totalArxiv: arxivData.total,
    //   totalPubmed: pubmedData.total
    // })

    // combine results
    const allResults = [...arxivData.results, ...pubmedData.results]
    const totalResults = arxivData.total + pubmedData.total
    
    // create embeddings for all results
    const studiesWithEmbeddings = await Promise.all(allResults.map(async (study) => {
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: study.abstract
        })
        return {
          ...study,
          embedding: embeddingResponse.data[0].embedding
        }
      } catch (error) {
        // console.error('[Scrape API] Embedding error for study:', study.title)
        // console.error(error)
        return study
      }
    }))
    
    // save to db with embeddings
    if (studiesWithEmbeddings.length > 0) {
      const { error: insertError } = await supabase
        .from('studies')
        .upsert(studiesWithEmbeddings, {
          onConflict: 'title,abstract',
          ignoreDuplicates: true
        })

      if (insertError) {
        // console.error('[Scrape API] Database error:', insertError)
        throw insertError
      }

      // console.log('[Scrape API] Saved', studiesWithEmbeddings.length, 'results with embeddings to database')
    }

    return NextResponse.json({
      studies: allResults,
      totalResults: totalResults,
      currentPage: page,
      totalPages: Math.ceil(totalResults / resultsPerPage)
    })

  } catch (error) {
    // console.error('[Scrape API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape studies' },
      { status: 500 }
    )
  }
}