module.exports = (sequelize, DataTypes) => {
    const ClinicNote = sequelize.define('employee_clinicnotes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      notes_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    }, {
      tableName: 'employee_clinicnotes',
      timestamps: false, 
      underscored: true,
    });
  
    return ClinicNote;
  };
  