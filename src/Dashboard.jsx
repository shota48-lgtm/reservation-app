import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ReservationForm from './ReservationForm'

const STATUS_LABEL = {
  confirmed: '確定',
  cancelled: 'キャンセル',
  completed: '完了',
}

function StatusBadge({ status }) {
  const isCancelled = status === 'cancelled'
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: isCancelled ? 'var(--color-cancelled-bg)' : 'var(--color-confirmed-bg)',
        color: isCancelled ? 'var(--color-cancelled)' : 'var(--color-confirmed)',
      }}
    >
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function Dashboard({ session }) {
  const [shop, setShop] = useState(null)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchShopAndReservations()
  }, [])

  const fetchShopAndReservations = async () => {
    setLoading(true)

    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', session.user.id)
      .single()

    if (shopError) {
      console.error(shopError)
      setLoading(false)
      return
    }

    setShop(shopData)

    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopData.id)
      .order('reservation_date', { ascending: true })

    if (reservationError) {
      console.error(reservationError)
    } else {
      setReservations(reservationData)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleReservationSaved = () => {
    setShowForm(false)
    fetchShopAndReservations()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--color-text-muted)' }}>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header
        className="bg-white"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="font-display text-xl font-bold">{shop?.name || '店舗ダッシュボード'}</h1>
          <button
            onClick={handleLogout}
            className="text-sm hover:underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-lg font-bold">予約一覧</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            + 新規予約
          </button>
        </div>

        {reservations.length === 0 ? (
          <div className="card p-12 text-center">
            <p style={{ color: 'var(--color-text-muted)' }}>まだ予約がありません</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              「+ 新規予約」から最初の予約を登録しましょう
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-accent-soft)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>日付</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>時間</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>顧客名</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>状態</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-5 py-4 text-sm">{r.reservation_date}</td>
                    <td className="px-5 py-4 text-sm">{r.start_time} - {r.end_time}</td>
                    <td className="px-5 py-4 text-sm font-medium">{r.customers?.name || '-'}</td>
                    <td className="px-5 py-4 text-sm">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showForm && shop && (
        <ReservationForm
          shopId={shop.id}
          onClose={() => setShowForm(false)}
          onSaved={handleReservationSaved}
        />
      )}
    </div>
  )
}

export default Dashboard