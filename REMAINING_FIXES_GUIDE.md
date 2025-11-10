# Hướng dẫn sửa các lỗi TypeScript còn lại

## 📊 Tình trạng hiện tại

✅ **Backend:** HOÀN THÀNH  
⏳ **Frontend:** Đang sửa - còn 29 lỗi trong functions page

---

## 🔧 Functions Page - 29 lỗi còn lại

### Phần đã sửa:
- ✅ Types (FunctionType, Feature)
- ✅ Form state
- ✅ handleOpenDialog
- ✅ handleSaveFunction payload
- ✅ Xóa calculateEffortWarnings function
- ✅ Xóa effort warnings UI

### Phần cần sửa thủ công:

#### 1. **Stats Card hiển thị Effort** (Lines ~978-980)
```typescript
// XÓA hoặc COMMENT OUT:
const totalEstimated = functions.reduce((sum, f) => sum + (f.estimated_effort || 0), 0);
const completedEffort = functions.filter(f => f.status === "Completed")
  .reduce((sum, f) => sum + (f.actual_effort || 0), 0);
```

#### 2. **Table Columns** (Lines ~1192, ~1221-1227, ~1239, ~1269, ~1271)
Cần XÓA hoặc COMMENT OUT các columns:
- `<TableCell>Estimated Effort</TableCell>`
- `<TableCell>Actual Effort</TableCell>`
- `<TableCell>Progress</TableCell>`
- `<TableCell>Deadline</TableCell>`

Và các cell data tương ứng trong table body:
```typescript
// XÓA:
<TableCell>{func.estimated_effort}h</TableCell>
<TableCell>{func.actual_effort}h / {func.estimated_effort}h</TableCell>
<TableCell>Progress bar using effort</TableCell>
<TableCell>{func.deadline && format(func.deadline)}</TableCell>
```

#### 3. **Form Dialog** (Lines ~1559-1587)
XÓA các TextField trong dialog form:
```typescript
// XÓA:
<TextField
  label="Estimated Effort (hours)"
  type="number"
  value={functionForm.estimated_effort}
  onChange={(e) => setFunctionForm({...functionForm, estimated_effort: Number(e.target.value)})}
/>

<TextField
  label="Start Date"
  type="date"
  value={functionForm.start_date}
  onChange={(e) => setFunctionForm({...functionForm, start_date: e.target.value})}
/>

<TextField
  label="Deadline"
  type="date"
  value={functionForm.deadline}
  onChange={(e) => setFunctionForm({...functionForm, deadline: e.target.value})}
/>

// XÓA effort validation alerts
{getEffortValidation(...) && (
  <Alert severity="error">Effort exceeded</Alert>
)}
```

---

## 🎨 Features Page - 87 lỗi  

Tương tự Functions, cần sửa:

### 1. **Types và States** (Done partially)
- ✅ Feature type
- ✅ Form state
- ✅ editDraft state

### 2. **Cần sửa thêm:**

#### Table Columns - XÓA:
- Complexity column
- Estimated Hours column
- Actual Effort column
- Plan Effort column
- Reviewer column

#### Form Dialog - XÓA:
- Complexity Select
- Reviewer Select  
- Plan Effort TextField
- Estimated Hours TextField

#### Inline Edit Cells - XÓA:
- Edit complexity
- Edit estimated_hours
- Edit actual_effort
- Edit plan_effort

#### Gantt Chart - FIX:
- Calculations dùng effort fields
- Timeline rendering dùng estimated_hours

---

## 🚀 Cách sửa nhanh nhất

### Option 1: Tìm và Comment Out
Dùng Find & Replace trong VS Code:

**Functions Page:**
```regex
Find: (estimated_effort|actual_effort|deadline|start_date|pipeline_id)
Replace: // REMOVED: $1
```

**Features Page:**
```regex
Find: (complexity_id|reviewer_id|estimated_hours|actual_effort|plan_effort)
Replace: // REMOVED: $1
```

### Option 2: Xóa từng section
1. Tìm dòng có lỗi trong lints
2. Comment out hoặc xóa section đó
3. Test xem UI vẫn hoạt động

### Option 3: Simplify UI
Giữ lại chỉ những fields CÓ trong model:

**Function Form - GIỮ LẠI:**
- Title ✅
- Description ✅
- Complexity ✅
- Status ✅
- Feature ✅

**Feature Form - GIỮ LẠI:**
- Title ✅
- Description ✅
- Priority ✅
- Status ✅
- Start Date ✅
- Due Date ✅
- Tags ✅
- Milestones ✅

---

## ✅ Sau khi sửa xong

1. Run `npm run build` để check TypeScript errors = 0
2. Test create/edit/delete functions
3. Test create/edit/delete features
4. Verify không có lỗi runtime

---

## 💡 Tips

- Comment out thay vì xóa hoàn toàn để dễ rollback
- Sửa từng file một, test ngay
- Commit sau mỗi file sửa xong
- Backup code trước khi sửa

---

**Status:** Backend ✅ | Frontend Functions ⏳ 29 errors | Frontend Features ⏳ 87 errors  
**Next:** Sửa hết lỗi TypeScript trong cả 2 files

