/**
 * Global flag to prevent biometric lock when file picker is open
 * On mobile, opening the file picker backgrounds the app briefly,
 * which can trigger the app lock screen. This flag prevents that.
 */

// Global state to track file picker activity
let filePickerActive = false;
let filePickerTimeout: ReturnType<typeof setTimeout> | null = null;

export const setFilePickerActive = (active: boolean) => {
  // Clear any existing timeout
  if (filePickerTimeout) {
    clearTimeout(filePickerTimeout);
    filePickerTimeout = null;
  }

  if (active) {
    filePickerActive = true;
    // Auto-reset after 60 seconds as a safety net
    filePickerTimeout = setTimeout(() => {
      filePickerActive = false;
    }, 60000);
  } else {
    // Delay resetting to allow the app to fully return
    filePickerTimeout = setTimeout(() => {
      filePickerActive = false;
    }, 1500);
  }
};

export const isFilePickerActive = (): boolean => {
  return filePickerActive;
};
