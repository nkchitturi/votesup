#!/bin/bash
. /etc/profile
set -ex

npm install
gulp unit-test
