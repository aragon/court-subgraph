import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { createFeeMovement } from './Treasury'
import { JurorSubscriptionFee, SubscriptionModule, SubscriptionPeriod, AppFee, SubscriptionToken } from '../types/schema'
import {
  Subscriptions,
  FeesPaid,
  FeesClaimed,
  FeesDonated,
  FeeAmountChanged,
  FeeTokenChanged,
  GovernorSharePctChanged,
  AppFeeSet,
  AppFeeUnset,
  AppFeePaid,
} from '../types/templates/Subscriptions/Subscriptions'

let SUBSCRIPTIONS = 'Subscriptions'

export function handleJurorFeesClaimed(event: FeesClaimed): void {
  createFeeMovement(SUBSCRIPTIONS, event.params.juror, event.params.jurorShare, event)

  let feeId = buildJurorSubscriptionFeeId(event.params.juror, event.params.periodId)
  let fee = new JurorSubscriptionFee(feeId)
  fee.juror = event.params.juror.toHex()
  fee.period = event.params.periodId.toString()
  fee.amount = event.params.jurorShare
  fee.save()
}

export function handleFeesPaid(event: FeesPaid): void {
  let token = loadOrCreateToken(event.params.feeToken, event.address)
  token.totalPaid = token.totalPaid.plus(event.params.feeAmount)
  token.totalCollected = token.totalCollected.plus(event.params.feeAmount)
  token.save()

  updateCurrentSubscriptionPeriod(event.address, event.block.timestamp)
}

export function handleFeesDonated(event: FeesDonated): void {
  let token = loadOrCreateToken(event.params.feeToken, event.address)
  token.totalDonated = token.totalDonated.plus(event.params.feeAmount)
  token.totalCollected = token.totalCollected.plus(event.params.feeAmount)
  token.save()

  updateCurrentSubscriptionPeriod(event.address, event.block.timestamp)
}

export function handleFeeTokenChanged(event: FeeTokenChanged): void {
  let subscriptions = SubscriptionModule.load(event.address.toHex())
  subscriptions.feeToken = event.params.currentFeeToken
  subscriptions.save()
}

export function handleFeeAmountChanged(event: FeeAmountChanged): void {
  let subscriptions = SubscriptionModule.load(event.address.toHex())
  subscriptions.feeAmount = event.params.currentFeeAmount
  subscriptions.save()
}

export function handleGovernorSharePctChanged(event: GovernorSharePctChanged): void {
  let subscriptions = SubscriptionModule.load(event.address.toHex())
  subscriptions.governorSharePct = BigInt.fromI32(event.params.currentGovernorSharePct)
  subscriptions.save()
}

export function handleAppFeeSet(event: AppFeeSet): void {
  let appFee = loadOrCreateAppFee(event.params.appId)
  appFee.isSet = true
  appFee.amount = event.params.amount
  appFee.instance = event.address.toHex()
  appFee.save()
}

export function handleAppFeeUnset(event: AppFeeUnset): void {
  let appFee = AppFee.load(event.params.appId.toString())

  if (appFee === null) {
    return
  }
  appFee.isSet = false
  appFee.amount = BigInt.fromI32(0)
  appFee.save()
}

export function handleAppFeePaid(event: AppFeePaid): void {
  let appFee = AppFee.load(event.params.appId.toString())

  if (appFee === null) {
    return
  }

  let subscriptions = Subscriptions.bind(event.address)
  let feeToken = subscriptions.currentFeeToken()
  let token = loadOrCreateToken(feeToken, event.address)
  token.totalAppPaid = token.totalAppPaid.plus(appFee.amount)
  token.totalCollected = token.totalCollected.plus(appFee.amount)
  token.save()

  updateCurrentSubscriptionPeriod(event.address, event.block.timestamp)
}

export function updateCurrentSubscriptionPeriod(module: Address, timestamp: BigInt): void {
  let subscriptions = Subscriptions.bind(module)
  let periodId = subscriptions.getCurrentPeriodId()

  let subscriptionsModule = SubscriptionModule.load(module.toHex())
  subscriptionsModule.currentPeriod = periodId
  subscriptionsModule.save()

  let currentPeriod = subscriptions.getPeriod(periodId)
  let period = loadOrCreateSubscriptionPeriod(periodId, timestamp)
  period.instance = module.toHex()
  period.feeToken = currentPeriod.value0
  period.feeAmount = currentPeriod.value1
  period.collectedFees = currentPeriod.value4
  period.accumulatedGovernorFees = currentPeriod.value5
  period.save()
}

function loadOrCreateSubscriptionPeriod(periodId: BigInt, timestamp: BigInt): SubscriptionPeriod | null {
  let id = periodId.toString()
  let period = SubscriptionPeriod.load(id)

  if (period === null) {
    period = new SubscriptionPeriod(id)
    period.createdAt = timestamp
  }

  return period
}

function loadOrCreateToken(tokenAddress: Address, subscriptions: Address): SubscriptionToken | null {
  let id = buildSubscrptionTokenId(subscriptions, tokenAddress)
  let token = SubscriptionToken.load(id)

  if (token === null) {
    token = new SubscriptionToken(id)
    token.totalDonated = BigInt.fromI32(0)
    token.totalPaid = BigInt.fromI32(0)
    token.totalAppPaid = BigInt.fromI32(0)
    token.totalCollected = BigInt.fromI32(0)
    token.totalGovernorShares = BigInt.fromI32(0)
    token.instance = subscriptions.toHex()
    token.token = tokenAddress.toHex()
  }

  return token
}

function loadOrCreateAppFee(appId: Bytes): AppFee | null {
  let id = appId.toString()
  let appFee = AppFee.load(id)

  if (appFee === null) {
    appFee = new AppFee(id)
  }

  return appFee
}

function buildJurorSubscriptionFeeId(juror: Address, periodId: BigInt): string {
  return juror.toHex().concat(periodId.toString())
}

function buildSubscrptionTokenId(subscriptions: Address, token: Address): string {
  return subscriptions.toHex().concat(token.toHex())
}
