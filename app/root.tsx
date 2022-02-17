import React from 'react'
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch } from 'remix'
import type { MetaFunction, LinksFunction } from 'remix'

// css
import globalLargeStylesUrl from './styles/global-large.css'
import globalMediumStylesUrl from './styles/global-medium.css'
import globalStylesUrl from './styles/global.css'

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: globalStylesUrl
    },
    {
      rel: 'stylesheet',
      href: globalMediumStylesUrl,
      media: 'print, (min-width: 640px)'
    },
    {
      rel: 'stylesheet',
      href: globalLargeStylesUrl,
      media: 'screen and (min-width: 1024px)'
    }
  ]
}

export const meta: MetaFunction = () => {
  const description = `Learn Remix and laugh at the same time!`
  return {
    title: 'New Remix App',
    description,
    keywords: 'Remix,jokes',
    'twitter:image': 'https://remix-jokes.lol/social.png',
    'twitter:card': 'summary_large_image',
    'twitter:creator': '@remix_run',
    'twitter:site': '@remix_run',
    'twitter:title': 'Remix Jokes',
    'twitter:description': description
  }
}

function Document({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  )
}

export default function App(): JSX.Element {
  return (
    <Document>
      <Outlet />
    </Document>
  )
}

export function CatchBoundary(): JSX.Element {
  const caught = useCatch()

  return (
    <Document>
      <div className='error-container'>
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  )
}

export function ErrorBoundary({ error }: { error: Error }): JSX.Element {
  return (
    <Document>
      <div className='error-container'>
        <h1>App Error</h1>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    </Document>
  )
}
