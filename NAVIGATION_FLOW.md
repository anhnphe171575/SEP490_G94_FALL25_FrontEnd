# 🧭 Navigation Flow - Luồng Điều Hướng Chính

## 📋 Tổng Quan

Hệ thống đã được tích hợp luồng điều hướng chính (main navigation flow) để liên kết tất cả các màn hình với nhau, giúp người dùng dễ dàng di chuyển giữa các phần của dự án.

## 🏗️ Cấu Trúc Phân Cấp

```
Dashboard
  └── Project Overview
        ├── 🎯 Milestones (Mốc thời gian)
        │     └── Features in Milestone
        │           └── Functions
        │                 └── Tasks
        │
        ├── ⚡ Features (Tính năng)
        │     ├── Functions (Chức năng)
        │     └── Tasks (Công việc)
        │
        ├── 🔧 Functions (Chức năng)
        │     └── Tasks
        │
        └── ✅ Tasks (Công việc cụ thể)
```

## ✨ Tính Năng Điều Hướng

### 1. **Breadcrumb Navigation** 🍞

Mỗi trang đều có breadcrumb hiển thị vị trí hiện tại trong hệ thống:

```
Dashboard > Project Name > Tasks
```

**Tính năng:**
- Click vào bất kỳ breadcrumb nào để quay lại
- Icon riêng cho từng loại trang
- Tự động highlight trang hiện tại

**Component:** `ProjectBreadcrumb.tsx`

**Sử dụng:**
```tsx
<ProjectBreadcrumb 
  projectId={projectId}
  items={[
    { label: 'Tasks', icon: <CheckCircleIcon /> }
  ]}
/>
```

### 2. **Quick Navigation Buttons** ⚡

Mỗi trang có các nút điều hướng nhanh đến các trang liên quan:

#### **Tasks Page:**
- `Milestones` - Xem tất cả milestones
- `Features` - Xem tất cả features  
- `Functions` - Xem tất cả functions
- `New Task` - Tạo task mới

#### **Features Page:**
- `🎯 Milestones` - Xem tất cả milestones
- `🔧 Functions` - Xem functions
- `✅ Tasks` - Xem tasks
- `Tạo Feature` - Tạo feature mới

### 3. **Clickable Badges** 🏷️

Trong danh sách Tasks, các badges hiển thị liên kết có thể click:

| Badge | Màu | Action | Đích đến |
|-------|-----|--------|----------|
| 🎯 Milestone | Vàng (#fef3c7) | Click | `/projects/{id}/milestones/{milestoneId}/features` |
| ⚡ Feature | Xanh dương (#dbeafe) | Click | `/projects/{id}/features/{featureId}` |
| 🔧 Function | Tím (#e0e7ff) | Click | `/projects/{id}/functions` |

**Tính năng:**
- Hover effect: Scale 1.05 + đổi màu
- Click để navigate đến trang chi tiết
- Stop propagation để không trigger row click

**Code mẫu:**
```tsx
<Chip 
  label={`🎯 ${milestone.title}`}
  onClick={(e) => {
    e.stopPropagation();
    router.push(`/projects/${projectId}/milestones/${milestoneId}/features`);
  }}
  sx={{ 
    cursor: 'pointer',
    '&:hover': {
      bgcolor: '#fde68a',
      transform: 'scale(1.05)',
    },
  }}
/>
```

## 🎯 Luồng Sử Dụng Chính

### Workflow 1: Từ Milestone → Task

```
1. Dashboard
2. Chọn Project → Project Overview (Milestones)
3. Click vào Milestone → Features in Milestone
4. Click vào Feature badge → Feature Detail
5. Click "Functions" hoặc "Tasks" → Xem danh sách
6. Click vào badge → Navigate đến detail
```

### Workflow 2: Từ Task → Context

```
1. Đang ở Tasks page
2. Nhìn thấy badges: 🎯 Milestone | ⚡ Feature | 🔧 Function
3. Click vào badge bất kỳ → Navigate đến context
4. Hiểu rõ task thuộc phần nào của dự án
```

### Workflow 3: Quick Jump

```
1. Đang ở bất kỳ trang nào
2. Dùng Quick Navigation buttons
3. Jump nhanh sang Features/Functions/Tasks
4. Breadcrumb giúp quay lại
```

## 🔗 Navigation Routes

### Project Routes:
| Route | Mô tả |
|-------|-------|
| `/projects/{id}` | Milestone overview |
| `/projects/{id}/features` | Features list |
| `/projects/{id}/functions` | Functions list |
| `/projects/{id}/tasks` | Tasks list |

### Detail Routes:
| Route | Mô tả |
|-------|-------|
| `/projects/{id}/milestones/{milestoneId}/features` | Features trong milestone |
| `/projects/{id}/features/{featureId}` | Chi tiết feature |
| `/projects/{id}/functions` | Functions list (có filter) |

## 🎨 UI/UX Improvements

### 1. **Visual Hierarchy**
- Breadcrumb: Màu xám (#6b7280) cho inactive, đen (#1f2937) cho active
- Badges: Màu riêng biệt cho từng loại (Milestone/Feature/Function)
- Buttons: Consistent styling với hover effects

### 2. **Responsive Design**
- Breadcrumb tự động wrap trên mobile
- Navigation buttons ẩn/hiện dựa trên screen size
- Touch-friendly badge sizes

### 3. **Performance**
- Lazy load components với `dynamic()`
- Prevent unnecessary re-renders
- Optimized routing với Next.js App Router

## 📝 Best Practices

### Khi thêm màn hình mới:

1. **Thêm Breadcrumb:**
```tsx
<ProjectBreadcrumb 
  projectId={projectId}
  items={[
    { label: 'Your Page', icon: <YourIcon /> }
  ]}
/>
```

2. **Thêm Quick Navigation:**
```tsx
<Button 
  variant="outlined"
  onClick={() => router.push(`/projects/${projectId}/your-page`)}
>
  Your Page Name
</Button>
```

3. **Thêm Clickable Badges nếu cần:**
```tsx
<Chip 
  label={`Icon ${item.name}`}
  onClick={(e) => {
    e.stopPropagation();
    router.push(`/path/to/detail`);
  }}
  sx={{ cursor: 'pointer', '&:hover': { ... } }}
/>
```

## 🚀 Future Enhancements

- [ ] Thêm keyboard shortcuts (Ctrl+K để mở command palette)
- [ ] Recent pages history
- [ ] Breadcrumb với dropdown cho sibling pages
- [ ] Search global với quick navigation
- [ ] Bookmark/favorite pages

## 🎯 Tóm Tắt

Luồng điều hướng chính đã tạo ra một hệ thống **liền mạch và trực quan** cho người dùng:

✅ **Breadcrumb** - Biết mình đang ở đâu
✅ **Quick Navigation** - Di chuyển nhanh giữa các trang
✅ **Clickable Badges** - Navigate từ context  
✅ **Consistent UI** - Trải nghiệm đồng nhất

Người dùng có thể dễ dàng:
- Hiểu vị trí hiện tại trong dự án
- Di chuyển nhanh giữa Milestone → Feature → Function → Task
- Quay lại bất kỳ lúc nào với breadcrumb
- Click vào badges để xem chi tiết ngay lập tức

---

**Tác giả:** AI Assistant  
**Ngày:** November 2025  
**Version:** 1.0

