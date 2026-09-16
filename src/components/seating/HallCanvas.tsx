"use client";

import { useEffect, useRef } from "react";
import { HALL_HEIGHT, HALL_WIDTH } from "@/lib/constants";

export function HallCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = HALL_WIDTH * ratio;
    canvas.height = HALL_HEIGHT * ratio;
    context.scale(ratio, ratio);
    drawHall(context);
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: HALL_WIDTH, height: HALL_HEIGHT }}
      aria-hidden
    />
  );
}

function drawHall(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, HALL_WIDTH, HALL_HEIGHT);

  const floor = ctx.createLinearGradient(0, 0, HALL_WIDTH, HALL_HEIGHT);
  floor.addColorStop(0, "#f7f1e6");
  floor.addColorStop(1, "#efe4d2");
  ctx.fillStyle = floor;
  roundRect(ctx, 24, 24, HALL_WIDTH - 48, HALL_HEIGHT - 48, 36);
  ctx.fill();

  ctx.strokeStyle = "rgba(196, 165, 116, 0.35)";
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, HALL_WIDTH - 48, HALL_HEIGHT - 48, 36);
  ctx.stroke();

  // parquet lines
  ctx.strokeStyle = "rgba(166, 139, 91, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 60; y < HALL_HEIGHT - 40; y += 28) {
    ctx.beginPath();
    ctx.moveTo(48, y);
    ctx.lineTo(HALL_WIDTH - 48, y);
    ctx.stroke();
  }

  // stage
  ctx.fillStyle = "#d9c4a0";
  roundRect(ctx, 470, 48, 460, 110, 22);
  ctx.fill();
  ctx.fillStyle = "#7a6544";
  ctx.font = "600 22px Heebo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("במה", 700, 112);

  // dance floor
  ctx.fillStyle = "rgba(196, 165, 116, 0.16)";
  ctx.beginPath();
  ctx.ellipse(700, 470, 230, 150, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a68b5b";
  ctx.font = "500 18px Heebo, sans-serif";
  ctx.fillText("רחבת ריקודים", 700, 476);

  // chuppah
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  roundRect(ctx, 70, 56, 210, 130, 18);
  ctx.fill();
  ctx.strokeStyle = "#c4a574";
  ctx.lineWidth = 2;
  roundRect(ctx, 70, 56, 210, 130, 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(90, 170);
  ctx.lineTo(90, 70);
  ctx.lineTo(260, 70);
  ctx.lineTo(260, 170);
  ctx.stroke();
  ctx.fillStyle = "#a68b5b";
  ctx.font = "600 18px Heebo, sans-serif";
  ctx.fillText("חופה", 175, 128);

  // bar
  ctx.fillStyle = "#efe0c6";
  roundRect(ctx, 1130, 70, 200, 80, 16);
  ctx.fill();
  ctx.fillStyle = "#7a6544";
  ctx.font = "500 16px Heebo, sans-serif";
  ctx.fillText("בר", 1230, 116);

  // entrance
  ctx.fillStyle = "#e5d3b4";
  roundRect(ctx, 620, 830, 160, 40, 10);
  ctx.fill();
  ctx.fillStyle = "#7a6544";
  ctx.font = "500 15px Heebo, sans-serif";
  ctx.fillText("כניסה", 700, 856);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
