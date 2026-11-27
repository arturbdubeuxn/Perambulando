export const MOBILE_BREAKPOINT = 600;
export const DESKTOP_SHELL_MAX_WIDTH = 760;
export const DESKTOP_GUTTER = 48;

export function responsiveShellWidth(viewportWidth: number, maximum = DESKTOP_SHELL_MAX_WIDTH) {
  const safeWidth = Math.max(0, viewportWidth);
  if (safeWidth <= MOBILE_BREAKPOINT) {
    return safeWidth;
  }
  return Math.min(safeWidth - DESKTOP_GUTTER, maximum);
}
