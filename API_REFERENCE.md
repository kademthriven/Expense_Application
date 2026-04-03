# API Reference - Premium Download Feature

## Overview
All download-related endpoints require:
- **Authentication**: Bearer token in `Authorization` header
- **Premium Status**: User must have `isPremium = true`
- **Response**: 401 Unauthorized if requirements not met

---

## Endpoints

### 1. Download Premium Report

**Endpoint**: `GET /reports/download`

**Parameters** (Query String):
```
view: 'daily' | 'weekly' | 'monthly' (default: 'monthly')
selectedDate: 'YYYY-MM-DD' (default: today's date)
```

**Example Request**:
```javascript
GET /reports/download?view=monthly&selectedDate=2026-04-02
Authorization: Bearer {token}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Report generated successfully",
  "downloadUrl": "https://s3.amazonaws.com/expense-tracker.../expense-reports/user_1_monthly_2026-04_1742607600000.xlsx?X-Amz-Algorithm=...",
  "fileName": "user_1_monthly_2026-04_1742607600000.xlsx",
  "reportType": "monthly",
  "reportLabel": "2026-04",
  "fileId": 1,
  "expiresIn": "7 days"
}
```

**Error Response** (401):
```json
{
  "error": "Unauthorized",
  "message": "Download is available only for premium users"
}
```

**Notes**:
- File is uploaded to S3 bucket at `expense-reports/` folder
- Excel file contains all transactions for the selected period
- Presigned URL is valid for 7 days
- URL includes transaction details: date, description, category, income, expense

---

### 2. Get Download History

**Endpoint**: `GET /reports/history`

**Parameters**: None

**Example Request**:
```javascript
GET /reports/history
Authorization: Bearer {token}
```

**Success Response** (200):
```json
{
  "success": true,
  "totalDownloads": 3,
  "downloads": [
    {
      "id": 1,
      "fileName": "user_1_monthly_2026-04_1742607600000.xlsx",
      "downloadUrl": "https://s3.amazonaws.com/.../expense-reports/user_1_monthly_2026-04_1742607600000.xlsx?...",
      "reportType": "monthly",
      "reportLabel": "2026-04",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "downloadDate": "2026-04-02T10:30:45.000Z"
    },
    {
      "id": 2,
      "fileName": "user_1_weekly_2026-03-25_to_2026-03-31_1742507600000.xlsx",
      "downloadUrl": "https://s3.amazonaws.com/.../...",
      "reportType": "weekly",
      "reportLabel": "2026-03-25 to 2026-03-31",
      "startDate": "2026-03-25",
      "endDate": "2026-03-31",
      "downloadDate": "2026-03-31T15:20:30.000Z"
    }
  ]
}
```

**Error Response** (401):
```json
{
  "error": "Unauthorized",
  "message": "Download history is available only for premium users"
}
```

**Notes**:
- Returns downloads sorted by most recent first
- Each download has a fresh URL (URLs are generated on-the-fly)
- If a URL expired, re-fetching this endpoint will provide a new valid URL

---

### 3. Delete Download Record

**Endpoint**: `DELETE /reports/history/:fileId`

**Parameters** (URL):
```
fileId: The ID of the file download record to delete
```

**Example Request**:
```javascript
DELETE /reports/history/1
Authorization: Bearer {token}
Content-Type: application/json
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Download record deleted successfully"
}
```

**Error Responses**:

404 - File not found:
```json
{
  "error": "File record not found"
}
```

401 - Not authorized:
```json
{
  "error": "Unauthorized",
  "message": "This action is available only for premium users"
}
```

403 - Can't delete others' records:
```json
{
  "error": "Forbidden: You can only delete your own records"
}
```

**Notes**:
- Only the owner of the download record can delete it
- Deleting the record doesn't delete the S3 file (file remains in S3)
- This is for removing entries from download history only

---

## Frontend Integration Examples

