import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

/**
 * Custom hook for creating memoized selectors to prevent unnecessary re-renders
 * 
 * @param {Object} selectorMap - An object where keys are selector names and values are selector functions
 * @param {Array} dependencies - Dependencies to recompute the selectors (similar to useMemo dependencies)
 * @returns {Object} An object with the same keys but with memoized selector results
 */
export const useSelectors = (selectorMap, dependencies = []) => {
  return useMemo(() => {
    const result = {};
    
    // For each selector in the map, create a memoized selector and execute it
    Object.entries(selectorMap).forEach(([key, selectorFn]) => {
      // If it's already a memoized selector (has a resultFunc property), use it directly
      if (typeof selectorFn === 'function' && 'resultFunc' in selectorFn) {
        result[key] = useSelector(selectorFn);
        return;
      }
      
      // Create a memoized selector
      const memoizedSelector = createSelector(
        // Get the state from Redux
        state => state,
        // Apply the selector function to the state
        state => selectorFn(state)
      );
      
      // Execute the selector with the current state
      result[key] = useSelector(memoizedSelector);
    });
    
    return result;
  }, dependencies);
};

/**
 * Creates a selector that depends on multiple pieces of state
 * 
 * @param {Function[]} inputSelectors - Array of input selectors
 * @param {Function} resultFn - Function that computes the final result
 * @returns {Function} A memoized selector
 */
export const createDependentSelector = (inputSelectors, resultFn) => {
  return createSelector(
    inputSelectors,
    resultFn
  );
};

export default useSelectors; 