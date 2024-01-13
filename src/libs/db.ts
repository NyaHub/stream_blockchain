import { DataTypes, Model, Sequelize } from "sequelize";

export interface BlockModel extends Model {
    id: number
    index: number
    nonce: number
    merkleRoot: string
    prevHash: string
    timestamp: number
    hash: string
}

export interface TransactionModel extends Model {
    id: number
    sign: string
    from: string
    to: string
    amount: number
    fee: number
    data: string
    timestamp: number
    hash: string
    seed: number
}

export function initDB(seqOpts: any) {
    let db = new Sequelize(seqOpts)

    let block = db.define<BlockModel>("Block", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        index: {
            type: DataTypes.INTEGER.UNSIGNED,
            unique: true
        },
        nonce: DataTypes.INTEGER.UNSIGNED,
        merkleRoot: DataTypes.STRING,
        prevHash: DataTypes.STRING,
        timestamp: DataTypes.INTEGER.UNSIGNED,
        hash: {
            type: DataTypes.STRING,
            unique: true
        }
    })

    let transaction = db.define<TransactionModel>("Transaction", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sign: DataTypes.STRING,
        from: DataTypes.STRING,
        to: DataTypes.STRING,
        amount: DataTypes.FLOAT,
        fee: DataTypes.FLOAT,
        data: DataTypes.STRING,
        timestamp: DataTypes.INTEGER.UNSIGNED,
        hash: {
            type: DataTypes.STRING,
            unique: true
        },
        seed: DataTypes.INTEGER
    })

    block.hasMany(transaction)
    transaction.belongsTo(block)

    return db
}