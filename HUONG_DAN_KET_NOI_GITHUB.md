# 🚀 Hướng Dẫn Kết Nối GitHub

## 📍 BẤM VÀO ĐÂU?

### Cách 1: Từ Project Dashboard

```
1. Vào trang project của bạn
2. URL: http://localhost:3000/projects/[PROJECT_ID]/settings
3. Click tab "GitHub Integration"
```

### Cách 2: Thêm Link vào Navigation

Trong project detail page, thêm button Settings:

```tsx
// Ví dụ: trong project header
<Button 
  startIcon={<SettingsIcon />}
  onClick={() => router.push(`/projects/${projectId}/settings`)}
>
  Settings
</Button>
```

---

## 🔧 SETUP GITHUB - CHỈ 5 BƯỚC

### Bước 1: Tạo GitHub Personal Access Token

1. Truy cập: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Điền:
   - **Note**: "SEP Project Management"
   - **Expiration**: 90 days (hoặc No expiration)
4. Chọn quyền:
   - ✅ **repo** (tick hết tất cả trong phần repo)
   - ✅ **read:org** (nếu repo thuộc organization)
5. Click **"Generate token"**
6. **COPY TOKEN NGAY** (chỉ hiển thị 1 lần!)
   - Ví dụ: `ghp_aBcDeF123456789XyZ...`

---

### Bước 2: Vào Project Settings

1. Mở project của bạn
2. Vào URL:
   ```
   http://localhost:3000/projects/YOUR_PROJECT_ID/settings
   ```
3. Click tab **"GitHub Integration"**

---

### Bước 3: Add Repository

1. Click button **"Add Repository"** (góc phải trên)
2. Điền thông tin:

**Repository Owner** (username hoặc org):
```
facebook
```

**Repository Name** (tên repo):
```
react
```

**Personal Access Token** (token vừa tạo):
```
ghp_aBcDeF123456789XyZ...
```

**Sync Settings** (để mặc định):
- ✅ Auto-link commits: Enabled
- ✅ Auto-link PRs: Enabled
- 🌿 Branch pattern: `feature/{task-key}-{task-title}`

3. Click **"Add Repository"**

✅ **DONE!** Repository đã được kết nối!

---

### Bước 4: (Optional) Setup Webhook

Để nhận real-time updates từ GitHub:

1. Sau khi add repo, mở repository details (click vào repository)
2. Copy **Webhook URL**:
   ```
   https://your-api.com/api/github/webhook/repo123...
   ```

3. Truy cập GitHub repository settings:
   ```
   https://github.com/OWNER/REPO/settings/hooks
   ```

4. Click **"Add webhook"**

5. Điền:
   - **Payload URL**: Paste webhook URL vừa copy
   - **Content type**: `application/json`
   - **Secret**: (để trống)
   - **Which events?**: 
     - ✅ Just the push event
     - ✅ Pull requests

6. Click **"Add webhook"**

7. Kiểm tra: Webhook status màu xanh = thành công!

---

### Bước 5: Sử Dụng

#### A. Tạo Branch từ Task

```
1. Mở task detail (click vào task bất kỳ)
2. Click tab "Development"
3. Click button "Create Branch"
4. Chọn repository
5. Click "Create Branch"

→ Branch tự động tạo trên GitHub!
   Tên: feature/abc12345-task-name
```

#### B. Commit với Auto-link

```bash
# Commit code với task ID trong message
git commit -m "Fix login bug

Task: 507f1f77bcf86cd799439011
- Fixed validation
- Updated tests
"

git push

→ Commit tự động link với task!
```

#### C. Create PR với Auto-link

```
Title: Implement Login (Task: 507f1f77bcf86cd799439011)

Description:
This PR implements user login.

Related task: 507f1f77bcf86cd799439011
```

→ PR tự động link với task!

#### D. Xem Development Progress

```
1. Mở task detail
2. Click tab "Development"
3. Thấy:
   🌿 Branches: 1
   🔀 Pull Requests: 1
   💾 Commits: 5
```

---

## 📱 DEMO FLOW

### Flow 1: Admin Setup (1 lần duy nhất)

```
Admin:
1. Vào project settings
2. Tab "GitHub Integration"
3. Add repository (facebook/react)
4. Nhập GitHub token
5. ✅ Done!

→ Tất cả team members giờ có thể dùng!
```

### Flow 2: Developer Daily Work

```
Developer:
1. Nhận task: "Implement Login"
2. Mở task → Tab "Development"
3. Click "Create Branch"
4. Code trên branch đó
5. Commit: git commit -m "... Task: 507f..."
6. Push
7. Create PR với task ID

→ Mọi thứ tự động link!
→ PM xem progress trong task!
```

---

## 🎯 SCREENSHOT GUIDE

### 1. Project Settings - Navigation

```
┌─────────────────────────────────────────────┐
│ Project: My Awesome Project                  │
├─────────────────────────────────────────────┤
│ [Dashboard] [Tasks] [Team] [Settings] ←     │
└─────────────────────────────────────────────┘
                                    👆 Click đây!
```

