import React from 'react';

/**
 * Ensures that manual text selection is copied as plain text, stripping styles/HTML.
 */
export const handleManualCopy = (e: React.ClipboardEvent) => {
    const selection = window.getSelection();
    if (selection) {
        e.preventDefault();
        e.clipboardData.setData('text/plain', selection.toString());
    }
};

/**
 * Ensures that pasted content is treated as plain text only.
 */
export const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
};
