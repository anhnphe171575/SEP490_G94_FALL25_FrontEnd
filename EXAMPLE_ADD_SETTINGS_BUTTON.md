# Ví Dụ: Thêm Settings Button vào Project Page

## 🎯 Mục Đích

Thêm button "Settings" để user dễ dàng truy cập GitHub Integration.

---

## 📍 Cách 1: Thêm vào Project Header

### File: `src/app/projects/[id]/page.tsx`

Tìm phần header của project page và thêm button:

```tsx
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter } from "next/navigation";

export default function ProjectPage() {
  const router = useRouter();
  const { id } = useParams();
  
  // ... existing code ...

  return (
    <Box>
      {/* Project Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3 
      }}>
        <Typography variant="h4" fontWeight={700}>
          {projectData?.title}
        </Typography>
        
        {/* ADD THIS: Settings Button */}
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => router.push(`/projects/${id}/settings`)}
          sx={{
            textTransform: 'none',
            borderColor: '#e8e9eb',
            color: '#6b7280',
            '&:hover': {
              borderColor: '#7b68ee',
              bgcolor: '#f5f3ff',
              color: '#7b68ee'
            }
          }}
        >
          Settings
        </Button>
      </Box>

      {/* Rest of page ... */}
    </Box>
  );
}
```

**Result**:
```
┌─────────────────────────────────────────────┐
│ My Project                     [⚙ Settings] │
└─────────────────────────────────────────────┘
```

---

## 📍 Cách 2: Thêm vào Tabs Navigation

Nếu project page có tabs (như trong `features/page.tsx`):

```tsx
import SettingsIcon from "@mui/icons-material/Settings";

export default function ProjectFeaturesPage() {
  // ... existing code ...

  return (
    <Box>
      {/* Navigation Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button 
          onClick={() => router.push(`/projects/${id}`)}
          variant={currentPage === 'overview' ? 'contained' : 'outlined'}
        >
          Overview
        </Button>
        
        <Button 
          onClick={() => router.push(`/projects/${id}/features`)}
          variant={currentPage === 'features' ? 'contained' : 'outlined'}
        >
          Features
        </Button>
        
        <Button 
          onClick={() => router.push(`/projects/${id}/tasks`)}
          variant={currentPage === 'tasks' ? 'contained' : 'outlined'}
        >
          Tasks
        </Button>

        {/* ADD THIS: Settings Tab */}
        <Button 
          onClick={() => router.push(`/projects/${id}/settings`)}
          startIcon={<SettingsIcon />}
          variant="outlined"
          sx={{
            ml: 'auto !important',  // Push to right
            textTransform: 'none',
            borderColor: '#e8e9eb',
            color: '#6b7280'
          }}
        >
          Settings
        </Button>
      </Stack>
    </Box>
  );
}
```

**Result**:
```
┌───────────────────────────────────────────────────┐
│ [Overview] [Features] [Tasks]       [⚙ Settings] │
└───────────────────────────────────────────────────┘
```

---

## 📍 Cách 3: Thêm vào Dropdown Menu

Nếu có menu 3 chấm (⋮):

```tsx
import { Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";

export default function ProjectPage() {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4">Project</Typography>
        
        {/* Menu Button */}
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>

        {/* Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => router.push(`/projects/${id}/settings`)}>
            <SettingsIcon sx={{ mr: 1, fontSize: 18 }} />
            Settings
          </MenuItem>
          
          <MenuItem onClick={() => router.push(`/projects/${id}/team`)}>
            Team
          </MenuItem>
          
          {/* Other menu items ... */}
        </Menu>
      </Box>
    </Box>
  );
}
```

**Result**:
```
┌────────────┐
│ ⚙ Settings │
│ 👥 Team    │
│ 📊 Reports │
└────────────┘
```

---

## 📍 Cách 4: Thêm Card trong Dashboard

Nếu có dashboard với cards:

