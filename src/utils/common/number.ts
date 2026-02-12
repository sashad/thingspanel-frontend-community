/**
 * Get the corresponding Chinese characters based on the numbers
 *
 * @param num - number(0-10)
 */
export function getHanByNumber(num: number) {
  const HAN_STR = 'zero one two three four five six seven eight nine ten'
  return HAN_STR.charAt(num)
}

/**
 * Convert total seconds to point：Second
 *
 * @param seconds - Second
 */
export function transformToTimeCountDown(seconds: number) {
  const SECONDS_A_MINUTE = 60
  function fillZero(num: number) {
    return num.toString().padStart(2, '0')
  }
  const minuteNum = Math.floor(seconds / SECONDS_A_MINUTE)
  const minute = fillZero(minuteNum)
  const second = fillZero(seconds - minuteNum * SECONDS_A_MINUTE)
  return `${minute}: ${second}`
}

/**
 * Get a random integer within a specified range of integers
 *
 * @param start - start range
 * @param end - end range
 */
export function getRandomInteger(end: number, start = 0) {
  const range = end - start
  const random = Math.floor(Math.random() * range + start)
  return random
}
