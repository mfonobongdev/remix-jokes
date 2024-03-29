import type { Joke } from '@prisma/client'
import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix'
import { Form, Link, redirect, useCatch, useLoaderData, useParams } from 'remix'

import { db } from '~/utils/db.server'
import { requireUserId } from '~/utils/session.server'

type LoaderData = { joke: Joke }

export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId }
  })
  if (!joke) {
    throw new Response('What a joke! Not found.', {
      status: 404
    })
  }
  const data: LoaderData = { joke }
  return data
}

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData()
  if (form.get('_method') === 'delete') {
    const userId = await requireUserId(request)
    const joke = await db.joke.findUnique({
      where: { id: params.jokeId }
    })
    if (!joke) {
      throw new Response("Can't delete what does not exist", { status: 404 })
    }
    if (joke.jokesterId !== userId) {
      throw new Response("Pssh, nice try. That's not your joke", {
        status: 401
      })
    }
    await db.joke.delete({ where: { id: params.jokeId } })
    return redirect('/jokes')
  }
}

export const meta: MetaFunction = ({ data }: { data: LoaderData | undefined }) => {
  if (!data) {
    return {
      title: 'No joke',
      description: 'No joke found'
    }
  }
  return {
    title: `"${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`
  }
}

export default function JokeRoute(): JSX.Element {
  const data = useLoaderData<LoaderData>()

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data?.joke?.content}</p>
      <Link to='.'>{data?.joke?.name} Permalink</Link>
      <Form method='post'>
        <input type='hidden' name='_method' value='delete' />
        <button type='submit' className='button'>
          Delete
        </button>
      </Form>
    </div>
  )
}

export function CatchBoundary(): JSX.Element {
  const caught = useCatch()
  const params = useParams()
  switch (caught.status) {
    case 404: {
      return <div className='error-container'>Huh? What the heck is {params.jokeId}?</div>
    }
    case 401: {
      return <div className='error-container'>Sorry, but {params.jokeId} is not your joke.</div>
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`)
    }
  }
}

export function ErrorBoundary(): JSX.Element {
  const { jokeId } = useParams()
  return <div className='error-container'>{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
}
