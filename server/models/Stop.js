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
  nameMl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'name_ml',
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  sequenceOrder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sequence_order',
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
