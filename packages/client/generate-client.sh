#!/bin/bash
set -o pipefail
set -o nounset
set -ex

PROTO_DIR="../../video/protobuf"
OUT_DIR="src/gen"

echo "Begin generating protobuf client"
rm -rf $OUT_DIR && mkdir -p $OUT_DIR

# for the full list of available opts, see: https://github.com/timostamm/protobuf-ts/blob/master/MANUAL.md
npx protoc \
  --ts_out $OUT_DIR \
  --ts_opt long_type_string \
  --ts_opt generate_dependencies \
  --ts_opt client_generic \
  --ts_opt server_none \
  --ts_opt eslint_disable \
  --proto_path $PROTO_DIR \
  $PROTO_DIR/client_v1_rpc/client_rpc.proto $PROTO_DIR/event_v1/event.proto

echo "Finished generating protobuf client"
