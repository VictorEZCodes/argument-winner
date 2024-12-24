'use client'
import { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [lastAction, setLastAction] = useState(null)

  const deduplicateStudies = (studies) => {
    if (!Array.isArray(studies)) {
      // console.error('Expected array of studies, got:', studies)
      return []
    }
    const seen = new Set()
    return studies.filter(study => {
      const key = `${study.title}-${study.abstract}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const handleSearch = async (e, page = 0) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setLastAction('search')
    
    let searchTerm = document.querySelector('input[name="search"]').value
    if (!searchTerm) {
      setError('Please enter a search term')
      setLoading(false)
      return
    }

    try {
      // console.log('Sending search request for:', searchTerm)
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm, page }),
      })

      if (!searchResponse.ok) {
        throw new Error('Search failed')
      }

      const data = await searchResponse.json()
      // console.log('Search response:', data)

      if (!data.studies) {
        throw new Error('No studies in response')
      }

      const uniqueStudies = deduplicateStudies(data.studies)
      // console.log('Received unique studies:', uniqueStudies.length)
      setCurrentPage(data.currentPage || 0)
      setTotalPages(data.totalPages || 0)
      onSearch(uniqueStudies)
      
    } catch (err) {
      // console.error('Search error:', err)
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleScrape = async (page = 0) => {
    let searchTerm = document.querySelector('input[name="search"]').value
    if (!searchTerm) {
      setError('Please enter a search term')
      return
    }

    setScraping(true)
    setError(null)
    setLastAction('scrape')

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm, page }),
      })

      if (!response.ok) {
        throw new Error('Scraping failed')
      }

      const data = await response.json()
      const uniqueStudies = deduplicateStudies(data.studies)
      // console.log('Received unique scraped studies:', uniqueStudies.length)
      setCurrentPage(data.currentPage || 0)
      setTotalPages(data.totalPages || 0)
      onSearch(uniqueStudies)
      
    } catch (err) {
      setError('Failed to scrape studies')
      // console.error(err)
    } finally {
      setScraping(false)
    }
  }

  const handlePageChange = async (newPage) => {
    if (lastAction === 'search') {
      await handleSearch(null, newPage)
    } else if (lastAction === 'scrape') {
      await handleScrape(newPage)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          name="search"
          placeholder="Ask a question (e.g., 'What is dark matter?')"
          className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading || scraping}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          <button
            type="button"
            onClick={() => handleScrape(0)}
            className={`px-4 py-2 bg-green-600 text-white rounded-lg ${
              scraping ? 'opacity-50' : 'hover:bg-green-700'
            } transition-colors`}
            disabled={scraping || loading}
          >
            {scraping ? 'Scraping...' : 'Scrape New'}
          </button>
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
              loading ? 'opacity-50' : 'hover:bg-blue-700'
            } transition-colors`}
            disabled={loading || scraping}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0 || loading || scraping}
            className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || loading || scraping}
            className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}