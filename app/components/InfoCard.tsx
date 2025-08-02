'use client';
import { Card, CardContent, Typography, Button, Box, IconButton } from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';
import { useState } from 'react';

interface InfoCardProps {
  totalCrimes: number;
  onFilterClick: () => void;
}

export default function InfoCard({ totalCrimes, onFilterClick }: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card sx={{ mb: 2, backgroundColor: '#f5f5f5' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="h2">
            Crime Information
          </Typography>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small">
            {isExpanded ? <Close /> : <FilterList />}
          </IconButton>
        </Box>
        {isExpanded && (
          <Box mt={2}>
            <Typography variant="body1" gutterBottom>
              Total Crimes: <strong>{totalCrimes.toLocaleString()}</strong>
            </Typography>
            <Button
              variant="contained"
              startIcon={<FilterList />}
              onClick={onFilterClick}
              sx={{ mt: 1 }}
            >
              Open Filters
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
