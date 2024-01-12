import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "sequelize/types/sequelize";

interface BlockModel extends Model {
    id: number
    index: number
    nonce: number
    mekleRoot: string
    prevHash: string
    timestamp: number
}

interface TransactionModel extends Model {
    id: number
    sign: string
    from: string
    to: string
    amount: number
    data: string
    timestamp: number
}

export function initDB(seqOpts: any) {
    let db = new Sequelize(seqOpts)

    let block = db.define<BlockModel>("Block", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true
        },
        index: DataTypes.INTEGER.UNSIGNED,
        nonce: DataTypes.INTEGER.UNSIGNED,
        mekleRoot: DataTypes.STRING,
        prevHash: DataTypes.STRING,
        timestamp: DataTypes.INTEGER.UNSIGNED
    })

    let transaction = db.define<TransactionModel>("Transaction", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true
        },
        sign: DataTypes.STRING,
        from: DataTypes.STRING,
        to: DataTypes.STRING,
        amount: DataTypes.FLOAT,
        data: DataTypes.STRING,
        timestamp: DataTypes.INTEGER.UNSIGNED
    })

    block.hasMany(transaction)
    transaction.hasOne(block)

    return db
}