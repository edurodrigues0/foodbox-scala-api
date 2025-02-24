interface Restaurant {
  id: string
  name: string
  manager: {
    name: string
    email: string
  } | null
  units: {
    name: string
  }[]
}

export function getRestaurantsPresenters(restaurants: Restaurant[]) {
  return restaurants.map((restaurant) => {
    return {
      id: restaurant.id,
      name: restaurant.name,
      manager_name: restaurant.manager?.name ?? null,
      units: restaurant.units.map((item) => item.name),
    }
  })
}
