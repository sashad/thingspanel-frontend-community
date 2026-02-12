/**
 * Latitude and longitude coordinate verification tool
 * Used to verify the validity of geographic coordinates
 */

/**
 * Verify whether the latitude and longitude is within the valid range
 * @param lat latitude (-90 arrive 90)
 * @param lng longitude (-180 arrive 180)
 * @returns Is it a valid coordinate?
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180 &&
    lat !== 0 && 
    lng !== 0
  )
}

/**
 * Validate latitude and longitude as a string
 * @param latStr latitude string
 * @param lngStr longitude string
 * @returns Is it a valid coordinate?
 */
export function isValidCoordinateString(latStr: string | number, lngStr: string | number): boolean {
  const lat = Number(latStr)
  const lng = Number(lngStr)
  return isValidCoordinate(lat, lng)
}

/**
 * Get coordinate verification error information
 * @param lat latitude
 * @param lng longitude
 * @returns error message，Return if validnull
 */
export function getCoordinateValidationError(lat: number, lng: number): string | null {

  if (isNaN(lat) || isNaN(lng)) {
    return 'Latitude and longitude must be valid numbers'
  }
  
  if (lat < -90 || lat > 90) {
    return 'Latitude must be within-90arrive90between degrees'
  }
  
  if (lng < -180 || lng > 180) {
    return 'longitude must be in-180arrive180between degrees'
  }
  
  if (lat === 0 && lng === 0) {
    return 'Longitude and latitude cannot be both0'
  }
  
  return null
}

/**
 * Get string coordinate verification error information
 * @param latStr latitude string
 * @param lngStr longitude string
 * @returns error message，Return if validnull
 */
export function getCoordinateStringValidationError(latStr: string | number, lngStr: string | number): string | null {
  const lat = Number(latStr)
  const lng = Number(lngStr)
  return getCoordinateValidationError(lat, lng)
}
