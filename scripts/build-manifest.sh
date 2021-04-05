#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Court known addresses
court_ropsten=
court_staging=
court_rinkeby=0x35e7433141D5f7f2EB7081186f5284dCDD2ccacE
court_mainnet=

# Known block numbers
start_block_ropsten=
start_block_staging=
start_block_rinkeby=8250225
start_block_mainnet=

# Validate network
networks=(rpc ropsten staging rinkeby mainnet)
if [[ -z $NETWORK || ! " ${networks[@]} " =~ " ${NETWORK} " ]]; then
  echo 'Please make sure the network provided is either rpc, ropsten, staging, rinkeby, or mainnet.'
  exit 1
fi

# Use mainnet network in case of local deployment
if [[ "$NETWORK" = "rpc" ]]; then
  ENV='mainnet'
elif [[ "$NETWORK" = "staging" ]]; then
  ENV='rinkeby'
else
  ENV=${NETWORK}
fi

# Load start block
if [[ -z $START_BLOCK ]]; then
  START_BLOCK_VAR=start_block_$NETWORK
  START_BLOCK=${!START_BLOCK_VAR}
fi
if [[ -z $START_BLOCK ]]; then
  START_BLOCK=0
fi

# Try loading Court address if missing
if [[ -z $COURT ]]; then
  COURT_VAR=court_$NETWORK
  COURT=${!COURT_VAR}
fi

# Validate court address
if [[ -z $COURT ]]; then
  echo 'Please make sure a Court address is provided'
  exit 1
fi

# Remove previous subgraph if there is any
if [ -f subgraph.yaml ]; then
  echo 'Removing previous subgraph manifest...'
  rm subgraph.yaml
fi

# Build subgraph manifest for requested variables
echo "Preparing new subgraph for Court address ${COURT} to network ${NETWORK}"
cp subgraph.template.yaml subgraph.yaml
sed -i -e "s/{{network}}/${ENV}/g" subgraph.yaml
sed -i -e "s/{{court}}/${COURT}/g" subgraph.yaml
sed -i -e "s/{{startBlock}}/${START_BLOCK}/g" subgraph.yaml
rm -f subgraph.yaml-e