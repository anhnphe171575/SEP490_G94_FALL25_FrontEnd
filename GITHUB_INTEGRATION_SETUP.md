# GitHub Integration - Setup Guide 🚀

## 📋 Quick Start

Hướng dẫn setup GitHub Integration trong project của bạn.

---

## 1️⃣ Backend Setup

### Bước 1: Đảm bảo các file backend đã có

✅ **Models**:
- `SEP490_G94_FALL25/models/github_integration.js`

✅ **Controllers**:
- `SEP490_G94_FALL25/controllers/github.controller.js`

✅ **Routes**:
- `SEP490_G94_FALL25/routes/github.route.js`

### Bước 2: Register route trong server.js

File `SEP490_G94_FALL25/server.js` đã được update:

```javascript
const githubRoutes = require('./routes/github.route');
// ...
app.use('/api', githubRoutes);
```

### Bước 3: Start server

```bash
cd SEP490_G94_FALL25
npm install
npm start
```

Server sẽ chạy tại `http://localhost:5000`

---

## 2️⃣ Frontend Setup

### Bước 1: Components đã được tạo

✅ **TaskDetailsDevelopment**:
- `SEP490_G94_FALL25_FrontEnd/src/components/TaskDetails/TaskDetailsDevelopment.tsx`

✅ **GithubRepositorySettings**:
- `SEP490_G94_FALL25_FrontEnd/src/components/GithubRepositorySettings.tsx`

### Bước 2: TaskDetailsModal đã được update

File `SEP490_G94_FALL25_FrontEnd/src/components/TaskDetailsModal.tsx` đã có:
- Import `TaskDetailsDevelopment`
- Tab "Development" trong tabs
- Render component

### Bước 3: Thêm GitHub Settings vào Project Settings (OPTIONAL)

**Tạo file mới hoặc update file existing**:

`SEP490_G94_FALL25_FrontEnd/src/app/projects/[id]/settings/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import GithubRepositorySettings from "@/components/GithubRepositorySettings";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Project Settings
      </Typography>

      <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
        <Tab label="General" />
        <Tab label="Team" />
        <Tab label="GitHub Integration" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {currentTab === 0 && <div>General Settings (TODO)</div>}
        {currentTab === 1 && <div>Team Settings (TODO)</div>}
        {currentTab === 2 && <GithubRepositorySettings projectId={id as string} />}
      </Box>
    </Box>
  );
}
```

**HOẶC nếu đã có file settings, thêm tab mới**:

```tsx
// Existing settings page
import GithubRepositorySettings from "@/components/GithubRepositorySettings";

// Add tab
<Tab label="GitHub Integration" />

// Add content
{currentTab === 2 && <GithubRepositorySettings projectId={projectId} />}
```

---

## 3️⃣ GitHub Setup

### Bước 1: Tạo Personal Access Token

1. Truy cập: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Chọn quyền:
   - ✅ `repo` (full control of private repositories)
   - ✅ `read:org` (nếu repo thuộc organization)
4. Click **"Generate token"**
5. **Copy token** (chỉ hiển thị 1 lần!)

### Bước 2: Thêm Repository vào Project

1. Mở project settings
2. Click tab **"GitHub Integration"**
3. Click **"Add Repository"**
4. Nhập thông tin:
   - **Repository Owner**: `facebook` (username hoặc org name)
   - **Repository Name**: `react` (tên repo)
   - **Personal Access Token**: `ghp_xxxx...` (token vừa tạo)
5. Configure sync settings:
   - ✅ Auto-link commits
   - ✅ Auto-link PRs
   - Branch pattern: `feature/{task-key}-{task-title}`
6. Click **"Add Repository"**

### Bước 3: Setup Webhook (Optional - For Real-time Updates)

1. Copy **Webhook URL** từ repository settings (sau khi add):
   ```
   https://your-api.com/api/github/webhook/repo123
   ```

2. Truy cập GitHub Repository Settings:
   ```
   https://github.com/OWNER/REPO/settings/hooks
   ```

3. Click **"Add webhook"**

4. Cấu hình:
   - **Payload URL**: Paste webhook URL
   - **Content type**: `application/json`
   - **Secret**: (leave empty hoặc copy từ settings)
   - **Events**: 
     - ✅ Push events
     - ✅ Pull requests

5. Click **"Add webhook"**

6. Test: Webhook sẽ gửi ping event, check status màu xanh

---

## 4️⃣ Usage - Developer Workflow

### Workflow 1: Create Branch cho Task

1. Mở task detail (click vào task bất kỳ)
2. Click tab **"Development"**
3. Click **"Create Branch"**
4. Chọn repository
5. Click **"Create Branch"**

→ Branch sẽ được tạo trên GitHub:
```
feature/abc12345-implement-login
```

### Workflow 2: Commit Code với Auto-link

