/**
 * CRC16-CCITT (polynomial 0x1021, initial 0xFFFF)
 * Conforming to EMVCo / Bakong KHQR specifications
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte << 8);

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function verifyCRC16(payload: string): boolean {
  if (payload.length < 8) return false;
  const tag63Index = payload.lastIndexOf('6304');
  if (tag63Index === -1) return false;

  const dataWithoutChecksum = payload.substring(0, tag63Index + 4);
  const expectedCrc = payload.substring(tag63Index + 4, tag63Index + 8).toUpperCase();
  const calculatedCrc = calculateCRC16(dataWithoutChecksum);

  return expectedCrc === calculatedCrc;
}
