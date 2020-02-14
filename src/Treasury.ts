import { buildId } from '../helpers/id'
import { FeeMovement, JurorTreasuryToken } from '../types/schema'
import { FeesClaimed, Subscriptions } from '../types/templates/Subscriptions/Subscriptions'
import { Assign, Withdraw, Treasury } from '../types/templates/Treasury/Treasury'
import { crypto, Address, ByteArray, EthereumEvent } from '@graphprotocol/graph-ts'

let ASSIGN = 'Assign'
let WITHDRAW = 'Withdraw'
let SUBSCRIPTIONS = 'Subscriptions'

export function handleAssign(event: Assign): void {
  let id = buildId(event)
  let movement = new FeeMovement(id)
  movement.type = ASSIGN
  movement.juror = event.params.to.toHex()
  movement.amount = event.params.amount
  movement.createdAt = event.block.timestamp
  movement.save()
  updateJurorToken(event.params.token, event.params.to, event)
}

export function handleWithdraw(event: Withdraw): void {
  let id = buildId(event)
  let movement = new FeeMovement(id)
  movement.type = WITHDRAW
  movement.juror = event.params.to.toHex()
  movement.amount = event.params.amount
  movement.createdAt = event.block.timestamp
  movement.save()
  updateJurorToken(event.params.token, event.params.to, event)
}

export function handleSubscriptionPaid(event: FeesClaimed): void {
  let id = buildId(event)
  let movement = new FeeMovement(id)
  movement.type = SUBSCRIPTIONS
  movement.juror = event.params.juror.toHex()
  movement.amount = event.params.jurorShare
  movement.createdAt = event.block.timestamp
  movement.save()
  let subscriptions = Subscriptions.bind(event.address)
  // TODO: it won't work if there's a token change after the event!!
  // let token = subscriptions.getPeriod(event.params.periodId)
  let periodDetails = subscriptions.getCurrentPeriod()
  let token = periodDetails.value0
  updateJurorToken(token, event.params.juror, event)
}

function updateJurorToken(token: Address, juror: Address, event: EthereumEvent): void {
  let jurorToken = loadOrCreateJurorToken(token, juror)
  let treasury = Treasury.bind(event.address)
  let balance = treasury.balanceOf(token, juror)
  jurorToken.balance = balance
  jurorToken.save()
}

function loadOrCreateJurorToken(token: Address, juror: Address): JurorTreasuryToken | null {
  let id = buildJurorTokenId(token, juror)
  let jurorToken = JurorTreasuryToken.load(id)

  if (jurorToken === null) {
    jurorToken = new JurorTreasuryToken(id)
    jurorToken.token = token.toHex()
    jurorToken.juror = juror.toHex()
  }

  return jurorToken
}

function buildJurorTokenId(token: Address, juror: Address): string {
  return crypto.keccak256(concat(token, juror)).toHex()
}

function concat(a: ByteArray, b: ByteArray): ByteArray {
  let out = new Uint8Array(a.length + b.length)
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i]
  }
  for (let j = 0; j < b.length; j++) {
    out[a.length + j] = b[j]
  }
  return out as ByteArray
}
