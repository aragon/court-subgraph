# Note: URL must not contain a protocol (http://)
wait-for-it --timeout=30 ${GRAPH_NODE#http://}

# TODO: Run truffle to create blockchain state
# Note: Mock address
export COURT=0x2E645469f354BB4F5c8a05B3b30A929361cf77eC

# Deploy subgraph
npm run deploy:rpc

# TODO: Query $GRAPHQL_SERVER with a GraphQL client
