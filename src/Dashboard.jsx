import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ReservationForm from './ReservationForm'

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

    // 自分の店舗情報を取得
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

    // その店舗の予約一覧を取得
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
    fetchShopAndReservations() // 一覧を再取得して最新化
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">{shop?.name || '店舗ダッシュボード'}</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">予約一覧</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + 新規予約
          </button>
        </div>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            まだ予約がありません
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">日付</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">時間</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">顧客名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状態</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-sm">{r.reservation_date}</td>
                    <td className="px-4 py-3 text-sm">{r.start_time} - {r.end_time}</td>
                    <td className="px-4 py-3 text-sm">{r.customers?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 新規予約モーダル */}
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