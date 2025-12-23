import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, Grid, Card, CardContent, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const LoadingSkeleton = ({ type = 'card', count = 1, height, width }) => {
  const theme = useTheme();

  // Card skeleton with title, content, and action areas
  const renderCardSkeleton = () => (
    <Card sx={{ mb: 2, width: width || '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="40%" height={28} />
        <Skeleton variant="text" width="100%" height={20} sx={{ my: 1 }} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: theme.shape.borderRadius }} />
        </Box>
      </CardContent>
    </Card>
  );

  // Table skeleton with header and rows
  const renderTableSkeleton = () => (
    <Box sx={{ width: width || '100%', mb: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 1, borderRadius: theme.shape.borderRadius }} />
      {Array(count).fill(0).map((_, index) => (
        <Skeleton 
          key={index} 
          variant="rectangular" 
          width="100%" 
          height={52} 
          sx={{ 
            mb: 0.5, 
            borderRadius: theme.shape.borderRadius,
            opacity: 1 - (index * 0.1),
          }} 
        />
      ))}
    </Box>
  );

  // Form skeleton with inputs and buttons
  const renderFormSkeleton = () => (
    <Box sx={{ width: width || '100%', mb: 2 }}>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: theme.shape.borderRadius }} />
      
      <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: theme.shape.borderRadius }} />
      
      <Skeleton variant="text" width="35%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 3, borderRadius: theme.shape.borderRadius }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: theme.shape.borderRadius }} />
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: theme.shape.borderRadius }} />
      </Box>
    </Box>
  );

  // Dashboard skeleton with stats and charts
  const renderDashboardSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array(4).fill(0).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="50%" height={24} />
                <Skeleton variant="text" width="70%" height={32} sx={{ my: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={60} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={300} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Full page loading skeleton
  const renderPageSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="30%" height={48} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {Array(3).fill(0).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={120}
              height={40}
              sx={{ borderRadius: theme.shape.borderRadius }}
            />
          ))}
        </Stack>
        
        <Box>{renderTableSkeleton()}</Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="25%" height={32} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {Array(6).fill(0).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              {renderCardSkeleton()}
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
  
  // List item skeleton
  const renderListSkeleton = () => (
    <Box sx={{ width: width || '100%' }}>
      {Array(count).fill(0).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={20} />
          </Box>
        </Box>
      ))}
    </Box>
  );

  // Text skeleton
  const renderTextSkeleton = () => (
    <Box sx={{ width: width || '100%' }}>
      {Array(count).fill(0).map((_, index) => (
        <Skeleton key={index} variant="text" width={`${Math.random() * 40 + 60}%`} height={24} sx={{ mb: 1 }} />
      ))}
    </Box>
  );

  // Map skeleton types to render functions
  const skeletonMap = {
    card: renderCardSkeleton,
    table: renderTableSkeleton,
    form: renderFormSkeleton,
    dashboard: renderDashboardSkeleton,
    page: renderPageSkeleton,
    list: renderListSkeleton,
    text: renderTextSkeleton,
  };

  const renderSkeleton = skeletonMap[type] || renderCardSkeleton;

  // For multiple items of the same type (except dashboard and page which are always singular)
  if (['card', 'list', 'text'].includes(type) && count > 1) {
    return (
      <>
        {Array(count).fill(0).map((_, index) => (
          <Box key={index}>{renderSkeleton()}</Box>
        ))}
      </>
    );
  }

  return renderSkeleton();
};

LoadingSkeleton.propTypes = {
  type: PropTypes.oneOf(['card', 'table', 'form', 'dashboard', 'page', 'list', 'text']),
  count: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default LoadingSkeleton; 