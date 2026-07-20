import { enrollDevice } from '@/app/actions/enroll'

export default function EnrollDevicePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Enroll New Device</h1>
      <form action={enrollDevice} className="flex flex-col gap-2 max-w-sm">
        <label className="text-sm">Hostname</label>
        <input name="hostname" required className="border p-2 rounded" />
        <label className="text-sm">OS Type</label>
        <input name="os_type" placeholder="Windows / Linux" className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Generate API Key
        </button>
      </form>
    </div>
  )
}
