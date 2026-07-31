import crypto from "crypto";

export function generateReferenceNumber(
    prefix: string
): string {

    const date = new Date();

    const yyyy = date.getFullYear();

    const mm = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const dd = String(
        date.getDate()
    ).padStart(2, "0");

    const random =
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

    return `${prefix}${yyyy}${mm}${dd}${random}`;
}