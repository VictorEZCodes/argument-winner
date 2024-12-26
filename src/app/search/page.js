'use client'
import SearchBar from '@/components/SearchBar'
import StudyList from '@/components/StudyList'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function SearchPage() {
  const [studies, setStudies] = useState([])
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [noResults, setNoResults] = useState(false)

  const handleSearch = (results) => {
    // console.log('Search results:', results)
    if (results && results.studies) {
      setStudies(results.studies)
      setNoResults(results.noResults || results.studies.length === 0)
    } else {
      setStudies([])
      setNoResults(true)
    }
    setAnalysis('') 
  }

  const handleAnalyze = async () => {
    if (!question) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          studies: studies
        })
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setAnalysis(data.answer)
    } catch (error) {
      // console.error('Analysis error:', error)
      alert('Failed to analyze studies')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <nav className="p-4">
        <Link 
          href="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </nav>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">Search Studies</h1>
            <p className="text-gray-400">Find scientific evidence to support your arguments</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <SearchBar onSearch={handleSearch} />

            {noResults && (  
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <p className="text-gray-400">No results found. Try different search terms.</p>
              </motion.div>
            )}
            
            {studies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="mb-6">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about these studies..."
                    className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-4 px-8 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            <StudyList studies={studies} analysis={analysis} />
          </motion.div>
        </div>
      </section>
    </main>
  )
}