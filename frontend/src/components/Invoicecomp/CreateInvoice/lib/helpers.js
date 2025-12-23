export const formatNumberWithCommas = (number) => {
    return number.toLocaleString();
  };
  
  export const isDataUrl = (url) => {
    return url.startsWith('data:');
  };
  