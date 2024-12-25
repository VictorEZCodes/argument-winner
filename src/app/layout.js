import './globals.css'

export const metadata = {
  title: 'Argument Winner',
  description: 'Win arguments with real scientific studies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className="bg-black text-white min-h-screen overflow-x-hidden">
        <div className="relative min-h-screen">
          {/* Background gradient */}
          <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />
          
          {/* Content container */}
          <main className="relative z-10 min-h-screen overflow-y-auto container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}