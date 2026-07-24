import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const BusSchedule = sequelize.define('BusSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  busId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'bus_id',
  },
  scheduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'schedule_id',
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'bus_schedules',
})

export default BusSchedule