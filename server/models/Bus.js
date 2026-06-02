import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Bus = sequelize.define('Bus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  regNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'reg_number',
  },
  simNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sim_number',
  },
  busType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'bus_type',
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contact_name',
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contact_number',
  },
  chassisNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'chassis_number',
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('online', 'offline'),
    defaultValue: 'offline',
  },
  selectedStops: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'selected_stops',
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'group_id',
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'route_id',
  }
}, {
  timestamps: true,
  underscored: true,
})

export default Bus
