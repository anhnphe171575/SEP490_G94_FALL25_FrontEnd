"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

interface FeatureDetailsOverviewProps {
  feature: any;
  onUpdate: (updates: any) => Promise<void>;
}

export default function FeatureDetailsOverview({ feature, onUpdate }: FeatureDetailsOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(feature?.description || '');

  // Update description when feature changes
  useEffect(() => {
    setDescription(feature?.description || '');
  }, [feature?.description]);

  const handleSave = async () => {
    try {
      await onUpdate({ description });
      setEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleCancel = () => {
    setDescription(feature?.description || '');
    setEditing(false);
  };

  return (
    <Box>
      {/* Description Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography fontSize="13px" fontWeight={700} color="#6b7280" textTransform="uppercase">
            Description
          </Typography>
          {!editing && (
            <Button 
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={() => setEditing(true)}
              sx={{ 
                textTransform: 'none', 
                fontSize: '13px',
                fontWeight: 600,
                color: '#6b7280',
                '&:hover': { bgcolor: '#f3f4f6' }
              }}
            >
              Edit
            </Button>
          )}
        </Box>
        
        {editing ? (
          <Box>
            <TextField 
              fullWidth
              multiline
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  fontSize: '14px',
                  '&:hover fieldset': {
                    borderColor: '#7b68ee',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7b68ee',
                  }
                } 
              }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button 
                size="small"
                onClick={handleCancel}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#6b7280'
                }}
              >
                Cancel
              </Button>
              <Button 
                size="small"
                variant="contained"
                onClick={handleSave}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '13px',
                  fontWeight: 600,
                  bgcolor: '#7b68ee',
                  '&:hover': { bgcolor: '#6952d6' }
                }}
              >
                Save Changes
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box 
            sx={{ 
              p: 2.5,
              bgcolor: '#fafbfc',
              borderRadius: 2,
              border: '1px solid #e8e9eb',
              minHeight: 120,
              cursor: 'text',
              '&:hover': {
                borderColor: '#d1d5db',
                bgcolor: '#f9fafb'
              }
            }}
            onClick={() => setEditing(true)}
          >
            {feature?.description ? (
              <Typography 
                fontSize="14px" 
                color="text.primary"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
              >
                {feature.description}
              </Typography>
            ) : (
              <Typography fontSize="14px" color="text.secondary" fontStyle="italic">
                Click to add a description...
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Statistics */}
      <Box sx={{ mb: 4 }}>
        <Typography fontSize="13px" fontWeight={700} color="#6b7280" textTransform="uppercase" sx={{ mb: 2 }}>
          Statistics
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2
        }}>
          <Box sx={{ 
            p: 2,
            bgcolor: '#fafbfc',
            borderRadius: 2,
            border: '1px solid #e8e9eb',
          }}>
            <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              Functions
            </Typography>
            <Typography fontSize="20px" fontWeight={700} color="text.primary">
              {feature?.functions_count || 0}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2,
            bgcolor: '#fafbfc',
            borderRadius: 2,
            border: '1px solid #e8e9eb',
          }}>
            <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              Comments
            </Typography>
            <Typography fontSize="20px" fontWeight={700} color="text.primary">
              {feature?.comments_count || 0}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2,
            bgcolor: '#fafbfc',
            borderRadius: 2,
            border: '1px solid #e8e9eb',
          }}>
            <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              Activities
            </Typography>
            <Typography fontSize="20px" fontWeight={700} color="text.primary">
              {feature?.activities_count || 0}
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2,
            bgcolor: '#fafbfc',
            borderRadius: 2,
            border: '1px solid #e8e9eb',
          }}>
            <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              Created
            </Typography>
            <Typography fontSize="14px" fontWeight={600} color="text.primary">
              {feature?.createdAt ? new Date(feature.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }) : '—'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Dates */}
      {(feature?.start_date || feature?.due_date) && (
        <Box>
          <Typography fontSize="13px" fontWeight={700} color="#6b7280" textTransform="uppercase" sx={{ mb: 2 }}>
            Dates
          </Typography>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2
          }}>
            {feature?.start_date && (
              <Box sx={{ 
                p: 2,
                bgcolor: '#fafbfc',
                borderRadius: 2,
                border: '1px solid #e8e9eb',
              }}>
                <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Start Date
                </Typography>
                <Typography fontSize="14px" fontWeight={600} color="text.primary">
                  {new Date(feature.start_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Typography>
              </Box>
            )}

            {feature?.due_date && (
              <Box sx={{ 
                p: 2,
                bgcolor: feature?.due_date && new Date(feature.due_date) < new Date() ? '#fef3c7' : '#fafbfc',
                borderRadius: 2,
                border: `1px solid ${feature?.due_date && new Date(feature.due_date) < new Date() ? '#fbbf24' : '#e8e9eb'}`,
              }}>
                <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Due Date
                </Typography>
                <Typography 
                  fontSize="14px" 
                  fontWeight={600} 
                  color={feature?.due_date && new Date(feature.due_date) < new Date() ? '#92400e' : 'text.primary'}
                >
                  {new Date(feature.due_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

