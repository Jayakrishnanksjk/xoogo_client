import sequelize from '../config/database.js'
import User from './User.js'
import Group from './Group.js'
import Route from './Route.js'
import Bus from './Bus.js'

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

Group.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
  onDelete: 'SET NULL',
  constraints: false,
})

Group.hasMany(Bus, {
  foreignKey: 'group_id',
  as: 'buses',
  onDelete: 'CASCADE',
})

Bus.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group',
})

Route.hasMany(Bus, {
  foreignKey: 'route_id',
  as: 'buses',
  onDelete: 'SET NULL',
})

Bus.belongsTo(Route, {
  foreignKey: 'route_id',
  as: 'route',
})

export {
  sequelize,
  User,
  Group,
  Route,
  Bus,
}
