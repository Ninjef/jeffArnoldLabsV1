#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${1:-jal-infra}"
REGION="${AWS_REGION:-us-east-1}"

BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text)
DIST=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)

echo "Bucket: $BUCKET  Distribution: $DIST"

aws s3 sync site/dist/ "s3://$BUCKET/" --delete --exclude "_astro/*" \
  --cache-control "public, max-age=60, must-revalidate"
aws s3 sync site/dist/_astro/ "s3://$BUCKET/_astro/" \
  --cache-control "public, max-age=31536000, immutable"

echo "Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" --output text

echo "Done."
