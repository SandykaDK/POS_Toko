import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Fade from '@mui/material/Fade';

export function AlertPopup({ message, onClose }) {
    const [open, setOpen] = useState(Boolean(message?.text));

    useEffect(() => {
        if (!message?.text) {
            setOpen(false);
            return undefined;
        }

        setOpen(true);
        const timer = window.setTimeout(() => setOpen(false), 5000);
        return () => window.clearTimeout(timer);
    }, [message]);

    const handleClose = () => setOpen(false);

    return React.createElement(
        Fade,
        {
            in: open,
            timeout: { enter: 300, exit: 250 },
            onExited: onClose,
        },
        React.createElement(
            'div',
            { className: 'alert-popup', role: 'presentation' },
            React.createElement(
                Alert,
                {
                    severity: message?.type === 'error' ? 'error' : 'success',
                    variant: 'standard',
                    onClose: handleClose,
                    sx: { width: '100%', alignItems: 'flex-start' },
                },
                React.createElement(AlertTitle, null, message?.type === 'error' ? 'Error' : 'Success'),
                message?.text,
            ),
        ),
    );
}
