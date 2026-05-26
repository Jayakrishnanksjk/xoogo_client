import sequelize from '../config/database.js'
import User from './User.js'
import Group from './Group.js'

// Setup associations
Group.hasMany(User, {
  foreignKey: 'group_id',
  as: 'users',
  onDelete: 'SET NULL',
})

User.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group',
})

export {
  sequelize,
  User,
  Group,
}
