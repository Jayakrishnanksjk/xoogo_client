import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const BusApiKey = sequelize.define('BusApiKey', {
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
  key_hash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'key_hash',
  },
  key_prefix: {
    type: DataTypes.STRING(32),
    allowNull: true,
    field: 'key_prefix',
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'revoked'),
    defaultValue: 'active',
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at',
  },
}, {
  timestamps: true,
  underscored: true,
  tableName: 'bus_api_keys',
})

export default BusApiKey