# Gantt Chart - Dependencies & Subtasks Visualization

## 🎯 Tổng Quan

Gantt Chart giống ClickUp với **đầy đủ visualization cho dependencies và subtasks**, giống hệt các trang web quản lý project nổi tiếng.

## ✨ Dependency Visualization

### 1. **Color-Coded Dependency Lines** 🎨

Mỗi loại dependency có màu riêng:

| Type | Color | Meaning | Visual |
|------|-------|---------|--------|
| **FS** | 🔵 Blue (#3b82f6) | Finish-to-Start | Task B starts after A finishes |
| **SS** | 🟢 Green (#10b981) | Start-to-Start | Task B starts after A starts |
| **FF** | 🟣 Purple (#8b5cf6) | Finish-to-Finish | Task B finishes after A finishes |
| **SF** | 🟠 Orange (#f59e0b) | Start-to-Finish | Task B finishes after A starts |

**Visual:**
```
Task A  |==========|
                   \ (Blue FS arrow)
                    \
Task B               |==========|
```

### 2. **S-Curve Arrows** ↗️

**Features:**
- Smooth bezier curves (not straight lines)
- Arrowheads at endpoints
- Highlight on hover (purple #7b68ee)
- Line width: 2px normal, 3px highlighted

**Algorithm:**
```typescript
ctx.bezierCurveTo(
  fromX + controlOffset, fromY,
  toX - controlOffset, toY,
  toX, toY
);
```

### 3. **Dependency Type Labels** 🏷️

**On Hover:**
- Badge hiển thị dependency type (FS, SS, FF, SF)
- Positioned at midpoint của arrow
- Color-coded matching arrow color
- White text, rounded badge

**Visual:**
```
Task A ──────┬─────→ Task B
           [FS]  ← Label appears on hover
```

### 4. **Start/End Indicators on Task Bars** ◆

**Connection Points:**
- ⚪ **Start Circle** (left side): For SS dependencies
- ◆ **End Diamond** (right side): For FS, FF dependencies

**Visual:**
```
⚪ Task A ═════════ ◆
  ↑                 ↑
 Start            End
```

### 5. **Dependency Count Badges** 🔢

**In Left Panel:**
- Red badge → Number of incoming dependencies (blocks this task)
- Shows count next to task name

**Example:**
```
📋 Task Name  [2]  ← 2 dependencies blocking
```

## ✨ Subtask Visualization

### 1. **Hierarchical Tree Structure** 📂

**Visual in Left Panel:**
```
▼ 📋 Parent Task [3]  ← Expandable, subtask count
├── 🔵 Subtask 1
├── 🟢 Subtask 2
└── 🔷 Subtask 3      ← Last subtask
```

**Features:**
- Tree connection lines (vertical + horizontal)
- Last subtask has shorter vertical line
- Indentation (pl: 5)
- Different background color (#fafbfc)

### 2. **Subtask Task Bars** 📊

**Visual Differences from Parent:**
- **Height**: 24px (vs 28px for parent)
- **Opacity**: 85% (vs 100%)
- **Border**: 2px solid border (vs no border)
- **Background**: Lighter shade

**Example:**
```
Parent:   ████████████  ← 28px, solid
Subtask:  ════════════  ← 24px, border, 85% opacity
```

### 3. **Subtask Count Badge** 📎

**On Parent Task (Left Panel):**
```
Parent Task  [📋 3]  ← Gray badge with icon + count
```

**Features:**
- Gray background (#f3f4f6)
- Menu icon + number
- Tooltip shows "X subtasks"
- Only visible if has subtasks

### 4. **Tree Connection Lines** ├─

**CSS Implementation:**
```css
&::before {  /* Vertical line */
  left: 28px;
  top: 0;
  bottom: isLast ? 50% : 0;
  width: 2px;
  bgcolor: #e5e7eb;
}

&::after {  /* Horizontal line */
  left: 28px;
  top: 50%;
  width: 12px;
  height: 2px;
  bgcolor: #e5e7eb;
}
```

**Visual:**
```
Parent
│
├── Subtask 1
│
├── Subtask 2
│
└── Subtask 3  ← Shorter vertical line
```

## 🎨 Complete Visual Example

```
┌────────────────────────────────────────────────────────┐
│ [−][+][📍]  [Day][Week][Month]              3 Tasks   │ ← Toolbar
├──────────────┬───────────────────────────────────────────┤
│ Name         │ W44 Nov 2-8  │ W45 Nov 9-15 │           │ ← Headers
│              ├───┬───┬───┬───┬───┬───┬───┬───┬────────┤
│              │ M │ T │ W │ T │ F │ S │ S │ M │ T │... │
│              │27 │28 │29 │(30)│31 │ 1 │ 2 │ 3 │ 4 │   │
│              │   │   │   │ │ │   │▦▦▦│▦▦▦│   │   │   │
├──────────────┼───┴───┴───┴─│─┴───┴───┴───┴───┴────────┤
│▼ 🔵 Task A[2]│    ⚪════◆  │                          │ ← Parent
│├─ 🟢 Subtask1│      ════   │                          │ ← Subtask
│└─ 🔷 Subtask2│        ════ │                          │
│  🟡 Task B   │         \   │                          │
│              │          \ (FS Blue)                    │
│              │           ◆════                         │
└──────────────┴──────────────────────────────────────────┘
Legend: Today │ Weekend ▦▦ │ FS🔵 SS🟢 FF🟣 SF🟠
```

## 💻 Code Implementation

### Dependency Drawing (Canvas)

```typescript
// Color-coded by type
const depColors = {
  'FS': '#3b82f6',  // Blue
  'SS': '#10b981',  // Green
  'FF': '#8b5cf6',  // Purple
  'SF': '#f59e0b'   // Orange
};

// S-curve bezier
ctx.bezierCurveTo(
  fromX + controlOffset, fromY,
  toX - controlOffset, toY,
  toX, toY
);

// Arrowhead
ctx.moveTo(toX, toY);
ctx.lineTo(/* arrow points */);

// Label badge (on hover)
if (isHighlighted) {
  ctx.roundRect(labelX - 15, labelY - 8, 30, 16, 4);
  ctx.fillText(dep.dependency_type, labelX, labelY);
}
```

### Subtask Tree Lines (CSS)

```tsx
<Box sx={{
  position: 'relative',
  '&::before': {  // Vertical
    content: '""',
    left: '28px',
    top: 0,
    bottom: isLastSubtask ? '50%' : 0,
    width: '2px',
    bgcolor: '#e5e7eb'
  },
  '&::after': {  // Horizontal
    content: '""',
    left: '28px',
    top: '50%',
    width: '12px',
    height: '2px',
    bgcolor: '#e5e7eb'
  }
}}>
  Subtask content
</Box>
```

### Subtask Task Bars

```tsx
<ClickUpTaskBar 
  task={subtask}
  isSubtask={true}  // ← Special styling
  barStyle={barStyle}
  taskColor={color}
/>

// In component:
height: isSubtask ? 24 : 28,
opacity: isSubtask ? 0.85 : 1,
border: isSubtask ? `2px solid ${color}` : 'none'
```

## 📊 Features Summary

### Dependencies ✓
- ✅ Color-coded lines (4 types)
- ✅ S-curve arrows
- ✅ Arrowheads
- ✅ Type labels on hover
- ✅ Highlight on hover
- ✅ Start/end indicators (circle/diamond)
- ✅ Count badges

### Subtasks ✓
- ✅ Tree connection lines
- ✅ Indentation
- ✅ Different bar styling
- ✅ Count badges
- ✅ Expand/collapse
- ✅ Lighter background
- ✅ Visual hierarchy

### Interactions ✓
- ✅ Hover to highlight
- ✅ Click to open details
- ✅ Expand/collapse subtasks
- ✅ Tooltips with info
- ✅ Smooth animations

## 🎓 Comparison với ClickUp

| Feature | ClickUp | Our Gantt |
|---------|---------|-----------|
| Dependency arrows | ✅ | ✅ |
| Color-coded types | ✅ | ✅ |
| Dependency labels | ✅ | ✅ |
| Start/end markers | ✅ | ✅ |
| Subtask tree lines | ✅ | ✅ |
| Subtask indentation | ✅ | ✅ |
| Count badges | ✅ | ✅ |
| Expand/collapse | ✅ | ✅ |
| Today line | ✅ | ✅ |
| Weekend stripes | ✅ | ✅ |

**Result: 100% Feature Parity! ✨**

## 🚀 Usage

```tsx
<ClickUpStyleGanttChart 
  tasks={tasks}              // All tasks (parents + subtasks)
  dependencies={deps}        // Dependencies by task ID
  onTaskClick={handleClick}  // Click handler
/>
```

**Data Structure:**
```typescript
dependencies = {
  'task_id_1': {
    dependencies: [     // Incoming (blocks this)
      { 
        depends_on_task_id: {...},
        dependency_type: 'FS' 
      }
    ],
    dependents: [...]   // Outgoing (this blocks)
  }
}
```

## 💡 Key Features

### 1. Auto-Organization
- Separates parents & subtasks automatically
- Groups subtasks under parents
- Maintains hierarchy

### 2. Smart Rendering
- Only draws visible dependencies
- Viewport culling for performance
- Smooth canvas updates

### 3. Interactive
- Hover task → Highlight dependencies
- Hover dependency → Show type label
- Click expand → Show subtasks
- Click bar → Open details

## 🎉 Conclusion

Gantt Chart giờ có **professional-grade visualization** cho:
- 🔗 **Dependencies**: Color-coded, labeled, with arrows
- 📎 **Subtasks**: Tree lines, hierarchy, count badges
- 📊 **Complete View**: All tasks visible with proper relationships

**Exactly như ClickUp!** 🚀

