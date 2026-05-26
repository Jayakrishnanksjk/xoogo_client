import { DataTypes } from 'sequelize'
import bcrypt from 'bcryptjs'
import sequelize from '../config/database.js'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // virtual field to support the frontend mapping `name` from `full_name`
  name: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.full_name
    },
    set(val) {
      this.setDataValue('full_name', val)
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim())
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // password virtual for setting
  password: {
    type: DataTypes.VIRTUAL,
    set(val) {
      this.setDataValue('password', val)
      this.setDataValue('password_hash', bcrypt.hashSync(val, 10))
    },
    validate: {
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'partner', 'operator'),
    defaultValue: 'partner',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false,
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
  underscored: true,
})

// Instance method to check password validity
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash)
}

// Ensure password_hash is not returned in queries by default
User.prototype.toJSON = function() {
  const values = { ...this.get() }
  delete values.password_hash
  return values
}

export default User
