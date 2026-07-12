import { useState } from 'react'
import { supabase } from './supabaseClient'

function ReservationForm({ shopId, onClose, onSaved }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 1. 顧客を新規作成
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([{ shop_id: shopId, name: customerName, phone: customerPhone }])
      .select()
      .single()

    if (customerError) {
      setMessage('顧客登録エラー: ' + customerError.message)
      setLoading(false)
      return
    }

    // 2. 予約を新規作成
    const { error: reservationError } = await supabase
      .from('reservations')
      .insert([
        {
          shop_id: shopId,
          customer_id: customerData.id,
          reservation_date: date,
          start_time: startTime,
          end_time: endTime,
          memo: memo,
        },
      ])

    if (reservationError) {
      setMessage('予約登録エラー: ' + reservationError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSaved() // 親コンポーネントに保存完了を通知（一覧を再取得させる）
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">新規予約</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">顧客名</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">電話番号</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="任意"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">予約日</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">開始時刻</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">終了時刻</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="任意"
            />
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationForm