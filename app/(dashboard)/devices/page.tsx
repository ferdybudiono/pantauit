import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DevicesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: devices } = await supabase
    .from('devices')
    .select('id, hostname, os_type, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Devices</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border p-2">Hostname</th>
            <th className="border p-2">OS</th>
            <th className="border p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {devices?.map((d) => (
            <tr key={d.id}>
              <td className="border p-2">{d.hostname}</td>
              <td className="border p-2">{d.os_type}</td>
              <td className="border p-2">
                {new Date(d.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
