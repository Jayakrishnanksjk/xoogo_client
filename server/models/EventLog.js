import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const EventLog = sequelize.define('EventLog', {
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
  event: {
    type: DataTypes.ENUM('TRIP_STARTED', 'ARRIVED', 'DETOUR_STARTED', 'SKIPPED', 'TRIP_COMPLETED'),
    allowNull: false,
  },
  stopId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'stop_id',
  },
  missedStopId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'missed_stop_id',
  },
  arrivedStopId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'arrived_stop_id',
  },
  crossTrackError: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'cross_track_error',
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  rawTimestamp: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'raw_timestamp',
  }
}, {
  timestamps: true,
  underscored: true,
})

export default EventLog
