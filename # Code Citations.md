# Code Citations

## License: unknown
https://github.com/Scalingo/documentation/blob/aa4cc754241849dd5108e8947a86e29ced0557f0/src/_posts/platform/getting-started/2000-01-01-getting-started-with-wordpress.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket
```


## License: unknown
https://github.com/SrushithR/acd2022-serverless-workshop/blob/ae4fa04f9e020a703ecb6946dde7d0d01ee47358/docs/uiIntegration.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```
```


## License: unknown
https://github.com/Scalingo/documentation/blob/aa4cc754241849dd5108e8947a86e29ced0557f0/src/_posts/platform/getting-started/2000-01-01-getting-started-with-wordpress.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket
```


## License: unknown
https://github.com/SrushithR/acd2022-serverless-workshop/blob/ae4fa04f9e020a703ecb6946dde7d0d01ee47358/docs/uiIntegration.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```
```


## License: unknown
https://github.com/Scalingo/documentation/blob/aa4cc754241849dd5108e8947a86e29ced0557f0/src/_posts/platform/getting-started/2000-01-01-getting-started-with-wordpress.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket
```


## License: unknown
https://github.com/SrushithR/acd2022-serverless-workshop/blob/ae4fa04f9e020a703ecb6946dde7d0d01ee47358/docs/uiIntegration.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```
```


## License: unknown
https://github.com/Scalingo/documentation/blob/aa4cc754241849dd5108e8947a86e29ced0557f0/src/_posts/platform/getting-started/2000-01-01-getting-started-with-wordpress.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket
```


## License: unknown
https://github.com/SrushithR/acd2022-serverless-workshop/blob/ae4fa04f9e020a703ecb6946dde7d0d01ee47358/docs/uiIntegration.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```
```


## License: unknown
https://github.com/Scalingo/documentation/blob/aa4cc754241849dd5108e8947a86e29ced0557f0/src/_posts/platform/getting-started/2000-01-01-getting-started-with-wordpress.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket
```


## License: unknown
https://github.com/SrushithR/acd2022-serverless-workshop/blob/ae4fa04f9e020a703ecb6946dde7d0d01ee47358/docs/uiIntegration.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```
```


## License: unknown
https://github.com/Scalingo/documentation/blob/aa4cc754241849dd5108e8947a86e29ced0557f0/src/_posts/platform/getting-started/2000-01-01-getting-started-with-wordpress.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket
```


## License: unknown
https://github.com/SrushithR/acd2022-serverless-workshop/blob/ae4fa04f9e020a703ecb6946dde7d0d01ee47358/docs/uiIntegration.md

```
This "Access Denied" error typically means the S3 bucket access is blocked or the credentials don't have proper permissions. Let me help you troubleshoot:

## 🔍 Troubleshooting Steps

### Step 1: Verify Your AWS Credentials
Check your `.env` file has correct credentials:

```bash
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Check S3 Bucket Block Public Access Settings

The "Access Denied" might be because the bucket is too restrictive. **This is actually good for security**, but we need to adjust the bucket policy:

1. Go to AWS S3 Console → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit** and ensure settings are:
   - ✅ Block all public access (CHECKED - this is correct for security)

### Step 3: Add Bucket Policy for Authenticated Access

Your bucket needs a policy that allows authenticated access. Add this policy:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/expense-tracker-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` - Find in AWS Console (top right) → Account ID
- `your-bucket-name` - Your actual S3 bucket name

### Step 4: Verify IAM User Permissions

1. Go to **IAM** → **Users** → Your user (`expense-tracker-app`)
2. Click **Permissions** tab
3. Should have **AmazonS3FullAccess** attached
4. If missing, attach it

### Step 5: Re-Test

After these changes:
1. Restart your Node.js server: `npm start`
2. Generate a new report and try downloading again

---

## ⚠️ Alternative: Simpler Bucket Policy

If the above doesn't work, use this **simpler public-read policy** (less secure but easier to debug):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/expense-reports/*"
    }
  ]
}
```
```

