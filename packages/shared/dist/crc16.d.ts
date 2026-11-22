/**
 * CRC16-CCITT (polynomial 0x1021, initial 0xFFFF)
 * Conforming to EMVCo / Bakong KHQR specifications
 */
export declare function calculateCRC16(data: string): string;
export declare function verifyCRC16(payload: string): boolean;
//# sourceMappingURL=crc16.d.ts.map