import './globals.css'

export const metadata = {
  title: 'JOECH TUTOR',
  description:
    'JOECH TUTOR Mathematics & English Assessment Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}