module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define(
        "users",
        {
            employee_id: {
                type: DataTypes.STRING(50),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            phone: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            role: {
                type: DataTypes.ENUM("EMPLOYEE", "DOCTOR", "TECHNICIAN", "ADMIN"),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW
              },
            last_login: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW
            },
            department: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            first_login: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: true,
            },
            status: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            refer_hospital: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            blood: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },
            dob: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
        },
        {
            tableName: "users",
            timestamps: false,
        }
    );

    Users.associate = (models) => {
        Users.hasMany(models.family_members, {
            foreignKey: "employee_id",
            as: "family",
        });
    };

    return Users;
};