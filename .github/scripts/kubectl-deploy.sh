#!/bin/sh

SUBGRAPH_NAME="$1"

SUBGRAPH_ID=$(grep "Build completed:" .github/scripts/deploy-output.txt | grep -oE "Qm[a-zA-Z0-9]{44}")
rm .github/scripts/deploy-output.txt

if [ -z "$SUBGRAPH_ID" ]; then
  echo "Could not find subgraph ID in deploy output, skipping Aragon infra deployment."
else
  echo "Creating ${SUBGRAPH_NAME} ..."
  kubectl exec graph-shell -- create aragon/${SUBGRAPH_NAME}
  echo "Deploying ${SUBGRAPH_ID} ..."
  kubectl exec graph-shell -- deploy aragon/${SUBGRAPH_NAME} ${SUBGRAPH_ID} graph_index_node_0
fi
