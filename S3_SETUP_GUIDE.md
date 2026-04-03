# AWS S3 Integration Setup Guide for Expense Tracker Premium Downloads

## Overview
This guide walks you through setting up AWS S3 for storing and serving premium expense report downloads. Users will be able to download Excel files containing all their expenses directly from S3 using presigned URLs.

---

## Step 1: Watch the YouTube Playlist
Before proceeding, watch these tutorials to understand S3 and why files shouldn't be stored on servers:
- **Playlist**: https://www.youtube.com/watch?v=cTFt2_8Fgd8&list=PL4dunL3FOEk0XNSrauPcapBXdyojKlM9x&t=1s
- Key concepts to understand:
  - Why cloud storage is better than server storage
  - AWS S3 basics and bucket management
  - IAM users and access policies
  - Presigned URLs and security

---

## Step 2: Create AWS S3 Bucket

### 2.1 Log in to AWS Console
1. Go to https://aws.amazon.com
2. Sign in to your AWS Management Console
3. Navigate to **S3** (search for "S3" in the top search bar)

### 2.2 Create a New Bucket
1. Click **"Create bucket"** button
2. Enter a **Bucket name**: 
   - Use a unique name like `expense-tracker-reports-{your-name}-{random-numbers}`
   - Bucket names must be globally unique
   - Use lowercase letters, numbers, and hyphens only

3. Choose a **Region**: Select `us-east-1` (or closest to your location)

4. **Block Public Access settings**: 
   - ✅ Keep all "Block public access" options CHECKED
   - This keeps your files private

5. Click **"Create bucket"**

### 2.3 Enable Versioning (Optional but Recommended)
1. Click on your newly created bucket
2. Go to **Properties** tab
3. Enable **Versioning** - helps recover previous versions

---

## Step 3: Create IAM User with S3 Access

### 3.1 Create IAM User
1. Go to **IAM** service (search for "IAM")
2. Click on **Users** in the left sidebar
3. Click **"Create user"**
4. User name: `expense-tracker-app` (or any name you prefer)
5. Click **"Next"**

### 3.2 Attach S3 Full Access Policy
1. In the permissions section, click **"Attach policies directly"**
2. Search for **"AmazonS3FullAccess"**
3. ✅ Check the box for **AmazonS3FullAccess**
4. Click **"Next"** → **"Create user"**

### 3.3 Create Access Keys
1. Click on the newly created user
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Other"** as use case
6. Click **"Create access key"**
7. **IMPORTANT**: Copy and save these credentials:
   - Access Key ID
   - Secret Access Key

⚠️ **SECURITY NOTE**: Never share these keys. Don't commit them to Git. Only store in `.env` file.

---

## Step 4: Configure Environment Variables

### 4.1 Update `.env` File
Add the following to your `.env` file in the project root:

```env
# AWS S3 Configuration (for premium file downloads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key_here
AWS_S3_BUCKET=your-bucket-name-here
```

Replace with your actual values from Step 3.3

### 4.2 Example `.env` (Don't copy these - use your own)
```env
# ... existing config ...

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=expense-tracker-reports-john-12345
```

---

## Step 5: Run Database Migration

The FileDownload table needs to be created in your database to track download history.

### 5.1 Run Migration
```bash
# Navigate to your project directory
cd c:\Users\Thrivenkomarr\OneDrive\Documents\Expense_Tracker_App

# Run the migration (if using Sequelize CLI)
npx sequelize-cli db:migrate
```

Or if your app auto-syncs models on startup, simply restart the app.

---

## Step 6: Test the Implementation

### 6.1 Start Your Application
```bash
npm start
# or
node app.js
```

### 6.2 Test the Premium Feature
1. Log in as a premium user (or upgrade to premium)
2. Click the **"📊 Premium Report"** button in the navbar
3. Select report parameters (Daily/Weekly/Monthly, date)
4. Click **"View Report"** to generate the report
5. Click **"📥 Download"** button
6. A modal should appear with a download link
7. Click the download link to get your Excel file
8. Visit the **"📥 Download History"** section to see all your previous downloads

### 6.3 Verify S3 Upload
1. Go to your AWS S3 Console
2. Open your bucket
3. Navigate to `expense-reports/` folder
4. You should see your generated Excel files

---

## Step 7: Frontend Integration Complete ✅

The following features are now available:

### For Users:
1. **Generate Reports**: Create expense reports for different time periods
2. **Download as Excel**: Click download to generate an S3 link
3. **View Downloads**: See all previously downloaded files with dates
4. **Download History**: Re-download any previous report file

### Security Features:
- ✅ Only premium users can access downloads (401 Unauthorized for non-premium)
- ✅ Presigned URLs expire after 7 days
- ✅ Files are stored in AWS S3, not on your server
- ✅ Users cannot directly access S3 bucket (private access)

---

## API Endpoints

### Download Report (Premium Only)
```
GET /reports/download?view=monthly&selectedDate=2026-04-02
Response:
{
  "success": true,
  "downloadUrl": "https://s3.amazonaws.com/...",
  "fileName": "user_1_monthly_2026-04_1742607600000.xlsx",
  "reportType": "monthly",
  "reportLabel": "2026-04",
  "expiresIn": "7 days"
}
```

### Get Download History (Premium Only)
```
GET /reports/history
Response:
{
  "success": true,
  "totalDownloads": 5,
  "downloads": [
    {
      "id": 1,
      "fileName": "user_1_monthly_2026-04_1742607600000.xlsx",
      "downloadUrl": "https://s3.amazonaws.com/...",
      "reportType": "monthly",
      "reportLabel": "2026-04",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "downloadDate": "2026-04-02T10:30:00.000Z"
    }
  ]
}
```

### Delete Download Record (Premium Only)
```
DELETE /reports/history/:fileId
Response:
{
  "success": true,
  "message": "Download record deleted successfully"
}
```

---

## Troubleshooting

### Issue: "Unauthorized" Error (401)
**Solution**: Make sure you're logged in as a premium user. Non-premium users cannot access downloads.

### Issue: AWS Credentials Error
**Solution**: 
1. Check your `.env` file has correct AWS credentials
2. Verify IAM user has S3FullAccess permission
3. Ensure access key is still active (not deleted)

### Issue: "Bucket not found" Error
**Solution**:
1. Verify `AWS_S3_BUCKET` name in `.env` matches your actual bucket name
2. Check AWS region is correct

### Issue: Presigned URL Expired
**Solution**: 
- This is normal. URLs expire after 7 days.
- Generate a new download to get a fresh URL

### Issue: Can't see files in S3
**Solution**:
1. Go to AWS S3 Console
2. Open your bucket
3. Check the `expense-reports/` folder (files are stored here by default)
4. If empty, check application logs for upload errors

---

## Production Deployment

Before going live:

1. **Use environment variables**: Never hardcode AWS credentials
2. **Enable S3 versioning**: For backup and recovery
3. **Set S3 lifecycle policies**: Delete old files after 30 days (optional)
4. **Enable S3 access logging**: Monitor who's accessing your files
5. **Use CloudFront CDN** (optional): For faster downloads globally
6. **Enable encryption**: S3 default encryption with KMS

---

## Additional Resources

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS Presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

---

## Feature Summary

✅ **Implemented Features:**
- Premium-only expense report downloads
- Excel file generation with transaction data
- AWS S3 storage for scalability
- Presigned URLs for secure downloads
- Download history tracking
- 7-day URL expiration
- Database tracking of all downloads

✅ **Bonus Feature:**
- Download history with dates
- Re-download previous reports
- View all past downloads

---

**Your Expense Tracker is now enhanced with professional S3-based file downloads! 🎉**
