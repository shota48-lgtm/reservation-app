import { useState } from 'react'
import { supabase } from './supabaseClient'

function generateTimeOptions(startHour = 8, endHour = 21, stepMinutes = 15) {
  const options = []
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 0) break
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function ReservationForm({ shopId, onClose, onSaved, editData }) {
  const isEdit = !!editData

  const [customerName, setCustomerName] = useState(editData?.customers?.name || '')
  const [customerPhone, setCustomerPhone] = useState(editData?.customers?.phone || '')
  const [date, setDate] = useState(editData?.reservation_date || '')
  const [startTime, setStartTime] = useState(editData?.start_time?.slice(0, 5) || '')
  const [endTime, setEndTime] = useState(editData?.end_time?.slice(0, 5) || '')
  const [memo, setMemo] = useState(editData?.memo || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const checkOverlap = async () => {
    let query = supabase
      .from('reservations')
      .select('id, start_time, end_time')
      .eq('shop_id', shopId)
      .eq('reservation_date', date)
      .neq('status', 'cancelled')

    if (isEdit) {
      query = query.neq('id', editData.id)
    }

    const { data, error } = await query

    if (error) {
      return 'チェック中にエラーが発生しました: ' + error.message
    }

    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)

    const overlapping = (data || []).some((r) => {
      const existingStart = timeToMinutes(r.start_time.slice(0, 5))
      const existingEnd = timeToMinutes(r.end_time.slice(0, 5))
      return newStart < existingEnd && newEnd > existingStart
    })

    if (overlapping) {
      return 'その時間帯はすでに他の予約と重なっています'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setMessage('終了時刻は開始時刻より後にしてください')
      setLoading(false)
      return
    }

    const overlapError = await checkOverlap()
    if (overlapError) {
      setMessage(overlapError)
      setLoading(false)
      return
    }

    if (isEdit) {
      const { error: customerError } = await supabase
        .from('customers')
        .update({ name: customerName, phone: customerPhone })
        .eq('id', editData.customer_id)

      if (customerError) {
        setMessage('顧客更新エラー: ' + customerError.message)
        setLoading(false)
        return
      }

      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          reservation_date: date,
          start_time: startTime,
          end_time: endTime,
          memo: memo,
        })
        .eq('id', editData.id)

      if (reservationError) {
        setMessage('予約更新エラー: ' + reservationError.message)
        setLoading(false)
        return
      }
    } else {
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
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(38, 36, 31, 0.5)' }}
    >
      <div className="card w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-lg font-bold">
            {isEdit ? '予約を編集' : '新規予約'}
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
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
              className="input-field w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">電話番号</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-field w-full px-3 py-2"
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
              min={today}
              className="input-field w-full px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">開始時刻</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="input-field w-full px-3 py-2"
              >
                <option value="">選択</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">終了時刻</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="input-field w-full px-3 py-2"
              >
                <option value="">選択</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="input-field w-full px-3 py-2"
              rows={2}
              placeholder="任意"
            />
          </div>

          {message && (
            <p className="text-sm" style={{ color: 'var(--color-cancelled)' }}>{message}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid var(--color-border)' }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2 rounded-lg text-sm font-medium"
            >
              {loading ? '確認中...' : isEdit ? '更新する' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationForm