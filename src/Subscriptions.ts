import { Address, BigInt } from '@graphprotocol/graph-ts'
import { createFeeMovement } from './Treasury'
import { JurorSubscriptionFee, SubscriptionModule, SubscriptionPeriod } from '../types/schema'
import {
  Subscriptions,
  FeesClaimed,
  FeeTokenChanged,
} from '../types/templates/Subscriptions/Subscriptions'

let SUBSCRIPTIONS = 'Subscriptions'

export function handleJurorFeesClaimed(event: FeesClaimed): void {
  createFeeMovement(SUBSCRIPTIONS, event.params.juror, event.params.jurorShare, event)
  createJurorSubscriptionFee(event.params.juror, event.params.periodId, event.params.jurorShare)
}

export function handleFeeTokenChanged(event: FeeTokenChanged): void {
  let subscriptions = SubscriptionModule.load(event.address.toHexString())
  subscriptions.feeToken = event.params.currentFeeToken
  subscriptions.save()
}

export function updateCurrentSubscriptionPeriod(module: Address, timestamp: BigInt): void {
  let subscriptions = Subscriptions.bind(module)
  let periodId = subscriptions.getCurrentPeriodId()

  let subscriptionsModule = loadOrCreateModule(module)
  subscriptionsModule.currentPeriod = periodId
  subscriptionsModule.save()

  let period = loadOrCreateSubscriptionPeriod(periodId, timestamp)
  let currentPeriod = subscriptions.getPeriod(periodId)
  period.instance = module.toHexString()
  period.balanceCheckpoint = currentPeriod.value0
  period.feeToken = currentPeriod.value1
  period.totalActiveBalance = currentPeriod.value2
  period.donatedFees = currentPeriod.value3
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

function createJurorSubscriptionFee(juror: Address, periodId: BigInt, jurorShare: BigInt): void {
  let feeId = buildJurorSubscriptionFeeId(juror, periodId)
  let fee = new JurorSubscriptionFee(feeId)
  fee.juror = juror.toHexString()
  fee.period = periodId.toString()
  fee.amount = jurorShare
  fee.save()
}

function loadOrCreateModule(address: Address): SubscriptionModule {
  let subscriptionModule = SubscriptionModule.load(address.toHexString())

  if (subscriptionModule === null) {
    subscriptionModule = new SubscriptionModule(address.toHexString())
    let subscriptions = Subscriptions.bind(address)
    subscriptionModule.court = subscriptions.getController().toHexString()
    subscriptionModule.currentPeriod = BigInt.fromI32(0)
    subscriptionModule.feeToken = subscriptions.currentFeeToken()
    subscriptionModule.periodDuration = subscriptions.periodDuration()
  }

  return subscriptionModule!
}

function buildJurorSubscriptionFeeId(juror: Address, periodId: BigInt): string {
  return juror.toHexString().concat(periodId.toString())
}
