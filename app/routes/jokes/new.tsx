import type { ActionFunction, LoaderFunction } from 'remix'
import { useActionData, redirect, json, useCatch, Link, Form } from 'remix'

import { db } from '~/utils/db.server'
import { getUserId, requireUserId } from '~/utils/session.server'

function validateJokeContent(content: string) {
  if (content.length < 10) {
    return `That joke is too short`
  }
}

function validateJokeName(name: string) {
  if (name.length < 2) {
    return `That joke's name is too short`
  }
}

type ActionData = {
  formError?: string
  fieldErrors?: {
    name: string | undefined
    content: string | undefined
  }
  fields?: {
    name: string
    content: string
  }
}

const badRequest = (data: ActionData) => json(data, { status: 400 })

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request)
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return {}
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  const userId = await requireUserId(request)
  const name = form.get('name')
  const content = form.get('content')
  if (typeof name !== 'string' || typeof content !== 'string') {
    return badRequest({
      formError: `Form not submitted correctly.`
    })
  }

  if (name.length === 0 || content.length === 0) {
    return badRequest({
      formError: `Form not submitted correctly.`
    })
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content)
  }
  const fields = { name, content }
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  const joke = await db.joke.create({ data: { ...fields, jokesterId: userId } })
  return redirect(`/jokes/${joke.id}`)
}

export default function NewJokeRoute(): JSX.Element {
  const actionData = useActionData<ActionData>()

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method='post'>
        <div>
          {actionData?.formError ? (
            <p className='form-validation-error' role='alert' id='name-error'>
              {actionData?.formError}
            </p>
          ) : null}
          <label>
            Name:{' '}
            <input
              type='text'
              defaultValue={actionData?.fields?.name}
              name='name'
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={actionData?.fieldErrors?.name ? 'name-error' : undefined}
              onChange={() => action}
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className='form-validation-error' role='alert' id='name-error'>
              {actionData?.fieldErrors?.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{' '}
            <textarea
              defaultValue={actionData?.fields?.content}
              name='content'
              onChange={() => {
                console.log('change occured')
              }}
              aria-invalid={Boolean(actionData?.fieldErrors?.content) || undefined}
              aria-describedby={actionData?.fieldErrors?.content ? 'content-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p className='form-validation-error' role='alert' id='content-error'>
              {actionData?.fieldErrors?.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type='submit' className='button'>
            Add
          </button>
        </div>
      </Form>
    </div>
  )
}

export function CatchBoundary(): JSX.Element {
  const caught = useCatch()

  if (caught.status === 401) {
    return (
      <div className='error-container'>
        <p>You must be logged in to create a joke.</p>
        <Link to='/login'>Login</Link>
      </div>
    )
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`)
}

export function ErrorBoundary(): JSX.Element {
  return <div className='error-container'>Something unexpected went wrong. Sorry about that.</div>
}
