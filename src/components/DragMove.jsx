// https://javascript.plainenglish.io/how-to-make-a-simple-custom-drag-to-move-component-in-react-f67d5c99f925

import React, { useEffect, useState, useRef } from 'react';

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
  const isDraggingRef = useRef(false);
  useEffect(() => { isDraggingRef.current = isDragging }, [isDragging]);


  const handlePointerDown = (e) => {
    setIsDragging(true);

    onPointerDown(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);

    onPointerUp(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current) onDragMove(e);
    onPointerMove(e);
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('mousemove', handlePointerMove);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
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
        onPointerDown={handlePointerDown}>
        {grabber}
      </div>
      {children}
    </div>
  );
}
