#!/usr/bin/env node

const fs = require('fs')
const network = process.argv[2]
const blacklistedModules = require('../blacklisted-modules')[network]

console.log(`Blacklisting modules: ${blacklistedModules}`)

const parsedModules = `export const BLACKLISTED_MODULES: string[] = [${blacklistedModules.map(x => `"${x}"`).join(', ')}]`

fs.writeFileSync(`${process.cwd()}/helpers/blacklisted-modules.ts`, parsedModules)
