import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ReservationForm from './ReservationForm'
import CustomerList from './CustomerList'
import CalendarView from './CalendarView'

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
  const [editingReservation, setEditingReservation] = useState(null)
  const [activeTab, setActiveTab] = useState('reservations') // 'reservations' | 'calendar' | 'customers'

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
    setEditingReservation(null)
    fetchShopAndReservations()
  }

  const handleEdit = (reservation) => {
    setEditingReservation(reservation)
  }

  const handleDelete = async (reservation) => {
    const confirmed = window.confirm(
      `${reservation.customers?.name || '顧客'}様の予約（${reservation.reservation_date}）を削除しますか？`
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation.id)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <h1 className="font-display text-lg sm:text-xl font-bold">{shop?.name || '店舗ダッシュボード'}</h1>
          <button
            onClick={handleLogout}
            className="text-sm hover:underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ログアウト
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reservations')}
            className="pb-3 text-sm font-medium whitespace-nowrap"
            style={{
              borderBottom: activeTab === 'reservations' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'reservations' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
            }}
          >
            予約一覧
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className="pb-3 text-sm font-medium whitespace-nowrap"
            style={{
              borderBottom: activeTab === 'calendar' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'calendar' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
            }}
          >
            カレンダー
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className="pb-3 text-sm font-medium whitespace-nowrap"
            style={{
              borderBottom: activeTab === 'customers' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'customers' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
            }}
          >
            顧客一覧
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {activeTab === 'reservations' && (
          <>
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
              <>
                {/* スマホ表示：カード形式 */}
                <div className="sm:hidden space-y-3">
                  {reservations.map((r) => (
                    <div key={r.id} className="card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">{r.customers?.name || '-'}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        {r.reservation_date}　{r.start_time} - {r.end_time}
                      </p>
                      <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                          onClick={() => handleEdit(r)}
                          className="text-sm hover:underline"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="text-sm hover:underline"
                          style={{ color: 'var(--color-cancelled)' }}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PC表示：テーブル形式 */}
                <div className="hidden sm:block card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-accent-soft)' }}>
                        <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>日付</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>時間</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>顧客名</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>状態</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>操作</th>
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
                          <td className="px-5 py-4 text-sm text-right space-x-3">
                            <button
                              onClick={() => handleEdit(r)}
                              className="hover:underline"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              className="hover:underline"
                              style={{ color: 'var(--color-cancelled)' }}
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'calendar' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-bold">カレンダー</h2>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
              >
                + 新規予約
              </button>
            </div>
            <CalendarView
              reservations={reservations}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        {activeTab === 'customers' && <CustomerList shopId={shop.id} />}
      </main>

      {showForm && shop && (
        <ReservationForm
          shopId={shop.id}
          onClose={() => setShowForm(false)}
          onSaved={handleReservationSaved}
        />
      )}

      {editingReservation && (
        <ReservationForm
          shopId={shop.id}
          editData={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSaved={handleReservationSaved}
        />
      )}
    </div>
  )
}

export default Dashboard