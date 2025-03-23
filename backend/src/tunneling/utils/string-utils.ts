/**
 * Utility functions for string manipulation in the tunneling service
 */

/**
 * Sanitizes a project name for use in a subdomain
 * Removes special characters, converts spaces to hyphens, and makes lowercase
 * @param name The project name to sanitize
 * @param projectId Optional project ID to ensure uniqueness
 * @returns A DNS-compatible subdomain name
 */
export function sanitizeForSubdomain(name: string, projectId?: number): string {
  if (!name) return '';

  let sanitized = name.toLowerCase();
  sanitized = sanitized.replace(/[\s_]+/g, '-');
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  sanitized = sanitized.replace(/^-+|-+$/g, '');

  if (!sanitized) {
    sanitized = 'project';
  }

  if (projectId !== undefined) {
    const idStr = `-${projectId}`;
    const maxNameLength = 63 - idStr.length;

    if (sanitized.length > maxNameLength) {
      sanitized = sanitized.substring(0, maxNameLength);
    }

    sanitized += idStr;
  } else {
    if (sanitized.length > 63) {
      sanitized = sanitized.substring(0, 63);
    }
  }

  return sanitized;
}