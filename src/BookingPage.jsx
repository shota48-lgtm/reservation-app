import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

function generateTimeOptions(startHour, endHour, stepMinutes = 15) {
  const options = []
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 0) break
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return options
}

function BookingPage() {
  const { shopId } = useParams()
  const [shop, setShop] = useState(null)
  const [existingReservations, setExistingReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchShop()
  }, [shopId])

  const fetchShop = async () => {
    setLoading(true)

    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single()

    if (shopError || !shopData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setShop(shopData)

    const { data: reservationData } = await supabase
      .from('reservations')
      .select('reservation_date, start_time, end_time')
      .eq('shop_id', shopId)
      .neq('status', 'cancelled')

    setExistingReservations(reservationData || [])
    setLoading(false)
  }

  const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const validate = () => {
    const shopStart = shop.business_hours_start?.slice(0, 5) || '09:00'
    const shopEnd = shop.business_hours_end?.slice(0, 5) || '18:00'

    if (timeToMinutes(startTime) < timeToMinutes(shopStart) || timeToMinutes(endTime) > timeToMinutes(shopEnd)) {
      return `営業時間（${shopStart} - ${shopEnd}）の範囲内で選択してください`
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return '終了時刻は開始時刻より後にしてください'
    }

    const isOverlapping = existingReservations.some((r) => {
      if (r.reservation_date !== date) return false
      const existingStart = timeToMinutes(r.start_time.slice(0, 5))
      const existingEnd = timeToMinutes(r.end_time.slice(0, 5))
      const newStart = timeToMinutes(startTime)
      const newEnd = timeToMinutes(endTime)
      return newStart < existingEnd && newEnd > existingStart
    })

    if (isOverlapping) {
      return 'その時間帯はすでに予約が入っています。別の時間を選択してください'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const validationError = validate()
    if (validationError) {
      setMessage(validationError)
      return
    }

    setSubmitting(true)

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([{ shop_id: shopId, name: customerName, phone: customerPhone }])
      .select()
      .single()

    if (customerError) {
      setMessage('エラーが発生しました: ' + customerError.message)
      setSubmitting(false)
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
        },
      ])

    if (reservationError) {
      setMessage('エラーが発生しました: ' + reservationError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--color-text-muted)' }}>読み込み中...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md">
          <p className="font-display text-lg font-bold mb-2">店舗が見つかりません</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            URLをご確認ください
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md">
          <p className="font-display text-lg font-bold mb-2">予約が完了しました</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {date} {startTime} - {endTime}<br />
            {shop.name} にてお待ちしております
          </p>
        </div>
      </div>
    )
  }

  const shopStartHour = parseInt(shop.business_hours_start?.slice(0, 2) || '9', 10)
  const shopEndHour = parseInt(shop.business_hours_end?.slice(0, 2) || '18', 10)
  const timeOptions = generateTimeOptions(shopStartHour, shopEndHour)
  const shopStart = shop.business_hours_start?.slice(0, 5) || '09:00'
  const shopEnd = shop.business_hours_end?.slice(0, 5) || '18:00'

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="card w-full max-w-md mx-auto p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">{shop.name}</h1>
        <p className="text-sm text-center mb-1" style={{ color: 'var(--color-text-muted)' }}>
          ご予約フォーム
        </p>
        <p className="text-xs text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
          営業時間：{shopStart} - {shopEnd}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">お名前</label>
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
                {timeOptions.map((t) => (
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
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <p className="text-sm" style={{ color: 'var(--color-cancelled)' }}>{message}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 rounded-lg font-medium"
          >
            {submitting ? '送信中...' : '予約する'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BookingPage