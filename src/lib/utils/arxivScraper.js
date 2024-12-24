import axios from 'axios'
import xml2js from 'xml2js'
import { supabase } from '../db/supabase'

const ARXIV_API_URL = 'http://export.arxiv.org/api/query'

export async function searchArxiv(searchQuery, maxResults = 10) {
  try {
    // convert search terms into a more specific query
    const terms = searchQuery.split(' ').filter(term => term.length > 2)
    const queryString = terms.join(' AND ')

    const response = await axios.get(ARXIV_API_URL, {
      params: {
        search_query: `all:"${queryString}"`, 
        start: 0,
        max_results: maxResults,
        sortBy: 'relevance', 
        sortOrder: 'descending'
      }
    })

    const parser = new xml2js.Parser()
    const result = await parser.parseStringPromise(response.data)
    
    const entries = result.feed.entry || []
    
    // filter results to ensure all terms appear in either title or abstract
    const studies = entries
      .filter(entry => {
        const title = entry.title[0].toLowerCase()
        const abstract = entry.summary[0].toLowerCase()
        return terms.every(term => 
          title.includes(term.toLowerCase()) || 
          abstract.includes(term.toLowerCase())
        )
      })
      .map(entry => ({
        title: entry.title[0],
        abstract: entry.summary[0],
        authors: entry.author.map(a => a.name[0]).join(', '),
        year: new Date(entry.published[0]).getFullYear().toString(),
        url: entry.id[0]
      }))

    // save to db
    if (studies.length > 0) {
      const { error } = await supabase
        .from('studies')
        .insert(studies)

      if (error) throw error
    }

    return studies
  } catch (error) {
    console.error('Error scraping arXiv:', error)
    throw error
  }
}