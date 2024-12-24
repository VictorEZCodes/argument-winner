import './globals.css'

export const metadata = {
  title: 'Argument Winner',
  description: 'Win arguments with real scientific studies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}