# 🔄 Kết Nối Lại GitHub (Reconnect)

## 🎯 Khi Nào Cần Reconnect?

### Trường Hợp Cần Kết Nối Lại:

1. ✅ **Token hết hạn** - Token cũ đã expire
2. ✅ **Token thiếu quyền** - Cần quyền `repo` đầy đủ
3. ✅ **Token bị revoke** - Đã xóa token trên GitHub
4. ✅ **Thêm repository mới** - Connect thêm repos khác

---

## 🚀 Cách Reconnect - Siêu Dễ!

### ✨ Có 2 Cách:

---

## Cách 1: Add Repository (Reconnect Token Mới)

### Bước 1: Mở Task → Tab Development

```
┌─────────────────────────────────────────────┐
│ 🔗 GitHub Development                        │
│              [Add Repository] [Create Branch]│
│                     👆 CLICK ĐÂY!            │
└─────────────────────────────────────────────┘
```

### Bước 2: Điền Thông Tin Mới

```
Repository Owner: [facebook      ]  ← Same hoặc new
Repository Name:  [react         ]  ← Same hoặc new  
Personal Access Token: [ghp_NEW_TOKEN] ← TOKEN MỚI!
```

### Bước 3: Done! ✅

- Nếu repo đã tồn tại → Backend sẽ **update token**
- Nếu repo mới → Thêm repo mới
- Token mới sẽ được dùng ngay lập tức!

---

## Cách 2: Hiển Thị Repositories Đã Connect

### Sau khi connect, bạn sẽ thấy:

```
┌─────────────────────────────────────────────┐
│ CONNECTED REPOSITORIES (2)                   │
├─────────────────────────────────────────────┤
│ 🐙 facebook/react          [Active]         │
│ 🐙 vercel/next.js          [Active]         │
└─────────────────────────────────────────────┘
```

Để update token:
1. Click "Add Repository"
2. Nhập **cùng owner + name**
3. Nhập **token mới**
4. Backend tự động update!

---

## 🔑 Tạo Token Mới (Đúng Cách)

### Bước 1: Tạo Token Với ĐỦ QUYỀN

```
https://github.com/settings/tokens
→ Generate new token (classic)

QUAN TRỌNG:
✅ Tick vào "repo" (PARENT checkbox)
   ✅ repo:status
   ✅ repo_deployment  
   ✅ public_repo
   ✅ repo:invite
   ✅ security_events

⚠️ PHẢI TICK CẢ "repo" PARENT!
```

### Bước 2: Copy Token

```
Token: ghp_aBcDeF123456789XyZ...
       👆 Copy ngay (chỉ hiện 1 lần!)
```

---

## 💡 Use Cases

### Use Case 1: Token Hết Hạn

```
Lỗi: "Resource not accessible by personal access token"

Giải pháp:
1. Tạo token mới (90 days hoặc no expiration)
2. Tab Development → Add Repository
3. Nhập same owner/name + token mới
4. ✅ Done!
```

---

### Use Case 2: Token Thiếu Quyền

```
Lỗi: "403 Forbidden" khi create branch

Giải pháp:
1. Tạo token mới với FULL "repo" scope
2. Tab Development → Add Repository  
3. Nhập same owner/name + token mới với đủ quyền
4. ✅ Done!
```

---

### Use Case 3: Thêm Repository Mới

```
Mục đích: Connect thêm repo khác

Cách làm:
1. Tab Development → Add Repository
2. Nhập owner/name MỚI + token
3. ✅ Giờ có 2 repos!
4. Chọn repo khi create branch
```

---

### Use Case 4: Replace Repository

```
Mục đích: Đổi repo khác

Cách làm:
1. Không cần xóa repo cũ
2. Tab Development → Add Repository
3. Nhập owner/name repo mới
4. ✅ Done! Cả 2 repos đều available
```

---

## 📸 UI Flow

### Trước Reconnect (Token Cũ Hết Hạn)

```
┌─────────────────────────────────────────────┐
│ CONNECTED REPOSITORIES (1)                   │
│ 🐙 facebook/react          [Active]         │
│                                              │
│ ⚠️ Token may be expired or invalid          │
│ ❌ Create branch: 403 Forbidden             │
└─────────────────────────────────────────────┘
```

### Click "Add Repository"

```
┌──────────────────────────────────────────┐
│ 🐙 Connect GitHub Repository             │
├──────────────────────────────────────────┤
│ Repository Owner: [facebook      ]       │
│ Repository Name:  [react         ]       │
│                   👆 Same as before      │
│                                          │
│ Personal Access Token:                   │
│ [ghp_NEW_TOKEN_HERE]                     │
│ 👆 Paste token mới!                     │
│                                          │
│        [Cancel]  [Connect Repository]    │
└──────────────────────────────────────────┘
```

### Sau Reconnect (Token Mới)

```
┌─────────────────────────────────────────────┐
│ CONNECTED REPOSITORIES (1)                   │
│ 🐙 facebook/react          [Active]         │
│                                              │
│ ✅ Token updated!                           │
│ ✅ Ready to create branches!                │
└─────────────────────────────────────────────┘
```

---

## ⚡ Quick Commands

### Test Token Có Quyền Không

```bash
# Test với curl
curl -H "Authorization: token ghp_YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO

# Nếu OK → 200 response
# Nếu 403 → Token thiếu quyền hoặc invalid
```

### Test Create Branch Permission

```bash
# Test create ref
curl -X POST \
  -H "Authorization: token ghp_YOUR_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/git/refs \
  -d '{"ref":"refs/heads/test","sha":"COMMIT_SHA"}'

# Nếu OK → Token có quyền create branch
# Nếu 403 → Token không đủ quyền
```

---

## ✅ Checklist

### Token Mới Phải Có:

- [ ] Format: `ghp_xxx` (classic) hoặc `github_pat_xxx` (fine-grained)
- [ ] Scope: `repo` (full control) ← QUAN TRỌNG!
- [ ] Chưa hết hạn (check expiration)
- [ ] Access được repository (public hoặc có permission)

### Sau Khi Reconnect:

- [ ] Repository vẫn hiển thị trong list
- [ ] Status: Active (màu xanh)
- [ ] Create branch hoạt động
- [ ] Auto-link hoạt động
- [ ] Không còn lỗi 403

---

## 🎯 Summary

### Reconnect Siêu Dễ!

```
1. Tab Development
2. Click "Add Repository"  
3. Nhập same owner/name + token mới
4. Done!
```

**Backend tự động update token!** Không cần xóa repo cũ! 🚀✨

---

## 📚 Related

- **Connect Lần Đầu**: `HUONG_DAN_KET_NOI_GITHUB_NHANH.md`
- **Fix 403 Error**: See "Tạo Token Mới" section above
- **Multiple Repos**: Just add more repositories!

---

**Need Help?** Token phải có scope `repo` (full control)! ⚡

