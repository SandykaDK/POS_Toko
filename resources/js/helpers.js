export const money = (value = 0) =>
    Number(value || 0).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const truncate = (text, length = 50) => {
    if (text.length > length) {
        return text.substring(0, length) + '...';
    }
    return text;
};
