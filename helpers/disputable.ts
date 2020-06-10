import { concat } from './bytes'
import { Agreement } from '../types/templates/DisputeManager/Agreement'
import { Disputable, Dispute } from '../types/schema'
import { crypto, Bytes, Address, BigInt } from '@graphprotocol/graph-ts'

const AGREEMENT_DISPUTE_HEADER = 'agreements'

export function tryDecodingAgreementMetadata(dispute: Dispute): void {
  let segments = dispute.metadata.split(':')
  if (segments.length !== 2) return
  if (segments[0] !== AGREEMENT_DISPUTE_HEADER) return

  let rawActionId = Bytes.fromHexString(`0x${segments[1]}`)
  let actionId = BigInt.fromUnsignedBytes(rawActionId.reverse() as Bytes)

  let agreement = Agreement.bind(Address.fromString(dispute.subject.toString()))
  let actionData = agreement.getAction(actionId)

  if (actionData.value4 != Address.fromHexString('0x0000000000000000000000000000000000000000')) {
    let settingData = agreement.getSetting(actionData.value3)
    let challengeData = agreement.getChallenge(actionData.value7)

    let disputable = new Disputable(buildAgreementActionId(dispute.subject, actionId))
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

function buildAgreementActionId(agreement: string, actionId: BigInt): string {
  // @ts-ignore BigInt is actually a BytesArray under the hood
  return crypto.keccak256(concat(agreement as Bytes, actionId as Bytes)).toHex()
}
