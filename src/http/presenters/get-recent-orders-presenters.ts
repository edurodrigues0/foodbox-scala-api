interface RecentOrders {
  id: string | null
  name: string | null
  cpf: string | null
  registration: number | null
  totalSpent: string | null
  totalOrders: number | null
}

export function getRecentOrdersPresenters(recentOrders: RecentOrders[]) {
  return recentOrders.map((recentOrder) => {
    return {
      id: recentOrder.id,
      colaborator: recentOrder.name,
      cpf: recentOrder.cpf,
      registration: recentOrder.registration,
      total_spent_in_cents: Number(recentOrder.totalSpent),
      total_orders: Number(recentOrder.totalOrders),
    }
  })
}
