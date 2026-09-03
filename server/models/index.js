import sequelize from '../config/database.js'
import User from './User.js'
import Group from './Group.js'
import Route from './Route.js'
import Schedule from './Schedule.js'
import ScheduleRoute from './ScheduleRoute.js'
import Bus from './Bus.js'
import Stop from './Stop.js'
import BusAssignment from './BusAssignment.js'
import BusSchedule from './BusSchedule.js'
import HistoricalEta from './HistoricalEta.js'
import EventLog from './EventLog.js'
import BrandSetting from './BrandSetting.js'
import BusApiKey from './BusApiKey.js'
import RouteStop from './RouteStop.js'

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

// Transit specific associations - legacy one-to-many kept for migration compatibility
Route.hasMany(Stop, { foreignKey: 'route_id', as: 'legacyStops', onDelete: 'CASCADE' })
Stop.belongsTo(Route, { foreignKey: 'route_id', as: 'route' })

Route.belongsToMany(Stop, { through: RouteStop, foreignKey: 'route_id', otherKey: 'stop_id', as: 'stops' })
Stop.belongsToMany(Route, { through: RouteStop, foreignKey: 'stop_id', otherKey: 'route_id', as: 'routes' })

Route.hasMany(RouteStop, { foreignKey: 'route_id', as: 'routeStops', onDelete: 'CASCADE' })
RouteStop.belongsTo(Route, { foreignKey: 'route_id', as: 'route' })
Stop.hasMany(RouteStop, { foreignKey: 'stop_id', as: 'routeStops', onDelete: 'CASCADE' })
RouteStop.belongsTo(Stop, { foreignKey: 'stop_id', as: 'stop' })

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

// Schedule associations
Schedule.hasMany(ScheduleRoute, { foreignKey: 'schedule_id', as: 'scheduleRoutes', onDelete: 'CASCADE' })
ScheduleRoute.belongsTo(Schedule, { foreignKey: 'schedule_id', as: 'schedule' })

Route.hasMany(ScheduleRoute, { foreignKey: 'route_id', as: 'scheduleRoutes', onDelete: 'CASCADE' })
ScheduleRoute.belongsTo(Route, { foreignKey: 'route_id', as: 'route' })

Bus.belongsToMany(Schedule, { through: BusSchedule, foreignKey: 'bus_id', otherKey: 'schedule_id', as: 'schedules' })
Schedule.belongsToMany(Bus, { through: BusSchedule, foreignKey: 'schedule_id', otherKey: 'bus_id', as: 'buses' })

Bus.hasMany(BusApiKey, { foreignKey: 'bus_id', as: 'apiKeys', onDelete: 'CASCADE' })
BusApiKey.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' })

export {
  sequelize,
  User,
  Group,
  Route,
  Bus,
  Stop,
  RouteStop,
  BusAssignment,
  HistoricalEta,
  EventLog,
  Schedule,
  ScheduleRoute,
  BusSchedule,
  BrandSetting,
  BusApiKey,
}
