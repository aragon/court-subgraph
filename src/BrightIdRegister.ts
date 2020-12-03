import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Juror } from '../types/schema'
import { BrightIdRegister as BrightIdRegisterContract } from '../types/AragonCourt/BrightIdRegister'
import {
  Register,
} from '../types/templates/BrightIdRegister/BrightIdRegister'

export function handleUserRegistered(event: Register): void {
  updateJuror(event.params.sender, event)
}

function loadOrCreateJuror(jurorAddress: Address, event: ethereum.Event): Juror | null {
  let id = jurorAddress.toHexString()
  let juror = Juror.load(id)

  if (juror === null) {
    juror = new Juror(id)
    juror.createdAt = event.block.timestamp
    juror.withdrawalsLockTermId = BigInt.fromI32(0)
    juror.activeBalance = BigInt.fromI32(0)
    juror.availableBalance = BigInt.fromI32(0)
    juror.lockedBalance = BigInt.fromI32(0)
    juror.deactivationBalance = BigInt.fromI32(0)
    juror.treeId = BigInt.fromI32(0)

  }

  return juror
}

function updateJuror(jurorAddress: Address, event: ethereum.Event): Juror | null {
  let juror = loadOrCreateJuror(jurorAddress, event)

  let brightIdRegister = BrightIdRegisterContract.bind(event.address)
  let userRegistration = brightIdRegister.userRegistrations(jurorAddress) 
  juror.uniqueUserId = userRegistration.value0 
  juror.registerTime = userRegistration.value1
  juror.addressVoided = userRegistration.value2 

  juror.save()

  return juror
}