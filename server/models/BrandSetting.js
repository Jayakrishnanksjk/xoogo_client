import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const BrandSetting = sequelize.define('BrandSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  primary_color: {
    type: DataTypes.STRING,
    defaultValue: '#2563EB',
    allowNull: false,
  },
  brand_light: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6',
    allowNull: false,
  },
  brand_dark: {
    type: DataTypes.STRING,
    defaultValue: '#1D4ED8',
    allowNull: false,
  },
  sidebar_bg: {
    type: DataTypes.STRING,
    defaultValue: '#0F172A',
    allowNull: false,
  },
  sidebar_active: {
    type: DataTypes.STRING,
    defaultValue: '#1E293B',
    allowNull: false,
  },
  sidebar_hover: {
    type: DataTypes.STRING,
    defaultValue: '#1E293B',
    allowNull: false,
  },
}, {
  timestamps: true,
  underscored: true,
  tableName: 'brand_settings',
})

export default BrandSetting