### 2. Settings Page - GitHub Tab

```
┌─────────────────────────────────────────────┐
│ ⚙ Project Settings                           │
├─────────────────────────────────────────────┤
│ Tabs: [General] [GitHub Integration] ←      │
├─────────────────────────────────────────────┤
│                                              │
│ 🐙 GitHub Integration    [+ Add Repository] │
│                                       👆      │
│ No repositories connected yet                │
└─────────────────────────────────────────────┘
         👆 Click tab này!       👆 Hoặc click này!
```

### 3. Add Repository Dialog

```
┌──────────────────────────────────────────┐
│ 🐙 Add GitHub Repository                 │
├──────────────────────────────────────────┤
│                                          │
│ Repository Owner: [facebook      ]      │
│                   👆 Username/org        │
│                                          │
│ Repository Name:  [react         ]      │
│                   👆 Tên repo           │
│                                          │
│ Personal Access Token:                   │
│ [ghp_xxxxxxxxxxxxxxxxxx]                 │
│ 👆 Paste token từ GitHub                │
│                                          │
│ ✅ Auto-link commits                     │
│ ✅ Auto-link PRs                         │
│                                          │
│ Branch pattern:                          │
│ [feature/{task-key}-{task-title}]        │
│                                          │
│        [Cancel]  [Add Repository]        │
└──────────────────────────────────────────┘
```

### 4. Task Detail - Development Tab

```
┌─────────────────────────────────────────────┐
│ Task: Implement Login                        │
├─────────────────────────────────────────────┤
│ Tabs: Overview | Development | Comments      │
│                    👆 Click đây!             │
├─────────────────────────────────────────────┤
│                                              │
│ 🔗 GitHub Development    [Create Branch]    │
│                                              │
│ 🌿 BRANCHES                                 │
│   feature/abc-login                    [↗]  │
│                                              │
│ 🔀 PULL REQUESTS                            │
│   #42 Implement login [Open]           [↗]  │
│                                              │
│ 💾 COMMITS (5)                              │
│   Fix validation     abc1234           [↗]  │
│   Add login form     def5678           [↗]  │
└─────────────────────────────────────────────┘
```

---

## ❓ TROUBLESHOOTING

### ❌ "Failed to add repository"

**Nguyên nhân**: Token không hợp lệ

**Giải pháp**:
1. Check token đã expire chưa
2. Check token có quyền `repo` không
3. Tạo token mới và thử lại

---

### ❌ "Repository not found"

**Nguyên nhân**: Tên repo sai hoặc token không có quyền

**Giải pháp**:
1. Check tên repo đúng chưa (không có https://, chỉ tên)
2. Check repo owner đúng không (username hoặc org name)
3. Check token có quyền access repo đó không

---

### ❌ "Branch creation failed"

**Nguyên nhân**: Token không có quyền push

**Giải pháp**:
1. Check token có đủ quyền `repo` không
2. Check branch `main` có tồn tại không
3. Thử tạo từ branch khác (vd: `develop`)

---

### ❌ "Auto-linking không hoạt động"

**Nguyên nhân**: Task ID không đúng format hoặc setting tắt

**Giải pháp**:
1. Check task ID là ObjectId (24 ký tự hex)
2. Check sync_settings.auto_link_commits = true
3. Commit message phải có: `Task: [id]` hoặc `#[id]`
4. Setup webhook cho real-time (hoặc chờ manual sync)

---

## 📞 SUPPORT

Nếu gặp vấn đề:

1. **Check documentation**:
   - `GITHUB_INTEGRATION_SETUP.md` - Setup đầy đủ
   - `GITHUB_FEATURES_COMPLETE.md` - Tất cả features
   - `COMPLETE_FEATURES_SUMMARY.md` - Tổng quan

2. **Check backend logs**:
   ```bash
   # Backend console sẽ show errors nếu có
   ```

3. **Check browser console**:
   ```
   F12 → Console tab → Xem errors
   ```

---

## ✅ CHECKLIST

Setup thành công khi:

- [ ] Có button/link để vào Settings
- [ ] Tab "GitHub Integration" hiển thị
- [ ] Add repository thành công
- [ ] Repository hiển thị trong list
- [ ] Tab "Development" xuất hiện trong task detail
- [ ] Create branch hoạt động
- [ ] Commit auto-link (sau khi push)
- [ ] PR auto-link (sau khi tạo)

---

## 🎉 DONE!

Bây giờ bạn có thể:

✅ Kết nối GitHub repositories  
✅ Tạo branches từ tasks  
✅ Auto-link commits & PRs  
✅ Track development progress  
✅ Xem mọi thứ trong task detail  

**Giống Jira 100%!** 🚀✨

---

**URL Settings Page**: `http://localhost:3000/projects/[PROJECT_ID]/settings`

**Quick Access**: Thêm button Settings vào project navigation để dễ truy cập!

