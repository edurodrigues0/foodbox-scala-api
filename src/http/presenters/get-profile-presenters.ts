interface User {
  id: string
  email: string
  name: string
  managedRestaurant: {
    id: string
  } | null
}

export function getProfilePresenters(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    restaurant_id: user.managedRestaurant?.id ?? undefined,
  }
}
