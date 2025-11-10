# Feature & Function Model Synchronization Guide

## 🔄 Tổng quan thay đổi

Model `Feature` và `Function` đã được sửa đổi. Code Backend và Frontend cần được cập nhật để đồng bộ với model mới.

---

## 📋 Model Changes Summary

### **Feature Model** (models/feature.js)

#### ✅ CÓ trong model:
- `title` (required)
- `project_id`
- `priority_id` → Setting
- `status_id` → Setting
- `created_by` → User
- `last_updated_by` → User
- `start_date`
- `due_date`
- `tags[]`
- `description`
- `createdAt`, `updatedAt`

#### ❌ KHÔNG còn trong model:
- ~~`complexity_id`~~
- ~~`reviewer_id`~~
- ~~`estimated_hours`~~
- ~~`actual_effort`~~
- ~~`plan_effort`~~

### **Function Model** (models/function.js)

#### ✅ CÓ trong model:
- `title` (required)
- `complexity_id` → Setting (required)
- `feature_id` → Feature
- `status` → Setting (required)
- `description`
- `createAt`, `updateAt`

#### ❌ KHÔNG còn trong model:
- ~~`project_id`~~
- ~~`pipeline_id`~~
- ~~`start_date`~~
- ~~`estimated_effort`~~
- ~~`actual_effort`~~
- ~~`deadline`~~

---

## ✅ Backend Changes Completed

### 1. Feature Controller (`controllers/feature.controller.js`)

**Đã sửa:**
- ✅ Xóa populate `complexity_id` và `reviewer_id`
- ✅ Xóa fields `estimated_hours`, `actual_effort`, `plan_effort` khỏi create/update
- ✅ Simplified validation (không dùng `validateAllFeatureRules` nữa)
- ✅ Xóa `calculateFeatureEffort()` - deprecated
- ✅ Xóa `suggestFunctionBreakdown()` - deprecated
- ✅ Xóa effort calculations khỏi stats
- ✅ Xóa effort fields khỏi aggregation pipeline

### 2. Function Controller (`controllers/function.controller.js`)

**Đã sửa:**
- ✅ Thay `project_id` filter bằng filter qua `feature.project_id`
- ✅ Xóa fields `project_id`, `pipeline_id`, `start_date`, `estimated_effort`, `actual_effort`, `deadline` khỏi create/update
- ✅ Xóa effort validation logic
- ✅ Xóa auto-update feature effort
- ✅ Xóa populate `pipeline_id`
- ✅ Sửa activity log để lấy project_id từ feature thay vì function
- ✅ Xóa overdue check (vì không có `deadline`)

---

## ⚠️ Frontend Changes - IN PROGRESS

### 1. Feature Frontend (`src/app/projects/[id]/features/page.tsx`)

#### Đã sửa:
- ✅ Updated `Feature` type - xóa complexity_id, reviewer_id, plan_effort, estimated_hours, actual_effort
- ✅ Xóa state `complexities`
- ✅ Xóa fetch complexities
- ✅ Xóa `getEstimatedHoursByComplexity()` function
- ✅ Updated form state - xóa các fields không còn
- ✅ Updated editDraft state
- ✅ Updated create payload - chỉ gửi fields tồn tại trong model
- ✅ Updated save function

#### ⚠️ CẦN SỬA THÊM (87 lỗi TypeScript):
- ❌ Còn nhiều references đến `complexity_id` trong UI
- ❌ Còn references đến `estimated_hours`, `actual_effort`, `plan_effort`
- ❌ Form fields vẫn hiển thị complexity select
- ❌ Table columns vẫn hiển thị complexity
- ❌ Inline edit vẫn có edit complexity
- ❌ Gantt chart vẫn dùng effort fields

### 2. Function Frontend (`src/app/projects/[id]/functions/page.tsx`)

#### Đã sửa:
- ✅ Updated `FunctionType` - xóa project_id, pipeline_id, start_date, estimated_effort, actual_effort, deadline
- ✅ Updated form state - xóa các fields không còn
- ✅ Xóa effort validation function

#### ⚠️ CẦN SỬA THÊM (45 lỗi TypeScript):
- ❌ Còn references đến `estimated_effort`, `actual_effort`
- ❌ Còn references đến `pipeline_id`, `start_date`, `deadline`
- ❌ Form fields vẫn hiển thị các input này
- ❌ Table columns vẫn hiển thị các fields này
- ❌ Effort warnings vẫn còn trong code
- ❌ Progress calculation vẫn dùng effort

---

## 🔧 Cách sửa Frontend còn lại

### Option 1: Xóa hoàn toàn UI cho các fields không còn

```typescript
// XÓA TRONG FEATURES PAGE:
// 1. Form inputs: complexity select, reviewer select, plan_effort, estimated_hours
// 2. Table columns: Complexity, Estimated Hours, Actual Effort, Plan Effort
// 3. Inline edit cells cho các fields này
// 4. Gantt chart features dùng effort
// 5. Stats/calculations dùng effort

// XÓA TRONG FUNCTIONS PAGE:
// 1. Form inputs: pipeline select, start_date, deadline, estimated_effort, actual_effort
// 2. Table columns: Pipeline, Start Date, Deadline, Estimated Effort, Actual Effort, Progress
// 3. Inline edit cells cho các fields này
// 4. Effort validation warnings
// 5. Progress bars dựa trên effort
```

### Option 2: Giữ UI nhưng disable/hide

```typescript
// Có thể comment out thay vì xóa hoàn toàn
// Để sau này nếu cần restore lại dễ hơn
```

---

## 🚨 Breaking Changes

### API Endpoints

**Deprecated:**
- `POST /api/features/:featureId/calculate-effort` → Returns 400
- `GET /api/features/:featureId/suggest-function-breakdown` → Returns 400

**Changed Response:**
- `GET /api/features/:featureId/breakdown` → stats không còn effort fields
- `GET /api/projects/:projectId/features/stats` → không còn effort fields

---

## 📝 Testing Checklist

### Backend:
- [ ] Create feature with only valid fields → OK
- [ ] Update feature → OK
- [ ] Feature validation (dates) → OK
- [ ] Create function with only valid fields → OK
- [ ] Update function → OK
- [ ] List functions by project → OK (filter qua features)
- [ ] Function stats → OK (không có deadline check)

### Frontend:
- [ ] Create new feature (form chỉ có fields còn lại)
- [ ] Edit feature inline
- [ ] Delete feature
- [ ] View feature list/table
- [ ] Create new function
- [ ] Edit function inline
- [ ] Delete function
- [ ] View function list/table
- [ ] Filter functions by feature
- [ ] Navigate between features and functions

---

## 💡 Recommendations

1. **Xóa hẳn UI elements** cho các fields không còn để tránh confusion
2. **Update documentation** cho user biết fields nào còn available
3. **Migration script** nếu cần clean up old data trong database
4. **Rollback plan** nếu cần restore lại fields cũ

---

## 🎯 Next Steps

1. ✅ Backend controllers - DONE
2. ⏳ Frontend types - PARTIAL
3. ❌ Frontend UI - NEED CLEANUP
4. ❌ Testing - TODO
5. ❌ Documentation update - TODO

---

**Last Updated:** 2025-01-09
**Status:** Backend Complete, Frontend Partial (87 TS errors remaining)

