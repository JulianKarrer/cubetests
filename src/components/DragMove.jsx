// https://javascript.plainenglish.io/how-to-make-a-simple-custom-drag-to-move-component-in-react-f67d5c99f925

import React, { useEffect, useState } from 'react';

export default function DragMove({
  onPointerDown = () => { },
  onPointerUp = () => { },
  onPointerMove = () => { },
  onDragMove = () => { },
  style,
  className,
  children,
  grabber,
}) {

  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e) => {
    setIsDragging(true);

    onPointerDown(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);

    onPointerUp(e);
  };

  const handlePointerMove = (e) => {
    if (isDragging) onDragMove(e);

    onPointerMove(e);
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    }
  }, []);

  return (
    <div
      style={{
        userSelect: "none", cursor: "pointer",
        cursor: isDragging ? "grabbing" : "grab",
        ...style
      }}
      className={className}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}>
        {grabber}
      </div>
      {children}
    </div>
  );
}
