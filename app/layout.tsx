import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { clsx } from 'clsx'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Revenue Leak SRE',
    description: 'GTM Stack Doctor - Detect and fix revenue leaks',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={clsx(inter.className, "min-h-screen bg-gray-50 text-slate-900")}>
                <main className="min-h-screen flex flex-col">
                    {children}
                </main>
            </body>
        </html>
    )
}
