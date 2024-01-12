"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = void 0;
const sequelize_1 = require("sequelize");
function initDB(seqOpts) {
    let db = new sequelize_1.Sequelize(seqOpts);
    let block = db.define("Block", {
        id: {
            type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
            primaryKey: true
        },
        index: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        nonce: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        mekleRoot: sequelize_1.DataTypes.STRING,
        prevHash: sequelize_1.DataTypes.STRING,
        timestamp: sequelize_1.DataTypes.INTEGER.UNSIGNED
    });
    let transaction = db.define("Transaction", {
        id: {
            type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
            primaryKey: true
        },
        sign: sequelize_1.DataTypes.STRING,
        from: sequelize_1.DataTypes.STRING,
        to: sequelize_1.DataTypes.STRING,
        amount: sequelize_1.DataTypes.FLOAT,
        data: sequelize_1.DataTypes.STRING,
        timestamp: sequelize_1.DataTypes.INTEGER.UNSIGNED
    });
    block.hasMany(transaction);
    transaction.hasOne(block);
    return db;
}
exports.initDB = initDB;
