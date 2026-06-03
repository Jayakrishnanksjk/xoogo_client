import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const BusAssignment = sequelize.define('BusAssignment', {
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
  stopId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'stop_id',
  },
  sequenceOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sequence_order',
  }
}, {
  timestamps: true,
  underscored: true,
})

export default BusAssignment
