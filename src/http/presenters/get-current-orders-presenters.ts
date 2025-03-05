interface CurrentOrders {
  unit: string
  sector: string
  total_orders: number
}

type Order = {
  unit: string
  orders: {
    sector: string
    total_orders: number
  }[]
}[]

export function getCurrentOrders(orders: CurrentOrders[]) {
  return orders.reduce((acc: Order, order) => {
    const { unit, sector, total_orders } = order

    const existingUnit = acc.find((item) => item.unit === unit)

    if (existingUnit) {
      existingUnit.orders.push({ sector, total_orders })
    } else {
      acc.push({ unit, orders: [{ sector, total_orders }] })
    }

    return acc
  }, [])
}
