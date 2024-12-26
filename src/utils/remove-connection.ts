import { restaurantConnections } from "./connection-manager"

export const removeConnection = (restaurantId: string, connection: any) => {
  if (restaurantConnections.has(restaurantId)) {
    const connections = restaurantConnections.get(restaurantId)!
    connections.delete(connection)
  }

  if (connection.size === 0) {
    restaurantConnections.delete(restaurantId)
  }
}