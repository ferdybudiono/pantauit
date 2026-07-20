'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'

export async function enrollDevice(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('No organization')

  const hostname = formData.get('hostname') as string
  const os_type = formData.get('os_type') as string
  const api_key = randomUUID()

  const { error } = await supabase.from('devices').insert({
    organization_id: profile.organization_id,
    hostname,
    os_type,
    api_key,
  })

  if (error) throw new Error(error.message)

  // In real app, show api_key to user once. Here we redirect back.
  redirect('/devices')
}