```tsx
import GitHubIcon from "@mui/icons-material/GitHub";
import SettingsIcon from "@mui/icons-material/Settings";

export default function ProjectDashboard() {
  return (
    <Grid container spacing={3}>
      {/* Existing cards ... */}
      
      {/* GitHub Integration Card */}
      <Grid item xs={12} md={6} lg={4}>
        <Card 
          sx={{ 
            cursor: 'pointer',
            '&:hover': { boxShadow: 4 }
          }}
          onClick={() => router.push(`/projects/${id}/settings?tab=github`)}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#f6f8fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GitHubIcon sx={{ fontSize: 24, color: '#24292f' }} />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600}>
                  GitHub Integration
                </Typography>
                <Typography fontSize="12px" color="text.secondary">
                  Connect repositories
                </Typography>
              </Box>
              
              <SettingsIcon sx={{ color: '#9ca3af' }} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
```

**Result**:
```
┌──────────────────────────────┐
│ 🐙  GitHub Integration    ⚙ │
│     Connect repositories     │
└──────────────────────────────┘
```

---

## 📍 Cách 5: Thêm vào Sidebar (Nếu Có)

```tsx
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function ProjectSidebar() {
  return (
    <List>
      <ListItemButton onClick={() => router.push(`/projects/${id}`)}>
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
      
      <ListItemButton onClick={() => router.push(`/projects/${id}/tasks`)}>
        <ListItemIcon><TaskIcon /></ListItemIcon>
        <ListItemText primary="Tasks" />
      </ListItemButton>

      {/* ADD THIS */}
      <Divider sx={{ my: 1 }} />
      
      <ListItemButton onClick={() => router.push(`/projects/${id}/settings`)}>
        <ListItemIcon><SettingsIcon /></ListItemIcon>
        <ListItemText primary="Settings" />
      </ListItemButton>
      
      <ListItemButton 
        onClick={() => router.push(`/projects/${id}/settings?tab=1`)}
        sx={{ pl: 4 }}
      >
        <ListItemIcon><GitHubIcon fontSize="small" /></ListItemIcon>
        <ListItemText 
          primary="GitHub" 
          primaryTypographyProps={{ fontSize: '14px' }}
        />
      </ListItemButton>
    </List>
  );
}
```

**Result**:
```
┌────────────────┐
│ 📊 Dashboard   │
│ ✓  Tasks       │
│ ─────────────  │
│ ⚙  Settings    │
│   🐙 GitHub    │
└────────────────┘
```

---

## 🎨 Recommended: Cách 1 + Cách 4

**Best UX**: Kết hợp cả 2:

1. **Header Button** - Quick access cho power users
2. **Dashboard Card** - Visual & intuitive cho new users

```tsx
export default function ProjectPage() {
  return (
    <Box>
      {/* Header with Settings */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{project.title}</Typography>
        <Button startIcon={<SettingsIcon />}>Settings</Button>
      </Box>

      {/* Quick Actions Dashboard */}
      <Grid container spacing={2}>
        {/* GitHub Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card onClick={() => router.push(`/projects/${id}/settings?tab=1`)}>
            <CardContent>
              <GitHubIcon />
              <Typography>GitHub Integration</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Other cards ... */}
      </Grid>
    </Box>
  );
}
```

---

## ✅ Checklist

Sau khi thêm Settings button:

- [ ] Button/link hiển thị rõ ràng
- [ ] Click vào navigate đến `/projects/[id]/settings`
- [ ] Settings page load successfully
- [ ] Tab "GitHub Integration" hoạt động
- [ ] UI nhất quán với design system hiện tại

---

## 🎯 Quick Copy-Paste

**Minimal Button** (thêm vào bất kỳ đâu):

```tsx
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter } from "next/navigation";

// In component:
const router = useRouter();

<IconButton onClick={() => router.push(`/projects/${projectId}/settings`)}>
  <SettingsIcon />
</IconButton>
```

**Full Button with Text**:

```tsx
<Button
  startIcon={<SettingsIcon />}
  onClick={() => router.push(`/projects/${projectId}/settings`)}
  sx={{ textTransform: 'none' }}
>
  Settings
</Button>
```

**Direct to GitHub Tab**:

```tsx
<Button
  startIcon={<GitHubIcon />}
  onClick={() => router.push(`/projects/${projectId}/settings?tab=1`)}
>
  GitHub
</Button>
```

---

**Done!** Chọn cách nào phù hợp với UI hiện tại của bạn! 🚀

