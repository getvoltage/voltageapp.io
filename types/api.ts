import { Address4, Address6 } from 'ip-address'

export interface IDName {
    id: string
    name: string
}

export enum NodeStatus {
    creating = 'creating',
    running = 'running',
    failed = 'failed',
    unknown ='unknown',
    stopped = 'stopped',
    stopping = 'stopping',
    deleted = 'deleted',
    expired = 'expired'
}

export enum Network {
    testnet = 'testnet',
    mainnet = 'mainnet'
}

export interface Settings {
    autopilot: Boolean
    grpc: Boolean
    rest: Boolean
    tor: Boolean
    watchtower_client: Boolean
    whitelist: Address4 | Address6 []
}