### JavaScript - Download Report
```javascript
async function downloadExpenseReport() {
  try {
    const response = await axios.get('/reports/download', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: {
        view: 'monthly',
        selectedDate: '2026-04-02'
      }
    });

    if (response.data.success) {
      // Show modal with download URL
      window.open(response.data.downloadUrl, '_blank');
      
      // Or create a download link
      const a = document.createElement('a');
      a.href = response.data.downloadUrl;
      a.download = response.data.fileName;
      a.click();
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert('Please upgrade to premium to download reports');
    } else {
      alert('Error: ' + error.message);
    }
  }
}
```

### JavaScript - Get Download History
```javascript
async function viewDownloadHistory() {
  try {
    const response = await axios.get('/reports/history', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.data.success) {
      console.log(`Found ${response.data.totalDownloads} downloads:`);
      response.data.downloads.forEach(download => {
        console.log(`
          File: ${download.fileName}
          Type: ${download.reportType}
          Period: ${download.reportLabel}
          Downloaded: ${new Date(download.downloadDate).toLocaleDateString()}
        `);
        
        // Create download link
        const link = document.createElement('a');
        link.href = download.downloadUrl;
        link.download = download.fileName;
        link.textContent = `Download ${download.reportLabel}`;
        document.body.appendChild(link);
        link.appendChild(document.createElement('br'));
      });
    }
  } catch (error) {
    console.error('Error fetching download history:', error);
  }
}
```

---

## cURL Examples

### Generate and Download Report
```bash
curl -X GET "http://localhost:4000/reports/download?view=monthly&selectedDate=2026-04-02" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

### Get Download History
```bash
curl -X GET "http://localhost:4000/reports/history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

### Delete Download Record
```bash
curl -X DELETE "http://localhost:4000/reports/history/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process completed successfully |
| 401 | Unauthorized | User must be premium OR not authenticated |
| 403 | Forbidden | User trying to access others' data |
| 404 | Not Found | File record doesn't exist |
| 500 | Server Error | Backend error (check server logs) |

---

## Common Errors

### Error: "Unauthorized - not a premium user"
**Solution**: 
- User must purchase premium membership first
- Check `user.isPremium` flag in database

### Error: "Download URL expired"
**Solution**:
- Call `/reports/history` again to get fresh URLs
- Or regenerate report with `/reports/download`
- URLs are valid for 7 days

### Error: "Presigned URL returns 403 Access Denied"
**Possible causes**:
- AWS credentials in `.env` are invalid
- IAM user doesn't have S3 access
- S3 bucket name is incorrect

**Solution**:
- Verify `.env` contains correct AWS credentials
- Check IAM user has `AmazonS3FullAccess` policy
- Test S3 connectivity in `s3Service.js`

### Error: "File not found in S3"
**Cause**: S3 upload failed silently

**Solution**:
- Check server logs for S3 upload errors
- Verify AWS credentials are correct
- Ensure S3 bucket exists and is accessible

---

## Rate Limiting

No rate limiting currently implemented. For production, consider adding:
- Max 10 downloads per user per hour
- Max 5 concurrent downloads
- Implement using Redis or in-memory queue

---

## Data Retention

**Current Settings**:
- Downloads tracked indefinitely in database
- S3 files preserved indefinitely
- Presigned URLs valid for 7 days

**Recommended for Production**:
- Implement S3 lifecycle policy: Delete files after 90 days
- Archive old download records after 1 year
- Keep at least 3 months of history for users

---

## Performance Notes

- **Average upload time**: 2-5 seconds per file
- **File size**: ~50-100 KB per 100 transactions
- **Download speed**: Depends on S3 region and internet speed
- **Parallel downloads**: S3 supports concurrent access

---

## Security Best Practices

✅ **DO**:
- Keep AWS credentials in `.env` file (not versioned)
- Use presigned URLs for temporary access
- Log all download events
- Monitor S3 bucket costs
- Use IAM user (not root)

❌ **DON'T**:
- Expose AWS credentials in frontend code
- Share presigned URLs publicly
- Allow direct S3 bucket access
- Use root AWS account
- Store credentials in Git

---

**Last Updated**: April 2, 2026
**API Version**: 1.0
