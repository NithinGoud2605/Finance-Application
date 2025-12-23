// src/components/Loader.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loader() {
  return (
    <Wrapper>
      <div className="loader">
        <svg
          className="container"
          x="0px"
          y="0px"
          viewBox="0 0 40 40"
          width="40"
          height="40"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            className="track"
            fill="none"
            strokeWidth="4"
            pathLength="100"
            d="M29.76 18.72c0 7.28-3.92 13.6-9.84 16.96-2.88 1.68-6.24 2.64-9.84 2.64-3.6 0-6.88-.96-9.76-2.64 0-7.28 3.92-13.52 9.84-16.96 2.88-1.68 6.24-2.64 9.76-2.64s6.88.96 9.76 2.64c5.84 3.36 9.76 9.68 9.84 16.96-2.88 1.68-6.24 2.64-9.76 2.64-3.6 0-6.88-.96-9.84-2.64C11.12 28.4 7.2 22.08 7.2 14.8c0-7.28 3.92-13.6 9.76-16.96C19.84 5.12 23.76 11.44 23.76 18.72z"
          />
          <path
            className="car"
            fill="none"
            strokeWidth="4"
            pathLength="100"
            d="M29.76 18.72c0 7.28-3.92 13.6-9.84 16.96-2.88 1.68-6.24 2.64-9.84 2.64-3.6 0-6.88-.96-9.76-2.64 0-7.28 3.92-13.52 9.84-16.96 2.88-1.68 6.24-2.64 9.76-2.64s6.88.96 9.76 2.64c5.84 3.36 9.76 9.68 9.84 16.96-2.88 1.68-6.24 2.64-9.76 2.64-3.6 0-6.88-.96-9.84-2.64C11.12 28.4 7.2 22.08 7.2 14.8c0-7.28 3.92-13.6 9.76-16.96C19.84 5.12 23.76 11.44 23.76 18.72z"
          />
        </svg>
      </div>
    </Wrapper>
  );
}

const travel = keyframes`
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -100; }
`;

const Wrapper = styled.div`
  .container {
    --uib-size: 100px;
    --uib-color: #f0f9ff;
    --uib-speed: 2s;
    --uib-bg-opacity: 0.1;
    width: var(--uib-size);
    height: var(--uib-size);
    transform-origin: center;
    overflow: visible;
  }

  .track {
    stroke: var(--uib-color);
    opacity: var(--uib-bg-opacity);
    transition: stroke 1s ease;
  }

  .car {
    stroke: var(--uib-color);
    stroke-dasharray: 15, 85;
    stroke-linecap: round;
    animation: ${travel} var(--uib-speed) linear infinite;
    will-change: stroke-dasharray, stroke-dashoffset;
    transition: stroke 1s ease;
  }
`;

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px'
      }}
    >
      <CircularProgress size={40} />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
