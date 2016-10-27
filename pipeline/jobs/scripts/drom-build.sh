#!/bin/bash
. /etc/profile
set -ex

# setup environment.sh
if [ -n "$AWS_DEFAULT_REGION" ]; then
    echo "export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION" > environment.sh
else
    echo "export AWS_DEFAULT_REGION=us-east-1" > environment.sh
fi
echo "export votesup_s3_bucket=$VOTESUP_S3_BUCKET" >> environment.sh
echo "export votesup_vpc_stack_name=$VOTESUP_VPC_STACK" >> environment.sh
echo "export votesup_iam_stack_name=$VOTESUP_IAM_STACK" >> environment.sh
echo "export votesup_ddb_stack_name=$VOTESUP_DDB_STACK" >> environment.sh
echo "export votesup_eni_stack_name=$VOTESUP_ENI_STACK" >> environment.sh
echo "export votesup_ec2_key=$VOTESUP_EC2_KEY" >> environment.sh
echo "export votesup_hostname=$VOTESUP_HOSTNAME" >> environment.sh
echo "export votesup_domainname=$VOTESUP_DOMAINNAME" >> environment.sh
echo "export votesup_zone_id=$VOTESUP_ZONE_ID" >> environment.sh
echo "export votesup_artifact=dromedary-$(date +%Y%m%d-%H%M%S).tar.gz" >> environment.sh
echo "export votesup_custom_action_provider=$VOTESUP_ACTION_PROVIDER" >> environment.sh

. environment.sh

# since the workspace is maintained throughout the build,
# install dependencies now in a clear workspace
rm -rf node_modules dist
npm install

# build and upload artifact
gulp dist
aws s3 cp dist/archive.tar.gz s3://$votesup_s3_bucket/$votesup_artifact
