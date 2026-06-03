import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const HistoricalEta = sequelize.define('HistoricalEta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fromStopId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'from_stop_id',
  },
  toStopId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'to_stop_id',
  },
  averageDurationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 300,
    field: 'average_duration_seconds',
  }
}, {
  timestamps: true,
  underscored: true,
})

export default HistoricalEta
