import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  estimatedDuration: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  routeType: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    defaultValue: 'inbound',
  },
  stops: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  }
}, {
  timestamps: true,
  underscored: true,
})

export default Route
