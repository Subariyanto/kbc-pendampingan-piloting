import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getStoredLicense } from '../lib/codes.js'

export default function DebugPage() {
  const { user, isAuthed, mode, authLoading } = useAuth()
  const [localStorageData, setLocalStorageData] = useState(null)

  const scanLocalStorage = () => {
    const data = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('kbc_')) {
          try {
            const val = localStorage.getItem(key)
            data[key] = val?.length > 200 ? val.substring(0, 200) + '...' : val
          } catch {
            data[key] = '[error reading]'
          }
        }
      }
    } catch (e) {
      data._error = e.message
    }
    setLocalStorageData(data)
  }

  const clearAll = () => {
    if (!confirm('Hapus SEMUA data localStorage (termasuk lisensi, user, settings)?')) return
    try {
      localStorage.clear()
      alert('Data terhapus. Reload sekarang.')
      window.location.reload()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const license = getStoredLicense()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-navy-900 mb-4">🔍 Debug & Diagnostic</h1>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h2 className="font-semibold text-navy-800">Auth Context</h2>
            <div className="text-sm space-y-1 mt-2">
              <p><strong>Mode:</strong> {mode}</p>
              <p><strong>Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
              <p><strong>Authenticated:</strong> {isAuthed ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h2 className="font-semibold text-navy-800">License</h2>
            <div className="text-sm mt-2">
              <pre className="bg-slate-100 p-3 rounded overflow-auto">
                {license ? JSON.stringify(license, null, 2) : 'No license found'}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h2 className="font-semibold text-navy-800">localStorage Scanner</h2>
            <button onClick={scanLocalStorage} className="btn-primary mt-2">
              Scan localStorage (kbc_* keys)
            </button>
            {localStorageData && (
              <pre className="bg-slate-100 p-3 rounded mt-3 overflow-auto text-xs">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            )}
          </div>

          <div className="border-l-4 border-rose-500 pl-4">
            <h2 className="font-semibold text-navy-800">Actions</h2>
            <div className="flex gap-3 mt-2">
              <button onClick={clearAll} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded">
                Clear All localStorage
              </button>
              <button 
                onClick={() => {
                  try {
                    localStorage.removeItem('kbc_license_v1')
                    localStorage.removeItem('kbc_local_user_v1')
                    localStorage.removeItem('kbc_auth_v1')
                    alert('License & user data cleared')
                    window.location.reload()
                  } catch (e) {
                    alert('Error: ' + e.message)
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
              >
                Clear License Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
