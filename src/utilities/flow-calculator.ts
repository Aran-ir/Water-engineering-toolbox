/**
 * The function of calculating the flow rate in the pipe filled with Gonia method
 * @param diameterPipe The diameter of the bilge pipe in inches
 * @param jumpLength The length of the water jump in centimeters
 * @returns Water flow in liters per second
 */
export function fillPipeGunyaMethod(diameterPipe: number, jumpLength: number): number {
  return 0.02 * jumpLength * diameterPipe ** 2;
}

/* The function of calculating the flow rate in the pipe filled with Gonia method */
