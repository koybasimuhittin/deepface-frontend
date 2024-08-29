import React, { useEffect, useRef } from 'react';
import { FaceLandmarks68 } from 'face-api.js';


interface FaceLandmarksCanvasProps {
  landmarks: FaceLandmarks68 | null; // 'landmarks' can be null if not yet available
  image: HTMLCanvasElement | null
}

const FaceLandmarksCanvas: React.FC<FaceLandmarksCanvasProps> = ({ landmarks, image }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (landmarks) {
      //console.log(landmarks)
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');

        if (ctx) {
          
          // Set canvas dimensions if needed
          canvas.width = 480;
          canvas.height = 360;

          // Clear the canvas before drawing
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if(image == null){
            return
          }
          ctx.drawImage(image, 0, 0)

          // Set stroke style
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;

          // Draw circles at each key point
          let xs = 0;
          let ys = 0;
          for(let i = 0; i < 60; i++){
            const { x, y } = landmarks.positions[i];
            xs += x;
            ys += y;
          }

          ctx.beginPath();
          ctx.arc(xs / 60, ys / 60, 1, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }
  }, [landmarks]);

  return <canvas ref={canvasRef} />;
};

export default FaceLandmarksCanvas;
