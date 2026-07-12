import { useState } from 'react'
import { supabase } from './supabaseClient'

function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        setMessage('エラー: ' + error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        const { error: shopError } = await supabase
          .from('shops')
          .insert([{ owner_id: data.user.id, name: shopName }])

        if (shopError) {
          setMessage('店舗登録エラー: ' + shopError.message)
        } else {
          setMessage('登録完了！')
        }
      } else {
        setMessage('登録完了！確認メールをチェックしてください。')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('エラー: ' + error.message)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">
          {isSignUp ? '店舗オーナー登録' : 'ログイン'}
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {isSignUp ? 'サロン予約管理をはじめましょう' : 'おかえりなさい'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">店舗名</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="input-field w-full px-3 py-2"
                placeholder="例：とーふサロン"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field w-full px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-field w-full px-3 py-2"
              placeholder="6文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 rounded-lg font-medium"
          >
            {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-cancelled)' }}>
            {message}
          </p>
        )}

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-5 text-sm w-full text-center hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '新規登録はこちら'}
        </button>
      </div>
    </div>
  )
}

export default Login