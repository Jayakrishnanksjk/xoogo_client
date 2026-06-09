import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ScheduleRoute = sequelize.define('ScheduleRoute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scheduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'schedule_id',
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'route_id',
  },
  sequenceOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sequence_order',
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'schedule_routes',
})

export default ScheduleRoute
