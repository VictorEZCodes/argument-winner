import { useState } from 'react'

export default function ResultCard({ study }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="p-6 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
      <a 
        href={study.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="text-xl font-medium text-white hover:text-purple-300 transition-colors">
          {study.title}
        </h3>
        <p className="text-sm text-gray-400 mt-2">
          {study.authors} • {study.year}
        </p>
      </a>
      
      {study.abstract && (
        <div className="mt-4">
          <p className={`text-gray-300 ${!isExpanded && 'line-clamp-3'}`}>
            {study.abstract}
          </p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors focus:outline-none"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      )}
    </div>
  )
}