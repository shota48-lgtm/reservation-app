import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function CustomerList({ shopId }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    setLoading(true)

    // 顧客一覧と、それぞれの予約件数を取得
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*, reservations(id, status)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (customerError) {
      console.error(customerError)
    } else {
      setCustomers(customerData)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
        読み込み中...
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold mb-6">顧客一覧</h2>

      {customers.length === 0 ? (
        <div className="card p-12 text-center">
          <p style={{ color: 'var(--color-text-muted)' }}>まだ顧客がいません</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            予約を登録すると、ここに顧客情報が表示されます
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-accent-soft)' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>顧客名</th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>電話番号</th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>来店回数</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-4 text-sm font-medium">{c.name}</td>
                  <td className="px-5 py-4 text-sm">{c.phone || '-'}</td>
                  <td className="px-5 py-4 text-sm">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent-dark)' }}
                    >
                      {c.reservations?.filter((r) => r.status !== 'cancelled').length || 0}回
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CustomerList