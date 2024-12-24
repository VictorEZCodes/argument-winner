export default function ResultCard({ study }) {
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
        {study.abstract && (
          <p className="text-gray-300 mt-4 line-clamp-3">
            {study.abstract}
          </p>
        )}
      </a>
    </div>
  )
}