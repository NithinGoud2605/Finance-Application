import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A custom hook for virtualizing large lists or grids
 * 
 * @param {Object} options Configuration options
 * @param {Array} options.items The full array of items to virtualize
 * @param {number} options.itemHeight Fixed height of each item in pixels
 * @param {number} options.overscan Number of extra items to render above/below the visible area
 * @param {number} options.scrollingDelay Debounce delay for scroll events in ms
 * @param {Function} options.getItemKey Function to get a unique key for each item
 * @returns {Object} Virtualization helpers and state
 */
const useVirtualized = ({
  items = [],
  itemHeight = 50,
  overscan = 3,
  scrollingDelay = 100,
  getItemKey = (item, index) => index,
}) => {
  // Ref for the container element
  const containerRef = useRef(null);
  
  // State for managing scroll position and dimensions
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Calculate visible items based on current scroll position
  const totalHeight = items.length * itemHeight;
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  // Extract only the items that should be rendered
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);
  
  // Handle scroll events with debouncing
  const scrollTimeoutRef = useRef(null);
  
  const handleScroll = useCallback((event) => {
    const { scrollTop: newScrollTop } = event.currentTarget;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set new timeout
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [scrollingDelay]);
  
  // Measure container on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });
    
    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
  // Prepare item style
  const getItemStyle = useCallback((index) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: `${itemHeight}px`,
    transform: `translateY(${(index + visibleStartIndex) * itemHeight}px)`,
  }), [itemHeight, visibleStartIndex]);
  
  // Scroll to index utility
  const scrollToIndex = useCallback((index, options = {}) => {
    const { align = 'auto', behavior = 'auto' } = options;
    if (!containerRef.current) return;
    
    const indexTop = index * itemHeight;
    const indexBottom = indexTop + itemHeight;
    const scrollBottom = scrollTop + containerHeight;
    
    let targetScrollTop = scrollTop;
    
    if (align === 'start' || (align === 'auto' && indexTop < scrollTop)) {
      targetScrollTop = indexTop;
    } else if (align === 'end' || (align === 'auto' && indexBottom > scrollBottom)) {
      targetScrollTop = indexBottom - containerHeight;
    } else if (align === 'center') {
      targetScrollTop = indexTop - (containerHeight - itemHeight) / 2;
    }
    
    // Ensure scroll is within bounds
    targetScrollTop = Math.max(0, Math.min(totalHeight - containerHeight, targetScrollTop));
    
    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior,
    });
  }, [containerHeight, itemHeight, scrollTop, totalHeight]);
  
  return {
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        willChange: 'transform',
      },
    },
    innerProps: {
      style: {
        height: `${totalHeight}px`,
        position: 'relative',
      },
    },
    visibleItems,
    visibleStartIndex,
    visibleEndIndex,
    isScrolling,
    getItemStyle,
    scrollToIndex,
    containerRef,
  };
};

export default useVirtualized; 