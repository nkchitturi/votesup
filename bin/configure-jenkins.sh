#!/usr/bin/env bash
set -e

echo "In configure-jenkins.sh"
script_dir="$(dirname "$0")"
bin_dir="$(dirname $0)/../bin"

echo The value of arg 0 = $0
echo The value of arg 1 = $1 
echo The value of arg script_dir = $script_dir

uuid=$(date +%s)

pipeline_store_stackname=$1

VPCStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`VPCStackName`].OutputValue')"
IAMStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`IAMStackName`].OutputValue')"
DDBStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`DDBStackName`].OutputValue')"
ENIStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`ENIStackName`].OutputValue')"
MasterStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`MasterStackName`].OutputValue')"
votesup_s3_bucket=votesup-"$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`VoteSUpS3Bucket`].OutputValue')"
votesup_branch="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`Branch`].OutputValue')"
votesup_ec2_key="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`KeyName`].OutputValue')"

#prod_dns_param="pmd.oneclickdeployment.com"

my_prod_dns_param="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`ProdHostedZone`].OutputValue')"
prod_dns_param="$MasterStackName$my_prod_dns_param"
echo "The value of prod_dns_param is $prod_dns_param"

prod_dns="$(echo $prod_dns_param | sed 's/[.]$//')"

votesup_hostname=$(echo $prod_dns | cut -f 1 -d . -s)
votesup_domainname=$(echo $prod_dns | sed s/^$votesup_hostname[.]//)

echo "votesup_hostname is $votesup_hostname"
echo "votesup_domainname is $votesup_domainname"

my_domainname="$votesup_domainname."


if [ -z "$votesup_hostname" -o -z "$votesup_domainname" ]; then
    echo "Fatal: $prod_dns is an invalid hostname" >&2
    exit 1
fi

votesup_zone_id=$(aws route53 list-hosted-zones --output=text --query "HostedZones[?Name==\`${votesup_domainname}.\`].Id" | sed 's,^/hostedzone/,,')
if [ -z "$votesup_zone_id" ]; then
    echo "Fatal: unable to find Route53 zone id for $votesup_domainname." >&2
    exit 1
fi

echo "votesup_zone_id is $votesup_zone_id"

votesup_vpc_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`VPCStackName`].OutputValue')"
votesup_iam_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`IAMStackName`].OutputValue')"
votesup_ddb_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`DDBStackName`].OutputValue')"
votesup_eni_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`ENIStackName`].OutputValue')"
#votesup_eni_stack_name="ENIStack$(echo $uuid)"
jenkins_custom_action_provider_name="Jenkins$(echo $uuid)"

temp_dir=$(mktemp -d /tmp/votesup.XXXX)
config_dir="$(dirname $0)/../pipeline/jobs/xml"
config_tar_path="$MasterStackName/jenkins-job-configs-$uuid.tgz"

echo "The value of VPCStackName is $VPCStackName"
echo "The value of IAMStackName is $IAMStackName"
echo "The value of DDBStackName is $DDBStackName"
echo "The value of ENIStackName is $ENIStackName"
echo "The value of MasterStackName is $MasterStackName"
echo "The value of votesup_s3_bucket is $votesup_s3_bucket"
echo "The value of votesup_branch is $votesup_branch"
echo "The value of votesup_domainname is $votesup_domainname"
echo "The value of votesup_ec2_key is $votesup_ec2_key"
echo "The value of votesup_zone_id is $votesup_zone_id"
echo "The value of votesup_iam_stack_name is $votesup_iam_stack_name"
echo "The value of votesup_ddb_stack_name is $votesup_ddb_stack_name"
echo "The value of votesup_eni_stack_name is $votesup_eni_stack_name"
echo "The value of jenkins_custom_action_provider_name is $jenkins_custom_action_provider_name"
echo "The value of votesup_eni_stack_name is $votesup_eni_stack_name"
echo "The value of my_domainname is $my_domainname"

eni_subnet_id="$(aws cloudformation describe-stacks --stack-name $votesup_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"

echo "The value of eni_subnet_id is $eni_subnet_id"

cp -r $config_dir/* $temp_dir/
pushd $temp_dir > /dev/null
for f in */config.xml; do
    sed s/VoteSUpJenkins/$jenkins_custom_action_provider_name/ $f > $f.new && mv $f.new $f
done
sed s/S3BUCKET_PLACEHOLDER/$votesup_s3_bucket/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/BRANCH_PLACEHOLDER/$votesup_branch/ kickoff/config.xml > kickoff/config.xml.new && mv kickoff/config.xml.new kickoff/config.xml
sed s/VPC_PLACEHOLDER/$votesup_vpc_stack_name/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/IAM_PLACEHOLDER/$votesup_iam_stack_name/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/DDB_PLACEHOLDER/$votesup_ddb_stack_name/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/ENI_PLACEHOLDER/$votesup_eni_stack_name/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/KEY_PLACEHOLDER/$votesup_ec2_key/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/HOSTNAME_PLACEHOLDER/$votesup_hostname/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/DOMAINNAME_PLACEHOLDER/$votesup_domainname/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/ZONE_ID_PLACEHOLDER/$votesup_zone_id/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml
sed s/ACTION_PROVIDER_PLACEHOLDER/$jenkins_custom_action_provider_name/ vote-build/config.xml > vote-build/config.xml.new && mv vote-build/config.xml.new vote-build/config.xml

tar czf job-configs.tgz *
aws s3 cp job-configs.tgz s3://$votesup_s3_bucket/$config_tar_path
popd > /dev/null
rm -rf $temp_dir

if ! aws s3 ls s3://$votesup_s3_bucket/$config_tar_path; then
    echo "Fatal: Unable to upload Jenkins job configs to s3://$votesup_s3_bucket/$config_tar_path" >&2
    exit 1
fi

aws cloudformation update-stack \
    --stack-name $pipeline_store_stackname \
    --use-previous-template \
    --capabilities="CAPABILITY_IAM" \
    --parameters ParameterKey=UUID,ParameterValue=$uuid \
        ParameterKey=VoteSUpS3Bucket,ParameterValue=$votesup_s3_bucket \
        ParameterKey=Branch,ParameterValue=$votesup_branch \
        ParameterKey=MasterStackName,ParameterValue=$MasterStackName \
        ParameterKey=JobConfigsTarball,ParameterValue=$config_tar_path \
        ParameterKey=Hostname,ParameterValue=$votesup_hostname \
        ParameterKey=Domain,ParameterValue=$my_domainname \
        ParameterKey=MyBuildProvider,ParameterValue=$jenkins_custom_action_provider_name \
        ParameterKey=ProdHostedZone,ParameterValue=$prod_dns_param \
        ParameterKey=VPCStackName,ParameterValue=$VPCStackName \
        ParameterKey=IAMStackName,ParameterValue=$IAMStackName \
        ParameterKey=DDBStackName,ParameterValue=$DDBStackName \
        ParameterKey=ENIStackName,ParameterValue=$votesup_eni_stack_name \
        ParameterKey=VoteSUpAppURL,ParameterValue=$prod_dns_param \
        ParameterKey=KeyName,ParameterValue=$votesup_ec2_key
 
sleep 60

