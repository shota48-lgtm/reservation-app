import { useState } from 'react'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

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

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function CalendarView({ reservations, onEdit, onDelete }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))

  const reservationsByDate = {}
  reservations.forEach((r) => {
    if (!reservationsByDate[r.reservation_date]) {
      reservationsByDate[r.reservation_date] = []
    }
    reservationsByDate[r.reservation_date].push(r)
  })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d))
  }

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }
  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const todayKey = toDateKey(new Date())
  const selectedReservations = reservationsByDate[selectedDate] || []

  return (
    <div>
      <div className="card p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
            style={{ border: '1px solid var(--color-border)' }}
          >
            ‹
          </button>
          <h3 className="font-display text-base font-bold">
            {year}年{month + 1}月
          </h3>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
            style={{ border: '1px solid var(--color-border)' }}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center text-xs font-medium py-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />

            const dateKey = toDateKey(date)
            const count = reservationsByDate[dateKey]?.length || 0
            const hasReservation = count > 0
            const isSelected = dateKey === selectedDate
            const isToday = dateKey === todayKey

            let bgColor = 'transparent'
            let textColor = 'var(--color-text)'
            if (isSelected) {
              bgColor = 'var(--color-accent)'
              textColor = '#FFFFFF'
            } else if (hasReservation) {
              bgColor = 'var(--color-accent-soft)'
              textColor = 'var(--color-accent-dark)'
            } else if (isToday) {
              textColor = 'var(--color-accent-dark)'
            }

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateKey)}
                className="aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  fontWeight: isToday || isSelected || hasReservation ? 700 : 400,
                  border: isToday && !isSelected ? '1.5px solid var(--color-accent)' : 'none',
                }}
              >
                {date.getDate()}
                {hasReservation && (
                  <span
                    className="text-[9px] leading-none mt-0.5 px-1 rounded-full"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--color-accent)',
                      color: '#FFFFFF',
                    }}
                  >
                    {count}件
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-display text-base font-bold mb-3">
          {selectedDate} の予約
        </h3>

        {selectedReservations.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              この日の予約はありません
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedReservations
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">{r.customers?.name || '-'}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {r.start_time} - {r.end_time}
                  </p>
                  {r.memo && (
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      メモ: {r.memo}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => onEdit(r)}
                      className="text-sm hover:underline"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(r)}
                      className="text-sm hover:underline"
                      style={{ color: 'var(--color-cancelled)' }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarView