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
  
  // Convert to lowercase
  let sanitized = name.toLowerCase();
  
  // Replace spaces and underscores with hyphens
  sanitized = sanitized.replace(/[\s_]+/g, '-');
  
  // Remove any characters that aren't alphanumeric or hyphens
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  
  // Remove leading and trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'project';
  }
  
  // Add project ID if provided to ensure uniqueness
  if (projectId !== undefined) {
    // Ensure we have room for the ID by limiting the name part if needed
    const idStr = `-${projectId}`;
    const maxNameLength = 63 - idStr.length;
    
    if (sanitized.length > maxNameLength) {
      sanitized = sanitized.substring(0, maxNameLength);
    }
    
    sanitized += idStr;
  } else {
    // If no project ID, just ensure it's not too long (max 63 characters)
    if (sanitized.length > 63) {
      sanitized = sanitized.substring(0, 63);
    }
  }
  
  return sanitized;
}