export const formatPhoneNumber = (phone: string | undefined | null): string | undefined => {
    if (!phone) return undefined;

    const digits = phone.replace(/[^0-9+]/g, '');

    if (!digits) return undefined;

    let trimmed = digits.replace(/^0+/, '');

    if (trimmed.startsWith('+')) {
        return trimmed;
    }
    if (trimmed.startsWith('91') && trimmed.length > 10) {
        return `+${trimmed}`;
    }
    if (trimmed.length === 10) {
        return `+91${trimmed}`;
    }
    return `+${trimmed}`;
};
