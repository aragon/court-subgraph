import { Evidence } from '../types/schema'
import { EthereumEvent, Bytes, BigInt, Address } from '@graphprotocol/graph-ts'
import { EvidenceSubmitted as EvidenceSubmittedWithoutArbitrator, EvidenceSubmitted1 as EvidenceSubmittedWithArbitrator } from '../types/templates/Arbitrable/Arbitrable'

export function handleEvidenceSubmittedWithoutArbitrator(event: EvidenceSubmittedWithoutArbitrator): void {
  handleEvidenceSubmitted(event, event.params.disputeId, event.params.evidence, event.params.submitter)
}

export function handleEvidenceSubmittedWithArbitrator(event: EvidenceSubmittedWithArbitrator): void {
  handleEvidenceSubmitted(event, event.params.disputeId, event.params.evidence, event.params.submitter)
}

function handleEvidenceSubmitted(event: EthereumEvent, disputeId: BigInt, data: Bytes, submitter: Address): void {
  let id = event.transaction.hash.toHex() + event.logIndex.toHex()
  let evidence = new Evidence(id)
  evidence.arbitrable = event.address.toHex()
  evidence.dispute = disputeId.toString()
  evidence.data = data
  evidence.submitter = submitter
  evidence.createdAt = event.block.timestamp
  evidence.save()
}
