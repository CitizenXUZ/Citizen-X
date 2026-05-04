# Deployment Guide: Railway (Backend) + Vercel (Frontend)

This guide provides step-by-step instructions for deploying the "English with Mr. Sam" LMS architecture.

## 🚆 Phase 1: Deploying the Backend on Railway

1. **Commit to GitHub**: Ensure all recent changes are pushed to your GitHub repository.
2. **Create Railway App**:
   * Go to [Railway.app](https://railway.app/).
   * Click **New Project** -> **Deploy from GitHub repo**.
   * Select your repository.
3. **Configure Persistent Storage (CRITICAL)**:
   * Railway file systems are ephemeral. To prevent data loss (database, uploads), you must attach a Volume.
   * In your Railway project, select the newly created service.
   * Navigate to the **Volumes** tab.
   * Click **Add Volume** and set the mount path to `/data`.
4. **Set Environment Variables**:
   * Navigate to the **Variables** tab.
   * Add the following keys:
     * `EWMS_DB_DIR` = `/data` *(This tells Python to save the DB and uploads into the persistent Volume)*
     * `EWMS_ADMIN_USERNAME` = `your_secure_admin_username`
     * `EWMS_ADMIN_PASSWORD` = `your_secure_admin_password`
     * `EWMS_ADMIN_EDIT_CODE` = `your_secure_edit_code` *(optional)*
5. **Get Backend URL**:
   * Once deployed, Railway will generate a public URL under the **Settings** -> **Domains** tab (e.g., `https://ewms-api.up.railway.app`). Copy this URL.

## ▲ Phase 2: Deploying the Frontend on Vercel

1. **Configure API Proxy (`vercel.json`)**:
   * Open the `vercel.json` file located in the root of the project on your local machine.
   * Replace `YOUR_RAILWAY_APP_URL` with the URL you copied from Railway (make sure to omit the trailing slash and https://).
   * Example: `"destination": "https://ewms-api.up.railway.app/api/$1"`
2. **Push Configuration to GitHub**:
   * Commit and push the updated `vercel.json` file.
3. **Create Vercel App**:
   * Go to [Vercel.com](https://vercel.com/).
   * Click **Add New Project** and import your GitHub repository.
4. **Deploy**:
   * In the Vercel project configuration, you **do not** need to change any build settings (Framework Preset should be `Other`, Build Command should be empty).
   * Click **Deploy**.

## 🔄 How it Works Together
* Users access the LMS through the Vercel URL (fast, CDN-cached delivery).
* When the frontend JavaScript makes an API request (`/api/...`), Vercel intercepts it and silently proxies the request to your Railway backend.
* The backend reads/writes data securely to the `/data` Volume on Railway, ensuring long-term storage of user accounts and uploaded files.
