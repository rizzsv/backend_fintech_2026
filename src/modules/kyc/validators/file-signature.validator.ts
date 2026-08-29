export type SupportedFileType =
    | "jpeg"
    | "png"
    | "pdf";


export function detectFileType(
    buffer: Buffer
): SupportedFileType | null {

    /**
     * JPEG
     *
     * FF D8 FF
     */
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return "jpeg";
    }


    /**
     * PNG
     *
     * 89 50 4E 47 0D 0A 1A 0A
     */
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return "png";
    }


    /**
     * PDF
     *
     * %PDF
     */
    if (
        buffer.length >= 4 &&
        buffer.toString(
            "ascii",
            0,
            4
        ) === "%PDF"
    ) {
        return "pdf";
    }


    return null;
}