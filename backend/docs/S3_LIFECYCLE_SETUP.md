# AWS S3 Lifecycle Policy Setup

This document explains how to set up S3 lifecycle policies for automatic file deletion after 24 hours.

## Prerequisites

- AWS account with S3 access
- S3 bucket created (e.g., `resume-analyzer-uploads`)
- AWS CLI installed (optional, for command-line setup)

## Setup via AWS Console

1. **Navigate to S3 Console**
   - Go to https://console.aws.amazon.com/s3/
   - Select your bucket (e.g., `resume-analyzer-uploads`)

2. **Create Lifecycle Rule**
   - Click on the "Management" tab
   - Click "Create lifecycle rule"

3. **Configure Rule**
   - **Rule name**: `delete-resumes-after-24-hours`
   - **Choose rule scope**: Apply to all objects in the bucket (or specify prefix `resumes/`)
   - **Lifecycle rule actions**: Check "Expire current versions of objects"
   - **Days after object creation**: `1` (1 day = 24 hours)

4. **Review and Create**
   - Review the configuration
   - Click "Create rule"

## Setup via AWS CLI

```bash
# Create lifecycle configuration JSON file
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteResumesAfter24Hours",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "resumes/"
      },
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
EOF

# Apply lifecycle policy to bucket
aws s3api put-bucket-lifecycle-configuration \
  --bucket resume-analyzer-uploads \
  --lifecycle-configuration file://lifecycle-policy.json
```

## Setup via Terraform (Infrastructure as Code)

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "resume_lifecycle" {
  bucket = aws_s3_bucket.resume_uploads.id

  rule {
    id     = "delete-resumes-after-24-hours"
    status = "Enabled"

    filter {
      prefix = "resumes/"
    }

    expiration {
      days = 1
    }
  }
}
```

## Verification

To verify the lifecycle policy is active:

```bash
# Via AWS CLI
aws s3api get-bucket-lifecycle-configuration --bucket resume-analyzer-uploads

# Expected output should show the rule with Days: 1
```

## Important Notes

1. **Deletion Time**: S3 lifecycle policies run once per day, typically at midnight UTC. Files may exist for up to 48 hours in practice.

2. **Immediate Deletion**: For more precise 24-hour deletion, consider using:
   - Background job queue (BullMQ/Bull) with scheduled deletion
   - AWS Lambda triggered by CloudWatch Events
   - The `scheduleFileDeletion` function in `s3.service.js` (requires job queue implementation)

3. **Cost Optimization**: Lifecycle policies help reduce storage costs by automatically removing old files.

4. **Compliance**: Automatic deletion helps with data privacy compliance (GDPR, etc.) by ensuring user data is not retained longer than necessary.

## Alternative: Job Queue Implementation

For more precise control, implement scheduled deletion using BullMQ:

```javascript
// In s3.service.js
import Queue from 'bull';

const deleteQueue = new Queue('file-deletion', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

export const scheduleFileDeletion = async (key, deleteAfterHours = 24) => {
  const delayMs = deleteAfterHours * 60 * 60 * 1000;
  await deleteQueue.add(
    { key },
    { delay: delayMs }
  );
};

// Worker process
deleteQueue.process(async (job) => {
  const { key } = job.data;
  await deleteFileFromS3(key);
});
```

## Monitoring

Monitor lifecycle policy effectiveness:
- Check S3 metrics in CloudWatch
- Track storage usage over time
- Set up alerts for unexpected storage growth
