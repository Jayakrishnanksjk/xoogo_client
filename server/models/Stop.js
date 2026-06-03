import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Stop = sequelize.define('Stop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'route_id',
  }
}, {
  timestamps: true,
  underscored: true,
})

export default Stop
