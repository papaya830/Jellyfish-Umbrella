// client/src/components/ControlPanel.js
import React from 'react';
import ColorPicker from './ColorPicker';

export default function ControlPanel({ setActiveColor }) {
  // Called by ColorPicker after a successful send so App.js stays in sync
  const handleColorSent = ({ r, g, b }) => {
    if (setActiveColor) setActiveColor({ r, g, b });
  };

  return <ColorPicker onColorSent={handleColorSent} />;
}