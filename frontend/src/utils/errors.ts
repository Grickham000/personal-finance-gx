/**
 * Safely extracts a clean string error message from an API response, Axios error, or generic Error object.
 * Handles FastAPI validation error objects, standard error strings, and JSON objects.
 */
export const extractErrorMessage = (err: any): string => {
  if (!err) return 'An unknown error occurred.';
  
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'object') {
      if (data.detail) {
        if (typeof data.detail === 'string') {
          return data.detail;
        }
        if (Array.isArray(data.detail)) {
          // FastAPI/Pydantic validation errors
          return data.detail
            .map((item: any) => {
              if (typeof item === 'string') return item;
              // Extract field name from location list if available
              const field = item.loc ? item.loc.filter((part: any) => part !== 'body').join('.') : '';
              const msg = item.msg || JSON.stringify(item);
              return field ? `${field}: ${msg}` : msg;
            })
            .join('\n');
        }
        return JSON.stringify(data.detail);
      }
      return JSON.stringify(data);
    }
    if (typeof data === 'string') {
      return data;
    }
  }
  
  return err.message || String(err);
};
