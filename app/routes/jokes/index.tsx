import type { Joke } from '@prisma/client'
import type { LoaderFunction } from 'remix'
import { useLoaderData, Link, useCatch } from 'remix'

import { db } from '~/utils/db.server'

type LoaderData = { randomJoke: Joke }

export const loader: LoaderFunction = async () => {
  const count = await db.joke.count()
  const randomRowNumber = Math.floor(Math.random() * count)
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber
  })
  if (!randomJoke) {
    throw new Response('No random joke found', {
      status: 404
    })
  }
  const data: LoaderData = { randomJoke }
  return data
}

export default function JokesIndexRoute(): JSX.Element {
  const data = useLoaderData<LoaderData>()

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data?.randomJoke?.content}</p>
      <Link to={data?.randomJoke?.id}>"{data?.randomJoke?.name}" Permalink</Link>
    </div>
  )
}

export function CatchBoundary(): JSX.Element {
  const caught = useCatch()

  if (caught.status === 404) {
    return <div className='error-container'>There are no jokes to display.</div>
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`)
}

export function ErrorBoundary(): JSX.Element {
  return <div className='error-container'>I did a whoopsies.</div>
}
