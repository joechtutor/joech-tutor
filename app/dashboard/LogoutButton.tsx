'use client'

export default function LogoutButton() {
  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    })

    window.location.href = '/login'
  }

  return (
    <button
      type="button"
      onClick={logout}
      style={{
        padding: '10px 18px',
        border: '1px solid #ccc',
        borderRadius: 8,
        cursor: 'pointer',
        marginTop: 20,
      }}
    >
      Logout
    </button>
  )
}