import { restaurantConnections } from './connection-manager'

export const addConnection = (restaurantId: string, connection: any) => {
  if (!restaurantConnections.has(restaurantId)) {
    restaurantConnections.set(restaurantId, new Set())
  }

  restaurantConnections.get(restaurantId)!.add(connection)
}
