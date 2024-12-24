'use client'
import { motion } from 'framer-motion'
import ResultCard from './ResultCard'

export default function StudyList({ studies, analysis }) {
  // console.log('StudyList received:', studies)
  // console.log('Analysis received:', analysis)

  // helper function to find referenced studies
  const findReferencedStudies = (analysis, allStudies) => {
    if (!analysis || !allStudies) return []
    
    return allStudies.filter(study => {
      // extract author's last name and year from the study
      const authorLastNames = study.authors
        .split(',')
        .map(author => author.trim().split(' ').pop().toLowerCase())
      
      const yearStr = study.year.toString()
      
      // check for citations in the format "Author, YEAR" or "(Author, YEAR)"
      const citationFound = authorLastNames.some(lastName => {
        const citationPattern = new RegExp(`${lastName}.*?${yearStr}|\\(${lastName}.*?${yearStr}\\)`, 'i')
        return citationPattern.test(analysis)
      })

      return citationFound
    })
  }

  // if we have an analysis, show it first
  if (analysis) {
    const referencedStudies = findReferencedStudies(analysis, studies)
    // console.log('Referenced studies found:', referencedStudies)
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 space-y-8"
      >
        {/* Analysis Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-6 bg-purple-900/20 backdrop-blur-md border border-purple-500/20 text-white"
        >
          <h2 className="text-xl font-semibold mb-4 text-purple-200">Analysis</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
          </div>
        </motion.div>

        {/* Referenced Studies */}
        {referencedStudies.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Referenced Studies</h3>
            {referencedStudies.map((study, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <a 
                  href={study.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <h4 className="font-medium text-white hover:text-purple-300 transition-colors">
                    {study.title}
                  </h4>
                  <p className="text-sm text-gray-400 mt-2">
                    {study.authors} • {study.year}
                  </p>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    )
  }

  // regular study list display (with full details)
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 space-y-4"
    >
      {studies.map((study, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <ResultCard study={study} />
        </motion.div>
      ))}
    </motion.div>
  )
}