```bash
# Clone repo
git clone https://github.com/OWNER/REPO.git
cd REPO

# Checkout branch (hoặc tạo mới)
git checkout feature/abc12345-implement-login

# Code...
# Commit với task ID
git commit -m "Implement login form

Task: 507f1f77bcf86cd799439011
- Added validation
- Fixed styling
"

# Push
git push
```

→ Commit sẽ **tự động link** với task `507f1f77bcf86cd799439011`

### Workflow 3: Create Pull Request với Auto-link

1. Trên GitHub, create PR
2. Nhập title/description có task ID:

```
Title: Implement Login (Task: 507f1f77bcf86cd799439011)

Description:
This PR implements the login feature.

Related task: 507f1f77bcf86cd799439011

Changes:
- Added login form
- Implemented validation
```

→ PR sẽ **tự động link** với task

### Workflow 4: Check Development Progress

1. Mở task detail
2. Click tab **"Development"**
3. Xem:
   - 🌿 Branches: `feature/abc-login`
   - 🔀 Pull Requests: `#42 Implement login (Open)`
   - 💾 Commits: `5 commits linked`

---

## 5️⃣ Testing

### Test 1: Add Repository

```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/github/repositories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_owner": "facebook",
    "repo_name": "react",
    "access_token": "ghp_xxxx",
    "sync_settings": {
      "auto_link_commits": true,
      "auto_link_prs": true,
      "branch_naming_pattern": "feature/{task-key}-{task-title}"
    }
  }'
```

### Test 2: Create Branch

```bash
curl -X POST http://localhost:5000/api/tasks/TASK_ID/github/create-branch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "REPO_ID",
    "from_branch": "main"
  }'
```

### Test 3: Get GitHub Links

```bash
curl http://localhost:5000/api/tasks/TASK_ID/github/links \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6️⃣ Troubleshooting

### ❌ "Failed to add repository"

**Nguyên nhân**: Token không hợp lệ hoặc không có quyền

**Giải pháp**:
1. Check token còn hạn không (GitHub Settings → Tokens)
2. Check token có scope `repo` không
3. Thử lại với token mới

---

### ❌ "Branch creation failed"

**Nguyên nhân**: Token không có quyền push

**Giải pháp**:
1. Đảm bảo token có scope `repo` (full control)
2. Check repo không bị protect

---

### ❌ "Webhook not receiving events"

**Nguyên nhân**: Webhook URL sai hoặc server không accessible

**Giải pháp**:
1. Check webhook URL đúng format
2. Đảm bảo server public (hoặc dùng ngrok cho local)
3. Check webhook delivery logs trên GitHub

---

### ❌ "Auto-linking not working"

**Nguyên nhân**: Task ID không đúng format hoặc sync setting tắt

**Giải pháp**:
1. Check task ID đúng 24-char hex không
2. Check sync_settings.auto_link_commits = true
3. Commit message phải có `Task: [id]` hoặc `#[id]`

---

## 7️⃣ Best Practices

### ✅ Branch Naming

**Good**:
```
feature/{task-key}-{task-title}
→ feature/abc12345-implement-login
```

**Bad**:
```
dev-branch
feature-1
```

### ✅ Commit Messages

**Good**:
```
Implement login form

Task: 507f1f77bcf86cd799439011

- Added validation
- Fixed styling
- Updated tests
```

**Bad**:
```
update
fix bug
```

### ✅ PR Title/Description

**Good**:
```
Title: [Feature] Implement User Authentication (Task: 507f1f77bcf86cd799439011)

Description:
This PR implements user authentication.

Related tasks:
- 507f1f77bcf86cd799439011 (Login)
- 507f1f77bcf86cd799439012 (Registration)

Changes:
- ...
```

---

## 8️⃣ Security

### 🔐 Access Token Storage

- Tokens được **encrypt** trước khi lưu DB
- **Không bao giờ** return token trong API response
- Chỉ admin project mới có thể thêm/xóa repos

### 🔐 Webhook Security

- Mỗi webhook có **secret key** riêng
- Server verify **signature** của mọi webhook request
- Reject requests với invalid signature

---

## ✅ Checklist

### Setup Complete

- [ ] Backend running
- [ ] Frontend running
- [ ] GitHub PAT created
- [ ] Repository added to project
- [ ] Webhook configured (optional)
- [ ] Test create branch works
- [ ] Test auto-linking works

### Developer Ready

- [ ] Know how to create branch from task
- [ ] Know commit message format
- [ ] Know PR title format
- [ ] Can view GitHub links in task detail

---

## 🎉 Done!

GitHub Integration đã sẵn sàng! Developers có thể:

1. ✅ Tạo branch từ task
2. ✅ Commit code với auto-link
3. ✅ Create PR với auto-link
4. ✅ Xem development progress trong task detail
5. ✅ Track commits/PRs/branches

**Giống Jira nhưng tốt hơn!** 🚀

---

**Cần help?** Check:
- [Backend Guide](../SEP490_G94_FALL25/GITHUB_INTEGRATION_GUIDE.md)
- [Frontend Guide](./GITHUB_INTEGRATION_FRONTEND.md)

