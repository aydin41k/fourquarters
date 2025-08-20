"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTelegramSDK } from "@/app/hooks/useTelegramSDK";
import { createMapGeometry, isPointOnStreet, getEntranceForBuilding, moveAlongStreet, pointOnPath, projectPointOntoPath } from "@/app/lib/game/map";

type BuildingId = "arena" | "shop" | "cafe";

interface MapSceneProps {
	onEnterBuilding: (id: BuildingId) => void;
	respawnAt?: { building: BuildingId } | null;
}

export default function MapScene({ onEnterBuilding, respawnAt }: MapSceneProps) {
	const { theme } = useTelegramSDK();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	
	// Fixed map size - won't stretch or narrow
	const FIXED_MAP_WIDTH = 1920;
	const FIXED_MAP_HEIGHT = 1080;
	
	const [geom, setGeom] = useState(() => createMapGeometry({ width: FIXED_MAP_WIDTH, height: FIXED_MAP_HEIGHT }));
	const [sParam, setSParam] = useState(() => geom.street.metrics.totalLength * 0.5);
	const [targetS, setTargetS] = useState<number | null>(null);
	const [queuedEnter, setQueuedEnter] = useState<BuildingId | null>(null);
	const lastTs = useRef<number>(0);
	const bob = useRef<number>(0);
	const speed = 380; // px/sec walking speed
	const [icons, setIcons] = useState<{[k in BuildingId]: HTMLImageElement | null}>({ arena: null, cafe: null, shop: null });
	
	// Panning state
	const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
	const isPanning = useRef(false);
	const lastPanPoint = useRef({ x: 0, y: 0 });

	// Convert SVG files to data URLs and preload
	useEffect(() => {
		const loadIcon = async (id: BuildingId, svgPath: string) => {
			try {
				const response = await fetch(svgPath);
				const svgText = await response.text();
				const dataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;
				const img = new Image();
				img.onload = () => setIcons(prev => ({ ...prev, [id]: img }));
				img.onerror = () => console.warn(`Failed to load ${id} icon`);
				img.src = dataUrl;
			} catch (err) {
				console.warn(`Failed to fetch ${id} SVG:`, err);
			}
		};



		loadIcon('arena', '/assets/arena-svgrepo-com.svg');
		loadIcon('shop', '/assets/shopping-card-svgrepo-com.svg');
		loadIcon('cafe', '/assets/cafe-svgrepo-com.svg');
	}, []);

	// Set fixed canvas size and initialize geometry
	useEffect(() => {
		const cvs = canvasRef.current;
		if (!cvs) return;
		
		// Set fixed canvas size
		cvs.width = FIXED_MAP_WIDTH;
		cvs.height = FIXED_MAP_HEIGHT;
		
		// Initialize geometry with fixed size
		const g = createMapGeometry({ width: FIXED_MAP_WIDTH, height: FIXED_MAP_HEIGHT });
		setGeom(g);
		
		if (respawnAt) {
			const e = getEntranceForBuilding(respawnAt.building, g);
			if (e) {
				const s = projectPointOntoPath(e.x, e.y, g.street.metrics);
				setSParam(s);
			}
		} else {
			setSParam(g.street.metrics.totalLength * 0.5);
		}
	}, [respawnAt]);

	// Input handling for panning and building interaction
	useEffect(() => {
		const cvs = canvasRef.current;
		if (!cvs) return;
		
		// Convert screen coordinates to map coordinates
		const screenToMap = (clientX: number, clientY: number) => {
			const rect = cvs.getBoundingClientRect();
			return {
				x: clientX - rect.left - panOffset.x,
				y: clientY - rect.top - panOffset.y
			};
		};
		
		// Handle building clicks and street movement
		const handleClick = (clientX: number, clientY: number) => {
			const mapPos = screenToMap(clientX, clientY);
			
			// Check building hits first
			const hit = geom.buildings.find(b => 
				mapPos.x >= b.x && mapPos.x <= b.x + b.w && 
				mapPos.y >= b.y && mapPos.y <= b.y + b.h
			);
			
			if (hit) {
				const s = projectPointOntoPath(hit.entrance.x, hit.entrance.y, geom.street.metrics);
				setTargetS(s);
				setQueuedEnter(hit.id as BuildingId);
				return;
			}
			
			// Check street movement
			if (isPointOnStreet(mapPos.x, mapPos.y, geom)) {
				const s = projectPointOntoPath(mapPos.x, mapPos.y, geom.street.metrics);
				setQueuedEnter(null);
				setTargetS(s);
			}
		};
		
		// Panning handlers
		const startPan = (clientX: number, clientY: number) => {
			isPanning.current = true;
			lastPanPoint.current = { x: clientX, y: clientY };
		};
		
		const updatePan = (clientX: number, clientY: number) => {
			if (!isPanning.current) return;
			
			const deltaX = clientX - lastPanPoint.current.x;
			const deltaY = clientY - lastPanPoint.current.y;
			
			setPanOffset(prev => ({
				x: prev.x + deltaX,
				y: prev.y + deltaY
			}));
			
			lastPanPoint.current = { x: clientX, y: clientY };
		};
		
		const endPan = () => {
			isPanning.current = false;
		};
		
		// Mouse events
		const onMouseDown = (e: MouseEvent) => {
			if (e.button === 0) { // Left click only
				startPan(e.clientX, e.clientY);
			}
		};
		
		const onMouseMove = (e: MouseEvent) => {
			if (isPanning.current) {
				updatePan(e.clientX, e.clientY);
			}
		};
		
		const onMouseUp = (e: MouseEvent) => {
			if (e.button === 0 && isPanning.current) {
				// If we didn't move much, treat as a click
				const deltaX = e.clientX - lastPanPoint.current.x;
				const deltaY = e.clientY - lastPanPoint.current.y;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
				
				if (distance < 5) { // Small movement threshold
					handleClick(e.clientX, e.clientY);
				}
				endPan();
			}
		};
		
		// Touch events
		const onTouchStart = (e: TouchEvent) => {
			const touch = e.changedTouches[0];
			startPan(touch.clientX, touch.clientY);
		};
		
		const onTouchMove = (e: TouchEvent) => {
			const touch = e.changedTouches[0];
			updatePan(touch.clientX, touch.clientY);
		};
		
		const onTouchEnd = (e: TouchEvent) => {
			const touch = e.changedTouches[0];
			// If we didn't move much, treat as a tap
			const deltaX = touch.clientX - lastPanPoint.current.x;
			const deltaY = touch.clientY - lastPanPoint.current.y;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			
			if (distance < 10) { // Touch threshold
				handleClick(touch.clientX, touch.clientY);
			}
			endPan();
		};
		
		// Add event listeners
		cvs.addEventListener('mousedown', onMouseDown);
		cvs.addEventListener('mousemove', onMouseMove);
		cvs.addEventListener('mouseup', onMouseUp);
		cvs.addEventListener('touchstart', onTouchStart, { passive: false });
		cvs.addEventListener('touchmove', onTouchMove, { passive: false });
		cvs.addEventListener('touchend', onTouchEnd, { passive: true });
		
		return () => {
			cvs.removeEventListener('mousedown', onMouseDown);
			cvs.removeEventListener('mousemove', onMouseMove);
			cvs.removeEventListener('mouseup', onMouseUp);
			cvs.removeEventListener('touchstart', onTouchStart);
			cvs.removeEventListener('touchmove', onTouchMove);
			cvs.removeEventListener('touchend', onTouchEnd);
		};
	}, [geom, panOffset]);

	// Movement + render loop
	useEffect(() => {
		const cvs = canvasRef.current; const ctx = cvs?.getContext('2d');
		if (!cvs || !ctx) return;
		let raf = 0;
		const tick = (ts: number) => {
			const dt = lastTs.current ? ts - lastTs.current : 16; lastTs.current = ts;
			if (targetS != null && sParam !== targetS) {
				const moved = moveAlongStreet(sParam, targetS, speed, dt);
				setSParam(moved.s);
				bob.current += dt * 0.02;
				if (moved.reached) {
					setTargetS(null);
					if (queuedEnter) { const id = queuedEnter; setQueuedEnter(null); requestAnimationFrame(() => onEnterBuilding(id)); }
				}
			}
			draw(ctx);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [geom, sParam, targetS, queuedEnter, onEnterBuilding]);

	const draw = (ctx: CanvasRenderingContext2D) => {
		const dark = theme === 'dark';
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// Apply panning transformation
		ctx.save();
		ctx.translate(panOffset.x, panOffset.y);
		
		// Background
		const gbg = ctx.createRadialGradient(ctx.canvas.width*0.5, ctx.canvas.height*0.3, 50, ctx.canvas.width*0.5, ctx.canvas.height*0.3, Math.max(ctx.canvas.width, ctx.canvas.height));
		gbg.addColorStop(0, dark ? '#0b0b0b' : '#fafafa');
		gbg.addColorStop(1, dark ? '#050505' : '#eef2f7');
		ctx.fillStyle = gbg; ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

		// // Decorative terrain patches
		// ctx.fillStyle = dark ? '#0a2515' : '#dff7e6';
		// roundedRect(ctx, 24, 24, 160, 100, 18); ctx.fill();
		// roundedRect(ctx, ctx.canvas.width-220, 40, 180, 120, 22); ctx.fill();

		// // River
		// ctx.save();
		// ctx.globalAlpha = 0.9;
		// ctx.strokeStyle = dark ? '#7dd3fc' : '#38bdf8';
		// ctx.lineWidth = 26;
		// ctx.lineCap = 'round';
		// drawPath(ctx, geom.street.path.map(p => ({x:p.x, y:p.y-90})));
		// ctx.stroke();
		// ctx.restore();

		// Street band (curved)
		const s = geom.street; 
		ctx.lineWidth = s.thickness; ctx.lineCap = 'round';
		
		// Use gradient for street appearance
		const grd = ctx.createLinearGradient(0, s.top, 0, s.bottom);
		grd.addColorStop(0, dark ? '#3a3a3a' : '#d1d5db');
		grd.addColorStop(1, dark ? '#1f1f1f' : '#bfc4cc');
		ctx.strokeStyle = grd;
		
		drawPath(ctx, s.path);
		ctx.stroke();

		// Buildings
		for (const b of geom.buildings) {
			// Card
			ctx.fillStyle = dark ? '#0d1321' : '#ffffff';
			ctx.strokeStyle = dark ? '#1f2937' : '#e5e7eb';
			ctx.lineWidth = 2;
			roundedRect(ctx, b.x, b.y, b.w, b.h, 18);
			ctx.fill(); ctx.stroke();
			// Icon
			const img = icons?.[b.id as BuildingId];
			if (img && img.complete && img.naturalWidth > 0) {
				const iw = Math.min(b.w*0.5, 120);
				const ih = iw;
				ctx.drawImage(img, b.x + b.w/2 - iw/2, b.y + b.h/2 - ih/2, iw, ih);
			} else {
				// Fallback text label if icon not loaded
				ctx.fillStyle = dark ? '#e5e7eb' : '#111827';
				ctx.font = `${Math.max(16, Math.round(b.h*0.18))}px system-ui, sans-serif`;
				ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				ctx.fillText(b.id==='arena'?'Arena':b.id==='shop'?'Shop':'Café', b.x+b.w/2, b.y+b.h/2);
			}
			// Entrance glow
			ctx.save();
			ctx.fillStyle = dark ? '#10b981' : '#059669';
			ctx.beginPath(); ctx.arc(b.entrance.x, b.entrance.y, Math.max(4, Math.round(b.h*0.035)), 0, Math.PI*2); ctx.fill();
			ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(b.entrance.x, b.entrance.y, 16, 0, Math.PI*2); ctx.fill();
			ctx.restore();
		}

		// Player silhouette
		const P = pointOnPath(geom.street.metrics, sParam);
		ctx.save();
		ctx.translate(P.x, P.y + Math.sin(bob.current)*2.2);
		ctx.scale(1,1.08);
		ctx.fillStyle = 'rgba(0,0,0,0.7)';
		ctx.beginPath(); ctx.ellipse(0, -26, 10, 18, 0, 0, Math.PI*2); ctx.fill();
		ctx.beginPath(); ctx.moveTo(0,-8); ctx.quadraticCurveTo(10,4,6,20); ctx.quadraticCurveTo(0,26,-6,20); ctx.quadraticCurveTo(-10,4,0,-8); ctx.fill();
		ctx.globalAlpha=0.5; ctx.fillStyle = dark ? '#0b0b0b' : '#a3a3a3'; ctx.beginPath(); ctx.ellipse(0,8,14,5,0,0,Math.PI*2); ctx.fill();
		ctx.restore();
		
		// Restore panning transformation
		ctx.restore();
	};

	return (
		<div className="w-full h-[100svh] overflow-hidden relative">
			<canvas 
				ref={canvasRef} 
				className="block"
				style={{
					width: `${FIXED_MAP_WIDTH}px`,
					height: `${FIXED_MAP_HEIGHT}px`,
					maxWidth: 'none',
					maxHeight: 'none'
				}}
			/>
		</div>
	);
}

function drawPath(ctx: CanvasRenderingContext2D, pts: {x:number;y:number}[]) {
	ctx.beginPath();
	for (let i=0;i<pts.length;i++) {
		const p = pts[i];
		if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
	}
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x+r, y);
	ctx.lineTo(x+w-r, y);
	ctx.quadraticCurveTo(x+w, y, x+w, y+r);
	ctx.lineTo(x+w, y+h-r);
	ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
	ctx.lineTo(x+r, y+h);
	ctx.quadraticCurveTo(x, y+h, x, y+h-r);
	ctx.lineTo(x, y+r);
	ctx.quadraticCurveTo(x, y, x+r, y);
}


