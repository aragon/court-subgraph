import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
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

  let previousPeriodId = periodId.equals(BigInt.fromI32(0)) ? periodId: periodId.minus(BigInt.fromI32(1))
  let period = loadOrCreateSubscriptionPeriod(previousPeriodId, module, timestamp)
  let previousPeriod = subscriptions.try_getPeriod(previousPeriodId)
  if (previousPeriod.reverted) {
    return
  }

  period.balanceCheckpoint = previousPeriod.value.value0
  period.feeToken = previousPeriod.value.value1
  period.totalActiveBalance = previousPeriod.value.value2
  period.donatedFees = previousPeriod.value.value3
  period.save()
}

function loadOrCreateSubscriptionPeriod(periodId: BigInt, instance: Address, timestamp: BigInt): SubscriptionPeriod | null {
  let id = periodId.toString()
  let period = SubscriptionPeriod.load(id)

  if (period === null) {
    period = new SubscriptionPeriod(id)
    period.feeToken = Bytes.fromHexString("0x")
    period.donatedFees = BigInt.fromI32(0)
    period.totalActiveBalance = BigInt.fromI32(0)
    period.instance = instance.toHexString()
    period.createdAt = timestamp
  }

  period.save()
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
