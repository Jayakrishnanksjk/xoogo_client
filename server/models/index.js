import sequelize from '../config/database.js'
import User from './User.js'
import Group from './Group.js'
import Route from './Route.js'
import Bus from './Bus.js'
import Stop from './Stop.js'
import BusAssignment from './BusAssignment.js'
import HistoricalEta from './HistoricalEta.js'
import EventLog from './EventLog.js'

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
  foreignKey: 'ownerId',
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

// Transit specific associations
Route.hasMany(Stop, { foreignKey: 'route_id', as: 'stops', onDelete: 'CASCADE' })
Stop.belongsTo(Route, { foreignKey: 'route_id', as: 'route' })

Bus.hasMany(BusAssignment, { foreignKey: 'bus_id', as: 'assignments', onDelete: 'CASCADE' })
BusAssignment.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' })

Stop.hasMany(BusAssignment, { foreignKey: 'stop_id', as: 'assignments', onDelete: 'CASCADE' })
BusAssignment.belongsTo(Stop, { foreignKey: 'stop_id', as: 'stop' })

Stop.hasMany(HistoricalEta, { foreignKey: 'from_stop_id', as: 'etasFrom', onDelete: 'CASCADE' })
Stop.hasMany(HistoricalEta, { foreignKey: 'to_stop_id', as: 'etasTo', onDelete: 'CASCADE' })
HistoricalEta.belongsTo(Stop, { foreignKey: 'from_stop_id', as: 'fromStop' })
HistoricalEta.belongsTo(Stop, { foreignKey: 'to_stop_id', as: 'toStop' })

Bus.hasMany(EventLog, { foreignKey: 'bus_id', as: 'events', onDelete: 'CASCADE' })
EventLog.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' })

export {
  sequelize,
  User,
  Group,
  Route,
  Bus,
  Stop,
  BusAssignment,
  HistoricalEta,
  EventLog,
}
