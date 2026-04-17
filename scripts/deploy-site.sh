#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${1:-jal-infra}"
REGION="${AWS_REGION:-us-east-1}"

if [[ ! -d site/dist ]]; then
  echo "Error: site/dist not found. Run 'pnpm build' first." >&2
  exit 1
fi

BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text)
DIST=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)

if [[ -z "$BUCKET" || "$BUCKET" == "None" || -z "$DIST" || "$DIST" == "None" ]]; then
  echo "Error: Could not read SiteBucketName/DistributionId from stack '$STACK_NAME' in $REGION." >&2
  exit 1
fi

echo "Bucket: $BUCKET  Distribution: $DIST"

aws s3 sync site/dist/ "s3://$BUCKET/" --delete --exclude "_astro/*" \
  --cache-control "public, max-age=60, must-revalidate"
aws s3 sync site/dist/_astro/ "s3://$BUCKET/_astro/" \
  --cache-control "public, max-age=31536000, immutable"

echo "Invalidating CloudFront..."
INVL_ID=$(aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" \
  --query 'Invalidation.Id' --output text)
echo "Invalidation $INVL_ID created; waiting for completion..."
aws cloudfront wait invalidation-completed --distribution-id "$DIST" --id "$INVL_ID"

echo "Done."
