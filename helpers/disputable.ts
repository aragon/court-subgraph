import { concat } from './bytes'
import { Agreement } from '../types/templates/DisputeManager/Agreement'
import { Disputable, Dispute } from '../types/schema'
import { crypto, Bytes, Address, BigInt } from '@graphprotocol/graph-ts'

const AGREEMENT_DISPUTE_HEADER = 'agreements:'

export function tryDecodingAgreementMetadata(dispute: Dispute): void {
  let metadata = dispute.metadata
  if (metadata.length <= AGREEMENT_DISPUTE_HEADER.length) return

  let header = metadata.subarray(0, AGREEMENT_DISPUTE_HEADER.length) as Bytes
  if (header.toString() != AGREEMENT_DISPUTE_HEADER) return

  let rawActionId = metadata.subarray(AGREEMENT_DISPUTE_HEADER.length, metadata.length) as Bytes
  let actionId = BigInt.fromSignedBytes(rawActionId.reverse() as Bytes)
  let agreement = Agreement.bind(Address.fromString(dispute.subject))
  let actionData = agreement.getAction(actionId)

  if (actionData.value4.toHexString() != '0x0000000000000000000000000000000000000000') {
    let settingData = agreement.getSetting(actionData.value3)
    let challengeData = agreement.getChallenge(actionData.value7)

    let disputable = new Disputable(buildAgreementActionId(agreement._address, actionId))
    disputable.dispute = dispute.id
    disputable.title = settingData.value0
    disputable.agreement = settingData.value1.toString()
    disputable.actionId = actionId
    disputable.disputable = actionData.value0
    disputable.disputableActionId = actionData.value1
    disputable.defendant = actionData.value4
    disputable.plaintiff = challengeData.value1
    disputable.organization = agreement.kernel()
    disputable.save()
  }
}

function buildAgreementActionId(agreement: Address, actionId: BigInt): string {
  // @ts-ignore BigInt is actually a BytesArray under the hood
  return crypto.keccak256(concat(agreement, actionId as Bytes)).toHex()
}
