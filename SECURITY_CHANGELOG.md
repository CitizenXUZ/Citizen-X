# Security & Architecture Update

This document outlines the major security hardenings and structural updates applied to the LMS backend and frontend.

## 1. Backend Authentication Restructure
* **Session-based Authorization**: Removed all insecure username-based checks. The system now strictly enforces `X-Session-Token` validation across all 30+ administrative endpoints.
* **Centralized Middleware**: Created a `_require_admin(conn)` method to validate session tokens directly via the database rather than trusting client-side payloads.
* **Hardcoded Passwords Removed**: Replaced plain-text credentials in `server.py` with environment variable configurations (`EWMS_ADMIN_USERNAME`, `EWMS_ADMIN_PASSWORD`, `EWMS_ADMIN_EDIT_CODE`).

## 2. Password Security & Database Migration
* **Hashing Implemented**: Passwords are no longer stored in plain text. Implemented SHA-256 with salt.
* **Auto-Migration**: Added an automatic database startup migration that detects plain-text passwords, hashes them securely, and updates the database seamlessly.

## 3. Frontend Authentication Flow (Phase 2)
* **Enhanced Admin Tools**:
  * `adminPostJson()` now automatically passes the `X-Session-Token` in the headers.
  * Added `adminGetJson()` for secure GET requests.
  * Added `adminFetchRaw()` as a low-level handler for any remaining admin API calls.
* **Secure Endpoints**: Modified all 16 previous direct `fetch()` calls to use `adminFetchRaw()`, completely eliminating `?username=` query parameters for authorization.
* **UI Hardening**: Removed the `Password` column from the `admin.html` and `script.js` user tables, preventing sensitive data exposure in the UI.

## 4. Deployment Readiness
* **Railway Volumes**: Updated upload paths (`COVER_UPLOAD_DIR`, `CERTIFICATE_UPLOAD_DIR`, `PRESENTATIONS_DIR`) to rely on `DEFAULT_DB_DIR` so that files are correctly saved to the persistent Railway Volume.
* **Vercel Proxy Setup**: Created a `vercel.json` to act as an API proxy, resolving CORS issues and seamlessly connecting the Vercel frontend with the Railway backend.
* **Version Control**: Updated `.gitignore` to omit `.db` files and server logs. Added `requirements.txt` and a `Procfile` for containerized environments.
