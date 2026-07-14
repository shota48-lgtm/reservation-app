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

const STATUS_OPTIONS = ['confirmed', 'completed', 'cancelled']

function StatusSelect({ status, onChange }) {
  const isCancelled = status === 'cancelled'
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1 rounded-full text-xs font-medium border-0"
      style={{
        backgroundColor: isCancelled ? 'var(--color-cancelled-bg)' : 'var(--color-confirmed-bg)',
        color: isCancelled ? 'var(--color-cancelled)' : 'var(--color-confirmed)',
      }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
      ))}
    </select>
  )
}

function Dashboard({ session }) {
  const [shop, setShop] = useState(null)
  const [shopNotFound, setShopNotFound] = useState(false)
  const [newShopName, setNewShopName] = useState('')
  const [creatingShop, setCreatingShop] = useState(false)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [activeTab, setActiveTab] = useState('reservations') // 'reservations' | 'calendar' | 'customers'

  const fetchShopAndReservations = async () => {
    setLoading(true)

    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle()

    if (shopError) {
      console.error(shopError)
      setLoading(false)
      return
    }

    if (!shopData) {
      setShopNotFound(true)
      setLoading(false)
      return
    }

    setShopNotFound(false)
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

  useEffect(() => {
    fetchShopAndReservations()
  }, [])

  const handleCreateShop = async (e) => {
    e.preventDefault()
    setCreatingShop(true)

    const { error } = await supabase
      .from('shops')
      .insert([{ owner_id: session.user.id, name: newShopName }])

    setCreatingShop(false)

    if (error) {
      alert('店舗登録に失敗しました: ' + error.message)
      return
    }

    fetchShopAndReservations()
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

  const handleStatusChange = async (reservation, newStatus) => {
    const previous = reservations
    setReservations((rs) =>
      rs.map((r) => (r.id === reservation.id ? { ...r, status: newStatus } : r))
    )

    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', reservation.id)

    if (error) {
      alert('ステータス変更に失敗しました: ' + error.message)
      setReservations(previous)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--color-text-muted)' }}>読み込み中...</p>
      </div>
    )
  }

  if (shopNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-md p-8">
          <h1 className="font-display text-xl font-bold mb-1 text-center">店舗情報を登録してください</h1>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
            もう少しで利用開始です
          </p>
          <form onSubmit={handleCreateShop} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">店舗名</label>
              <input
                type="text"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                required
                className="input-field w-full px-3 py-2"
                placeholder="例：とーふサロン"
              />
            </div>
            <button
              type="submit"
              disabled={creatingShop}
              className="btn-primary w-full py-2.5 rounded-lg font-medium"
            >
              {creatingShop ? '登録中...' : '登録する'}
            </button>
          </form>
          <button
            onClick={handleLogout}
            className="mt-5 text-sm w-full text-center hover:underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ログアウト
          </button>
        </div>
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
                        <StatusSelect status={r.status} onChange={(newStatus) => handleStatusChange(r, newStatus)} />
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        {r.reservation_date}{'　'}{r.start_time} - {r.end_time}
                      </p>
                      <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                          onClick={() => handleEdit(r)}
                          className="text-sm hover:underline"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          編集
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
                            <StatusSelect status={r.status} onChange={(newStatus) => handleStatusChange(r, newStatus)} />
                          </td>
                          <td className="px-5 py-4 text-sm text-right space-x-3">
                            <button
                              onClick={() => handleEdit(r)}
                              className="hover:underline"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              編集
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
              onStatusChange={handleStatusChange}
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