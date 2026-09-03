import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const RouteStop = sequelize.define('RouteStop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'route_id',
  },
  stopId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'stop_id',
  },
  sequenceOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sequence_order',
  },
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['route_id', 'stop_id'] },
    { unique: true, fields: ['route_id', 'sequence_order'] },
  ],
})

export default RouteStop
