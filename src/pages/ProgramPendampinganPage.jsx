import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'

const STORAGE_KEY = 'kbc_program_pendampingan_drive_url'

function loadDriveUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'https://docs.google.com/document/d/1EqQHfDpCkMXMHE9F7m9oOx1u1KUrSAQN/edit?usp=sharing&ouid=117736083828951249234&rtpof=true&sd=true'
  } catch {
    return ''
  }
}

export default function ProgramPendampinganPage() {
  const [driveUrl, setDriveUrl] = useState(loadDriveUrl)
  const [draftUrl, setDraftUrl] = useState(loadDriveUrl)
  const [isEditing, setIsEditing] = useState(false)

  const saveLink = () => {
    const nextUrl = draftUrl.trim()
    setDriveUrl(nextUrl)
    localStorage.setItem(STORAGE_KEY, nextUrl)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setDraftUrl(driveUrl)
    setIsEditing(false)
  }

  const downloadFile = () => {
    if (driveUrl) window.open(driveUrl, '_blank', 'noopener,noreferrer')
  }

  return <>
    <PageHeader
      title="Program Pendampingan Pengawas"
      description="Akses dokumen program pendampingan pengawas melalui Google Drive."
    />

    <article className="card p-6 max-w-3xl">
      <h2 className="text-xl font-semibold text-navy-900">Program Pendampingan Pengawas</h2>
      <p className="mt-2 text-sm text-slate-600">
        Dokumen acuan pelaksanaan pendampingan, monitoring, dan tindak lanjut oleh pengawas madrasah.
      </p>

      <div className="mt-6">
        <label htmlFor="program-drive-url" className="block mb-2 text-sm font-medium text-slate-700">
          Google Drive URL
        </label>
        <input
          id="program-drive-url"
          className="input w-full"
          type="url"
          placeholder="https://drive.google.com/..."
          value={isEditing ? draftUrl : driveUrl}
          onChange={event => setDraftUrl(event.target.value)}
          readOnly={!isEditing}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        <button className="btn-primary" type="button" onClick={downloadFile} disabled={!driveUrl}>
          Unduh File
        </button>
        {isEditing ? <>
          <button className="btn-primary" type="button" onClick={saveLink}>Simpan Link</button>
          <button className="btn-ghost" type="button" onClick={cancelEdit}>Batal</button>
        </> : (
          <button className="btn-ghost" type="button" onClick={() => setIsEditing(true)}>Edit Link</button>
        )}
      </div>
      {!driveUrl && !isEditing && <p className="mt-3 text-xs text-slate-500">Link Google Drive belum diatur.</p>}
    </article>
  </>
}
