import { useState } from "react"
import { loginUser } from "../api/loginApi"
import { useAuthStore } from "../store/authStore"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setTokens } = useAuthStore()

  async function handleSubmit() {
    const tokenResponse = await loginUser(email, password)
    setTokens(tokenResponse.access_token, tokenResponse.refresh_token)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        className="flex flex-col gap-4 w-80 bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-xl font-semibold text-slate-700">Sign in</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}