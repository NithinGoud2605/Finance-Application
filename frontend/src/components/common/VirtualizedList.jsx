import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import useVirtualized from '../../hooks/useVirtualized';

/**
 * A high-performance virtualized list component for rendering large datasets
 * Only renders items that are visible in the viewport, plus a small buffer
 */
const VirtualizedList = ({
  items = [],
  renderItem,
  itemHeight = 50,
  height = 400,
  width = '100%',
  overscan = 3,
  scrollingDelay = 100,
  getItemKey,
  emptyMessage = 'No items to display',
  className,
  style,
  onItemClick,
  itemClassName,
  itemStyle,
  scrollToIndex,
  header,
  footer,
}) => {
  const getKey = useMemo(() => {
    if (getItemKey) return getItemKey;
    return (item, index) => (item.id || item.key || index);
  }, [getItemKey]);

  const {
    containerProps,
    innerProps,
    visibleItems,
    visibleStartIndex,
    isScrolling,
    getItemStyle,
    scrollToIndex: virtualScrollToIndex,
    containerRef,
  } = useVirtualized({
    items,
    itemHeight,
    overscan,
    scrollingDelay,
    getItemKey: getKey,
  });

  // Expose scrollToIndex method to parent component if needed
  React.useImperativeHandle(scrollToIndex, () => ({
    scrollToIndex: (index, options) => virtualScrollToIndex(index, options),
  }));

  // Handle empty list
  if (items.length === 0) {
    return (
      <Box
        sx={{
          height,
          width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        className={className}
      >
        <Typography color="text.secondary" variant="body1">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height,
        width,
        ...style,
      }}
      className={className}
    >
      {header && <Box>{header}</Box>}
      
      <Box
        {...containerProps}
        style={{
          ...containerProps.style,
          height: header || footer ? `calc(100% - ${header ? 'auto' : '0px'} - ${footer ? 'auto' : '0px'})` : '100%',
        }}
      >
        <Box {...innerProps}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleStartIndex + index;
            return (
              <Box
                key={getKey(item, actualIndex)}
                style={{
                  ...getItemStyle(index),
                  ...(itemStyle || {}),
                }}
                className={itemClassName}
                onClick={onItemClick ? () => onItemClick(item, actualIndex) : undefined}
                data-index={actualIndex}
              >
                {renderItem({
                  item,
                  index: actualIndex,
                  isScrolling,
                  style: getItemStyle(index),
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
      
      {footer && <Box>{footer}</Box>}
    </Box>
  );
};

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  overscan: PropTypes.number,
  scrollingDelay: PropTypes.number,
  getItemKey: PropTypes.func,
  emptyMessage: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  onItemClick: PropTypes.func,
  itemClassName: PropTypes.string,
  itemStyle: PropTypes.object,
  scrollToIndex: PropTypes.shape({
    current: PropTypes.any,
  }),
  header: PropTypes.node,
  footer: PropTypes.node,
};

export default VirtualizedList; 