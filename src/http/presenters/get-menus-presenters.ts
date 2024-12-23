type Menu = {
  id: string
  name: string
  created_at: Date
  service_date: Date
}

export function getMenusPresenters(menus: Menu[]) {
  return menus.map((menu) => {
    return {
      id: menu.id,
      name: menu.name,
      service_date: menu.service_date.toISOString(),
      created_at: menu.created_at.toISOString(),
    }
  })
}
